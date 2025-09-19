import React, { useState } from "react";
import {
  CreditCard,
  Check,
} from "lucide-react";
import { useStripe } from "@stripe/react-stripe-js";

const AreasReservaSystem: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [userInfo, setUserInfo] = useState({
    name: "",
    apartment: "",
    phone: "",
    email: "",
  });
  const [step, setStep] = useState(1);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);

  const stripe = useStripe();

  const areas = [
    { id: 1, name: "Cancha de Futbol", price: 150, status: "disponible", image: "🏈" },
    { id: 2, name: "Piscina", price: 100, status: "disponible", image: "🏊‍♂️" },
    { id: 3, name: "Salón de Eventos", price: 200, status: "mantenimiento", image: "🎉" },
  ];

  const handleAreaSelect = (area: any) => {
    if (area.status !== "disponible") return;
    setSelectedArea(area);
    setStep(2);
  };

  const handleDateTimeSubmit = () => {
    if (selectedDate && selectedTime) {
      setStep(3);
    }
  };

  const handleUserInfoSubmit = () => {
    if (userInfo.name && userInfo.apartment && userInfo.email) {
      setStep(4);
    }
  };

  // 🔹 Redirigir a Stripe Checkout
  const handlePayment = async () => {
    if (!stripe) return;
    setPaymentProcessing(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/payments/create-checkout-session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedArea.price,
          currency: "usd", // stripe no soporta BOB directamente
          name: userInfo.name,
          email: userInfo.email,
        }),
      });

      const data = await res.json();

      if (data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          console.error("Stripe redirect error:", error);
          alert("Error al redirigir a Stripe");
        }
      } else {
        alert("Error creando sesión de pago");
      }
    } catch (err) {
      console.error(err);
      alert("Error procesando el pago");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // ✅ Paso 5: Confirmación
  if (reservationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">¡Reserva Confirmada!</h2>
          <p>Área: {selectedArea?.name}</p>
          <p>Fecha: {selectedDate}</p>
          <p>Hora: {selectedTime}</p>
          <p>Total: ${selectedArea?.price} USD</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Paso 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="p-6 rounded-xl shadow-lg cursor-pointer border bg-white"
                  onClick={() => handleAreaSelect(area)}
                >
                  <div className="text-4xl mb-4">{area.image}</div>
                  <h3 className="text-lg font-bold">{area.name}</h3>
                  <p className="text-sm text-gray-600">Precio: ${area.price} USD</p>
                </div>
              ))}
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Selecciona fecha y hora</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <button
                onClick={handleDateTimeSubmit}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Paso 3 */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tus datos</h2>
              <input
                type="text"
                placeholder="Nombre"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="border p-2 rounded w-full mb-3"
              />
              <input
                type="text"
                placeholder="Apartamento"
                value={userInfo.apartment}
                onChange={(e) => setUserInfo({ ...userInfo, apartment: e.target.value })}
                className="border p-2 rounded w-full mb-3"
              />
              <input
                type="email"
                placeholder="Email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                className="border p-2 rounded w-full mb-3"
              />
              <button
                onClick={handleUserInfoSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Paso 4 */}
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Resumen y Pago</h2>
              <p>Área: {selectedArea?.name}</p>
              <p>Fecha: {selectedDate}</p>
              <p>Hora: {selectedTime}</p>
              <p>Total: ${selectedArea?.price} USD</p>

              <button
                onClick={handlePayment}
                disabled={paymentProcessing}
                className="mt-6 bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700"
              >
                {paymentProcessing ? "Redirigiendo..." : `Pagar con Stripe`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreasReservaSystem;

import React, { useEffect, useMemo, useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Check, Clock, Calendar, MapPin, CreditCard } from "lucide-react";
import { crearReserva, listarAreas } from "../api/commons";
import { crearCheckoutSession } from "../api/payments";

type Area = {
  id: number;
  nombre: string;
  estado: "DISPONIBLE" | "MANTENIMIENTO" | "CERRADO";
  precio?: number; // si luego lo guardas en DB
};

function addOneHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setHours(d.getHours() + 1);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const AreasReservaSystem: React.FC = () => {
  const stripe = useStripe();

  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  const [nombre, setNombre] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [email, setEmail] = useState("");

  const [pagando, setPagando] = useState(false);

  useEffect(() => {
  (async () => {
    try {
      const data = await listarAreas(); // CommonArea[]
      const mapped: Area[] = data.map(a => ({
        id: a.id,
        nombre: a.nombre,
        estado: a.estado,
        precio: a.precio ? Number(a.precio) : undefined, // ← string → number
      }));
      setAreas(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAreas(false);
    }
  })();
}, []);

  const selectedArea = useMemo(
    () => areas.find(a => a.id === selectedAreaId) || null,
    [areas, selectedAreaId]
  );

  // Mensaje “success/canceled”
  const success = new URLSearchParams(window.location.search).get("success") === "true";
  const canceled = new URLSearchParams(window.location.search).get("canceled") === "true";

  const continuarFechaHora = () => {
    if (!fecha || !horaInicio) return;
    setHoraFin(prev => prev || addOneHour(horaInicio));
    setStep(3);
  };

  const continuarDatos = () => {
    if (!nombre || !departamento || !email) return;
    setStep(4);
  };

  const pagar = async () => {
    if (!stripe || !selectedArea) return;
    setPagando(true);
    try {
      // 1) Crear la reserva
      const reserva = await crearReserva({
        area: selectedArea.id,
        fecha_reserva: fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin || addOneHour(horaInicio),
      });

      // 2) Monto (si aún no tienes precio en DB, usa un map por ID)


      // 3) Crear sesión de Checkout
      const session = await crearCheckoutSession({
  reservation_id: reserva.id,
});


      // 4) Redirigir
      const { error } = await stripe.redirectToCheckout({ sessionId: session.sessionId });
      if (error) alert(error.message || "Error al redirigir a Stripe");
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Error";
      alert(msg);
    } finally {
      setPagando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Reservar áreas comunes</h1>

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
            <Check className="text-green-600 w-5 h-5" />
            <span>¡Pago realizado! Tu reserva está aprobada y figura como <b>Pagada</b>.</span>
          </div>
        )}
        {canceled && (
          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            El pago fue cancelado. Podés intentarlo nuevamente desde “Mis Reservas”.
          </div>
        )}

        {/* Paso 1: elegir área */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingAreas ? (
              <div>Cargando áreas…</div>
            ) : (
              areas.map(area => (
                <button
                  key={area.id}
                  onClick={() => {
                    if (area.estado !== "DISPONIBLE") return;
                    setSelectedAreaId(area.id);
                    setStep(2);
                  }}
                  disabled={area.estado !== "DISPONIBLE"}
                  className={`p-5 rounded-xl shadow bg-white border text-left hover:shadow-md transition
                    ${area.estado !== "DISPONIBLE" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="text-4xl mb-3">🏢</div>
                  <div className="font-semibold">{area.nombre}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <CreditCard className="w-4 h-4" /> ${area.precio ?? 100} USD
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wide">
                    {area.estado === "DISPONIBLE" ? "Disponible" : area.estado}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Paso 2: fecha y horario */}
        {step === 2 && selectedArea && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="text-lg font-semibold mb-1">Elegí fecha y horario</div>

            <label className="block">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Fecha
              </span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                     className="border p-2 rounded w-full" />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Hora de inicio
                </span>
                <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}
                       className="border p-2 rounded w-full" />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Hora de fin
                </span>
                <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)}
                       className="border p-2 rounded w-full" />
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded border">Volver</button>
              <button onClick={continuarFechaHora} className="px-4 py-2 rounded bg-blue-600 text-white">Continuar</button>
            </div>
          </div>
        )}

        {/* Paso 3: datos del residente */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <div className="text-lg font-semibold mb-1">Tus datos</div>

            <label className="block">
              <span className="text-sm text-gray-600">Nombre</span>
              <input className="border p-2 rounded w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Departamento</span>
              <input className="border p-2 rounded w-full" value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Email</span>
              <input type="email" className="border p-2 rounded w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded border">Volver</button>
              <button onClick={continuarDatos} className="px-4 py-2 rounded bg-blue-600 text-white">Continuar</button>
            </div>
          </div>
        )}

        {/* Paso 4: resumen y pagar */}
        {step === 4 && selectedArea && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="text-lg font-semibold">Resumen</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded border p-3">
                <div className="font-medium mb-1">{selectedArea.nombre}</div>
                <div className="text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Área común del condominio
                </div>
                <div className="mt-2">Fecha: {fecha}</div>
                <div>Horario: {horaInicio} — {horaFin || addOneHour(horaInicio)}</div>
              </div>
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Total</div>
                <div className="text-3xl font-bold">${selectedArea.precio ?? 100} <span className="text-base">USD</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-4 py-2 rounded border">Volver</button>
              <button
                onClick={pagar}
                disabled={pagando}
                className="px-6 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {pagando ? "Procesando..." : "Pagar con Stripe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AreasReservaSystem;

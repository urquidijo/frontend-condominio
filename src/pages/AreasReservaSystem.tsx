import React, { useEffect, useMemo, useState, type JSX } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import {
  Check,
  MapPin,
  CreditCard,
  Building2,
  Droplets,
  Volleyball,
  PartyPopper,
  Dumbbell,
  Info,
} from "lucide-react";
import { crearReserva, listarAreas } from "../api/commons";
import { crearCheckoutSession } from "../api/payments";

type AreaVM = {
  id: number;
  nombre: string;
  estado: "DISPONIBLE" | "MANTENIMIENTO" | "CERRADO";
  precio: number;
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

const iconMap: Record<string, JSX.Element> = {
  Piscina: <Droplets className="w-12 h-12 text-sky-600" />,
  "Cancha de tenis": <Volleyball className="w-12 h-12 text-green-600" />,
  cancha: <Volleyball className="w-12 h-12 text-emerald-600" />,
  Gimnasio: <Dumbbell className="w-12 h-12 text-gray-700" />,
  "Salón de eventos": <PartyPopper className="w-12 h-12 text-pink-600" />,
};

const getIcon = (nombre: string) =>
  iconMap[nombre] || <Building2 className="w-12 h-12 text-indigo-500" />;

const AreasReservaSystem: React.FC = () => {
  const stripe = useStripe();

  const [areas, setAreas] = useState<AreaVM[]>([]);
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
        const data: any[] = await listarAreas();
        const vm: AreaVM[] = (data || []).map((a) => ({
          id: a.id,
          nombre: a.nombre,
          estado: a.estado,
          precio: Number(a.precio ?? 0),
        }));
        setAreas(vm);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAreas(false);
      }
    })();
  }, []);

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedAreaId) || null,
    [areas, selectedAreaId]
  );

  const success =
    new URLSearchParams(window.location.search).get("success") === "true";
  const canceled =
    new URLSearchParams(window.location.search).get("canceled") === "true";

  const continuarFechaHora = () => {
    if (!fecha || !horaInicio) return;
    setHoraFin((prev) => prev || addOneHour(horaInicio));
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
      const reserva = await crearReserva({
        area: selectedArea.id,
        fecha_reserva: fecha, // input type=date ya da YYYY-MM-DD
        hora_inicio: `${horaInicio}:00`, // asegurar HH:mm:ss
        hora_fin: `${horaFin || addOneHour(horaInicio)}:00`,
      });

      const session = await crearCheckoutSession({
        reservation_id: reserva.id,
      });
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });
      if (error) alert(error.message || "Error al redirigir a Stripe");
    } catch (e: any) {
      const detail = e?.response?.data;
      console.error("Error en crearReserva:", detail || e);

      // si viene en __all__, mostrarlo bonito
      if (detail?.__all__) {
        alert(detail.__all__[0]);
      } else if (detail?.detail) {
        alert(detail.detail);
      } else {
        alert(e?.message || "Error al crear reserva");
      }
    } finally {
      setPagando(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">
          Reservar áreas comunes
        </h1>

        {/* Stepper de bolitas */}
        <div className="mb-10 flex items-center justify-between">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold
                ${
                  step >= s
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-500"
                }`}
              >
                {s}
              </div>
              {i < 3 && (
                <div
                  className={`h-1 flex-1 ${
                    step > s ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            <Check className="h-5 w-5" />
            <span>
              ¡Pago realizado! Tu reserva está aprobada y figura como{" "}
              <b>Pagada</b>.
            </span>
          </div>
        )}
        {canceled && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
            El pago fue cancelado. Podés intentarlo nuevamente desde “Mis
            Reservas”.
          </div>
        )}

        {/* Paso 1 */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-6">
            {loadingAreas ? (
              <div>Cargando áreas…</div>
            ) : (
              areas.map((area) => (
                <div
                  key={area.id}
                  className="rounded-2xl border bg-white p-8 shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex items-center gap-4">
                    {getIcon(area.nombre)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{area.nombre}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Estado:{" "}
                        <span className="font-medium">
                          {area.estado === "DISPONIBLE"
                            ? "Disponible"
                            : area.estado}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <CreditCard className="h-4 w-4" /> $
                        {area.precio.toFixed(2)} USD
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (area.estado !== "DISPONIBLE") return;
                        setSelectedAreaId(area.id);
                        setStep(2);
                      }}
                      disabled={area.estado !== "DISPONIBLE"}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Reservar
                    </button>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-blue-600">
                      <Info className="h-4 w-4" /> Ver detalles
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                      <Info className="h-4 w-4" /> Políticas de uso
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Paso 2 */}
        {step === 2 && selectedArea && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Selecciona fecha y horario
            </h2>
            <label className="mb-3 block text-sm font-medium text-gray-600">
              Fecha
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-600">
                Hora de inicio
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-gray-600">
                Hora de fin
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border px-4 py-2"
              >
                Volver
              </button>
              <button
                onClick={continuarFechaHora}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 */}
        {step === 3 && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Ingresa tus datos
            </h2>
            <div className="space-y-4">
              <input
                placeholder="Nombre"
                className="w-full rounded-lg border px-3 py-2"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                placeholder="Departamento"
                className="w-full rounded-lg border px-3 py-2"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-lg border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border px-4 py-2"
              >
                Volver
              </button>
              <button
                onClick={continuarDatos}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Paso 4 */}
        {step === 4 && selectedArea && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Confirmar y pagar
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">{selectedArea.nombre}</h3>
                <p className="text-sm text-gray-600">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Área común del condominio
                </p>
                <p className="mt-2 text-sm">Fecha: {fecha}</p>
                <p className="text-sm">
                  Horario: {horaInicio} — {horaFin || addOneHour(horaInicio)}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="mb-2 font-medium">Total</p>
                <p className="text-3xl font-bold">
                  ${selectedArea.precio.toFixed(2)} USD
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="rounded-lg border px-4 py-2"
              >
                Volver
              </button>
              <button
                onClick={pagar}
                disabled={pagando}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {pagando ? "Procesando…" : "Pagar con Stripe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AreasReservaSystem;

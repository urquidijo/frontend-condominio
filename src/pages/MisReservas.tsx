import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { useStripe } from "@stripe/react-stripe-js";
import api from "../api/axiosConfig";
import { registrarBitacora } from "../api/bitacora";

// ---- Tipos que devuelve tu API ----
type Reserva = {
  id: number;
  area: number;
  area_nombre: string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";
  precio: string;
  paid?: boolean;
  payment_status?: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | null;
  receipt_url?: string | null;
};

function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)} ${currency}`;
  }
}

function toNumber(decStr: string | number | null | undefined) {
  const n = typeof decStr === "string" ? Number(decStr) : Number(decStr ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function MisReservas() {
  const stripe = useStripe();
  const [items, setItems] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userIdStr = localStorage.getItem("userId");
      const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;
      if (userId) {
        await registrarBitacora(userId, "Obtener Reservaciones", "exitoso");
      }
      const { data } = await api.get<Reserva[]>("/reservations/");
      setItems(data);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar tus reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pagar = async (reserva: Reserva) => {
    if (!stripe) return;
    setPayingId(reserva.id);
    try {
      const { data } = await api.post("/payments/create-checkout-session/", {
        reservation_id: reserva.id,
      });

      if (data?.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (error) {
          console.error(error);
          alert("Error al redirigir a Stripe");
        }
      } else {
        alert("No se pudo crear la sesión de pago");
      }
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Error procesando el pago";
      alert(msg);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Mis Reservas</h2>
        <div className="flex items-center gap-3">
          <a
            href="/reservas/nueva"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Nueva Reserva
          </a>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition"
          >
            <RefreshCcw className="w-4 h-4" /> Refrescar
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="rounded-lg border bg-white p-6 text-center text-gray-600">
          Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
          No tienes reservas.{" "}
          <a
            className="text-blue-600 underline hover:text-blue-800"
            href="/reservas/nueva"
          >
            Crear una nueva
          </a>
          .
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((r) => {
            const isPaid = !!r.paid;
            const amountNumber = toNumber(r.precio);
            const amountLabel = money(amountNumber, "USD");

            return (
              <div
                key={r.id}
                className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                {/* Info Reserva */}
                <div className="flex-1 min-w-[220px]">
                  <div className="text-lg font-semibold text-gray-800">
                    {r.area_nombre}
                  </div>
                  <div className="text-sm text-gray-500">
                    {r.fecha_reserva} • {r.hora_inicio.slice(0, 5)}–
                    {r.hora_fin.slice(0, 5)}
                  </div>
                  <div className="text-xs mt-1 text-gray-400">
                    Estado: {r.estado}
                  </div>
                </div>

                {/* Estado del pago */}
                <div className="flex items-center gap-2">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                      <Clock className="w-4 h-4" /> Pendiente
                    </span>
                  )}

                  {r.payment_status === "FAILED" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      <XCircle className="w-4 h-4" /> Fallido
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3">
                  {r.receipt_url && (
                    <a
                      href={r.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      Ver comprobante <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {!isPaid && (
                    <button
                      onClick={() => pagar(r)}
                      disabled={payingId === r.id}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payingId === r.id
                        ? "Procesando..."
                        : `Pagar ${amountLabel}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

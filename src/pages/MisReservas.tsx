import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, CreditCard, ExternalLink, RefreshCcw, XCircle } from "lucide-react";
import { useStripe } from "@stripe/react-stripe-js";
import api from "../api/axiosConfig";

// ---- Tipos que devuelve tu API ----
type Reserva = {
  id: number;
  area: number;
  area_nombre: string;
  fecha_reserva: string; // "YYYY-MM-DD"
  hora_inicio: string;   // "HH:MM:SS"
  hora_fin: string;      // "HH:MM:SS"
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";

  // 👇 viene desde backend (copiado del área común)
  precio: string;        // Decimal DRF → string

  // opcionales si tu serializer los incluye
  paid?: boolean;
  payment_status?: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | null;
  receipt_url?: string | null;
};

function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-BO", { style: "currency", currency }).format(n);
  } catch {
    // fallback si el runtime no tiene la divisa
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
      // ⚠️ Solo mandamos reservation_id. El backend calcula el monto con area.precio
      const { data } = await api.post("/payments/create-checkout-session/", {
        reservation_id: reserva.id,
      });

      if (data?.sessionId) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Mis Reservas</h2>
        <div className="flex items-center gap-2">
          <a
            href="/reservas/nueva"
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            Nueva Reserva
          </a>
          <button
            onClick={fetchData}
            className="px-3 py-2 rounded border text-sm flex items-center gap-2"
            title="Refrescar"
          >
            <RefreshCcw className="w-4 h-4" /> Refrescar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-4">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center">
          No tienes reservas.{" "}
          <a className="text-blue-600 underline" href="/reservas/nueva">
            Crear una nueva
          </a>
          .
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const isPaid = !!r.paid;
            const amountNumber = toNumber(r.precio); // 👈 precio tomado de la reserva/área
            const amountLabel = money(amountNumber, "USD"); // ajusta moneda si usas otra

            return (
              <div
                key={r.id}
                className="rounded-lg border bg-white p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-[220px]">
                  <div className="font-semibold">{r.area_nombre}</div>
                  <div className="text-sm text-gray-600">
                    {r.fecha_reserva} • {r.hora_inicio.slice(0, 5)}–{r.hora_fin.slice(0, 5)}
                  </div>
                  <div className="text-xs mt-1">Estado: {r.estado}</div>
                </div>

                <div className="text-sm font-medium">{amountLabel}</div>

                <div className="flex items-center gap-2">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">
                      <Clock className="w-4 h-4" /> Pendiente de pago
                    </span>
                  )}

                  {r.payment_status === "FAILED" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                      <XCircle className="w-4 h-4" /> Fallido
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {r.receipt_url && (
                    <a
                      href={r.receipt_url}
                      target="_blank"
                      className="text-sm text-blue-600 underline inline-flex items-center gap-1"
                      rel="noreferrer"
                    >
                      Ver comprobante <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {!isPaid && (
                    <button
                      onClick={() => pagar(r)}
                      disabled={payingId === r.id}
                      className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm inline-flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payingId === r.id ? "Procesando..." : `Pagar ${amountLabel}`}
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

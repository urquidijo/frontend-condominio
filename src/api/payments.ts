import api from "./axiosConfig";

/* ===========================
 * Price Configs (catálogo)
 * =========================== */

export type PriceConfigDTO = {
  id: number;
  type: string;
  base_price: string;  // decimal como string
  description?: string;
  currency?: string;   // si tu backend lo mantiene
  active: boolean;
  created_at?: string; // si tu backend lo mantiene
  updated_at?: string; // si tu backend lo mantiene
};

export type ListPriceConfigsResponse =
  | {
      count?: number;
      results?: PriceConfigDTO[];
    }
  | PriceConfigDTO[];

const normalizeList = (data: ListPriceConfigsResponse): PriceConfigDTO[] =>
  Array.isArray(data) ? data : data.results ?? [];

// LIST
export const listPriceConfigs = async (params?: { q?: string; active?: "0" | "1" }) => {
  const res = await api.get<ListPriceConfigsResponse>("/payments/price-configs/", { params });
  return normalizeList(res.data);
};

// CREATE
export const createPriceConfig = async (payload: {
  type: string;
  base_price: string | number;
  description?: string;
  currency?: string;
  active?: boolean;
}) => {
  const res = await api.post<PriceConfigDTO>("/payments/price-configs/", payload);
  return res.data;
};

// UPDATE (PATCH)
export const updatePriceConfig = async (
  id: number,
  payload: Partial<{
    type: string;
    base_price: string | number;
    description: string;
    currency: string;
    active: boolean;
  }>
) => {
  const res = await api.patch<PriceConfigDTO>(`/payments/price-configs/${id}/`, payload);
  return res.data;
};

// DELETE
export const deletePriceConfig = async (id: number) => {
  const res = await api.delete(`/payments/price-configs/${id}/`);
  return res.data;
};

// TOGGLE ACTIVE
export const togglePriceConfig = async (id: number, active: boolean) => {
  const res = await api.post<PriceConfigDTO>(`/payments/price-configs/${id}/toggle-active/`, { active });
  return res.data;
};

/* ===========================
 * Properties
 * =========================== */

export type PropertyDTO = {
  id: number;
  codigo?: string;
};

export async function listProperties() {
  const { data } = await api.get<PropertyDTO[]>("/properties/");
  return data;
}

/* ===========================
 * Charges (cargos/multas)
 * =========================== */

export type ChargeDTO = {
  id: number;
  property_id?: number;
  price_config_id?: number;
  fecha_pago: string | null; // ← FECHA DE VENCIMIENTO
  status: "PENDING" | "PAID" | "CANCELED" | "OVERDUE";
  issued_at: string;
  paid_at: string | null;
  amount: string;            // string decimal
};

export async function listCharges() {
  const { data } = await api.get<ChargeDTO[]>("/payments/charges/");
  return data;
}

/**
 * Crea un cargo. OJO:
 * - NO mandes amount; el backend lo toma del PriceConfig.
 * - 'fecha_pago' puede ir null o "YYYY-MM-DD".
 */
export async function createCharge(payload: {
  property_id: number;
  price_config_id: number;
  fecha_pago?: string | null;
}) {
  const { data } = await api.post<ChargeDTO>("/payments/charges/", {
    property_id: payload.property_id,
    price_config_id: payload.price_config_id,
    fecha_pago: payload.fecha_pago ?? null,
  });
  return data;
}

/* ===========================
 * Stripe checkout para CHARGE
 * =========================== */

/** Crea una sesión de Stripe para pagar un cargo. */
export async function createCheckoutSessionForCharge(charge_id: number) {
  const { data } = await api.post<{ sessionId: string; amount: string; currency: string }>(
    "/payments/create-checkout-session/",
    { charge_id }
  );
  return data;
}

/* ===========================
 * Stripe checkout para RESERVA (opcional)
 * =========================== */

export async function crearCheckoutSession(payload: { reservation_id: number }) {
  const { data } = await api.post("/payments/create-checkout-session/", payload);
  return data; // { sessionId }
}

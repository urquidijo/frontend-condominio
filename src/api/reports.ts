import api from "./axiosConfig";

export interface UsageReportRow {
  id: number;
  area_nombre: string;
  residente: string;
  departamento: string | null;
  /** FECHA EN QUE LA RESERVA FUE APROBADA (sin hora) */
  fecha_aprobada: string | null;
  hora_inicio: string;
  hora_fin: string;
  pago_monto: string;   // decimal como string
  pago_estado: string;  // "SUCCEEDED" (el back ya filtra)
  pago_recibo: string | null;
}

export interface UsageReportResponse {
  count: number;
  results: UsageReportRow[];
}

export const getUsageReport = async (params?: any) => {
  const response = await api.get<UsageReportResponse>("/reports/usage/", {
    params: { ...(params || {}) },
  });
  return response.data;
};

export const exportUsageReport = async (params?: any) => {
  const response = await api.get("/reports/usage/", {
    params: { ...(params || {}), export: "csv" },
    responseType: "blob",
  });
  return response.data;
};




export interface PaymentReportRow {
  id: number;
  tipo: string;                 // nombre del PriceConfig (ej: "Multa Parking")
  propiedad: string | null;     // etiqueta/código de la propiedad
  residente: string;            // nombre completo o email
  departamento: string | null;  // opcional
  paid_at: string | null;       // fecha del pago (YYYY-MM-DD)
  monto: string;                // decimal como string
  moneda?: string | null;       // si quieres mostrar otra moneda, opcional
  recibo_url: string | null;    // URL del comprobante (Stripe)
}

export interface PaymentReportResponse {
  count: number;
  results: PaymentReportRow[];
}

export const getPaymentsReport = async (params?: any) => {
  const response = await api.get<PaymentReportResponse>("/payments/reports/", {
    params: { ...(params || {}) },
  });
  return response.data;
};

export const exportPaymentsReport = async (params?: any) => {
  const response = await api.get("/payments/reports/", {
    params: { ...(params || {}), export: "csv" },
    responseType: "blob",
  });
  return response.data;
};

import api from "./axiosConfig";

// -------- MODELOS --------
export interface CommonArea {
  id: number;
  nombre: string;
  descripcion: string;
  capacidad: number;
  ubicacion: string;
  estado: "DISPONIBLE" | "MANTENIMIENTO" | "CERRADO";
  horario_apertura: string; // "HH:MM:SS"
  horario_cierre: string;   // "HH:MM:SS"
  // 👇 precio base definido en el backend al crear/editar el Área
  precio: string;           // DRF DecimalField → string
}

export interface Reservation {
  id: number;
  usuario: number;
  usuario_username: string;
  area: number;
  area_nombre: string;
  fecha_reserva: string;  // "YYYY-MM-DD"
  hora_inicio: string;    // "HH:MM:SS"
  hora_fin: string;       // "HH:MM:SS"
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";

  // 👇 precio de la reserva que viene desde la BD
  // (por ejemplo, copiado del Area.precio en el backend durante la creación)
  precio: string;

  // 👇 opcionales si tu serializer los incluye
  paid?: boolean;
  payment_status?: string | null;
  receipt_url?: string | null;
}

// -------- API ÁREAS --------
export const getAreas = async () => {
  const res = await api.get<CommonArea[]>("areas/");
  return res.data;
};

export const createArea = async (data: Omit<CommonArea, "id">) => {
  const res = await api.post("areas/", data);
  return res.data as CommonArea;
};

export const updateArea = async (id: number, data: Partial<CommonArea>) => {
  const res = await api.put(`areas/${id}/`, data);
  return res.data as CommonArea;
};

export const deleteArea = async (id: number) => {
  await api.delete(`areas/${id}/`);
};

// -------- API RESERVAS --------
export const getReservations = async () => {
  const res = await api.get<Reservation[]>("reservations/");
  return res.data;
};

// ⚠️ Importante: NO enviar "precio" desde el front. El backend lo calcula/trae de la BD.
export const createReservation = async (data: {
  area: number;
  fecha_reserva: string; // "YYYY-MM-DD"
  hora_inicio: string;   // "HH:MM" o "HH:MM:SS"
  hora_fin: string;      // "HH:MM" o "HH:MM:SS"
}) => {
  const res = await api.post<Reservation>("reservations/", data);
  return res.data; // ← vendrá con "precio" desde el backend
};

export const cancelReservation = async (id: number) => {
  await api.post(`reservations/${id}/cancel/`);
};

// -------- BLOQUES OCUPADOS (para evitar solapamiento en frontend) --------
// El endpoint devuelve objeto { "YYYY-MM-DD": [{...}, ...], ... }
export type OccupiedSlotsByDate = Record<
  string,
  {
    id: number;
    hora_inicio: string; // "HH:MM"
    hora_fin: string;    // "HH:MM"
    estado: "PENDIENTE" | "APROBADA" | "CANCELADA";
    usuario: number;
  }[]
>;

export const getOccupiedSlots = async (areaId: number, fecha: string) => {
  const res = await api.get<OccupiedSlotsByDate>(
    `reservations/occupied/?area=${areaId}&from=${fecha}&to=${fecha}`
  );
  return res.data;
};

// Helpers
export function precioToNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// -------- Atajos adicionales --------
export async function crearReserva(payload: {
  area: number;
  fecha_reserva: string;  // "YYYY-MM-DD"
  hora_inicio: string;    // "HH:MM"
  hora_fin: string;       // "HH:MM"
}) {
  const { data } = await api.post<Reservation>("/reservations/", payload);
  return data; // ← incluye precio desde la BD
}

export async function listarAreas() {
  const { data } = await api.get<CommonArea[]>("/areas/");
  return data;
}

export async function listarMisReservas() {
  const { data } = await api.get<Reservation[]>("/reservations/");
  return data;
}

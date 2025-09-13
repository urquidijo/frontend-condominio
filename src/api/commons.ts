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
}

// -------- API ÁREAS --------
export const getAreas = async () => {
  const res = await api.get<CommonArea[]>("areas/");
  return res.data;
};

export const createArea = async (data: Omit<CommonArea, "id">) => {
  const res = await api.post("areas/", data);
  return res.data;
};

export const updateArea = async (id: number, data: Partial<CommonArea>) => {
  const res = await api.put(`areas/${id}/`, data);
  return res.data;
};

export const deleteArea = async (id: number) => {
  await api.delete(`areas/${id}/`);
};

// -------- API RESERVAS --------
export const getReservations = async () => {
  const res = await api.get<Reservation[]>("reservations/");
  return res.data;
};

export const createReservation = async (data: {
  area: number;
  fecha_reserva: string; // "YYYY-MM-DD"
  hora_inicio: string;   // "HH:MM:SS"
  hora_fin: string;      // "HH:MM:SS"
}) => {
  const res = await api.post("reservations/", data);
  return res.data;
};

export const cancelReservation = async (id: number) => {
  await api.post(`reservations/${id}/cancel/`);
};

// -------- BLOQUES OCUPADOS (para evitar solapamiento en frontend) --------
export const getOccupiedSlots = async (areaId: number, fecha: string) => {
  const res = await api.get(`reservations/occupied/?area=${areaId}&from=${fecha}&to=${fecha}`);
  return res.data as {
    id: number;
    fecha_reserva: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  }[];
};

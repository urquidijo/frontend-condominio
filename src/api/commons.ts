import api from "./axiosConfig";

// -------- MODELOS --------
export interface CommonArea {
  id: number;
  name: string;
  description: string;
  capacity: number;
  availability_start: string;
  availability_end: string;
  price_per_hour: number;
  is_active: boolean;
}

export interface Reservation {
  id: number;
  user: number;
  user_username: string;
  area: number;
  area_name: string;
  start_time: string;
  end_time: string;
  status: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "FINALIZADA";
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
  start_time: string;
  end_time: string;
}) => {
  const res = await api.post("reservations/", data);
  return res.data;
};

export const cancelReservation = async (id: number) => {
  await api.post(`reservations/${id}/cancel/`);
};

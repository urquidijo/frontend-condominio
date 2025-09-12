import api from "./axiosConfig";

export interface Notice {
  id: number;
  title: string;
  content: string;
  priority: "ALTA" | "MEDIA" | "BAJA";
  created_by: number;
  created_by_username?: string; // para mostrar nombre
  created_at: string;
}

// Listar
export const getNotices = async () => {
  const res = await api.get<Notice[]>("notices/");
  return res.data;
};

// Crear (sin enviar created_by)
export const createNotice = async (
  data: Omit<Notice, "id" | "created_at" | "created_by" | "created_by_username">
) => {
  const res = await api.post("notices/", data);
  return res.data;
};

// Actualizar
export const updateNotice = async (id: number, data: Partial<Notice>) => {
  const res = await api.put(`notices/${id}/`, data);
  return res.data;
};

// Eliminar
export const deleteNotice = async (id: number) => {
  await api.delete(`notices/${id}/`);
};

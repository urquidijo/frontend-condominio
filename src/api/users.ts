import api from "./axiosConfig";
import { type Role } from "./roles";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[] | PaginatedResponse<User>>("users/");
  if (Array.isArray(data)) return data;
  if ("results" in data) return data.results;
  return [];
};

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number | null;
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const { data } = await api.post<User>("users/", payload);
  return data;
};

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role_id?: number | null;
}

// api/users.ts
export const updateUser = async (id: number, payload: UpdateUserPayload): Promise<User> => {
  const { data } = await api.patch<User>(`users/${id}/`, payload); // 👈 PATCH en vez de PUT
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`users/${id}/`);
};

export const assignRole = async (userId: number, roleId: number | null) => {
  await api.post(`users/${userId}/assign_role/`, { role_id: roleId });
};



export async function getUserById(id: number) {
  // Ajusta la URL si tu endpoint es diferente (p. ej. /auth/me/)
  const { data } = await api.get(`/users/${id}/`);
  return data; // se espera { id, email, first_name, last_name, role: { name }, ... }
}

export async function getUserPermissions(id: number) {
  // Ajusta la URL si tu endpoint es diferente
  const { data } = await api.get(`/users/${id}/permissions/`);
  // Devuelve un array de codenames; si tu backend envía otra forma, adapta aquí
  return Array.isArray(data) ? data : (data?.results ?? []);
}
import api from "./axiosConfig";
import {type  Role } from "./roles";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role | null;          // 👈 ahora es objeto Role
  permissions?: string[];
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
  username: string;
  email: string;
  password: string;
  role_id: number | null;
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const { data } = await api.post<User>("users/", payload);
  return data;
};

// PUT usuario
export const updateUser = async (
  id: number,
  payload: Partial<Omit<User, "id">>
): Promise<User> => {
  const { data } = await api.put<User>(`users/${id}/`, payload);
  return data;
};

// DELETE usuario
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`users/${id}/`);
};


// 🔹 Agregar permiso extra a un usuario
export const addPermission = async (userId: number, permissionId: number) => {
  await api.post(`users/${userId}/add_permission/`, { permission_id: permissionId });
};

// 🔹 Quitar permiso extra a un usuario
export const removePermission = async (userId: number, permissionId: number) => {
  await api.post(`users/${userId}/remove_permission/`, { permission_id: permissionId });
};

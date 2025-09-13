import api from "./axiosConfig";
import { type Role } from "./roles";
import { type Permission } from "./permissions";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role | null;
  extra_permissions?: Permission[];
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

export const updateUser = async (
  id: number,
  payload: Partial<Omit<User, "id">>
): Promise<User> => {
  const { data } = await api.put<User>(`users/${id}/`, payload);
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`users/${id}/`);
};


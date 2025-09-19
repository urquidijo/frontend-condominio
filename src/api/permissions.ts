import api from "./axiosConfig";

export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
}

type Paged<T> = T[] | { results?: T[] };
const unwrap = <T>(data: Paged<T>): T[] =>
  Array.isArray(data) ? data : (data?.results ?? []);

export const getPermissions = async (): Promise<Permission[]> => {
  const { data } = await api.get("permissions/");   // ← sin users/
  return unwrap<Permission>(data);
};

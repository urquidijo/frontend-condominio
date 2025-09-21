// api/properties.ts
import api from "./axiosConfig";
import type { User } from "./users";
import { getUsers } from "./users";

/* =========================
 * Tipos
 * ========================= */
export interface PropertyTenant {
  id: number;
  user: User;
  user_id?: number; // solo para crear
}

export interface Property {
  id: number;
  edificio: string;                 // "A" | "B" | ...
  numero: string;                   // "A-101"
  estado: "ocupada" | "disponible";
  area_m2: string | number | null;  // viene del backend
  area?: string;                    // backend también puede devolver "120 m²"

  // Nuevos campos (dueño / inquilinos)
  owner: User | null;
  owner_id?: number | null;         // write-only
  tenants: PropertyTenant[];

  // Legacy (si tu backend aún los manda, no rompen)
  propietario?: string;
  telefono?: string;
  email?: string;
}

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Unifica lista plana o paginada
const unpack = <T,>(data: T[] | PaginatedResponse<T>): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "results" in data) {
    return (data as PaginatedResponse<T>).results ?? [];
  }
  return [];
};

/* =========================
 * Properties CRUD
 * ========================= */
export const getProperties = async (): Promise<Property[]> => {
  const { data } = await api.get<Property[] | PaginatedResponse<Property>>("properties/");
  return unpack<Property>(data);
};

export const getProperty = async (id: number): Promise<Property> => {
  const { data } = await api.get<Property>(`properties/${id}/`);
  return data;
};

export interface CreatePropertyPayload {
  edificio: string;
  numero: string;
  owner_id?: number | null;                 // dueño (opcional)
  area_m2?: number | string | null;         // directo
  area?: string;                            // "120 m²" (el backend lo parsea)
  // legacy opcional:
  propietario?: string;
  telefono?: string;
  email?: string;
}

export const createProperty = async (
  payload: CreatePropertyPayload
): Promise<Property> => {
  const { data } = await api.post<Property>("properties/", payload);
  return data;
};

export const updateProperty = async (
  id: number,
  payload: Partial<CreatePropertyPayload>
): Promise<Property> => {
  const { data } = await api.patch<Property>(`properties/${id}/`, payload);
  return data;
};

export const deleteProperty = async (id: number): Promise<void> => {
  await api.delete(`properties/${id}/`);
};

export const getNextPropertyNumber = async (edificio: string): Promise<string> => {
  const { data } = await api.get<{ sugerido: string }>("properties/next_number/", {
    params: { edificio },
  });
  return data.sugerido;
};

/* =========================
 * Tenants (inquilinos)
 * ========================= */
export const getPropertyTenants = async (propertyId: number): Promise<PropertyTenant[]> => {
  const { data } = await api.get<PropertyTenant[]>(`properties/${propertyId}/tenants/`);
  return data;
};

export const addTenant = async (
  propertyId: number,
  userId: number
): Promise<PropertyTenant> => {
  const { data } = await api.post<PropertyTenant>(
    `properties/${propertyId}/add_tenant/`,
    { user_id: userId }
  );
  return data;
};

export const removeTenant = async (
  propertyId: number,
  userId: number
): Promise<void> => {
  await api.post(`properties/${propertyId}/remove_tenant/`, { user_id: userId });
};

/* =========================
 * Helpers de usuarios
 * ========================= */
export const getUsersByRoleName = async (roleName: string): Promise<User[]> => {
  const users = await getUsers();
  return users.filter(
    (u) => (u.role?.name || "").toLowerCase() === roleName.toLowerCase()
  );
};

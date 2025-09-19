import api from "./axiosConfig";

export interface Property {
  id: number;
  edificio: string; // "A" | "B" | etc
  numero: string;   // ej: "A-101"
  propietario: string;
  telefono: string;
  email: string;
  estado: "ocupada" | "disponible";
  area_m2: string | number | null;
  area?: string; // Backend también devuelve "120 m²"
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Obtener lista de propiedades
 */
export const getProperties = async (): Promise<Property[]> => {
  const { data } = await api.get<Property[] | PaginatedResponse<Property>>(
    "properties/"
  );
  if (Array.isArray(data)) return data;
  if ("results" in data) return data.results;
  return [];
};

/**
 * Crear nueva propiedad
 */
export interface CreatePropertyPayload {
  edificio: string;
  numero: string;
  propietario?: string;
  telefono?: string;
  email?: string;
  area: string; // ej: "120 m²"
}

export const createProperty = async (
  payload: CreatePropertyPayload
): Promise<Property> => {
  const { data } = await api.post<Property>("properties/", payload);
  return data;
};

/**
 * Actualizar propiedad
 */
export const updateProperty = async (
  id: number,
  payload: Partial<CreatePropertyPayload>
): Promise<Property> => {
  const { data } = await api.patch<Property>(`properties/${id}/`, payload);
  return data;
};

/**
 * Eliminar propiedad
 */
export const deleteProperty = async (id: number): Promise<void> => {
  await api.delete(`properties/${id}/`);
};

/**
 * Obtener sugerencia del siguiente número de unidad
 */
export const getNextPropertyNumber = async (
  edificio: string
): Promise<string> => {
  const { data } = await api.get<{ sugerido: string }>(
    "properties/next_number/",
    { params: { edificio } }
  );
  return data.sugerido;
};

// src/api/maintenance.ts
import api from "./axiosConfig";

/* ===================== Tipos base ===================== */
export type TipoMtto = "preventivo" | "correctivo";
export type Prioridad = "baja" | "media" | "alta";
export type Estado = "pendiente" | "en_progreso" | "completado";
export type Destinatario = "interno" | "externo";

const qs = (o: Record<string, any>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

// DRF puede responder array directo o paginado; normalizamos a array
const unwrap = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
};

/* =======================================================================
   ⚠️ MATERIAL:
   - Standalone (endpoint maintenance/materiales/): requiere `reporte` (FK)
   - Nested (dentro de reportes): SIN `reporte`
   ======================================================================= */

export interface MaterialStandalone {
  id?: number;
  reporte: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario: number;
  // Decimal de DRF suele llegar como string
  costo_total?: number | string;
}

export type MaterialNested = Omit<MaterialStandalone, "id" | "reporte"> & {
  id?: number;
};

/* ===================== REPORTES ===================== */

export interface ReportePayload {
  id?: number;
  tipo: TipoMtto;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  prioridad: Prioridad;
  estado: Estado;
  asignar_a: Destinatario;
  fecha_inicio: string; // yyyy-mm-dd
  fecha_fin: string;    // yyyy-mm-dd
  responsable: number | null;
  costo_total?: number | string;
  creado_por?: number | null;
  materiales?: MaterialNested[];
}

type ReporteFilters = Partial<{
  search: string;
  tipo: TipoMtto;
  prioridad: Prioridad;
  estado: Estado;
  asignar_a: Destinatario;
  responsable: number;
  page: number;
}>;

// Listar
export const getReportes = async (filters: ReporteFilters = {}) => {
  const query = qs(filters);
  const endpoint = `maintenance/reportes/${query ? `?${query}` : ""}`;
  const { data } = await api.get(endpoint);
  return unwrap<ReportePayload>(data);
};

// Obtener uno
export const getReporte = async (id: number) => {
  const { data } = await api.get(`maintenance/reportes/${id}/`);
  return data as ReportePayload;
};

// Crear
export const createReporte = async (payload: ReportePayload) => {
  const { data } = await api.post(`maintenance/reportes/`, payload);
  return data as ReportePayload;
};

// Actualizar parcial
export const updateReporte = async (id: number, partial: Partial<ReportePayload>) => {
  const { data } = await api.patch(`maintenance/reportes/${id}/`, partial);
  return data as ReportePayload;
};

// Eliminar
export const deleteReporte = async (id: number) => {
  await api.delete(`maintenance/reportes/${id}/`);
};

/* ===================== TAREAS ===================== */

export interface Tarea {
  id?: number;
  titulo: string;
  descripcion: string;
  tipo: TipoMtto;
  prioridad: Prioridad;
  estado: Estado;
  asignar_a: Destinatario;
  fecha_programada: string;
  fecha_completada?: string | null;
  costo_estimado: number | string;
  ubicacion: string;
  asignado_a: number | null;
}

type TareaFilters = Partial<{
  estado: Estado;
  asignado_a: number;
  asignar_a: Destinatario;
  tipo: TipoMtto;
  prioridad: Prioridad;
  search: string;
  page: number;
}>;

export const getTareas = async (filters: TareaFilters = {}) => {
  const query = qs(filters);
  const endpoint = `maintenance/tareas/${query ? `?${query}` : ""}`;
  const { data } = await api.get(endpoint);
  return unwrap<Tarea>(data);
};

export const createTarea = async (payload: Tarea) => {
  const { data } = await api.post(`maintenance/tareas/`, payload);
  return data as Tarea;
};

export const updateTarea = async (id: number, partial: Partial<Tarea>) => {
  const { data } = await api.patch(`maintenance/tareas/${id}/`, partial);
  return data as Tarea;
};

// ✅ ARREGLADO: URL correcta y devolución tipada
export const updateTareaEstado = async (
  id: number,
  estado: "pendiente" | "en_progreso" | "completado",
  fecha_completada?: string | null
) => {
  const body: any = { estado };
  if (estado === "completado") {
    body.fecha_completada = fecha_completada ?? new Date().toISOString().slice(0, 10);
  }
  const { data } = await api.patch(`maintenance/tareas/${id}/`, body);
  return data as Tarea;
};

export const deleteTarea = async (id: number) => {
  await api.delete(`maintenance/tareas/${id}/`);
};

/* ===================== MATERIALES ===================== */

export type Material = MaterialStandalone;

type MaterialFilters = Partial<{
  reporte: number;
  search: string;
  page: number;
}>;

export const getMateriales = async (filters: MaterialFilters = {}) => {
  const query = qs(filters);
  const endpoint = `maintenance/materiales/${query ? `?${query}` : ""}`;
  const { data } = await api.get(endpoint);
  return unwrap<MaterialStandalone>(data);
};

export const createMaterial = async (payload: MaterialStandalone) => {
  const { data } = await api.post(`maintenance/materiales/`, payload);
  return data as MaterialStandalone;
};

export const updateMaterial = async (id: number, partial: Partial<MaterialStandalone>) => {
  const { costo_total: _omit, ...clean } = partial;
  const { data } = await api.patch(`maintenance/materiales/${id}/`, clean);
  return data as MaterialStandalone;
};

export const deleteMaterial = async (id: number) => {
  await api.delete(`maintenance/materiales/${id}/`);
};

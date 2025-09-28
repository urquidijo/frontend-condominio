import api from "./axiosConfig";

/* ========= Reconocimiento facial clásico (ya lo tenías) ========= */

export type FaceLoginResponse =
  | {
      recognized: true;
      similarity?: number;

      // tokens (si el backend los envía)
      access?: string;
      refresh?: string;

      // user embebido (opcional)
      user?: {
        id: number;
        email?: string;
        first_name?: string;
        last_name?: string;
        role?: { name?: string } | null;
        permissions?: string[] | null;
      };

      // variantes que algunos backends devuelven
      user_id?: number;
      role?: { name?: string } | null;
      permissions?: string[] | null;
    }
  | {
      recognized: false;
      detail?: string;
    };

export async function aiFaceLogin(image: Blob) {
  const fd = new FormData();
  fd.append("file", image, "capture.jpg");
  const { data } = await api.post<FaceLoginResponse>("/ai/face/login/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function aiFaceEnroll(userId: number, image: Blob) {
  const fd = new FormData();
  fd.append("user_id", String(userId));
  fd.append("file", image, "enroll.jpg");
  const { data } = await api.post("/ai/face/enroll/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function aiFaceStatus(userId: number) {
  const { data } = await api.get(`/ai/face/status/${userId}/`);
  return data as { status?: string; external_image_id?: string };
}

export async function aiFaceRevoke(userId: number) {
  const { data } = await api.post("/ai/face/revoke/", { user_id: userId });
  return data;
}

/* ==================== VISITANTES (actualizado) ==================== */

export type VisitorLoginResponse = {
  ok: boolean;
  user_id?: number;
  session_id?: number;
  similarity?: number;

  // tokens y seguridad
  access?: string;
  refresh?: string;

  // rol/permisos (el rol puede venir como string o como objeto con name)
  role?: string | { name?: string } | null;
  permissions?: string[] | null;

  // redundante (a veces el backend lo manda)
  user?: {
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: { name?: string } | null;
    permissions?: string[] | null;
  } | null;

  // errores
  code?: string;     // NOT_VISITOR, etc.
  detail?: string;
};

export async function visitorLogin(image: Blob): Promise<VisitorLoginResponse> {
  const fd = new FormData();
  fd.append("file", image, "visitor.jpg");
  const { data } = await api.post("/ai/visitor/login/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: false,
  });
  return data as VisitorLoginResponse;
}

export async function visitorRegister(
  first_name: string,
  last_name: string,
  image: Blob
): Promise<{ ok: boolean; user_id?: number; detail?: string }> {
  const fd = new FormData();
  fd.append("first_name", first_name);
  fd.append("last_name", last_name);
  fd.append("file", image, "visitor-enroll.jpg");
  const { data } = await api.post("/ai/visitor/register/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: false,
  });
  return data;
}

/* ==================== Placas y alertas (tal cual tenías) ==================== */

export async function detectPlate(file: File): Promise<{ ok: boolean; plate?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/ai/plates/detect/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export type AlertType = "dog_loose" | "vehicle_seen" | "bad_parking" | "dog_waste";

export interface AlertDTO {
  id: number;
  type: AlertType;
  type_label: string;
  camera_id: string | null;
  s3_video_key: string;
  s3_image_key: string | null;
  image_url: string | null;
  timestamp_ms: number;
  confidence: number;
  extra: Record<string, unknown>;
  created_at: string;
}

export async function fetchAlerts(): Promise<AlertDTO[]> {
  const { data } = await api.get<AlertDTO[]>("/ai/alerts/");
  return data;
}

export interface AlertEvent {
  id: number;
  type: AlertType;
  type_label: string;
  camera_id: string | null;
  s3_video_key: string;
  s3_image_key: string | null;
  image_url: string | null;
  timestamp_ms: number;
  confidence: number;
  extra: Record<string, any>;
  created_at: string;
}

export interface UploadResponse {
  ok: boolean;
  video_key: string;
  events: AlertEvent[];
}

export async function uploadAndProcessVideo(
  file: File,
  cameraId: string,
  onProgress?: (p: number) => void
): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("camera_id", cameraId);

  const res = await api.post<UploadResponse>("/ai/video/upload-and-process/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return res.data;
}

/* ==================== Sesiones de visitante ==================== */

// Registrar logout (marca logout_at en backend)
export async function visitorLogout(userId?: number) {
  const body = userId ? { user_id: userId } : {};
  const { data } = await api.post("/ai/visitor/logout/", body);
  return data as { ok: boolean; user_id: number; session_id: number; login_at: string; logout_at: string | null };
}

// Último estado (login / logout)
export async function getVisitorLastStatus(userId: number) {
  const { data } = await api.get(`/ai/visitor/last-status/${userId}/`);
  return data as { last_event: "login" | "logout" | null; at: string | null };
}



// src/api/ai.ts  (añade al final)

export type VisitorRow = {
  id: number;
  full_name: string;
  email: string;
  login_at: string;   // ISO
  logout_at: string | null;
};

export async function fetchVisitorSessions(params?: {
  q?: string;
  from?: string; // 'YYYY-MM-DD'
  to?: string;   // 'YYYY-MM-DD'
  ordering?: string; // 'login_at' | '-login_at' | 'logout_at' | '-logout_at'
  page?: number;
  page_size?: number;
}) {
  const p = new URLSearchParams();
  if (params?.q) p.set("q", params.q);
  if (params?.from) p.set("from", params.from);
  if (params?.to) p.set("to", params.to);
  if (params?.ordering) p.set("ordering", params.ordering);
  if (params?.page) p.set("page", String(params.page));
  if (params?.page_size) p.set("page_size", String(params.page_size));
  const { data } = await api.get(`/ai/visitor/sessions/?${p.toString()}`);
  return data as { results: VisitorRow[]; count: number; next: string | null; previous: string | null };
}



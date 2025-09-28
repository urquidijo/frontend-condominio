// src/api/ai.ts
import api from "./axiosConfig";

export type FaceLoginResponse =
  | {
      recognized: true;
      similarity?: number;

      // tokens
      access?: string;
      refresh?: string;

      // user embebido (opcional)
      user?: {
        id: number;
        email: string;
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


// src/api/ai.ts (o donde lo tengas)
export async function detectPlate(file: File): Promise<{ ok: boolean; plate?: string }> {
  const fd = new FormData();
  fd.append("file", file); // 👈 el backend espera "file"
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
  image_url: string | null;       // viene del serializer
  timestamp_ms: number;
  confidence: number;
  extra: Record<string, unknown>;
  created_at: string;             // ISO
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

  const res = await api.post<UploadResponse>(
    "/ai/video/upload-and-process/",
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );

  return res.data;
}
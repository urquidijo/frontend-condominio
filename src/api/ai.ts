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

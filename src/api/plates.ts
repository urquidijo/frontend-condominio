// src/api/plates.ts
import api from "./axiosConfig";

export async function assignPlate(user_id: number, number: string) {
  try {
    const { data } = await api.post("ai/plates/assign/", { user_id, number });
    return data as { ok: boolean; msg?: string };
  } catch (e: any) {
    const msg =
      e?.response?.data?.error ??
      e?.response?.data?.detail ??
      e?.message ??
      "No se pudo asignar la placa.";
    throw new Error(msg);
  }
}

export async function verifyPlate(number: string) {
  try {
    const { data } = await api.post("ai/plates/verify/", { number });
    return data as { exists: boolean; user_id?: number };
  } catch (e: any) {
    const msg =
      e?.response?.data?.error ??
      e?.response?.data?.detail ??
      e?.message ??
      "Error al verificar la placa.";
    throw new Error(msg);
  }
}

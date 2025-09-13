import api from "./axiosConfig";

export interface Permission {
  id: number;
  name: string;
  code: string;
}

export const getPermissions = async (): Promise<Permission[]> => {
  const { data } = await api.get<Permission[]>("permissions/");
  return data;
};

// 🔹 Agregar permiso extra a un usuario
export const addPermission = async (userId: number, permissionId: number) => {
  await api.post(`users/${userId}/add_permission/`, { permission_id: permissionId });
};

// 🔹 Quitar permiso extra de un usuario
export const removePermission = async (userId: number, permissionId: number) => {
  await api.post(`users/${userId}/remove_permission/`, { permission_id: permissionId });
};

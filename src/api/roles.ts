import api from "./axiosConfig";

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: { id: number; name: string; code: string; description?: string }[];
}

export interface RoleCreatePayload {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

type Paged<T> = T[] | { results?: T[] };
const unwrap = <T>(data: Paged<T>): T[] =>
  Array.isArray(data) ? data : (data?.results ?? []);

export const getRoles = async (): Promise<Role[]> => {
  const { data } = await api.get("roles/");          // ← sin users/
  return unwrap<Role>(data);
};

export const createRole = async (payload: RoleCreatePayload): Promise<Role> => {
  const { data } = await api.post("roles/", payload); // ← sin users/
  return data as Role;
};

export const updateRole = async (id: number, payload: RoleUpdatePayload): Promise<Role> => {
  const { data } = await api.patch(`roles/${id}/`, payload); // ← sin users/
  return data as Role;
};

export const deleteRole = async (id: number): Promise<void> => {
  await api.delete(`roles/${id}/`);                  // ← sin users/
};

// Solo cambiar permisos (opcional)
export const setRolePermissions = async (roleId: number, permissionIds: number[]) => {
  const { data } = await api.patch(`roles/${roleId}/`, { permission_ids: permissionIds });
  return data as Role;
};

// Asignar rol a usuario (estos sí van bajo /users/)
export const assignRoleToUser = async (userId: number, roleId: number | null) => {
  if (roleId == null) {
    return (await api.post(`users/${userId}/remove_role/`)).data;
  }
  return (await api.post(`users/${userId}/assign_role/`, { role_id: roleId })).data;
};




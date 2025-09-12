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

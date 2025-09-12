import api from "./axiosConfig";

export interface Role {
  id: number;
  name: string;
  description: string;
}

export const getRoles = async (): Promise<Role[]> => {
  const { data } = await api.get<Role[]>("roles/");
  return data;
};

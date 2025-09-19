import api from "./axiosConfig";

export const login = async (email: string, password: string) => {
  const { data } = await api.post("login/", { email, password });

  if (data.access) {
    localStorage.setItem("token", data.access);
    if (data.refresh) localStorage.setItem("refresh", data.refresh);


    if (data.role) localStorage.setItem("role", data.role);

    // permisos del ROL
    localStorage.setItem("permissions", JSON.stringify(data.permissions ?? []));
  }

  return data;
};

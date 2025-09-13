import api from "./axiosConfig";

export const login = async (email: string, password: string) => {
  const response = await api.post("login/", { email, password });
  const data = response.data;

  if (data.access) {
    localStorage.setItem("token", data.access);
    localStorage.setItem("refresh", data.refresh);

    if (data.role) {
      localStorage.setItem("role", data.role);
    }

    // 👇 Guardar extra_permissions con el nombre correcto
    if (data.extra_permissions) {
      localStorage.setItem(
        "extra_permissions",
        JSON.stringify(data.extra_permissions)
      );
    }

    // (opcional) si backend aún manda "permissions"
    if (data.permissions) {
      localStorage.setItem(
        "permissions",
        JSON.stringify(data.permissions)
      );
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }

  return data;
};

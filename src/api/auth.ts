import api from "./axiosConfig";

export const login = async (username: string, password: string) => {
  const response = await api.post("login/", { username, password });

  if (response.data.access) {
    localStorage.setItem("token", response.data.access);
    localStorage.setItem(
      "permissions",
      JSON.stringify(response.data.permissions || [])
    );
  }

  return response.data;
};

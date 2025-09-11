import axios from "axios";

const API = "http://127.0.0.1:8000/auth";

export const createAccount = (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => axios.post(`${API}/create-account/`, data);

export const confirmAccount = (token: string) =>
  axios.post(`${API}/confirm-account/`, { token });

export const login = (data: { email: string; password: string }) =>
  axios.post(`${API}/login/`, data);

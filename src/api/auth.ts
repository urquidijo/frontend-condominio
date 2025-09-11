import axios from "axios";
import { ENV } from "../config/env";


export const createAccount = (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => axios.post(`${ENV.API_URL}/auth/create-account/`, data);

export const confirmAccount = (token: string) =>
  axios.post(`${ENV.API_URL}/auth/confirm-account/`, { token });

export const login = (data: { email: string; password: string }) =>
  axios.post(`${ENV.API_URL}/auth/login/`, data);

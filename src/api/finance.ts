import api from "./axiosConfig";

export const getIngresos = () => api.get("/finance/ingresos/");
export const getIngresosMensuales = () => api.get("/finance/ingresos-mensuales/");
export const getGastos = () => api.get("/finance/gastos/");
export const getGastosMensuales = () => api.get("/finance/gastos-mensuales/");
export const getMorosidad = () => api.get("/finance/morosidad/");
export const getCarteraVencida = () => api.get("/finance/cartera-vencida/");
export const getIngresosVsGastos = () => api.get("/finance/ingresos-vs-gastos/");
export const getRentabilidadAreas = () => api.get("/finance/rentabilidad-areas/");

import api from "./axiosConfig"; // tu instancia de axios

export const registrarBitacora = async (
  usuarioId: number,
  acciones: string,
  estado: "exitoso" | "fallido"
) => {
  try {
    await api.post("/bitacora/", {
      usuario: usuarioId,
      acciones,
      estado,
    });
  } catch (error) {
    console.error("Error registrando bitácora:", error);
  }
};

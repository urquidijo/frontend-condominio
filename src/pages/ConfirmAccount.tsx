import { useForm } from "react-hook-form";
import { confirmAccount } from "../api/auth";
import { useNavigate } from "react-router-dom";

type ConfirmForm = {
  token: string;
};

export default function ConfirmAccount() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmForm>();

  const navigate = useNavigate(); 

  const onSubmit = async (data: ConfirmForm) => {
    try {
      const res = await confirmAccount(data.token);
      alert(res.data?.message || "✅ Cuenta confirmada con éxito");
      navigate("/login"); 
    } catch (err: any) {
      alert(err.response?.data?.error || "❌ Error al confirmar cuenta");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-purple-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-700">
          Confirmación de Cuenta
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Token</label>
            <input
              {...register("token", { required: "El token es obligatorio" })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Ingresa tu token"
            />
            {errors.token && <p className="text-red-500 text-sm">{errors.token.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}

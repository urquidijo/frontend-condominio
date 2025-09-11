import { useForm } from "react-hook-form";
import { createAccount } from "../api/auth";
import { useNavigate } from "react-router-dom";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();

  const navigate = useNavigate(); 

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await createAccount(data);
      alert(res.data?.message || "✅ Cuenta creada, revisa tu correo");
      navigate("/confirm"); 
    } catch (err: any) {
      alert(err.response?.data?.error || "❌ Error al registrar");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
          Registro de Residentes
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Nombre completo</label>
            <input
              {...register("name", { required: "El nombre es obligatorio" })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ej: Juan Pérez"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              {...register("email", { required: "El email es obligatorio" })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ejemplo@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              {...register("password", { required: "La contraseña es obligatoria", minLength: 8 })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="**"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              {...register("password_confirmation", {
                required: "Confirma tu contraseña",
              })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="**"
            />
            {errors.password_confirmation && (
              <p className="text-red-500 text-sm">{errors.password_confirmation.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crear cuenta
          </button>
        </form>
      </div>
    </div>
  );
}
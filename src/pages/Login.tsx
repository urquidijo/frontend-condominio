import { useForm } from "react-hook-form";
import { login } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const navigate = useNavigate(); 

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await login(data);


      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("✅ Bienvenido al condominio, " + res.data.user.name);
      navigate("/dashboard"); 
    } catch (err: any) {
      alert(err.response?.data?.error || "❌ Error al iniciar sesión");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700">
          Ingreso al Condominio
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              {...register("email", { required: "El email es obligatorio" })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="ejemplo@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              {...register("password", { required: "La contraseña es obligatoria" })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="********"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
          >
            Ingresar
          </button>
        </form>

        {/* Links debajo del formulario */}
        <div className="mt-4 text-center">
          <p>
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-green-700 font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </p>
          <p>
            ¿Ya tienes cuenta pero no confirmada?{" "}
            <Link to="/confirm" className="text-green-700 font-semibold hover:underline">
              Confirmar cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

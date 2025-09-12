import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login/", {
        username: data.username,
        password: data.password,
      });

      // 🔑 Guardamos tokens y permisos en localStorage
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("role", res.data.role || "");
      localStorage.setItem("permissions", JSON.stringify(res.data.permissions || []));

      navigate("/dashboard"); // Redirigir al dashboard
    } catch (err) {
      alert("Credenciales inválidas ❌");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded shadow-md w-80"
      >
        <h2 className="text-xl font-bold mb-4">Iniciar Sesión</h2>
        <input
          {...register("username")}
          placeholder="Usuario"
          className="border p-2 w-full mb-3"
        />
        <input
          {...register("password")}
          type="password"
          placeholder="Contraseña"
          className="border p-2 w-full mb-3"
        />
        <button className="bg-blue-500 text-white w-full py-2 rounded">
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;

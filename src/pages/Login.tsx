// src/pages/Login.tsx
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { registrarBitacora } from "../api/bitacora";
import FaceCapture from "../components/FaceCapture";
import { aiFaceLogin } from "../api/ai";
import { getUserById, getUserPermissions } from "../api/users";

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  // Facial
  const [faceOpen, setFaceOpen] = useState(false);
  const [faceMsg, setFaceMsg] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);

  /** Guarda TODO en localStorage de forma consistente para ambos flujos */
  const saveSession = (opts: {
    access?: string | null;
    refresh?: string | null;
    userId?: number | null;
    roleName?: string | null;
    permissions?: string[] | null;
  }) => {
    const { access, refresh, userId, roleName, permissions } = opts;

    if (access) {
      localStorage.setItem("access", access);
      localStorage.setItem("token", access); // tu UI a veces usa "token"
    }
    if (refresh) localStorage.setItem("refresh", refresh);
    if (userId != null) localStorage.setItem("userId", String(userId));
    if (roleName) localStorage.setItem("role", roleName);
    if (permissions) localStorage.setItem("permissions", JSON.stringify(permissions));
  };

  /** Obtiene role y permisos si el backend del login facial no los envía */
  const hydrateRoleAndPerms = async (userId: number) => {
    try {
      const [u, perms] = await Promise.all([
        getUserById(userId),
        getUserPermissions(userId),
      ]);
      const roleName = u?.role?.name ?? null;
      const permissions = Array.isArray(perms) ? perms : null;
      saveSession({ roleName, permissions });
    } catch {
      // silencioso
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email) newErrors.email = "El correo es obligatorio";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) newErrors.email = "Ingresa un correo válido";
    if (!formData.password) newErrors.password = "La contraseña es obligatoria";
    else if (formData.password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormData]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoginError("");

    let resp: any;
    try {
      // Se asume que login(email, pass) devuelve { access, refresh, user:{id,role{name}}, permissions? }
      resp = await login(formData.email, formData.password);

      const access = resp?.access ?? resp?.token ?? null;
      const refresh = resp?.refresh ?? null;
      const userId = resp?.user?.id ?? resp?.id ?? null;
      const roleName =
        resp?.user?.role?.name ??
        resp?.role?.name ??
        null;
      const permissions = resp?.permissions ?? resp?.user?.permissions ?? null;

      saveSession({ access, refresh, userId, roleName, permissions });

      try { await registrarBitacora(userId ?? undefined, "Inicio de sesión", "exitoso"); } catch {}
      navigate("/dashboard", { replace: true });
    } catch (error) {
      try { await registrarBitacora(resp?.user?.id ?? resp?.id, "Inicio de sesión", "fallido"); } catch {}
      setLoginError(error instanceof Error ? error.message : "Error de conexión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFaceCapture = async (blob: Blob) => {
    setFaceLoading(true);
    setFaceMsg(null);

    try {
      const res = await aiFaceLogin(blob);

      if (!("recognized" in res) || !res.recognized) {
        setFaceMsg(("detail" in res && res.detail) ? res.detail : "No se reconoció tu rostro. Intenta de nuevo o usa tu contraseña.");
        return;
      }

      // Normalizamos por si el backend varía las claves
      const access = res.access ?? null;
      const refresh = res.refresh ?? null;
      const userId = res.user?.id ?? res.user_id ?? null;

      const roleName =
        res.user?.role?.name ??
        res.role?.name ??
        null;

      const permissions =
        res.user?.permissions ??
        res.permissions ??
        null;

      // Necesitamos access + userId para comportarnos igual que en login por correo
      if (access && userId != null) {
        saveSession({ access, refresh, userId, roleName, permissions });

        // Si no vino rol/permisos, los traemos rápido
        if (!roleName || !permissions) {
          await hydrateRoleAndPerms(userId);
        }

        const name = res.user?.first_name ? ` ${res.user.first_name}` : "";
        const sim = Math.round(res.similarity ?? 0);
        setFaceMsg(`Bienvenido${name}. Similaridad ${sim}%.`);
        navigate("/dashboard", { replace: true });
        return;
      }

      // Si no hay tokens, no conviene avanzar
      if (!access) {
        const sim = Math.round(res.similarity ?? 0);
        setFaceMsg(
          `Rostro reconocido (ID ${userId ?? "?"}) con ${sim}%. ` +
          `Configura el backend para devolver tokens (access/refresh) y rol/permisos.`
        );
        return;
      }

      setFaceMsg("Reconocido, pero faltan datos. Ajusta el backend para devolver tokens y usuario.");
    } catch (e: any) {
      setFaceMsg(e?.response?.data?.detail ?? "Error al intentar login facial.");
    } finally {
      setFaceLoading(false);
      setFaceOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="mt-2 text-gray-600">Accede a tu cuenta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Correo"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium text-white transition-colors ${
                  isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setFaceMsg(null); setFaceOpen(true); }}
                disabled={faceLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
              >
                {faceLoading ? "Procesando…" : "Ingresar con rostro"}
              </button>
            </div>

            {faceMsg && <p className="text-center text-sm text-gray-600">{faceMsg}</p>}
          </form>
        </div>
      </div>

      <FaceCapture
        open={faceOpen}
        onClose={() => !faceLoading && setFaceOpen(false)}
        onCapture={onFaceCapture}
        title="Login con reconocimiento facial"
      />
    </div>
  );
};

export default Login;

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn, Camera, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { registrarBitacora } from "../api/bitacora";
import { getUserById, getUserPermissions } from "../api/users";
import { aiFaceLogin, visitorLogin, visitorRegister } from "../api/ai";
import FaceCapture from "../components/FaceCapture";
import Webcam from "react-webcam";

/* =================== Tipos =================== */
interface LoginFormData {
  email: string;
  password: string;
}

/* =================== Componente =================== */
const Login = () => {
  const navigate = useNavigate();

  // Email/password
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  /* ====== Login con rostro (USUARIOS YA REGISTRADOS) ====== */
  const [faceOpen, setFaceOpen] = useState(false);
  const [faceMsg, setFaceMsg] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);

  /* ====== Flujo VISITANTE (botón y modal aparte) ====== */
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [visitorMsg, setVisitorMsg] = useState<string | null>(null);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [needRegister, setNeedRegister] = useState(false);
  const [vFirst, setVFirst] = useState("");
  const [vLast, setVLast] = useState("");
  const camRef = useRef<Webcam>(null);

  /* ===== Helpers de sesión (compatibles con tu app) ===== */
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
      localStorage.setItem("token", access);
    }
    if (refresh) localStorage.setItem("refresh", refresh);
    if (userId != null) localStorage.setItem("userId", String(userId));
    if (roleName) localStorage.setItem("role", roleName);
    if (permissions) localStorage.setItem("permissions", JSON.stringify(permissions));
  };

  const hydrateRoleAndPerms = async (userId: number) => {
    try {
      const [u, perms] = await Promise.all([getUserById(userId), getUserPermissions(userId)]);
      const roleName = u?.role?.name ?? null;
      const permissions = Array.isArray(perms) ? perms : null;
      saveSession({ roleName, permissions });
    } catch {}
  };

  /* ===== Validación y handlers del login normal ===== */
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormData]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoginError("");

    let resp: any;
    try {
      resp = await login(formData.email, formData.password);

      const access = resp?.access ?? resp?.token ?? null;
      const refresh = resp?.refresh ?? null;
      const userId = resp?.user?.id ?? resp?.id ?? null;
      const roleName = resp?.user?.role?.name ?? resp?.role?.name ?? null;
      const permissions = resp?.permissions ?? resp?.user?.permissions ?? null;

      saveSession({ access, refresh, userId, roleName, permissions });
      try {
        await registrarBitacora(userId ?? undefined, "Inicio de sesión", "exitoso");
      } catch {}
      navigate("/dashboard", { replace: true });
    } catch (error) {
      try {
        await registrarBitacora(resp?.user?.id ?? resp?.id, "Inicio de sesión", "fallido");
      } catch {}
      setLoginError(error instanceof Error ? error.message : "Error de conexión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ====== Login con rostro (usuarios ya registrados) ====== */
  const onFaceCapture = async (blob: Blob) => {
    setFaceLoading(true);
    setFaceMsg(null);
    try {
      const res = await aiFaceLogin(blob);

      if (!("recognized" in res) || !res.recognized) {
        setFaceMsg(("detail" in res && res.detail) ? res.detail : "No se reconoció tu rostro. Intenta de nuevo.");
        return;
      }

      const access = res.access ?? null;
      const refresh = res.refresh ?? null;
      const userId = res.user?.id ?? res.user_id ?? null;
      const roleName = res.user?.role?.name ?? (typeof res.role === "object" ? res.role?.name : (res as any).role) ?? null;
      const permissions = res.user?.permissions ?? (res as any).permissions ?? null;

      if (access && userId != null) {
        saveSession({ access, refresh, userId, roleName, permissions });
        if (!roleName || !permissions) await hydrateRoleAndPerms(userId);
        const sim = Math.round(res.similarity ?? 0);
        setFaceMsg(`Similaridad ${sim}%.`);
        navigate("/dashboard", { replace: true });
        return;
      }

      if (!access) {
        const sim = Math.round(res.similarity ?? 0);
        setFaceMsg(`Rostro reconocido (ID ${userId ?? "?"}) con ${sim}%. Configura backend para tokens.`);
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

  /* ====== Flujo VISITANTE (modal y registro inline) ====== */
  const takePhotoBlob = async (): Promise<Blob> => {
    const dataUrl = camRef.current?.getScreenshot();
    if (!dataUrl) throw new Error("No se pudo capturar la imagen");
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const doVisitorLogin = async () => {
    setVisitorLoading(true);
    setVisitorMsg(null);
    setNeedRegister(false);
    try {
      const blob = await takePhotoBlob();
      const r = await visitorLogin(blob);

      if (!r.ok) {
        setVisitorMsg("No estás registrado como visitante. Completa tus datos para registrarte.");
        setNeedRegister(true);
        return;
      }

      // tokens, role y permissions
      const access = r.access ?? (r as any).user?.access ?? null;
      const refresh = r.refresh ?? null;
      const userId = r.user_id!;
      const roleName =
        (typeof r.role === "string" ? r.role : r.role?.name) ??
        (r as any).user?.role?.name ??
        "Visitante";
      const permissions = r.permissions ?? (r as any).user?.permissions ?? null;

      saveSession({ access, refresh, userId, roleName, permissions });

      setVisitorMsg(`Bienvenido ${roleName}. Similaridad: ${Math.round(r.similarity ?? 0)}%.`);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404 || status === 403) {
        setNeedRegister(true);
        setVisitorMsg("No estás registrado como visitante. Completa tus datos para registrarte.");
      } else {
        setVisitorMsg(e?.response?.data?.detail ?? "Error al intentar login de visitante.");
      }
    } finally {
      setVisitorLoading(false);
    }
  };

  const doVisitorRegister = async () => {
    if (!vFirst.trim() || !vLast.trim()) {
      setVisitorMsg("Completa nombre y apellido.");
      return;
    }
    setVisitorLoading(true);
    setVisitorMsg(null);
    try {
      const blob = await takePhotoBlob();
      const r = await visitorRegister(vFirst.trim(), vLast.trim(), blob);
      if (!r.ok) {
        setVisitorMsg(r.detail ?? "No se pudo registrar. Inténtalo de nuevo.");
        return;
      }
      setVisitorMsg("Registro exitoso. Intentando iniciar sesión…");
      await doVisitorLogin();
    } catch (e: any) {
      setVisitorMsg(e?.response?.data?.detail ?? "Error registrando visitante.");
    } finally {
      setVisitorLoading(false);
    }
  };

  const closeVisitor = () => {
    if (visitorLoading) return;
    setVisitorOpen(false);
    setVisitorMsg(null);
    setNeedRegister(false);
    setVFirst("");
    setVLast("");
  };

  useEffect(() => {
    setVisitorMsg(null);
  }, [needRegister]);

  /* =================== UI =================== */
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

              {/* Botón 1: rostro (usuarios) */}
              <button
                type="button"
                onClick={() => {
                  setFaceMsg(null);
                  setFaceOpen(true);
                }}
                disabled={faceLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
              >
                {faceLoading ? "Procesando…" : "Ingresar con rostro"}
              </button>

              {/* Botón 2: Visitantes */}
              <button
                type="button"
                onClick={() => {
                  setVisitorMsg(null);
                  setVisitorOpen(true);
                }}
                disabled={visitorLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 sm:col-span-2"
              >
                {visitorLoading ? "Procesando…" : "Ingresar como visitante"}
              </button>
            </div>

            {faceMsg && <p className="text-center text-sm text-gray-600">{faceMsg}</p>}
          </form>
        </div>
      </div>

      {/* ============== Modal: Login con rostro ============== */}
      <FaceCapture
        open={faceOpen}
        onClose={() => !faceLoading && setFaceOpen(false)}
        onCapture={onFaceCapture}
        title="Login con reconocimiento facial"
      />

      {/* ============== Modal: Visitante ============== */}
      {visitorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {needRegister ? "Registrarse como visitante" : "Ingresar como visitante"}
              </h3>
              <button onClick={closeVisitor} className="text-gray-500 hover:text-gray-700 text-sm" disabled={visitorLoading}>
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video">
                <Webcam ref={camRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
              </div>

              {!needRegister ? (
                <button
                  onClick={doVisitorLogin}
                  disabled={visitorLoading}
                  className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {visitorLoading ? "Verificando…" : "Tomar foto e ingresar"}
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={vFirst}
                      onChange={(e) => setVFirst(e.target.value)}
                      placeholder="Nombre"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={vLast}
                      onChange={(e) => setVLast(e.target.value)}
                      placeholder="Apellido"
                      className="border rounded-lg px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={doVisitorRegister}
                    disabled={visitorLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {visitorLoading ? "Registrando…" : "Registrarme y volver a intentar"}
                  </button>
                </>
              )}

              {visitorMsg && <p className="text-sm text-center text-gray-700">{visitorMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

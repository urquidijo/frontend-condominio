import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  type CommonArea,
} from "../api/commons";

// ===== Modal accesibilidad
Modal.setAppElement("#root");

// ===== Helpers de tiempo
const toHHMM = (t?: string) => {
  if (!t) return "";
  const [h = "00", m = "00"] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};
const toHHMMSS = (t?: string) => {
  if (!t) return "";
  const [h = "00", m = "00", s = "00"] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
};

// ===== Helpers de rol (lee localStorage.role)
const readRole = (): string => {
  try {
    const raw = localStorage.getItem("role") ?? "";
    return raw.replace(/^"|"$/g, ""); // por si viene con comillas
  } catch {
    return "";
  }
};
const isAdminRole = (role: string) => {
  const r = (role || "").toLowerCase();
  return r === "administrador" || r === "administrator" || r === "admin";
};

// ===== Constantes
const ESTADOS: CommonArea["estado"][] = ["DISPONIBLE", "MANTENIMIENTO", "CERRADO"];
const estadoTone = (e: CommonArea["estado"]) =>
  e === "DISPONIBLE"
    ? "bg-green-100 text-green-800"
    : e === "MANTENIMIENTO"
    ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";

type AreaFormData = {
  nombre: string;
  descripcion: string;
  capacidad: number;
  ubicacion: string;
  estado: CommonArea["estado"];
  horario_apertura: string; // HH:MM
  horario_cierre: string;   // HH:MM
};

export default function Areas() {
  // ===== rol
  const role = useMemo(() => readRole(), []);
  const isAdmin = isAdminRole(role);

  // ===== estado de la vista
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<CommonArea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorTop, setErrorTop] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ===== formulario
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      capacidad: 0,
      ubicacion: "",
      estado: "DISPONIBLE",
      horario_apertura: "08:00",
      horario_cierre: "18:00",
    },
  });
  const watchedApertura = watch("horario_apertura");
  const watchedCierre = watch("horario_cierre");

  // ===== cargar áreas
  const fetchAreas = async () => {
    try {
      setErrorTop(null);
      setLoading(true);
      const data = await getAreas();
      setAreas(data);
    } catch (e: any) {
      setErrorTop(e?.response?.data?.detail || "Error al cargar áreas.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAreas(); }, []);

  // ===== acciones (con guardas de admin)
  const openCreate = () => {
    if (!isAdmin) { alert("No autorizado. Solo administradores pueden crear áreas."); return; }
    setIsEditing(false);
    setEditingId(null);
    reset({
      nombre: "",
      descripcion: "",
      capacidad: 0,
      ubicacion: "",
      estado: "DISPONIBLE",
      horario_apertura: "08:00",
      horario_cierre: "18:00",
    });
    setShowModal(true);
  };

  const openEdit = (area: CommonArea) => {
    if (!isAdmin) { alert("No autorizado. Solo administradores pueden modificar áreas."); return; }
    setIsEditing(true);
    setEditingId(area.id);
    reset({
      nombre: area.nombre,
      descripcion: area.descripcion || "",
      capacidad: area.capacidad,
      ubicacion: area.ubicacion || "",
      estado: area.estado,
      horario_apertura: toHHMM(area.horario_apertura),
      horario_cierre: toHHMM(area.horario_cierre),
    });
    setShowModal(true);
  };

  const onSubmit = async (data: AreaFormData) => {
    if (!isAdmin) { alert("No autorizado."); return; }

    if (data.horario_apertura >= data.horario_cierre) {
      alert("El horario de apertura debe ser menor al de cierre.");
      return;
    }

    const payload: Partial<CommonArea> = {
      ...data,
      horario_apertura: toHHMMSS(data.horario_apertura),
      horario_cierre: toHHMMSS(data.horario_cierre),
    };

    try {
      if (isEditing && editingId) {
        await updateArea(editingId, payload);
      } else {
        await createArea(payload as Omit<CommonArea, "id">);
      }
      setShowModal(false);
      await fetchAreas();
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.non_field_errors?.[0] ||
        "No se pudo guardar. Revisa los datos.";
      alert(msg);
    }
  };

  const askDelete = (area: CommonArea) => {
    if (!isAdmin) { alert("No autorizado. Solo administradores pueden eliminar áreas."); return; }
    setDeleteModal(area);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    if (!isAdmin) { alert("No autorizado."); return; }

    setDeleteLoading(true);
    try {
      await deleteArea(deleteModal.id);
      await fetchAreas();
      setDeleteModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "No se pudo eliminar el área.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Áreas Comunes</h1>

          {/* SOLO ADMIN: botón Nueva Área */}
          {isAdmin && (
            <button
              onClick={openCreate}
              className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nueva Área</span>
            </button>
          )}
        </div>

        {/* Error de carga */}
        {errorTop && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {errorTop}
            </div>
          </div>
        )}

        {/* Grid de áreas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando áreas...</p>
          </div>
        ) : areas.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-base sm:text-lg text-gray-600">No hay áreas registradas</p>
            <p className="text-sm mt-1 text-gray-500">Crea tu primera área para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {areas.map((area) => (
              <div
                key={area.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-lg text-gray-900 truncate">
                    {area.nombre}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoTone(area.estado)}`}>
                    {area.estado}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {area.descripcion || "Sin descripción"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{area.ubicacion || "Sin ubicación"}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>Capacidad: {area.capacidad} personas</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{toHHMM(area.horario_apertura)} - {toHHMM(area.horario_cierre)}</span>
                  </div>
                </div>

                {/* SOLO ADMIN: acciones */}
                {isAdmin ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(area)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => askDelete(area)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== Modal crear/editar área (solo abre si isAdmin) ===== */}
        <Modal
          isOpen={showModal}
          onRequestClose={() => !isSubmitting && setShowModal(false)}
          contentLabel={isEditing ? "Editar Área" : "Nueva Área"}
          className="relative z-50 bg-white w-full max-w-2xl p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 z-40 flex justify-center items-start sm:items-center p-3 sm:p-6 bg-white/45 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {isEditing ? "Editar Área" : "Nueva Área"}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  {...register("nombre", { required: "El nombre es obligatorio" })}
                  className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Salón de eventos"
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input
                  {...register("ubicacion")}
                  className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Torre A - Piso 1"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                {...register("descripcion")}
                rows={3}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe el área común..."
              />
            </div>

            {/* Capacidad y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
                <input
                  {...register("capacidad", {
                    required: "La capacidad es obligatoria",
                    min: { value: 1, message: "La capacidad debe ser mayor a 0" },
                    valueAsNumber: true,
                  })}
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                {errors.capacidad && <p className="text-red-500 text-sm mt-1">{errors.capacidad.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  {...register("estado")}
                  className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horario de apertura *</label>
                <input
                  {...register("horario_apertura", { required: "El horario de apertura es obligatorio" })}
                  type="time"
                  className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.horario_apertura && <p className="text-red-500 text-sm mt-1">{errors.horario_apertura.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horario de cierre *</label>
                <input
                  {...register("horario_cierre", { required: "El horario de cierre es obligatorio" })}
                  type="time"
                  className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.horario_cierre && <p className="text-red-500 text-sm mt-1">{errors.horario_cierre.message}</p>}
              </div>
            </div>

            {/* Validación de horarios */}
            {watchedApertura && watchedCierre && watchedApertura >= watchedCierre && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                El horario de apertura debe ser menor al de cierre.
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear área"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>

        {/* ===== Modal eliminar área (solo admin) ===== */}
        <Modal
          isOpen={!!deleteModal}
          onRequestClose={() => !deleteLoading && setDeleteModal(null)}
          contentLabel="Eliminar Área"
          className="relative z-50 bg-white w-full max-w-sm sm:max-w-md p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 z-40 flex justify-center items-start sm:items-center p-3 sm:p-6 bg-white/45 backdrop-blur-md"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Área</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar el área <strong>"{deleteModal?.nombre}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

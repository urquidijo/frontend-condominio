import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2 } from "lucide-react";
import Modal from "react-modal";
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../api/notices";
import type { Notice } from "../api/notices";

Modal.setAppElement("#root");

type Priority = "ALTA" | "MEDIA" | "BAJA";
interface NewNotice { title: string; content: string; priority: Priority; }

// Helpers de rol
const readRole = (): string => {
  try {
    const raw = localStorage.getItem("role") ?? "";
    // a veces viene con comillas si lo guardan serializado
    return raw.replace(/^"|"$/g, "");
  } catch { return ""; }
};
const isAdminRole = (role: string) => {
  const r = (role || "").toLowerCase();
  return r === "administrador" || r === "administrator" || r === "admin";
};

const NoticesSystem: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Notice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lee el rol desde localStorage (según tu screenshot)
  const role = useMemo(() => readRole(), []);
  const isAdmin = isAdminRole(role);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewNotice>({ defaultValues: { title: "", content: "", priority: "MEDIA" } });

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (error) {
      console.error("❌ Error cargando avisos:", error);
    }
  };

  const onSubmit = async (values: NewNotice) => {
    // Guardia dura en cliente: sólo admin
    if (!isAdmin) {
      alert("No autorizado. Solo administradores pueden crear o modificar avisos.");
      return;
    }
    try {
      if (isEditing && selectedNotice) {
        await updateNotice(selectedNotice.id, values);
      } else {
        await createNotice(values);
      }
      reset({ title: "", content: "", priority: "MEDIA" });
      setShowModal(false);
      await fetchNotices();
    } catch (error) {
      console.error("❌ Error guardando aviso:", error);
      alert(isEditing ? "No se pudo editar el aviso" : "No se pudo crear el aviso");
    }
  };

  const openCreateModal = () => {
    if (!isAdmin) { alert("No autorizado."); return; }
    setIsEditing(false);
    setSelectedNotice(null);
    reset({ title: "", content: "", priority: "MEDIA" });
    setShowModal(true);
  };

  const openEditModal = (notice: Notice) => {
    if (!isAdmin) { alert("No autorizado."); return; }
    setSelectedNotice(notice);
    setIsEditing(true);
    reset({ title: notice.title, content: notice.content, priority: notice.priority as Priority });
    setShowModal(true);
  };

  const openDeleteModal = (notice: Notice) => {
    if (!isAdmin) { alert("No autorizado."); return; }
    setDeleteModal(notice);
  };

  const handleDeleteNotice = async () => {
    if (!deleteModal) return;
    if (!isAdmin) { alert("No autorizado."); return; }
    setDeleteLoading(true);
    try {
      await deleteNotice(deleteModal.id);
      await fetchNotices();
      setDeleteModal(null);
    } catch (error) {
      console.error("❌ Error eliminando aviso:", error);
      alert("No se pudo eliminar el aviso");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("es-ES");
  const getPriorityColor = (priority: Priority) =>
    priority === "ALTA" ? "bg-red-100 text-red-800"
    : priority === "MEDIA" ? "bg-yellow-100 text-yellow-800"
    : "bg-green-100 text-green-800";

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Gestión de Avisos</h1>

          {/* SOLO ADMIN: botón Nuevo */}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Aviso</span>
            </button>
          )}
        </div>

        {/* Modal crear/editar (solo se abre si es admin) */}
        <Modal
          isOpen={showModal}
          onRequestClose={() => !isSubmitting && setShowModal(false)}
          contentLabel={isEditing ? "Editar Aviso" : "Crear Aviso"}
          className="relative z-50 bg-white w-full max-w-md sm:max-w-lg md:max-w-xl p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 z-40 flex justify-center items-start sm:items-center p-3 sm:p-6 bg-white/45 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {isEditing ? "Editar Aviso" : "Nuevo Aviso"}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Título del aviso"
                aria-invalid={!!errors.title}
                {...register("title", { required: "El título es obligatorio", maxLength: { value: 120, message: "Máximo 120 caracteres" } })}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <textarea
                placeholder="Contenido del aviso"
                rows={6}
                aria-invalid={!!errors.content}
                {...register("content", { required: "El contenido es obligatorio" })}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content.message}</p>}
            </div>

            <div>
              <select
                aria-invalid={!!errors.priority}
                {...register("priority", { required: "La prioridad es obligatoria" })}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALTA">ALTA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="BAJA">BAJA</option>
              </select>
              {errors.priority && <p className="text-red-600 text-xs mt-1">{errors.priority.message}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (isEditing ? "Guardando..." : "Creando...") : (isEditing ? "Guardar" : "Crear")}
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

        {/* Modal eliminar (solo se abre si es admin) */}
        <Modal
          isOpen={!!deleteModal}
          onRequestClose={() => !deleteLoading && setDeleteModal(null)}
          contentLabel="Eliminar Aviso"
          className="relative z-50 bg-white w-full max-w-sm sm:max-w-md p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 z-40 flex justify-center items-start sm:items-center p-3 sm:p-6 bg-white/45 backdrop-blur-md"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Aviso</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar el aviso{" "}
              <strong>"{deleteModal?.title}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteNotice}
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

        {/* Tabla avisos (sin columna ID) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full md:min-w-[720px] table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* <th className="p-4 hidden sm:table-cell">ID</th>  ← Eliminado */}
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Título</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Contenido</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Prioridad</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Creado por</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Fecha</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                      {/* ID eliminado */}
                      <td className="p-4 align-top">
                        <div className="text-gray-900 font-medium">{notice.title}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-gray-700 whitespace-pre-wrap break-words">
                          {notice.content}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span
                          className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPriorityColor(
                            notice.priority as Priority
                          )}`}
                        >
                          {notice.priority}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 hidden lg:table-cell align-top">
                        {notice.created_by_username ?? notice.created_by}
                      </td>
                      <td className="p-4 text-gray-600 text-sm hidden lg:table-cell align-top">
                        {formatDate(notice.created_at)}
                      </td>
                      <td className="p-4 align-top">
                        {/* SOLO ADMIN: botones */}
                        {isAdmin ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(notice)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(notice)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-10 sm:p-12">
                      <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H2.5A2.5 2.5 0 005 2h5v5a2.5 2.5 0 012.5 2.5V15z" />
                        </svg>
                        <p className="text-base sm:text-lg">No hay avisos registrados</p>
                        <p className="text-sm mt-1">Los verás aquí cuando existan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticesSystem;

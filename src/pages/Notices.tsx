import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../api/notices";
import type { Notice } from "../api/notices";

// 👇 Prioridades iguales a las de Django
type Priority = "ALTA" | "MEDIA" | "BAJA";

interface NewNotice {
  title: string;
  content: string;
  priority: Priority;
}

const NoticesSystem = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState<NewNotice>({
    title: "",
    content: "",
    priority: "MEDIA",
  });

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🚀 datos del usuario actual (desde localStorage)
  const role = localStorage.getItem("role"); // "Admin", "Trabajador", etc.
  const userId = Number(localStorage.getItem("userId")); // guarda el id cuando haces login

  // cargar avisos desde backend
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (error) {
      console.error("❌ Error cargando avisos:", error);
    }
  };

  // crear aviso
  const handleCreateNotice = async () => {
    try {
      await createNotice(newNotice);
      setNewNotice({ title: "", content: "", priority: "MEDIA" });
      setShowModal(false);
      fetchNotices();
    } catch (error) {
      console.error("❌ Error creando aviso:", error);
      alert("No se pudo crear el aviso");
    }
  };

  // editar aviso
  const handleEditNotice = async () => {
    if (!selectedNotice) return;
    try {
      await updateNotice(selectedNotice.id, newNotice);
      setNewNotice({ title: "", content: "", priority: "MEDIA" });
      setIsEditing(false);
      setShowModal(false);
      fetchNotices();
    } catch (error) {
      console.error("❌ Error editando aviso:", error);
      alert("No se pudo editar el aviso");
    }
  };

  // eliminar aviso
  const handleDeleteNotice = async (id: number) => {
    if (!window.confirm("¿Seguro que quieres eliminar este aviso?")) return;
    try {
      await deleteNotice(id);
      fetchNotices();
    } catch (error) {
      console.error("❌ Error eliminando aviso:", error);
      alert("No se pudo eliminar el aviso");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-ES");
  };

  // 🚀 función para verificar si el usuario puede modificar
  const canModify = (notice: Notice) => {
    return role === "Admin" || notice.created_by === userId;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Avisos</h1>
        {role === "Admin" && (
          <button
            onClick={() => {
              setShowModal(true);
              setIsEditing(false);
              setNewNotice({ title: "", content: "", priority: "MEDIA" });
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Nuevo Aviso
          </button>
        )}
      </div>

      {/* Lista de avisos */}
      <div className="space-y-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-lg shadow p-4 flex justify-between items-start border"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {notice.title}
              </h3>
              <p className="text-sm text-gray-700">{notice.content}</p>
              <span className="text-xs text-gray-500">
                Creado por: {notice.created_by_username ?? notice.created_by} |{" "}
                {formatDate(notice.created_at)} | {notice.priority}
              </span>
            </div>
            {canModify(notice) && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedNotice(notice)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedNotice(notice);
                    setIsEditing(true);
                    setNewNotice({
                      title: notice.title,
                      content: notice.content,
                      priority: notice.priority as Priority,
                    });
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteNotice(notice.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Editar Aviso" : "Nuevo Aviso"}
            </h2>
            <input
              type="text"
              placeholder="Título"
              value={newNotice.title}
              onChange={(e) =>
                setNewNotice({ ...newNotice, title: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />
            <textarea
              placeholder="Contenido"
              value={newNotice.content}
              onChange={(e) =>
                setNewNotice({ ...newNotice, content: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
              rows={4}
            />
            <select
              value={newNotice.priority}
              onChange={(e) =>
                setNewNotice({
                  ...newNotice,
                  priority: e.target.value as Priority,
                })
              }
              className="w-full border p-2 rounded mb-4"
            >
              <option value="ALTA">ALTA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="BAJA">BAJA</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={isEditing ? handleEditNotice : handleCreateNotice}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {isEditing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver */}
      {selectedNotice && !isEditing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">{selectedNotice.title}</h2>
            <p className="text-gray-700 mb-3">{selectedNotice.content}</p>
            <span className="text-sm text-gray-500">
              Creado por: {selectedNotice.created_by_username} |{" "}
              {formatDate(selectedNotice.created_at)} |{" "}
              {selectedNotice.priority}
            </span>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesSystem;

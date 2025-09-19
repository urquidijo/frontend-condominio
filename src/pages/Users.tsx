import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  deleteUser,
  assignRole,
  // 👇 Asegúrate de exportar esto desde ../api/users (ver ejemplo más abajo)
  updateUser,
  type User,
  type CreateUserPayload,
} from "../api/users";
import { getRoles, type Role } from "../api/roles";
import Modal from "react-modal";

Modal.setAppElement("#root");

const roleBadge = (name?: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes("admin")) return "bg-purple-100 text-purple-800";
  if (n.includes("interno")) return "bg-blue-100 text-blue-800";
  if (n.includes("externo")) return "bg-amber-100 text-amber-800";
  if (n.includes("inquil")) return "bg-green-100 text-green-800";
  if (n.includes("coprop")) return "bg-cyan-100 text-cyan-800";
  return "bg-gray-100 text-gray-800";
};

type Mode = "create" | "edit";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [activeUser, setActiveUser] = useState<User | null>(null);

  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState<CreateUserPayload>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_id: null,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data ?? []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data ?? []);
    } catch (err) {
      console.error("Error cargando roles:", err);
    }
  };

  const openCreateModal = () => {
    setMode("create");
    setActiveUser(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role_id: null,
    });
    setOpen(true);
  };

  const openEditModal = (u: User) => {
    setMode("edit");
    setActiveUser(u);
    setForm({
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      email: u.email ?? "",
      // 👇 en edición no usamos password
      password: "",
      role_id: u.role?.id ?? null,
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      await createUser(form);
      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error("Error creando usuario:", err);
      alert("No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      // 1) Actualizamos datos básicos
      await updateUser(activeUser.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        // contraseña NO se envía en edición
      });

      // 2) Si cambió el rol, lo asignamos (si tu backend lo permite también en updateUser, puedes omitir esto)
      await assignRole(activeUser.id, form.role_id);

      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error("Error actualizando usuario:", err);
      alert("No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteModal.id);
      await fetchUsers();
      setDeleteModal(null);
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      alert("No se pudo eliminar el usuario.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Usuarios</h1>

          <button
            onClick={openCreateModal}
            className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
            </svg>
            <span>Crear Usuario</span>
          </button>
        </div>

        {/* Modal crear/editar usuario */}
        <Modal
          isOpen={open}
          onRequestClose={closeModal}
          contentLabel={mode === "create" ? "Crear Usuario" : "Editar Usuario"}
          className="relative z-50 bg-white w-full max-w-md sm:max-w-lg md:max-w-xl p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 z-40 flex justify-center items-start sm:items-center p-3 sm:p-6 bg-white/45 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
            </h2>
            <button
              onClick={closeModal}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                placeholder="Nombre"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                placeholder="Apellido"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* 👇 Solo en modo CREATE mostramos contraseña */}
            {mode === "create" && (
              <input
                placeholder="Contraseña"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}

            <select
              value={form.role_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  role_id: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full border border-gray-300 text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:mt-6">
              <button
                onClick={mode === "create" ? handleCreateUser : handleUpdateUser}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={closeModal}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal eliminar usuario */}
        <Modal
          isOpen={!!deleteModal}
          onRequestClose={() => !deleteLoading && setDeleteModal(null)}
          contentLabel="Eliminar Usuario"
          className="relative z-50 bg-white w-full max-w-sm sm:max-w-md p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 outline-none"
          overlayClassName="fixed inset-0 z-40 flex justify-center items-start sm:items-center p-3 sm:p-6 bg-white/45 backdrop-blur-md"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Usuario</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar a{" "}
              <strong>{deleteModal?.first_name} {deleteModal?.last_name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteUser}
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

        {/* Tabla usuarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full md:min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Usuario</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Rol</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {(users ?? []).length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="text-gray-900 font-medium">
                            {u.first_name} {u.last_name}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-gray-600">{u.email}</td>

                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${roleBadge(u.role?.name ?? "")}`}>
                          {u.role?.name ?? "Sin rol"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteModal(u)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-10 sm:p-12">
                      <div className="text-gray-400">
                        <svg
                          className="w-12 h-12 mx-auto mb-4 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                          />
                        </svg>
                        <p className="text-base sm:text-lg">No hay usuarios registrados</p>
                        <p className="text-sm mt-1">Crea tu primer usuario para comenzar</p>
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

export default Users;

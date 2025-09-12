import React, { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  addPermission,
  removePermission,
  type User,
  type CreateUserPayload,
} from "../api/users";
import { getPermissions, type Permission } from "../api/permissions";
import Modal from "react-modal";
import { getRoles, type Role } from "../api/roles";

Modal.setAppElement("#root");

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [open, setOpen] = useState(false);
  const [permModal, setPermModal] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CreateUserPayload>({
    username: "",
    email: "",
    password: "",
    role_id: null,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
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

  const fetchPermissions = async () => {
    try {
      const data = await getPermissions();
      setPermissions(data ?? []);
    } catch (err) {
      console.error("Error cargando permisos:", err);
    }
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      await createUser(form);
      await fetchUsers();
      setForm({ username: "", email: "", password: "", role_id: null });
      setOpen(false);
    } catch (err) {
      console.error("Error creando usuario:", err);
      alert("No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (user: User, permId: number, hasPerm: boolean) => {
    try {
      if (hasPerm) {
        await removePermission(user.id, permId);
      } else {
        await addPermission(user.id, permId);
      }
      await fetchUsers();
    } catch (err) {
      console.error("Error actualizando permisos:", err);
      alert("No se pudo actualizar permisos.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>

      {/* Botón abrir modal crear usuario */}
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Crear usuario
      </button>

      {/* Modal crear usuario */}
      <Modal
        isOpen={open}
        onRequestClose={() => !loading && setOpen(false)}
        contentLabel="Crear Usuario"
        className="bg-white p-6 rounded shadow-lg max-w-lg mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start"
      >
        <h2 className="text-xl font-bold mb-4">Nuevo usuario</h2>
        <div className="flex flex-col gap-2">
          <input
            placeholder="Usuario"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={form.role_id ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                role_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="border p-2 rounded"
          >
            <option value="">Sin rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateUser}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="bg-gray-400 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal permisos extra */}
      <Modal
        isOpen={!!permModal}
        onRequestClose={() => setPermModal(null)}
        contentLabel="Permisos"
        className="bg-white p-6 rounded shadow-lg max-w-lg mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start"
      >
        <h2 className="text-xl font-bold mb-4">
          Permisos extra para {permModal?.username}
        </h2>
        <div className="flex flex-col gap-2">
          {permissions.map((p) => {
            const hasPerm = permModal?.permissions?.includes(p.code) ?? false;
            return (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasPerm}
                  onChange={() => permModal && togglePermission(permModal, p.id, hasPerm)}
                />
                {p.name} ({p.code})
              </label>
            );
          })}
        </div>
        <div className="mt-4">
          <button
            onClick={() => setPermModal(null)}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Tabla usuarios */}
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">ID</th>
            <th className="p-2">Usuario</th>
            <th className="p-2">Email</th>
            <th className="p-2">Rol</th>
            <th className="p-2">Permisos</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(users ?? []).length > 0 ? (
            users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                    {u.role! ? u.role.name : "—"}
                  </td>
                <td className="p-2">
                  {(u.permissions ?? []).join(", ")}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => setPermModal(u)}
                    className="bg-indigo-600 text-white px-2 py-1 rounded"
                  >
                    Editar permisos
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                No hay usuarios
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Users;

import { useEffect, useMemo, useState } from "react";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
} from "../api/roles";
import { getPermissions, type Permission } from "../api/permissions";

type FormState = {
  name: string;
  description: string;
};

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Role | null>(null);

  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  // =============== Carga inicial ===============
  useEffect(() => {
    (async () => {
      const [rs, ps] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(rs);
      setPerms(ps);
      if (rs.length) selectRole(rs[0]);
    })();
  }, []);

  // =============== Seleccionar rol ===============
  const selectRole = (r: Role) => {
    setSelected(r);
    setForm({ name: r.name, description: r.description ?? "" });

    // Pre-chequear los permisos del rol (según lo que devuelve el backend)
    const preset: Record<number, boolean> = {};
    (r.permissions ?? []).forEach((p) => (preset[p.id] = true));
    setChecked(preset);
  };

  // Crear nuevo
  const startNew = () => {
    setSelected(null);
    setForm({ name: "", description: "" });
    setChecked({});
  };

  // =============== Checkboxes ===============
  const selectedPermissionIds = useMemo(
    () => Object.entries(checked).filter(([, v]) => v).map(([k]) => Number(k)),
    [checked]
  );

  const togglePerm = (id: number) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  // =============== Guardar ===============
  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("El nombre del rol es obligatorio");
      return;
    }
    setLoading(true);
    try {
      if (selected) {
        const updated = await updateRole(selected.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          permission_ids: selectedPermissionIds, // ✅ actualizar permisos junto con el rol
        });
        const rs = await getRoles();
        setRoles(rs);
        const again = rs.find((r) => r.id === updated.id) ?? null;
        if (again) selectRole(again);
        else startNew();
      } else {
        const created = await createRole({
          name: form.name.trim(),
          description: form.description.trim(),
          permission_ids: selectedPermissionIds, // ✅ crear rol con permisos
        });
        const rs = await getRoles();
        setRoles(rs);
        const again = rs.find((r) => r.id === created.id) ?? null;
        if (again) selectRole(again);
        else startNew();
      }
      alert("Rol guardado correctamente");
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el rol");
    } finally {
      setLoading(false);
    }
  };

  // =============== Eliminar ===============
  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`¿Eliminar el rol "${selected.name}"?`)) return;

    setLoading(true);
    try {
      await deleteRole(selected.id);
      const rs = await getRoles();
      setRoles(rs);
      if (rs.length) selectRole(rs[0]);
      else startNew();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el rol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Lista de roles */}
          <div className="md:w-1/3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Roles</h2>
              <button
                onClick={startNew}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Nuevo rol
              </button>
            </div>
            <ul className="divide-y">
              {roles.map((r) => {
                const active = selected?.id === r.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => selectRole(r)}
                      className={`w-full text-left p-3 transition ${
                        active ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {r.description}
                      </div>
                    </button>
                  </li>
                );
              })}
              {roles.length === 0 && (
                <div className="p-4 text-gray-500 text-sm">Sin roles</div>
              )}
            </ul>
          </div>

          {/* Editor */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {selected ? "Editar Rol" : "Crear Rol"}
              </h2>
              {selected && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Nombre del rol"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  placeholder="Descripción"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <div className="font-medium text-gray-900 mb-2">Permisos</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[48vh] overflow-y-auto p-1">
                  {perms.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 border rounded-lg p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={!!checked[p.id]}
                        onChange={() => togglePerm(p.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div>
                        <div className="text-gray-900 text-sm font-medium">
                          {p.name}
                        </div>
                        <div className="text-gray-500 text-xs">{p.code}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={startNew}
                  disabled={loading}
                  className="px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { getUsers, type User } from "../api/users";
import { assignPlate } from "../api/plates";

const PlateAssignForm: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | "">("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getUsers();
        setUsers(list);
      } catch {
        setErr("No se pudieron cargar los usuarios.");
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null); setErr(null);

    if (!userId || !plate.trim()) {
      setErr("Selecciona un usuario e ingresa la placa.");
      return;
    }
    setLoading(true);
    try {
      const p = plate.trim().toUpperCase();
      const res = await assignPlate(Number(userId), p);
      setOk(res.msg || "Placa asignada");
      setPlate("");
    } catch (e: any) {
      setErr(e?.message || "No se pudo asignar la placa."); // 👈 muestra el mensaje real
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Asignar placa a usuario</h3>

      {ok && <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{ok}</div>}
      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>}

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-1 block text-sm font-medium">Usuario</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={userId}
            onChange={(e) => setUserId(Number(e.target.value))}
          >
            <option value="">Selecciona…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {(u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}`.trim() : u.email}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-sm font-medium">Placa</label>
          <input
            value={plate}
            onChange={e => setPlate(e.target.value.toUpperCase())}
            placeholder="Ej: 1852PHD"
            className="w-full rounded-lg border px-3 py-2 uppercase tracking-widest"
          />
        </div>

        <div className="sm:col-span-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlateAssignForm;

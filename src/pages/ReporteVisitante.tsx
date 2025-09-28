// src/pages/ReporteVisitante.tsx
import { useEffect, useState } from "react";
import { fetchVisitorSessions } from "../api/ai";

type Row = {
  id: number;
  full_name: string;
  login_at: string;
  logout_at: string | null;
};

export default function ReporteVisitante() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchVisitorSessions({ page_size: 500, ordering: "-login_at" });
      setRows(res.results as Row[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : "—";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Ingresos y salidas de visitantes</h1>
        <button
          onClick={load}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Visitante</th>
              <th className="px-4 py-2 text-left">Ingreso</th>
              <th className="px-4 py-2 text-left">Salida</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>
                  Sin registros.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.full_name}</td>
                  <td className="px-4 py-2">{fmt(r.login_at)}</td>
                  <td className="px-4 py-2">{fmt(r.logout_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

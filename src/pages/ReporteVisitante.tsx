import { useEffect, useState } from "react";
import { fetchVisitorSessions } from "../api/ai";
import { RefreshCw, Users } from "lucide-react";

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
      const res = await fetchVisitorSessions({
        page_size: 500,
        ordering: "-login_at",
      });
      setRows(res.results as Row[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmt = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Ingresos y salidas de visitantes
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-100 text-gray-800">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Visitante</th>
                <th className="px-6 py-4 text-left font-semibold">Ingreso</th>
                <th className="px-6 py-4 text-left font-semibold">Salida</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-gray-500"
                    colSpan={3}
                  >
                    No hay registros disponibles.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-blue-50/30"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {r.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {fmt(r.login_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {fmt(r.logout_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

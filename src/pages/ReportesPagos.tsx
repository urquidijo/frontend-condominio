import  { useEffect, useState } from "react";
import {
  Calendar,
  User,
  MapPin,
  Download,
  Search,
  ChevronDown,
  DollarSign,
  ExternalLink,
} from "lucide-react";

import {
  getPaymentsReport,
  exportPaymentsReport,
  type PaymentReportRow,
} from "../api/reports";

function money(n: number, currency = "USD") {
  if (!Number.isFinite(n)) n = 0;
  try {
    return new Intl.NumberFormat("es-BO", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)} ${currency}`;
  }
}

const ReportesPagos = () => {
  // filtros
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // id del PriceConfig o "todos"
  const [busqueda, setBusqueda] = useState("");
  // datos
  const [rows, setRows] = useState<PaymentReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const paramsActuales = {
    q: busqueda || undefined,
    tipo_id: filtroTipo !== "todos" ? filtroTipo : undefined,
    fecha: filtroFecha || undefined, // filtra por paid_at en el backend
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getPaymentsReport(paramsActuales);
      setRows(result.results);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };


  const normDash = (s: string) =>
  s
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-") // dashes unicode -> "-"
    .replace(/[\u00A0\u200B\u200C\u200D]/g, "")                  // espacios invisibles
    .trim();

const formatPropLabel = (val?: string) => {
  if (!val) return "-";
  let s = normDash(String(val)).replace(/\s+/g, ""); // quita espacios
  // divide por guiones, quita vacíos
  const parts = s.split("-").filter(Boolean);
  // si el prefijo (A, B, etc.) se repite: A-A-101 -> A-101
  if (parts.length >= 3 && parts[0].toUpperCase() === parts[1].toUpperCase()) {
    parts.splice(1, 1);
  }
  // vuelve a unir como A-101
  if (parts.length >= 2) return `${parts[0]}-${parts.slice(1).join("-")}`;
  return s;
};

  const handleExport = async () => {
    try {
      const blob = await exportPaymentsReport(paramsActuales);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte_pagos.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error exportando:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroTipo, filtroFecha]);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Reportes de pagos</h2>
      <p className="text-gray-600 mb-6">
        Pagos realizados de expensas, multas u otros cargos. Puedes buscar por residente, filtrar por tipo y fecha pagada.
      </p>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Residente, email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tipo de cargo (PriceConfig) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="relative">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                {/* El backend puede inyectar las opciones (ids y nombres) en este endpoint.
                    Si prefieres, puedes precargar un catálogo aparte y mapearlo aquí. */}
                {/* Ejemplo dinámico (si tu backend los agrega en meta):
                    {metaTipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)} */}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Fecha de pago (paid_at) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de pago</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-6">Cargando...</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Residente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Fecha de pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r, idx) => (
                  <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {/* Tipo */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 border-r border-gray-200">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {r.tipo}
                      </div>
                    </td>

                    {/* Propiedad */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                      {formatPropLabel(r.propiedad!)}
                    </td>

                    {/* Residente */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-800">{r.residente}</div>
                          <div className="text-xs text-gray-500">{r.departamento || ""}</div>
                        </div>
                      </div>
                    </td>

                    {/* Fecha de pago */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {r.paid_at || "-"}
                      </div>
                    </td>

                    {/* Monto (y recibo si existe) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          {money(Number(r.monto || "0"), r.moneda || "USD")}
                        </span>
                        {r.recibo_url && (
                          <a
                            href={r.recibo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline inline-flex items-center gap-1"
                          >
                            Comprobante <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No hay pagos para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesPagos;

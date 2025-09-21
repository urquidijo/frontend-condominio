import  {useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Download,
  Search,
  Plus,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import { getUsageReport, exportUsageReport, type UsageReportRow } from "../api/reports";

function money(n: number, currency = "USD") {
  if (!Number.isFinite(n)) n = 0;
  try {
    return new Intl.NumberFormat("es-BO", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)} ${currency}`;
  }
}

const ReportesUsoInstalaciones = () => {
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroInstalacion, setFiltroInstalacion] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [reportesData, setReportesData] = useState<UsageReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const paramsActuales = {
    q: busqueda || undefined,
    area_id: filtroInstalacion !== "todas" ? filtroInstalacion : undefined,
    // filtramos por approved_at
    fecha: filtroFecha || undefined,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getUsageReport(paramsActuales);
      setReportesData(result.results);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportUsageReport(paramsActuales);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte_uso_instalaciones.csv";
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
  }, [busqueda, filtroInstalacion, filtroFecha]);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Reportes de uso de instalaciones
      </h2>
      <p className="text-gray-600 mb-6">
        Consulta qué áreas comunes se están utilizando, por quién, cuándo y cuánto pagaron.
      </p>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
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

          {/* Instalación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instalación
            </label>
            <div className="relative">
              <select
                value={filtroInstalacion}
                onChange={(e) => setFiltroInstalacion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="todas">Todas las instalaciones</option>
                {/* TODO: cargar áreas dinámicamente */}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Fecha (approved_at) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
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
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
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
                    Instalación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Residente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Fecha Aprobada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Horario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Pago
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportesData.map((reporte, index) => (
                  <tr key={reporte.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {/* Instalación */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 border-r border-gray-200">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {reporte.area_nombre}
                      </div>
                    </td>

                    {/* Residente */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-800">{reporte.residente}</div>
                          <div className="text-xs text-gray-500">{reporte.departamento || ""}</div>
                        </div>
                      </div>
                    </td>

                    {/* Fecha aprobada */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {reporte.fecha_aprobada || "-"}
                      </div>
                    </td>

                    {/* Horario */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {reporte.hora_inicio} - {reporte.hora_fin}
                      </div>
                    </td>

                    {/* Pago */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        {money(Number(reporte.pago_monto || "0"), "USD")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesUsoInstalaciones;

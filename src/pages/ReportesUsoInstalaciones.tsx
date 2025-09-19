import  { useState } from "react";
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

const ReportesUsoInstalaciones = () => {
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroInstalacion, setFiltroInstalacion] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const reportesData = [
    {
      id: 1,
      instalacion: "Salón de eventos",
      residente: "Juan Pérez",
      apartamento: "A-301",
      fecha: "20/09/2025",
      horario: "18:00-23:00",
      pago: "Bs. 500",
    },
    {
      id: 2,
      instalacion: "Piscina",
      residente: "Ana López",
      apartamento: "B-205",
      fecha: "22/09/2025",
      horario: "15:00-18:00",
      pago: "Bs. 200",
    },
    {
      id: 3,
      instalacion: "Cancha de fútbol",
      residente: "Carlos Mendoza",
      apartamento: "C-102",
      fecha: "18/09/2025",
      horario: "16:00-18:00",
      pago: "Bs. 300",
    },
  ];

  const instalaciones = [
    "todas",
    "Salón de eventos",
    "Piscina",
    "Cancha de fútbol",
    "Parque de visitas",
  ];

  const datosFiltrados = reportesData.filter((reporte) => {
    const coincideFecha = !filtroFecha || reporte.fecha.includes(filtroFecha);
    const coincideInstalacion =
      filtroInstalacion === "todas" ||
      reporte.instalacion === filtroInstalacion;
    const coincideBusqueda =
      !busqueda ||
      reporte.residente.toLowerCase().includes(busqueda.toLowerCase()) ||
      reporte.apartamento.toLowerCase().includes(busqueda.toLowerCase()) ||
      reporte.instalacion.toLowerCase().includes(busqueda.toLowerCase());

    return coincideFecha && coincideInstalacion && coincideBusqueda;
  });

  return (
    <div className="p-6">
      {/* Encabezado */}
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Residente, apartamento..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por instalación */}
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
                {instalaciones.map((instalacion) => (
                  <option key={instalacion} value={instalacion}>
                    {instalacion === "todas"
                      ? "Todas las instalaciones"
                      : instalacion}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Filtro por fecha */}
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center">
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

      {/* Tabla de reportes */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
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
                  Fecha
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
              {datosFiltrados.map((reporte, index) => (
                <tr
                  key={reporte.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 border-r border-gray-200">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {reporte.instalacion}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-800">
                          {reporte.residente}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reporte.apartamento}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {reporte.fecha}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {reporte.horario}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      {reporte.pago}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportesUsoInstalaciones;

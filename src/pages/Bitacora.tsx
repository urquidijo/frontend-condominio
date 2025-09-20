import { useEffect, useState } from "react";
import { Notebook } from "lucide-react";
import api from "../api/axiosConfig";

interface Bitacora {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  ip: string;
  fecha_entrada: string;
  hora_entrada: string;
  acciones: string;
  estado: string;
}

const Bitacora = () => {
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBitacora = async () => {
      try {
        const response = await api.get("/bitacora/");
        setBitacoras(response.data);
      } catch (error) {
        console.error("Error al cargar la bitácora:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBitacora();
  }, []);

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <Notebook className="w-10 h-10 text-indigo-500" />
        <h2 className="text-3xl font-bold text-gray-800">Bitácora</h2>
      </div>

      <p className="text-gray-600 mb-4">
        Aquí puedes ver todas las acciones registradas en el sistema.
      </p>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">IP</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  Cargando registros...
                </td>
              </tr>
            ) : bitacoras.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No hay registros en la bitácora.
                </td>
              </tr>
            ) : (
              bitacoras.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-700">{item.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.usuario_nombre || "Sin nombre"} <br />
                    <span className="text-xs text-gray-500">{item.usuario_id}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.acciones}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.estado === "exitoso"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.ip}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(item.fecha_entrada).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.hora_entrada}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bitacora;

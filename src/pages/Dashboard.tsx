import { Calendar, Bell, Users, MapPin } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="p-6">
      {/* Encabezado */}
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Bienvenido al Smart Condominium
      </h2>
      <p className="text-gray-600 mb-6">
        Administra fácilmente usuarios, avisos, áreas comunes y reservas desde este panel.
      </p>

      {/* Tarjetas de accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Usuarios</h3>
              <p className="text-sm text-gray-500">Gestionar residentes</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Avisos</h3>
              <p className="text-sm text-gray-500">Comunicados recientes</p>
            </div>
            <Bell className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Áreas Comunes</h3>
              <p className="text-sm text-gray-500">Administrar espacios</p>
            </div>
            <MapPin className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Reservas</h3>
              <p className="text-sm text-gray-500">Tus próximas reservas</p>
            </div>
            <Calendar className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Sección de bienvenida/información */}
      <div className="mt-10 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl text-white">
        <h3 className="text-2xl font-bold">Tu comunidad, en un solo lugar</h3>
        <p className="mt-2 text-lg">
          Con Smart Condominium puedes mantener informados a los residentes,
          gestionar áreas comunes, programar reservas y mucho más, todo desde un panel intuitivo.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

import { Link, useNavigate } from "react-router-dom";
import { hasPermission } from "../hooks/usePermissions";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    navigate("/login");
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <nav className="flex flex-col gap-3 flex-grow">
        <Link to="/dashboard" className="hover:bg-gray-700 p-2 rounded">
          Inicio
        </Link>
        {hasPermission("view_users") && (
          <Link to="/users" className="hover:bg-gray-700 p-2 rounded">
            Usuarios
          </Link>
        )}
        <Link to="/notices" className="hover:bg-gray-700 p-2 rounded">
          Avisos
        </Link>

        {/* ✅ nuevas rutas */}
        
          <Link to="/areas" className="hover:bg-gray-700 p-2 rounded">
            Áreas Comunes
          </Link>
        
        <Link to="/reservations" className="hover:bg-gray-700 p-2 rounded">
          Mis Reservas
        </Link>
  
      </nav>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded mt-auto"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;

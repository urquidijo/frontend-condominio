import { useState } from "react";
import { 
  Home, 
  Users, 
  Bell, 
  MapPin, 
  Calendar, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { hasPermission } from "../hooks/usePermissions"; // si lo tenés definido


const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Obtener información del usuario desde localStorage
  const [userInfo] = useState(() => {
    try {
      const user = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      return {
        name: user ? JSON.parse(user).name || "Usuario" : "Usuario",
        email: user ? JSON.parse(user).email || "usuario@ejemplo.com" : "usuario@ejemplo.com",
        role: role || "Usuario"
      };
    } catch {
      return {
        name: "Usuario",
        email: "usuario@ejemplo.com", 
        role: "Usuario"
      };
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("permissions");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("extra_permissions");
    navigate("/login");
  };

const menuItems = [
  {
    path: "/dashboard",
    label: "Inicio",
    icon: Home,
    permission: null,
  },
  {
    path: "/users",
    label: "Usuarios",
    icon: Users,
    permission: "view_users", 
  },
  {
    path: "/notices",
    label: "Avisos",
    icon: Bell,
    permission: "view_notices", 
  },
  {
    path: "/areas",
    label: "Áreas Comunes",
    icon: MapPin,
    permission: null,
  },
  {
    path: "/reservations",
    label: "Mis Reservas",
    icon: Calendar,
    permission: null,
  },
];


  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl`}>
      
      {/* Header con toggle */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Dashboard
              </h1>
            
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 ml-auto"
            title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userInfo.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {userInfo.role}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg transition-all duration-200 group relative ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25'
                  : 'hover:bg-gray-700 hover:shadow-md'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${
                active ? 'text-white' : 'text-gray-300 group-hover:text-white'
              }`} />
              
              {!isCollapsed && (
                <>
                  <span className={`text-sm font-medium flex-1 text-left ${
                    active ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </>
              )}

              {active && isCollapsed && (
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Botón de cerrar sesión */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 group shadow-lg hover:shadow-red-500/25`}
          title={isCollapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              Cerrar Sesión
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

import { useState } from "react";
import {
  Home,
  User,
  Settings,
  FileText,
  MessageCircle,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut, // 👈 icono para logout
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // 👈 para redirigir

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false); // cerrado en móviles
  const [activeItem, setActiveItem] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {}
  );
  const navigate = useNavigate(); // 👈 hook de navegación

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "profile", label: "Perfil", icon: User, path: "/profile" },
    {
      id: "documents",
      label: "Documentos",
      icon: FileText,
      path: "/documents",
      submenu: [
        { id: "all-docs", label: "Todos los documentos", path: "/documents/all" },
        { id: "recent", label: "Recientes", path: "/documents/recent" },
        { id: "shared", label: "Compartidos", path: "/documents/shared" },
      ],
    },
    { id: "messages", label: "Mensajes", icon: MessageCircle, path: "/messages" },
    { id: "notifications", label: "Notificaciones", icon: Bell, path: "/notifications" },
    { id: "settings", label: "Configuración", icon: Settings, path: "/settings" },
  ];

  const toggleSubmenu = (itemId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("access"); 
    localStorage.removeItem("refresh"); 
    navigate("/login"); 
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay en móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Botón de menú en móviles */}
      <button
        className="absolute top-4 left-4 md:hidden z-50 p-2 bg-gray-900 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 bg-gray-900 text-white transition-transform duration-300 
        ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"} 
        md:translate-x-0 md:w-64`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md hover:bg-gray-700 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            {menuItems.map((item) => (
              <li key={item.id}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    activeItem === item.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => {
                    setActiveItem(item.id);
                    if (item.submenu) toggleSubmenu(item.id);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.submenu && (
                    <div>
                      {expandedMenus[item.id] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                  )}
                </div>

                {/* Submenu */}
                {item.submenu && expandedMenus[item.id] && (
                  <ul className="ml-6 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <li
                        key={subItem.id}
                        className="p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded cursor-pointer transition-colors"
                      >
                        {subItem.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Usuario + Cerrar sesión */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">Usuario</p>
                <p className="text-sm text-gray-400">usuario@email.com</p>
              </div>
            </div>

            {/* Botón logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-red-600 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Contenido Principal</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">Bienvenido</h3>
          <p className="text-gray-600">
            Este es el área de contenido principal. El sidebar ahora es 100% responsive
            y además incluye botón de cerrar sesión abajo 👇.
          </p>
        </div>
      </div>
    </div>
  );
}

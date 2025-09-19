import { useMemo, useState } from "react";
import {
  Home,
  Users,
  Bell,
  MapPin,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  FileText,
  ShieldCheck,
  X,
  Wrench,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { hasPermission } from "../hooks/usePermissions";

type SubItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string | null; // code del permiso o null si siempre visible
};

type Section = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SubItem[];
};

export default function Sidebar({
  variant = "desktop",
  collapsed = false,
  onToggleCollapsed,
  onRequestClose,
}: {
  variant?: "mobile" | "desktop";
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onRequestClose?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = variant === "mobile" ? false : collapsed;

  // Definición estática de secciones con los CODES de permisos
  const sections: Section[] = useMemo(
    () => [
      {
        key: "gestion-usuario",
        label: "Gestión Usuario",
        icon: Users,
        children: [
          { path: "/users", label: "Usuarios", icon: Users, permission: "view_users" },
           { path: "/roles", label: "Roles", icon: ShieldCheck, permission: "view_users" },
        ],
      },
      {
        key: "gestionar-avisos",
        label: "Gestionar Avisos",
        icon: Bell,
        children: [
          { path: "/notices", label: "Avisos", icon: Bell, permission: "view_notices" },
        ],
      },
      {
        key: "gestion-propiedades",
        label: "Gestión Propiedades",
        icon: Home,
        children: [
          { path: "/areas", label: "Áreas Comunes", icon: MapPin, permission: "view_areas" },
          { path: "/reservas", label: "Mis Reservas", icon: Calendar, permission: "view_reservas" },
          { path: "/properties", label: "Propiedades", icon: Calendar, permission: "view_properties" },
          { path: "/reportes-uso", label: "Reportes de Uso", icon: FileText, permission: "view_reportes_uso" },
        ],
      },
      {
        key: "gestion-mantenimiento",
        label: "Gestión de Mantenimiento",
        icon: Wrench,
        children: [
          { path: "/mantenimiento/tareas", label: "Tareas", icon: FileText, permission: "view_mantenimiento_tareas" },
          { path: "/mantenimiento/reportes", label: "Reportes", icon: ShieldCheck, permission: "view_mantenimiento_reportes" },
        ],
      },
      
      { key: "gestionar-reportes", label: "Gestionar Reportes", icon: FileText, children: [] },
      { key: "gestionar-seguridad", label: "Gestionar Seguridad", icon: ShieldCheck, children: [] },
    ],
    
    []
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((s) => {
      initial[s.key] = !!s.children?.some((c) => c.path === location.pathname);
    });
    return initial;
  });

  const toggleSection = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  const isActive = (path: string) => location.pathname === path;

  // Info del usuario (solo para mostrar en el header)
  const [userInfo] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      const role = localStorage.getItem("role") || "Usuario";
      if (raw) {
        const u = JSON.parse(raw);
        const first = u.first_name || "";
        const last = u.last_name || "";
        const name = `${first} ${last}`.trim() || "Usuario";
        const email = u.email || "usuario@ejemplo.com";
        return { name, email, role };
      }
      return { name: "Usuario", email: "usuario@ejemplo.com", role };
    } catch {
      return { name: "Usuario", email: "usuario@ejemplo.com", role: "Usuario" };
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("permissions"); // <-- único almacenamiento de permisos
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
    onRequestClose?.();
    // notificar a la UI (opcional si usas el hook con suscripción)
    window.dispatchEvent(new Event("permissions-changed"));
  };

  return (
    <div
      className={`h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-2xl
      ${variant === "mobile" ? "fixed inset-y-0 left-0 w-64 z-50" : "w-full"}`}
      role="navigation"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Dashboard
            </h1>
          )}
          {variant === "desktop" ? (
            <button
              onClick={onToggleCollapsed}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 ml-auto hidden md:inline-flex"
              title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={onRequestClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 md:hidden"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {/* Usuario */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userInfo.name}</p>
                <p className="text-xs text-gray-400 truncate">{userInfo.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Inicio */}
        <nav className="p-4">
          <button
            onClick={() => {
              navigate("/dashboard");
              onRequestClose?.();
            }}
            className={`w-full grid grid-cols-[24px_minmax(0,1fr)_10px] items-center
              p-3 rounded-lg transition-all duration-200 group mb-2
              ${isActive("/dashboard") ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25" : "hover:bg-gray-700 hover:shadow-md"}`}
            title="Inicio"
          >
            <Home className={`w-5 h-5 ${isActive("/dashboard") ? "text-white" : "text-gray-300 group-hover:text-white"}`} />
            {!isCollapsed && (
              <span className={`text-sm font-medium whitespace-nowrap truncate ${isActive("/dashboard") ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                Inicio
              </span>
            )}
            <span className={`justify-self-end w-2 h-2 rounded-full bg-white ${isActive("/dashboard") ? "opacity-100" : "opacity-0"}`} />
          </button>

          {/* Secciones con permisos */}
          <div className="space-y-2">
            {sections.map((section) => {
              const SectionIcon = section.icon as any;
              const children = section.children ?? [];

              // Filtra hijos por permiso (si no define permission, siempre visible)
              const visibleChildren = children.filter(
                (c) => !c.permission || hasPermission(c.permission)
              );

              // Si la sección tiene hijos pero ninguno visible, ocultamos la sección
              if (children.length > 0 && visibleChildren.length === 0) return null;

              return (
                <div key={section.key} className="rounded-lg">
                  <button
                    onClick={() => (children.length ? toggleSection(section.key) : undefined)}
                    className={`w-full ${isCollapsed ? "justify-center flex" : "flex items-center space-x-3"} p-3 rounded-lg transition-colors duration-200 hover:bg-gray-700`}
                    title={section.label}
                  >
                    <SectionIcon className="w-5 h-5 text-gray-300" />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm font-semibold text-gray-200 flex-1 text-left whitespace-nowrap truncate">
                          {section.label}
                        </span>
                        {children.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {openSections[section.key] ? "−" : "+"}
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  {children.length > 0 && openSections[section.key] && !isCollapsed && (
                    <div className="mt-1">
                      {visibleChildren.map((item) => {
                        const ItemIcon = item.icon as any;
                        const active = isActive(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              onRequestClose?.();
                            }}
                            className={`w-full grid grid-cols-[20px_minmax(0,1fr)_10px] items-center gap-3
                              pl-8 pr-3 py-2 rounded-md transition-all duration-200
                              ${active ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25" : "hover:bg-gray-700"}`}
                            title={item.label}
                          >
                            <ItemIcon className={`w-4 h-4 ${active ? "text-white" : "text-gray-300 group-hover:text-white"}`} />
                            <span className={`text-sm whitespace-nowrap truncate ${active ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                              {item.label}
                            </span>
                            <span className={`justify-self-end w-2 h-2 rounded-full bg-white ${active ? "opacity-100" : "opacity-0"}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`w-full ${isCollapsed ? "justify-center" : "flex items-center space-x-3"} p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 group shadow-lg hover:shadow-red-500/25`}
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

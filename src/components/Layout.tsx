import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // << estado global de colapso desktop
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false); // cierra drawer al navegar en móvil
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar móvil */}
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3 md:hidden">
        <button
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Smart Condominium</h1>
      </header>

      {/* Sidebar fijo desktop: ANCHO depende de collapsed */}
      <aside className={`hidden md:block fixed inset-y-0 left-0 ${collapsed ? "w-20" : "w-64"}`}>
        <Sidebar
          variant="desktop"
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Drawer móvil */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <Sidebar variant="mobile" onRequestClose={() => setMobileOpen(false)} />
      </aside>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Contenido: padding depende de collapsed */}
      <main className={`${collapsed ? "md:pl-20" : "md:pl-64"}`}>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

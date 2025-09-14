import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas
import Login from "./pages/Login";
import Users from "./pages/Users";
import Notices from "./pages/Notices";
import Dashboard from "./pages/Dashboard";
import Areas from "./pages/Areas";

// Componentes
import Layout from "./components/Layout"; // << usa el Layout con sidebar responsive
import { hasPermission } from "./hooks/usePermissions";

function ProtectedRoute({
  children,
  requiredPermission,
}: {
  children: React.ReactNode;
  requiredPermission?: string;
}) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas envueltas en Layout (sidebar + topbar responsive) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="view_users">
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notices"
          element={
            <ProtectedRoute>
              <Layout>
                <Notices />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/areas"
          element={
            <ProtectedRoute>
              <Layout>
                <Areas />
              </Layout>
            </ProtectedRoute>
          }
        />

    

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

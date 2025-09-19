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
import Properties from "./pages/Properties";
import AreasReservaSystem from "./pages/AreasReservaSystem";
import ReportesUsoInstalaciones from "./pages/ReportesUsoInstalaciones";

// Stripe
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import ReportesMantenimiento from "./pages/ReportesMantenimiento";
import TareasDeMantenimiento from "./pages/TareasDeMantenimiento";
import Roles from "./pages/Roles";

const stripePromise = loadStripe(
  "pk_test_51S8ObuRqPjz5OdlnY6NTIP8VgPFbFXjRL6jyvgMAMn2TMCjrlhoiWVjSZvYb50bA6GFHKTvURrR8QEhNcZzjOOnW00pdTYIEgz"
);

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
      {/* 👇 Envolvemos TODAS las rutas en <Elements> */}
      <Elements stripe={stripePromise}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas envueltas en Layout */}
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

          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <Layout>
                  <Properties />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 🚨 Tu ruta de Stripe debe estar dentro de Elements */}
          <Route
            path="/reservas"
            element={
              <ProtectedRoute>
                <Layout>
                  <AreasReservaSystem />
                </Layout>
              </ProtectedRoute>
            }
          />

            <Route
  path="/reportes-uso"
  element={
    <ProtectedRoute>
      <Layout>
        <ReportesUsoInstalaciones />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/mantenimiento/tareas"
  element={
    <ProtectedRoute>
      <Layout>
        <TareasDeMantenimiento />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/mantenimiento/reportes"
  element={
    <ProtectedRoute>
      <Layout>
        <ReportesMantenimiento />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/roles"
  element={
    <ProtectedRoute>
      <Layout>
        <Roles />
      </Layout>
    </ProtectedRoute>
  }
/>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Elements>
    </BrowserRouter>
  );
}

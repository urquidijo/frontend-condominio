import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas
import Login from "./pages/Login";
import Users from "./pages/Users";
import Notices from "./pages/Notices";
import Dashboard from "./pages/Dashboard";
import Areas from "./pages/Areas";

// Componentes
import Sidebar from "./components/Sidebar";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <Dashboard />
              </div>
            </ProtectedRoute>
          }
        />

        {/* users */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="view_users">
              <div className="flex">
                <Sidebar />
                <Users />
              </div>
            </ProtectedRoute>
          }
        />

        {/* notices */}
        <Route
          path="/notices"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <Notices />
              </div>
            </ProtectedRoute>
          }
        />

        {/* áreas comunes */}
        <Route
          path="/areas"
          element={
       
              <div className="flex">
                <Sidebar />
                <Areas />
              </div>
     
          }
        />

        {/* reservas */}
        <Route
          path="/reservations"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
            
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

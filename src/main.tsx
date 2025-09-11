import { createRoot } from "react-dom/client";
import "./index.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmAccount from "./pages/ConfirmAccount";
import Dashboard from "./pages/Dashboard"; // 👈 faltaba este import

// 🚀 Ruta protegida
function ProtectedRoute({ children }: { children: React.ReactNode  }) {
  const token = localStorage.getItem("access");
  return token ? children : <Navigate to="/login" />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm" element={<ConfirmAccount />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

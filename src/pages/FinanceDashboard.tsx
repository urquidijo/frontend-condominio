import { useEffect, useState } from "react";
import {
  getIngresos,
  getIngresosMensuales,
  getGastos,
  getMorosidad,
  getIngresosVsGastos
} from "../api/finance";

import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function FinanceDashboard() {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [morosidad, setMorosidad] = useState<any | null>(null);
  const [balance, setBalance] = useState<any | null>(null);

  useEffect(() => {
    getIngresos().then(res => setIngresos(res.data));
    getIngresosMensuales().then(res => setIngresosMensuales(res.data));
    getGastos().then(res => setGastos(res.data));
    getMorosidad().then(res => setMorosidad(res.data));
    getIngresosVsGastos().then(res => setBalance(res.data));
  }, []);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Dashboard Financiero</h1>

      {/* === Tarjetas rápidas === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {balance && (
          <div className="bg-blue-600 text-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold">Ingresos</h2>
            <p className="text-2xl font-bold">${balance.ingresos}</p>
          </div>
        )}
        {balance && (
          <div className="bg-red-600 text-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold">Gastos</h2>
            <p className="text-2xl font-bold">${balance.gastos}</p>
          </div>
        )}
        {balance && (
          <div className="bg-green-600 text-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold">Balance</h2>
            <p className="text-2xl font-bold">${balance.balance}</p>
          </div>
        )}
        {morosidad && (
          <div className="bg-yellow-500 text-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold">Morosidad</h2>
            <p className="text-2xl font-bold">{morosidad.tasa_morosidad}%</p>
          </div>
        )}
      </div>

      {/* === Gráficas === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ingresos por tipo */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-3">Ingresos por Tipo</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ingresos}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {ingresos.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Flujo de caja mensual */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-3">Flujo de Caja Mensual</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ingresosMensuales}>
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gastos Totales */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-3">Gastos Totales</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gastos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

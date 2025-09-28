import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Settings, Trash2 } from "lucide-react";
import {
  listPriceConfigs,
  createPriceConfig,
  updatePriceConfig,
  deletePriceConfig,
  togglePriceConfig,
  type PriceConfigDTO,
} from "../api/payments";

/* ===========================
 * ViewModel (solo campos reales)
 * =========================== */
type PriceConfigVM = {
  id: number;
  type: string;
  basePrice: number;
  active: boolean;
};

const toNumber = (v: string | number) =>
  typeof v === "number" ? v : Number(v || 0);

const toVM = (d: PriceConfigDTO): PriceConfigVM => ({
  id: d.id,
  type: d.type,
  basePrice: toNumber(d.base_price),
  active: d.active,
});

const ConfigPagos: React.FC = () => {
  const [items, setItems] = useState<PriceConfigVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPrice, setEditingPrice] = useState<PriceConfigVM | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrice, setNewPrice] = useState({ type: "", basePrice: "" });
  const [error, setError] = useState<string | null>(null);

  /* ===========================
   * Cargar lista
   * =========================== */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPriceConfigs();
      setItems(data.map(toVM));
    } catch (e: any) {
      console.error(e);
      setError("No se pudo cargar la configuración de precios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===========================
   * Filtros / derivados
   * =========================== */
  const filtered = useMemo(
    () =>
      items.filter((cfg) =>
        cfg.type.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  );

  /* ===========================
   * Acciones
   * =========================== */
  const handleSavePrice = async () => {
    if (!editingPrice) return;
    if (!editingPrice.type.trim())
      return setError("El tipo es obligatorio.");
    if (!(editingPrice.basePrice >= 0))
      return setError("El precio debe ser >= 0.");

    setError(null);
    try {
      const updated = await updatePriceConfig(editingPrice.id, {
        type: editingPrice.type,
        base_price: editingPrice.basePrice,
        active: editingPrice.active,
      });
      setItems((prev) =>
        prev.map((p) => (p.id === updated.id ? toVM(updated) : p))
      );
      setEditingPrice(null);
    } catch (e: any) {
      console.error(e);
      setError("No se pudo guardar los cambios.");
    }
  };

  const handleDeletePrice = async (id: number) => {
    if (!confirm("¿Eliminar esta configuración?")) return;
    setError(null);
    try {
      await deletePriceConfig(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      console.error(e);
      setError("No se pudo eliminar.");
    }
  };

  const handleAddPrice = async () => {
    if (!newPrice.type.trim()) return setError("El tipo es obligatorio.");
    if (newPrice.basePrice === "" || Number(newPrice.basePrice) < 0)
      return setError("El precio debe ser >= 0.");

    setError(null);
    try {
      const created = await createPriceConfig({
        type: newPrice.type,
        base_price: Number(newPrice.basePrice),
        active: true,
      });
      setItems((prev) => [toVM(created), ...prev]);
      setNewPrice({ type: "", basePrice: "" });
      setShowAddForm(false);
    } catch (e: any) {
      console.error(e);
      setError("No se pudo crear la configuración.");
    }
  };

  const handleToggleActive = async (id: number, active: boolean) => {
    setError(null);
    try {
      const updated = await togglePriceConfig(id, active);
      setItems((prev) =>
        prev.map((p) => (p.id === id ? toVM(updated) : p))
      );
    } catch (e: any) {
      console.error(e);
      setError("No se pudo cambiar el estado.");
    }
  };

  /* ===========================
   * UI
   * =========================== */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Condominio Las Palmas
          </h1>
          <p className="text-gray-500 text-sm">
            Configuración de Cuotas y Servicios
          </p>
        </div>

        {/* Configuración */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configuración de Precios
            </h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por tipo…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {/* Formulario Agregar */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Nuevo Precio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Tipo (ej: Multa Parking)"
                value={newPrice.type}
                onChange={(e) =>
                  setNewPrice({ ...newPrice, type: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="number"
                placeholder="Precio base"
                value={newPrice.basePrice}
                onChange={(e) =>
                  setNewPrice({ ...newPrice, basePrice: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleAddPrice}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
              >
                Guardar
              </button>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewPrice({ type: "", basePrice: "" });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <p>Cargando…</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((config) => (
                <div
                  key={config.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow transition"
                >
                  {editingPrice?.id === config.id ? (
                    // Editando
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={editingPrice.type}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              type: e.target.value,
                            })
                          }
                          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="number"
                          value={editingPrice.basePrice}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              basePrice: Number(e.target.value) || 0,
                            })
                          }
                          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        {/* Toggle switch */}
                        <label className="flex items-center gap-2 text-sm">
                          <span
                            onClick={() =>
                              setEditingPrice({
                                ...editingPrice,
                                active: !editingPrice.active,
                              })
                            }
                            className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition ${
                              editingPrice.active
                                ? "bg-green-500 justify-end"
                                : "bg-gray-300 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                          </span>
                          {editingPrice.active ? "Activo" : "Inactivo"}
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePrice}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Vista normal
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {config.type}
                        </h4>
                        {/* Toggle moderno */}
                        <div className="mt-2">
                          <span
                            onClick={() =>
                              handleToggleActive(config.id, !config.active)
                            }
                            className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition ${
                              config.active
                                ? "bg-green-500 justify-end"
                                : "bg-gray-300 justify-start"
                            }`}
                          >
                            <span className="w-5 h-5 bg-white rounded-full shadow"></span>
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {config.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-semibold text-gray-800">
                          {config.basePrice.toFixed(2)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setEditingPrice(config)}
                            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePrice(config.id)}
                            className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay configuraciones para mostrar.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPagos;

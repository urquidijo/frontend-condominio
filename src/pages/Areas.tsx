import { useState, useEffect } from "react";
import {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  type CommonArea,
} from "../api/commons";
import { Plus } from "lucide-react";
import AreaCard from "../components/AreaCard";

const Areas = () => {
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [newArea, setNewArea] = useState<Partial<CommonArea>>({});
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchAreas = async () => {
    const data = await getAreas();
    setAreas(data);
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSave = async () => {
    if (isEditing && editingId) {
      await updateArea(editingId, newArea);
    } else {
      await createArea(newArea as Omit<CommonArea, "id">);
    }
    setShowModal(false);
    setNewArea({});
    fetchAreas();
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar el área?")) {
      await deleteArea(id);
      fetchAreas();
    }
  };

  const handleEdit = (area: CommonArea) => {
    setIsEditing(true);
    setEditingId(area.id);
    setNewArea(area);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Áreas Comunes</h1>

      {/* Botón visible para todos */}
      <button
        onClick={() => {
          setIsEditing(false);
          setShowModal(true);
          setNewArea({});
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
      >
        <Plus size={18} /> Nueva Área
      </button>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Editar Área" : "Nueva Área"}
            </h2>
            <input
              className="w-full border p-2 mb-2"
              placeholder="Nombre"
              value={newArea.name || ""}
              onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
            />
            <textarea
              className="w-full border p-2 mb-2"
              placeholder="Descripción"
              value={newArea.description || ""}
              onChange={(e) =>
                setNewArea({ ...newArea, description: e.target.value })
              }
            />
            <input
              className="w-full border p-2 mb-2"
              type="number"
              placeholder="Capacidad"
              value={newArea.capacity || ""}
              onChange={(e) =>
                setNewArea({
                  ...newArea,
                  capacity: parseInt(e.target.value, 10),
                })
              }
            />
            <input
              className="w-full border p-2 mb-2"
              type="time"
              value={newArea.availability_start || ""}
              onChange={(e) =>
                setNewArea({
                  ...newArea,
                  availability_start: e.target.value,
                })
              }
            />
            <input
              className="w-full border p-2 mb-2"
              type="time"
              value={newArea.availability_end || ""}
              onChange={(e) =>
                setNewArea({
                  ...newArea,
                  availability_end: e.target.value,
                })
              }
            />
            <input
              className="w-full border p-2 mb-2"
              type="number"
              placeholder="Precio por hora"
              value={newArea.price_per_hour || ""}
              onChange={(e) =>
                setNewArea({
                  ...newArea,
                  price_per_hour: parseFloat(e.target.value),
                })
              }
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;

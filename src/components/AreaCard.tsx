import { Edit, Trash2, Calendar } from "lucide-react";
import type { CommonArea } from "../api/commons";

type Props = {
  area: CommonArea;
  isAdmin?: boolean;
  onEdit?: (area: CommonArea) => void;
  onDelete?: (id: number) => void;
  onReserve?: (area: CommonArea) => void; // opcional si quieres reservar desde la tarjeta
};

export default function AreaCard({
  area,
  isAdmin = false,
  onEdit,
  onDelete,
  onReserve,
}: Props) {
  const price =
    area.price_per_hour > 0 ? `$${area.price_per_hour}/hora` : "Gratis";

  return (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      {/* info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              area.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {area.is_active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <p className="text-sm text-gray-700">{area.description}</p>

        <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
          <span>Capacidad: <strong>{area.capacity}</strong></span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {area.availability_start} – {area.availability_end}
          </span>
          <span>Precio: <strong>{price}</strong></span>
        </div>
      </div>

      {/* acciones */}
      <div className="flex items-center gap-2 sm:self-start">
        {onReserve && (
          <button
            onClick={() => onReserve(area)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
          >
            Reservar
          </button>
        )}

        {isAdmin && (
          <>
            <button
              onClick={() => onEdit?.(area)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Editar"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete?.(area.id)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
              title="Eliminar"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

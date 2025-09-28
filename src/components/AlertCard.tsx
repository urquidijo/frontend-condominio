// frontend/src/components/AlertCard.tsx

import  {type AlertDTO } from "../api/ai";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function badgeClasses(type: AlertDTO["type"]) {
  switch (type) {
    case "dog_loose": return "bg-red-100 text-red-700";
    case "bad_parking": return "bg-amber-100 text-amber-700";
    case "dog_waste": return "bg-rose-100 text-rose-700";
    case "vehicle_seen": 
    default: return "bg-blue-100 text-blue-700";
  }
}

export default function AlertCard({ alert }: { alert: AlertDTO }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 overflow-hidden bg-white">
      <div className="p-4 flex items-center justify-between">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeClasses(alert.type)}`}>
          {alert.type_label}
        </span>
        <span className="text-xs text-gray-500">{formatDate(alert.created_at)}</span>
      </div>

      <div className="aspect-video bg-gray-50 flex items-center justify-center">
        {alert.image_url ? (
          <img
            src={alert.image_url}
            alt={alert.type_label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400 text-sm p-6 text-center">
            Sin imagen disponible
          </div>
        )}
      </div>

      <div className="p-4 text-sm text-gray-600 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">Cámara:</span>
          <span>{alert.camera_id ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Confianza:</span>
          <span>{Math.round(alert.confidence)}%</span>
        </div>
      </div>
    </div>
  );
}

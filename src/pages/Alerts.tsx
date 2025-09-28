// frontend/src/pages/Alerts.tsx
import React from "react";
import { fetchAlerts, type AlertDTO } from "../api/ai";
import AlertCard from "../components/AlertCard";
import VideoUploadCard from "../components/VideoUploadCard"; // ⬅️ nuevo

export default function AlertsPage() {
  const [items, setItems] = React.useState<AlertDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando alertas");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Alertas de Condominio</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded-xl border bg-white hover:bg-gray-50"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* ▶️ Subir video y procesar con IA; al terminar, recarga la lista */}
      <VideoUploadCard
        defaultCameraId="cam1"
        onProcessed={() => load()}
      />

      {loading && <div className="text-gray-500">Cargando…</div>}

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-gray-500">No hay alertas aún.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
      </div>
    </div>
  );
}

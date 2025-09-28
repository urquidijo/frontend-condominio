// frontend/src/components/VideoUploadCard.tsx
import React from "react";
import { uploadAndProcessVideo,type AlertEvent } from "../api/ai";

type Props = {
  /** Llamado cuando termina para que refresques tu grid de alertas (opcional) */
  onProcessed?: (events: AlertEvent[]) => void;
  /** Cámara por defecto */
  defaultCameraId?: string;
};

export default function VideoUploadCard({
  onProcessed,
  defaultCameraId = "cam1",
}: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [cameraId, setCameraId] = React.useState(defaultCameraId);
  const [progress, setProgress] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<AlertEvent[]>([]);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const data = await uploadAndProcessVideo(file, cameraId, setProgress);
      setEvents(data.events || []);
      onProcessed?.(data.events || []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Error subiendo/procesando el video";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video (mp4)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-gray-200 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máx. unos minutos. Se sube a S3 y se analiza con Rekognition.
            </p>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cámara
            </label>
            <select
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full rounded-xl border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="cam1">cam1</option>
              <option value="cam2">cam2</option>
              <option value="cam3">cam3</option>
            </select>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Procesando..." : "Subir y procesar"}
          </button>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="h-2 w-full rounded bg-gray-100">
              <div
                className="h-2 rounded bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-600">{progress}%</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {events.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Eventos detectados
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev) => (
                <div
                  key={ev.id ?? `${ev.type}-${ev.timestamp_ms}`}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <div className="aspect-video bg-gray-50 flex items-center justify-center">
                    {ev.image_url ? (
                      <img
                        src={ev.image_url}
                        alt={ev.type_label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
                        Sin imagen
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {ev.type_label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(ev.confidence)}%
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div>Cámara: {ev.camera_id ?? "-"}</div>
                      <div>
                        Timestamp: {Math.round(ev.timestamp_ms / 1000)}s
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

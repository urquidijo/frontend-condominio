import React from "react";
import { uploadAndProcessVideo, type AlertEvent } from "../api/ai";
import { Upload, Camera, AlertCircle } from "lucide-react";

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
    <div className="w-full mb-8">
      <div className="rounded-2xl border bg-white p-6 shadow-md">
        {/* Header */}
        <div className="mb-5 flex items-center gap-2">
          <Upload className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Subir y procesar video
          </h2>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Archivo */}
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Video (mp4)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-900 
                         file:mr-4 file:rounded-xl file:border-0 
                         file:bg-indigo-50 file:px-4 file:py-2 
                         file:text-sm file:font-semibold file:text-indigo-700
                         hover:file:bg-indigo-100 cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500">
              Máx. unos minutos. Se sube a S3 y se analiza con Rekognition.
            </p>
          </div>

          {/* Cámara */}
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cámara
            </label>
            <select
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full rounded-xl border-gray-300 px-3 py-2 text-sm 
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
            >
              <option value="cam1">Cam 1</option>
              <option value="cam2">Cam 2</option>
              <option value="cam3">Cam 3</option>
            </select>
          </div>

          {/* Botón */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl 
                       bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white 
                       shadow-sm transition hover:bg-indigo-700 
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Upload className="h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir y procesar
              </>
            )}
          </button>
        </div>

        {/* Progreso */}
        {loading && (
          <div className="mt-4">
            <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
              <div
                className="h-2 bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-600">{progress}%</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Eventos */}
        {events.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-gray-800">
              Eventos detectados
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <div
                  key={ev.id ?? `${ev.type}-${ev.timestamp_ms}`}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Imagen */}
                  <div className="aspect-video bg-gray-50 flex items-center justify-center">
                    {ev.image_url ? (
                      <img
                        src={ev.image_url}
                        alt={ev.type_label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {ev.type_label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(ev.confidence)}%
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Camera className="h-3 w-3 text-gray-400" />
                        <span>Cámara: {ev.camera_id ?? "-"}</span>
                      </div>
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

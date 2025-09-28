import React, { useRef, useState, useEffect } from "react";
import { detectPlate } from "../api/ai";
import { verifyPlate } from "../api/plates";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PlateCaptureModal: React.FC<Props> = ({ open, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setErr("No se pudo abrir la cámara.");
      }
    })();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [open]);

  const handleShot = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setErr(null);
    setInfo(null);

    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async blob => {
      if (!blob) return;
      try {
        const file = new File([blob], "placa.jpg", { type: "image/jpeg" });
        const res = await detectPlate(file);

        if (!res?.plate) {
          setInfo("No se detectó ninguna placa. Intenta de nuevo.");
        } else {
          // Verificamos si existe en la BD
          const verifyRes = await verifyPlate(res.plate);
          if (verifyRes.exists) {
            setInfo(`✅ Placa correcta: ${res.plate} está registrada en el sistema.`);
          } else {
            setInfo(`❌ Placa errónea: ${res.plate} no existe en la base de datos.`);
          }
        }
      } catch (e) {
        setErr("Error detectando la placa.");
      } finally {
        setLoading(false);
      }
    }, "image/jpeg", 0.85);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-[720px] max-w-[95vw] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cámara</h3>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Cerrar</button>
        </div>

        {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>}
        {info && <div className={`mb-3 rounded-md border p-3 text-sm ${info.includes("correcta") ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{info}</div>}

        <video ref={videoRef} autoPlay playsInline className="aspect-video w-full rounded-xl bg-black" />

        <div className="mt-4 flex gap-3">
          <button onClick={handleShot} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Procesando..." : "Tomar foto"}
          </button>
          <button onClick={onClose} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default PlateCaptureModal;

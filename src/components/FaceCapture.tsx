import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  width?: number;
};

const FaceCapture: React.FC<Props> = ({ open, title = "Cámara", onClose, onCapture, width = 640 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError("No se pudo abrir la cámara. Revisa permisos del navegador.");
      }
    })();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [open]);

  const handleShot = () => {
    const v = videoRef.current;
    if (!v) return;
    const w = width;
    const h = Math.round((v.videoHeight / v.videoWidth) * w);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    canvas.toBlob(blob => blob && onCapture(blob), "image/jpeg", 0.85);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-[720px] max-w-[95vw] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Cerrar</button>
        </div>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="aspect-video w-full rounded-xl bg-black" onLoadedMetadata={() => videoRef.current?.play()} />
        )}
        <div className="mt-4 flex gap-3">
          <button onClick={handleShot} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Tomar foto</button>
          <button onClick={onClose} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Cancelar</button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Consejo: buena luz, rostro centrado, mirada al frente.</p>
      </div>
    </div>
  );
};

export default FaceCapture;

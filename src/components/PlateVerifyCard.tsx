import React, { useState } from "react";
import PlateCaptureModal from "./PlateCaptureModal";
import { Camera } from "lucide-react";

const PlateVerifyCard: React.FC = () => {
  const [openCam, setOpenCam] = useState(false);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Camera className="h-6 w-6 text-emerald-600" />
        <h3 className="text-lg font-semibold">Verificar placa</h3>
      </div>
      <button
        onClick={() => setOpenCam(true)}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
      >
        Usar cámara
      </button>

      <PlateCaptureModal open={openCam} onClose={() => setOpenCam(false)} />
    </div>
  );
};

export default PlateVerifyCard;

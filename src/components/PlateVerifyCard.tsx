import React, { useState } from "react";
import PlateCaptureModal from "./PlateCaptureModal";

const PlateVerifyCard: React.FC = () => {
  const [openCam, setOpenCam] = useState(false);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Verificar placa</h3>
      <button
        onClick={() => setOpenCam(true)}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
      >
        Usar cámara
      </button>

      <PlateCaptureModal
        open={openCam}
        onClose={() => setOpenCam(false)}
      />
    </div>
  );
};

export default PlateVerifyCard;

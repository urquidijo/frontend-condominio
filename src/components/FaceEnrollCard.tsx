import React, { useEffect, useState } from "react";
import FaceCapture from "./FaceCapture";
import { aiFaceEnroll, aiFaceRevoke, aiFaceStatus } from "../api/ai";

type Props = { userId: number };

const FaceEnrollCard: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("cargando…");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const load = async () => {
    try { const s = await aiFaceStatus(userId); setStatus(s?.status ?? "none"); }
    catch { setStatus("none"); }
  };
  useEffect(() => { load(); }, [userId]);

  const onCapture = async (blob: Blob) => {
    setBusy(true); setInfo(null);
    try { const res = await aiFaceEnroll(userId, blob); setStatus(res?.status ?? "active"); setInfo("Rostro enrolado correctamente."); }
    catch (e: any) { setInfo(e?.response?.data?.detail ?? "Error al enrolar rostro."); }
    finally { setBusy(false); setOpen(false); }
  };

  const onRevoke = async () => {
    setBusy(true); setInfo(null);
    try { await aiFaceRevoke(userId); setStatus("revoked"); setInfo("Rostro eliminado."); }
    catch (e: any) { setInfo(e?.response?.data?.detail ?? "No se pudo eliminar."); }
    finally { setBusy(false); }
  };

  const isActive = status === "active";

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Biometría facial</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
          {status === "none" ? "No enrolado" : status}
        </span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setOpen(true)} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
          {isActive ? "Re-enrolar" : "Enrolar rostro"}
        </button>
        {isActive && (
          <button onClick={onRevoke} disabled={busy} className="rounded-lg border px-3 py-2 hover:bg-gray-50 disabled:opacity-60">
            Quitar rostro
          </button>
        )}
      </div>
      {info && <p className="mt-2 text-sm text-gray-600">{info}</p>}
      <FaceCapture open={open} onClose={() => setOpen(false)} onCapture={onCapture} title="Capturar rostro para enrolamiento" />
    </div>
  );
};

export default FaceEnrollCard;

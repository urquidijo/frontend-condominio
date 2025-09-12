import { useState, useEffect } from "react";
import { getReservations, createReservation, cancelReservation,type  Reservation, getAreas, type CommonArea } from "../api/commons";

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [newReservation, setNewReservation] = useState<{ area: number; start_time: string; end_time: string }>({
    area: 0,
    start_time: "",
    end_time: "",
  });

  const fetchData = async () => {
    setReservations(await getReservations());
    setAreas(await getAreas());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    await createReservation(newReservation);
    setNewReservation({ area: 0, start_time: "", end_time: "" });
    fetchData();
  };

  const handleCancel = async (id: number) => {
    if (confirm("¿Cancelar reserva?")) {
      await cancelReservation(id);
      fetchData();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Reservas</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-2">Nueva Reserva</h2>
        <select
          className="border p-2 mb-2 w-full"
          value={newReservation.area}
          onChange={(e) => setNewReservation({ ...newReservation, area: parseInt(e.target.value) })}
        >
          <option value={0}>Selecciona un área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="border p-2 mb-2 w-full"
          value={newReservation.start_time}
          onChange={(e) => setNewReservation({ ...newReservation, start_time: e.target.value })}
        />
        <input
          type="datetime-local"
          className="border p-2 mb-2 w-full"
          value={newReservation.end_time}
          onChange={(e) => setNewReservation({ ...newReservation, end_time: e.target.value })}
        />
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">
          Reservar
        </button>
      </div>

      <div>
        {reservations.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded shadow mb-2 flex justify-between">
            <div>
              <h3 className="font-bold">{r.area_name}</h3>
              <p>{new Date(r.start_time).toLocaleString()} - {new Date(r.end_time).toLocaleString()}</p>
              <span className="text-sm text-gray-600">Estado: {r.status}</span>
            </div>
            {r.status !== "CANCELADA" && (
              <button onClick={() => handleCancel(r.id)} className="px-3 py-1 bg-red-600 text-white rounded">
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reservations;

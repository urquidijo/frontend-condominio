import { useEffect, useMemo, useState } from "react";
import { Home, Building, Edit3, Trash2, X } from "lucide-react";

import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  addTenant,
  removeTenant,
  type Property,
} from "../api/properties";

import { getAreas, type CommonArea } from "../api/commons";
import { getUsersByRoleName } from "../api/properties";
import type { User } from "../api/users";

type NewProperty = {
  numero: string;
  area: string;
  edificio: string;
  owner_id?: number | null;
};

export default function Properties() {
  // -------- DATA --------
  const [casas, setCasas] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);

  // Owners / Tenants candidates (desde /users/, filtrados por rol)
  const [ownerCandidates, setOwnerCandidates] = useState<User[]>([]);
  const [tenantCandidates, setTenantCandidates] = useState<User[]>([]);

  // CREATE
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newProperty, setNewProperty] = useState<NewProperty>({
    numero: "",
    area: "",
    edificio: "A",
    owner_id: null,
  });

  // UPDATE
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState<Partial<NewProperty>>({});

  // DELETE
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  // TENANTS UI
  const [showTenantsModal, setShowTenantsModal] = useState(false);
  const [tenantToAdd, setTenantToAdd] = useState<number | "">("");

  // AREAS
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);

  // -------- LOAD --------
  useEffect(() => {
    load();
    loadAreas();
    loadUsers();
  }, []);

  const load = async () => {
    const data = await getProperties();
    setCasas(data);
  };

  const loadAreas = async () => {
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    // Filtra por roles exactos como están en tu BD: Copropietario / Inquilino
    const [owners, tenants] = await Promise.all([
      getUsersByRoleName("Copropietario"),
      getUsersByRoleName("Inquilino"),
    ]);
    setOwnerCandidates(owners);
    setTenantCandidates(tenants);
  };

  // -------- HELPERS --------
  const getNextUnitNumber = (edificio: string) => {
    const existingUnits = casas
      .filter((casa) => casa.numero.startsWith(edificio))
      .map((casa) => parseInt(casa.numero.split("-")[1]))
      .sort((a, b) => a - b);

    let nextNumber = 101;
    for (let num of existingUnits) {
      if (num === nextNumber) nextNumber++;
      else break;
    }
    return `${edificio}-${nextNumber}`;
  };

  const ownerLabel = (casa: Property) => {
    if (!casa.owner) return "—";
    const { first_name, last_name, email } = casa.owner;
    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();
    return name || email || `#${casa.owner.id}`;
  };

  const tenantsLabel = (casa: Property) => {
    if (!casa.tenants?.length) return "—";
    return casa.tenants
      .map((t) => {
        const u = t.user;
        const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
        return name || u.email || `#${u.id}`;
      })
      .join(", ");
  };

  const currentCasa = useMemo(
    () => casas.find((c) => c.id === selectedProperty) || null,
    [casas, selectedProperty]
  );

  // etiqueta de estado para áreas
  const estadoClasses = (estado: CommonArea["estado"]) =>
    estado === "DISPONIBLE"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : estado === "MANTENIMIENTO"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-red-100 text-red-800 border-red-300";

  const hhmm = (t?: string) => (t ? t.slice(0, 5) : "—");

  // -------- SELECTORS --------
  const selectProperty = (id: number) => {
    setSelectedArea(null);
    setSelectedProperty((prev) => (prev === id ? null : id));
  };
  const selectArea = (a: CommonArea) => {
    setSelectedProperty(null);
    setSelectedArea((prev) => (prev?.id === a.id ? null : a));
  };

  // -------- CREATE --------
  const handleAddProperty = async () => {
    if (!newProperty.numero || !newProperty.area) {
      alert("Por favor completa al menos el número y área de la propiedad");
      return;
    }
    try {
      const payload = {
        edificio: newProperty.edificio,
        numero: newProperty.numero.toUpperCase().trim(),
        area: newProperty.area,
        owner_id: newProperty.owner_id ?? null,
      };
      const saved = await createProperty(payload);
      setCasas((prev) => [...prev, saved]);
      setNewProperty({ numero: "", area: "", edificio: "A", owner_id: null });
      setShowAddProperty(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la propiedad");
    }
  };

  // -------- UPDATE --------
  const openEdit = (casa: Property) => {
    setEditTarget(casa);
    setEditForm({
      numero: casa.numero,
      area: casa.area?.toString?.() ?? casa.area_m2?.toString?.() ?? "",
      edificio: casa.edificio,
      owner_id: casa.owner?.id ?? null,
    });
    setSelectedArea(null);
    setSelectedProperty(casa.id);
    setShowEdit(true);
  };

  const handleUpdateProperty = async () => {
    if (!editTarget) return;
    try {
      const payload: Partial<NewProperty> = {};
      if (editForm.edificio) payload.edificio = editForm.edificio;
      if (editForm.numero) payload.numero = editForm.numero.toUpperCase().trim();
      if (typeof editForm.owner_id !== "undefined") payload.owner_id = editForm.owner_id;
      if (typeof editForm.area !== "undefined") payload.area = editForm.area;

      const updated = await updateProperty(editTarget.id, payload);
      setCasas((prev) => prev.map((c) => (c.id === editTarget.id ? updated : c)));
      setSelectedProperty(updated.id);
      setShowEdit(false);
      setEditTarget(null);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la propiedad");
    }
  };

  // -------- DELETE --------
  const openDelete = (casa: Property) => {
    setDeleteTarget(casa);
    setShowDelete(true);
  };
  const handleDeleteProperty = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProperty(deleteTarget.id);
      setCasas((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (selectedProperty === deleteTarget.id) setSelectedProperty(null);
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la propiedad");
    }
  };

  // -------- TENANTS (UI + acciones) --------
  const openTenantsModal = (casa: Property) => {
    setSelectedArea(null);
    setSelectedProperty(casa.id);
    setTenantToAdd("");
    setShowTenantsModal(true);
  };

  const handleAddTenant = async () => {
    if (!currentCasa || tenantToAdd === "") return;
    try {
      const tenant = await addTenant(currentCasa.id, Number(tenantToAdd));
      setCasas((prev) =>
        prev.map((c) =>
          c.id === currentCasa.id
            ? {
                ...c,
                tenants: (c.tenants || []).some((t) => t.user.id === tenant.user.id)
                  ? c.tenants
                  : [...(c.tenants || []), tenant],
                estado: "ocupada",
              }
            : c
        )
      );
      setTenantToAdd("");
    } catch (e) {
      console.error(e);
      alert("No se pudo agregar el inquilino.");
    }
  };

  const handleRemoveTenant = async (userId: number) => {
    if (!currentCasa) return;
    try {
      await removeTenant(currentCasa.id, userId);
      setCasas((prev) =>
        prev.map((c) => {
          if (c.id !== currentCasa.id) return c;
          const newTenants = (c.tenants || []).filter((t) => t.user.id !== userId);
          return {
            ...c,
            tenants: newTenants,
            estado: newTenants.length ? "ocupada" : "disponible",
          };
        })
      );
    } catch (e) {
      console.error(e);
      alert("No se pudo quitar el inquilino.");
    }
  };

  // --- Contadores por edificio (si los usas en algún lado) ---
  // const countA = useMemo(
  //   () => casas.filter((c) => c.numero.startsWith("A")).length,
  //   [casas]
  // );
  // const countB = useMemo(
  //   () => casas.filter((c) => c.numero.startsWith("B")).length,
  //   [casas]
  // );

  // -------- RENDER --------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center space-x-3">
            <Building className="w-7 h-7 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Condominio Los Jardines
            </h1>
          </div>
          <button
            onClick={() => {
              setNewProperty((p) => ({
                ...p,
                numero: p.numero || getNextUnitNumber(p.edificio),
              }));
              setShowAddProperty(true);
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Agregar Propiedad</span>
          </button>
        </div>

        {/* Modal CREATE */}
        {showAddProperty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 w-full max-w-md mx-4 relative">
              <button
                onClick={() => setShowAddProperty(false)}
                className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Agregar Nueva Propiedad
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Edificio
                    </label>
                    <select
                      value={newProperty.edificio}
                      onChange={(e) => {
                        const edificio = e.target.value;
                        setNewProperty((p) => ({
                          ...p,
                          edificio,
                          numero: getNextUnitNumber(edificio),
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                    >
                      <option value="A">Edificio A</option>
                      <option value="B">Edificio B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={newProperty.numero}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, numero: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                      placeholder="A-101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Área
                    </label>
                    <input
                      type="text"
                      value={newProperty.area}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, area: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                      placeholder="120 m²"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Dueño (Copropietario)
                    </label>
                    <select
                      value={newProperty.owner_id ?? ""}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          owner_id: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                    >
                      <option value="">— Sin dueño —</option>
                      {ownerCandidates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {(u.first_name || u.last_name)
                            ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                            : u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-5">
                <button
                  onClick={handleAddProperty}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddProperty(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CROQUIS */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 bg-blue-100 inline-block px-4 py-1.5 rounded">
              Condominio Los Jardines - Planta General
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Total de unidades: {casas.length}
            </p>
          </div>

          {/* compacto */}
          <div className="bg-green-100 rounded-lg p-6 min-h-[480px] md:min-h-[520px] border-2 border-green-300 relative">
            {/* áreas */}
            <div className="w-full flex items-center justify-center mb-5">
              <div className="max-w-3xl w-full overflow-x-auto">
                <div className="flex gap-3 px-2">
                  {areas.map((a) => {
                    const estadoStyles =
                      a.estado === "DISPONIBLE"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                        : a.estado === "MANTENIMIENTO"
                        ? "bg-amber-100 border-amber-300 text-amber-900"
                        : "bg-red-100 border-red-300 text-red-900";
                    return (
                      <button
                        key={a.id}
                        onClick={() => selectArea(a)}
                        className={`shrink-0 border rounded-xl px-4 py-2 text-sm font-semibold hover:shadow transition ${estadoStyles}`}
                        title={`${a.nombre} · ${a.estado}`}
                      >
                        {a.nombre}
                      </button>
                    );
                  })}
                  {areas.length === 0 && (
                    <div className="text-gray-500 text-sm">No hay áreas comunes</div>
                  )}
                </div>
              </div>
            </div>

            {/* edificio A */}
            <div className="absolute left-10 top-28">
              <div className="text-center mb-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">
                  EDIFICIO A ({casas.filter((c) => c.numero.startsWith("A")).length})
                </span>
              </div>
              <div className="space-y-2.5 pr-1 max-h-64 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {casas
                  .filter((c) => c.numero.startsWith("A"))
                  .map((casa) => (
                    <div key={casa.id}>
                      <button
                        className={`w-24 h-10 border-2 rounded-md transition-colors
                                    text-xs font-semibold
                                    ${
                                      casa.estado === "ocupada"
                                        ? "bg-blue-300 border-blue-500 text-blue-900"
                                        : "bg-gray-300 border-gray-500 text-gray-700"
                                    }
                                    ${
                                      selectedProperty === casa.id
                                        ? "ring-2 ring-yellow-400"
                                        : ""
                                    }`}
                        onClick={() => selectProperty(casa.id)}
                        title={`Propietario: ${ownerLabel(casa)} · Inq: ${tenantsLabel(casa)}`}
                      >
                        {casa.numero}
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* edificio B */}
            <div className="absolute right-10 top-28">
              <div className="text-center mb-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">
                  EDIFICIO B ({casas.filter((c) => c.numero.startsWith("B")).length})
                </span>
              </div>
              <div className="space-y-2.5 pl-1 max-h-64 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {casas
                  .filter((c) => c.numero.startsWith("B"))
                  .map((casa) => (
                    <div key={casa.id}>
                      <button
                        className={`w-24 h-10 border-2 rounded-md transition-colors
                                    text-xs font-semibold
                                    ${
                                      casa.estado === "ocupada"
                                        ? "bg-blue-300 border-blue-500 text-blue-900"
                                        : "bg-gray-300 border-gray-500 text-gray-700"
                                    }
                                    ${
                                      selectedProperty === casa.id
                                        ? "ring-2 ring-yellow-400"
                                        : ""
                                    }`}
                        onClick={() => selectProperty(casa.id)}
                        title={`Propietario: ${ownerLabel(casa)} · Inq: ${tenantsLabel(casa)}`}
                      >
                        {casa.numero}
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* parque */}
            <div className="absolute left-1/2 top-36 -translate-x-1/2">
              <div className="w-32 h-20 bg-yellow-300 border-2 border-yellow-500 rounded
                              flex items-center justify-center
                              text-yellow-900 font-bold text-sm">
                PARQUE
              </div>
            </div>

            {/* entrada y calle */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-700 text-white flex items-center justify-center text-[11px] font-bold rounded">
              ENTRADA
            </div>
            <div className="absolute -bottom-0.5 left-0 right-0 h-3.5 bg-gray-500">
              <div className="text-center text-white text-[10px] font-semibold">
                Av. Principal
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-5">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Leyenda:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 border border-blue-500"></div>
                <span>Ocupada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 border border-gray-500"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 border border-blue-600"></div>
                <span>Área Común</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-300 border border-yellow-600 rounded-full"></div>
                <span>Seleccionada</span>
              </div>
            </div>
          </div>

          {/* Panel de info */}
          {currentCasa ? (
            <div className="mt-5 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-blue-900 text-base mb-2">
                  Propiedad {currentCasa.numero}
                </h4>
                <div className="space-x-2">
                  <button
                    onClick={() => openEdit(currentCasa)}
                    className="bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 text-xs inline-flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => openTenantsModal(currentCasa)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-xs inline-flex items-center"
                  >
                    Gestionar inquilinos
                  </button>
                  <button
                    onClick={() => openDelete(currentCasa)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-xs inline-flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Propietario:</strong> {ownerLabel(currentCasa)}
                </div>
                <div>
                  <strong>Inquilinos:</strong> {tenantsLabel(currentCasa)}
                </div>
                <div>
                  <strong>Estado:</strong>{" "}
                  <span className="capitalize">{currentCasa.estado}</span>
                </div>
                <div>
                  <strong>Área:</strong> {currentCasa.area ?? currentCasa.area_m2 ?? "—"}
                </div>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-xs mt-3"
              >
                Cerrar
              </button>
            </div>
          ) : selectedArea ? (
            <div className="mt-5 bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-emerald-900 text-base">
                  Área Común: {selectedArea.nombre}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${estadoClasses(
                    selectedArea.estado
                  )}`}
                >
                  {selectedArea.estado}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                <div>
                  <strong>Ubicación:</strong> {selectedArea.ubicacion || "—"}
                </div>
                <div>
                  <strong>Capacidad:</strong> {selectedArea.capacidad ?? "—"}
                </div>
                <div>
                  <strong>Horario:</strong>{" "}
                  {hhmm(selectedArea.horario_apertura)} – {hhmm(selectedArea.horario_cierre)}
                </div>
                <div className="md:col-span-2">
                  <strong>Descripción:</strong>{" "}
                  {selectedArea.descripcion?.trim() || "—"}
                </div>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => setSelectedArea(null)}
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal EDIT */}
      {showEdit && editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowEdit(false)}
              className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Editar {editTarget.numero}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Edificio
                  </label>
                  <select
                    value={editForm.edificio || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, edificio: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                  >
                    <option value="A">Edificio A</option>
                    <option value="B">Edificio B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={editForm.numero || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, numero: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Área
                  </label>
                  <input
                    type="text"
                    value={editForm.area || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, area: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dueño (Copropietario)
                  </label>
                  <select
                    value={
                      typeof editForm.owner_id === "number" ? editForm.owner_id : ""
                    }
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        owner_id: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                  >
                    <option value="">— Sin dueño —</option>
                    {ownerCandidates.map((u) => (
                      <option key={u.id} value={u.id}>
                        {(u.first_name || u.last_name)
                          ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                          : u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-5">
              <button
                onClick={handleUpdateProperty}
                className="flex-1 bg-amber-500 text-white py-2 rounded-md hover:bg-amber-600 text-sm"
              >
                Guardar cambios
              </button>
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal DELETE */}
      {showDelete && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900">
              Eliminar {deleteTarget.numero}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Esta acción no se puede deshacer. ¿Deseas continuar?
            </p>
            <div className="flex space-x-2 mt-5">
              <button
                onClick={handleDeleteProperty}
                className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-sm"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal TENANTS */}
      {showTenantsModal && currentCasa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowTenantsModal(false)}
              className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Inquilinos de {currentCasa.numero}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Agregar inquilino (rol: Inquilino)
                </label>
                <div className="flex gap-2">
                  <select
                    value={tenantToAdd}
                    onChange={(e) =>
                      setTenantToAdd(e.target.value ? Number(e.target.value) : "")
                    }
                    className="flex-1 border border-gray-300 rounded-md px-2.5 py-2 text-sm"
                  >
                    <option value="">— Selecciona un inquilino —</option>
                    {tenantCandidates
                      .filter(
                        (u) => !(currentCasa.tenants || []).some((t) => t.user.id === u.id)
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {(u.first_name || u.last_name)
                            ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                            : u.email}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddTenant}
                    className="bg-blue-600 text-white px-3 rounded-md text-sm hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Actuales</h4>
                {(currentCasa.tenants || []).length === 0 ? (
                  <div className="text-sm text-gray-500">No hay inquilinos.</div>
                ) : (
                  <ul className="divide-y">
                    {(currentCasa.tenants || []).map((t) => (
                      <li key={t.user.id} className="py-2 flex items-center justify-between">
                        <div className="text-sm">
                          {t.user.first_name || t.user.last_name
                            ? `${t.user.first_name ?? ""} ${t.user.last_name ?? ""}`.trim()
                            : t.user.email}
                        </div>
                        <button
                          onClick={() => handleRemoveTenant(t.user.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowTenantsModal(false)}
                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

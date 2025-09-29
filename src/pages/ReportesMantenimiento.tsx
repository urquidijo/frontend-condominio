
// src/components/ReportesMantenimiento.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Edit, Trash2, Eye, X } from "lucide-react";
import {
  getReportes as apiGetReportes,
  createReporte as apiCreateReporte,
  updateReporte as apiUpdateReporte,
  deleteReporte as apiDeleteReporte,
} from "../api/maintenance";
import { getUsers, type User } from "../api/users";

/* ------------------- Tipos UI ------------------- */
type Material = {
  nombre: string;
  cantidad: number | string;
  tipo: string;
  costo: number | string;
};
type MaterialConTotal = Material & { costoTotal?: number };

type ReporteUI = {
  id: number;
  tipo: "correctivo" | "preventivo";
  titulo: string;
  descripcion: string;
  ubicacion: string;
  prioridad: "baja" | "media" | "alta";
  estado: "pendiente" | "en_progreso" | "completado";
  asignarA: "interno" | "externo";
  fechaInicio: string;
  fechaFin: string;
  responsableId: number | null;
  responsableNombre: string;
  costo: number;
  materiales: MaterialConTotal[];
};

type FormValues = {
  tipo: "correctivo" | "preventivo";
  titulo: string;
  descripcion: string;
  ubicacion: string;
  prioridad: "baja" | "media" | "alta";
  fechaInicio: string;
  fechaFin: string;
  asignarA: "interno" | "externo";
  responsableId: number | "";
  materiales: Material[];
  newMaterial: Material;
};

type Staff = { id: number; name: string; type: "interno" | "externo" };

const EMPTY_FORM: FormValues = {
  tipo: "correctivo",
  titulo: "",
  descripcion: "",
  ubicacion: "",
  prioridad: "media",
  fechaInicio: "",
  fechaFin: "",
  asignarA: "interno",
  responsableId: "",
  materiales: [],
  newMaterial: { nombre: "", cantidad: "", tipo: "unidad", costo: "" },
};

const ReportesMantenimiento: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"crear" | "editar" | "detalle">("crear");
  const [selectedReport, setSelectedReport] = useState<ReporteUI | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportes, setReportes] = useState<ReporteUI[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: EMPTY_FORM });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "materiales" });

  const materiales = watch("materiales");
  const asignarA = watch("asignarA");

  const costoTotalFormulario = useMemo(() => {
    return (materiales || []).reduce((sum, m) => {
      const cant = parseFloat(String(m.cantidad || 0));
      const unit = parseFloat(String(m.costo || 0));
      return sum + (isNaN(cant) || isNaN(unit) ? 0 : cant * unit);
    }, 0);
  }, [materiales]);

  const getEstadoPill = (estado: ReporteUI["estado"]) => {
    const map: Record<ReporteUI["estado"], string> = {
      pendiente: "bg-yellow-100 text-yellow-800",
      en_progreso: "bg-blue-100 text-blue-800",
      completado: "bg-green-100 text-green-800",
    };
    return map[estado] || "bg-gray-100 text-gray-800";
  };

  const getPrioridadPill = (prioridad: ReporteUI["prioridad"]) => {
    const map: Record<ReporteUI["prioridad"], string> = {
      baja: "bg-green-100 text-green-800",
      media: "bg-yellow-100 text-yellow-800",
      alta: "bg-red-100 text-red-800",
    };
    return map[prioridad] || "bg-gray-100 text-gray-800";
  };
// ---- Solo FRONT: rol desde localStorage ----
const getStoredRole = (): string => {
  const raw = localStorage.getItem("role");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if ((parsed as any)?.name) return String((parsed as any).name);
  } catch {
    // ya era string
  }
  return String(raw);
};

const [isAdmin, setIsAdmin] = useState<boolean>(false);
useEffect(() => {
  const syncRole = () => {
    const r = getStoredRole().toLowerCase();
    // admite "Administrador", "admin", etc.
    setIsAdmin(r.includes("administrador") || r.includes("admin"));
  };
  syncRole();
  // si el rol cambia en otra pestaña
  window.addEventListener("storage", syncRole);
  return () => window.removeEventListener("storage", syncRole);
}, []);

  useEffect(() => {
    (async () => {
      setStaffLoading(true);
      try {
        const users = await getUsers();
        const mapped: Staff[] = (users as User[])
          .map((u) => {
            const rawRole = (u.role?.name || (u as any).role)?.toString()?.toLowerCase?.() ?? "";
            let type: Staff["type"] | null = null;
            if (rawRole.includes("externo")) type = "externo";
            else if (rawRole.includes("interno")) type = "interno";
            else return null;
            const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email;
            return { id: u.id, name: fullName, type };
          })
          .filter((x): x is Staff => !!x);
        setStaff(mapped);
      } catch {
        setStaff([]);
      } finally {
        setStaffLoading(false);
      }
    })();
  }, []);

  const fetchReportes = async () => {
    setLoading(true);
    try {
      const data = await apiGetReportes();
      const mapped: ReporteUI[] = (data || []).map((r: any) => {
        const responsableName =
          r.responsable ? staff.find((s) => s.id === r.responsable)?.name ?? `#${r.responsable}` : "Sin asignar";
        const mats = Array.isArray(r.materiales) ? r.materiales : [];
        return {
          id: r.id,
          tipo: r.tipo,
          titulo: r.titulo,
          descripcion: r.descripcion,
          ubicacion: r.ubicacion,
          prioridad: r.prioridad,
          estado: r.estado,
          asignarA: r.asignar_a ?? "interno",
          fechaInicio: r.fecha_inicio,
          fechaFin: r.fecha_fin,
          responsableId: r.responsable ?? null,
          responsableNombre: responsableName,
          costo: Number(r.costo_total ?? 0),
          materiales: mats.map((m: any) => {
            const cantidad = Number(m.cantidad ?? 0);
            const costoUnit = Number(m.costo_unitario ?? 0);
            const total = m.costo_total != null ? Number(m.costo_total) : cantidad * costoUnit;
            return {
              nombre: String(m.nombre ?? ""),
              cantidad,
              tipo: String(m.unidad ?? "unidad"),
              costo: costoUnit,
              costoTotal: total,
            };
          }),
        };
      });
      setReportes(mapped);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff.length]);

const abrirModal = (tipo: "crear" | "editar" | "detalle", r: ReporteUI | null = null) => {
  // Solo FRONT: usuarios no admin no pueden abrir crear/editar
  if (tipo !== "detalle" && !isAdmin) return;

  setModalType(tipo);

    if (tipo === "crear") {
      setSelectedReport(null);
      reset(EMPTY_FORM, { keepDefaultValues: false });
      replace([]);
    } else if (tipo === "editar" && r) {
      setSelectedReport(r);
      reset({
        tipo: r.tipo,
        titulo: r.titulo,
        descripcion: r.descripcion,
        ubicacion: r.ubicacion,
        prioridad: r.prioridad,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        asignarA: r.asignarA,
        responsableId: r.responsableId ?? "",
        materiales: (r.materiales || []).map((m) => ({
          nombre: String(m.nombre ?? ""),
          cantidad: m.cantidad ?? "",
          tipo: String(m.tipo ?? "unidad"),
          costo: m.costo ?? "",
        })),
        newMaterial: { nombre: "", cantidad: "", tipo: "unidad", costo: "" },
      });
    } else if (tipo === "detalle" && r) {
      setSelectedReport(r);
    }

    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const toApiPayload = (values: FormValues) => {
    const materiales = (values.materiales || []).map((m) => ({
      nombre: m.nombre,
      cantidad: Number(m.cantidad ?? 0),
      unidad: m.tipo,
      costo_unitario: Number(m.costo ?? 0),
    }));

    return {
      tipo: values.tipo,
      titulo: values.titulo,
      descripcion: values.descripcion,
      ubicacion: values.ubicacion,
      prioridad: values.prioridad,
      estado: selectedReport?.estado ?? "pendiente",
      asignar_a: values.asignarA,
      fecha_inicio: values.fechaInicio,
      fecha_fin: values.fechaFin,
      responsable: values.responsableId === "" ? null : Number(values.responsableId),
      materiales,
    };
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      if (modalType === "editar" && selectedReport) {
        await apiUpdateReporte(selectedReport.id, toApiPayload(values) as any);
      } else {
        await apiCreateReporte(toApiPayload(values) as any);
      }
      await fetchReportes();
      cerrarModal();
    } catch {
      alert("No se pudo guardar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este reporte?")) return;
    try {
      setLoading(true);
      await apiDeleteReporte(id);
      setReportes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reportes de Mantenimiento</h1>
          <p className="text-gray-600 text-sm">Gestión de mantenimiento preventivo y correctivo</p>
        </div>
        <div className="flex gap-2">
  {isAdmin && (
    <button
      onClick={() => abrirModal("crear")}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      <Plus className="w-4 h-4" /> Nuevo
    </button>
  )}
</div>
      </div>

      {(loading || staffLoading) && <p className="text-sm text-gray-500 mb-2">Cargando…</p>}

      <div className="space-y-4">
        {reportes.map((reporte) => (
          <div key={reporte.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      reporte.tipo === "preventivo" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {reporte.tipo === "preventivo" ? "Preventivo" : "Correctivo"}
                  </span>

                  {/* Ocultar la pill si está en 'pendiente' */}
                  {reporte.estado !== "pendiente" && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoPill(reporte.estado)}`}>
                      {reporte.estado.replace("_", " ").toUpperCase()}
                    </span>
                  )}

                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadPill(reporte.prioridad)}`}>
                    {reporte.prioridad.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">{reporte.titulo}</h3>
                <p className="text-gray-600 mb-2">{reporte.descripcion}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Ubicación: {reporte.ubicacion}</span>
                  <span>Responsable: {reporte.responsableNombre}</span>
                  <span>Fechas: {reporte.fechaInicio} – {reporte.fechaFin}</span>
                  <span className="font-semibold text-gray-900">Bs. {reporte.costo.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => abrirModal("detalle", reporte)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
  {isAdmin && (
    <>
      <button
        onClick={() => abrirModal("editar", reporte)}
        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-md"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => eliminar(reporte.id)}
        className="p-2 text-red-600 hover:bg-red-100 rounded-md"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  )}
              </div>
            </div>
          </div>
        ))}
        {reportes.length === 0 && !loading && <p className="text-sm text-gray-500">No hay reportes aún.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "crear" && "Crear Nuevo Reporte"}
                {modalType === "editar" && "Editar Reporte"}
                {modalType === "detalle" && "Detalle del Reporte"}
              </h2>
              <button
                type="button"
                onClick={cerrarModal}
                className="inline-flex items-center justify-center rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalType !== "detalle" ? (
              <form
                key={modalType === "crear" ? "new" : `edit-${selectedReport?.id ?? "x"}`}
                onSubmit={handleSubmit(onSubmit)}
                className="px-6 pb-6 pt-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                      {...register("tipo", { required: true })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="correctivo">Correctivo</option>
                      <option value="preventivo">Preventivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prioridad</label>
                    <select
                      {...register("prioridad", { required: true })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Asignar a</label>
                    <select
                      {...register("asignarA", { required: true })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="interno">Personal Interno</option>
                      <option value="externo">Proveedor Externo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Persona asignada</label>
                    <select
                      {...register("responsableId", {
                        required: true,
                        setValueAs: (v) => (v === "" ? "" : Number(v)),
                      })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecciona…</option>
                      {staff
                        .filter((s) => s.type === asignarA)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    {errors.responsableId && <p className="text-sm text-red-600 mt-1">Requerido.</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <input
                    type="text"
                    {...register("titulo", { required: true })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.titulo && <p className="text-sm text-red-600 mt-1">El título es requerido.</p>}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    {...register("descripcion", { required: true })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.descripcion && <p className="text-sm text-red-600 mt-1">La descripción es requerida.</p>}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ubicación</label>
                    <input
                      type="text"
                      {...register("ubicacion", { required: true })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.ubicacion && <p className="text-sm text-red-600 mt-1">La ubicación es requerida.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fechas</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        {...register("fechaInicio", { required: true })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="date"
                        {...register("fechaFin", { required: true })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {(errors.fechaInicio || errors.fechaFin) && (
                      <p className="text-sm text-red-600 mt-1">Fechas requeridas.</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Materiales y Suministros</h3>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <input
                        type="text"
                        placeholder="Nombre"
                        {...register("newMaterial.nombre")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Cantidad"
                        min={0}
                        step="0.01"
                        {...register("newMaterial.cantidad")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        {...register("newMaterial.tipo")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue="unidad"
                      >
                        <option value="unidad">Unidad</option>
                        <option value="metros">Metros</option>
                        <option value="litros">Litros</option>
                        <option value="kilogramos">Kilogramos</option>
                        <option value="cajas">Cajas</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Costo (Bs.)"
                        min={0}
                        step="0.01"
                        {...register("newMaterial.costo")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nuevo = getValues("newMaterial");
                          if (nuevo?.nombre && String(nuevo.nombre).trim() !== "") {
                            append({
                              nombre: nuevo.nombre,
                              cantidad: nuevo.cantidad || 1,
                              tipo: (nuevo.tipo as any) || "unidad",
                              costo: nuevo.costo || 0,
                            });
                            setValue("newMaterial", { nombre: "", cantidad: "", tipo: "unidad", costo: "" });
                          }
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Agregar
                      </button>
                    </div>
                  </div>

                  {fields.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cantidad</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Costo Unit.</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {fields.map((field, index) => {
                            const cant = parseFloat(String(materiales?.[index]?.cantidad || 0));
                            const unit = parseFloat(String(materiales?.[index]?.costo || 0));
                            const total = isNaN(cant) || isNaN(unit) ? 0 : cant * unit;
                            return (
                              <tr key={field.id}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  <input
                                    {...register(`materiales.${index}.nombre` as const, { required: true })}
                                    className="w-full border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    {...register(`materiales.${index}.cantidad` as const, { required: true })}
                                    className="w-full border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  <select
                                    {...register(`materiales.${index}.tipo` as const, { required: true })}
                                    className="w-full border px-2 py-1 rounded"
                                  >
                                    <option value="unidad">Unidad</option>
                                    <option value="metros">Metros</option>
                                    <option value="litros">Litros</option>
                                    <option value="kilogramos">Kilogramos</option>
                                    <option value="cajas">Cajas</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    {...register(`materiales.${index}.costo` as const, { required: true })}
                                    className="w-full border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  Bs. {total.toLocaleString()}
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                              Costo Total:
                            </td>
                            <td className="px-4 py-2 text-sm font-bold text-gray-900">
                              Bs. {costoTotalFormulario.toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    {modalType === "crear" ? "Crear Reporte" : "Actualizar Reporte"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 pb-6 pt-4">
                {selectedReport && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3">Información General</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Tipo: </span>
                            {selectedReport.tipo === "preventivo" ? "Preventivo" : "Correctivo"}
                          </div>

                          {/* Ocultar fila Estado si es pendiente */}
                          {selectedReport.estado !== "pendiente" && (
                            <div>
                              <span className="text-gray-500">Estado: </span>
                              {selectedReport.estado.replace("_", " ")}
                            </div>
                          )}

                          <div><span className="text-gray-500">Ubicación: </span>{selectedReport.ubicacion}</div>
                          <div><span className="text-gray-500">Responsable: </span>{selectedReport.responsableNombre}</div>
                          <div><span className="text-gray-500">Fechas: </span>{selectedReport.fechaInicio} – {selectedReport.fechaFin}</div>
                          <div className="pt-1">
                            <span className="text-gray-500">Costo Total: </span>
                            <span className="font-semibold">Bs. {selectedReport.costo.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3">Materiales y Suministros</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cantidad</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Costo Unit.</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedReport.materiales.map((m, i) => (
                                <tr key={i}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{m.nombre}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{m.cantidad}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{m.tipo}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">Bs. {Number(m.costo || 0).toLocaleString()}</td>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    Bs. {(Number(m.cantidad || 0) * Number(m.costo || 0)).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={cerrarModal}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesMantenimiento;

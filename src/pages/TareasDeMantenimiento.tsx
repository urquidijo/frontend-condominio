import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  Clock,
  Building,
  DollarSign,
  X,
} from "lucide-react";

import {
  type Tarea,
  getTareas,
  createTarea,
  updateTarea,
  deleteTarea,
  updateTareaEstado,
} from "../api/maintenance";

import { getUsers, type User } from "../api/users";

/* ================== Tipos UI (no tocamos estilos) ================== */
type Task = {
  id: number;
  title: string;
  description: string;
  type: "preventivo" | "correctivo";
  status: "pendiente" | "en_progreso" | "completado";
  priority: "alta" | "media" | "baja";
  assignedTo: "personal_interno" | "personal_externo";
  assignedPerson: string;
  scheduledDate: string;
  completedDate: string | null;
  cost: number | string;
  location: string;
};

type Staff = { id: number; name: string; type: "interno" | "externo" };

/* ========= Lee rol desde localStorage y decide si puede ver CRUD ========= */
const isAdminFromStorage = () => {
  const raw = localStorage.getItem("role");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    const name = (parsed?.name ?? "").toString();
    return /administrador/i.test(name);
  } catch {
    return /administrador/i.test(raw);
  }
};

const TareasDeMantenimiento: React.FC = () => {
  const [canCrud] = useState<boolean>(isAdminFromStorage());

  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<
    Omit<Task, "id" | "status" | "completedDate">
  >({
    title: "",
    description: "",
    type: "preventivo",
    priority: "media",
    assignedTo: "personal_interno",
    assignedPerson: "",
    scheduledDate: "",
    cost: "",
    location: "",
  });

  /* ================== Helpers de mapeo ================== */
  const uiFromApi = (t: Tarea): Task => {
    const p = staff.find((s) => s.id === t.asignado_a);
    const assignedTo: Task["assignedTo"] =
      t.asignar_a === "externo" ? "personal_externo" : "personal_interno";

    return {
      id: t.id!,
      title: t.titulo,
      description: t.descripcion,
      type: t.tipo,
      status: t.estado,
      priority: t.prioridad,
      assignedTo,
      assignedPerson: p?.name || "",
      scheduledDate: t.fecha_programada,
      completedDate: t.fecha_completada || null,
      cost:
        typeof t.costo_estimado === "number"
          ? t.costo_estimado
          : (t.costo_estimado as any) || "",
      location: t.ubicacion,
    };
  };

  const apiFromForm = (base?: Partial<Tarea>): Tarea => {
    const persona = staff.find((s) => s.name === formData.assignedPerson);
    const costo_estimado =
      formData.cost === "" ? 0 : parseFloat(String(formData.cost || 0));

    return {
      id: base?.id,
      titulo: formData.title,
      descripcion: formData.description,
      tipo: formData.type,
      prioridad: formData.priority,
      estado: base?.estado ?? (selectedItem?.status ?? "pendiente"),
      fecha_programada: formData.scheduledDate,
      fecha_completada: base?.fecha_completada ?? null,
      ubicacion: formData.location,
      costo_estimado: isNaN(costo_estimado) ? 0 : costo_estimado,
      asignado_a: persona?.id ?? null,
      asignar_a:
        formData.assignedTo === "personal_externo" ? "externo" : "interno",
    } as Tarea;
  };

  /* ================== Carga inicial ================== */
  useEffect(() => {
    (async () => {
      try {
        const users = await getUsers();
        const mapped: Staff[] = (users as User[])
          .map((u) => {
            const rawRole = (u.role?.name || u.role)?.toString().toLowerCase();
            if (!rawRole) return null;

            let type: Staff["type"] | null = null;
            if (rawRole.includes("externo")) type = "externo";
            else if (rawRole.includes("interno")) type = "interno";
            else return null;

            const fullName = `${u.first_name} ${u.last_name}`.trim() || u.email;
            return { id: u.id, name: fullName, type };
          })
          .filter((item): item is Staff => item !== null);
        setStaff(mapped);
      } catch (e) {
        console.error("No se pudo cargar usuarios para staff.", e);
        setStaff([]);
      }
    })();
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const data: Tarea[] = await getTareas({});
      setTasks(data.map(uiFromApi));
    } catch (err) {
      console.error("No se pudieron cargar las tareas.", err);
    }
  }, [staff]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  /* ================== UI helpers ================== */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "en_progreso":
        return "bg-blue-100 text-blue-800";
      case "completado":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "text-red-600";
      case "media":
        return "text-yellow-600";
      case "baja":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  /* ================== Crear / Actualizar ================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        const persona = staff.find((s) => s.name === formData.assignedPerson);
        const partial: Partial<Tarea> = {
          titulo: formData.title,
          descripcion: formData.description,
          tipo: formData.type,
          prioridad: formData.priority,
          fecha_programada: formData.scheduledDate,
          ubicacion: formData.location,
          asignado_a: persona?.id ?? null,
          asignar_a:
            formData.assignedTo === "personal_externo" ? "externo" : "interno",
          costo_estimado:
            formData.cost === "" ? 0 : parseFloat(String(formData.cost || 0)),
        };
        await updateTarea(selectedItem.id, partial);
      } else {
        await createTarea(
          apiFromForm({ estado: "pendiente", fecha_completada: null })
        );
      }
      await loadTasks();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la tarea.");
    }
  };

  /* ================== Cambiar estado (OPTIMISTA) ================== */
  const updateTaskStatus = async (id: number, newStatus: Task["status"]) => {
    if (updatingId) return;
    setUpdatingId(id);

    const fecha_completada =
      newStatus === "completado"
        ? new Date().toISOString().split("T")[0]
        : null;

    // 1) Optimista
    const prev = tasks;
    setTasks((p) =>
      p.map((t) =>
        t.id === id ? { ...t, status: newStatus, completedDate: fecha_completada } : t
      )
    );

    try {
      await updateTareaEstado(id, newStatus, fecha_completada);
      // Opcional: refrescar desde backend si quieres datos 100% server-driven
      // await loadTasks();
    } catch (err) {
      console.error(err);
      alert("No se pudo cambiar el estado.");
      setTasks(prev);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================== Eliminar ================== */
  const deleteTaskLocalAndApi = async (id: number) => {
    if (!window.confirm("¿Seguro de eliminar la tarea?")) return;
    try {
      await deleteTarea(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar.");
    }
  };

  /* ================== Modal ================== */
  const openModal = (task: Task | null = null) => {
    if (task) {
      setSelectedItem(task);
      setFormData({
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        assignedTo: task.assignedTo,
        assignedPerson: task.assignedPerson,
        scheduledDate: task.scheduledDate,
        cost: task.cost,
        location: task.location,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        title: "",
        description: "",
        type: "preventivo",
        priority: "media",
        assignedTo: "personal_interno",
        assignedPerson: "",
        scheduledDate: "",
        cost: "",
        location: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  /* ================== Render ================== */
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completado">Completado</option>
          </select>

          {/* Botón Nueva Tarea solo para Administrador */}
          {canCrud && (
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {task.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {task.status.replace("_", " ").toUpperCase()}
                  </span>
                  <AlertTriangle
                    className={`h-4 w-4 ${getPriorityColor(task.priority)}`}
                  />
                </div>
                <p className="text-gray-600 mb-2">{task.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {task.assignedPerson} ({task.assignedTo.replace("_", " ")})
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(task.scheduledDate).toLocaleDateString()}
                  </span>

                  {/* Fecha de finalización visible cuando exista */}
                  {task.completedDate && (
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Finalizada:{" "}
                      {new Date(task.completedDate).toLocaleDateString()}
                    </span>
                  )}

                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {task.location}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {task.cost
                      ? `Bs. ${parseFloat(task.cost.toString()).toLocaleString()}`
                      : "Sin costo"}
                  </span>
                </div>
              </div>

              {/* Acciones CRUD solo para Administrador */}
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                {canCrud && (
                  <>
                    {task.status !== "completado" && (
                      <button
                        onClick={() =>
                          updateTaskStatus(
                            task.id,
                            task.status === "pendiente"
                              ? "en_progreso"
                              : "completado"
                          )
                        }
                        disabled={updatingId === task.id}
                        className={`px-3 py-1 rounded-md text-sm ${
                          task.status === "pendiente"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        } ${
                          updatingId === task.id
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {task.status === "pendiente" ? "Iniciar" : "Completado"}
                      </button>
                    )}

                    <button
                      onClick={() => openModal(task)}
                      className="p-2 text-gray-500 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => deleteTaskLocalAndApi(task.id)}
                      className="p-2 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: solo visible para Administrador */}
      {canCrud && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-white/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedItem ? "Editar Tarea" : "Agregar Tarea"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="px-6 pb-6 pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descripción
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as Task["type"],
                        })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="preventivo">Preventivo</option>
                      <option value="correctivo">Correctivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Prioridad
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as Task["priority"],
                        })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Asignar a
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assignedTo: e.target.value as Task["assignedTo"],
                          assignedPerson: "",
                        })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="personal_interno">Personal Interno</option>
                      <option value="personal_externo">Personal Externo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Persona asignada
                    </label>
                    <select
                      value={formData.assignedPerson}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedPerson: e.target.value })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar persona...</option>
                      {staff
                        .filter(
                          (s) =>
                            (formData.assignedTo === "personal_interno" &&
                              s.type === "interno") ||
                            (formData.assignedTo === "personal_externo" &&
                              s.type === "externo")
                        )
                        .map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Fecha programada
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledDate: e.target.value })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Costo estimado (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: e.target.value })
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Torre, piso, área específica..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {selectedItem ? "Actualizar" : "Crear"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TareasDeMantenimiento;

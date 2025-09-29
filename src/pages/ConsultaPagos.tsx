import React, { useEffect, useMemo, useState } from "react";
import {
  Home,
  Plus,
  CheckCircle,
  X,
  Clock,
  CreditCard,
  AlertTriangle,
  Calendar,
} from "lucide-react";

import {
  listPriceConfigs,
  listCharges,
  createCharge,
  createCheckoutSessionForCharge,
  type PriceConfigDTO,
  type ChargeDTO,
} from "../api/payments";

import { getProperties, type Property } from "../api/properties";

/* Stripe loader */
const loadStripe = (): Promise<any> =>
  new Promise((resolve, reject) => {
    const w = window as any;
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publishableKey) {
      reject(new Error("Falta VITE_STRIPE_PUBLIC_KEY en el .env"));
      return;
    }
    if (w.Stripe) {
      resolve(w.Stripe(publishableKey));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.onload = () => resolve((window as any).Stripe(publishableKey));
    s.onerror = () => reject(new Error("Stripe.js no cargó"));
    document.head.appendChild(s);
  });

/* Tipos UI */
type UICharge = ChargeDTO & {
  property_label: string;
  price_type: string;
  amount_num: number;
  currency?: string;
};

type FormState = {
  price_config_id: number | null;
  fecha_pago: string;
  selectedProps: number[];
  assignAll: boolean;
};

const toNumber = (v: string | number | null | undefined) =>
  v == null ? 0 : typeof v === "number" ? v : Number(v);

const propertyLabel = (p?: Property) => {
  if (!p) return "CASA-?";
  const codigo = (p as any).codigo as string | undefined;
  if (codigo) return codigo.trim();
  const edificio = String((p as any).edificio ?? "").trim();
  let numero = String((p as any).numero ?? "").trim();
  if (edificio && numero.startsWith(edificio + "")) {
    numero = numero.slice(edificio.length + 1);
  }
  if (edificio && numero) return `${edificio}-${numero}`;
  if (numero) return numero;
  return "CASA-?";
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("es-BO", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return iso;
  }
};

const isOverdue = (due?: string | null) => {
  if (!due) return false;
  try {
    const d = new Date(`${due}T00:00:00`);
    const today = new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  } catch {
    return false;
  }
};

/* Permisos solo frontend */
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

const ConsultaPagos: React.FC = () => {
  const [canCrud] = useState<boolean>(isAdminFromStorage());

  const [configs, setConfigs] = useState<PriceConfigDTO[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [charges, setCharges] = useState<UICharge[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [filterPropId, setFilterPropId] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    price_config_id: null,
    fecha_pago: "",
    selectedProps: [],
    assignAll: false,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cfg, props, ch] = await Promise.all([
          listPriceConfigs({ active: "1" }),
          getProperties(),
          listCharges(),
        ]);

        setConfigs(cfg);
        setProperties(props);

        const cfgMap = new Map(cfg.map((c) => [c.id, c]));
        const propMap = new Map(props.map((p) => [p.id, p]));

        const uiList: UICharge[] = ch.map((item) => {
          const pid = (item as any).property_id ?? (item as any).propiedad_id;
          const pcid = (item as any).price_config_id ?? (item as any).price_config;

          const pc = pcid ? cfgMap.get(pcid) : undefined;
          const pr = pid ? propMap.get(pid) : undefined;

          return {
            ...item,
            property_id: pid,
            price_config_id: pcid,
            property_label: propertyLabel(pr),
            price_type: pc?.type ?? "—",
            amount_num: toNumber(pc?.base_price ?? item.amount),
            currency: pc?.currency,
          };
        });

        setCharges(uiList);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCharges = useMemo(
    () => (filterPropId ? charges.filter((c) => c.property_id === filterPropId) : charges),
    [charges, filterPropId]
  );

  const visualStatus = (c: UICharge) => {
    if (c.status === "PENDING" && isOverdue(c.fecha_pago)) return "overdue" as const;
    if (c.status === "PAID") return "paid" as const;
    if (c.status === "CANCELED") return "canceled" as const;
    return c.status === "OVERDUE" ? ("overdue" as const) : ("pending" as const);
  };

  const statusPill = (c: UICharge) => {
    const s = visualStatus(c);
    const map = {
      paid: { cls: "text-green-700 bg-green-100", icon: <CheckCircle className="w-4 h-4" />, txt: "Pagado" },
      pending: { cls: "text-yellow-700 bg-yellow-100", icon: <Clock className="w-4 h-4" />, txt: "Pendiente" },
      overdue: { cls: "text-red-700 bg-red-100", icon: <AlertTriangle className="w-4 h-4" />, txt: "Vencido" },
      canceled: { cls: "text-gray-600 bg-gray-200", icon: <X className="w-4 h-4" />, txt: "Anulado" },
    } as const;
    return map[s];
  };

  const toggleAll = () => {
    setForm((f) => {
      const next = !f.assignAll;
      return {
        ...f,
        assignAll: next,
        selectedProps: next ? properties.map((p) => p.id) : [],
      };
    });
  };

  const toggleProp = (id: number) => {
    setForm((f) => {
      const has = f.selectedProps.includes(id);
      return {
        ...f,
        selectedProps: has ? f.selectedProps.filter((x) => x !== id) : [...f.selectedProps, id],
      };
    });
  };

  const resetForm = () => {
    setForm({ price_config_id: null, fecha_pago: "", selectedProps: [], assignAll: false });
    setShowAssignForm(false);
  };

  const submitAssign = async () => {
    if (!form.price_config_id) return alert("Selecciona un tipo de cargo");
    if (form.selectedProps.length === 0) return alert("Selecciona al menos una propiedad");

    setLoading(true);
    try {
      const created = await Promise.all(
        form.selectedProps.map((pid) =>
          createCharge({
            property_id: pid,
            price_config_id: form.price_config_id!,
            fecha_pago: form.fecha_pago || null,
          })
        )
      );

      const cfgMap = new Map(configs.map((c) => [c.id, c]));
      const propMap = new Map(properties.map((p) => [p.id, p]));

      const uiCreated: UICharge[] = created.map((it) => {
        const pc = cfgMap.get(it.price_config_id!);
        const pr = propMap.get(it.property_id!);
        return {
          ...it,
          property_label: propertyLabel(pr),
          price_type: pc?.type ?? "—",
          amount_num: toNumber(pc?.base_price ?? it.amount),
          currency: pc?.currency,
        };
      });

      setCharges((prev) => [...uiCreated, ...prev]);
      alert(`¡Asignación creada! (${uiCreated.length} cargos)`);
      resetForm();
    } catch (e: any) {
      console.error(e);
      alert("No se pudo crear la asignación.");
    } finally {
      setLoading(false);
    }
  };

  const payCharge = async (c: UICharge) => {
    try {
      const { sessionId } = await createCheckoutSessionForCharge(c.id);
      const stripe = await loadStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error(error);
        alert(error.message || "No se pudo redirigir a Stripe.");
      }
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo iniciar el pago.";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Cargos</h1>
          <p className="text-gray-500 text-sm">Asigna cargos (expensas, multas, servicios) y consulta su estado</p>
        </div>

        {/* Bloque de acciones (botón y filtro) visible solo para Administrador */}
        {canCrud && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <button
                onClick={() => setShowAssignForm(true)}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Nueva Asignación
              </button>
            </div>

            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                Filtrar por Propiedad
              </h2>
              <select
                value={filterPropId}
                onChange={(e) => setFilterPropId(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Todas</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {propertyLabel(p)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="border rounded-lg shadow-sm bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cargos</h3>

          {loading && <p className="text-sm text-gray-500 mb-4">Cargando…</p>}

          <div className="space-y-4">
            {(canCrud ? filteredCharges : charges).map((c) => {
              const pill = statusPill(c);
              const dueText = c.fecha_pago ? `Vence: ${formatDate(c.fecha_pago)}` : "Sin vencimiento";
              const issuedText = `Emitido: ${formatDate(c.issued_at)}`;
              const paidText = c.paid_at ? `Pagado: ${formatDate(c.paid_at)}` : "Pagado";

              return (
                <div
                  key={c.id}
                  className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-800">{c.property_label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${pill.cls}`}
                      >
                        {pill.icon}
                        {pill.txt}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{c.price_type}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {issuedText}
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          visualStatus(c) === "overdue" ? "text-red-600 font-medium" : ""
                        }`}
                      >
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {dueText}
                      </span>
                      {c.status === "PAID" && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {paidText}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-800">
                      {c.amount_num.toFixed(2)} {c.currency || "USD"}
                    </p>
                    {visualStatus(c) !== "paid" && (
                      <button
                        onClick={() => payCharge(c)}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {(canCrud ? filteredCharges : charges).length === 0 && (
              <p className="text-sm text-gray-500">No hay cargos para mostrar.</p>
            )}
          </div>
        </div>

        {canCrud && showAssignForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Nueva Asignación de Cargos
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">1. Seleccionar Tipo de Cargo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {configs.map((c) => {
                      const selected = form.price_config_id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setForm((f) => ({ ...f, price_config_id: c.id }))}
                          className={`p-4 rounded-xl border-2 transition hover:shadow-sm ${
                            selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-800 mb-1 truncate">{c.type}</div>
                          <div className="text-lg font-bold text-green-600 truncate">
                            {toNumber(c.base_price).toFixed(2)} {c.currency || "USD"}
                          </div>
                          {!c.active && <div className="text-xs text-amber-600">Inactivo</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de vencimiento</label>
                    <input
                      type="date"
                      value={form.fecha_pago}
                      onChange={(e) => setForm((f) => ({ ...f, fecha_pago: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">2. Seleccionar Propiedades</h3>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {form.assignAll ? "Deseleccionar Todas" : "Seleccionar Todas"}
                      </button>
                      <span className="text-sm text-gray-500">
                        {form.selectedProps.length} de {properties.length} seleccionadas
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {properties.map((p) => {
                      const checked = form.selectedProps.includes(p.id);
                      return (
                        <label key={p.id} className="flex flex-col items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProp(p.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-center font-medium text-gray-700">{propertyLabel(p)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={submitAssign}
                    disabled={!form.price_config_id || form.selectedProps.length === 0 || loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Crear Asignación ({form.selectedProps.length} casas)
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaPagos;

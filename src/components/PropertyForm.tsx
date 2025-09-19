import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  createProperty,
  updateProperty,
  getNextPropertyNumber,
  type Property,
} from "../api/properties";

type Props = {
  mode: "create" | "edit";
  defaultValues?: Partial<Property>;
  onClose: () => void;
  onSaved: (p: Property) => void;
};

type FormValues = {
  edificio: string;
  numero: string;
  propietario: string;
  telefono: string;
  email: string;
  area: string;
};

export default function PropertyForm({
  mode,
  defaultValues,
  onClose,
  onSaved,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      edificio: defaultValues?.edificio || "A",
      numero: defaultValues?.numero || "",
      propietario: defaultValues?.propietario || "",
      telefono: defaultValues?.telefono || "",
      email: defaultValues?.email || "",
      area: defaultValues?.area || "",
    },
  });

  const edificio = watch("edificio");

  // sugerir número si estamos creando
  useEffect(() => {
    if (mode === "create" && edificio) {
      getNextPropertyNumber(edificio).then((sug) => setValue("numero", sug));
    }
  }, [edificio, mode, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      let saved: Property;
      if (mode === "create") {
        saved = await createProperty(values);
      } else {
        saved = await updateProperty(defaultValues!.id!, values);
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la propiedad");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          {mode === "create" ? "Agregar Propiedad" : "Editar Propiedad"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Edificio</label>
              <select
                {...register("edificio", { required: true })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="A">Edificio A</option>
                <option value="B">Edificio B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Número</label>
              <input
                {...register("numero", { required: "Número requerido" })}
                className="w-full border rounded-md px-3 py-2"
              />
              {errors.numero && (
                <p className="text-red-500 text-sm">{errors.numero.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Propietario</label>
            <input
              {...register("propietario")}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Teléfono</label>
              <input
                {...register("telefono")}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Área</label>
              <input
                {...register("area", { required: "Área requerida" })}
                className="w-full border rounded-md px-3 py-2"
                placeholder="120 m²"
              />
              {errors.area && (
                <p className="text-red-500 text-sm">{errors.area.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              {...register("email", {
                pattern: { value: /^\S+@\S+$/i, message: "Email inválido" },
              })}
              className="w-full border rounded-md px-3 py-2"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

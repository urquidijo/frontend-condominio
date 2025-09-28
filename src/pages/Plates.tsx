import React from "react";
import PlateAssignForm from "../components/PlateAssignForm";
import PlateVerifyCard from "../components/PlateVerifyCard";
import { Car } from "lucide-react";

const Plates: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <Car className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Placas</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PlateAssignForm />
          <PlateVerifyCard />
        </div>
      </div>
    </div>
  );
};

export default Plates;

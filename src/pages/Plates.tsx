import React from "react";
import PlateAssignForm from "../components/PlateAssignForm";
import PlateVerifyCard from "../components/PlateVerifyCard";

const Plates: React.FC = () => {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Gestión de Placas</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlateAssignForm />
        <PlateVerifyCard />
      </div>
    </div>
  );
};

export default Plates;

// src/components/reservas/PrestamistaSelect.tsx
import React from "react";
import Select from "react-select";
import { FaUser } from "react-icons/fa";

export default function PrestamistaSelect({
  isDateTimeComplete,
  selectedPrestamista,
  setSelectedPrestamista,
  prestamistaOptions,
}: any) {
  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center">
        <FaUser className="me-2" />
        Seleccionar Usuario
      </label>
      <Select
        options={prestamistaOptions}
        value={selectedPrestamista}
        onChange={setSelectedPrestamista}
        placeholder={
          !isDateTimeComplete
            ? "Selecciona primero una fecha"
            : "Selecciona un usuario prestamista"
        }
        className="react-select-container"
        classNamePrefix="react-select"
        isDisabled={!isDateTimeComplete}
      />
    </div>
  );
}

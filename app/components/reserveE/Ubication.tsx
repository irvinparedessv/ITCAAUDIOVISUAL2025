// src/components/reservas/UbicacionSelect.tsx
import React from "react";
import Select from "react-select";
import { FaSchool } from "react-icons/fa";

export default function UbicacionSelect({
  formData,
  setFormData,
  aulaOptions,
  loadingAulas,
  isDateTimeComplete,
}: any) {
  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center">
        <FaSchool className="me-2" />
        Ubicación
      </label>
      {loadingAulas ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <Select
          options={aulaOptions}
          value={formData.aula}
          onChange={(selected: any) =>
            setFormData((prev: any) => ({ ...prev, aula: selected }))
          }
          placeholder="Selecciona aula"
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={
            !isDateTimeComplete ||
            !formData.tipoReserva ||
            formData.equipment.length === 0
          }
        />
      )}
    </div>
  );
}

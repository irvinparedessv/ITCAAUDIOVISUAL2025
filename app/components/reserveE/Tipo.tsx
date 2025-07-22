// src/components/reservas/TipoReservaSelect.tsx
import React from "react";
import Select from "react-select";
import { FaCalendarAlt } from "react-icons/fa";

export default function TipoReservaSelect({
  formData,
  setFormData,
  tipoReservaOptions,
  loading,
  isDateTimeComplete,
}: any) {
  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center">
        <FaCalendarAlt className="me-2" />
        Tipo de Reserva
      </label>
      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <Select
          options={tipoReservaOptions}
          value={formData.tipoReserva}
          onChange={(selected: any) =>
            setFormData((prev: any) => ({
              ...prev,
              tipoReserva: selected,
              equipment: [],
            }))
          }
          placeholder="Selecciona el tipo de reserva"
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={!isDateTimeComplete}
        />
      )}
    </div>
  );
}

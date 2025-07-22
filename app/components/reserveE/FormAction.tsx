// src/components/reservas/FormActions.tsx
import React from "react";
import { FaSave, FaBroom } from "react-icons/fa";

export default function FormActions({
  handleClear,
  loadingSubmit,
  isDateTimeComplete,
  checkingAvailability,
  tipoReserva,
  selectedEquipos,
  selectedAula,
}: any) {
  const canSubmit =
    !loadingSubmit &&
    !checkingAvailability &&
    isDateTimeComplete &&
    tipoReserva &&
    selectedEquipos.length > 0 &&
    selectedAula;

  return (
    <div className="form-actions">
      <button type="submit" className="btn primary-btn" disabled={!canSubmit}>
        {loadingSubmit ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            <span role="status">Guardando...</span>
          </>
        ) : (
          <>
            <FaSave className="me-2" />
            Reservar Equipos
          </>
        )}
      </button>
      <button
        type="button"
        className="btn secondary-btn"
        onClick={handleClear}
        disabled={checkingAvailability}
      >
        <FaBroom className="me-2" />
        Limpiar
      </button>
    </div>
  );
}

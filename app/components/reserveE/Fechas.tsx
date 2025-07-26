// src/components/reservas/FechaReservaInput.tsx
import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

export default function FechaReservaInput({
  formData,
  setFormData,
  getMinDate,
  getMaxDate,
}: any) {
  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center">
        <FaCalendarAlt className="me-2" />
        Fecha de Reserva
      </label>
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={(e) =>
          setFormData((prev: any) => ({
            ...prev,
            date: e.target.value,
            equipment: [],
          }))
        }
        className="form-control"
        min={getMinDate().toISOString().split("T")[0]}
        max={getMaxDate().toISOString().split("T")[0]}
        required
      />
    </div>
  );
}

// src/components/reservas/HorarioReservaInputs.tsx
import React from "react";
import { FaClock } from "react-icons/fa";
import { formatTo12h, timeOptions } from "~/utils/time";

export default function HorarioReservaInputs({
  formData,
  setFormData,
  getStartTimeOptions,
}: any) {
  return (
    <div className="row mb-4">
      <div className="col-md-6 mb-3 mb-md-0">
        <label className="form-label d-flex align-items-center">
          <FaClock className="me-2" />
          Hora de inicio
        </label>
        <select
          className="form-select"
          value={formData.startTime}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, startTime: e.target.value }))
          }
          required
        >
          <option value="">Selecciona una hora</option>
          {getStartTimeOptions().map((time: string) => (
            <option key={time} value={time}>
              {formatTo12h(time)}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label d-flex align-items-center">
          <FaClock className="me-2" />
          Hora de entrega
        </label>
        <select
          className="form-select"
          value={formData.endTime}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, endTime: e.target.value }))
          }
          required
        >
          <option value="">Selecciona una hora</option>
          {timeOptions
            .filter((time) => {
              const [hourStr, minStr] = time.split(":");
              const hour = Number(hourStr);
              const minutes = Number(minStr);
              if (formData.startTime) {
                const [startHourStr, startMinStr] =
                  formData.startTime.split(":");
                const startHour = Number(startHourStr);
                const startMinutes = Number(startMinStr);
                const timeHourMin = hour * 60 + minutes;
                const startHourMin = startHour * 60 + startMinutes;
                if (timeHourMin <= startHourMin) return false;
              }
              return hour < 20 || (hour === 20 && minutes === 0);
            })
            .map((time: string) => (
              <option key={time} value={time}>
                {formatTo12h(time)}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

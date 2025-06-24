import { useState, useEffect } from "react";
import Select from "react-select";
import type { MultiValue, SingleValue } from "react-select";
import { useAuth } from "../hooks/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaBoxes,
  FaSchool,
  FaSave,
  FaBroom,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import { getTipoReservas } from "../services/tipoReservaService";
import { formatTo12h, timeOptions } from "~/utils/time";

export default function EquipmentReservationForm() {
 type OptionType = { value: string; label: string };

type EquipmentOption = {
  value: number;
  label: string;
  tipoEquipoId: number;
  available?: boolean;
};

const [formData, setFormData] = useState({
  date: "",
  startTime: "",
  endTime: "",
  tipoReserva: null as SingleValue<OptionType>,
  equipment: [] as MultiValue<EquipmentOption>,
  aula: null as SingleValue<OptionType>,
});

const [allEquipmentOptions, setAllEquipmentOptions] = useState<EquipmentOption[]>([]);
const [availableEquipmentOptions, setAvailableEquipmentOptions] = useState<EquipmentOption[]>([]);
const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);
const [loadingEquipments, setLoadingEquipments] = useState(false);
const [loadingAulas, setLoadingAulas] = useState(true);
const [loadingSubmit, setLoadingSubmit] = useState(false);
const [tipoReservaOptions, setTipoReservaOptions] = useState<OptionType[]>([]);
const [loadingTipoReserva, setLoadingTipoReserva] = useState(true);
const [checkingAvailability, setCheckingAvailability] = useState(false);
const { user } = useAuth();
const isTodaySelected = formData.date === new Date().toISOString().split("T")[0];

const startTimeOptions = timeOptions.filter((time) => {
  const hour = Number(time.split(":")[0]);
  return hour >= 7 && hour <= 17;
});

const endTimeOptions = timeOptions.filter((time) => {
  const hour = Number(time.split(":")[0]);
  return hour >= 7 && hour <= 20;
});

const isDateTimeComplete =
  formData.date && formData.startTime && formData.endTime;

useEffect(() => {
  const fetchAulas = async () => {
    try {
      const response = await api.get("/aulasEquipos");
      const data = response.data;
      const options = data.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      setAulaOptions(options);
    } catch (error) {
      toast.error("Error cargando las aulas. Intente nuevamente.");
    } finally {
      setLoadingAulas(false);
    }
  };

  fetchAulas();
}, []);

useEffect(() => {
  const fetchTipos = async () => {
    try {
      const tipos = await getTipoReservas();
      setTipoReservaOptions(
        tipos.map((tr) => ({
          value: tr.id.toString(),
          label: tr.nombre,
        }))
      );
    } catch (error) {
      toast.error("Error cargando tipos de reserva");
    } finally {
      setLoadingTipoReserva(false);
    }
  };

  fetchTipos();
}, []);

useEffect(() => {
  const fetchEquipmentsByTipoReserva = async () => {
    if (!formData.tipoReserva) {
      setAvailableEquipmentOptions([]);
      return;
    }

    try {
      setLoadingEquipments(true);
      const response = await api.get(`/equiposPorTipo/${formData.tipoReserva.value}`);
      const data = response.data;
      const options: EquipmentOption[] = data.map((item: any) => ({
        value: item.id,
        label: item.nombre,
        tipoEquipoId: item.tipo_equipo_id,
      }));

      setAllEquipmentOptions(options);

      if (isDateTimeComplete) {
        await checkEquipmentAvailability(options);
      } else {
        setAvailableEquipmentOptions(options);
      }
    } catch (error) {
      console.error("Error:", error);
      setAvailableEquipmentOptions([]);
    } finally {
      setLoadingEquipments(false);
    }
  };

  fetchEquipmentsByTipoReserva();
}, [formData.tipoReserva]);

useEffect(() => {
  if (!formData.equipment || formData.equipment.length === 0) {
    setAvailableEquipmentOptions(allEquipmentOptions);
    return;
  }

  const tiposSeleccionados = formData.equipment.map((eq) => eq.tipoEquipoId);

  const opcionesFiltradas = allEquipmentOptions.filter((eq) => {
    return (
      formData.equipment.some((sel) => sel.value === eq.value) ||
      !tiposSeleccionados.includes(eq.tipoEquipoId)
    );
  });

  setAvailableEquipmentOptions(opcionesFiltradas);
}, [formData.equipment, allEquipmentOptions]);

useEffect(() => {
  if (
    isDateTimeComplete &&
    formData.tipoReserva &&
    allEquipmentOptions.length > 0
  ) {
    checkEquipmentAvailability(allEquipmentOptions);
  }
}, [formData.date, formData.startTime, formData.endTime]);

const checkEquipmentAvailability = async (equipments: EquipmentOption[]) => {
  try {
    setCheckingAvailability(true);

    const availabilityChecks = equipments.map(async (equipo) => {
      try {
        const response = await api.get(`/equipos/${equipo.value}/disponibilidad`, {
          params: {
            fecha: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
          },
        });

        return {
          ...equipo,
          available: response.data.disponibilidad.cantidad_disponible > 0,
        };
      } catch (error) {
        console.error(`Error verificando disponibilidad para equipo ${equipo.value}`, error);
        return {
          ...equipo,
          available: false,
        };
      }
    });

    const results = await Promise.all(availabilityChecks);
    const availableOptions = results.filter((equipo) => equipo.available);

    setAvailableEquipmentOptions(availableOptions);

    const currentSelected = formData.equipment.filter((eq) =>
      availableOptions.some((opt) => opt.value === eq.value)
    );

    if (currentSelected.length !== formData.equipment.length) {
      setFormData((prev) => ({ ...prev, equipment: currentSelected }));
      toast.error("Algunos equipos seleccionados ya no están disponibles");
    }
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    toast.error("Error al verificar disponibilidad de equipos");
    setAvailableEquipmentOptions(equipments);
  } finally {
    setCheckingAvailability(false);
  }
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleClear = () => {
  setFormData({
    date: "",
    startTime: "",
    endTime: "",
    tipoReserva: null,
    equipment: [],
    aula: null,
  });
  setAvailableEquipmentOptions([]);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    toast.error("No se ha encontrado el usuario. Por favor inicie sesión.");
    return;
  }

  const now = new Date();

  const selectedDate = new Date(formData.date + "T" + formData.startTime);
  const dateOnly = new Date(formData.date);
  const daysDiff = (dateOnly.getTime() - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24);

  // ➤ Validar máximo 7 días de anticipación
  if (daysDiff > 7) {
    toast.error("Solo se pueden hacer reservas con hasta una semana de anticipación.");
    return;
  }

  console.log("Ahora:", new Date());
  console.log("Inicio de reserva:", selectedDate);
  console.log("Diferencia en minutos:", (selectedDate.getTime() - Date.now()) / 60000);
  // ➤ Validar que hoy sea al menos 1 hora antes
  const isToday =
    new Date().toISOString().split("T")[0] === formData.date;

  if (isToday) {
    const now = new Date();
    const diffInMinutes = (selectedDate.getTime() - now.getTime()) / 60000;

    if (diffInMinutes < 30) {
      toast.error("Si reservas para hoy, debe ser al menos con 30 minutos de anticipación.");
      return;
    }
  }


  // Resto de validaciones y envío del formulario
  if (formData.equipment.length === 0) {
    toast.error("Debe seleccionar al menos un equipo");
    return;
  }

  if (!formData.aula) {
    toast.error("Debe seleccionar un aula");
    return;
  }

  if (!formData.date) {
    toast.error("La fecha de reserva es obligatoria");
    return;
  }

  if (!formData.startTime || !formData.endTime) {
    toast.error("Las horas de inicio y fin son obligatorias");
    return;
  }

  // Continúa con el envío como ya lo tienes...


  const payload = {
    user_id: user.id,
    equipo: formData.equipment.map((eq) => ({
      id: eq.value,
      cantidad: 1,
    })),
    aula: formData.aula.value,
    fecha_reserva: formData.date,
    startTime: formData.startTime,
    endTime: formData.endTime,
    tipo_reserva_id: formData.tipoReserva?.value,
  };

  try {
    setLoadingSubmit(true);
    const response = await api.post("/reservas", payload);
    toast.success("¡Reserva creada exitosamente!");
    handleClear();
  } catch (error) {
    console.error(error);
    toast.error("Error al crear la reserva. Intenta nuevamente.");
  } finally {
    setLoadingSubmit(false);
  }
};


  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Reservación de Equipos</h2>

      <form onSubmit={handleSubmit}>
        {/* Fecha */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaCalendarAlt className="me-2" />
            Fecha de Reserva
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="form-control"
            min={new Date().toISOString().split("T")[0]}
            max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
            required
          />
          {isTodaySelected && (
            <small className="form-text text-muted">
              La reservación debe hacerse con al menos 30 minutos de anticipación.
            </small>
          )}
        </div>

        {/* Horas */}
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
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              required
            >
               <option value="">Selecciona una hora</option>
                {timeOptions
                  .filter((time) => {
                    const [hourStr, minStr] = time.split(":");
                    const hour = Number(hourStr);
                    const minutes = Number(minStr);
                    // Permitir horas hasta 17:00 (sin 17:30)
                    return hour < 17 || (hour === 17 && minutes === 0);
                  })
                  .map((time) => (
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
                setFormData((prev) => ({ ...prev, endTime: e.target.value }))
              }
              required
            >
              <option value="">Selecciona una hora</option>
                {timeOptions
                  .filter((time) => {
                    const [hourStr, minStr] = time.split(":");
                    const hour = Number(hourStr);
                    const minutes = Number(minStr);
                    // Solo mostrar horas mayores a la hora de inicio seleccionada
                    if (formData.startTime) {
                      const [startHourStr, startMinStr] = formData.startTime.split(":");
                      const startHour = Number(startHourStr);
                      const startMinutes = Number(startMinStr);
                      const timeHourMin = hour * 60 + minutes;
                      const startHourMin = startHour * 60 + startMinutes;
                      if (timeHourMin <= startHourMin) return false;
                    }
                    // Limitar hora entrega hasta 20:00 (sin 20:30)
                    return hour < 20 || (hour === 20 && minutes === 0);
                  })
                  .map((time) => (
                    <option key={time} value={time}>
                      {formatTo12h(time)}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {/* TIPO RESERVA */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaCalendarAlt className="me-2" />
            Tipo de Reserva
          </label>
          {loadingTipoReserva ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <Select
              options={tipoReservaOptions}
              value={formData.tipoReserva}
              onChange={(selected) =>
                setFormData((prev) => ({
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

        {/* Multiselect Equipos */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaBoxes className="me-2" />
            Equipos Disponibles
            {checkingAvailability && (
              <span className="ms-2 spinner-border spinner-border-sm"></span>
            )}
          </label>
          {loadingEquipments ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
           <Select
              isMulti
              options={availableEquipmentOptions}
              value={formData.equipment}
              onChange={(selected) => {
                // Enriquecer con tipoEquipoId desde allEquipmentOptions
                const enriched = selected.map((s: any) => {
                  const full = allEquipmentOptions.find((e: any) => e.value === s.value);
                  return {
                    ...s,
                    tipoEquipoId: full?.tipoEquipoId,
                  };
                });

                setFormData((prev) => ({
                  ...prev,
                  equipment: enriched,
                }));
              }}
              isDisabled={
                !formData.tipoReserva ||
                checkingAvailability ||
                !isDateTimeComplete
              }
              placeholder={
                !isDateTimeComplete
                  ? "Selecciona fecha y hora primero"
                  : !formData.tipoReserva
                  ? "Selecciona un tipo de reserva primero"
                  : checkingAvailability
                  ? "Verificando disponibilidad..."
                  : availableEquipmentOptions.length === 0
                  ? "No hay equipos disponibles para este tipo"
                  : "Selecciona equipos disponibles"
              }
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "No hay opciones disponibles"}
            />
          )}
        </div>

        {/* Select Aula */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaSchool className="me-2" />
            Aula
          </label>
          {loadingAulas ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <Select
              options={aulaOptions}
              value={formData.aula}
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  aula: selected,
                }))
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

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={
              loadingSubmit ||
              checkingAvailability ||
              !isDateTimeComplete ||
              !formData.tipoReserva ||
              formData.equipment.length === 0 ||
              !formData.aula
            }
          >
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
      </form>
    </div>
  );
}

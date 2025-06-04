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
import { getTipoReservas } from "~/services/tipoReservaService";

export default function EquipmentReservationForm() {
  type OptionType = { value: string; label: string };

  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    tipoReserva: null as SingleValue<OptionType>,
    equipment: [] as MultiValue<OptionType>,
    aula: null as SingleValue<OptionType>,
  });

  const [allEquipmentOptions, setAllEquipmentOptions] = useState<OptionType[]>([]);
  const [availableEquipmentOptions, setAvailableEquipmentOptions] = useState<OptionType[]>([]);
  const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false); // Cambia a false inicial
  const [loadingAulas, setLoadingAulas] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [tipoReservaOptions, setTipoReservaOptions] = useState<OptionType[]>([]);
  const [loadingTipoReserva, setLoadingTipoReserva] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const { user } = useAuth();

  // Verifica si fecha y horas están completas
  const isDateTimeComplete = formData.date && formData.startTime && formData.endTime;

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
        setTipoReservaOptions(tipos.map(tr => ({
          value: tr.id.toString(),
          label: tr.nombre
        })));
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
      const options = data.map((item: any) => ({
        value: item.id,
        label: item.nombre,
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

  // Verificar disponibilidad de equipos cuando cambia la fecha/hora
  useEffect(() => {
    if (isDateTimeComplete && formData.tipoReserva && allEquipmentOptions.length > 0) {
      checkEquipmentAvailability(allEquipmentOptions);
    }
  }, [formData.date, formData.startTime, formData.endTime]);

  const checkEquipmentAvailability = async (equipments: OptionType[]) => {
    try {
      setCheckingAvailability(true);
      
      const availabilityChecks = equipments.map(async (equipo) => {
        try {
          const response = await api.get(`/equipos/${equipo.value}/disponibilidad`, {
            params: {
              fecha: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime
            }
          });
          
          return {
            ...equipo,
            available: response.data.disponibilidad.cantidad_disponible > 0
          };
        } catch (error) {
          console.error(`Error verificando disponibilidad para equipo ${equipo.value}`, error);
          return {
            ...equipo,
            available: false
          };
        }
      });

      const results = await Promise.all(availabilityChecks);
      const availableOptions = results.filter(equipo => equipo.available).map(equipo => ({
        value: equipo.value,
        label: equipo.label
      }));
      
      setAvailableEquipmentOptions(availableOptions);
      
      const currentSelected = formData.equipment.filter(eq => 
        availableOptions.some(opt => opt.value === eq.value)
      );
      
      if (currentSelected.length !== formData.equipment.length) {
        setFormData(prev => ({ ...prev, equipment: currentSelected }));
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

    const payload = {
      user_id: user.id,
      equipo: formData.equipment.map((eq) => ({
        id: eq.value,
        cantidad: 1
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
            required
          />
        </div>

        {/* Horas */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label className="form-label d-flex align-items-center">
              <FaClock className="me-2" />
              Hora de inicio
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label d-flex align-items-center">
              <FaClock className="me-2" />
              Hora de entrega
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="form-control"
              required
            />
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
              <div className="spinner-border text-primary" role="status">
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
                  equipment: []
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
              <span className="ms-2 spinner-border spinner-border-sm text-primary"></span>
            )}
          </label>
          {loadingEquipments ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <Select
              isMulti
              options={availableEquipmentOptions}
              value={formData.equipment}
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  equipment: selected,
                }))
              }
              isDisabled={!formData.tipoReserva || checkingAvailability || !isDateTimeComplete}
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
              isDisabled={!isDateTimeComplete || !formData.tipoReserva || formData.equipment.length === 0}
            />
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={loadingSubmit || checkingAvailability || !isDateTimeComplete || !formData.tipoReserva || formData.equipment.length === 0 || !formData.aula}
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
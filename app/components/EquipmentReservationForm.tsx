import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Select from "react-select";
import type { MultiValue, SingleValue } from "react-select";
import { useAuth } from "../hooks/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaBoxOpen,
  FaBoxes,
  FaSchool,
  FaSave,
  FaTimes,
  FaBroom,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function EquipmentReservationForm() {
  type OptionType = { value: string; label: string };

  const [formData, setFormData] = useState({
    equipment: [] as MultiValue<OptionType>,
    aula: null as SingleValue<OptionType>,
    date: "",
    startTime: "",
    endTime: "",
  });

  const [equipmentOptions, setEquipmentOptions] = useState<OptionType[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { user } = useAuth();

  const aulaOptions = [
    { value: "Aula 101", label: "Aula 101" },
    { value: "Aula 202", label: "Aula 202" },
    { value: "Auditorio", label: "Auditorio" },
    { value: "Sala de grabación", label: "Sala de grabación" },
  ];

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await api.get("/Obtenerequipos");
        const data = response.data;
        const options = data.map((item: any) => ({
          value: item.id,
          label: item.nombre,
        }));

        setEquipmentOptions(options);
      } catch (error) {
        toast.error("Error cargando los equipos. Intente nuevamente.");
      } finally {
        setLoadingEquipments(false);
      }
    };

    fetchEquipments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({
      equipment: [],
      aula: null,
      date: "",
      startTime: "",
      endTime: "",
    });
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
      equipo: formData.equipment.map((eq) => eq.value),
      aula: formData.aula.value,
      fecha_reserva: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    try {
      setLoadingSubmit(true);
      await api.post("/reservas", payload);
      toast.success("¡Reserva guardada exitosamente!");
      handleClear();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la reserva. Intenta nuevamente.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Reservación de Equipos</h2>

      <form onSubmit={handleSubmit}>
        {/* Multiselect Equipos */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaBoxes className="me-2" />
            Equipos
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
              options={equipmentOptions}
              value={formData.equipment}
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  equipment: selected,
                }))
              }
              placeholder="Selecciona equipos"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          )}
        </div>

        {/* Select Aula */}
        <div className="mb-4">
          <label className="form-label d-flex align-items-center">
            <FaSchool className="me-2" />
            Aula
          </label>
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
          />
        </div>

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

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={loadingSubmit}
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
          >
            <FaBroom className="me-2" />
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}

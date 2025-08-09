import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaLongArrowAltLeft, FaSave, FaTimes } from "react-icons/fa";
import { getEquipos } from "../services/equipoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import { getUsuariosM } from "../services/userService";
import { createMantenimiento } from "../services/mantenimientoService";
import { useAuth } from "~/hooks/AuthContext";
import { EstadoEquipo } from "~/types/estados";

const FormMantenimiento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getCurrentDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    equipo_id: id ? id.toString() : "",
    tipo_id: "",
    fecha_mantenimiento: getCurrentDate(),
    hora_mantenimiento_inicio: getCurrentTime(),
    detalles: "",
    user_id: user?.id.toString() || "",
  });

  const [equipos, setEquipos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equiposList, tiposList, usuariosList] = await Promise.all([
          getEquipos({}, id),
          getTiposMantenimiento(),
          getUsuariosM(),
        ]);

        setEquipos(equiposList?.data || []);
        setTipos(tiposList || []);
        setUsuarios(usuariosList?.data || []);
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const validateTimeRange = (time: string): boolean => {
    if (!time) return true;

    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    return totalMinutes >= 420 && totalMinutes <= 1020; // 7:00 AM a 5:00 PM
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes("hora_")) {
      setTimeError(null);
      setRangeError(null);
    }

    if (name === "hora_mantenimiento_inicio") {
      if (value) {
        if (!validateTimeRange(value)) {
          setRangeError("El horario debe estar entre 7:00 AM y 5:00 PM");
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTimeRange(formData.hora_mantenimiento_inicio)) {
      toast.error("La hora de inicio debe estar entre 7:00 AM y 5:00 PM");
      return;
    }

    if (!formData.equipo_id) {
      toast.error("Debe seleccionar un equipo.");
      return;
    }
    if (!formData.tipo_id) {
      toast.error("Debe seleccionar un tipo de mantenimiento.");
      return;
    }
    if (!formData.hora_mantenimiento_inicio) {
      toast.error("Debe ingresar la hora de inicio.");
      return;
    }

    setIsSubmitting(true);

    const dataToSend = {
      ...formData,
      equipo_id: Number(formData.equipo_id),
      tipo_id: Number(formData.tipo_id),
      user_id: Number(user.id),
      hora_mantenimiento_inicio:
        formData.hora_mantenimiento_inicio.length === 5
          ? formData.hora_mantenimiento_inicio
          : formData.hora_mantenimiento_inicio,
    };

    try {
      const result = await createMantenimiento(dataToSend);

      if (result.success) {
        toast.success(result.message);

        if (result.data.equipo?.estado_id === EstadoEquipo.Mantenimiento) {
          toast.success(
            `Equipo ${result.data.equipo.numero_serie} puesto en Mantenimiento`
          );
        } else {
          toast.error("El estado del equipo no fue actualizado");
        }
      } else {
        throw new Error(result.message);
      }

      navigate("/mantenimiento");
    } catch (error) {
      console.error("Error al procesar mantenimiento:", error);
      toast.error(error.message || "Error al procesar mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (!isSubmitting) navigate("/mantenimiento");
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="d-flex align-items-center mb-3">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem", marginRight: "0.5rem" }}
        />
        <h2 className="fw-bold">
          {id ? "Confirmación de Mantenimiento" : "Editar Mantenimiento"}
        </h2>
      </div>

      <div className="alert alert-info mt-3" role="alert">
        <strong>
          Importante: Actualmente te encuentras en la vista de confirmación de
          mantenimiento:
        </strong>{" "}
        El equipo no cambiará a estado "En Mantenimiento" hasta que confirmes y
        guardes este registro. Solo debes especificar el tipo de mantenimiento
        que se realizará y la descripción de mantenimiento a realizar.
      </div>

      <form onSubmit={handleSubmit}>
        {/* Equipo */}
        <div className="mb-3">
          <label className="form-label">Equipo</label>
          <select
            name="equipo_id"
            value={formData.equipo_id}
            onChange={handleChange}
            className="form-select"
            disabled={!!id || isSubmitting}
          >
            <option value="">Seleccione un equipo</option>
            {equipos
              .filter((equipo) => !equipo.es_componente)
              .map((equipo) => (
                <option key={equipo.id} value={equipo.id.toString()}>
                  {equipo.numero_serie || `Equipo #${equipo.id}`} -{" "}
                  {equipo.modelo?.nombre || ""}
                  {equipo.modelo?.marca?.nombre
                    ? ` (${equipo.modelo.marca.nombre})`
                    : ""}
                </option>
              ))}
          </select>
        </div>

        {/* Tipo de Mantenimiento */}
        <div className="mb-3">
          <label className="form-label">Tipo de Mantenimiento</label>
          <select
            name="tipo_id"
            value={formData.tipo_id}
            onChange={handleChange}
            className="form-select"
            disabled={isSubmitting}
          >
            <option value="">Seleccione un tipo de mantenimiento</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id.toString()}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha de mantenimiento */}
        <div className="mb-3">
          <label className="form-label">Fecha de mantenimiento</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            className="form-control"
            min={getCurrentDate()}
            disabled
          />
        </div>

        {/* Hora inicio */}
        <div className="mb-3">
          <label className="form-label">Hora inicio</label>
          <input
            type="time"
            name="hora_mantenimiento_inicio"
            value={formData.hora_mantenimiento_inicio}
            onChange={handleChange}
            className={`form-control ${
              timeError || rangeError ? "is-invalid" : ""
            }`}
            min="07:00"
            max="17:00"
            disabled
          />
          {timeError && <div className="invalid-feedback">{timeError}</div>}
          {rangeError && <div className="invalid-feedback">{rangeError}</div>}
        </div>

        {/* Detalles */}
        <div className="mb-3">
          <label className="form-label">Descripción de mantenimiento a realizar</label>
          <textarea
            name="detalles"
            value={formData.detalles}
            onChange={handleChange}
            className="form-control"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Botones */}
        <div className="form-actions d-flex gap-2 mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Guardando...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormMantenimiento;

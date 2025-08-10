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
import MantenimientoNoEncontrado from "./error/MantenimientoNoEncontrado";

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
    fecha_mantenimiento_final: "",
    hora_mantenimiento_final: "",
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
  const [dateError, setDateError] = useState<boolean>(false);
  const [finalDateError, setFinalDateError] = useState<boolean>(false);
  const [finalTimeError, setFinalTimeError] = useState<string | null>(null);
  const [finalRangeError, setFinalRangeError] = useState<string | null>(null);
  const [equipoNoEncontrado, setEquipoNoEncontrado] = useState(false);

  // Modifica el useEffect que carga los datos
useEffect(() => {
  const fetchData = async () => {
    try {
      setEquipoNoEncontrado(false);
      const [equiposList, tiposList, usuariosList] = await Promise.all([
        getEquipos({}, id),
        getTiposMantenimiento(),
        getUsuariosM(),
      ]);

      // Verificar si se encontró el equipo
      if (id && (!equiposList?.data || equiposList.data.length === 0)) {
        setEquipoNoEncontrado(true);
        return;
      }

      setEquipos(equiposList?.data || []);
      setTipos(tiposList || []);
      setUsuarios(usuariosList?.data || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setEquipoNoEncontrado(true);
      } else {
        toast.error("Error al cargar datos");
        console.error("Error:", error);
      }
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [id]);

// Agrega esta condición antes del render principal
if (equipoNoEncontrado) {
  return <MantenimientoNoEncontrado />;
}

  const validateTimeRange = (time: string): boolean => {
    if (!time) return true;

    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    return totalMinutes >= 420 && totalMinutes <= 1020; // 7:00 AM a 5:00 PM
  };

  const compareDateOnly = (dateStr: string): number => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day).setHours(0, 0, 0, 0);
    const todayDate = new Date().setHours(0, 0, 0, 0);
    return selectedDate - todayDate;
  };

  const validateCurrentTime = (time: string, date: string): boolean => {
    if (!time || !date) return true;
    const today = new Date().toLocaleDateString('en-CA');
    if (date !== today) return true;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const [hours, minutes] = time.split(':').map(Number);

    if (hours < currentHours) return false;
    if (hours === currentHours && minutes < currentMinutes) return false;
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    const newFormData = {
      ...formData,
      [name]: value,
    };

    // Validaciones para fecha y hora de inicio
    if (name === 'fecha_mantenimiento') {
      if (value) {
        const diff = compareDateOnly(value);
        setDateError(diff < 0);
      }
      setTimeError(null);
      setRangeError(null);
    }

    if (name === 'hora_mantenimiento_inicio') {
      if (value) {
        if (!validateTimeRange(value)) {
          setRangeError('El horario debe estar entre 7:00 AM y 5:00 PM');
        } else {
          setRangeError(null);
        }

        // const today = new Date().toLocaleDateString('en-CA');
        // if (newFormData.fecha_mantenimiento === today) {
        //   if (!validateCurrentTime(value, newFormData.fecha_mantenimiento)) {
        //     setTimeError('La hora no puede ser anterior a la hora actual');
        //   } else {
        //     setTimeError(null);
        //   }
        // }
      }
    }

    // Validaciones para fecha y hora final (solo si están presentes)
    if (name === 'fecha_mantenimiento_final') {
      if (value) {
        // Validar que no sea anterior a la fecha actual
        const diff = compareDateOnly(value);
        setFinalDateError(diff < 0);
        
        // Validar que no sea anterior a la fecha de inicio si está presente
        if (formData.fecha_mantenimiento && value < formData.fecha_mantenimiento) {
          setFinalDateError(true);
        }
      } else {
        setFinalDateError(false);
      }
    }

    if (name === 'hora_mantenimiento_final') {
      if (value) {
        // Validar rango horario
        if (!validateTimeRange(value)) {
          setFinalRangeError('El horario debe estar entre 7:00 AM y 5:00 PM');
        } else {
          setFinalRangeError(null);
        }

        // Validar que no sea anterior a la hora actual si es hoy
        const today = new Date().toLocaleDateString('en-CA');
        if (newFormData.fecha_mantenimiento_final === today) {
          if (!validateCurrentTime(value, newFormData.fecha_mantenimiento_final)) {
            setFinalTimeError('La hora no puede ser anterior a la hora actual');
          } else {
            setFinalTimeError(null);
          }
        }

        // Validar que no sea anterior a la hora de inicio si es el mismo día
        if (formData.fecha_mantenimiento === formData.fecha_mantenimiento_final && 
            formData.hora_mantenimiento_inicio && 
            value < formData.hora_mantenimiento_inicio) {
          setFinalTimeError('La hora final no puede ser anterior a la hora de inicio');
        }
      } else {
        setFinalTimeError(null);
        setFinalRangeError(null);
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTimeRange(formData.hora_mantenimiento_inicio)) {
      toast.error("La hora de inicio debe estar entre 7:00 AM y 5:00 PM");
      return;
    }

    if (formData.fecha_mantenimiento_final) {
      const diff = compareDateOnly(formData.fecha_mantenimiento_final);
      if (diff < 0) {
        toast.error("La fecha final no puede ser anterior al día actual");
        return;
      }

      if (formData.fecha_mantenimiento && 
          formData.fecha_mantenimiento_final < formData.fecha_mantenimiento) {
        toast.error("La fecha final no puede ser anterior a la fecha de inicio");
        return;
      }
    }

    if (formData.hora_mantenimiento_final) {
      if (!validateTimeRange(formData.hora_mantenimiento_final)) {
        toast.error("La hora final debe estar entre 7:00 AM y 5:00 PM");
        return;
      }

      if (formData.fecha_mantenimiento_final === new Date().toLocaleDateString('en-CA')) {
        if (!validateCurrentTime(formData.hora_mantenimiento_final, formData.fecha_mantenimiento_final)) {
          toast.error("La hora final no puede ser anterior a la hora actual");
          return;
        }
      }

      if (formData.fecha_mantenimiento === formData.fecha_mantenimiento_final && 
          formData.hora_mantenimiento_inicio && 
          formData.hora_mantenimiento_final < formData.hora_mantenimiento_inicio) {
        toast.error("La hora final no puede ser anterior a la hora de inicio");
        return;
      }
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
      fecha_mantenimiento_final: formData.fecha_mantenimiento_final || null,
      hora_mantenimiento_final: formData.hora_mantenimiento_final || null,
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
        Si no se especifica una hora de finalización, el tiempo de mantenimiento sera de 3 horas.
        Nota: El estado "En Mantenimiento" no se cambiara hasta que el usuario lo realice manualmente
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
          <label className="form-label">Fecha Inicio</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            className={`form-control ${dateError ? 'is-invalid' : ''}`}
            min={getCurrentDate()}
            disabled
          />
          {dateError && (
            <div className="invalid-feedback">
              No se pueden registrar mantenimientos con fecha anterior al día actual
            </div>
          )}
        </div>

        {/* Hora inicio */}
        <div className="mb-3">
          <label className="form-label">Hora Inicio</label>
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

        {/* Fecha Final (Opcional) */}
        <div className="mb-3">
          <label className="form-label">Fecha Final (Opcional)</label>
          <input
            type="date"
            name="fecha_mantenimiento_final"
            className={`form-control ${finalDateError ? 'is-invalid' : ''}`}
            value={formData.fecha_mantenimiento_final}
            onChange={handleChange}
            min={formData.fecha_mantenimiento || getCurrentDate()}
            disabled={isSubmitting}
          />
          {finalDateError && (
            <div className="invalid-feedback">
              La fecha final no puede ser anterior a la fecha actual o a la fecha de inicio
            </div>
          )}
        </div>

        {/* Hora Final (Opcional) */}
        <div className="mb-3">
          <label className="form-label">Hora Final (Opcional)</label>
          <input
            type="time"
            name="hora_mantenimiento_final"
            className={`form-control ${finalTimeError || finalRangeError ? 'is-invalid' : ''}`}
            value={formData.hora_mantenimiento_final}
            onChange={handleChange}
            min="07:00"
            max="17:00"
            disabled={isSubmitting}
          />
          {finalTimeError && <div className="invalid-feedback">{finalTimeError}</div>}
          {finalRangeError && <div className="invalid-feedback">{finalRangeError}</div>}
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
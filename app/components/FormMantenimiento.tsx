import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaTimes } from "react-icons/fa";

import { getEquipos } from "../services/equipoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import { getUsuariosM } from "../services/userService";
import {
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
} from "../services/mantenimientoService";
import { useAuth } from "~/hooks/AuthContext";
import { EstadoEquipo } from "~/types/estados";

const FormMantenimiento = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    equipo_id: "",
    tipo_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    hora_mantenimiento_final: "",
    detalles: "",
    user_id: "",
    vida_util: "",
  });

  const [equipos, setEquipos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [dateError, setDateError] = useState<boolean>(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [showVidaUtilAlert, setShowVidaUtilAlert] = useState(false);

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

        if (id) {
          setFormData((previous) => ({
            ...previous,
            equipo_id: id.toString(),
          }));
        }
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Función para validar el rango horario (7:00 AM a 5:00 PM)
  const validateTimeRange = (time: string): boolean => {
    if (!time) return true;
    
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // 7:00 AM = 420 minutos, 5:00 PM = 1020 minutos
    return totalMinutes >= 420 && totalMinutes <= 1020;
  };

  // Función para validar si la hora es mayor a la actual (solo si la fecha es hoy)
  const validateCurrentTime = (time: string, date: string): boolean => {
    if (!time || !date) return true;
    
    const today = new Date().toISOString().split('T')[0];
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

    // Limpiar errores previos
    if (name.includes('hora_')) {
      setTimeError(null);
      setRangeError(null);
    }

    if (name === "fecha_mantenimiento") {
      if (value) {
        const diff = compareDateOnly(value);
        setDateError(diff < 0);
      }
    }

    // Validaciones de tiempo cuando cambian los campos relevantes
    if (name === "hora_mantenimiento_inicio" || name === "hora_mantenimiento_final") {
      if (value) {
        // Validar rango laboral
        if (!validateTimeRange(value)) {
          setRangeError('El horario debe estar entre 7:00 AM y 5:00 PM');
        }
        
        // Validar hora actual solo para la fecha de hoy
        if (formData.fecha_mantenimiento === new Date().toISOString().split('T')[0]) {
          if (!validateCurrentTime(value, formData.fecha_mantenimiento)) {
            setTimeError('La hora no puede ser anterior a la hora actual');
          }
        }
      }
    }

    if (name !== "vida_util" && Number(formData.vida_util) <= 0) {
      setShowVidaUtilAlert(true);
    }
    if (name === "vida_util" && Number(value) > 0) {
      setShowVidaUtilAlert(false);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de fecha
    if (formData.fecha_mantenimiento) {
      const diff = compareDateOnly(formData.fecha_mantenimiento);
      if (diff < 0) {
        toast.error("La fecha no puede ser anterior al día actual");
        return;
      }
    }

    // Validación de rango horario
    if (!validateTimeRange(formData.hora_mantenimiento_inicio)) {
      toast.error("La hora de inicio debe estar entre 7:00 AM y 5:00 PM");
      return;
    }

    // Validación de hora actual
    if (formData.fecha_mantenimiento === new Date().toISOString().split('T')[0]) {
      if (!validateCurrentTime(formData.hora_mantenimiento_inicio, formData.fecha_mantenimiento)) {
        toast.error("La hora de inicio no puede ser anterior a la hora actual");
        return;
      }
    }

    // Validación de que la hora final sea mayor a la hora inicial
    // if (formData.hora_mantenimiento_inicio && formData.hora_mantenimiento_final) {
    //   const [startHours, startMinutes] = formData.hora_mantenimiento_inicio.split(':').map(Number);
    //   const [endHours, endMinutes] = formData.hora_mantenimiento_final.split(':').map(Number);
      
    //   const startTotal = startHours * 60 + startMinutes;
    //   const endTotal = endHours * 60 + endMinutes;
      
    //   if (endTotal <= startTotal) {
    //     toast.error("La hora final debe ser mayor a la hora de inicio");
    //     return;
    //   }
    // }

    // Validaciones básicas
    if (!formData.equipo_id) {
      toast.error("Debe seleccionar un equipo.");
      return;
    }
    if (!formData.tipo_id) {
      toast.error("Debe seleccionar un tipo de mantenimiento.");
      return;
    }
    if (!formData.fecha_mantenimiento) {
      toast.error("Debe ingresar la fecha de mantenimiento.");
      return;
    }
    if (!formData.hora_mantenimiento_inicio) {
      toast.error("Debe ingresar la hora de inicio.");
      return;
    }
    // if (!formData.hora_mantenimiento_final) {
    //   toast.error("Debe ingresar la hora final.");
    //   return;
    // }

    setIsSubmitting(true);

    const dataToSend = {
      ...formData,
      equipo_id: Number(formData.equipo_id),
      tipo_id: Number(formData.tipo_id),
      user_id: Number(user.id),
      vida_util: formData.vida_util === "" ? null : Number(formData.vida_util),
      hora_mantenimiento_inicio:
        formData.hora_mantenimiento_inicio.length === 5
          ? formData.hora_mantenimiento_inicio
          : formData.hora_mantenimiento_inicio,
      hora_mantenimiento_final:
        formData.hora_mantenimiento_final.length === 5
          ? formData.hora_mantenimiento_final 
          : formData.hora_mantenimiento_final,
    };

    try {
      const result = await createMantenimiento(dataToSend);
      
      if (result.success) {
        toast.success(result.message);
        console.log('Equipo actualizado:', result.data.equipo);
        
        if (result.data.equipo?.estado_id === EstadoEquipo.Mantenimiento) {
          toast.success(`Equipo ${result.data.equipo.numero_serie} puesto en Mantenimiento`);
        } else {
          toast.error('El estado del equipo no fue actualizado');
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

  const compareDateOnly = (dateStr: string): number => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day).setHours(0, 0, 0, 0);
    const todayDate = new Date().setHours(0, 0, 0, 0);
    return selectedDate - todayDate;
  };

  const getCurrentDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
    <div className="container mt-4">
      <h2>{id ? "Nuevo Mantenimiento" : "Editar Mantenimiento"}</h2>

      <div className="alert alert-info mt-3" role="alert">
        <strong>Importante:</strong> El equipo no cambiará a estado "En Mantenimiento" hasta que este registro sea guardado correctamente.
        {!formData.vida_util && (
          <span className="d-block mt-1">
            Además, para completar el proceso, es necesario registrar la vida útil estimada en horas.
          </span>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        {/* Equipo */}
        <div className="mb-3">
          <label>Equipo</label>
          <select
            name="equipo_id"
            value={formData.equipo_id}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Seleccione un equipo</option>
            {equipos
              .filter((equipo) => !equipo.es_componente)
              .map((equipo) => (
                <option key={equipo.id} value={equipo.id.toString()}>
                  {equipo.numero_serie || `Equipo #${equipo.id}`}
                </option>
              ))}
          </select>
        </div>

        {/* Tipo de Mantenimiento */}
        <div className="mb-3">
          <label>Tipo de Mantenimiento</label>
          <select
            name="tipo_id"
            value={formData.tipo_id}
            onChange={handleChange}
            className="form-select"
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
          <label>Fecha de mantenimiento</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            className={`form-control ${dateError ? 'is-invalid' : ''}`}
            min={getCurrentDate()}
          />
          {dateError && (
            <div className="invalid-feedback">
              No se pueden registrar mantenimientos con fecha anterior al día actual
            </div>
          )}
        </div>

        {/* Hora inicio */}
        <div className="mb-3 d-flex gap-3">
          <div className="flex-grow-1">
            <label>Hora inicio</label>
            <input
              type="time"
              name="hora_mantenimiento_inicio"
              value={formData.hora_mantenimiento_inicio}
              onChange={handleChange}
              className={`form-control ${timeError || rangeError ? 'is-invalid' : ''}`}
              min="07:00"
              max="17:00"
            />
            {timeError && <div className="invalid-feedback">{timeError}</div>}
            {rangeError && <div className="invalid-feedback">{rangeError}</div>}
          </div>
        </div>

        {/* Detalles */}
        <div className="mb-3">
          <label>Detalles</label>
          <textarea
            name="detalles"
            value={formData.detalles}
            onChange={handleChange}
            className="form-control"
            rows={3}
          />
        </div>

        {/* Vida útil */}
        <div className="mb-3">
          <label>Vida útil (horas)</label>
          <input
            type="number"
            name="vida_util"
            value={formData.vida_util}
            onChange={handleChange}
            min={0}
            className="form-control"
          />
        </div>

        {/* Botones */}
        <div className="d-flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Guardando...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar Cambios
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate("/mantenimiento")}
            className="btn btn-secondary"
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
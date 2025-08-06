import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaTimes, FaLongArrowAltLeft } from "react-icons/fa";
import { getEquipos } from "../../services/equipoService";
import { getTiposMantenimiento } from "../../services/tipoMantenimientoService";
import { getUsuarios } from "../../services/userService";
import { getFuturosMantenimiento } from "../../services/futuroMantenimientoService";
import {
  getMantenimientoById,
  updateMantenimiento,
} from "../../services/mantenimientoService";
import { useAuth } from "~/hooks/AuthContext";

const MantenimientoEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    equipo_id: "",
    tipo_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    detalles: "",
    user_id: "",
    vida_util: "",
  });

  const [equipos, setEquipos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [futuros, setFuturos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<boolean>(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [showVidaUtilAlert, setShowVidaUtilAlert] = useState(false);

  // Función para validar el rango horario (7:00 AM a 5:00 PM)
  const validateTimeRange = (time: string): boolean => {
    if (!time) return true;
    
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // 7:00 AM = 420 minutos, 5:00 PM = 1020 minutos
    return totalMinutes >= 420 && totalMinutes <= 1020;
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

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [
          mantenimiento,
          equiposList,
          tiposList,
          usuariosList,
          futurosList,
        ] = await Promise.all([
          getMantenimientoById(Number(id)),
          getEquipos(),
          getTiposMantenimiento(),
          getUsuarios(),
          getFuturosMantenimiento(),
        ]);

        setFormData({
          equipo_id: mantenimiento.equipo_id?.toString() || "",
          tipo_id: mantenimiento.tipo_id?.toString() || "",
          fecha_mantenimiento: mantenimiento.fecha_mantenimiento || "",
          hora_mantenimiento_inicio:
            mantenimiento.hora_mantenimiento_inicio?.slice(0, 5) || "",
          detalles: mantenimiento.detalles || "",
          user_id: mantenimiento.user_id?.toString() || "",
          vida_util: mantenimiento.vida_util?.toString() || "",
        });

        setEquipos(equiposList?.data || []);
        setTipos(tiposList || []);
        setUsuarios(usuariosList?.data || []);
        setFuturos(futurosList?.data || []);
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
    if (name === "hora_mantenimiento_inicio") {
      if (value) {
        // Validar rango laboral
        if (!validateTimeRange(value)) {
          setRangeError('El horario debe estar entre 7:00 AM y 5:00 PM');
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
    if (!id) return;

    // Validación de rango horario
    if (!validateTimeRange(formData.hora_mantenimiento_inicio)) {
      toast.error("La hora de inicio debe estar entre 7:00 AM y 5:00 PM");
      return;
    }

    // Validación de hora actual
    // if (formData.fecha_mantenimiento === new Date().toISOString().split('T')[0]) {
    //   if (!validateCurrentTime(formData.hora_mantenimiento_inicio, formData.fecha_mantenimiento)) {
    //     toast.error("La hora de inicio no puede ser anterior a la hora actual");
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
    if (!formData.hora_mantenimiento_inicio) {
      toast.error("Debe ingresar la hora de inicio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        equipo_id: Number(formData.equipo_id),
        tipo_id: Number(formData.tipo_id),
        user_id: Number(user.id),

        vida_util:
          formData.vida_util === "" ? null : Number(formData.vida_util),
        hora_mantenimiento_inicio:
          formData.hora_mantenimiento_inicio.length === 5
            ? formData.hora_mantenimiento_inicio
            : formData.hora_mantenimiento_inicio,
      };

      // Aquí NO pasamos token
      await updateMantenimiento(Number(id), dataToSend);

      toast.success("Mantenimiento actualizado");
      navigate("/mantenimiento"); // Ajustado a plural para coincidir con tu listado
    } catch (error: any) {
      console.error(
        "Error al actualizar mantenimiento:",
        error.response?.data || error
      );
      toast.error("Error al actualizar mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
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
          onClick={() => navigate("/mantenimiento")}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem", marginRight: "0.5rem" }}
        />
        <h2 className="fw-bold">Editar Mantenimiento</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Equipo (no editable) */}
        <div className="mb-3">
          <label className="form-label">Equipo</label>
          <select
            name="equipo_id"
            value={formData.equipo_id}
            onChange={handleChange}
            className="form-select"
            disabled
          >
            {equipos
              .filter((equipo) => !equipo.es_componente)
              .map((equipo) => (
                <option key={equipo.id} value={equipo.id.toString()}>
                  {equipo.numero_serie || `Equipo #${equipo.id}`}
                </option>
              ))}
          </select>
          <small className="text-muted">
            No se puede cambiar el equipo en modo edición
          </small>
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

        {/* Fecha de mantenimiento (no editable) */}
        <div className="mb-3">
          <label className="form-label">Fecha de mantenimiento</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            className={`form-control ${dateError ? 'is-invalid' : ''}`}
            min={getCurrentDate()}
            disabled
          />
          <small className="text-muted">
            No se puede cambiar la fecha en modo edición
          </small>
        </div>

        {/* Hora inicio */}
        <div className="mb-3">
          <label className="form-label">Hora inicio</label>
          <input
            type="time"
            name="hora_mantenimiento_inicio"
            value={formData.hora_mantenimiento_inicio}
            onChange={handleChange}
            className={`form-control ${timeError || rangeError ? 'is-invalid' : ''}`}
            min="07:00"
            max="17:00"
            disabled
          />
          {timeError && <div className="invalid-feedback">{timeError}</div>}
          {rangeError && <div className="invalid-feedback">{rangeError}</div>}
        </div>

        {/* Detalles */}
        <div className="mb-3">
          <label className="form-label">Detalles</label>
          <textarea
            name="detalles"
            value={formData.detalles}
            onChange={handleChange}
            className="form-control"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Vida útil */}
        <div className="mb-3">
          <label className="form-label">Vida útil (horas)</label>
          <input
            type="number"
            name="vida_util"
            value={formData.vida_util}
            onChange={handleChange}
            min={0}
            className="form-control"
            disabled={isSubmitting}
          />
        </div>

        {/* Botones */}
        <div className="form-actions d-flex gap-2 mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
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
            className="btn btn-secondary"
            onClick={() => navigate("/mantenimiento")}
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

export default MantenimientoEdit;
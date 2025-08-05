import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getFuturoMantenimientoById,
  updateFuturoMantenimiento,
} from "../../services/futuroMantenimientoService";
import { getEquipos } from "../../services/equipoService";
import { getTiposMantenimiento } from "../../services/tipoMantenimientoService";
import { FaSave, FaTimes, FaLongArrowAltLeft } from "react-icons/fa";
import { getUsuariosM } from "~/services/userService";
import { useTheme } from "~/hooks/ThemeContext";
import { getModelosByMarca } from "~/services/itemService";
import type { Equipo } from "~/types/item";

const FuturoMantenimientoEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [formData, setFormData] = useState({
    equipo_id: "",
    tipo_mantenimiento_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    user_id: "",
    vida_util: "",
  });

    const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [modelos, setModelos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
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
    return totalMinutes >= 420 && totalMinutes <= 1020; // 7:00 AM a 5:00 PM
  };

  // Función para validar si la hora es mayor a la actual
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
        const [mantenimiento, tiposList, usuariosList] = await Promise.all([
          getFuturoMantenimientoById(Number(id)),
          getTiposMantenimiento(),
          getUsuariosM()
        ]);

        // Obtener datos del equipo del mantenimiento
        const equipoData = mantenimiento.equipo || {
          id: mantenimiento.equipo_id,
          marca_id: mantenimiento.equipo?.marca_id,
          modelo_id: mantenimiento.equipo?.modelo_id,
          numero_serie: mantenimiento.equipo?.numero_serie,
        };

        setEquipo(equipoData);

        // Si tenemos marca_id, cargamos los modelos
        if (equipoData.marca_id) {
          const modelosList = await getModelosByMarca(equipoData.marca_id);
          setModelos(modelosList);
        }

        setFormData({
          equipo_id: mantenimiento.equipo_id?.toString() || "",
          tipo_mantenimiento_id: mantenimiento.tipo_mantenimiento_id?.toString() || "",
          fecha_mantenimiento: mantenimiento.fecha_mantenimiento || "",
          hora_mantenimiento_inicio: mantenimiento.hora_mantenimiento_inicio?.slice(0, 5) || "",
          user_id: mantenimiento.user_id?.toString() || "",
          vida_util: mantenimiento.vida_util?.toString() || "",
        });

        setUsuarios(usuariosList?.data || []);
        setTipos(tiposList?.data || tiposList || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Limpiar errores previos
    if (name === 'hora_mantenimiento_inicio') {
      setTimeError(null);
      setRangeError(null);
    }

    if (name === "fecha_mantenimiento") {
      if (value) {
        const diff = compareDateOnly(value);
        setDateError(diff < 0);
      }
    }

    if (name !== "vida_util" && Number(formData.vida_util) <= 0) {
      setShowVidaUtilAlert(true);
    }
    if (name === "vida_util" && Number(value) > 0) {
      setShowVidaUtilAlert(false);
    }

    if (name === "hora_mantenimiento_inicio") {
      if (value) {
        if (!validateTimeRange(value)) {
          setRangeError('El horario debe estar entre 7:00 AM y 5:00 PM');
        }

        if (formData.fecha_mantenimiento === new Date().toLocaleDateString('en-CA')) {
          if (!validateCurrentTime(value, formData.fecha_mantenimiento)) {
            setTimeError('La hora no puede ser anterior a la hora actual');
          }
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
    if (!id) return;

    // Validación de campos requeridos
    if (!formData.equipo_id) {
      toast.error("Debe seleccionar un equipo.");
      return;
    }
    if (!formData.tipo_mantenimiento_id) {
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
    if (!formData.user_id) {
      toast.error("Debe seleccionar un responsable.");
      return;
    }

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

    setIsSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        equipo_id: Number(formData.equipo_id),
        tipo_mantenimiento_id: Number(formData.tipo_mantenimiento_id),
        hora_mantenimiento_inicio:
          formData.hora_mantenimiento_inicio.length === 5
            ? formData.hora_mantenimiento_inicio
            : formData.hora_mantenimiento_inicio,
        user_id: Number(formData.user_id),
        vida_util:
          formData.vida_util === "" ? null : Number(formData.vida_util),
      };

      await updateFuturoMantenimiento(Number(id), dataToSend);
      toast.success("Futuro mantenimiento actualizado");
      navigate("/futuroMantenimiento");
    } catch (error: any) {
      console.error("Error al actualizar mantenimiento:", error.response?.data);
      toast.error(error.response?.data?.message || "Error al actualizar mantenimiento");
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
          onClick={() => navigate("/futuroMantenimiento")}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem", marginRight: "0.5rem" }}
        />
        <h2 className="fw-bold">Editar Futuro Mantenimiento</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Equipo (no editable) */}
         <div className="mb-3">
          <label className="form-label">Equipo</label>
          <div className="form-control" style={{
            backgroundColor: darkMode ? "#2d2d2d" : "#f8f9fa",
            color: darkMode ? "#f8f9fa" : "#212529",
            borderColor: darkMode ? "#444" : "#ced4da",
            padding: "0.375rem 0.75rem",
            minHeight: "38px",
            display: "flex",
            alignItems: "center"
          }}>
            {equipo ? (
              <>
                {/* {equipo.marca?.nombre || 'Marca no disponible'} {' '} */}
                {equipo.modelo?.nombre || 'Modelo no disponible'} {' '}
                ({equipo.numero_serie || 'Sin serie'})
              </>
            ) : (
              'Equipo no disponible'
            )}
          </div>
          <small className="text-muted">
            No se puede cambiar el equipo en modo edición
          </small>
        </div>

        {/* Tipo de Mantenimiento */}
        <div className="mb-3">
          <label className="form-label">Tipo de Mantenimiento</label>
          <select
            name="tipo_mantenimiento_id"
            value={formData.tipo_mantenimiento_id}
            onChange={handleChange}
            className="form-select"
            disabled={isSubmitting}
            style={{
              backgroundColor: darkMode ? "#2d2d2d" : "#fff",
              color: darkMode ? "#f8f9fa" : "#212529",
              borderColor: darkMode ? "#444" : "#ccc",
            }}
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
            className={`form-control ${dateError ? 'is-invalid' : ''}`}
            min={getCurrentDate()}
            style={{
              backgroundColor: darkMode ? "#2d2d2d" : "#fff",
              color: darkMode ? "#f8f9fa" : "#212529",
              borderColor: darkMode ? "#444" : "#ccc",
            }}
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
            className={`form-control ${timeError || rangeError ? 'is-invalid' : ''}`}
            min="07:00"
            max="17:00"
            disabled={isSubmitting}
            style={{
              backgroundColor: darkMode ? "#2d2d2d" : "#fff",
              color: darkMode ? "#f8f9fa" : "#212529",
              borderColor: darkMode ? "#444" : "#ccc",
            }}
          />
          {timeError && <div className="invalid-feedback">{timeError}</div>}
          {rangeError && <div className="invalid-feedback">{rangeError}</div>}
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
            style={{
              backgroundColor: darkMode ? "#2d2d2d" : "#fff",
              color: darkMode ? "#f8f9fa" : "#212529",
              borderColor: darkMode ? "#444" : "#ccc",
            }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Responsable</label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            className="form-select"
            disabled={isSubmitting}
            required
            style={{
              backgroundColor: darkMode ? "#2d2d2d" : "#fff",
              color: darkMode ? "#f8f9fa" : "#212529",
              borderColor: darkMode ? "#444" : "#ccc",
            }}
          >
            <option value="">Seleccione un responsable</option>
            {usuarios.map((user) => (
              <option key={user.id} value={user.id.toString()}>
                {`${user.first_name} ${user.last_name}`.trim()} ({user.email})
              </option>
            ))}
          </select>
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
            onClick={() => navigate("/futuroMantenimiento")}
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

export default FuturoMantenimientoEdit;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFuturoMantenimiento } from "../services/futuroMantenimientoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import { toast } from "react-hot-toast";
import { FaSave, FaTimes, FaLongArrowAltLeft } from "react-icons/fa";
import { getUsuariosM } from "~/services/userService";
import AsyncSelect from "react-select/async";
import { useTheme } from "~/hooks/ThemeContext";
import { buscarEquipos } from "~/services/prediccionService";
import { useAuth } from "~/hooks/AuthContext";
import { Role } from "~/types/roles";

interface Equipo {
  id: number;
  numero_serie?: string;
  nombre?: string;
  marca?: string;
  modelo?: string;
}

interface TipoMantenimiento {
  id: number;
  nombre: string;
}

interface FormData {
  equipo_id: string;
  tipo_mantenimiento_id: string;
  fecha_mantenimiento: string;
  hora_mantenimiento_inicio: string;
  user_id: string;
}

const FormFuturoMantenimiento = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [dateError, setDateError] = useState<boolean>(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const { user } = useAuth();
  const esEncargado = user?.role === Role.Encargado;

  const [formData, setFormData] = useState<FormData>({
    equipo_id: "",
    tipo_mantenimiento_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    user_id: "",
  });

  // Estilos para el AsyncSelect
  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      borderColor: darkMode ? "#444" : "#ccc",
      color: darkMode ? "#f8f9fa" : "#212529",
      minHeight: '38px',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    input: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: darkMode ? "#bbb" : "#666",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? (darkMode ? "#555" : "#d3d3d3")
        : isFocused
          ? (darkMode ? "#444" : "#e6e6e6")
          : "transparent",
      color: darkMode ? "#f8f9fa" : "#212529",
      cursor: "pointer",
    }),
  };

  // Función para cargar opciones de equipos
  const loadOptions = async (inputValue: string) => {
    const q = inputValue.trim();
    if (!q) return [];
    try {
      const equipos = await buscarEquipos(q, 10);
      return equipos.map((e: any) => ({
        label: `${e.marca || ''} ${e.modelo || ''} (${e.numero_serie || 'Sin serie'})`.trim(),
        value: e.id.toString(),
        originalData: e
      }));
    } catch (error) {
      console.error(error);
      toast.error("Error al buscar equipos");
      return [];
    }
  };

  // Manejar cambio en el AsyncSelect
  const handleEquipoChange = (selectedOption: any) => {
    setFormData({
      ...formData,
      equipo_id: selectedOption ? selectedOption.value : ""
    });
  };

  useEffect(() => {
    if (user && esEncargado) {
      setFormData(prev => ({ ...prev, user_id: user.id.toString() }));
    }
  }, [user]);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tiposList = await getTiposMantenimiento();
        setTipos(tiposList || []);

        // Si el usuario no es Encargado, entonces cargar usuarios
        if (user?.role !== Role.Encargado) {
          const usuariosList = await getUsuariosM();
          setUsuarios(usuariosList.data || []);
        } else {
          // Si es Encargado, establecer su propio ID como user_id por defecto
          setFormData(prev => ({
            ...prev,
            user_id: user.id.toString(),
          }));
        }
      } catch (error) {
        console.error("Error al cargar los datos:", error);
        toast.error("Error al cargar los datos.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const newFormData = {
      ...formData,
      [name]: value,
    };

    if (name === 'hora_mantenimiento_inicio') {
      setTimeError(null);
      setRangeError(null);
    }

    if (name === "fecha_mantenimiento") {
      if (value) {
        const diff = compareDateOnly(value);
        setDateError(diff < 0);
      }
      setTimeError(null);
      setRangeError(null);
    }

    if (name === "hora_mantenimiento_inicio") {
      if (value) {
        if (!validateTimeRange(value)) {
          setRangeError('El horario debe estar entre 7:00 AM y 5:00 PM');
        }

        const today = new Date().toLocaleDateString('en-CA');
        if (newFormData.fecha_mantenimiento === today) {
          if (!validateCurrentTime(value, newFormData.fecha_mantenimiento)) {
            setTimeError('La hora no puede ser anterior a la hora actual');
          }
        }
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (formData.fecha_mantenimiento) {
      const diff = compareDateOnly(formData.fecha_mantenimiento);
      if (diff < 0) {
        toast.error("La fecha no puede ser anterior al día actual");
        return;
      }
    }

    if (!validateTimeRange(formData.hora_mantenimiento_inicio)) {
      toast.error("La hora de inicio debe estar entre 7:00 AM y 5:00 PM");
      return;
    }

    if (formData.fecha_mantenimiento === new Date().toLocaleDateString('en-CA')) {
      if (!validateCurrentTime(formData.hora_mantenimiento_inicio, formData.fecha_mantenimiento)) {
        toast.error("La hora de inicio no puede ser anterior a la hora actual");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const dataToSend = {
        equipo_id: Number(formData.equipo_id),
        tipo_mantenimiento_id: Number(formData.tipo_mantenimiento_id),
        fecha_mantenimiento: formData.fecha_mantenimiento,
        hora_mantenimiento_inicio:
          formData.hora_mantenimiento_inicio.length === 5
            ? formData.hora_mantenimiento_inicio
            : formData.hora_mantenimiento_inicio,
        user_id: Number(formData.user_id),
      };

      await createFuturoMantenimiento(dataToSend);

      toast.success("Futuro mantenimiento creado con éxito", {
        id: "submit-toast",
        duration: 3000,
        position: "top-right",
      });

      navigate("/futuroMantenimiento");
    } catch (error) {
      console.error("Error al crear mantenimiento:", error);
      if (error.response && error.response.data && error.response.data.message &&
        error.response.data.message.includes('Ya existe un mantenimiento programado')) {
        toast.error(error.response.data.message, {
          duration: 5000,
        });
      } else {
        toast.error("Error al crear el mantenimiento.");
      }
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

  const validateTimeRange = (time: string): boolean => {
    if (!time) return true;
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 420 && totalMinutes <= 1020;
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

  if (isLoading) {
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
        <h2 className="fw-bold">Nuevo Futuro Mantenimiento</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Equipo - Ahora con AsyncSelect */}
        <div className="mb-3">
          <label className="form-label">Equipo</label>
          <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            styles={customSelectStyles}
            placeholder="Buscar equipo..."
            noOptionsMessage={() => "Escriba para buscar equipos"}
            loadingMessage={() => "Buscando..."}
            onChange={handleEquipoChange}
            isDisabled={isSubmitting}
          />
        </div>

        {/* Tipo de Mantenimiento */}
        <div className="mb-3">
          <label className="form-label">Tipo de Mantenimiento</label>
          <select
            name="tipo_mantenimiento_id"
            className="form-select"
            value={formData.tipo_mantenimiento_id}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="">Seleccione tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="mb-3">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            className={`form-control ${dateError ? 'is-invalid' : ''}`}
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            min={getCurrentDate()}
            disabled={isSubmitting}
          />
          {dateError && (
            <div className="invalid-feedback">
              No se pueden registrar mantenimientos con fecha anterior al día actual
            </div>
          )}
        </div>

        {/* Hora Inicio */}
        <div className="mb-3">
          <label className="form-label">Hora Inicio</label>
          <input
            type="time"
            name="hora_mantenimiento_inicio"
            className={`form-control ${timeError || rangeError ? 'is-invalid' : ''}`}
            value={formData.hora_mantenimiento_inicio}
            onChange={handleChange}
            min="07:00"
            max="17:00"
            disabled={isSubmitting}
          />
          {timeError && <div className="invalid-feedback">{timeError}</div>}
          {rangeError && <div className="invalid-feedback">{rangeError}</div>}
        </div>

        {/* Responsable */}
        {!esEncargado ? (
          <div className="mb-3">
            <label className="form-label">Responsable</label>
            <select
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="">Seleccione usuario</option>
              {usuarios.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {(user.nombre ??
                    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()) ||
                    `Usuario #${user.id}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="user_id" value={formData.user_id} />
        )}


        {/* Botones */}
        <div className="form-actions d-flex gap-2 mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
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

export default FormFuturoMantenimiento;
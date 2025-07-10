import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import Select, { type SingleValue } from "react-select";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaCheck,
  FaBroom,
  FaUser,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import { useAuth } from "app/hooks/AuthContext";
import { Role } from "~/types/roles";
import PanoramaViewer from "./PanoramaViewer";
import { formatTimeRangeTo12h } from "~/utils/time";

type Horario = {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[];
};

type Reserva = {
  fecha: string;
  horario: string;
};

type Aula = {
  id: number;
  name: string;
  image_path?: string;
  horarios: Horario[];
};

type OptionType = { value: string; label: string };

const messages = {
  update: {
    question: "¿Seguro que deseas actualizar esta reserva?",
    confirmText: "Sí, actualizar",
    cancelText: "Cancelar",
    success: "Reserva actualizada correctamente",
    error: "Error actualizando la reserva",
  },
};

export default function ReserveClassroom() {
  const { id } = useParams(); // Para edición
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // Estados
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [prestamistaOptions, setPrestamistaOptions] = useState<OptionType[]>(
    []
  );
  const [selectedPrestamista, setSelectedPrestamista] =
    useState<SingleValue<OptionType>>(null);

  const [aulaHorarios, setAulaHorarios] = useState<Horario[]>([]);
  const [aulaReservas, setAulaReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isDateTimeComplete = selectedDate && selectedTime;

  // Formato yyyy-mm-dd
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  // Carga aulas y prestamistas (solo si es admin o espacio encargado)
  useEffect(() => {
    toast.dismiss();
    const fetchAulas = async () => {
      try {
        const response = await api.get("/aulas");
        setAvailableClassrooms(response.data);
      } catch {
        toast.error("Error al cargar aulas");
      }
    };

    const fetchPrestamistas = async () => {
      if (
        user?.role === Role.Administrador ||
        user?.role === Role.EspacioEncargado
      ) {
        try {
          const res = await api.get("/usuarios/rol/Prestamista");
          const options = res.data.map((u: any) => ({
            value: u.id,
            label: `${u.first_name} ${u.last_name} (${u.email})`,
          }));
          setPrestamistaOptions(options);
        } catch {
          toast.error("Error al cargar usuarios prestamistas");
        }
      }
    };

    Promise.all([fetchAulas(), fetchPrestamistas()]).finally(() =>
      setLoading(false)
    );
  }, [user]);

  // Carga reserva para editar
  useEffect(() => {
    if (!id) return;

    const loadReserva = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reservas-aula/${id}`);
        setSelectedClassroom(data.aula.name);
        setSelectedDate(new Date(data.fecha));
        setSelectedTime(data.horario);
        if (data.user) {
          setSelectedPrestamista({
            value: data.user.id,
            label: `${data.user.first_name} ${data.user.last_name} (${data.user.email})`,
          });
        }
      } catch {
        toast.error("Error al cargar datos de la reserva");
      } finally {
        setLoading(false);
      }
    };

    loadReserva();
  }, [id]);

  // Al seleccionar aula: carga horarios y reservas filtrados
  const handleAulaSelect = async (aulaName: string) => {
    setSelectedClassroom(aulaName);
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedPrestamista(null);

    const aula = availableClassrooms.find((c) => c.name === aulaName);
    if (!aula) return;

    setLoadingHorarios(true);
    try {
      const { data } = await api.get(`/aulas/${aula.id}/horarios`);
      setAulaHorarios(data.horarios);
      setAulaReservas(data.reservas);
    } catch {
      toast.error("Error al cargar horarios del aula");
      setAulaHorarios([]);
      setAulaReservas([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  // Genera bloques de 100m entre start y end time
  const generateTimeSlots = (start: string, end: string): string[] => {
    const result: string[] = [];
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);

    while (current < endTime) {
      const next = new Date(current);
      next.setMinutes(current.getMinutes() + 100);
      if (next > endTime) break;

      result.push(
        `${current.toTimeString().slice(0, 5)} - ${next
          .toTimeString()
          .slice(0, 5)}`
      );
      current = next;
    }

    return result;
  };

  // Convierte "HH:mm" a minutos totales desde medianoche
  const parseTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // Verifica si dos rangos horarios se solapan
  const isOverlap = (slot: string, reserva: string): boolean => {
    const [slotStartStr, slotEndStr] = slot.split(" - ");
    const [resStartStr, resEndStr] = reserva.split(" - ");

    const slotStart = parseTime(slotStartStr);
    const slotEnd = parseTime(slotEndStr);
    const resStart = parseTime(resStartStr);
    const resEnd = parseTime(resEndStr);

    return slotStart < resEnd && resStart < slotEnd;
  };

  // Valida si una fecha es válida según horarios del aula
  const isDateEnabled = (date: Date): boolean => {
    if (loadingHorarios) return false;
    if (!aulaHorarios.length) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const dateString = formatDateLocal(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const horariosValidos = aulaHorarios.filter((h) => {
      return (
        h.days.includes(dayName) &&
        dateString >= h.start_date &&
        dateString <= h.end_date
      );
    });

    return horariosValidos.length > 0;
  };

  // Opciones de horarios disponibles (excluyendo reservados)
  const getTimeOptions = (): string[] => {
    if (!selectedDate || !aulaHorarios.length) return [];

    const dayName = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const horario = aulaHorarios.find((h) => {
      const current = formatDateLocal(selectedDate);
      return (
        h.days.includes(dayName) &&
        current >= h.start_date &&
        current <= h.end_date
      );
    });

    if (!horario) return [];

    let slots = generateTimeSlots(horario.start_time, horario.end_time);

    // Filtra slots que se solapan con alguna reserva en la misma fecha
    const reservasFecha = aulaReservas.filter(
      (r) => r.fecha.slice(0, 10) === formatDateLocal(selectedDate)
    );

    slots = slots.filter(
      (slot) => !reservasFecha.some((r) => isOverlap(slot, r.horario))
    );

    return slots;
  };

  // Confirmación de actualización
  const showConfirmationToast = () => {
    return new Promise<boolean>((resolve) => {
      toast.dismiss("confirmation-toast");
      toast(
        (t) => (
          <div>
            <p>{messages.update.question}</p>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                {messages.update.confirmText}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                {messages.update.cancelText}
              </button>
            </div>
          </div>
        ),
        { duration: 5000, id: "confirmation-toast" }
      );
    });
  };

  // Submit formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss("submit-toast");

    if (!selectedDate || !selectedTime || !selectedClassroom) {
      toast.error("Completa todos los campos", { id: "submit-toast" });
      return;
    }
    // Validación: Si la fecha es hoy, la hora seleccionada debe ser al menos 30 minutos después de la hora actual
    const now = new Date();
    const todayStr = formatDateLocal(now);
    const selectedDateStr = formatDateLocal(selectedDate);

    if (selectedDateStr === todayStr) {
      // La hora de inicio del slot seleccionado (ej: "08:40 - 10:20")
      const slotStartStr = selectedTime.split(" - ")[0];
      const [slotHour, slotMinute] = slotStartStr.split(":").map(Number);

      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(slotHour, slotMinute, 0, 0);

      const diffMinutes = (slotDateTime.getTime() - now.getTime()) / 60000;
      if (diffMinutes < 30) {
        toast.error(
          "Para reservas el mismo día, debe hacerse con al menos 30 minutos de anticipación.",
          { id: "submit-toast" }
        );
        return;
      }
    }
    if (id) {
      const userConfirmed = await showConfirmationToast();
      if (!userConfirmed) return;
    }

    const aula = availableClassrooms.find((c) => c.name === selectedClassroom);
    if (!aula) {
      toast.error("Aula no válida", { id: "submit-toast" });
      return;
    }

    try {
      setIsUpdating(true);
      const payload = {
        aula_id: aula.id,
        fecha: formatDateLocal(selectedDate),
        horario: selectedTime,
        user_id: selectedPrestamista?.value?.toString() || userId,
        estado: "pendiente",
      };

      if (id) {
        await api.put(`/reservas-aula/${id}`, payload);
        toast.success(messages.update.success, { id: "submit-toast" });
      } else {
        await api.post("/reservasAula", payload);
        toast.success("¡Reserva creada exitosamente!", { id: "submit-toast" });
      }

      await new Promise((res) => setTimeout(res, 1000));
      navigate("/reservations-room");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (id ? messages.update.error : "Error al guardar la reserva");
      toast.error(message, { id: "submit-toast" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Limpiar formulario o cancelar edición
  const handleClearOrCancel = async () => {
    try {
      setIsCancelling(true);
      await new Promise((res) => setTimeout(res, 200));
      if (id) {
        navigate(-1);
      } else {
        setSelectedDate(null);
        setSelectedTime("");
        setSelectedClassroom("");
        setSelectedPrestamista(null);
        setAulaHorarios([]);
        setAulaReservas([]);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // Datos aula seleccionada
  const selectedClassroomData = availableClassrooms.find(
    (c) => c.name === selectedClassroom
  );

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="form-container position-relative">
      <FaLongArrowAltLeft
        onClick={() => navigate("/reservations-room")}
        title="Regresar"
        style={{
          position: "absolute",
          left: "30px",
          cursor: "pointer",
          fontSize: "2rem",
          zIndex: 10,
        }}
      />
      <h2 className="mb-4 text-center fw-bold">
        <FaDoorOpen className="me-2" />
        {id ? "Editar Reserva" : "Reserva de Aula"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="classroom" className="form-label">
            <FaDoorOpen className="me-2" /> Aula
          </label>
          <select
            id="classroom"
            className="form-select"
            value={selectedClassroom}
            onChange={(e) => handleAulaSelect(e.target.value)}
            required
            disabled={!!id}
          >
            <option value="">Selecciona un aula</option>
            {availableClassrooms.map((aula) => (
              <option key={aula.id} value={aula.name}>
                {aula.name}
              </option>
            ))}
          </select>
          {id && (
            <div className="form-text text-muted">
              No se puede editar el aula en modo edición
            </div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="form-label">
            <FaCalendarAlt className="me-2" /> Fecha
          </label>
          <DatePicker
            id="date"
            selected={selectedDate}
            onChange={(date) => {
              if (date) {
                date.setHours(12, 0, 0, 0);
                setSelectedDate(date);
                setSelectedTime("");
              }
            }}
            className="form-control"
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona la fecha"
            required
            disabled={!selectedClassroom || !!id || loadingHorarios}
            filterDate={isDateEnabled}
          />
          {loadingHorarios && (
            <small className="text-muted">
              Cargando horarios disponibles...
            </small>
          )}
          {id && (
            <div className="form-text text-muted">
              No se puede editar la fecha en modo edición
            </div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="time" className="form-label">
            <FaClock className="me-2" /> Horario
          </label>
          <select
            id="time"
            className="form-select"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
            disabled={!selectedDate}
          >
            <option value="">Selecciona un horario</option>
            {getTimeOptions().map((slot, idx) => (
              <option key={idx} value={slot}>
                 {formatTimeRangeTo12h(slot)}
              </option>
            ))}
          </select>
        </div>

        {(user?.role === Role.Administrador ||
          user?.role === Role.EspacioEncargado) && (
          <div className="mb-4">
            <label className="form-label d-flex align-items-center">
              <FaUser className="me-2" /> Seleccionar Usuario
            </label>
            <Select
              options={prestamistaOptions}
              value={selectedPrestamista}
              onChange={(selected) => setSelectedPrestamista(selected)}
              placeholder="Selecciona un usuario prestamista"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={!isDateTimeComplete || !!id}
            />
            {id && (
              <div className="form-text text-muted">
                No se puede cambiar el usuario prestamista en modo edición
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={
              isUpdating ||
              !selectedDate ||
              !selectedTime ||
              !selectedClassroom ||
              ((user?.role === Role.Administrador ||
                user?.role === Role.EspacioEncargado) &&
                !selectedPrestamista)
            }
          >
            {isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Guardando...
              </>
            ) : (
              <>
                <FaCheck className="me-2" /> {id ? "Actualizar" : "Reservar"}
              </>
            )}
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleClearOrCancel}
            disabled={isUpdating || isCancelling}
          >
            {isCancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {id ? "Cancelando..." : "Limpiando..."}
              </>
            ) : (
              <>
                <FaBroom className="me-2" /> {id ? "Cancelar" : "Limpiar"}
              </>
            )}
          </button>
        </div>
      </form>

      {selectedClassroomData?.image_path && (
        <div className="mt-5">
          <h4 className="text-center mb-3">
            Vista Panorámica del Aula {selectedClassroomData.name}
          </h4>
          <div className="panorama-container">
            <PanoramaViewer
              image={selectedClassroomData.image_path}
              pitch={10}
              yaw={180}
              hfov={110}
            />
          </div>
        </div>
      )}
    </div>
  );
}

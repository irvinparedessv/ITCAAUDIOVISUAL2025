import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import Select, { type SingleValue } from "react-select";
import "pannellum/build/pannellum.css";
import PanoramaViewer from "./PanoramaViewer";
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

declare global {
  interface Window {
    pannellum: any;
  }
}

type Horario = {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[];
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
    error: "Error actualizando la reserva"
  }
};

export default function ReserveClassroom() {
  const { id } = useParams(); // <-- Para saber si estamos editando
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [prestamistaOptions, setPrestamistaOptions] = useState<OptionType[]>(
    []
  );
  const [selectedPrestamista, setSelectedPrestamista] =
    useState<SingleValue<OptionType>>(null);

  const { user } = useAuth();
  const userId = user?.id;

  const isDateTimeComplete = selectedDate && selectedTime;

  const handleBack = () => {
    navigate("/reservations-room"); // Regresa a la página anterior
  };


  const showConfirmationToast = () => {
    return new Promise((resolve) => {
      // Cierra cualquier confirmación anterior
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
                Cancelar
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000,
          id: "confirmation-toast", // ✅ ID fijo para evitar duplicados
        }
      );
    });
  };


  // === Cargar aulas y usuarios ===
  useEffect(() => {

    toast.dismiss(); // limpia cualquier confirmación colgada

    const fetchAulas = async () => {
      try {
        const response = await api.get("/aulas");
        setAvailableClassrooms(response.data);
      } catch {
        toast.error("Error al cargar aulas");
      }
    };

    const fetchPrestamistas = async () => {
      if (user?.role === Role.Administrador || user?.role === Role.EspacioEncargado) {
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

  // === Si es edición: cargar reserva ===
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

  const selectedClassroomData = availableClassrooms.find(
    (c) => c.name === selectedClassroom
  );

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
  };

  const generateTimeSlots = (start: string, end: string): string[] => {
    const result: string[] = [];
    const { hours: startH, minutes: startM } = parseTime(start);
    const { hours: endH, minutes: endM } = parseTime(end);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);

    while (current < endTime) {
      const next = new Date(current);
      next.setHours(current.getHours() + 2);
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

  const isRangeInFuture = (range: string, selectedDate: Date): boolean => {
    const [start] = range.split(" - ");
    const [hour, minute] = start.split(":").map(Number);
    const now = new Date();
    const rangeDate = new Date(selectedDate);
    rangeDate.setHours(hour, minute, 0, 0);
    return rangeDate > now;
  };

  const isDateEnabled = (date: Date): boolean => {
    if (!selectedClassroomData) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const dateString = formatDateLocal(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const horariosValidos = selectedClassroomData.horarios.filter((h) => {
      return (
        h.days.includes(dayName) &&
        dateString >= h.start_date &&
        dateString <= h.end_date
      );
    });

    if (horariosValidos.length === 0) return false;

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      for (const h of horariosValidos) {
        const slots = generateTimeSlots(h.start_time, h.end_time);
        if (slots.some((range) => isRangeInFuture(range, date))) return true;
      }
      return false;
    }

    return true;
  };

  const getTimeOptions = (): string[] => {
    if (!selectedDate || !selectedClassroomData) return [];
    const selectedDay = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const horario = selectedClassroomData.horarios.find((h) => {
      const current = formatDateLocal(selectedDate);
      return (
        h.days.includes(selectedDay) &&
        current >= h.start_date &&
        current <= h.end_date
      );
    });

    if (!horario) return [];

    let slots = generateTimeSlots(horario.start_time, horario.end_time);

    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDateOnly.getTime() === today.getTime()) {
      slots = slots.filter((range) => isRangeInFuture(range, selectedDate));
    }

    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Evita múltiples toasts iguales
    toast.dismiss("submit-toast");

    if (!selectedDate || !selectedTime || !selectedClassroom) {
      toast.error("Completa todos los campos", { id: "submit-toast" });
      return;
    }

    if (!id && (!selectedDate || !selectedTime || !selectedClassroom)) {
      toast.error("Completa todos los campos", { id: "submit-toast" });
      return;
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

      let response;
      if (id) {
        response = await api.put(`/reservas-aula/${id}`, payload);
        toast.success(messages.update.success, { id: "submit-toast" });
      } else {
        response = await api.post("/reservasAula", payload);
        toast.success("¡Reserva creada exitosamente!", { id: "submit-toast" });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await navigate("/reservations-room");

    } catch (error: any) {
      const message =
        error.response?.data?.message || (id ? messages.update.error : "Error al guardar la reserva");
      toast.error(message, { id: "submit-toast" });
    } finally {
      setIsUpdating(false);
    }
  };


  const handleClearOrCancel = async () => {
    try {
      setIsCancelling(true);

      // Pequeño delay para feedback visual (opcional)
      await new Promise(resolve => setTimeout(resolve, 200));

      if (id) {
        // Comportamiento para edición (cancelar)
        navigate(-1); // Regresar a la página anterior
      } else {
        // Comportamiento para creación (limpiar)
        setSelectedDate(null);
        setSelectedTime("");
        setSelectedClassroom("");
        setSelectedPrestamista(null);
      }

    } finally {
      setIsCancelling(false);
    }
  };

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
      {/* Flecha de regresar en esquina superior izquierda */}
      <FaLongArrowAltLeft
        onClick={handleBack}
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
            onChange={(e) => {
              setSelectedClassroom(e.target.value);
              setSelectedDate(null);
              setSelectedTime("");
              setSelectedPrestamista(null);
            }}
            required
            disabled={!!id} // DESHABILITADO en edición
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
            disabled={!selectedClassroom || !!id} // DESHABILITADO en edición
            filterDate={isDateEnabled}
          />
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
                {slot}
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
                isDisabled={!isDateTimeComplete || !!id} // Deshabilitado en edición
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
              isUpdating || // <-- Deshabilitar mientras se actualiza
              !selectedDate ||
              !selectedTime ||
              !selectedClassroom ||
              ((user?.role === Role.Administrador || user?.role === Role.EspacioEncargado) &&
                !selectedPrestamista)
            }
          >
            {isUpdating ? ( // <-- Mostrar texto diferente cuando se está actualizando
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
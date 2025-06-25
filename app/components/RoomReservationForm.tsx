import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import "pannellum/build/pannellum.css";
import PanoramaViewer from "./PanoramaViewer";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaCheck,
  FaBroom,
} from "react-icons/fa";
import { useAuth } from "app/hooks/AuthContext";

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

export default function ReserveClassroom() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isRangeInFuture = (range: string, selectedDate: Date): boolean => {
    const [start] = range.split(" - ");
    const [hour, minute] = start.split(":").map(Number);

    const now = new Date();
    const rangeDate = new Date(selectedDate);
    rangeDate.setHours(hour, minute, 0, 0);

    return rangeDate > now;
  };  



  const userId = user?.id;

  useEffect(() => {
    const fetchAulas = async () => {
      try {
        const response = await api.get("/aulas");
        setAvailableClassrooms(response.data);
      } catch (error) {
        console.error("Error al cargar aulas", error);
        toast.error("Error al cargar las aulas");
      } finally {
        setLoading(false);
      }
    };

    fetchAulas();
  }, []);

  const selectedClassroomData = availableClassrooms.find(
    (c) => c.name === selectedClassroom
  );

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

  const getCurrentAndNextWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (domingo) - 6 (sábado)

    const start = new Date(today);
    start.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 13); // 14 días en total (semana actual + próxima)
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };



  const isDateEnabled = (date: Date): boolean => {
    if (!selectedClassroomData) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ignorar fechas pasadas
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
      // Verificamos si algún rango aún está disponible hoy
      for (const h of horariosValidos) {
        const slots = generateTimeSlots(h.start_time, h.end_time);
        const hasAvailable = slots.some((range) =>
          isRangeInFuture(range, date)
        );
        if (hasAvailable) return true;
      }
      return false; // Si no hay ninguno disponible, desactiva el día
    }

    return true; // Otros días válidos sí pasan
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

    // Filtra rangos si es hoy
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
    if (!selectedDate || !selectedTime || !selectedClassroom) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    const aula = availableClassrooms.find((c) => c.name === selectedClassroom);
    if (!aula) {
      toast.error("Aula no válida");
      return;
    }

    try {
      const response = await api.post("/reservasAula", {
        aula_id: aula.id,
        fecha: formatDateLocal(selectedDate),
        horario: selectedTime,
        user_id: userId,
        estado: "pendiente",
      });

      console.log("Respuesta real:", response.data);


      toast.success("Reserva realizada con éxito");
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedClassroom("");
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar la reserva. Intenta nuevamente.");
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedClassroom("");
    toast.success("Formulario limpiado");
  };

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        <FaDoorOpen className="me-2" />
        Reserva de Aula
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="classroom" className="form-label">
            <FaDoorOpen className="me-2" />
            Aula
          </label>
          <select
            id="classroom"
            className="form-select"
            value={selectedClassroom}
            onChange={(e) => {
              setSelectedClassroom(e.target.value);
              setSelectedDate(null);
              setSelectedTime("");
            }}
            required
          >
            <option value="">Selecciona un aula</option>
            {availableClassrooms.map((aula) => (
              <option key={aula.id} value={aula.name}>
                {aula.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="form-label">
            <FaCalendarAlt className="me-2" />
            Fecha
          </label>
          <DatePicker
            id="date"
            selected={selectedDate}
            onChange={(date) => {
                if (date) {
                  date.setHours(12, 0, 0, 0); // <- ¡Evita el error por zona horaria!
                  setSelectedDate(date);
                  setSelectedTime("");
                }
            }}
            className="form-control"
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona la fecha"
            required
            disabled={!selectedClassroom}
            filterDate={isDateEnabled}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="time" className="form-label">
            <FaClock className="me-2" />
            Horario
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

        <div className="form-actions">
          <button type="submit" className="btn primary-btn">
            <FaCheck className="me-2" />
            Reservar Aula
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

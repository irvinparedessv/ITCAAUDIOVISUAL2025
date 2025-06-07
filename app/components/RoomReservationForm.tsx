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

  const isDateEnabled = (date: Date): boolean => {
    if (!selectedClassroomData) return false;

    return selectedClassroomData.horarios.some((h) => {
      const day = date.toLocaleDateString("en-US", { weekday: "long" });
      const current = date.toISOString().split("T")[0];
      return (
        h.days.includes(day) && current >= h.start_date && current <= h.end_date
      );
    });
  };

  const getTimeOptions = (): string[] => {
    if (!selectedDate || !selectedClassroomData) return [];

    const selectedDay = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const horario = selectedClassroomData.horarios.find((h) => {
      const current = selectedDate.toISOString().split("T")[0];
      return (
        h.days.includes(selectedDay) &&
        current >= h.start_date &&
        current <= h.end_date
      );
    });

    if (!horario) return [];

    return generateTimeSlots(horario.start_time, horario.end_time);
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
      await api.post("/reservasAula", {
        aula_id: aula.id,
        fecha: selectedDate.toISOString().split("T")[0],
        horario: selectedTime,
        user_id: userId,
        estado: "pendiente",
      });

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
              setSelectedDate(date);
              setSelectedTime("");
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

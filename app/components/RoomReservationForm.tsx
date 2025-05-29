import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import "pannellum/build/pannellum.css";
import PanoramaViewer from "./PanoramaViewer";
import toast from "react-hot-toast";
import { FaCalendarAlt, FaClock, FaDoorOpen, FaCheck } from "react-icons/fa";
import { useAuth } from "~/hooks/AuthContext";

type Aula = {
  id: number;
  name: string;
  image_path?: string;
};

const availableTimes = [
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
];

export default function ReserveClassroom() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const userId = user?.id; // simulado

  const selectedClassroomData = availableClassrooms.find(
    (classroom) => classroom.name === selectedClassroom
  );

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
  };

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Reserva de Aula</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="classroom" className="form-label">
            <FaDoorOpen className="me-2" />
            Aula
          </label>
          <select
            id="classroom"
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="">{loading ? 'Cargando aulas...' : 'Selecciona un aula'}</option>
            {availableClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.name}>
                {classroom.name}
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
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            className="form-control"
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona la fecha"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="time" className="form-label">
            <FaClock className="me-2" />
            Horario
          </label>
          <select
            id="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Selecciona un horario</option>
            {availableTimes.map((time, index) => (
              <option key={index} value={time}>
                {time}
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
            Limpiar
          </button>
        </div>
      </form>

      {selectedClassroomData?.image_path && (
        <div className="mt-5">
          <h4 className="text-center mb-4">Vista del Aula</h4>
          <div className="d-flex justify-content-center">
            <div style={{ width: '100%', maxWidth: '800px', height: '500px' }}>
              <PanoramaViewer
                image={selectedClassroomData.image_path}
                pitch={10}
                yaw={180}
                hfov={110}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
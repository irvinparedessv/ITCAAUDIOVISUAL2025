import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import "pannellum/build/pannellum.css";
import PanoramaViewer from "./PanoramaViewer";
import toast from "react-hot-toast";

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
  const [formError, setFormError] = useState<string>("");
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);

  const userId = 1; // Simulado

  useEffect(() => {
    const fetchAulas = async () => {
      try {
        const response = await api.get("/aulas");
        setAvailableClassrooms(response.data);
      } catch (error) {
        console.error("Error al cargar aulas", error);
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
      setFormError("Por favor, completa todos los campos.");
      return;
    }

    const aula = availableClassrooms.find((c) => c.name === selectedClassroom);
    if (!aula) {
      setFormError("Aula no válida.");
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
      setFormError("Error al enviar la reserva.");
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={5}>
          <h2 className="text-center mb-4">Reserva de Aula</h2>
          {formError && <div className="alert alert-danger">{formError}</div>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="classroom">
              <Form.Label>Aula</Form.Label>
              <Form.Select
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
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="date">
              <Form.Label>Fecha</Form.Label>
              <DatePicker
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
            </Form.Group>

            <Form.Group className="mb-3" controlId="time">
              <Form.Label>Horario</Form.Label>
              <Form.Select
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
              </Form.Select>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Reservar Aula
            </Button>
          </Form>
        </Col>
      </Row>

      {selectedClassroomData?.image_path && (
        <Row className="justify-content-center mt-4">
          <Col xs={12} md={8} lg={6}>
            <h4 className="text-center">Vista del Aula</h4>
            <PanoramaViewer
              image={selectedClassroomData.image_path}
              pitch={10}
              yaw={180}
              hfov={110}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
}

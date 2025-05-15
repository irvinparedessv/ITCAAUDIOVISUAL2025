import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ThreeSixty from "react-360-view";
import api from "../api/axios";
type Aula = {
  id: number;
  name: string;
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
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);

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

  // Simulación de usuario logueado (reemplaza por auth real)
  const userId = 1;

  const selectedClassroomData = availableClassrooms.find(
    (classroom) => classroom.name === selectedClassroom
  );

  useEffect(() => {
    setFormError("");
    setSuccessMessage("");
  }, [selectedDate, selectedTime, selectedClassroom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !selectedClassroom) {
      setFormError("Por favor, selecciona una fecha, una hora y un aula.");
      return;
    }

    const aula = availableClassrooms.find((c) => c.name === selectedClassroom);
    if (!aula) {
      setFormError("Aula no válida.");
      return;
    }

    try {
      const response = await api.post("/reservas", {
        aula_id: aula.id,
        fecha: selectedDate.toISOString().split("T")[0], // yyyy-mm-dd
        horario: selectedTime,
        user_id: userId,
        estado: "pendiente",
      });

      setSuccessMessage("Reserva realizada con éxito");
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedClassroom("");
    } catch (error: any) {
      console.error(error);
      setFormError("Error al enviar la reserva. Intenta nuevamente.");
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <h2 className="text-center mb-4">Reserva de Aula</h2>

          {formError && <div className="alert alert-danger">{formError}</div>}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="classroom">
              <Form.Label>Aula</Form.Label>
              <Form.Control
                as="select"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                required
              >
                <option value="">Selecciona un aula</option>
                {availableClassrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.name}>
                    {classroom.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group className="mb-3" controlId="date">
              <Form.Label>Fecha</Form.Label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona la fecha"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="time">
              <Form.Label>Horario</Form.Label>
              <Form.Control
                as="select"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                <option value="">Selecciona un horario</option>
                {availableTimes.map((time, index) => (
                  <option key={index} value={time}>
                    {time}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Reservar Aula
            </Button>
          </Form>
        </Col>
      </Row>

      {selectedClassroomData && (
        <Row className="justify-content-center mt-4">
          <Col xs={12} md={8} lg={6}>
            <h4 className="text-center">Vista del Aula</h4>
            <ThreeSixty
              amount={36}
              imagePath="https://scaleflex.airstore.io/demo/chair-360-36"
              fileName="chair_{index}.jpg?v1"
              spinReverse
            />
          </Col>
        </Row>
      )}
    </Container>
  );
}

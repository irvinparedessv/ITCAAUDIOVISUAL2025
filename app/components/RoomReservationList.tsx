import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Badge } from "react-bootstrap";
import api from "../api/axios";

const RoomReservationList = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const getEstadoVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning";
      case "cancelado":
        return "danger";
      case "aprobado":
        return "success";
      default:
        return "secondary";
    }
  };
  useEffect(() => {
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    setRange({ from: pastWeek, to: today });
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!range.from || !range.to) return;

      setIsLoading(true);
      try {
        const response = await api.get("/reservas-aula", {
          params: {
            from: range.from.toISOString(),
            to: range.to.toISOString(),
          },
        });
        setReservations(response.data);
      } catch (error) {
        console.error("Error al obtener reservas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [range.from, range.to]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="mt-4 px-3">
      <Row className="align-items-center mb-4">
        <Col>
          <h2>Reservas de Aulas</h2>
        </Col>
        <Col md="auto">
          <Row>
            <Col>
              <DatePicker
                selected={range.from}
                onChange={(date) =>
                  setRange((prev) => ({ ...prev, from: date }))
                }
                selectsStart
                startDate={range.from}
                endDate={range.to}
                placeholderText="Desde"
                className="form-control"
              />
            </Col>
            <Col>
              <DatePicker
                selected={range.to}
                onChange={(date) => setRange((prev) => ({ ...prev, to: date }))}
                selectsEnd
                startDate={range.from}
                endDate={range.to}
                placeholderText="Hasta"
                className="form-control"
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {isLoading ? (
        <Spinner animation="border" />
      ) : reservations.length === 0 ? (
        <p>No hay reservas en este rango de fechas.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {reservations.map((res: any) => (
            <Col key={res.id}>
              <Card>
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between align-items-center">
                    <span>{res.aula?.name || "Aula Desconocida"}</span>
                    <Badge bg={getEstadoVariant(res.estado)}>
                      {res.estado}
                    </Badge>
                  </Card.Title>
                  <Card.Text>
                    {formatDate(res.fecha)} - {res.horario}
                  </Card.Text>
                  <Card.Text>
                    Reservado por:{" "}
                    <strong>{res.user?.first_name || "Desconocido"}</strong>
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/reservas-aula/${res.id}`)}
                  >
                    Ver detalles
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default RoomReservationList;

import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const RoomReservationList = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    setRange({ from: pastWeek, to: today });
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("es-SV", {
      dateStyle: "medium",
      timeStyle: "short",
    });

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
                  <Card.Title>
                    {res.aula?.nombre || "Aula Desconocida"}
                  </Card.Title>
                  <Card.Text>
                    {formatDate(res.fecha_inicio)} - {formatDate(res.fecha_fin)}
                  </Card.Text>
                  <Card.Text>
                    Reservado por:{" "}
                    <strong>{res.profesor?.nombre || "Desconocido"}</strong>
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

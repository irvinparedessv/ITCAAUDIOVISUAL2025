import React, { useEffect, useState } from "react";
import { Button, Row, Col, Spinner, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../api/axios";

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
        if (response.data) setReservations(response.data.data);
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
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Aula</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Reservado por</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res: any) => (
              <tr key={res.id}>
                <td>{res.aula?.name || "Aula Desconocida"}</td>
                <td>{formatDate(res.fecha)}</td>
                <td>{res.horario}</td>
                <td>{res.user?.first_name || "Desconocido"}</td>
                <td>
                  <Badge bg={getEstadoVariant(res.estado)}>{res.estado}</Badge>
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/reservas-aula-admin/${res.id}`)}
                  >
                    Ver detalles
                  </Button>
                  <Button variant="primary" size="sm">
                    Aprobar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default RoomReservationList;

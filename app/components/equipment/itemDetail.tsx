import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import api from "~/api/axios";
import { FaLongArrowAltLeft, FaTools } from "react-icons/fa";

type Caracteristica = {
  nombre: string;
  valor: string;
};

type EquipoDetalle = {
  equipo_id: number;
  categoria: string;
  tipo_equipo: string;
  tipo_reserva: string | null;
  estado: string;
  marca: string;
  modelo: string;
  numero_serie: string | null;
  vida_util: number | null;
  detalles: string | null;
  fecha_adquisicion: string | null;
  comentario: string | null;
  caracteristicas: Caracteristica[];
};
type ItemDetailProps = {
  id?: string; // Hacer el id opcional
};
export default function ItemDetail({ id: propId }: ItemDetailProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Usamos el id de las props si está disponible, sino de los params
  const id = propId || paramId;

  // Resto del componente permanece igual...
  const [equipo, setEquipo] = useState<EquipoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEquipo = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/detalleEquipo/${id}`);
        setEquipo(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Error al cargar el equipo");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipo();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando detalles del equipo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-5 text-center">
        {error}
      </Alert>
    );
  }

  if (!equipo) {
    return (
      <Alert variant="warning" className="my-5 text-center">
        No se encontró el equipo.
      </Alert>
    );
  }

  const cleanEstado = equipo.estado.trim().toLowerCase();

  return (
    <Card className="shadow-lg my-4 border-0">
      <Card.Header
        className="text-white d-flex align-items-center gap-2"
        style={{
          backgroundColor: "#b1291d",
          borderRadius: "0.5rem 0.5rem 0 0",
          padding: "1.25rem",
        }}
      >
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <FaTools />
        <h5 className="mb-0">Detalle de Equipo</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={8}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Categoría:</strong> {equipo.categoria}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Tipo de equipo:</strong> {equipo.tipo_equipo}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Tipo de reserva:</strong>{" "}
                {equipo.tipo_reserva ?? "N/A"}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Estado:</strong>{" "}
                <Badge
                  bg={getBadgeColor(cleanEstado)}
                  className="text-uppercase"
                >
                  {capitalize(cleanEstado)}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Marca:</strong> {equipo.marca}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Modelo:</strong> {equipo.modelo}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Número de serie:</strong>{" "}
                {equipo.numero_serie ?? "No disponible"}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vida útil:</strong>{" "}
                {equipo.vida_util !== null ? equipo.vida_util + " años" : "N/A"}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Detalles:</strong> {equipo.detalles || "Ninguno"}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Fecha de adquisición:</strong>{" "}
                {equipo.fecha_adquisicion ?? "No disponible"}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Comentario:</strong> {equipo.comentario || "Ninguno"}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Características:</strong>
                {equipo.caracteristicas.length === 0 && (
                  <p className="mt-2">No hay características</p>
                )}
                {equipo.caracteristicas.length > 0 && (
                  <ul className="mt-2">
                    {equipo.caracteristicas.map((carac, i) => (
                      <li key={i}>
                        <strong>{carac.nombre}:</strong> {carac.valor}
                      </li>
                    ))}
                  </ul>
                )}
              </ListGroup.Item>
            </ListGroup>
          </Col>
          {/* Si quieres agregar más contenido o imagen a la derecha, ponlo aquí */}
          <Col
            md={4}
            className="d-flex flex-column align-items-center justify-content-center text-center mt-4 mt-md-0"
          >
            <p className="mb-2">
              <strong>Información adicional</strong>
            </p>
            {/* Aquí podrías poner una imagen del modelo o QR si tienes */}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

function getBadgeColor(estado: string) {
  switch (estado) {
    case "pendiente":
      return "warning";
    case "aprobado":
      return "success";
    case "devuelto":
      return "info";
    case "cancelado":
      return "danger";
    case "rechazado":
      return "secondary";
    default:
      return "dark";
  }
}

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

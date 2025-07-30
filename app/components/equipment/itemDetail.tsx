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
  Container,
  Tab,
  Tabs,
} from "react-bootstrap";
import api from "~/api/axios";
import { FaArrowLeft, FaTools, FaInfoCircle, FaCogs, FaHistory } from "react-icons/fa";
import { MdOutlineDescription, MdDateRange } from "react-icons/md";
import { BsFillTagFill } from "react-icons/bs";

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
  id?: string;
};

export default function ItemDetail({ id: propId }: ItemDetailProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = propId || paramId;

  const [equipo, setEquipo] = useState<EquipoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

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


  if (loading) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center my-5 py-5">
        <Spinner animation="grow" variant="primary" className="text-white py-3" style={{ backgroundColor: "#b1291d" }}  />
        <p className="mt-3 text-muted fs-5">Cargando detalles del equipo...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center shadow">
          <Alert.Heading>Error al cargar el equipo</Alert.Heading>
          <p>{error}</p>
          {/* <Button variant="outline-danger" onClick={handleBack}>
            <FaArrowLeft className="me-2" />
            Volver atrás
          </Button> */}
        </Alert>
      </Container>
    );
  }

  if (!equipo) {
    return (
      <Container className="my-5">
        <Alert variant="warning" className="text-center shadow">
          <Alert.Heading>Equipo no encontrado</Alert.Heading>
          <p>El equipo solicitado no existe o no está disponible.</p>
          {/* <Button variant="outline-warning" onClick={handleBack}>
            <FaArrowLeft className="me-2" />
            Volver atrás
          </Button> */}
        </Alert>
      </Container>
    );
  }

  const cleanEstado = equipo.estado.trim().toLowerCase();
  const formattedDate = equipo.fecha_adquisicion
    ? new Date(equipo.fecha_adquisicion).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : "No disponible";

  return (
    <Container className="my-4">
      {/* <Button 
        variant="outline-secondary" 
        onClick={handleBack}
        className="mb-3 d-flex align-items-center"
      >
        <FaArrowLeft className="me-2" />
        Volver
      </Button> */}

      <Card className="shadow-sm border-0">
        <Card.Header className="text-white py-3"
          style={{
            backgroundColor: "black",
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: "1.25rem",
          }}>
          <div className="d-flex align-items-center">
            <FaTools className="me-3 fs-4" />
            <div>
              <h2 className="h4 mb-0">{equipo.tipo_equipo}</h2>
              <small className="opacity-75">{equipo.categoria}</small>
            </div>
            <Badge
              pill
              bg={getBadgeColor(cleanEstado)}
              className="ms-auto text-uppercase py-2 px-3"
            >
              {capitalize(cleanEstado)}
            </Badge>
          </div>
        </Card.Header>

        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "general")}
            className="mb-4"
          >
            <Tab eventKey="general" title={<><FaInfoCircle className="me-1" /> General</>}>
              <Row className="mt-3">
                <Col md={6}>
                  <DetailItem
                    icon={<BsFillTagFill />}
                    title="Marca y Modelo"
                    value={`${equipo.marca} ${equipo.modelo}`}
                  />
                  <DetailItem
                    icon={<MdOutlineDescription />}
                    title="Número de serie"
                    value={equipo.numero_serie || "No disponible"}
                  />
                  <DetailItem
                    icon={<FaCogs />}
                    title="Tipo de reserva"
                    value={equipo.tipo_reserva || "N/A"}
                  />
                </Col>
                <Col md={6}>
                  <DetailItem
                    icon={<MdDateRange />}
                    title="Fecha de adquisición"
                    value={formattedDate}
                  />
                  <DetailItem
                    icon={<FaHistory />}
                    title="Vida útil"
                    value={equipo.vida_util ? `${equipo.vida_util} Horas` : "N/A"}
                  />
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="details" title={<><MdOutlineDescription className="me-1" /> Detalles</>}>
              <div className="mt-3">
                <h5 className="mb-3">Información adicional</h5>
                <DetailItem
                  title="Detalles"
                  value={equipo.detalles || "Ninguno"}
                  fullWidth
                />
                <DetailItem
                  title="Comentarios"
                  value={equipo.comentario || "Ninguno"}
                  fullWidth
                />
              </div>
            </Tab>

            <Tab eventKey="features" title={<><FaCogs className="me-1" /> Características</>}>
              <div className="mt-3">
                {equipo.caracteristicas.length === 0 ? (
                  <Alert variant="info">
                    No hay características registradas para este equipo
                  </Alert>
                ) : (
                  <Row>
                    {equipo.caracteristicas.map((carac, i) => (
                      <Col md={6} key={i} className="mb-3">
                        <div className=" p-3 rounded">
                          <strong>{carac.nombre}:</strong>
                          <div className="mt-1">{carac.valor}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

function DetailItem({ icon, title, value, fullWidth = false }: {
  icon?: React.ReactNode;
  title: string;
  value: string | React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`mb-3 ${fullWidth ? 'w-100' : ''}`}>
      <div className="d-flex align-items-center text-muted mb-1">
        {icon && <span className="me-2">{icon}</span>}
        <small className="fw-bold">{title}</small>
      </div>
      <div className="ps-4">
        {typeof value === 'string' ? (
          <p className="mb-0">{value}</p>
        ) : value}
      </div>
    </div>
  );
}

function getBadgeColor(estado: string) {
  const statusColors: Record<string, string> = {
    disponible: "success",
    enreparacion: "warning",
    dañado: "danger",
  };

  return statusColors[estado] || "dark";
}

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
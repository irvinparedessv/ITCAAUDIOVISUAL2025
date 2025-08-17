import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AulaReservacionEstadoModal from "../components/attendantadmin/RoomReservationStateModal";
import ReservacionEstadoModal from "./ReservacionEstado";
import {
  Card,
  ListGroup,
  Badge,
  Button,
  Row,
  Col,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../hooks/AuthContext";

import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import type { Room } from "~/types/reservationroom";
import type { ReservationStatus } from "~/types/reservation";
import { FaCalendarAlt, FaLongArrowAltLeft } from "react-icons/fa";
import { formatDateTimeTo12hHOURS } from "~/utils/time";
import ReservaNoEncontrada from "./error/ReservaNoEncontrada";
import VisualizarModal from "../components/attendantadmin/VisualizarModal";
import { APIURL } from "~/constants/constant";
import { Role } from "~/types/roles";
import toast from "react-hot-toast";

// Nuevos tipos para los props del backend
type EquipoReserva = {
  id: number;
  numero_serie: string;
  modelo: {
    id: number | null;
    nombre: string | null;
  };
  comentario?: string | null;
  es_componente?: boolean | 0 | 1;
};

type AulaReserva = {
  id: number;
  name: string;
  path_modelo: string;
  capacidad_maxima: number;
  descripcion: string;
  escala: string;
  created_at: string;
  updated_at: string;
  deleted: number;
};

type Reserva = {
  usuario: string;
  equipo?: EquipoReserva[];
  aula: AulaReserva | null;
  espacio?: Room; // sigue por compatibilidad con isRoom
  dia: string;
  id: number;
  horaSalida?: string;
  horaEntrada?: string;
  horario?: string;
  fechafin?: string;
  dias?: string[];
  estado: ReservationStatus;
  isRoom: boolean;
  image_url?: string | null;
  tipoReserva?: string;
  path_model: string;
  esPrioridad: boolean;
};

export default function ReservationDetail() {
  const { idQr } = useParams<{ idQr: string }>();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [accion, setAccion] = useState<"Aprobar" | "Rechazar" | null>(null);
  const [comentario, setComentario] = useState("");

  // ----------- Para Observaciones ----------
  const [showObsModal, setShowObsModal] = useState(false);
  const [equipoObs, setEquipoObs] = useState<EquipoReserva | null>(null);
  const [comentarioObs, setComentarioObs] = useState("");
  const [loadingObs, setLoadingObs] = useState(false);

  const { user } = useAuth();

  // ----------- Visualizador 3D ------------
  const [showModelViewer, setShowModelViewer] = useState(false);

  const navigate = useNavigate();

  function formatDayWithDate(fecha: string) {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  useEffect(() => {
    if (!idQr) return;

    const fetchReserva = async () => {
      try {
        const response = await api.get(`/reservasQR/${idQr}`);
        setReserva(response.data);
      } catch (err: any) {
        console.error(err);

        if (err.response) {
          if (err.response.status === 404) {
            setError("No se encontró la reserva.");
          } else if (err.response.status === 403) {
            setError("No tiene autorización para ver esta reserva.");
          } else {
            setError(
              `Error ${err.response.status}: ${
                err.response.data?.message || "Error desconocido"
              }`
            );
          }
        } else {
          setError("Error de red o servidor no disponible.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReserva();
  }, [idQr]);

  const handleAbrirModal = (tipo: "Aprobar" | "Rechazar") => {
    setAccion(tipo);
    setComentario("");
    setShowModal(true);
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setAccion(null);
  };

  const handleBack = () => {
    navigate("/reservations");
  };

  // ----- Observación -----
  const handleAbrirObsModal = (equipo: EquipoReserva) => {
    setEquipoObs(equipo);
    setComentarioObs(equipo.comentario || "");
    setShowObsModal(true);
  };

  const handleGuardarComentario = async () => {
    if (!equipoObs || !reserva || !comentarioObs.trim()) return;
    setLoadingObs(true);
    try {
      await api.post(`/equipo-reserva/observacion`, {
        reserva_id: reserva.id,
        equipo_id: equipoObs.id,
        comentario: comentarioObs.trim(),
      });
      setReserva((prev) => {
        if (!prev || !prev.equipo) return prev;
        return {
          ...prev,
          equipo: prev.equipo.map((eq) =>
            eq.id === equipoObs.id
              ? { ...eq, comentario: comentarioObs.trim() }
              : eq
          ),
        };
      });
      setShowObsModal(false);
      toast.success("Observación agregada");
    } catch (err) {
      alert("Error al guardar la observación");
    } finally {
      setLoadingObs(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando reserva...</p>
      </div>
    );
  }

  if (error) {
    return <ReservaNoEncontrada />;
  }

  if (!reserva) return null;

  // --- SEPARAR equipos e insumos ---
  const equipos = reserva.equipo?.filter((eq) => !eq.es_componente) || [];
  const insumos = reserva.equipo?.filter((eq) => eq.es_componente) || [];

  // --- Modelo 3D prioritario ---
  const path_modelo = !reserva.isRoom
    ? reserva.path_model
    : reserva.aula?.path_modelo;

  const qrData = reserva.isRoom
    ? `Reserva de aula para ${reserva.usuario} en ${
        reserva.espacio?.name ?? ""
      } el ${reserva.dia}`
    : `Reserva de ${reserva.usuario} - ${equipos
        .map(
          (eq) =>
            `${eq.modelo?.nombre || "Modelo desconocido"} (${eq.numero_serie})`
        )
        .join(", ")} en ${reserva.aula?.name ?? ""} el ${reserva.dia}`;

  const cleanEstado = reserva.estado.trim().toLowerCase();

  return (
    <>
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
            style={{
              cursor: "pointer",
              fontSize: "2rem",
            }}
          />
          <FaCalendarAlt />
          <h5 className="mb-0">
            Detalle de Reserva {reserva.isRoom ? "de Espacio" : "de Equipo"}
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Usuario:</strong> {reserva.usuario}
                </ListGroup.Item>

                {/* SOLO RESERVA DE EQUIPO */}
                {!reserva.isRoom && (
                  <>
                    <ListGroup.Item>
                      <strong>Aula:</strong> {reserva.aula?.name}
                      <br />
                      <small className="text-muted">
                        {reserva.aula?.descripcion}
                      </small>
                      {/* Botón para visualizar modelo 3D */}
                      {path_modelo && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="dark"
                            onClick={() => setShowModelViewer(true)}
                          >
                            Visualizar modelo 3D
                          </Button>
                        </div>
                      )}
                    </ListGroup.Item>
                    {/* Lista de Equipos */}
                    <ListGroup.Item>
                      <strong>Equipos:</strong>
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        {equipos.length > 0 ? (
                          equipos.map((eq) => (
                            <li key={eq.id} style={{ marginBottom: "0.75em" }}>
                              <span>
                                <strong>
                                  {eq.modelo?.nombre || "Modelo desconocido"}
                                </strong>{" "}
                                ({eq.numero_serie})
                              </span>
                              {eq.comentario && (
                                <div>
                                  <small className="text-muted">
                                    Observación: {eq.comentario}
                                  </small>
                                </div>
                              )}
                              <Button
                                size="sm"
                                className="ms-2"
                                variant="outline-primary"
                                onClick={() => handleAbrirObsModal(eq)}
                                style={{ marginTop: 4 }}
                              >
                                {eq.comentario
                                  ? "Editar observación"
                                  : "Agregar observación"}
                              </Button>
                            </li>
                          ))
                        ) : (
                          <span className="text-muted">No hay equipos</span>
                        )}
                      </ul>
                    </ListGroup.Item>
                    {/* Lista de Insumos */}
                    {insumos.length > 0 && (
                      <ListGroup.Item>
                        <strong>Insumos / Accesorios:</strong>
                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                          {insumos.map((insumo) => (
                            <li
                              key={insumo.id}
                              style={{ marginBottom: "0.75em" }}
                            >
                              <span>
                                <strong>
                                  {insumo.modelo?.nombre ||
                                    "Accesorio sin modelo"}
                                </strong>{" "}
                                ({insumo.numero_serie})
                              </span>
                              {insumo.comentario && (
                                <div>
                                  <small className="text-muted">
                                    Observación: {insumo.comentario}
                                  </small>
                                </div>
                              )}
                              <Button
                                size="sm"
                                className="ms-2"
                                variant="outline-primary"
                                onClick={() => handleAbrirObsModal(insumo)}
                                style={{ marginTop: 4 }}
                              >
                                {insumo.comentario
                                  ? "Editar observación"
                                  : "Agregar observación"}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </ListGroup.Item>
                    )}
                  </>
                )}

                {/* SOLO RESERVA DE AULA */}
                {reserva.isRoom && (
                  <ListGroup.Item>
                    <strong>Espacio:</strong> {reserva.espacio?.name}
                    {/* Botón para visualizar modelo 3D */}
                    {reserva.espacio.path_modelo && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="dark"
                          onClick={() => setShowModelViewer(true)}
                        >
                          Visualizar modelo 3D
                        </Button>
                      </div>
                    )}
                  </ListGroup.Item>
                )}

                <ListGroup.Item>
                  <strong>Día:</strong> {formatDayWithDate(reserva.dia)}
                </ListGroup.Item>
                {reserva.isRoom && reserva.fechafin && (
                  <ListGroup.Item>
                    <strong>Fecha Finalización:</strong>{" "}
                    {formatDayWithDate(reserva.fechafin)}
                  </ListGroup.Item>
                )}
                {!reserva.isRoom && reserva.horaSalida && (
                  <ListGroup.Item>
                    <strong>Hora de Reserva:</strong>{" "}
                    {formatDateTimeTo12hHOURS(reserva.horaSalida)}
                  </ListGroup.Item>
                )}

                {!reserva.isRoom && reserva.horaEntrada && (
                  <ListGroup.Item>
                    <strong>Hora de Entrega:</strong>{" "}
                    {formatDateTimeTo12hHOURS(reserva.horaEntrada)}
                  </ListGroup.Item>
                )}

                {reserva.isRoom && reserva.horario && (
                  <ListGroup.Item>
                    <strong>Horario:</strong> {reserva.horario}
                  </ListGroup.Item>
                )}
                {reserva.isRoom && reserva.dias && (
                  <ListGroup.Item>
                    <strong>Dias:</strong> {reserva.dias.join(", ")}
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>Estado:</strong>{" "}
                  <Badge
                    bg={getBadgeColor(cleanEstado)}
                    className="text-uppercase"
                  >
                    {capitalize(cleanEstado)}
                  </Badge>
                </ListGroup.Item>
              </ListGroup>
            </Col>

            <Col
              md={4}
              className="d-flex flex-column align-items-center justify-content-center text-center mt-4 mt-md-0"
            >
              <p className="mb-2">
                <strong>Código QR de la Reserva:</strong>
              </p>
              <QRCodeSVG value={qrData} size={140} />
            </Col>
          </Row>

          {reserva.isRoom ? (
            <div className="text-center mt-4">
              <Button
                variant="success"
                className="mx-2"
                onClick={() => handleAbrirModal("Aprobar")}
              >
                Actualizar Estados
              </Button>
            </div>
          ) : (
            <div className="text-center mt-4">
              {reserva.estado !== "Pendiente" && (
                <Button
                  variant="success"
                  className="mx-2"
                  onClick={() => handleAbrirModal("Aprobar")}
                >
                  Actualizar Estado
                </Button>
              )}

              {reserva.estado === "Pendiente" &&
                user.role === Role.Administrador && (
                  <Button
                    variant="success"
                    className="mx-2"
                    onClick={() => handleAbrirModal("Aprobar")}
                  >
                    Actualizar Estado
                  </Button>
                )}

              {reserva.estado === "Pendiente" &&
                user.role === Role.Encargado &&
                reserva.esPrioridad && (
                  <Alert variant="warning" className="mx-2">
                    NECESITA APROBACIÓN DE GERENTE. EQUIPO EN REPOSO.
                  </Alert>
                )}
              {reserva.estado === "Pendiente" &&
                user.role === Role.Administrador &&
                reserva.esPrioridad && (
                  <Alert variant="warning" className="mx-2">
                    NECESITA APROBACIÓN EQUIPO EN REPOSO.
                  </Alert>
                )}
              {reserva.estado === "Pendiente" &&
                user.role === Role.Encargado &&
                !reserva.esPrioridad && (
                  <Button
                    variant="success"
                    className="mx-2"
                    onClick={() => handleAbrirModal("Aprobar")}
                  >
                    Actualizar Estado
                  </Button>
                )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para observaciones */}
      <Modal show={showObsModal} onHide={() => setShowObsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {equipoObs?.comentario
              ? "Editar observación"
              : "Agregar observación"}{" "}
            al equipo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Equipo:</strong>{" "}
            {equipoObs?.modelo?.nombre || "Modelo desconocido"} (
            {equipoObs?.numero_serie})
          </p>
          <Form.Group controlId="observacionEquipo">
            <Form.Label>Comentario:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comentarioObs}
              onChange={(e) => setComentarioObs(e.target.value)}
              disabled={loadingObs}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowObsModal(false)}
            disabled={loadingObs}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleGuardarComentario}
            disabled={!comentarioObs.trim() || loadingObs}
          >
            {loadingObs ? "Guardando..." : "Guardar comentario"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para visualizar modelo 3D */}
      {path_modelo && (
        <VisualizarModal
          show={showModelViewer}
          onHide={() => setShowModelViewer(false)}
          path={APIURL + "/" + path_modelo}
        />
      )}
      {reserva.isRoom && reserva.espacio.path_modelo && (
        <VisualizarModal
          show={showModelViewer}
          onHide={() => setShowModelViewer(false)}
          path={APIURL + "/" + reserva.espacio.path_modelo}
          escala={reserva.espacio.escala}
        />
      )}
      {reserva.isRoom ? (
        <AulaReservacionEstadoModal
          show={showModal}
          onHide={handleCerrarModal}
          reservationId={reserva.id}
          currentStatus={reserva.estado}
          onSuccess={async (newEstado) => {
            setReserva({ ...reserva, estado: newEstado });
            setShowModal(false);
          }}
        />
      ) : (
        <ReservacionEstadoModal
          show={showModal}
          onHide={handleCerrarModal}
          reservationId={reserva.id}
          currentStatus={reserva.estado}
          onSuccess={async (newEstado) => {
            setReserva({ ...reserva, estado: newEstado });
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function getBadgeColor(estado: string) {
  const clean = estado.trim().toLowerCase();
  switch (clean) {
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
  const clean = text.trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

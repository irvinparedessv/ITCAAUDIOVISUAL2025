import { useState, useEffect } from "react"; // Añade useEffect aquí
import { Badge, Button, Modal } from "react-bootstrap";
import api from "../../api/axios";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useAuth } from "../../hooks/AuthContext";
import toast from "react-hot-toast";
import { FaEye, FaQrcode } from "react-icons/fa";


type Role = {
  id: number;
  nombre: string;
};


type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  estado: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  role_id: number;
  role: Role;
};


type Equipo = {
  id: number;
  nombre: string;
  descripcion: string;
  estado: number;
  cantidad: number;
  is_deleted: number;
  tipo_equipo_id: number;
  created_at: string;
  updated_at: string;
  pivot: {
    reserva_equipo_id: number;
    equipo_id: number;
  };
};


type CodigoQR = {
  id: string; // GUID
  reserva_id: number;
  created_at: string;
  updated_at: string;
};


type Reservation = {
  id: number;
  user_id: number;
  fecha_reserva: string;
  fecha_entrega: string;
  estado: "Pendiente" | "Entregado" | "Devuelto";
  created_at: string;
  updated_at: string;
  user: User;
  aula: string;
  equipos: Equipo[];
  codigo_qr: CodigoQR;
};


export default function ReservationList() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<
    "Aprobar" | "Rechazar" | null
  >(null);
  const [comentario, setComentario] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;


  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const qrBaseUrl = "https://midominio.com/qrcode/";


  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await api.get(`/reservas`);
        setReservations(response.data);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar las reservas");
      }
    };


    if (user?.id) {
      fetchReservations();
    }
  }, [user]);


  const handleDetailClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };


  const handleDecisionClick = (type: "Aprobar" | "Rechazar") => {
    setDecisionType(type);
    setComentario("");
    setShowDecisionModal(true);
  };


  const handleConfirmDecision = async () => {
    if (!selectedReservation || !decisionType) return;


    try {
      await api.post(`/reservas/${selectedReservation.id}/estado`, {
        estado: decisionType === "Aprobar" ? "Aprobado" : "Rechazado",
        comentario,
      });


      toast.success(`Reserva ${decisionType.toLowerCase()}da con éxito`);
      setShowDecisionModal(false);
      setShowModal(false);
      setSelectedReservation(null);


      // Opcional: recargar reservas
      const res = await api.get("/reservas");
      setReservations(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado de la reserva");
    }
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
  };


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReservations = reservations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );


  const totalPages = Math.ceil(reservations.length / itemsPerPage);


  // Función para paginación con puntos suspensivos
  const getPageNumbers = () => {
    const delta = 2; // páginas antes y después de la actual
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | null = null;


    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }


    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || range.includes(i)) {
        if (l !== null && i - (l as number) !== 1) {
          rangeWithDots.push("...");
        }
        rangeWithDots.push(i);
        l = i;
      }
    }


    return rangeWithDots;
  };


  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <h4 className="mb-3 text-center">Listado de Reservas</h4>


        <table
          className="table table-hover align-middle text-center overflow-hidden"
          style={{ borderRadius: "0.8rem" }}
        >
          <thead className="table-dark">
            <tr>
              <th className="rounded-top-start">Usuario</th>
              <th>Equipos</th>
              <th>Aula</th>
              <th>Fecha Salida</th>
              <th>Fecha Entrega</th>
              <th>Estado</th>
              <th className="rounded-top-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentReservations.map((reserva) => (
              <tr key={reserva.id}>
                <td className="fw-bold">
                  {reserva.user.first_name} - {reserva.user.last_name}{" "}
                </td>
                <td>
                  {reserva.equipos
                    .slice(0, 2)
                    .map((e) => e.nombre)
                    .join(", ")}
                  {reserva.equipos.length > 2 && "..."}
                </td>
                <td>{reserva.aula}</td>
                <td>{formatDate(reserva.fecha_reserva)}</td>
                <td>{formatDate(reserva.fecha_entrega)}</td>
                <td>
                  <Badge
                    bg={getBadgeColor(reserva.estado)}
                    className="px-3 py-2"
                    style={{ fontSize: "0.9rem" }}
                  >
                    {reserva.estado}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                      title="Ver detalles"
                      onClick={() => handleDetailClick(reserva)}
                      style={{
                        width: "44px",
                        height: "44px",
                        transition: "transform 0.2s ease-in-out",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <FaEye className="fs-5" />
                    </button>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant="success"
                        onClick={() => handleDecisionClick("Aprobar")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDecisionClick("Rechazar")}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  No hay reservas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
              </li>


              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <li key={`dots-${index}`} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                ) : (
                  <li
                    key={page}
                    className={`page-item ${
                      currentPage === page ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(Number(page))}
                    >
                      {page}
                    </button>
                  </li>
                )
              )}


              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <Modal
        show={showDecisionModal}
        onHide={() => setShowDecisionModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{decisionType} Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Comentario</label>
            <textarea
              className="form-control"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={`Escribe un comentario para ${decisionType?.toLowerCase()} la reserva...`}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDecisionModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant={decisionType === "Aprobar" ? "success" : "danger"}
            onClick={handleConfirmDecision}
          >
            Confirmar {decisionType}
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header
          closeButton
          className="text-white"
          style={{
            backgroundColor: "rgb(177, 41, 29)",
            borderBottom: "none",
            padding: "1.5rem",
          }}
        >
          <Modal.Title className="fw-bold">
            <i
              className="bi bi-card-checklist me-2"
              style={{ color: "#D4A017" }}
            ></i>
            Detalles de Reserva #{selectedReservation?.id}
          </Modal.Title>
        </Modal.Header>


        <Modal.Body style={{ padding: "2rem" }}>
          {selectedReservation && (
            <div className="row g-4">
              {/* Sección izquierda - Información principal */}
              <div className="col-md-6">
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="p-2 rounded me-3"
                      style={{ backgroundColor: "rgb(212, 158, 23)" }}
                    >
                      <i
                        className="bi bi-person-fill fs-4"
                        style={{ color: "#D4A017" }}
                      ></i>
                    </div>
                    <h5 className="fw-bold mb-0">Información del Usuario</h5>
                  </div>
                  <div className="ps-5">
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-person me-2 text-body-emphasis"></i>
                        Nombre
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {selectedReservation.user.first_name}{" "}
                        {selectedReservation.user.last_name}
                      </p>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-envelope me-2 text-body-emphasis"></i>
                        Correo
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {selectedReservation.user.email}
                      </p>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-telephone me-2 text-body-emphasis"></i>
                        Teléfono
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {selectedReservation.user.phone || (
                          <span className="text-body-secondary">
                            No registrado
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-person-gear me-2 text-body-emphasis"></i>
                        Rol
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {selectedReservation.user.role.nombre}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="p-2 rounded me-3"
                      style={{ backgroundColor: "rgb(212, 158, 23)" }}
                    >
                      <i
                        className="bi bi-calendar-check fs-4"
                        style={{ color: "#D4A017" }}
                      ></i>
                    </div>
                    <h5 className="fw-bold mb-0">Detalles de Reserva</h5>
                  </div>
                  <div className="ps-5">
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-door-open me-2 text-body-emphasis"></i>
                        Aula
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {selectedReservation.aula}
                      </p>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-box-arrow-right me-2 text-body-emphasis"></i>
                        Salida
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {formatDate(selectedReservation.fecha_reserva)}
                      </p>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-box-arrow-in-left me-2 text-body-emphasis"></i>
                        Entrega
                      </span>
                      <p className="mb-0 fw-semibold flex-grow-1">
                        {formatDate(selectedReservation.fecha_entrega)}
                      </p>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="d-inline-block text-nowrap me-3"
                        style={{ width: "100px", fontWeight: "500" }}
                      >
                        <i className="bi bi-info-circle me-2 text-body-emphasis"></i>
                        Estado
                      </span>
                      <Badge
                        bg={getBadgeColor(selectedReservation.estado)}
                        className="px-3 py-1 d-flex justify-content-center align-items-center"
                        style={{
                          fontSize: "0.85rem",
                          width: "100%", // Opcional: asegura que ocupe todo el ancho disponible
                        }}
                      >
                        {selectedReservation.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>


              {/* Sección derecha - Equipos y QR */}
              <div className="col-md-6">
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="p-2 rounded me-3"
                      style={{ backgroundColor: "rgb(212, 158, 23)" }}
                    >
                      <i
                        className="bi bi-pc-display fs-4"
                        style={{ color: "#D4A017" }}
                      ></i>
                    </div>
                    <h5 className="fw-bold mb-0">Equipos Reservados</h5>
                  </div>
                  <div className="ps-5">
                    <div className="list-group">
                      {selectedReservation.equipos.map((equipo) => (
                        <div
                          key={equipo.id}
                          className="list-group-item border-0 bg-body-secondary mb-2 rounded d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <h6 className="fw-bold mb-1 d-flex align-items-center">
                              <i
                                className="bi bi-pc-display-horizontal me-2"
                                style={{ color: "#D4A017" }}
                              ></i>
                              {equipo.nombre}
                            </h6>
                            <p className="small text-body-secondary mb-0">
                              {equipo.descripcion}
                            </p>
                          </div>
                          <span
                            className="badge rounded-pill bg-body-tertiary text-body-emphasis"
                            style={{ minWidth: "2rem" }}
                          >
                            1
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="p-2 rounded me-3"
                      style={{ backgroundColor: "rgb(212, 158, 23)" }}
                    >
                      <i
                        className="bi bi-qr-code-scan fs-4"
                        style={{ color: "#D4A017" }}
                      ></i>
                    </div>
                    <h5 className="fw-bold mb-0">Código QR</h5>
                  </div>


                  <div className="ps-5">
                    <div className="text-center">
                      {" "}
                      {/* Contenedor centrado para el QR */}
                      <div className="bg-body-secondary p-3 rounded-3 shadow-sm mb-3 d-inline-block">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrBaseUrl}${selectedReservation.codigo_qr.id}&size=150x150`}
                          alt="Código QR de Reserva"
                          style={{ width: "160px", height: "160px" }}
                        />
                      </div>
                    </div>


                    <div>
                      {" "}
                      {/* Mantenemos el texto alineado a la izquierda */}
                      <p className="small text-body-secondary mb-1">
                        Escanee este código para verificar la reserva
                      </p>
                      <p className="small bg-body-secondary p-2 rounded text-break">
                        <code className="text-body-secondary">
                          {qrBaseUrl}
                          {selectedReservation.codigo_qr.id}
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}


function getBadgeColor(estado: "Pendiente" | "Entregado" | "Devuelto") {
  switch (estado) {
    case "Pendiente":
      return "warning";
    case "Entregado":
      return "primary";
    case "Devuelto":
      return "success";
    default:
      return "secondary";
  }
}


function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}



import { useState, useEffect, useRef } from "react";
import { Badge, Button, Modal, Form } from "react-bootstrap";
import api from "../api/axios";
import { useAuth } from "../hooks/AuthContext";
import toast from "react-hot-toast";
import { FaEdit, FaEye, FaFilter } from "react-icons/fa";
import type { TipoReserva } from "app/types/tipoReserva";
import type { Bitacora } from "app/types/bitacora";
import { QRURL } from "~/constants/constant";
import type { Reservation } from "~/types/reservation";
import EquipmentDetailsModal from "./applicant/EquipmentDetailsModal";
import { useLocation, useNavigate } from "react-router-dom";
import 'animate.css';
import ReservacionEstadoModal from "./ReservacionEstado";
import { Role } from "~/types/roles";

export default function ReservationList() {
    const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const highlightRef = useRef<HTMLTableRowElement>(null);

  // Estados
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoaded, setReservationsLoaded] = useState(false);

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [historial, setHistorial] = useState<Bitacora[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialCache, setHistorialCache] = useState<Record<number, Bitacora[]>>({});
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [reservaSeleccionadaParaEstado, setReservaSeleccionadaParaEstado] = useState<Reservation | null>(null);
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);
  const [updatingReservationId, setUpdatingReservationId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [tipoReservas, setTipoReservas] = useState<TipoReserva[]>([]);
  const [mostrarSoloHoy, setMostrarSoloHoy] = useState(false);

  // --- Capturar page y highlightReservaId de location.state ---
  useEffect(() => {
    if (location.state?.page) {
      setCurrentPage(location.state.page);
    }
    if (location.state?.highlightReservaId) {
      setHighlightId(location.state.highlightReservaId);
    }

    if (location.state?.page || location.state?.highlightReservaId) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Cargar tipos de reserva
  useEffect(() => {
    const fetchTipoReservas = async () => {
      try {
        const response = await api.get("/tipo-reservas");
        setTipoReservas(response.data);
      } catch {
        toast.error("Error al cargar tipos de reserva");
      }
    };
    fetchTipoReservas();
  }, []);

  // Fetch reservas según filtros, página y mostrar solo hoy
  const fetchReservations = async () => {
    try {
      let endpoint = `/reservas/${user?.id}`;
      if (
        mostrarSoloHoy &&
        (user?.role === Role.Administrador || user?.role === Role.Encargado)
      ) {
        endpoint = "/reservas/dia";
      }

      const params: Record<string, any> = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      if (statusFilter !== "Todos") {
        params.estado = statusFilter;
      }
      if (typeFilter !== "Todos") {
        params.tipo_reserva = typeFilter;
      }

      const response = await api.get(endpoint, { params });

      setReservations(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalItems(response.data.total);
      setReservationsLoaded(true);
    } catch {
      toast.error("Error al cargar las reservas");
      setReservationsLoaded(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReservations();
    }
  }, [user, mostrarSoloHoy, currentPage, statusFilter, typeFilter]);

  // Scroll y resaltar solo cuando las reservas están cargadas
  useEffect(() => {
    if (highlightId !== null && reservationsLoaded) {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const timeout = setTimeout(() => {
        setHighlightId(null);
      }, 7000);

      return () => clearTimeout(timeout);
    }
  }, [highlightId, reservationsLoaded]);

  useEffect(() => {
    const fetchTipoReservas = async () => {
      try {
        const response = await api.get("/tipo-reservas");
        setTipoReservas(response.data);
      } catch (error) {
        toast.error("Error al cargar tipos de reserva");
      }
    };
    fetchTipoReservas();
  }, []);

  const fetchHistorial = async (reservaId: number) => {
    if (historialCache[reservaId]) {
      setHistorial(historialCache[reservaId]);
      return;
    }

    setLoadingHistorial(true);
    try {
      const response = await api.get(`/bitacoras/reserva/${reservaId}`);
      setHistorial(response.data);
      setHistorialCache((prev) => ({ ...prev, [reservaId]: response.data }));
    } catch (error) {
      toast.error("Error al cargar el historial de cambios");
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (showModal && selectedReservation) {
      fetchHistorial(selectedReservation.id);
    }
  }, [showModal, selectedReservation]);

 

  useEffect(() => {
    if (user?.id) {
      fetchReservations();
    }
  }, [user, mostrarSoloHoy, currentPage, statusFilter, typeFilter]);

  const handleDetailClick = (reservation: Reservation) => {
    setHistorial([]);
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
    setHighlightId(null);
  };

  const resetFilters = () => {
    setStatusFilter("Todos");
    setTypeFilter("Todos");
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | null = null;

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || range.includes(i)) {
        if (l !== null && i - l !== 1) {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Listado de Reservas</h4>
        {(user?.role === Role.Administrador || user?.role === Role.Encargado) && (
          <Button
            onClick={() => setMostrarSoloHoy(!mostrarSoloHoy)}
            className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2"
          >
            {mostrarSoloHoy ? "Ver todas las reservas" : "Ver reservas de hoy"}
          </Button>
        )}
      </div>

      <Button
        variant="outline-secondary"
        onClick={() => setShowFilters(!showFilters)}
        className="mb-3 d-flex align-items-center gap-2"
      >
        <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
      </Button>

      {showFilters && (
        <div className="p-3 rounded mb-4 border border-secondary">
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Entregado</option>
                  <option value="Devuelto">Devuelto</option>
                  <option value="Rechazado">Rechazado</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Tipo de reserva</Form.Label>
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Todos">Todos los tipos</option>
                  {tipoReservas.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <Button variant="outline-danger" onClick={resetFilters} className="w-100">
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      <table className="table table-hover align-middle text-center overflow-hidden">
        <thead className="table-dark">
          <tr>
            <th>Usuario</th>
            <th>Tipo Reserva</th>
            <th>Equipos</th>
            <th>Aula</th>
            <th>Fecha Salida</th>
            <th>Fecha Entrega</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reserva) => {
            const isHighlighted = reserva.id === highlightId;
            return (
              <tr
                key={reserva.id}
                ref={isHighlighted ? highlightRef : null}
                className={`${isHighlighted ? "table-warning animate__animated animate__flash" : ""}`}
              >
                <td className="fw-bold">
                  {reserva.user.first_name}-{reserva.user.last_name}
                </td>
                <td>{reserva.tipo_reserva?.nombre}</td>
                <td>
                  {reserva.equipos.slice(0, 2).map((e) => e.nombre).join(", ")}
                  {reserva.equipos.length > 2 && "..."}
                </td>
                <td>{reserva.aula}</td>
                <td>{formatDate(reserva.fecha_reserva)}</td>
                <td>{formatDate(reserva.fecha_entrega)}</td>
                <td>
                  <Badge bg={getBadgeColor(reserva.estado)} className="px-3 py-2">
                    {reserva.estado}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-outline-primary rounded-circle"
                      onClick={() => handleDetailClick(reserva)}
                      style={{ width: "44px", height: "44px" }}
                    >
                      <FaEye className="fs-5" />
                    </button>

                    {user?.role !== Role.Prestamista && (
                      <button
                        className="btn btn-outline-success rounded-circle"
                        onClick={() => {
                          if (updatingReservationId !== null) return;
                          setReservaSeleccionadaParaEstado(reserva);
                          setShowEstadoModal(true);
                        }}
                        style={{ width: "44px", height: "44px" }}
                        title="Actualizar estado"
                        disabled={updatingReservationId === reserva.id}
                      >
                        <FaEdit className="fs-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {reservations.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-muted">
                No hay reservas que coincidan con los filtros
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {reservaSeleccionadaParaEstado && (
        <ReservacionEstadoModal
          show={showEstadoModal}
          onHide={() => {
            setShowEstadoModal(false);
            setUpdatingReservationId(null);
            setHighlightId(null);
          }}
          reservationId={reservaSeleccionadaParaEstado.id}
          currentStatus={reservaSeleccionadaParaEstado.estado}
          onBefore={() => setUpdatingReservationId(reservaSeleccionadaParaEstado.id)}
          onAfter={() => setUpdatingReservationId(null)}
          onSuccess={(newEstado) => {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === reservaSeleccionadaParaEstado.id
                  ? { ...r, estado: newEstado }
                  : r
              )
            );
            setShowEstadoModal(false);
            setUpdatingReservationId(null);
            setHighlightId(null);
          }}
        />
      )}

      <nav className="d-flex justify-content-center mt-4">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
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
              <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(Number(page))}>
                  {page}
                </button>
              </li>
            )
          )}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
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

      <EquipmentDetailsModal
        getBadgeColor={getBadgeColor}
        formatDate={formatDate}
        handleCloseModal={handleCloseModal}
        showModal={showModal}
        loadingHistorial={loadingHistorial}
        selectedReservation={selectedReservation}
        historial={historial}
        qrBaseUrl={QRURL}
      />
    </div>
  );
}

function getBadgeColor(estado: string) {
  switch (estado) {
    case "Pendiente":
      return "warning";
    case "Aprobado":
      return "primary";
    case "Devuelto":
      return "success";
    case "Rechazado":
      return "danger";
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

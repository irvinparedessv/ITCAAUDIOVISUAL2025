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

export default function ReservationList() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const highlightId = location.state?.highlightReservaId;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const qrBaseUrl = QRURL;
  const [historial, setHistorial] = useState<Bitacora[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialCache, setHistorialCache] = useState<Record<number, Bitacora[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [tipoReservas, setTipoReservas] = useState<TipoReserva[]>([]);

  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    const fetchTipoReservas = async () => {
      try {
        const response = await api.get("/tipo-reservas");
        setTipoReservas(response.data);
      } catch (error) {
        console.error("Error al obtener tipos de reserva:", error);
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
      console.error("Error al obtener historial:", error);
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
    const fetchReservations = async () => {
      try {
        const response = await api.get(`/reservas/${user?.id}`);
        setReservations(response.data);
        setFilteredReservations(response.data);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar las reservas");
      }
    };

    if (user?.id) {
      fetchReservations();
    }
  }, [user]);

  useEffect(() => {
    let result = [...reservations];

    if (statusFilter !== "Todos") {
      result = result.filter((reserva) => reserva.estado === statusFilter);
    }

    if (typeFilter !== "Todos") {
      result = result.filter(
        (reserva) => reserva.tipo_reserva?.nombre === typeFilter
      );
    }

    setFilteredReservations(result);
  }, [statusFilter, typeFilter, reservations]);

  const handleDetailClick = (reservation: Reservation) => {
    setHistorial([]);
    setSelectedReservation(reservation);
    setShowModal(true);

    // No limpiamos el estado para que el elemento siga siendo el primero
    // navigate(".", { replace: true, state: {} });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
    navigate(".", { replace: true, state: {} }); // Limpia el highlight al cerrar modal
  };

  const resetFilters = () => {
    setStatusFilter("Todos");
    setTypeFilter("Todos");
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // 🔁 Aquí movemos el highlight al principio
  let orderedReservations = [...filteredReservations];
  if (highlightId) {
    const index = orderedReservations.findIndex((r) => r.id === highlightId);
    if (index !== -1) {
      const [highlighted] = orderedReservations.splice(index, 1);
      orderedReservations.unshift(highlighted);
    }
  }

  const paginatedReservations = orderedReservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orderedReservations.length / itemsPerPage);

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0 text-center">Listado de Reservas</h4>
          <Button
            variant="outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="d-flex align-items-center gap-2"
          >
            <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>
        </div>

        {showFilters && (
          <div className="p-3 rounded mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="approved">Entregado</option>
                    <option value="returned">Devuelto</option>
                    <option value="rejected">Rechazado</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Tipo de reserva</Form.Label>
                  <Form.Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
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
            {paginatedReservations.map((reserva) => {
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

                      <button
                        className="btn btn-outline-success rounded-circle"
                        onClick={() => navigate(`/actualizarEstado/${reserva.id}`)}
                        style={{ width: "44px", height: "44px" }}
                        title="Actualizar estado"
                      >
                        <FaEdit className="fs-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredReservations.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted">
                  {reservations.length === 0
                    ? "No hay reservas registradas"
                    : "No hay reservas que coincidan con los filtros"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
      </div>

      <EquipmentDetailsModal
        getBadgeColor={getBadgeColor}
        formatDate={formatDate}
        handleCloseModal={handleCloseModal}
        showModal={showModal}
        loadingHistorial={loadingHistorial}
        selectedReservation={selectedReservation}
        historial={historial}
      />
    </div>
  );
}

function getBadgeColor(estado: "Pendiente" | "Entregado" | "Devuelto" | string) {
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

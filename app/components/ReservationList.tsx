import { useState, useEffect, useRef } from "react";
import {
  Badge,
  Button,
  Modal,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import api from "../api/axios";
import { useAuth } from "../hooks/AuthContext";
import toast from "react-hot-toast";
import { FaCalendarAlt, FaCalendarDay, FaEdit, FaExchangeAlt, FaEye, FaFilter, FaLongArrowAltLeft, FaPlus, FaQrcode, FaSearch, FaTimes } from "react-icons/fa";
import type { TipoReserva } from "app/types/tipoReserva";
import type { Bitacora } from "app/types/bitacora";
import { QRURL } from "~/constants/constant";
import type { Reservation } from "~/types/reservation";
import EquipmentDetailsModal from "./applicant/EquipmentDetailsModal";
import { useLocation, useNavigate } from "react-router-dom";
import "animate.css";
import ReservacionEstadoModal from "./ReservacionEstado";
import { Role } from "~/types/roles";
import QrScanner from "./QrReader";
import PaginationComponent from "../utils/Pagination";

export default function ReservationList() {
  // Estados de autenticación y navegación
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const highlightRef = useRef<HTMLTableRowElement>(null);

  // Estados de datos y carga
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoaded, setReservationsLoaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [tipoReservas, setTipoReservas] = useState<TipoReserva[]>([]);

  // Estados para modales
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [historial, setHistorial] = useState<Bitacora[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialCache, setHistorialCache] = useState<
    Record<number, Bitacora[]>
  >({});
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [reservaSeleccionadaParaEstado, setReservaSeleccionadaParaEstado] =
    useState<Reservation | null>(null);
  const [updatingReservationId, setUpdatingReservationId] = useState<
    number | null
  >(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;
  const [highlightId, setHighlightId] = useState<number | null>(null);

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [mostrarSoloHoy, setMostrarSoloHoy] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleBack = () => {
    navigate(-1); // Regresa a la página anterior
  };

  useEffect(() => {
    const handleForceRefresh = (e: CustomEvent) => {
      const { highlightReservaId, page } = e.detail || {};
      if (page) setCurrentPage(page);
      if (highlightReservaId) setHighlightId(highlightReservaId);
      fetchReservations();
    };

    window.addEventListener("force-refresh", handleForceRefresh as EventListener);
    return () => {
      window.removeEventListener("force-refresh", handleForceRefresh as EventListener);
    };
  }, []);


  // Efectos
  useEffect(() => {
    if (location.state?.page) setCurrentPage(location.state.page);
    if (location.state?.highlightReservaId)
      setHighlightId(location.state.highlightReservaId);

    if (location.state?.page || location.state?.highlightReservaId) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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

  useEffect(() => {
    if (highlightId !== null && reservationsLoaded) {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      const timeout = setTimeout(() => setHighlightId(null), 7000);
      return () => clearTimeout(timeout);
    }
  }, [highlightId, reservationsLoaded]);

  useEffect(() => {
    if (showModal && selectedReservation) {
      fetchHistorial(selectedReservation.id);
    }
  }, [showModal, selectedReservation]);

  // Funciones principales
  const fetchReservations = async () => {
    setReservationsLoaded(false);
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

      if (statusFilter !== "Todos") params.estado = statusFilter;
      if (typeFilter !== "Todos") params.tipo_reserva = typeFilter;
      if (startDate) params.fecha_inicio = startDate;
      if (endDate) params.fecha_fin = endDate;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get(endpoint, { params });

      setReservations(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error("Error al cargar reservaciones:", error);
      toast.error("Error al cargar las reservas");
    } finally {
      setReservationsLoaded(true);
      setIsFirstLoad(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const timer = setTimeout(fetchReservations, 300);
      return () => clearTimeout(timer);
    }
  }, [
    user,
    mostrarSoloHoy,
    currentPage,
    statusFilter,
    typeFilter,
    startDate,
    endDate,
    searchTerm,
  ]);

  const fetchHistorial = async (reservaId: number, forceRefresh = false) => {
    if (!forceRefresh && historialCache[reservaId]) {
      setHistorial(historialCache[reservaId]);
      return;
    }

    setLoadingHistorial(true);
    try {
      const response = await api.get(`/bitacoras/reserva/${reservaId}`);
      setHistorial(response.data);
      setHistorialCache((prev) => ({ ...prev, [reservaId]: response.data }));
    } catch {
      toast.error("Error al cargar el historial de cambios");
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Handlers
  const handleDetailClick = (reservation: Reservation) => {
    console.log("Abriendo modal con reserva:", reservation);
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
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const delta = 2;
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
        if (l !== null && i - l !== 1) {
          rangeWithDots.push("...");
        }
        rangeWithDots.push(i);
        l = i;
      }
    }

    return rangeWithDots;
  };

  const handleCancelReservation = (reservaId: number) => {
    toast((t) => (
      <div>
        <p>¿Deseas cancelar esta reserva?</p>
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              try {
                await api.put(`/reservas-equipo/${reservaId}/estado`, {
                  estado: "Cancelado",
                  comentario: "Cancelada por el usuario",
                });

                toast.success("Reserva cancelada correctamente");

                setReservations((prev) =>
                  prev.map((r) =>
                    r.id === reservaId
                      ? ({ ...r, estado: "Cancelado" } as Reservation)
                      : r
                  )
                );
              } catch (err: any) {
                toast.error(
                  err?.response?.data?.message ||
                  "Error al cancelar la reserva"
                );
              }
              toast.dismiss(t.id);
            }}
          >
            Sí, cancelar
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
    });
  };


  // Render
  return (

    <div className="table-responsive rounded shadow p-3 mt-4">
      {/* Header */}
     <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 position-relative">
  {/* Título con flecha */}
  <div className="d-flex align-items-center gap-2 gap-md-3 mb-3 mb-md-0">
    <FaLongArrowAltLeft
      onClick={handleBack}
      title="Regresar"
      style={{
        cursor: 'pointer',
        fontSize: '2rem',
      }}
    />
    <h2 className="fw-bold m-0">Listado de Reservas</h2>
  </div>

  {/* Botones alineados a la derecha incluso en mobile */}
  <div className="d-flex flex-column flex-md-row flex-wrap gap-2 align-self-end align-self-md-auto">
    {(user?.role === Role.Administrador || user?.role === Role.Encargado) && (
      <>
        <Button
          onClick={() => setMostrarSoloHoy(!mostrarSoloHoy)}
          className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-2"
        >
          {mostrarSoloHoy ? <FaCalendarAlt /> : <FaCalendarDay />}
          {mostrarSoloHoy ? "Todas las reservas" : "Reservas de hoy"}
        </Button>

        <Button
          onClick={() => navigate("/qrScan")}
          className="btn btn-outline-success d-flex align-items-center gap-2 px-3 py-2"
        >
          <FaQrcode />
          Lector QR
        </Button>
      </>
    )}

    <Button
      onClick={() => navigate("/addreservation")}
      className="btn btn-success d-flex align-items-center gap-2 px-3 py-2"
    >
      <FaPlus />
      Crear reserva
    </Button>
  </div>
</div>




      {/* Buscador con icono y limpiar + botón de filtros */}
<div className="d-flex flex-column flex-md-row justify-content-between mb-3 gap-2">
  {/* Buscador: ocupa toda la fila en mobile */}
  <div className="flex-grow-1">
    <InputGroup>
      <InputGroup.Text>
        <FaSearch />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder="Buscar por usuario, aula, equipo, estado..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />
      {searchTerm && (
        <Button
          variant="outline-secondary"
          onClick={() => setSearchTerm("")}
        >
          <FaTimes />
        </Button>
      )}
    </InputGroup>
  </div>

  {/* Botón de filtros: alineado a la derecha en mobile */}
  <Button
    variant="outline-secondary"
    onClick={() => setShowFilters(!showFilters)}
    className="d-flex align-items-center gap-2 ms-md-0 ms-auto"
  >
    <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
  </Button>
</div>


      {showFilters && !isFirstLoad && (
        <div className="p-3 rounded mb-4 border border-secondary">
          <div className="row g-3">
            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Entregado</option>
                  <option value="Devuelto">Devuelto</option>
                  <option value="Rechazado">Rechazado</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Todos">Todos</option>
                  {tipoReservas.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Desde</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate("");
                    setCurrentPage(1);
                  }}
                />
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    if (!startDate || e.target.value >= startDate) {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    } else {
                      toast.error("La fecha fin no puede ser anterior");
                    }
                  }}
                  min={startDate}
                  disabled={!startDate}
                />
              </Form.Group>
            </div>

            <div className="col-12">
              <Button
                variant="outline-danger"
                onClick={resetFilters}
                className="w-100"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {!reservationsLoaded && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      )}

      {/* Resultados */}
      {reservationsLoaded && (
        <>
          <div className="mb-2 text-muted">
            Mostrando {reservations.length} de {totalItems} reservas
            {searchTerm && ` para "${searchTerm}"`}
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Equipos</th>
                  <th>Aula</th>
                  <th>Salida</th>
                  <th>Entrega</th>
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
                      className={
                        isHighlighted
                          ? "table-warning animate__animated animate__flash"
                          : ""
                      }
                    >
                      <td className="fw-bold">{reserva.id}</td>
                      <td className="fw-bold">
                        {reserva.user.first_name} {reserva.user.last_name}
                      </td>
                      <td>{reserva.tipo_reserva?.nombre}</td>
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
                        >
                          {reserva.estado}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-outline-primary rounded-circle"
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

                          {/* BOTÓN NUEVO EDITAR */}
                          <button
                            className="btn btn-outline-warning rounded-circle btn-icon-white-hover"
                            title="Editar reserva"
                            onClick={() => navigate(`/equipmentreservation/edit/${reserva.id}`)}
                            style={{ width: "44px", height: "44px", transition: "transform 0.2s ease-in-out" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                            disabled={reserva.estado.toLowerCase() !== "pendiente"}
                          >
                            <FaEdit className="fs-5" />
                          </button>

                          {user?.role !== Role.Prestamista && (
                            <button
                              className="btn btn-outline-success rounded-circle"
                              onClick={() => {
                                if (updatingReservationId !== null) return;
                                setReservaSeleccionadaParaEstado(reserva);
                                setShowEstadoModal(true);
                              }}
                              style={{
                                width: "44px",
                                height: "44px",
                                transition: "transform 0.2s ease-in-out",
                              }}
                              onMouseEnter={(e) =>
                              (e.currentTarget.style.transform =
                                "scale(1.15)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                              }
                              title="Actualizar estado"
                              disabled={updatingReservationId === reserva.id}
                            >
                              <FaExchangeAlt className="fs-5" />
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger rounded-circle"
                            title="Cancelar reserva"
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
                            onClick={() => handleCancelReservation(reserva.id)}
                            disabled={
                              reserva.estado.toLowerCase() !== "pendiente"
                            }
                          >
                            <FaTimes className="fs-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      {searchTerm
                        ? "No hay resultados para tu búsqueda"
                        : "No se encontraron reservas"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <PaginationComponent
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          )}
        </>
      )}

      {/* Modales */}
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
          onBefore={() =>
            setUpdatingReservationId(reservaSeleccionadaParaEstado.id)
          }
          onAfter={() => setUpdatingReservationId(null)}
          onSuccess={async (newEstado) => {
            const reservaId = reservaSeleccionadaParaEstado.id;

            setReservations((prev) =>
              prev.map((r) =>
                r.id === reservaId ? { ...r, estado: newEstado } : r
              )
            );

            // Actualizar historial y estado del modal
            await fetchHistorial(reservaId, true);
            setSelectedReservation((prev) =>
              prev ? { ...prev, estado: newEstado } : null
            );

            setShowEstadoModal(false);
            setUpdatingReservationId(null);
            setHighlightId(null);
          }}
        />
      )}

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

// Funciones auxiliares
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

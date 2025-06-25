import React, { useEffect, useState, useRef } from "react";
import {
  Row,
  Col,
  Spinner,
  Table,
  Badge,
} from "react-bootstrap";
import api from "../../api/axios";
import AulaReservacionEstadoModal from "./RoomReservationStateModal";
import { QRURL } from "~/constants/constant";
import type { Bitacora } from "~/types/bitacora";
import RoomDetailsModal from "../applicant/RoomDetailsModal";
import toast from "react-hot-toast";
import { FaEdit, FaEye, FaTimes } from "react-icons/fa";
import PaginationComponent from "../applicant/RoomReservationList/Pagination";
import Filters from "../applicant/RoomReservationList/Filter";
import { useLocation, useNavigate } from "react-router-dom";
import "animate.css";

const RoomReservationList = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");

  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historial, setHistorial] = useState<Bitacora[]>([]);
  const [historialCache, setHistorialCache] = useState<Record<number, Bitacora[]>>({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;
  const qrBaseUrl = QRURL;

  const location = useLocation();
  const navigate = useNavigate();
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [isChangingEstado, setIsChangingEstado] = useState(false);
  const initialHighlightHandled = useRef(false);
  const [initialRange, setInitialRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

  // Inicializar rango a última semana
  useEffect(() => {
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    const initial = { from: pastWeek, to: today };
    setRange(initial);
    setInitialRange(initial); // guardar el rango original
  }, []);


  // Reset página al cambiar filtros
  useEffect(() => {
    setPage(1);
    initialHighlightHandled.current = false;
  }, [range.from, range.to, status, search]);

  // Obtener highlightId y página del state de navegación
  useEffect(() => {
    const highlightIdFromState = (location.state as any)?.highlightReservaId;
    const pageFromState = (location.state as any)?.page;

    if (highlightIdFromState !== undefined && highlightIdFromState !== null) {
      setHighlightId(highlightIdFromState);
      if (pageFromState) {
        setPage(pageFromState);
      }
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Ajustar rango solo si la reserva está fuera del rango actual
  useEffect(() => {
    if (!highlightId) return;

    const adjustRangeForHighlight = async () => {
      if (!range.from || !range.to) return;

      try {
        const resDestacada = await api.get(`/reservas-aula/${highlightId}`);
        const reservaFecha = new Date(resDestacada.data.fecha);

        const fromDate = range.from;
        const toDate = range.to;

        if (reservaFecha < fromDate || reservaFecha > toDate) {
          let newFrom = reservaFecha < fromDate ? reservaFecha : fromDate;
          let newTo = reservaFecha > toDate ? reservaFecha : toDate;
          setRange({ from: newFrom, to: newTo });
        }
        
        initialHighlightHandled.current = true;
      } catch {
        console.warn("No se pudo cargar la reserva destacada.");
      }
    };

    adjustRangeForHighlight();
  }, [highlightId, range.from, range.to]);

  // Fetch reservas
  useEffect(() => {
    const fetchReservations = async () => {
      if (!range.from || !range.to) return;

      setIsLoading(true);
      try {
        const response = await api.get("/reservas-aula", {
          params: {
            from: range.from.toISOString().split("T")[0],
            to: range.to.toISOString().split("T")[0],
            page,
            per_page: perPage,
            search,
            status,
          },
        });

        setReservations(response.data.data);
        setTotalPages(response.data.last_page);
      } catch (error) {
        console.error("Error al obtener reservas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [range.from, range.to, page, search, status]);

  // Fetch historial para modal
  const fetchHistorial = async (reservaId: number, forceRefresh = false) => {
    if (!forceRefresh && historialCache[reservaId]) {
      setHistorial(historialCache[reservaId]);
      return;
    }
    setLoadingHistorial(true);
    try {
      const response = await api.get(`/bitacoras/reserva-aula/${reservaId}`);
      setHistorial(response.data);
      setHistorialCache((prev) => ({ ...prev, [reservaId]: response.data }));
    } catch {
      toast.error("Error al cargar el historial de cambios");
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (showModal && selectedReserva) {
      fetchHistorial(selectedReserva.id);
    }
  }, [showModal, selectedReserva]);

  // Scroll y quitar highlight después de 7s
  useEffect(() => {
    if (highlightId !== null && highlightRef.current) {
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);

      if (!showModal && !showEstadoModal) {
        const timeout = setTimeout(() => {
          setHighlightId(null);
        }, 7000);
        return () => {
          clearTimeout(timeout);
          clearTimeout(timer);
        };
      }

      return () => clearTimeout(timer);
    }
  }, [highlightId, showModal, showEstadoModal]);

  // Helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const getEstadoVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente": return "warning";
      case "cancelado": case "rechazado": return "danger";
      case "aprobado": return "success";
      default: return "secondary";
    }
  };

  const getBadgeColor = (estado: "pendiente" | "aprobado" | "cancelado" | "rechazado") => {
    return getEstadoVariant(estado);
  };

  // Eventos modales
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReserva(null);
    setHighlightId(null);
  };

  const handleEstadoClick = (reserva: any) => {
    setSelectedReserva(reserva);
    setShowEstadoModal(true);
  };

  const handleEstadoSuccess = async (nuevoEstado: string) => {
    try {
      const updatedReserva = { ...selectedReserva, estado: nuevoEstado };
      setSelectedReserva(updatedReserva);
      setReservations((prev) => prev.map((r) => (r.id === updatedReserva.id ? updatedReserva : r)));
      const { data } = await api.get(`/reservas-aula/${updatedReserva.id}`);
      setSelectedReserva(data);
      await fetchHistorial(data.id, true);
      setReservations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    } catch (e) {
      toast.error("No se pudo actualizar la reserva");
    }
  };

  const handleDetailClick = (reserva: any) => {
    setSelectedReserva(reserva);
    setShowModal(true);
  };

  const handleCancelClick = async (reserva: any) => {
  if (!window.confirm("¿Estás seguro de que deseas cancelar esta reserva?")) return;

  try {
    const { data } = await api.put(`/reservas-aula/${reserva.id}/cancelar`);
    toast.success("Reserva cancelada exitosamente.");

    // Actualiza la lista local
    setReservations((prev) =>
      prev.map((r) => (r.id === data.id ? data : r))
    );

    // Actualiza la reserva seleccionada si es la misma
    if (selectedReserva?.id === data.id) {
      setSelectedReserva(data);
      await fetchHistorial(data.id, true);
    }
  } catch (err) {
    toast.error("No se pudo cancelar la reserva.");
  }
};


  return (
    <div className="mt-4 px-3">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <Row className="align-items-center mb-4">
          <Col><h2>Reservas de Aulas</h2></Col>
        </Row>
        <Filters
          from={range.from}
          to={range.to}
          setFrom={(date) => { setRange((r) => ({ ...r, from: date })); setPage(1); }}
          setTo={(date) => { setRange((r) => ({ ...r, to: date })); setPage(1); }}
          statusFilter={status}
          setStatusFilter={(s) => { setStatus(s); setPage(1); }}
          search={search}
          setSearch={(s) => { setSearch(s); setPage(1); }}
          onReset={() => {
            if (initialRange.from && initialRange.to) {
              setRange(initialRange);
            } else {
              const today = new Date();
              const pastWeek = new Date(today);
              pastWeek.setDate(today.getDate() - 7);
              setRange({ from: pastWeek, to: today });
            }
            setSearch("");
            setStatus("todos");
            setPage(1);
            setHighlightId(null); // <-- importante para evitar re-ajustes de rango por highlight
            initialHighlightHandled.current = false;
          }}
        />
        {isLoading ? (
          <Spinner animation="border" />
        ) : reservations.length === 0 ? (
          <p>No hay reservas que coincidan con los filtros.</p>
        ) : (
          <>
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
                {reservations.map((res: any) => {
                  const isHighlighted = res.id === highlightId;
                  return (
                    <tr
                      key={res.id}
                      ref={isHighlighted ? highlightRef : null}
                      className={isHighlighted ? "table-warning animate__animated animate__flash" : ""}
                    >
                      <td>{res.aula?.name || "Aula Desconocida"}</td>
                      <td>{formatDate(res.fecha)}</td>
                      <td>{res.horario}</td>
                      <td>{res.user?.first_name || "Desconocido"}</td>
                      <td><Badge bg={getEstadoVariant(res.estado)}>{res.estado}</Badge></td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-outline-primary rounded-circle" 
                            title="Ver detalles" 
                            style={{ width: "44px", height: "44px" }} 
                            onClick={() => handleDetailClick(res)}
                          >
                            <FaEye className="fs-5" />
                          </button>
                          <button 
                            className="btn btn-outline-success rounded-circle" 
                            title="Cambiar estado" 
                            style={{ width: "44px", height: "44px" }} 
                            onClick={() => handleEstadoClick(res)}
                          >
                            <FaEdit className="fs-5" />
                          </button>
                          <button
                            className="btn btn-outline-danger rounded-circle"
                            title="Cancelar reserva"
                            style={{ width: "44px", height: "44px" }}
                            onClick={() => handleCancelClick(res)}
                            disabled={res.estado.toLowerCase() !== "pendiente"}
                          >
                            <FaTimes className="fs-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <PaginationComponent 
              page={page} 
              totalPages={totalPages} 
              onPageChange={(p) => setPage(p)} 
            />
          </>
        )}
        <RoomDetailsModal
          qrBaseUrl={qrBaseUrl}
          getBadgeColor={getBadgeColor}
          formatDate={formatDate}
          handleCloseModal={handleCloseModal}
          showModal={showModal}
          loadingHistorial={loadingHistorial}
          selectedReservation={selectedReserva}
          historial={historial}
        />
        {selectedReserva && (
          <AulaReservacionEstadoModal
            show={showEstadoModal}
            onHide={() => {
              if (!isChangingEstado) {
                setShowEstadoModal(false);
                setHighlightId(null);
              }
            }}
            reservationId={selectedReserva.id}
            currentStatus={selectedReserva.estado}
            onSuccess={handleEstadoSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default RoomReservationList;
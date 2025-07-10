import React, { useEffect, useRef, useState } from "react";
import { Button, Spinner, Table, Badge, Row, Col } from "react-bootstrap";

import api from "../../../api/axios";
import Filters from "./Filter";
import PaginationComponent from "../../../utils/Pagination";
import { FaEdit, FaEye, FaLongArrowAltLeft, FaPlus, FaTimes } from "react-icons/fa";
import type { ReservationRoom } from "~/types/reservationroom";
import RoomDetailsModal from "../RoomDetailsModal";
import type { Bitacora } from "~/types/bitacora";
import { QRURL } from "~/constants/constant";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import "animate.css";
import { formatTimeRangeTo12h } from "~/utils/time";

const RoomReservationList = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [initialRange, setInitialRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historial, setHistorial] = useState<Bitacora[]>([]);
  const [historialCache, setHistorialCache] = useState<
    Record<number, Bitacora[]>
  >({});
  const qrBaseUrl = QRURL;

  const location = useLocation();
  const navigate = useNavigate();

  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const initialHighlightHandled = useRef(false);

  const handleBack = () => {
    navigate(-1); // Regresa a la página anterior
  };

  const [totalPages, setTotalPages] = useState(1);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationRoom | null>(null);

  // Inicializar rango a última semana
  useEffect(() => {
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    const initial = { from: pastWeek, to: today };
    setRange(initial);
    setInitialRange(initial);
  }, []);

  // Escuchar evento force-refresh (cuando ya estamos en /reservations-room)
  // Escuchar evento force-refresh (cuando ya estamos en /reservations-room)
  useEffect(() => {
    const handleForceRefresh = async (e: any) => {
      const { highlightReservaId, page: newPage } = e.detail || {};

      if (!highlightReservaId) return;

      // Establecer la página primero
      if (newPage && newPage !== page) {
        setPage(newPage);
      }

      // Siempre forzamos el highlight
      setHighlightId(highlightReservaId);
      initialHighlightHandled.current = false;

      // Buscar si la reserva ya está en la lista actual
      const existsInList = reservations.some(r => r.id === highlightReservaId);

      // Si no está en la lista actual, recarga los datos forzadamente
      if (!existsInList) {
        setIsLoading(true);
        try {
          const response = await api.get("/reservas-aula", {
            params: {
              from: range.from?.toISOString().split("T")[0],
              to: range.to?.toISOString().split("T")[0],
              page: newPage || page,
              per_page: perPage,
              search,
              status,
            },
          });
          setReservations(response.data.data);
          setTotalPages(response.data.last_page);
        } catch (error) {
          console.error("Error al forzar carga de reservas:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener("force-refresh", handleForceRefresh);
    return () => window.removeEventListener("force-refresh", handleForceRefresh);
  }, [page, range.from, range.to, search, status, reservations]);

  // Obtener highlightId y página del state de navegación
  useEffect(() => {
    const highlightIdFromState = (location.state as any)?.highlightReservaId;
    const pageFromState = (location.state as any)?.page;

    if (highlightIdFromState !== undefined && highlightIdFromState !== null) {
      setHighlightId(highlightIdFromState);
      if (pageFromState) setPage(pageFromState);

      // Limpia el state de la URL
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Ajustar rango si la reserva destacada está fuera del rango actual
  useEffect(() => {
    if (!highlightId || initialHighlightHandled.current) return;

    const adjustRangeForHighlight = async () => {
      if (!range.from || !range.to) return;

      try {
        const resDestacada = await api.get(`/reservas-aula/${highlightId}`);
        const reservaFecha = new Date(resDestacada.data.fecha);

        const fromDate = range.from;
        const toDate = range.to;

        if (reservaFecha < fromDate || reservaFecha > toDate) {
          const newFrom = reservaFecha < fromDate ? reservaFecha : fromDate;
          const newTo = reservaFecha > toDate ? reservaFecha : toDate;
          setRange({ from: newFrom, to: newTo });
        }

        initialHighlightHandled.current = true;
      } catch (error) {
        console.warn("No se pudo ajustar el rango para la reserva destacada");
      }
    };

    adjustRangeForHighlight();
  }, [highlightId, range.from, range.to]);

  const handleEditClick = (reserva: any) => {
    navigate(`/reservas-aula/editar/${reserva.id}`, { state: { page } });
  };

  // Scroll y quitar highlight después de 7s
  useEffect(() => {
    if (
      highlightId !== null &&
      reservations.length > 0 &&
      highlightRef.current
    ) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      const timeout = setTimeout(() => setHighlightId(null), 7000);
      return () => clearTimeout(timeout);
    }
  }, [highlightId, reservations]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!range.from || !range.to) return;

      setIsLoading(true);
      try {
        const response = await api.get("/reservas-aula", {
          params: {
            from: range.from.toISOString(),
            to: range.to.toISOString(),
            status: statusFilter,
            search: debouncedSearch.trim() || undefined,
            page,
            per_page: perPage,
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
  }, [range, statusFilter, debouncedSearch, page, perPage]);

  useEffect(() => {
    setPage(1);
    initialHighlightHandled.current = false;
  }, [range.from, range.to, statusFilter, debouncedSearch]);

  const fetchHistorial = async (reservaId: number) => {
    if (historialCache[reservaId]) {
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
    if (showModal && selectedReservation) {
      fetchHistorial(selectedReservation.id);
    }
  }, [showModal, selectedReservation]);

  const handleDetailClick = (reservation: ReservationRoom) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const getBadgeColor = (
    estado: "pendiente" | "aprobado" | "cancelado" | "rechazado"
  ) => {
    switch (estado) {
      case "pendiente":
        return "warning";
      case "aprobado":
        return "success";
      case "cancelado":
      case "rechazado":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
    setHighlightId(null);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getEstadoVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning";
      case "cancelado":
      case "rechazado":
        return "danger";
      case "aprobado":
        return "success";
      default:
        return "secondary";
    }
  };

  const resetFilters = () => {
    setStatusFilter("Todos");
    setSearch("");
    if (initialRange.from && initialRange.to) {
      setRange(initialRange);
    } else {
      const today = new Date();
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      setRange({ from: pastWeek, to: today });
    }
    setPage(1);
    setHighlightId(null);
    initialHighlightHandled.current = false;
  };

  const handleCancelClick = (reserva: any) => {
    const toastId = `cancel-reserva-aula-${reserva.id}`;

    // Cierra cualquier toast activo (globalmente y el específico si existiera)
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>¿Estás seguro de que deseas cancelar esta reserva <strong>#{reserva.id}</strong>?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                try {
                  const { data } = await api.put(
                    `/reservas-aula/${reserva.id}/estado`,
                    {
                      estado: "Cancelado",
                      comentario: "Cancelado por el prestamista",
                    }
                  );

                  toast.dismiss(t.id); // Cierra el toast de confirmación
                  toast.success("Reserva cancelada exitosamente.", {
                    id: `${toastId}-success`,
                  });

                  // Actualiza la lista de reservas
                  setReservations((prev) =>
                    prev.map((r) => (r.id === data.reserva?.id ? data.reserva : r))
                  );

                  // Actualiza la reserva seleccionada si corresponde
                  if (data.reserva && selectedReservation?.id === data.reserva.id) {
                    setSelectedReservation(data.reserva);
                  }
                } catch (err: any) {
                  toast.dismiss(t.id);
                  toast.error(
                    err?.response?.data?.message || "No se pudo cancelar la reserva.",
                    { id: `${toastId}-error` }
                  );
                }
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
      ),
      {
        duration: 5000,
        id: toastId, // ID único para evitar múltiples toasts para la misma reserva
      }
    );
  };



  return (
    <div className="container">
      <div className="table-responsive rounded shadow p-3 mt-4">
        {/* Flecha de regresar en esquina superior izquierda */}
        <Row className="align-items-center mb-4">
          {/* Columna izquierda: ícono + título */}
          <Col xs={12} md={8} className="d-flex align-items-center gap-3">
            <FaLongArrowAltLeft
              onClick={handleBack}
              title="Regresar"
              style={{
                cursor: 'pointer',
                fontSize: '2rem',
                flexShrink: 0,
              }}
            />
            <h2 className="m-0">Reservas de Aulas - Listado</h2>
          </Col>

          {/* Columna derecha: botón alineado a la derecha */}
          <Col
            xs={12}
            md={4}
            className="d-flex justify-content-md-end justify-content-end mt-3 mt-md-0"
          >
            <Button
              onClick={() => navigate("/reservationsroom")}
              className="btn btn-success d-flex align-items-center gap-2 px-3 py-2 ms-md-auto"
            >
              <FaPlus />
              Crear reserva
            </Button>
          </Col>
        </Row>




        <Filters
          from={range.from}
          to={range.to}
          setFrom={(date) => {
            setRange((r) => ({ ...r, from: date }));
            setPage(1);
          }}
          setTo={(date) => {
            setRange((r) => ({ ...r, to: date }));
            setPage(1);
          }}
          statusFilter={statusFilter}
          setStatusFilter={(s) => {
            setStatusFilter(s);
            setPage(1);
          }}
          search={search}
          setSearch={(s) => {
            setSearch(s);
            setPage(1);
          }}
          onReset={resetFilters}
        />

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="d-flex justify-content-center my-5">
            <p>No hay reservas coincidentes con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Aula</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Reservado por</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => {
                  const isHighlighted = res.id === highlightId;
                  return (
                    <tr
                      key={res.id}
                      ref={isHighlighted ? highlightRef : null}
                      className={
                        isHighlighted
                          ? "table-warning animate__animated animate__flash"
                          : ""
                      }
                    >
                      <td>{res.id}</td>
                      <td>{res.aula?.name || "Aula Desconocida"}</td>
                      <td>{formatDate(res.fecha)}</td>
                      <td>{formatTimeRangeTo12h(res.horario)}</td>
                      <td>{res.user?.first_name || "Desconocido"}</td>
                      <td>
                        <Badge bg={getEstadoVariant(res.estado)}>
                          {res.estado}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                            title="Ver detalles"
                            onClick={() => handleDetailClick(res)}
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
                          <button
                            className="btn btn-outline-warning rounded-circle"
                            title="Editar reserva"
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
                            onClick={() => handleEditClick(res)}
                            disabled={res.estado.toLowerCase() !== "pendiente"}
                          >
                            <FaEdit className="fs-5" />
                          </button>
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
          selectedReservation={selectedReservation}
          historial={historial}
        />
      </div>
    </div>
  );
};

export default RoomReservationList;

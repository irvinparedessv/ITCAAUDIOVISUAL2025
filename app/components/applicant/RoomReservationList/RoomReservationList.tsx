import React, { useEffect, useRef, useState } from "react";
import { Button, Spinner, Table, Badge } from "react-bootstrap";

import api from "../../../api/axios";
import Filters from "./Filter";
import PaginationComponent from "./Pagination";
import { FaEye } from "react-icons/fa";
import type { ReservationRoom } from "~/types/reservationroom";
import RoomDetailsModal from "../RoomDetailsModal";
import type { Bitacora } from "~/types/bitacora";
import { QRURL } from "~/constants/constant";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import "animate.css";


const RoomReservationList = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
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
  const [historialCache, setHistorialCache] = useState<Record<number, Bitacora[]>>({});
  const qrBaseUrl = QRURL;

  const location = useLocation();
  const navigate = useNavigate();

  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);


  const [totalPages, setTotalPages] = useState(1);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationRoom | null>(null);


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


  useEffect(() => {
    if (highlightId !== null && reservations.length > 0 && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const timeout = setTimeout(() => setHighlightId(null), 7000);
      return () => clearTimeout(timeout);
    }
  }, [highlightId, reservations]);


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
            search: debouncedSearch.trim() || undefined, // <- Acá usar debouncedSearch
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
  const handleDetailClick = (reservation: ReservationRoom) => {
    console.log(reservation);
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
        return "danger";
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
  useEffect(() => {
    // Default: última semana
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    setRange({ from: pastWeek, to: today });
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getEstadoVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning";
      case "cancelado":
        return "danger";
      case "aprobado":
        return "success";
      case "rechazado":
        return "danger";
      default:
        return "secondary";
    }
  };

  const resetFilters = () => {
    setStatusFilter("Todos");
    setSearch("");
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);
    setRange({ from: pastWeek, to: today });
    setPage(1);
  };

  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Listado de Reservas - Espacio</h4>
        </div>

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
          <Spinner animation="border" />
        ) : reservations.length === 0 ? (
          <p>No hay reservas en este rango de fechas.</p>
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
                {reservations.map((res) => {
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
                    <td>
                      <Badge bg={getEstadoVariant(res.estado)}>
                        {res.estado}
                      </Badge>
                    </td>
                    <td>
                      {" "}
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

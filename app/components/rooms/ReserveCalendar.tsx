import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  getBloquesPorMes,
  getAulasEncargado,
} from "../../services/reservaService";
import type { Aula } from "../../types/aula";
import AulaReservacionEstadoModal from "../../components/attendantadmin/RoomReservationStateModal";
import Spinner from "react-bootstrap/Spinner";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");
moment.updateLocale("es", {
  months: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
});

const localizer = momentLocalizer(moment);

const ESTADOS_POSIBLES = ["aprobado", "pendiente", "rechazado", "cancelado"];

const ReservaCalendar = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaId, setAulaId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [mesActual, setMesActual] = useState<moment.Moment>(moment());
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAulas, setLoadingAulas] = useState<boolean>(true);
  const [view, setView] = useState<string>("month");

  // Estados seleccionados en filtro (default aprobado y pendiente)
  const [filtroEstados, setFiltroEstados] = useState<string[]>([
    "aprobado",
    "pendiente",
  ]);

  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<any>(null);
  const [isChangingEstado, setIsChangingEstado] = useState(false);

  useEffect(() => {
    setLoadingAulas(true);
    getAulasEncargado().then((res) => {
      setAulas(res.data);
      if (res.data.length) {
        setAulaId(res.data[0].id);
      }
      setLoadingAulas(false);
    });
  }, []);

  useEffect(() => {
    if (aulaId) {
      fetchBloques();
    }
  }, [aulaId, mesActual, filtroEstados]);

  const fetchBloques = () => {
    setLoading(true);
    const mes = mesActual.format("YYYY-MM");

    getBloquesPorMes(mes, aulaId).then((res) => {
      let bloques = res.data;

      // Aplicar filtro de estados
      bloques = bloques.filter((b: any) =>
        filtroEstados.includes(b.estado.toLowerCase())
      );

      bloques = bloques.map((bloque: any, i: number, arr: any[]) => {
        bloque.conflicto = false;

        if (["rechazado", "cancelado"].includes(bloque.estado.toLowerCase())) {
          return bloque;
        }

        const inicio1 = moment(
          `${bloque.fecha_inicio} ${bloque.hora_inicio}`,
          "YYYY-MM-DD HH:mm:ss"
        );
        const fin1 = moment(
          `${bloque.fecha_fin} ${bloque.hora_fin}`,
          "YYYY-MM-DD HH:mm:ss"
        );

        for (let j = 0; j < arr.length; j++) {
          if (i === j) continue;
          const otro = arr[j];

          if (bloque.reserva.aula_id !== otro.reserva.aula_id) continue;
          if (bloque.fecha_inicio !== otro.fecha_inicio) continue;

          if (["rechazado", "cancelado"].includes(otro.estado.toLowerCase())) {
            continue;
          }

          const inicio2 = moment(
            `${otro.fecha_inicio} ${otro.hora_inicio}`,
            "YYYY-MM-DD HH:mm:ss"
          );
          const fin2 = moment(
            `${otro.fecha_fin} ${otro.hora_fin}`,
            "YYYY-MM-DD HH:mm:ss"
          );

          if (inicio1.isBefore(fin2) && inicio2.isBefore(fin1)) {
            bloque.conflicto = true;
            break;
          }
        }

        return bloque;
      });

      const eventos = bloques.map((bloque: any) => {
        const start = moment(
          `${bloque.fecha_inicio} ${bloque.hora_inicio}`,
          "YYYY-MM-DD HH:mm:ss"
        ).toDate();
        const end = moment(
          `${bloque.fecha_fin} ${bloque.hora_fin}`,
          "YYYY-MM-DD HH:mm:ss"
        ).toDate();
        return {
          id: bloque.id,
          title: `${getIcon(bloque.estado)} ${
            bloque.reserva?.titulo || ""
          } - ${bloque.hora_inicio.slice(0, 5)} a ${bloque.hora_fin.slice(
            0,
            5
          )}`,
          start,
          end,
          allDay: false,
          color: bloque.conflicto ? "red" : "transparent",
          estado: bloque.estado,
          reservaId: bloque.reserva_id,
          isRecurrent: bloque.recurrente,
        };
      });

      setEvents(eventos);
      setLoading(false);
    });
  };

  const getIcon = (estado: string) => {
    const e = estado.toLowerCase();
    if (e === "aprobado") return "✔️";
    if (e === "rechazado") return "❌";
    if (e === "cancelado") return "🚫";
    return "⏳"; // pendiente
  };

  const eventPropGetter = (event: any) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: "5px",
      opacity: 0.9,
      color: "black",
      border: event.color === "red" ? "0px" : "1px solid #000",
      display: "block",
      cursor: "pointer",
    },
  });

  const handleSelectEvent = (event: any) => {
    setSelectedReserva({
      id: event.reservaId,
      estado: event.estado,
      blockId: event.id,
      isRecurrent: event.isRecurrent,
    });
    setShowEstadoModal(true);
  };

  const handleEstadoSuccess = () => {
    fetchBloques();
    setShowEstadoModal(false);
  };

  const handleMesAnterior = () => {
    setMesActual(mesActual.clone().subtract(1, "month"));
  };

  const handleMesSiguiente = () => {
    setMesActual(mesActual.clone().add(1, "month"));
  };

  const handleChangeView = (newView: string) => {
    setView(newView);
  };

  // Cambia selección en filtro de estados
  const toggleEstado = (estado: string) => {
    setFiltroEstados((prev) => {
      if (prev.includes(estado)) {
        // quitar
        return prev.filter((e) => e !== estado);
      } else {
        // agregar
        return [...prev, estado];
      }
    });
  };

  return (
    <div>
      <h3>Calendario de Reservas</h3>

      {loadingAulas ? (
        <div className="d-flex align-items-center">
          <Spinner animation="border" role="status" className="me-2" />
          <span>Cargando aulas encargadas...</span>
        </div>
      ) : (
        <>
          <select
            onChange={(e) => setAulaId(Number(e.target.value))}
            value={aulaId || ""}
            className="form-select mb-3"
          >
            {aulas.map((aula) => (
              <option key={aula.id} value={aula.id}>
                {aula.name}
              </option>
            ))}
          </select>

          <h5 className="mb-3">Mes actual: {mesActual.format("MMMM YYYY")}</h5>

          <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
            <span className="fw-bold me-2">Filtrar estados:</span>
            {ESTADOS_POSIBLES.map((estado) => {
              const seleccionado = filtroEstados.includes(estado);
              return (
                <button
                  key={estado}
                  type="button"
                  className={`btn btn-sm ${
                    seleccionado ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => toggleEstado(estado)}
                >
                  {getIcon(estado)}{" "}
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              );
            })}
          </div>

          <div className="mb-3 d-flex gap-2">
            <button
              className={`btn ${
                view === "month" ? "btn-secondary" : "btn-outline-secondary"
              }`}
              onClick={() => handleChangeView("month")}
            >
              Mes
            </button>
            <button
              className={`btn ${
                view === "agenda" ? "btn-secondary" : "btn-outline-secondary"
              }`}
              onClick={() => handleChangeView("agenda")}
            >
              Agenda
            </button>
          </div>

          {loading ? (
            <div className="d-flex align-items-center">
              <Spinner animation="border" role="status" className="me-2" />
              <span>Cargando datos...</span>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600, margin: "50px" }}
              eventPropGetter={eventPropGetter}
              onSelectEvent={handleSelectEvent}
              views={["month", "agenda"]}
              toolbar={false}
              view={view}
              onView={handleChangeView}
              culture="es"
              messages={{
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                allDay: "Todo el día",
                week: "Semana",
                work_week: "Semana laboral",
                day: "Día",
                month: "Mes",
                previous: "Anterior",
                next: "Siguiente",
                yesterday: "Ayer",
                tomorrow: "Mañana",
                today: "Hoy",
                agenda: "Agenda",
                noEventsInRange: "No hay eventos en este rango.",
                showMore: (total) => `+ Ver más (${total})`,
              }}
            />
          )}

          {selectedReserva && (
            <AulaReservacionEstadoModal
              show={showEstadoModal}
              onHide={() => {
                if (!isChangingEstado) {
                  setShowEstadoModal(false);
                }
              }}
              reservationId={selectedReserva.id}
              currentStatus={selectedReserva.estado}
              blockId={selectedReserva.blockId} // tu lógica
              isRecurrent={selectedReserva.isRecurrent} // true o false
              onSuccess={handleEstadoSuccess}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ReservaCalendar;

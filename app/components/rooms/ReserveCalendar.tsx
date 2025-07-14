import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getReservas, getAulasEncargado } from "../../services/reservaService";
import type { Aula } from "../../types/aula";
import AulaReservacionEstadoModal from "../../components/attendantadmin/RoomReservationStateModal";
import Spinner from "react-bootstrap/Spinner";
moment.locale("es");

const localizer = momentLocalizer(moment);

const ReservaCalendar = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaId, setAulaId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [mesActual, setMesActual] = useState<moment.Moment>(moment());
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAulas, setLoadingAulas] = useState<boolean>(true);

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
      fetchReservas();
    }
  }, [aulaId, mesActual]);

  const fetchReservas = () => {
    setLoading(true);
    const mes = mesActual.format("YYYY-MM");

    getReservas(mes, aulaId).then((res) => {
      let reservas = res.data;

      reservas = reservas.map((reserva: any, i: number, arr: any[]) => {
        reserva.conflicto = false;

        if (["rechazado", "cancelado"].includes(reserva.estado.toLowerCase())) {
          return reserva;
        }

        const [inicio1, fin1] = reserva.horario
          .split(" - ")
          .map((h: string) =>
            moment(`${reserva.fecha.split("T")[0]} ${h}`, "YYYY-MM-DD HH:mm")
          );

        for (let j = 0; j < arr.length; j++) {
          if (i === j) continue;
          const otra = arr[j];

          if (reserva.aula_id !== otra.aula_id) continue;
          if (reserva.fecha !== otra.fecha) continue;

          if (["rechazado", "cancelado"].includes(otra.estado.toLowerCase())) {
            continue;
          }

          const [inicio2, fin2] = otra.horario
            .split(" - ")
            .map((h: string) =>
              moment(`${otra.fecha.split("T")[0]} ${h}`, "YYYY-MM-DD HH:mm")
            );

          if (inicio1.isBefore(fin2) && inicio2.isBefore(fin1)) {
            reserva.conflicto = true;
            break;
          }
        }

        return reserva;
      });

      const eventos = reservas.map((reserva: any) => {
        const [horaInicio, horaFin] = reserva.horario
          .split(" - ")
          .map((h: string) => h.trim());
        const fecha = reserva.fecha.split("T")[0];

        const start = moment(
          `${fecha} ${horaInicio}`,
          "YYYY-MM-DD HH:mm"
        ).toDate();
        const end = moment(`${fecha} ${horaFin}`, "YYYY-MM-DD HH:mm").toDate();

        return {
          id: reserva.id,
          title: getTitle(reserva),
          start,
          end,
          allDay: false,
          color: getColor(reserva),
          estado: reserva.estado,
        };
      });

      setEvents(eventos);
      setLoading(false);
    });
  };

  const getColor = (reserva: any) => {
    return reserva.conflicto ? "red" : "transparent";
  };

  const getTitle = (reserva: any) => {
    let icon = "";
    const estado = reserva.estado.toLowerCase();

    if (estado === "aprobado") icon = "✔️";
    else if (estado === "rechazado") icon = "❌";
    else if (estado === "cancelado") icon = "🚫";
    else icon = "⏳"; // Pendiente sin icono

    return `${icon} ${reserva.comentario} - ${reserva.horario}`;
  };

  const eventPropGetter = (event: any) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: "5px",
      opacity: 0.9,
      color: "black",
      border: event.color === "red" ? "0px" : "1px solid #000",
      display: "block",
    },
  });

  const handleSelectEvent = (event: any) => {
    setSelectedReserva({
      id: event.id,
      estado: event.estado,
    });
    setShowEstadoModal(true);
  };

  const handleEstadoSuccess = () => {
    fetchReservas();
    setShowEstadoModal(false);
  };

  const handleMesAnterior = () => {
    setMesActual(mesActual.clone().subtract(1, "month"));
  };

  const handleMesSiguiente = () => {
    setMesActual(mesActual.clone().add(1, "month"));
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

          <h5 className="mb-3">
            Mes actual: {mesActual.locale("es").format("MMMM YYYY")}
          </h5>

          <div className="mb-3">
            <button
              className="btn btn-primary me-2"
              onClick={handleMesAnterior}
            >
              Mes Anterior
            </button>
            <button className="btn btn-primary" onClick={handleMesSiguiente}>
              Mes Siguiente
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
              views={{ month: true }}
              toolbar={false}
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
              onSuccess={handleEstadoSuccess}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ReservaCalendar;

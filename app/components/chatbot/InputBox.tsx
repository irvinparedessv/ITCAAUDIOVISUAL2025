import { handledSteps, Steps } from "./steps";
import type { ReservaDataRoom } from "./types";
import { formatDate } from "./../../utils/time";

type Props = {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
  step: string;
  reservaDataRoom: ReservaDataRoom;
  reservaData: any;
  setMessages: any;
  addBotMessage: (msg: string) => void;
  setReservaData: (data: any) => void;
  setReservaDataRoom: (data: any) => void;
  setStep: (step: string) => void;
  completarReserva: () => void;
  completarReservaAula: () => void;
};

const InputBox = ({
  inputMessage,
  setInputMessage,
  onSend,
  step,
  reservaData,
  reservaDataRoom,
  setReservaData,
  setReservaDataRoom,
  setMessages,
  setStep,
  completarReserva,
  completarReservaAula,
  addBotMessage,
}: Props) => {
  const validateDate = (selectedDateStr: string) => {
    const [year, month, day] = selectedDateStr.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day); // local time
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    maxDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      addBotMessage("No puedes seleccionar una fecha pasada.");
      return false;
    }
    if (selectedDate > maxDate) {
      addBotMessage("Solo puedes reservar hasta 7 días desde hoy.");
      return false;
    }
    return true;
  };
  const validateDateAula = (selectedDateStr: string) => {
    const [year, month, day] = selectedDateStr.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day); // local time
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      addBotMessage("No puedes seleccionar una fecha pasada.");
      return false;
    }
    return true;
  };
  const validateStartDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;

    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const now = new Date();
    const minAllowed = new Date(now.getTime() + 30 * 60 * 1000); // ahora + 30 minutos

    if (startDateTime < minAllowed) {
      addBotMessage(
        "La hora de inicio debe ser al menos 30 minutos después de la hora actual."
      );
      return false;
    }
    return true;
  };

  const validateTimeDiff = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    if (diff < 30) {
      addBotMessage("Debe haber mínimo 30 minutos entre inicio y fin.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === "fechaEquipo") {
      if (!validateDate(reservaData.fecha)) return;
      setMessages((prev: any) => [
        ...prev,
        {
          id: prev.length + 1,
          text: formatDate(reservaData.fecha),
          sender: "user",
        },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de inicio.");
      setStep("horaInicioEquipo");
    } else if (step === "horaInicioEquipo") {
      if (!validateStartDateTime(reservaData.fecha, reservaData.horaInicio))
        return;

      setMessages((prev: any) => [
        ...prev,
        { id: prev.length + 1, text: reservaData.horaInicio, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de finalización.");
      setStep("horaFinEquipo");
    } else if (step === "horaFinEquipo") {
      if (reservaData.horaFin <= reservaData.horaInicio) {
        addBotMessage("La hora de fin debe ser mayor a la hora de inicio.");
        return;
      }
      if (!validateTimeDiff(reservaData.horaInicio, reservaData.horaFin))
        return;

      setMessages((prev: any) => [
        ...prev,
        { id: prev.length + 1, text: reservaData.horaFin, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione el tipo de evento.");
      setStep("mostrarTipoEventos");
    } else if (step === Steps.SeleccionarFechaAula) {
      if (!validateDateAula(reservaDataRoom.fecha)) return;
      setMessages((prev: any) => [
        ...prev,
        {
          id: prev.length + 1,
          text: formatDate(reservaDataRoom.fecha),
          sender: "user",
        },
      ]);
      if (reservaDataRoom.type === "clase_recurrente") {
        addBotMessage("Ahora seleccione la fecha de fin de la reserva:");
        setStep(Steps.SeleccionarFechaFinAula);
      } else {
        addBotMessage("Perfecto, Seleccione la hora de inicio");
        setStep(Steps.SeleccionarHoraInicioAula);
      }
    } else if (step === Steps.SeleccionarFechaFinAula) {
      setMessages((prev: any) => [
        ...prev,
        {
          id: prev.length + 1,
          text: reservaDataRoom.fecha_fin
            ? formatDate(reservaDataRoom.fecha_fin)
            : "",
          sender: "user",
        },
      ]);
      addBotMessage("Perfecto, Debe Seleccionar los dias");
      setStep(Steps.SeleccionarDias);
    } else if (step === Steps.SeleccionarDias) {
      setMessages((prev: any) => [
        ...prev,
        {
          id: prev.length + 1,
          text: reservaDataRoom.dias ? reservaDataRoom.dias.join(", ") : "",
          sender: "user",
        },
      ]);
      addBotMessage("Perfecto, Debe Seleccionar la hora de inicio");
      setStep(Steps.SeleccionarHoraInicioAula);
    } else if (step === Steps.SeleccionarHoraInicioAula) {
      if (
        !validateStartDateTime(
          reservaDataRoom.fecha,
          reservaDataRoom.horarioInicio
        )
      )
        return;

      setMessages((prev: any) => [
        ...prev,
        {
          id: prev.length + 1,
          text: reservaDataRoom.horarioInicio,
          sender: "user",
        },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de finalización");
      setStep(Steps.SeleccionarHoraFinAula);
    } else if (step === Steps.SeleccionarHoraFinAula) {
      if (reservaDataRoom.horarioFin <= reservaDataRoom.horarioInicio) {
        addBotMessage("La hora de fin debe ser mayor a la hora de inicio.");
        return;
      }
      if (
        !validateTimeDiff(
          reservaDataRoom.horarioInicio,
          reservaDataRoom.horarioFin
        )
      )
        return;

      setMessages((prev: any) => [
        ...prev,
        {
          id: prev.length + 1,
          text: reservaDataRoom.horarioFin,
          sender: "user",
        },
      ]);
      setStep(Steps.ResumenAula);
    } else if (step === Steps.SeleccionarTituloReservaAula) {
      setMessages((prev: any) => [
        ...prev,
        { id: prev.length + 1, text: reservaDataRoom.titulo, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione el tipo de reserva.");
      setStep(Steps.SeleccionarTipoReservaAula);
    }
  };

  if (step === "fechaEquipo") {
    const todayStr = new Date().toISOString().split("T")[0];
    const maxDateStr = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return (
      <div className="chat-input">
        <input
          type="date"
          value={reservaData.fecha || ""}
          min={todayStr}
          max={maxDateStr}
          onChange={(e) =>
            setReservaData((prev: any) => ({
              ...prev,
              fecha: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaData.fecha}>
          Siguiente
        </button>
      </div>
    );
  }

  if (step === "horaInicioEquipo") {
    return (
      <div className="chat-input">
        <input
          type="time"
          step="1800"
          value={reservaData.horaInicio || ""}
          onChange={(e) =>
            setReservaData((prev: any) => ({
              ...prev,
              horaInicio: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaData.horaInicio}>
          Siguiente
        </button>
      </div>
    );
  }

  if (step === "horaFinEquipo") {
    return (
      <div className="chat-input">
        <input
          type="time"
          step="1800"
          value={reservaData.horaFin || ""}
          onChange={(e) =>
            setReservaData((prev: any) => ({
              ...prev,
              horaFin: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaData.horaFin}>
          Siguiente
        </button>
      </div>
    );
  }

  if (step === Steps.MostrarEquipos) {
    return (
      <div className="chat-input">
        <button
          onClick={() => {
            setMessages((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                text: "Ver Resumen",
                sender: "user",
              },
            ]);
            setStep("resumen");
          }}
          disabled={reservaData.equipos.length === 0}
        >
          Ver resumen
        </button>
        <button
          onClick={completarReserva}
          disabled={reservaData.equipos.length === 0}
          style={{ marginLeft: "10px" }}
        >
          Confirmar reserva
        </button>
      </div>
    );
  }

  if (step === Steps.Resumen) {
    return (
      <div className="chat-input">
        <button onClick={() => setStep("mostrarEquipos")}>
          Volver a equipos
        </button>{" "}
        <button
          onClick={completarReserva}
          disabled={reservaData.equipos.length === 0}
        >
          Confirmar reserva
        </button>
      </div>
    );
  }

  if (step === Steps.SeleccionarFechaAula) {
    const todayStr = new Date().toISOString().split("T")[0];
    return (
      <div className="chat-input">
        <input
          type="date"
          min={todayStr}
          value={reservaDataRoom.fecha || ""}
          onChange={(e) =>
            setReservaDataRoom((prev: any) => ({
              ...prev,
              fecha: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaDataRoom.fecha}>
          Siguiente
        </button>
      </div>
    );
  }
  if (step === Steps.SeleccionarFechaFinAula) {
    const todayStr = new Date().toISOString().split("T")[0];
    return (
      <div className="chat-input">
        <input
          type="date"
          min={todayStr}
          value={reservaDataRoom.fecha_fin || ""}
          onChange={(e) =>
            setReservaDataRoom((prev: any) => ({
              ...prev,
              fecha_fin: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaDataRoom.fecha}>
          Siguiente
        </button>
      </div>
    );
  }
  if (step === Steps.SeleccionarTituloReservaAula) {
    return (
      <div className="chat-input">
        <input
          type="text"
          value={reservaDataRoom.titulo || ""}
          onChange={(e) =>
            setReservaDataRoom((prev: any) => ({
              ...prev,
              titulo: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaDataRoom.titulo}>
          Siguiente
        </button>
      </div>
    );
  }

  if (step === Steps.SeleccionarDias) {
    return (
      <div className="chat-input">
        <button onClick={handleNext} disabled={reservaDataRoom.dias.length < 1}>
          Siguiente
        </button>
      </div>
    );
  }
  if (step === Steps.SeleccionarHoraInicioAula) {
    return (
      <div className="chat-input">
        <input
          type="time"
          value={reservaDataRoom.horarioInicio || ""}
          onChange={(e) =>
            setReservaDataRoom((prev: any) => ({
              ...prev,
              horarioInicio: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaDataRoom.horarioInicio}>
          Siguiente
        </button>
      </div>
    );
  }

  if (step === Steps.SeleccionarHoraFinAula) {
    return (
      <div className="chat-input">
        <input
          type="time"
          value={reservaDataRoom.horarioFin || ""}
          onChange={(e) =>
            setReservaDataRoom((prev: any) => ({
              ...prev,
              horarioFin: e.target.value,
            }))
          }
        />
        <button onClick={handleNext} disabled={!reservaDataRoom.horarioFin}>
          Siguiente
        </button>
      </div>
    );
  }

  if (step === Steps.ResumenAula) {
    return (
      <div className="chat-input">
        <button
          onClick={() => {
            setReservaDataRoom({});
            setStep(Steps.SeleccionarAula);
          }}
        >
          Volver a selección de aula
        </button>{" "}
        <button
          onClick={completarReservaAula}
          disabled={!reservaDataRoom.aula || reservaDataRoom.aula.length === 0}
        >
          Confirmar reserva
        </button>
      </div>
    );
  }

  if (step === Steps.Initial) {
    return null;
  }
  if (!handledSteps.includes(step)) {
    return (
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
        />
        <button onClick={onSend}>Enviar</button>
      </div>
    );
  }
};

export default InputBox;

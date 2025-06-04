import { steps } from "framer-motion";
import { Steps } from "./steps";
import type { ReservaDataRoom } from "./types";

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
  const handleNext = () => {
    if (step === "fechaEquipo") {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: reservaData.fecha, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de inicio.");
      setStep("horaInicioEquipo");
    } else if (step === "horaInicioEquipo") {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: reservaData.horaInicio, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de finalizacion.");
      setStep("horaFinEquipo");
    } else if (step === "horaFinEquipo") {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: reservaData.horaFin, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione el tipo de evento.");
      setStep("mostrarTipoEventos");
    } else if (step === Steps.SeleccionarFechaAula) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: reservaDataRoom.fecha, sender: "user" },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de inicio");
      setStep(Steps.SeleccionarHoraInicioAula);
    } else if (step === Steps.SeleccionarHoraInicioAula) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: reservaDataRoom.horarioInicio,
          sender: "user",
        },
      ]);
      addBotMessage("Perfecto, Seleccione la hora de finalizacion");
      setStep(Steps.SeleccionarHoraFinAula);
    } else if (step === Steps.SeleccionarHoraFinAula) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: reservaDataRoom.horarioFin,
          sender: "user",
        },
      ]);
      setStep(Steps.ResumenAula);
    }
  };

  if (step === "fechaEquipo") {
    return (
      <div className="chat-input">
        <input
          type="date"
          value={reservaData.fecha || ""}
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
            setMessages((prev) => [
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
    return (
      <div className="chat-input">
        <input
          type="date"
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
          Volver a seleccion de aula
        </button>{" "}
        <button
          onClick={completarReservaAula}
          disabled={reservaDataRoom.aula.length === 0}
        >
          Confirmar reserva
        </button>
      </div>
    );
  }
  if (step === Steps.Initial) {
    return null;
  }
  // Input tradicional
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
};

export default InputBox;

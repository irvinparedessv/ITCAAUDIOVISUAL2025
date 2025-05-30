type Props = {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
  step: string;
  reservaData: any;
  setMessages: any;
  addBotMessage: (msg: string) => void;
  setReservaData: (data: any) => void;
  setStep: (step: string) => void;
};

const InputBox = ({
  inputMessage,
  setInputMessage,
  onSend,
  step,
  reservaData,
  setReservaData,
  setMessages,
  setStep,
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

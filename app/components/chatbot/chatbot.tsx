import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/AuthContext";
import api from "../../api/axios";
import "./chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
    },
  ]);
  const [step, setStep] = useState("initial");
  type OptionType = { value: string; label: string };

  const [equipmentOptions, setEquipmentOptions] = useState<OptionType[]>([]);
  const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);

  const [reservaData, setReservaData] = useState({
    fecha: "",
    horaInicio: "",
    horaFin: "",
    ubicacion: "",
    equipos: [] as string[],
  });
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  useEffect(() => {
    const fetchEquipments = async () => {
      const response = await api.get("/Obtenerequipos");
      const data = response.data;
      const options = data.map((item: any) => ({
        value: item.id,
        label: item.nombre,
      }));

      setEquipmentOptions(options);

      const responsex = await api.get("/aulasEquipos");
      const datax = responsex.data;
      const optionsx = datax.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      setAulaOptions(optionsx);
    };
    fetchEquipments();
  }, []);

  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled =
        document.documentElement.getAttribute("data-bs-theme") === "dark";
      setIsDarkMode(darkModeEnabled);
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        chatRef.current &&
        !chatRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        resetChat();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const resetChat = () => {
    setStep("initial");
    setInputMessage("");
    setMessages([
      {
        id: 1,
        text: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
        sender: "bot",
      },
    ]);
    setReservaData({
      fecha: "",
      horaInicio: "",
      horaFin: "",
      ubicacion: "",
      equipos: [],
    });
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text, sender: "bot" },
    ]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: userText, sender: "user" },
    ]);
    setInputMessage("");

    if (step === "fecha") {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(userText)) {
        addBotMessage("Formato inválido. Ingresa una fecha como dd/mm/yyyy.");
        return;
      }
      setReservaData((prev) => ({ ...prev, fecha: userText }));
      addBotMessage(
        "¿A qué hora deseas iniciar la reserva? (formato 24h ej. 14:00)"
      );
      setStep("horaInicio");
    } else if (step === "horaInicio") {
      if (!/^\d{2}:\d{2}$/.test(userText)) {
        addBotMessage(
          "Formato inválido. Ingresa la hora como HH:MM en formato 24h."
        );
        return;
      }
      setReservaData((prev) => ({ ...prev, horaInicio: userText }));
      addBotMessage(
        "¿A qué hora terminará la reserva? (formato 24h ej. 16:00)"
      );
      setStep("horaFin");
    } else if (step === "horaFin") {
      if (!/^\d{2}:\d{2}$/.test(userText)) {
        addBotMessage(
          "Formato inválido. Ingresa la hora como HH:MM en formato 24h."
        );
        return;
      }
      setReservaData((prev) => ({ ...prev, horaFin: userText }));
      addBotMessage(
        "Perfecto. Primero selecciona la ubicación donde usarás el equipo:"
      );
      setStep("seleccionarUbicacion");
    } else if (step === "consultas") {
      addBotMessage("Procesando tu consulta...");

      api
        .post("/chatGPT", { question: userText })
        .then((response) => {
          console.log(response);
          if (response.data.error) {
            addBotMessage(response.data.error.message);
          } else {
            addBotMessage(response.data.reply);
          }
        })
        .catch((error) => {
          console.error("Error al consultar ChatGPT:", error);
          addBotMessage("Ocurrió un error al procesar tu consulta.");
        });
    }
  };

  const handleOptionClick = (option: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: option, sender: "user" },
    ]);
    if (option === "Crear reserva equipo") {
      addBotMessage("Perfecto, ¿qué fecha deseas? (dd/mm/yyyy)");
      setStep("fecha");
    } else if (option === "Crear reserva aula") {
      addBotMessage("Esta opción se implementará pronto.");
      setStep("initial");
    } else if (option === "Consultas") {
      addBotMessage("¿Qué deseas consultar? Por favor, escribe tu pregunta.");
      setStep("consultas");
    }
  };

  const handleUbicacionClick = (ubicacion: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: ubicacion, sender: "user" },
    ]);
    setReservaData((prev) => ({ ...prev, ubicacion }));
    addBotMessage("Gracias. Ahora selecciona los equipos que deseas reservar:");
    setStep("mostrarEquipos");
  };

  const handleEquipoClick = (equipo: string) => {
    const yaSeleccionado = reservaData.equipos.includes(equipo);
    setReservaData((prev) => ({
      ...prev,
      equipos: yaSeleccionado
        ? prev.equipos.filter((e) => e !== equipo)
        : [...prev.equipos, equipo],
    }));
  };

  const handleEliminarEquipo = (equipo: string) => {
    setReservaData((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((e) => e !== equipo),
    }));
  };

  const completarReserva = () => {
    if (
      !reservaData.fecha ||
      !reservaData.horaInicio ||
      !reservaData.horaFin ||
      !reservaData.ubicacion
    ) {
      addBotMessage(
        "Faltan datos de la reserva, por favor reinicia el proceso."
      );
      setStep("initial");
      return;
    }
    if (reservaData.equipos.length === 0) {
      addBotMessage("No has seleccionado ningún equipo.");
      setStep("mostrarEquipos");
      return;
    }

    // Aquí podrías llamar a un API para guardar la reserva.
    addBotMessage("Procesando tu reserva...");
    const payload = {
      user_id: user?.id,
      equipo: reservaData.equipos,
      aula: reservaData.ubicacion,
      fecha_reserva: reservaData.fecha,
      startTime: reservaData.horaInicio,
      endTime: reservaData.horaFin,
    };

    api
      .post("/reservas", payload)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

    setTimeout(() => {
      addBotMessage(
        `✅ ¡Reserva creada con éxito!\n\n📅 Fecha: ${
          reservaData.fecha
        }\n🕒 Hora: ${reservaData.horaInicio} - ${
          reservaData.horaFin
        }\n📍 Ubicación: ${
          reservaData.ubicacion
        }\n🎥 Equipos: ${reservaData.equipos.join(", ")}`
      );
      setStep("finalizado");
    }, 1000);
  };

  const renderEquipos = () => (
    <div className="equipo-botones">
      {equipmentOptions.map((equipo) => (
        <button
          key={equipo.value}
          className={`equipo-btn ${
            reservaData.equipos.includes(equipo.value) ? "seleccionado" : ""
          }`}
          onClick={() => handleEquipoClick(equipo.value)}
        >
          {reservaData.equipos.includes(equipo.value) ? "✅ " : ""}{" "}
          {equipo.label}
        </button>
      ))}
      <div className="acciones-reserva" style={{ marginTop: "10px" }}>
        <button
          onClick={() => setStep("resumen")}
          disabled={reservaData.equipos.length === 0}
        >
          Ver resumen
        </button>
      </div>
    </div>
  );

  const renderResumen = () => (
    <div className="resumen-reserva">
      <h4>Resumen de tu reserva:</h4>
      <p>📅 Fecha: {reservaData.fecha}</p>
      <p>
        🕒 De: {reservaData.horaInicio} a {reservaData.horaFin}
      </p>
      <p>📍 Ubicación: {reservaData.ubicacion}</p>
      <p>🎥 Equipos seleccionados:</p>
      {reservaData.equipos.length === 0 ? (
        <p style={{ fontStyle: "italic" }}>
          No has seleccionado ningún equipo.
        </p>
      ) : (
        <ul>
          {reservaData.equipos.map((equipoId) => {
            const equipox = equipmentOptions.find((e) => e.value === equipoId);
            return (
              <li key={equipoId}>
                {equipox?.label || equipox?.value || equipoId}{" "}
              </li>
            );
          })}
        </ul>
      )}
      <div style={{ marginTop: "10px" }}>
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
    </div>
  );

  const renderInitialOptions = () => (
    <div className="chat-options">
      {["Crear reserva equipo", "Crear reserva aula", "Consultas"].map(
        (opt) => (
          <button key={opt} onClick={() => handleOptionClick(opt)}>
            {opt}
          </button>
        )
      )}
    </div>
  );

  const renderUbicaciones = () => (
    <div className="ubicacion-botones">
      {aulaOptions.map((ubicacion) => (
        <button
          key={ubicacion.value}
          className={`ubicacion-btn ${
            reservaData.ubicacion === ubicacion.value ? "seleccionado" : ""
          }`}
          onClick={() => handleUbicacionClick(ubicacion.value)}
        >
          {ubicacion.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="chatbot-container">
      <button
        className={`chatbot-button ${isDarkMode ? "dark-mode" : ""}`}
        onClick={toggleChat}
        aria-label="Abrir chat asistente"
      >
        💬
      </button>

      {isOpen && (
        <div
          ref={chatRef}
          className={`chat-window ${isDarkMode ? "dark-mode" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
        >
          <div className="chat-header">
            <h3 id="chatbot-title">Asistente Virtual</h3>
            <button
              onClick={toggleChat}
              aria-label="Cerrar chat asistente"
              className="close-btn"
            >
              ✖
            </button>
          </div>

          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map(({ id, text, sender }) => (
              <div
                key={id}
                className={`message ${sender === "bot" ? "bot" : "user"}`}
                tabIndex={0}
              >
                {text.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            ))}
            {step === "initial" && renderInitialOptions()}
            {step === "seleccionarUbicacion" && renderUbicaciones()}

            {step === "mostrarEquipos" && renderEquipos()}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            {(step === "initial" || step === "consultas") && (
              <>
                {step === "consultas" && (
                  <>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      placeholder="Escribe tu consulta aquí..."
                      aria-label="Escribe tu consulta"
                    />
                    <button
                      onClick={handleSendMessage}
                      aria-label="Enviar mensaje"
                    >
                      Enviar
                    </button>
                  </>
                )}
              </>
            )}

            {(step === "fecha" ||
              step === "horaInicio" ||
              step === "horaFin") && (
              <>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder={
                    step === "fecha" ? "dd/mm/yyyy" : "HH:MM (formato 24h)"
                  }
                  aria-label="Entrada de texto para reserva"
                />
                <button onClick={handleSendMessage} aria-label="Enviar mensaje">
                  Enviar
                </button>
              </>
            )}

            {step === "resumen" && renderResumen()}

            {step === "finalizado" && (
              <div>
                <button onClick={resetChat}>Nueva reserva</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

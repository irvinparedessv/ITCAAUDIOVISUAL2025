import { useRef, useEffect } from "react";
import { FaCommentDots, FaTimes } from "react-icons/fa";
import { APIURL } from "../../constants/constant";
import { useChatbotLogic } from "./useChatbotLogic";
import EquiposSelect from "../reserveE/Equipos";
import "./chatbot.css"; // Asegúrate de tener los estilos recomendados

const Chatbot = () => {
  const {
    isOpen,
    isReady,
    inputMessage,
    setInputMessage,
    messages,
    handleSendMessage,
    setIsOpen,
    toggleChat,
    showFullScreen,
    espaciosParaSeleccionar,
    handleSeleccionarEspacio,
    formData,
    setFormData,
    aulasDisponibles,
    mostrarEquipos,
    setMostrarEquipos,
    pensando,
  } = useChatbotLogic();

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll automático al fondo del chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showFullScreen, mostrarEquipos]);

  // Cierra chatbot al click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Enter = enviar mensaje
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputMessage.trim() !== "" && !pensando) {
      handleSendMessage();
    }
  };

  // Busca los datos completos de aula según sugerencia
  const getAulaCompleta = (sugerencia: any) => {
    console.log(aulasDisponibles);
    return (
      aulasDisponibles?.find((a) => a.id === sugerencia.id) || sugerencia // fallback por si acaso
    );
  };

  return (
    <div
      className={`chatbot-container${isOpen ? " open" : ""}`}
      ref={containerRef}
    >
      {isOpen && (
        <>
          <div className="chat-header">
            <h3>Asistente Virtual</h3>
            <button
              className="chat-close-button"
              aria-label="Cerrar"
              onClick={() => setIsOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          {/* ---- Overlay selección de AULA ---- */}
          {showFullScreen && (
            <div className="fullscreen-sugerencias-overlay">
              <div
                className="fullscreen-sugerencias"
                style={{ minHeight: "90vh" }}
              >
                <h4 className="mb-3">Selecciona un espacio sugerido</h4>
                <div className="row g-3">
                  {espaciosParaSeleccionar.map((sugerencia: any) => {
                    const aula = getAulaCompleta(sugerencia);
                    return (
                      <div key={aula.id} className="col-12">
                        <div className="card shadow-sm d-flex flex-row align-items-center p-2">
                          <div style={{ width: 120, height: 100 }}>
                            {aula.path_modelo ? (
                              //@ts-ignore
                              <model-viewer
                                src={APIURL + "/" + aula.path_modelo}
                                alt={aula.nombre}
                                camera-controls
                                style={{
                                  width: 120,
                                  height: 100,
                                  background: "#f4f6fa",
                                  borderRadius: 12,
                                }}
                                auto-rotate
                                shadow-intensity="1"
                              />
                            ) : aula.imagen_normal ? (
                              <img
                                src={APIURL + "/" + aula.imagen_normal}
                                alt={aula.nombre}
                                style={{
                                  width: 120,
                                  height: 100,
                                  objectFit: "cover",
                                  borderRadius: 12,
                                }}
                              />
                            ) : (
                              <div
                                className="bg-secondary text-white d-flex align-items-center justify-content-center"
                                style={{
                                  width: 120,
                                  height: 100,
                                  borderRadius: 12,
                                }}
                              >
                                Sin imagen
                              </div>
                            )}
                          </div>
                          <div className="ms-3 flex-grow-1">
                            <div className="fw-bold">
                              {aula.nombre || `Espacio #${aula.id}`}
                            </div>
                            <div className="small text-muted mb-1">
                              {sugerencia.recomendacion}
                            </div>
                            <button
                              className="btn btn-primary btn-sm mt-1"
                              onClick={() =>
                                handleSeleccionarEspacio(aula, sugerencia)
                              }
                            >
                              Seleccionar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ---- Overlay selección de EQUIPOS ---- */}
          {mostrarEquipos && (
            <div className="fullscreen-sugerencias-overlay">
              <div
                className="fullscreen-sugerencias"
                style={{ minHeight: "90vh" }}
              >
                <EquiposSelect
                  formData={formData}
                  isDateTimeComplete={true}
                  checkingAvailability={true}
                  setFormData={setFormData}
                  // agrega más props si necesitas
                />
                <button
                  className="btn btn-outline-secondary mt-3"
                  onClick={() => setMostrarEquipos(false)}
                >
                  Volver al chat
                </button>
              </div>
            </div>
          )}

          {/* ---- Historial de mensajes ---- */}
          <div className="chat-window" style={{ maxHeight: 820 }}>
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${
                    msg.sender === "user" ? "user" : "bot"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {/* Input solo si no está bloqueado por overlay */}
            {!showFullScreen && !mostrarEquipos && (
              <div className="chat-input-container">
                <input
                  type="text"
                  className="form-control chat-input"
                  placeholder="Escribe un mensaje..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  disabled={!isReady || pensando}
                  aria-label="Escribe un mensaje"
                />
                <button
                  className="chat-send-button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isReady || pensando}
                  aria-label="Enviar"
                >
                  Enviar
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!isOpen && (
        <button
          className="chatbot-button"
          onClick={isReady ? toggleChat : undefined}
          aria-label="Abrir chatbot"
          disabled={!isReady}
        >
          {isReady ? (
            <FaCommentDots />
          ) : (
            <div
              className="spinner-border text-light"
              role="status"
              style={{ width: "1.5rem", height: "1.5rem" }}
            >
              <span className="visually-hidden">Cargando...</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
};

export default Chatbot;

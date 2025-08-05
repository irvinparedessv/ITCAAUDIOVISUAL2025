import { useRef, useEffect } from "react";
import { FaCommentDots, FaTimes } from "react-icons/fa";
import { APIURL } from "../../constants/constant";
import { useChatbotLogic } from "./useChatbotLogic";
import EquiposSelect from "./Equipos";
import "./chatbot.css";
import { useAuth } from "~/hooks/AuthContext";
import { Button } from "react-bootstrap";

const Chatbot = () => {
  const { user } = useAuth();

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
    onGuardarReserva,
    onCancelarReserva,
    onModificarReserva,
  } = useChatbotLogic(user);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll automático al fondo del chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showFullScreen, mostrarEquipos]);

  // Enter = enviar mensaje
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputMessage.trim() !== "" && !pensando) {
      handleSendMessage();
    }
  };

  // Busca los datos completos de aula según sugerencia
  const getAulaCompleta = (sugerencia: any) => {
    return aulasDisponibles?.find((a) => a.id === sugerencia.id) || sugerencia;
  };

  return (
    <div
      className={
        "chatbot-container" +
        (isOpen ? " open" : "") +
        (showFullScreen || mostrarEquipos ? " expandido" : "")
      }
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

          <div
            className={
              "chat-window" +
              (showFullScreen || mostrarEquipos ? " expandido" : "")
            }
          >
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

              {/* --- Selección de AULA (cards cuadradas) --- */}
              {showFullScreen && (
                <div>
                  {espaciosParaSeleccionar.length === 0 ? (
                    // No hay aulas disponibles, muestra opciones de editar/cancelar
                    <div className="text-center my-4">
                      <div className="alert alert-warning">
                        No se encontraron aulas disponibles para los filtros
                        seleccionados.
                      </div>
                      <div className="d-flex flex-wrap gap-3 justify-content-center mt-4">
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            onCancelarReserva && onCancelarReserva();
                          }}
                        >
                          Cancelar Reserva
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            if (onModificarReserva) {
                              onModificarReserva(
                                "Quiero cambiar algunos datos de mi reserva"
                              );
                            }
                          }}
                        >
                          Modificar Reserva
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4
                        style={{
                          textAlign: "center",
                          margin: "1.5rem 0 1.1rem",
                        }}
                      >
                        Selecciona un espacio sugerido
                      </h4>
                      <div className="cards-cuadradas-grid">
                        {espaciosParaSeleccionar.map((sugerencia) => {
                          const aula = getAulaCompleta(sugerencia);
                          return (
                            <div key={aula.id} className="card-cuadrada">
                              {/* ...tu código para la card... */}
                              <div className="card-cuadrada-titulo">
                                {aula.nombre || `Espacio #${aula.id}`}
                              </div>
                              <div className="card-cuadrada-img">
                                {aula.path_modelo ? (
                                  //@ts-ignore
                                  <model-viewer
                                    src={APIURL + "/" + aula.path_modelo}
                                    alt={aula.nombre}
                                    camera-controls
                                    style={{
                                      width: "100%",
                                      height: "100%",
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
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      borderRadius: 12,
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="bg-secondary text-white d-flex align-items-center justify-content-center"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: 12,
                                      fontSize: 15,
                                    }}
                                  >
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                              <div className="card-cuadrada-sugerencia">
                                {sugerencia.recomendacion}
                              </div>
                              <button
                                className="card-cuadrada-boton"
                                onClick={() =>
                                  handleSeleccionarEspacio(aula, sugerencia)
                                }
                              >
                                Seleccionar
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* --- Selección de EQUIPOS --- */}
              {mostrarEquipos && (
                <div style={{ marginTop: 20, padding: 30 }}>
                  <EquiposSelect
                    formData={formData}
                    setFormData={setFormData}
                    isDateTimeComplete={true}
                    onGuardarReserva={onGuardarReserva}
                    onCancelarReserva={onCancelarReserva}
                    onModificarReserva={onModificarReserva}
                  />
                </div>
              )}

              <div ref={bottomRef} />
            </div>
            {/* Input SOLO si no hay selección activa */}
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
                  className="chat-send-button btn btn-primary"
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

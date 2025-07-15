// Chatbot.tsx
import { useAuth } from "../../hooks/AuthContext";
import { useChatbotLogic } from "./useChatbotLogic";
import ChatWindow from "./ChatWindow";
import InputBox from "./InputBox";
import "./chatbot.css";
import { useEffect, useRef } from "react";
import { FaCommentDots, FaRobot, FaTimes } from "react-icons/fa";

const Chatbot = () => {
  const { user } = useAuth();
  const {
    isOpen,
    inputMessage,
    setInputMessage,
    messages,
    handleSendMessage,
    setIsOpen,
    equipmentOptions,
    reservaData,
    reservaDataRoom,
    handleEquipoClick,
    completarReserva,
    completarReservaAula,
    step,
    setStep,
    setReservaData,
    setReservaDataRoom,
    setMessages,
    aulaOptions,
    tipoReservaOptions,
    addBotMessage,
    handleUbicacionClick,
    handleOptionClick,
    toggleChat,
    handleAulaFechaClick,
    handleTipoClick,
    handleAulaClick,
    handleTypeClick,
  } = useChatbotLogic(user);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cierra el chatbot al hacer clic fuera
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

  return (
    <div
      className={`chatbot-container ${isOpen ? "open" : ""}`}
      ref={containerRef}
    >
      {isOpen && (
        <>
          <div className="chat-header">
            <h3 id="chatbot-title">Asistente Virtual</h3>
            <button
              className="chat-close-button"
              aria-label="Cerrar"
              onClick={() => setIsOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="chat-window" role="log" aria-live="polite">
            <ChatWindow
              messages={messages}
              step={step}
              handleOptionClick={handleOptionClick}
              handleUbicacionClick={handleUbicacionClick}
              handleEquipoClick={handleEquipoClick}
              handleAulaClick={handleAulaClick}
              handleTipoClick={handleTipoClick}
              handleTypeClick={handleTypeClick}
              handleAulaFechaClick={handleAulaFechaClick}
              completarReserva={completarReserva}
              setReservaData={setReservaData}
              ubicaciones={aulaOptions}
              equipos={equipmentOptions}
              tipos={tipoReservaOptions}
              reservaData={reservaData}
              reservaDataRoom={reservaDataRoom}
              setStep={setStep}
              ref={bottomRef}
            />
            <InputBox
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSend={handleSendMessage}
              completarReserva={completarReserva}
              completarReservaAula={completarReservaAula}
              step={step}
              reservaData={reservaData}
              setReservaData={setReservaData}
              reservaDataRoom={reservaDataRoom}
              setReservaDataRoom={setReservaDataRoom}
              setStep={setStep}
              setMessages={setMessages}
              addBotMessage={addBotMessage}
            />
          </div>
        </>
      )}

      {/* Mostrar botón de burbuja solo si el chatbot está cerrado */}
      {!isOpen && (
        <button
          className="chatbot-button"
          onClick={toggleChat}
          aria-label="Abrir chatbot"
        >
          <FaCommentDots />
        </button>
      )}
    </div>
  );
};

export default Chatbot;

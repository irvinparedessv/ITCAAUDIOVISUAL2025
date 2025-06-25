// Chatbot.tsx
import { useAuth } from "../../hooks/AuthContext";
import { useChatbotLogic } from "./useChatbotLogic";
import ChatWindow from "./ChatWindow";
import InputBox from "./InputBox";
import "./chatbot.css";
import { useEffect, useRef } from "react";

const Chatbot = () => {
  const { user } = useAuth();
  const {
    isOpen,
    isDarkMode,
    inputMessage,
    setInputMessage,
    messages,
    handleSendMessage,
    setIsOpen,
    messagesEndRef,
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
  } = useChatbotLogic(user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div className={`chatbot-container ${isOpen ? "open" : ""}`}>
      {isOpen && (
        <>
          <div className="chat-header">
            <h3 id="chatbot-title">Asistente Virtual</h3>
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
            />{" "}
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
      <button className="chatbot-button" onClick={() => toggleChat()}>
        💬
      </button>
    </div>
  );
};

export default Chatbot;

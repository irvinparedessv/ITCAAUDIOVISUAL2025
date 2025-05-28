// Chatbot.tsx
import { useAuth } from "../../hooks/AuthContext";
import { useChatbotLogic } from "./useChatbotLogic";
import ChatWindow from "./ChatWindow";
import InputBox from "./InputBox";
import "./chatbot.css";

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
    handleEquipoClick,
    completarReserva,
    step,
    setStep,
    aulaOptions,
    handleUbicacionClick,
    handleOptionClick,
    handleAulaFechaClick,
    handleAulaClick,
  } = useChatbotLogic(user);

  return (
    <div
      className={`chatbot-container ${isOpen ? "open" : ""} ${
        isDarkMode ? "dark" : ""
      }`}
    >
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
              handleAulaFechaClick={handleAulaFechaClick}
              completarReserva={completarReserva}
              ubicaciones={aulaOptions}
              equipos={equipmentOptions}
              reservaData={reservaData}
              setStep={setStep}
            />{" "}
            <InputBox
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSend={handleSendMessage}
            />
          </div>
        </>
      )}
      <button className="chatbot-button" onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>
    </div>
  );
};

export default Chatbot;

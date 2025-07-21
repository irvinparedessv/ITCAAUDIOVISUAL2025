// useChatbotLogic.ts
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import type {
  OptionType,
  Message,
  ReservaData,
  ReservaDataRoom,
} from "./types";
import { getTipoReservas } from "../../services/tipoReservaService";
import { Steps } from "./steps";
import dayjs from "dayjs";
import { formatDate } from "./../../utils/time";

export const useChatbotLogic = (user: any) => {
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
    },
  ]);
  const [step, setStep] = useState("initial");

  const [reservaData, setReservaData] = useState<ReservaData>({
    fecha: "",
    horaInicio: "",
    horaFin: "",
    ubicacion: "",
    equipos: [],
    tipo: "",
  });

  const [reservaDataRoom, setReservaDataRoom] = useState<ReservaDataRoom>({
    aula: "",
    fecha: "",
    horarioInicio: "",
    horarioFin: "",
    type: "",
    titulo: "",
    fecha_fin: "",
    dias: [],
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    setIsReady(true);
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
  };

  const toggleChat = () => {
    resetChat();
    setIsOpen(!isOpen);
  };

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

    addBotMessage("Procesando tu consulta...");
    const contextForGPT = messages
      .map((msg) => ({
        role: msg.sender === "bot" ? "assistant" : "user",
        content: msg.text,
      }))
      // además agregas el mensaje nuevo que acabas de poner (userText)
      .concat([{ role: "user", content: userText }]);
    api
      .post("/chatGPT", {
        question: userText,
        context: contextForGPT,
      })
      .then((response) => {
        if (response.data.error) {
          addBotMessage(response.data.error.message);
        } else {
          if (response.data.reply == "rEquipo") {
            addBotMessage(
              "Perfecto , te ayudare creando la reservacion de equipos sigue los pasos a continuacion, ¿qué fecha deseas? (dd/mm/yyyy)"
            );
            setStep(Steps.FechaEquipo);
          } else if (response.data.reply == "rEspacio") {
            addBotMessage(
              "Perfecto , te ayudare creando la reservacion de espacios sigue los pasos a continuacion"
            );
            addBotMessage("Selecciona el espacio");
            setStep(Steps.SeleccionarAula);
          } else addBotMessage(response.data.reply);
        }
      })
      .catch(() => {
        addBotMessage("Ocurrió un error al procesar tu consulta.");
      });
  };

  return {
    isOpen,
    isDarkMode,
    inputMessage,
    messages,
    step,
    reservaData,
    reservaDataRoom,
    messagesEndRef,
    chatRef,
    isReady,
    setIsOpen,
    setInputMessage,
    setMessages,
    setReservaData,
    setReservaDataRoom,
    setStep,
    addBotMessage,
    handleSendMessage,
    resetChat,
    toggleChat,
  };
};

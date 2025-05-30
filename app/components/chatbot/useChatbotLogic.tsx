// useChatbotLogic.ts
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import type {
  OptionType,
  Message,
  ReservaData,
  ReservaDataRoom,
} from "./types";
import { getTipoReservas } from "~/services/tipoReservaService";
import { Steps } from "./steps";

export const useChatbotLogic = (user: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [tipoReservaOptions, setTipoReservaOptions] = useState<OptionType[]>(
    []
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
    },
  ]);
  const [step, setStep] = useState("initial");

  const [equipmentOptions, setEquipmentOptions] = useState<OptionType[]>([]);
  const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);
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
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  useEffect(() => {
    const fetchEquipments = async () => {
      const response = await api.get("/equiposReserva");
      const data = response.data;
      const options = data.map((item: any) => ({
        value: item.id,
        label: item.nombre,
      }));

      setEquipmentOptions(options);

      const responsex = await api.get("/aulasEquipos");
      const datax = responsex.data;
      const optionsx = datax.map((item: any) => ({
        value: item.id,
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
    const fetchTipos = async () => {
      const tipos = await getTipoReservas();
      setTipoReservaOptions(
        tipos.map((tr) => ({
          value: tr.id.toString(),
          label: tr.nombre,
        }))
      );
    };

    fetchTipos();
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
      tipo: "",
    });
    setReservaDataRoom({
      aula: "",
      fecha: "",
      horarioInicio: "",
      horarioFin: "",
    });
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
      setStep("fechaEquipo");
    } else if (option === "Crear reserva aula") {
      addBotMessage("Perfecto, Seleccione el aula.");
      setStep("seleccionarAula");
    } else if (option === "Consultas") {
      addBotMessage("¿Qué deseas consultar? Por favor, escribe tu pregunta.");
      setStep("consultas");
    } else if (option === "Crear reserva equipo") {
      addBotMessage("Perfecto, ¿qué fecha deseas? (dd/mm/yyyy)");
      setStep("fecha");
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
  const handleTipoClick = (tipo: string, label: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: label, sender: "user" },
    ]);
    setReservaData((prev) => ({ ...prev, tipo }));
    addBotMessage("Gracias. Ahora selecciona el aula:");
    setStep("seleccionarUbicacion");
  };

  const handleAulaClick = (aula: string) => {
    const aulaSeleccionada = aulaOptions.find((x) => x.value == aula);
    const message = aulaSeleccionada?.label ?? "";
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: message, sender: "user" },
    ]);
    setReservaDataRoom((prev) => ({ ...prev, aula }));
    addBotMessage("Gracias. Ahora selecciona una fecha disponible:");
    setStep(Steps.SeleccionarFechaAula);
  };
  const handleAulaFechaClick = (ubicacion: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: ubicacion, sender: "user" },
    ]);
    setReservaData((prev) => ({ ...prev, ubicacion }));
    addBotMessage("Gracias. Ahora selecciona un horario disponible:");
    setStep("horaAula");
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
      equipo: reservaData.equipos.map((id) => ({
        id,
        cantidad: 1,
      })),
      aula: reservaData.ubicacion,
      fecha_reserva: reservaData.fecha,
      startTime: reservaData.horaInicio,
      endTime: reservaData.horaFin,
      tipo_reserva_id: reservaData.tipo,
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
      const equiposSeleccionados = reservaData.equipos
        .map((id) => {
          const equipo = equipmentOptions.find((e) => e.value === id);
          return equipo?.label || id;
        })
        .join(", ");

      addBotMessage(
        `✅ ¡Reserva creada con éxito!\n\n📅 Fecha: ${reservaData.fecha}\n🕒 Hora: ${reservaData.horaInicio} - ${reservaData.horaFin}\n📍 Ubicación: ${reservaData.ubicacion}\n🎥 Equipos: ${equiposSeleccionados}`
      );
      addBotMessage(
        `¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`
      );
      setStep(Steps.Initial);
    }, 1000);
  };

  const completarReservaAula = async () => {
    if (
      !reservaDataRoom.fecha ||
      !reservaDataRoom.horarioInicio ||
      !reservaDataRoom.horarioInicio ||
      !reservaDataRoom.aula
    ) {
      addBotMessage(
        "Faltan datos de la reserva, por favor reinicia el proceso."
      );
      setStep("initial");
      return;
    }
    // Aquí podrías llamar a un API para guardar la reserva.
    addBotMessage("Procesando tu reserva...");
    const payload = {
      user_id: user?.id,
      aula_id: reservaDataRoom.aula,
      fecha: reservaDataRoom.fecha,
      horario: reservaDataRoom.horarioInicio + "-" + reservaDataRoom.horarioFin,
      estado: "pendiente",
    };
    try {
      await api.post("/reservasAula", payload);
    } catch (error) {
      console.error(error);
    }
    const aula = aulaOptions.find((e) => e.value === reservaDataRoom.aula);

    setTimeout(() => {
      addBotMessage(
        `✅ ¡Reserva creada con éxito!\n📍 Ubicación: ${aula?.value}\n\n📅 Fecha: ${reservaDataRoom.fecha}\n🕒 Hora: ${reservaDataRoom.horarioInicio} - ${reservaDataRoom.horarioFin}\n`
      );
      addBotMessage(
        `¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`
      );
      setStep(Steps.Initial);
    }, 1000);
  };
  return {
    // estados
    isOpen,
    isDarkMode,
    inputMessage,
    messages,
    step,
    equipmentOptions,
    aulaOptions,
    reservaData,
    reservaDataRoom,
    messagesEndRef,
    tipoReservaOptions,
    chatRef, // <---
    // setters
    setIsOpen,
    setInputMessage,
    setMessages,
    setReservaData,
    setReservaDataRoom,
    setStep,

    // funciones
    addBotMessage,
    handleSendMessage,
    handleOptionClick,
    handleUbicacionClick,
    handleEquipoClick,
    handleTipoClick,
    handleEliminarEquipo,
    handleAulaFechaClick,
    handleAulaClick,
    completarReserva,
    completarReservaAula,
    resetChat,
    toggleChat,
  };
};

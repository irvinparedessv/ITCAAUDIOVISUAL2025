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
    type: "",
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipResponse, aulaResponse] = await Promise.all([
          api.get("/equiposReserva"),
          api.get("/aulasEquipos"),
        ]);

        const equipmentOptions = equipResponse.data.map((item: any) => ({
          value: item.id,
          label: item.nombre,
        }));

        const aulaOptions = aulaResponse.data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }));

        setEquipmentOptions(equipmentOptions);
        setAulaOptions(aulaOptions);
      } catch (error) {
        console.error("Error cargando equipos y aulas", error);
      }
    };

    fetchData();
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
      type: "",
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

  const validarReserva = (fecha: string, horaInicio: string) => {
    const ahora = dayjs();
    const fechaReserva = dayjs(
      fecha.split("/").reverse().join("-") + " " + horaInicio,
      "YYYY-MM-DD HH:mm"
    );

    if (ahora.isSame(fechaReserva, "day")) {
      if (fechaReserva.diff(ahora, "minute") < 30) {
        return "La reserva debe hacerse con al menos 30 minutos de anticipación.";
      }
    }

    if (fechaReserva.diff(ahora, "day") > 7) {
      return "No puedes reservar con más de 7 días de anticipación.";
    }

    return null;
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
          if (response.data.error) {
            addBotMessage(response.data.error.message);
          } else {
            if (response.data.reply == "rEquipo") {
              addBotMessage(
                "Perfecto , te ayudare creando la reservacion de equipos sigue los pasos a continuacion, ¿qué fecha deseas? (dd/mm/yyyy)"
              );
              setStep(Steps.FechaEquipo);
            } else if (response.data.reply == "rEspacio ") {
              addBotMessage(
                "Perfecto , te ayudare creando la reservacion de espacios sigue los pasos a continuacion"
              );
              setStep(Steps.SeleccionarAula);
            } else addBotMessage(response.data.reply);
          }
        })
        .catch(() => {
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
    console.log(aula);
    const aulaSeleccionada = aulaOptions.find((x) => x.label == aula);
    const message = aulaSeleccionada?.label ?? "";
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: message, sender: "user" },
    ]);
    setReservaDataRoom((prev) => ({ ...prev, aula }));
    addBotMessage("Gracias. Ahora seleccione el tipo de reserva:");
    setStep(Steps.SeleccionarTipoReservaAula);
  };
  const handleTypeClick = (type: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: type, sender: "user" },
    ]);
    setReservaDataRoom((prev) => ({ ...prev, type }));
    addBotMessage("Gracias. Ahora seleccione la fecha de reserva:");
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
    const errorValidacion = validarReserva(
      reservaData.fecha,
      reservaData.horaInicio
    );
    if (errorValidacion) {
      addBotMessage(errorValidacion);
      return;
    }

    if (reservaData.equipos.length === 0) {
      addBotMessage("No has seleccionado ningún equipo.");
      setStep("mostrarEquipos");
      return;
    }

    addBotMessage("Procesando tu reserva...");
    const payload = {
      user_id: user?.id,
      equipo: reservaData.equipos.map((id) => ({ id, cantidad: 1 })),
      aula: reservaData.ubicacion,
      fecha_reserva: reservaData.fecha,
      startTime: reservaData.horaInicio,
      endTime: reservaData.horaFin,
      tipo_reserva_id: reservaData.tipo,
    };
    api
      .post("/BOTreservas", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      })
      .then((response) => {
        // ✅ Aquí va lo que pasa si todo sale bien
        const equiposSeleccionados = reservaData.equipos
          .map(
            (id) => equipmentOptions.find((e) => e.value === id)?.label || id
          )
          .join(", ");

        addBotMessage(
          `✅ ¡Reserva creada con éxito!\n\n📅 Fecha: ${reservaData.fecha}\n🕒 Hora: ${reservaData.horaInicio} - ${reservaData.horaFin}\n📍 Ubicación: ${reservaData.ubicacion}\n🎥 Equipos: ${equiposSeleccionados}`
        );
        addBotMessage(
          `¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`
        );
        setStep(Steps.Initial);
      })
      .catch((error) => {
        const errorMsg =
          error.response?.data?.message ||
          "Ocurrió un error al crear la reserva.";
        addBotMessage(`❌ Error: ${errorMsg}`);
      });
  };

  const completarReservaAula = async () => {
    if (
      !reservaDataRoom.fecha ||
      !reservaDataRoom.horarioInicio ||
      !reservaDataRoom.horarioFin ||
      !reservaDataRoom.aula
    ) {
      addBotMessage(
        "Faltan datos de la reserva, por favor reinicia el proceso."
      );
      setStep("initial");
      return;
    }

    const errorValidacion = validarReserva(
      reservaDataRoom.fecha,
      reservaDataRoom.horarioInicio
    );
    if (errorValidacion) {
      addBotMessage(errorValidacion);
      return;
    }

    addBotMessage("Procesando tu reserva...");
    const payload = {
      user_id: user?.id,
      aula_id: reservaDataRoom.aula,
      fecha: reservaDataRoom.fecha,
      horario: `${reservaDataRoom.horarioInicio}-${reservaDataRoom.horarioFin}`,
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
        `✅ ¡Reserva creada con éxito!\n📍 Ubicación: ${aula?.value}\n\n📅 Fecha: ${reservaDataRoom.fecha}\n🕒 Hora: ${reservaDataRoom.horarioInicio} - ${reservaDataRoom.horarioFin}`
      );
      addBotMessage(
        `¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`
      );
      setStep(Steps.Initial);
    }, 1000);
  };

  return {
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
    chatRef,
    setIsOpen,
    setInputMessage,
    setMessages,
    setReservaData,
    setReservaDataRoom,
    setStep,
    addBotMessage,
    handleSendMessage,
    handleOptionClick,
    handleUbicacionClick,
    handleEquipoClick,
    handleTipoClick,
    handleEliminarEquipo,
    handleAulaFechaClick,
    handleAulaClick,
    handleTypeClick,
    completarReserva,
    completarReservaAula,
    resetChat,
    toggleChat,
  };
};

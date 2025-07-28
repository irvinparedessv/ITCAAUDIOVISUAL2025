import { useState, useEffect } from "react";
import { ASSISTID, CHATGPT } from "~/constants/constant";
import api from "../../api/axios";
import type { UserLogin } from "~/types/user";
import { formatDate } from "~/utils/time";

const ASSISTANT_ID = ASSISTID;
const OPENAI_API_KEY = CHATGPT;

export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export interface AsistenteRespuesta {
  step: number | string;
  message: string;
  data?: any;
  reserva?: string;
  datos: any;
  opciones?: { nombre: string; recomendacion: string }[];
  correccion?: boolean;
}

export const useChatbotLogic = (user?: UserLogin) => {
  const [isReady, setIsReady] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! ¿En qué puedo ayudarte, necesitas asistencia?",
      sender: "bot",
    },
  ]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [asistenteData, setAsistenteData] = useState<AsistenteRespuesta | null>(
    null
  );
  const [formData, setFormData] = useState<any>({});
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const [aulasDisponibles, setAulasDisponibles] = useState<any[]>([]);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [espaciosParaSeleccionar, setEspaciosParaSeleccionar] = useState<any[]>(
    []
  );
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);

  const [loadingReserva, setLoadingReserva] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState<string | null>(
    null
  );
  const [pensando, setPensando] = useState(false);

  const [mostrarEquipos, setMostrarEquipos] = useState(false);
  const [seleccionDeAulaCompleta, setSeleccionDeAulaCompleta] = useState(false);

  // Extrae JSON de la respuesta de ChatGPT
  const extraeJson = (text: string): any => {
    try {
      const match =
        text.match(/```json([\s\S]*?)```/) || text.match(/{[\s\S]*}/);
      if (match) {
        const jsonStr = match[1]?.trim() || match[0];
        return JSON.parse(jsonStr);
      }
    } catch (e) {}
    return null;
  };

  // Reset total del chat
  const resetChat = () => {
    setInputMessage("");
    setMessages([
      {
        id: 1,
        text: "¡Hola! ¿En qué puedo ayudarte, necesitas asistencia? ¿Quieres realizar una reserva de espacio o préstamo de equipo?",
        sender: "bot",
      },
    ]);
    setThreadId(null);
    setAsistenteData(null);
    setFormData({});
    setShowFullScreen(false);
    setEspaciosParaSeleccionar([]);
    setLoadingReserva(false);
    setReservaConfirmada(null);
    setAulasDisponibles([]);
    setPensando(false);
    setMostrarEquipos(false);
    setSeleccionDeAulaCompleta(false);
    // console.log("[resetChat] Estado reseteado.");
  };

  const toggleChat = () => {
    resetChat();
    setIsOpen(!isOpen);
  };

  // Enviar mensaje normal al asistente
  const enviarMensajeAsistente = async (mensaje: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: mensaje, sender: "user" },
      { id: prev.length + 2, text: "Pensando...", sender: "bot" },
    ]);
    setInputMessage("");
    setPensando(true);

    try {
      let currentThreadId = threadId;

      if (!currentThreadId) {
        const threadRes = await fetch("https://api.openai.com/v1/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        });
        const threadData = await threadRes.json();
        if (!threadData.id) throw new Error("No se pudo crear el thread.");
        currentThreadId = threadData.id;
        setThreadId(currentThreadId);
      }

      await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: "user",
            content: mensaje,
          }),
        }
      );

      const runRes = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            assistant_id: ASSISTANT_ID,
          }),
        }
      );
      const runData = await runRes.json();
      const runId = runData.id;
      if (!runId || !runId.startsWith("run"))
        throw new Error(
          "No se obtuvo run_id válido. Respuesta run: " +
            JSON.stringify(runData)
        );

      let status = runData.status;
      let attempts = 0;
      while (status !== "completed" && attempts < 20) {
        await new Promise((res) => setTimeout(res, 1500));
        const runStatusRes = await fetch(
          `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "OpenAI-Beta": "assistants=v2",
            },
          }
        );
        const runStatusData = await runStatusRes.json();
        status = runStatusData.status;
        attempts++;
        if (
          status === "failed" ||
          status === "cancelled" ||
          status === "expired"
        ) {
          throw new Error("El run terminó con estado: " + status);
        }
      }

      const msgRes = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );
      const msgData = await msgRes.json();
      const assistantMsg = msgData.data
        .filter((m: any) => m.role === "assistant")
        .sort((a: any, b: any) => a.created_at - b.created_at)
        .pop();

      let respuestaTexto =
        assistantMsg?.content?.[0]?.text?.value ??
        "Sin respuesta del asistente.";
      let json = extraeJson(respuestaTexto);

      if (json?.step === "FINAL") {
        setAsistenteData(json);
        setFormData((prev: any) => ({
          ...prev,
          ...json.datos,
        }));

        setMessages((prev) =>
          prev
            .filter((msg) => msg.text !== "Pensando...")
            .concat({
              id: prev.length + 1,
              text: "Buscando espacios disponibles...",
              sender: "bot",
            })
        );
        setPensando(false);
        setLoadingSpaces(true);

        return;
      }

      setMessages((prev) =>
        prev
          .filter((msg) => msg.text !== "Pensando...")
          .concat({
            id: prev.length + 1,
            text: json?.message || respuestaTexto,
            sender: "bot",
          })
      );

      if (json) {
        setAsistenteData(json);
        if (json.datos)
          setFormData((prev: any) => ({ ...prev, ...json.datos }));
      }
    } catch (e) {
      setMessages((prev) =>
        prev
          .filter((msg) => msg.text !== "Pensando...")
          .concat({
            id: prev.length + 1,
            text: "Ocurrió un error con el asistente.",
            sender: "bot",
          })
      );
      // console.error("[enviarMensajeAsistente] Error:", e);
    } finally {
      setPensando(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || pensando) return;
    await enviarMensajeAsistente(inputMessage.trim());
  };

  // --- GUARDAR RESERVA DE EQUIPOS ---
  // ... (resto del hook igual)

  const onGuardarReserva = async () => {
    // Aquí: datos requeridos están en formData
    // Se asume que los datos ya están completos (no validaciones)
    setLoadingReserva(true);
    setReservaConfirmada(null);

    try {
      // --- Si es reserva de AULA + EQUIPOS ---
      if (formData.equiposSeleccionados?.length > 0 && formData.aula?.id) {
        const formPayload = new FormData();
        formPayload.append("user_id", user.id.toString());
        formPayload.append("aula", formData.aula.id);
        formPayload.append("fecha_reserva", formData.fecha);
        formPayload.append("startTime", formData.horaInicio);
        formPayload.append("endTime", formData.horaFin);
        formPayload.append("tipo_reserva_id", "3"); // Siempre 1 para tu lógica

        formData.equiposSeleccionados.forEach((eq: any, idx: number) => {
          formPayload.append(`equipo[${idx}][id]`, eq.id.toString());
          formPayload.append(`equipo[${idx}][cantidad]`, "1");
        });

        await api.post("/reservas", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: `✅ ¡Reserva creada exitosamente!\n\nAula: ${
              formData.aula.nombre
            }\nFecha: ${
              formData.fecha
            }\nEquipos: ${formData.equiposSeleccionados
              .map((eq: any) => eq.nombre_modelo)
              .join(", ")}`,
            sender: "bot",
          },
        ]);
      }
      setReservaConfirmada("¡Reserva de equipos guardada exitosamente!");
      setTimeout(() => resetChat(), 2500);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text:
            error?.response?.data?.message ||
            "Ocurrió un error al guardar la reserva.",
          sender: "bot",
        },
      ]);
      setReservaConfirmada("Ocurrió un error al guardar la reserva.");
    } finally {
      setLoadingReserva(false);
    }
  };

  // --- CANCELAR RESERVA (reset total) ---
  const onCancelarReserva = () => {
    resetChat();
  };

  // --- MODIFICAR RESERVA: envía mensaje al asistente para corrección ---
  const onModificarReserva = (
    msg: string = "Quiero cambiar algunos datos de mi reserva"
  ) => {
    enviarMensajeAsistente(msg);
  };

  // -- Resto igual (espacios sugeridos, selecciona aula, etc) --
  const enviarRecomendacionEspacios = async (aulas: any[]) => {
    const prompt = `
A continuación tienes una lista de espacios disponibles para un evento.
Datos del evento:
- Tipo de evento: ${formData.tipoEvento}
- Personas: ${formData.personas}
- Fecha: ${formData.fecha}
- Hora inicio: ${formData.horaInicio}
- Hora fin: ${formData.horaFin}
Espacios disponibles:
${JSON.stringify(aulas)}

Responde SOLO con un objeto JSON así:
{
  "step": "FINAL",
  "data": [
    { "id": ID_DEL_ESPACIO, "recomendacion": "Texto de recomendación específico para ese espacio según el evento y características" }
  ]
}
No expliques nada, no agregues texto fuera de ese objeto JSON.
`;

    try {
      setLoadingSugerencias(true);
      let currentThreadId = threadId;

      if (!currentThreadId) {
        const threadRes = await fetch("https://api.openai.com/v1/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        });
        const threadData = await threadRes.json();
        if (!threadData.id) throw new Error("No se pudo crear el thread.");
        currentThreadId = threadData.id;
        setThreadId(currentThreadId);
      }

      await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: "user",
            content: prompt,
          }),
        }
      );

      const runRes = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            assistant_id: ASSISTANT_ID,
          }),
        }
      );
      const runData = await runRes.json();
      const runId = runData.id;
      if (!runId || !runId.startsWith("run"))
        throw new Error(
          "No se obtuvo run_id válido. Respuesta run: " +
            JSON.stringify(runData)
        );

      let status = runData.status;
      let attempts = 0;
      while (status !== "completed" && attempts < 20) {
        await new Promise((res) => setTimeout(res, 1500));
        const runStatusRes = await fetch(
          `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "OpenAI-Beta": "assistants=v2",
            },
          }
        );
        const runStatusData = await runStatusRes.json();
        status = runStatusData.status;
        attempts++;
        if (
          status === "failed" ||
          status === "cancelled" ||
          status === "expired"
        ) {
          throw new Error("El run terminó con estado: " + status);
        }
      }

      const msgRes = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );
      const msgData = await msgRes.json();

      const assistantMsg = msgData.data
        .filter((m: any) => m.role === "assistant")
        .sort((a: any, b: any) => a.created_at - b.created_at)
        .pop();

      let respuestaTexto = assistantMsg?.content?.[0]?.text?.value ?? "[]";
      let recomendaciones = extraeJson(respuestaTexto);

      if (
        recomendaciones?.step === "FINAL" &&
        Array.isArray(recomendaciones?.data)
      ) {
        setEspaciosParaSeleccionar(recomendaciones.data);
        setShowFullScreen(true);
      }

      setFormData((prev: any) => ({
        ...prev,
        recomendacionesEspacios: recomendaciones,
      }));
    } catch (err) {
      // Manejo de error silencioso
    } finally {
      setLoadingSugerencias(false);
      setLoadingSpaces(false);
    }
  };

  useEffect(() => {
    if (loadingSpaces) {
      (async () => {
        try {
          const resp = await api.post("/sugerir-espacios", {
            fecha: formData.fecha,
            horaInicio: formData.horaInicio,
            horaFin: formData.horaFin,
            personas: formData.personas,
            fecha_fin: formData.fecha_fin ?? null,
          });
          const aulas = resp.data.aulas || [];
          setAulasDisponibles(aulas);
          await enviarRecomendacionEspacios(aulas);
        } catch (err) {
          setMessages((prev) =>
            prev.concat({
              id: prev.length + 1,
              text: "Error al obtener los espacios disponibles.",
              sender: "bot",
            })
          );
          setLoadingSpaces(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingSpaces]);

  const handleSeleccionarEspacio = async (aula: any, sugerencia: any) => {
    setShowFullScreen(false);
    setFormData((prev: any) => ({
      ...prev,
      aulaSeleccionada: aula,
      aula,
    }));
    setSeleccionDeAulaCompleta(true);

    if (formData.reserva === "espacio") {
      setLoadingReserva(true);
      setReservaConfirmada(null);
      const body: any = {
        aula_id: aula.id,
        fecha: formData.fecha,
        horario: `${formData.horaInicio} - ${formData.horaFin}`,
        tipo: formData.tipoEvento || "evento",
        user_id: user?.id || 1,
        estado: "Pendiente",
        comentario: "Reserva creada desde chatbot",
        fecha_fin: null,
      };

      try {
        await api.post("/reservasAula", body);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: `✅ Reserva realizada correctamente\n\n• Aula: ${aula.nombre}\n• Fecha: ${formData.fecha}\n• Horario: ${formData.horaInicio} - ${formData.horaFin}\n\n¡Gracias por usar el asistente!`,
            sender: "bot",
          },
        ]);
        setReservaConfirmada("¡Reserva realizada exitosamente!");
        setTimeout(() => {
          resetChat();
        }, 2500);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: "Ocurrió un error al guardar la reserva.",
            sender: "bot",
          },
        ]);
        setReservaConfirmada("Ocurrió un error al guardar la reserva.");
      } finally {
        setLoadingReserva(false);
      }
    } else if (formData.reserva === "equipo") {
      setMostrarEquipos(true);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: `Aula seleccionada: ${aula.nombre}. Ahora elige los equipos a reservar:`,
          sender: "bot",
        },
      ]);
    }
  };

  return {
    isOpen,
    isReady,
    inputMessage,
    setInputMessage,
    messages,
    handleSendMessage,
    setIsOpen,
    toggleChat,
    asistenteData,
    formData,
    setFormData,
    showFullScreen,
    espaciosParaSeleccionar,
    handleSeleccionarEspacio,
    loadingSpaces,
    loadingSugerencias,
    loadingReserva,
    reservaConfirmada,
    pensando,
    aulasDisponibles,
    mostrarEquipos,
    setMostrarEquipos,
    // NUEVAS FUNCIONES PARA TUS BOTONES
    onGuardarReserva,
    onCancelarReserva,
    onModificarReserva,
  };
};

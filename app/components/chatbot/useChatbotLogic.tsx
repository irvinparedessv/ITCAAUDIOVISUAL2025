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

type ConflictoTipo = "reserva_aula" | "reserva_equipo" | null;

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

  // 🆕 Estado para conflictos devueltos por el backend
  const [conflicto, setConflicto] = useState<{
    tipo: ConflictoTipo;
    mensaje?: string;
    reserva?: any;
  } | null>(null);

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
  const resetChat = (msg?: string) => {
    setInputMessage("");
    if (msg) {
      setMessages([
        {
          id: 1,
          text: msg,
          sender: "bot",
        },
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: "¡Hola! ¿En qué puedo ayudarte, necesitas asistencia? ¿Quieres realizar una reserva de espacio o préstamo de equipo?",
          sender: "bot",
        },
      ]);
    } else {
      setMessages([
        {
          id: 1,
          text: "¡Hola! ¿En qué puedo ayudarte, necesitas asistencia? ¿Quieres realizar una reserva de espacio o préstamo de equipo?",
          sender: "bot",
        },
      ]);
    }

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
    setConflicto(null); // 🆕 limpiar conflicto
  };

  const toggleChat = () => {
    resetChat();
    setIsOpen(!isOpen);
  };

  function padHora(hora: string) {
    if (!hora) return "";
    const [h, m] = hora.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }

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
    } finally {
      setPensando(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || pensando) return;
    await enviarMensajeAsistente(inputMessage.trim());
  };

  // --- GUARDAR RESERVA DE EQUIPOS ---
  const onGuardarReserva = async () => {
    setLoadingReserva(true);
    setReservaConfirmada(null);

    try {
      if (formData.equiposSeleccionados?.length > 0 && formData.aula?.id) {
        const formPayload = new FormData();
        formPayload.append("user_id", user!.id.toString());
        formPayload.append("aula", formData.aula.id);
        formPayload.append("fecha_reserva", formData.fecha);
        formPayload.append("startTime", formData.horaInicio);
        formPayload.append("endTime", formData.horaFin);
        formPayload.append("tipo_reserva_id", "3");
        let withReposo = false;
        formData.equiposSeleccionados.forEach((eq: any, idx: number) => {
          if (eq.en_reposo) {
            withReposo = true;
          }
          formPayload.append(`equipo[${idx}][id]`, eq.id.toString());
          formPayload.append(`equipo[${idx}][cantidad]`, "1");
        });
        formPayload.append(`en_reposo`, withReposo ? "1" : "0");
        formData.horaInicio = padHora(formData.horaInicio);
        formData.horaFin = padHora(formData.horaFin);
        await api.post("/reservas", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const text = `✅ ¡Reserva creada exitosamente!\n\nAula: ${
          formData.aula.nombre
        }\nFecha: ${formatDate(formData.fecha)}\n• Horario: ${
          formData.horaInicio
        } - ${formData.horaFin}\n\nEquipos: ${formData.equiposSeleccionados
          .map((eq: any) => eq.nombre_modelo)
          .join(", ")}`;

        setReservaConfirmada("¡Reserva de equipos guardada exitosamente!");
        setTimeout(() => resetChat(text), 2500);
      }
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
    setShowFullScreen(false);
    setMostrarEquipos(false);
  };

  // --- Enviar espacios a GPT para recomendaciones ---
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
      // Silencioso
    } finally {
      setLoadingSugerencias(false);
      setLoadingSpaces(false);
    }
  };

  // 🆕 Manejo centralizado de la respuesta de /sugerir-espacios (incluye conflictos)
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

          // Si el backend devuelve 'tipo', priorizamos ese flujo
          const tipo = resp.data?.tipo as
            | ConflictoTipo
            | "sugerencia"
            | undefined;

          if (tipo === "reserva_aula") {
            setConflicto({
              tipo: "reserva_aula",
              mensaje:
                resp.data?.mensaje ||
                "Ya tienes una reserva de aula para ese horario.",
              reserva: resp.data?.reserva || null,
            });
            setAulasDisponibles([]);
            setEspaciosParaSeleccionar([]);
            setShowFullScreen(true);
            setLoadingSpaces(false);
            return;
          }

          if (tipo === "reserva_equipo") {
            setConflicto({
              tipo: "reserva_equipo",
              mensaje:
                resp.data?.mensaje ||
                "Ya tienes una reserva de equipo para ese horario.",
              reserva: resp.data?.reserva || null,
            });
            setAulasDisponibles([]);
            setEspaciosParaSeleccionar([]);
            setShowFullScreen(true);
            setLoadingSpaces(false);
            return;
          }

          // Flujo normal (sugerencia): procesar aulas y pedir recomendación
          const aulas = resp.data?.aulas || [];
          setConflicto(null);
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
        const chatmsg = `✅ Reserva realizada correctamente\n\n• Aula: ${aula.nombre}\n• Fecha: ${formData.fecha}\n• Horario: ${formData.horaInicio} - ${formData.horaFin}\n\n¡Gracias por usar el asistente!`;

        setReservaConfirmada("¡Reserva realizada exitosamente!");
        setTimeout(() => {
          resetChat(chatmsg);
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

  // 🆕 Usa el aula de una reserva existente (caso conflicto 'reserva_aula')
  const onUsarAulaExistente = (reservaAula: any) => {
    if (!reservaAula?.aula && !reservaAula?.aula_id) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: "No se pudo obtener el detalle del aula de la reserva. Intenta modificar o cancelar.",
          sender: "bot",
        },
      ]);
      return;
    }

    const aulaSrc = reservaAula.aula || {};
    const aula = {
      id: aulaSrc.id ?? reservaAula.aula_id,
      nombre: aulaSrc.name || aulaSrc.nombre || `Espacio #${aulaSrc.id ?? "-"}`,
      imagen_normal: aulaSrc.imagen_normal ?? null,
      path_modelo: aulaSrc.path_modelo ?? null,
    };

    setConflicto(null);
    handleSeleccionarEspacio(aula, {
      recomendacion: "Usar aula de tu reserva existente",
    });
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
    // NUEVAS funciones y estados
    onGuardarReserva,
    onCancelarReserva,
    onModificarReserva,
    conflicto, // 🆕
    onUsarAulaExistente, // 🆕
  };
};

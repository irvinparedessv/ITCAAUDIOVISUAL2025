// src/hooks/useReservationFormLogic.ts
import { useState, useEffect, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "~/hooks/AuthContext";
import { useNavigate } from "react-router-dom";
import { getTipoReservas } from "~/services/tipoReservaService";
import api from "~/api/axios";
import { Role } from "~/types/roles";
import { timeOptions } from "~/utils/time";
import type { TipoReserva } from "~/types/tipoReserva";
import type { OptionType } from "../types/Common";
import type { EquipoResumen } from "../types/Equipos";
import type { FormDataType } from "../types/FormDataType";

export type UserOption = OptionType & { value: number };

interface LoadingState {
  tipoReserva: boolean;
  aulas: boolean;
  equipments: boolean;
  submit: boolean;
}

export default function useReservationFormLogic() {
  const [formData, setFormData] = useState<FormDataType>({
    date: "",
    startTime: "",
    endTime: "",
    tipoReserva: null,
    equipment: [],
    aula: null,
  });

  const [tipoReservaOptions, setTipoReservaOptions] = useState<OptionType[]>(
    []
  );
  const [aulaOptions, setAulaOptions] = useState<OptionType[]>([]);
  const [availableEquipmentOptions, setAvailableEquipmentOptions] = useState<
    EquipoResumen[]
  >([]);
  const [allEquipmentOptions, setAllEquipmentOptions] = useState<
    EquipoResumen[]
  >([]);
  const [prestamistaOptions, setPrestamistaOptions] = useState<UserOption[]>(
    []
  );
  const [selectedPrestamista, setSelectedPrestamista] =
    useState<UserOption | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<LoadingState>({
    tipoReserva: true,
    aulas: true,
    equipments: false,
    submit: false,
  });
  const [checkingAvailability, setCheckingAvailability] =
    useState<boolean>(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const isDateTimeComplete = Boolean(
    formData.date && formData.startTime && formData.endTime
  );

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const tipos: TipoReserva[] = await getTipoReservas();
        setTipoReservaOptions(
          tipos.map((tr) => ({ value: tr.id.toString(), label: tr.nombre }))
        );
      } catch {
        toast.error("Error cargando tipos de reserva");
      } finally {
        setLoading((prev) => ({ ...prev, tipoReserva: false }));
      }
    };
    fetchTipos();
  }, []);

  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const response = await api.get("/aulas");
        const data = response.data;
        setAulaOptions(
          data.map((item: { name: string; id: number }) => ({
            value: item.id,
            label: item.name,
          }))
        );
      } catch {
        toast.error("Error cargando las ubicaciones");
      } finally {
        setLoading((prev) => ({ ...prev, aulas: false }));
      }
    };
    fetchUbicaciones();
  }, []);

  useEffect(() => {
    const fetchEquiposDisponibles = async () => {
      if (!formData.tipoReserva || !isDateTimeComplete) return;
      try {
        setLoading((prev) => ({ ...prev, equipments: true }));
        const response = await api.get(`/equiposDisponiblesPorTipoYFecha`, {
          params: {
            tipo_reserva_id: formData.tipoReserva.value,
            fecha: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
          },
        });
        const options: EquipoResumen[] = response.data;
        setAllEquipmentOptions(options);
        setAvailableEquipmentOptions(options);
      } catch {
        toast.error("Error al obtener equipos disponibles");
        setAvailableEquipmentOptions([]);
      } finally {
        setLoading((prev) => ({ ...prev, equipments: false }));
      }
    };
    fetchEquiposDisponibles();
  }, [
    formData.tipoReserva,
    formData.date,
    formData.startTime,
    formData.endTime,
  ]);

  useEffect(() => {
    if (user?.role !== Role.Administrador && user?.role !== Role.Encargado)
      return;
    const fetchPrestamistas = async () => {
      try {
        const res = await api.get("/usuarios/rol/Prestamista");
        setPrestamistaOptions(
          res.data.map((u: any) => ({
            value: u.id,
            label: `${u.first_name} ${u.last_name} (${u.email})`,
          }))
        );
      } catch {
        toast.error("Error al cargar usuarios prestamistas");
      }
    };
    fetchPrestamistas();
  }, [user]);

  useEffect(() => {
    if (formData.tipoReserva?.label !== "Eventos" && uploadedFile) {
      setUploadedFile(null);
      toast("ℹ️ Documento eliminado porque el tipo de reserva no es Eventos");
    }
  }, [formData.tipoReserva, uploadedFile]);

  const getMinDate = (): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const lastStartTime = new Date();
    lastStartTime.setHours(16, 30, 0, 0);
    if (new Date() > lastStartTime) {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
    return now;
  };

  const getMaxDate = (): Date => {
    const min = getMinDate();
    const max = new Date(min);
    max.setDate(min.getDate() + 6);
    return max;
  };

  const getStartTimeOptions = (): string[] => {
    return timeOptions.filter((time: string) => {
      const [hourStr, minuteStr] = time.split(":"),
        hour = Number(hourStr),
        minute = Number(minuteStr);
      return hour >= 7 && (hour < 17 || (hour === 17 && minute === 0));
    });
  };

  const handleClear = () => {
    setFormData({
      date: "",
      startTime: "",
      endTime: "",
      tipoReserva: null,
      equipment: [],
      aula: null,
    });
    setAvailableEquipmentOptions([]);
    setUploadedFile(null);
    setSelectedPrestamista(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.dismiss("reservation-submit");

    if (!user) {
      toast.error("No se ha encontrado el usuario.", {
        id: "reservation-submit",
      });
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Fecha y horas obligatorias", { id: "reservation-submit" });
      return;
    }

    if (formData.equipment.length === 0) {
      toast.error("Debe seleccionar al menos un equipo", {
        id: "reservation-submit",
      });
      return;
    }

    if (!formData.aula) {
      toast.error("Debe seleccionar un aula", { id: "reservation-submit" });
      return;
    }

    if (formData.tipoReserva?.label === "Eventos" && !uploadedFile) {
      toast.error("Debe subir el documento del evento.", {
        id: "reservation-submit",
      });
      return;
    }

    const formPayload = new FormData();
    formPayload.append(
      "user_id",
      selectedPrestamista?.value || user.id.toString()
    );
    formPayload.append("aula", formData.aula.value);
    formPayload.append("fecha_reserva", formData.date);
    formPayload.append("startTime", formData.startTime);
    formPayload.append("endTime", formData.endTime);
    formPayload.append("tipo_reserva_id", formData.tipoReserva?.value || "");

    if (uploadedFile) {
      formPayload.append("documento_evento", uploadedFile);
    }
    console.log(formData.equipment);
    formData.equipment.forEach((eq, index) => {
      formPayload.append(`equipo[${index}][id]`, eq.id.toString());
      formPayload.append(`equipo[${index}][cantidad]`, "1");
    });

    try {
      setLoading((prev) => ({ ...prev, submit: true }));
      await api.post("/reservas", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("¡Reserva creada exitosamente!", {
        id: "reservation-submit",
      });
      setTimeout(() => navigate("/reservations"), 2000);
      handleClear();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Error al crear la reserva. Intenta nuevamente.";
      toast.error(message, { id: "reservation-submit" });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  return {
    formData,
    setFormData,
    handleSubmit,
    handleClear,
    getMinDate,
    getMaxDate,
    tipoReservaOptions,
    prestamistaOptions,
    selectedPrestamista,
    setSelectedPrestamista,
    aulaOptions,
    availableEquipmentOptions,
    allEquipmentOptions,
    uploadedFile,
    setUploadedFile,
    getStartTimeOptions,
    loading,
    isDateTimeComplete,
    checkingAvailability,
  };
}

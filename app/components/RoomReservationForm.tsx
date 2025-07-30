import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Modal, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import VisualizarModal from "../components/attendantadmin/VisualizarModal";

import Select, { type SingleValue } from "react-select";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaCheck,
  FaBroom,
  FaUser,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import { useAuth } from "app/hooks/AuthContext";
import { Role } from "~/types/roles";
import { APIURL } from "~/constants/constant";

type Aula = {
  id: number;
  name: string;
  path_modelo?: string | null;
  image_path?: string | null;
  escala?: number;
};

type OptionType = { value: string; label: string };

const messages = {
  update: {
    question: "¿Seguro que deseas actualizar esta reserva?",
    confirmText: "Sí, actualizar",
    cancelText: "Cancelar",
    success: "Reserva actualizada correctamente",
    error: "Error actualizando la reserva",
  },
};

export default function ReserveClassroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const isAdminOrEncargado =
    user?.role === Role.Administrador || user?.role === Role.EspacioEncargado;

  const [prestamistaOptions, setPrestamistaOptions] = useState<OptionType[]>(
    []
  );
  const [selectedPrestamista, setSelectedPrestamista] =
    useState<SingleValue<OptionType>>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<number | "">("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [tipoReserva, setTipoReserva] = useState<string>("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Modal para visualizar
  const [viewerModal, setViewerModal] = useState<{
    open: boolean;
    type: "3d" | "img" | null;
    src: string | null;
    escala?;
  }>({ open: false, type: null, src: null });

  // Helpers
  const formatDateTime = (date: Date, time: string) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")} ${time}`;
  };
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };
  const parseTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // Cargar prestamistas SOLO si es admin o encargado
  useEffect(() => {
    toast.dismiss();
    const fetchPrestamistas = async () => {
      if (isAdminOrEncargado) {
        try {
          const res = await api.get("/usuarios/rol/Prestamista");
          const options = res.data.map((u: any) => ({
            value: u.id,
            label: `${u.first_name} ${u.last_name} (${u.email})`,
          }));
          setPrestamistaOptions(options);
        } catch {
          toast.error("Error al cargar usuarios prestamistas");
        }
      }
      setLoading(false);
    };
    fetchPrestamistas();
    // eslint-disable-next-line
  }, [user]);

  // Buscar aulas disponibles solo cuando cambia usuario, fecha, hora inicio/fin
  useEffect(() => {
    const canQuery =
      selectedDate &&
      startTime &&
      endTime &&
      (isAdminOrEncargado ? selectedPrestamista?.value : userId);

    if (!canQuery) {
      setAvailableClassrooms([]);
      setSelectedClassroom("");
      return;
    }

    const fetchAulasDisponibles = async () => {
      setLoadingAulas(true);
      try {
        const fecha_inicio = formatDateTime(selectedDate!, startTime);
        const fecha_fin = formatDateTime(selectedDate!, endTime);
        const reqUserId = isAdminOrEncargado
          ? selectedPrestamista?.value
          : userId;
        const { data } = await api.post("/aulas-disponibles", {
          fecha_inicio,
          fecha_fin,
          user_id: reqUserId,
        });
        setAvailableClassrooms(data || []);
        if (!id) setSelectedClassroom("");
      } catch {
        toast.error("Error al consultar aulas disponibles");
        setAvailableClassrooms([]);
        setSelectedClassroom("");
      } finally {
        setLoadingAulas(false);
      }
    };
    fetchAulasDisponibles();
    // eslint-disable-next-line
  }, [
    selectedDate,
    startTime,
    endTime,
    selectedPrestamista,
    userId,
    isAdminOrEncargado,
  ]);

  // Si está en modo edición, cargar reserva existente
  useEffect(() => {
    if (!id) return;
    const loadReserva = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reservas-aula/${id}`);
        setSelectedDate(new Date(data.fecha));
        setDescripcion(data.comentario || "");
        const [start, end] = data.horario.split(" - ");
        setStartTime(start.trim());
        setEndTime(end.trim());
        if (data.user) {
          setSelectedPrestamista({
            value: data.user.id,
            label: `${data.user.first_name} ${data.user.last_name} (${data.user.email})`,
          });
        }
        setTipoReserva(data.tipo || "");
        setDiasSeleccionados(data.dias || []);
        setEndDate(data.fecha_fin ? new Date(data.fecha_fin) : null);
        setSelectedClassroom(data.aula.id);
      } catch {
        toast.error("Error al cargar datos de la reserva");
      } finally {
        setLoading(false);
      }
    };
    loadReserva();
  }, [id]);

  // Días disponibles (hardcode, ajusta si tienes lógica de horarios)
  const diasDisponibles = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  // Confirmación
  const showConfirmationToast = () => {
    return new Promise<boolean>((resolve) => {
      toast.dismiss("confirmation-toast");
      toast(
        (t) => (
          <div>
            <p>{messages.update.question}</p>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                {messages.update.confirmText}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                {messages.update.cancelText}
              </button>
            </div>
          </div>
        ),
        { duration: 5000, id: "confirmation-toast" }
      );
    });
  };

  // Guardar o actualizar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss("submit-toast");

    if (
      !selectedDate ||
      !startTime ||
      !endTime ||
      !selectedClassroom ||
      !descripcion.trim() ||
      !tipoReserva ||
      (isAdminOrEncargado && !selectedPrestamista)
    ) {
      toast.error("Completa todos los campos obligatorios", {
        id: "submit-toast",
      });
      return;
    }
    if (tipoReserva === "clase_recurrente") {
      if (diasSeleccionados.length === 0) {
        toast.error(
          "Debes seleccionar al menos un día para clases recurrentes."
        );
        return;
      }
      if (!endDate) {
        toast.error(
          "Debes seleccionar una fecha de finalización para clases recurrentes."
        );
        return;
      }
      if (selectedDate && endDate && selectedDate > endDate) {
        toast.error(
          "La fecha de inicio no puede ser después de la fecha de finalización."
        );
        return;
      }
    }
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    if (startMinutes >= endMinutes) {
      toast.error("La hora de inicio debe ser antes de la hora fin", {
        id: "submit-toast",
      });
      return;
    }
    if (id) {
      const userConfirmed = await showConfirmationToast();
      if (!userConfirmed) return;
    }
    const aula = availableClassrooms.find((c) => c.id === selectedClassroom);
    if (!aula) {
      toast.error("Aula no válida", { id: "submit-toast" });
      return;
    }

    const horarioFinal = `${startTime} - ${endTime}`;
    try {
      setIsUpdating(true);
      const payload = {
        aula_id: aula.id,
        fecha: formatDateLocal(selectedDate),
        horario: horarioFinal,
        user_id: isAdminOrEncargado
          ? selectedPrestamista?.value?.toString()
          : userId,
        estado:
          isAdminOrEncargado && selectedPrestamista?.value?.toString()
            ? "Aprobado"
            : "Pendiente",
        comentario: descripcion.trim(),
        tipo: tipoReserva,
        fecha_fin: endDate ? formatDateLocal(endDate) : null,
        dias: diasSeleccionados,
      };

      if (id) {
        await api.put(`/reservas-aula/${id}`, payload);
        toast.success(messages.update.success, { id: "submit-toast" });
      } else {
        await api.post("/reservasAula", payload);
        toast.success("¡Reserva creada exitosamente!", { id: "submit-toast" });
      }

      await new Promise((res) => setTimeout(res, 1000));
      navigate("/reservations-room");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (id ? messages.update.error : "Error al guardar la reserva");
      toast.error(message, { id: "submit-toast" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Limpiar/cancelar
  const handleClearOrCancel = async () => {
    try {
      setIsCancelling(true);
      await new Promise((res) => setTimeout(res, 200));
      if (id) {
        navigate(-1);
      } else {
        setSelectedDate(null);
        setStartTime("");
        setEndTime("");
        setSelectedClassroom("");
        setSelectedPrestamista(null);
        setDescripcion("");
        setTipoReserva("");
        setDiasSeleccionados([]);
        setAvailableClassrooms([]);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // Encontrar aula seleccionada
  const selectedClassroomData = availableClassrooms.find(
    (c) => c.id === selectedClassroom
  );

  // Validación para hoy o futuro
  const isDateValid = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="form-container position-relative mb-3 mb-md-0">
      <div
        className="d-flex align-items-center gap-2 gap-md-3"
        style={{ marginBottom: "30px" }}
      >
        <FaLongArrowAltLeft
          onClick={() => navigate("/reservations-room")}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <h2 className="fw-bold m-0">
          <FaDoorOpen className="me-2" />
          {id ? "Editar Reserva" : "Reserva de Espacio"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        {isAdminOrEncargado && (
          <div className="mb-4">
            <label className="form-label d-flex align-items-center">
              <FaUser className="me-2" /> Usuario prestamista
            </label>
            <Select
              options={prestamistaOptions}
              value={selectedPrestamista}
              onChange={(selected) => setSelectedPrestamista(selected)}
              placeholder="Selecciona un usuario prestamista"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={!!id}
              isClearable
            />
            {id && (
              <div className="form-text text-muted">
                No se puede cambiar el usuario prestamista en modo edición
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="date" className="form-label">
            <FaCalendarAlt className="me-2" /> Fecha
          </label>
          <DatePicker
            id="date"
            selected={selectedDate}
            onChange={(date) => {
              if (date) {
                date.setHours(12, 0, 0, 0);
                setSelectedDate(date);
                setStartTime("");
                setEndTime("");
                setAvailableClassrooms([]);
                setSelectedClassroom("");
              }
            }}
            className="form-control"
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona la fecha"
            filterDate={isDateValid}
            required
            disabled={!!id || (isAdminOrEncargado && !selectedPrestamista)}
          />
        </div>
        <div className="mb-4 row">
          <div className="col-md-6 mb-2">
            <label htmlFor="startTime" className="form-label">
              <FaClock className="me-2" /> Hora de Inicio
            </label>
            <input
              id="startTime"
              type="time"
              className="form-control"
              value={startTime}
              min="07:00"
              max="22:00"
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={!selectedDate || !!id}
            />
          </div>
          <div className="col-md-6 mb-2">
            <label htmlFor="endTime" className="form-label">
              <FaClock className="me-2" /> Hora de Fin
            </label>
            <input
              id="endTime"
              type="time"
              className="form-control"
              value={endTime}
              min={startTime || "07:00"}
              max="22:00"
              onChange={(e) => setEndTime(e.target.value)}
              required
              disabled={!startTime || !!id}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="descripcion" className="form-label">
            Título{" "}
            <small className="text-muted">
              (Grupo, Familia u otra información necesaria)
            </small>
          </label>
          <textarea
            id="descripcion"
            className="form-control"
            placeholder="Ejemplo: Grupo A - Familia X"
            value={descripcion}
            disabled={endTime == "" || endTime == null}
            minLength={1}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="tipoReserva" className="form-label">
            Tipo de Reserva
          </label>
          <select
            id="tipoReserva"
            className="form-select"
            value={tipoReserva}
            disabled={descripcion == "" || descripcion == null}
            onChange={(e) => {
              setTipoReserva(e.target.value);
              setDiasSeleccionados([]);
            }}
            required
          >
            <option value="">Selecciona el tipo</option>
            <option value="evento">Evento</option>
            <option value="clase">Clase</option>
            <option value="clase_recurrente">Clase Recurrente</option>
          </select>
        </div>

        {tipoReserva === "clase_recurrente" && (
          <>
            <div className="mb-4">
              <label htmlFor="endDate" className="form-label">
                <FaCalendarAlt className="me-2" /> Fecha de Finalización
              </label>
              <DatePicker
                id="endDate"
                selected={endDate}
                onChange={(date) => {
                  if (date) {
                    date.setHours(12, 0, 0, 0);
                    setEndDate(date);
                  }
                }}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona la fecha de finalización"
                minDate={selectedDate || new Date()}
                required
                disabled={!selectedDate}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Días de la semana</label>
              <div className="d-flex flex-wrap gap-3">
                {diasDisponibles.map((dia) => (
                  <div key={dia} className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`dia-${dia}`}
                      disabled={!endDate}
                      value={dia}
                      checked={diasSeleccionados.includes(dia)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (e.target.checked) {
                          setDiasSeleccionados([...diasSeleccionados, value]);
                        } else {
                          setDiasSeleccionados(
                            diasSeleccionados.filter((d) => d !== value)
                          );
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor={`dia-${dia}`}>
                      {dia}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {/* Mostrar select de aula y botones de visualización */}
        <div
          className="mb-4"
          style={{
            display:
              tipoReserva && selectedDate && startTime && endTime
                ? undefined
                : "none",
          }}
        >
          <label htmlFor="classroom" className="form-label">
            <FaDoorOpen className="me-2" /> Aula disponible
          </label>
          <div className="d-flex align-items-center gap-2">
            <select
              id="classroom"
              className="form-select"
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(Number(e.target.value))}
              required={
                tipoReserva && selectedDate && startTime && endTime
                  ? true
                  : false
              }
              disabled={!!id || loadingAulas}
            >
              <option value="">Selecciona un aula</option>
              {availableClassrooms.map((aula) => (
                <option key={aula.id} value={aula.id}>
                  {aula.name}
                </option>
              ))}
            </select>
            {loadingAulas && (
              <Spinner
                animation="border"
                variant="primary"
                size="sm"
                style={{ marginLeft: 8 }}
              />
            )}
            {/* Botón visualizar modelo 3D */}
            {!!selectedClassroom && selectedClassroomData?.path_modelo && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setViewerModal({
                    open: true,
                    type: "3d",
                    escala: selectedClassroomData.escala,
                    src: APIURL + "/" + selectedClassroomData.path_modelo!,
                  })
                }
                className="ms-2"
              >
                Visualizar 3D
              </Button>
            )}
          </div>
          {id && (
            <div className="form-text text-muted">
              No se puede editar el aula en modo edición
            </div>
          )}
        </div>
        <br />
        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={
              isUpdating ||
              !selectedDate ||
              !startTime ||
              !endTime ||
              !selectedClassroom ||
              (isAdminOrEncargado && !selectedPrestamista) ||
              !descripcion.trim()
            }
          >
            {isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Guardando...
              </>
            ) : (
              <>
                <FaCheck className="me-2" /> {id ? "Actualizar" : "Reservar"}
              </>
            )}
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleClearOrCancel}
            disabled={isUpdating || isCancelling}
          >
            {isCancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {id ? "Cancelando..." : "Limpiando..."}
              </>
            ) : (
              <>
                <FaBroom className="me-2" /> {id ? "Cancelar" : "Limpiar"}
              </>
            )}
          </button>
        </div>
      </form>

      {viewerModal.type === "3d" && (
        //@ts-ignore
        <VisualizarModal
          show={viewerModal.open}
          onHide={() => setViewerModal({ open: false, type: null, src: null })}
          path={viewerModal.src}
          escala={viewerModal.escala}
        />
      )}
    </div>
  );
}

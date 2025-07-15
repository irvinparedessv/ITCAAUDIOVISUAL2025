import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Modal, Button, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
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
  FaImages,
} from "react-icons/fa";
import { useAuth } from "app/hooks/AuthContext";
import { Role } from "~/types/roles";
import PanoramaViewer from "./PanoramaViewer";

type Horario = {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[];
};

type ImagenAula = {
  url: string;
  is_360: boolean;
};

type Aula = {
  id: number;
  name: string;
  imagenes?: ImagenAula[];
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

  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [prestamistaOptions, setPrestamistaOptions] = useState<OptionType[]>(
    []
  );
  const [selectedPrestamista, setSelectedPrestamista] =
    useState<SingleValue<OptionType>>(null);

  const [aulaHorarios, setAulaHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tipoReserva, setTipoReserva] = useState<string>("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const isDateTimeComplete = selectedDate && startTime && endTime;

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  useEffect(() => {
    toast.dismiss();
    const fetchAulas = async () => {
      try {
        const response = await api.get("/aulas");
        setAvailableClassrooms(response.data);
      } catch {
        toast.error("Error al cargar aulas");
      }
    };

    const fetchPrestamistas = async () => {
      if (
        user?.role === Role.Administrador ||
        user?.role === Role.EspacioEncargado
      ) {
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
    };

    Promise.all([fetchAulas(), fetchPrestamistas()]).finally(() =>
      setLoading(false)
    );
  }, [user]);

  useEffect(() => {
    if (!id) return;

    const loadReserva = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reservas-aula/${id}`);
        handleAulaSelect(data.aula.name, data.aula.id);
        setSelectedClassroom(data.aula.name);
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
      } catch {
        toast.error("Error al cargar datos de la reserva");
      } finally {
        setLoading(false);
      }
    };

    loadReserva();
  }, [id]);

  const handleAulaSelect = async (aulaName: string, idaula: number) => {
    setSelectedClassroom(aulaName);
    setSelectedDate(null);
    setStartTime("");
    setEndTime("");
    setSelectedPrestamista(null);

    if (idaula === 0) {
      const aula = availableClassrooms.find((c) => c.name === aulaName);
      if (!aula) return;
      idaula = aula.id;
    }

    setLoadingHorarios(true);
    try {
      const { data } = await api.get(`/aulas/${idaula}/horarios`);
      setAulaHorarios(data.horarios);
    } catch {
      toast.error("Error al cargar horarios del aula");
      setAulaHorarios([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const parseTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const isDateEnabled = (date: Date): boolean => {
    if (loadingHorarios) return false;
    if (!aulaHorarios.length) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const dateString = formatDateLocal(date);
    const dayName = date.toLocaleDateString("es-ES", { weekday: "long" });
    const dayNameCapital = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    const horariosValidos = aulaHorarios.filter((h) => {
      return (
        h.days.includes(dayNameCapital) &&
        dateString >= h.start_date &&
        dateString <= h.end_date
      );
    });

    return horariosValidos.length > 0;
  };

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
  const diasDisponibles = Array.from(
    new Set(aulaHorarios.flatMap((h) => h.days))
  );
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss("submit-toast");

    if (!selectedDate || !startTime || !endTime || !selectedClassroom) {
      toast.error("Completa todos los campos", { id: "submit-toast" });
      return;
    }
    if (!tipoReserva) {
      toast.error("Debes seleccionar el tipo de reserva");
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

    const aula = availableClassrooms.find((c) => c.name === selectedClassroom);
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
        user_id: selectedPrestamista?.value?.toString() || userId,
        estado: selectedPrestamista?.value?.toString()
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
        setAulaHorarios([]);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const selectedClassroomData = availableClassrooms.find(
    (c) => c.name === selectedClassroom
  );

  const handlePrev = () => {
    setCarouselIndex((prev) =>
      prev === 0 ? selectedClassroomData!.imagenes!.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCarouselIndex((prev) =>
      prev === selectedClassroomData!.imagenes!.length - 1 ? 0 : prev + 1
    );
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
          style={{
            cursor: "pointer",
            fontSize: "2rem",
          }}
        />
        <h2 className="fw-bold m-0">
          <FaDoorOpen className="me-2" />
          {id ? "Editar Reserva" : "Reserva de Espacio"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="classroom" className="form-label">
            <FaDoorOpen className="me-2" /> Aula
          </label>
          <select
            id="classroom"
            className="form-select"
            value={selectedClassroom}
            onChange={(e) => handleAulaSelect(e.target.value, 0)}
            required
            disabled={!!id}
          >
            <option value="">Selecciona un aula</option>
            {availableClassrooms.map((aula) => (
              <option key={aula.id} value={aula.name}>
                {aula.name}
              </option>
            ))}
          </select>
          {id && (
            <div className="form-text text-muted">
              No se puede editar el aula en modo edición
            </div>
          )}
        </div>
        {selectedClassroomData?.imagenes?.length! > 0 && (
          <button
            type="button"
            className="btn btn-info ms-3"
            onClick={() => {
              setCarouselIndex(0);
              setShowModal(true);
            }}
          >
            <FaImages className="me-2" /> Visualizar Imágenes
          </button>
        )}
        <div className="mb-4">
          <label htmlFor="descripcion" className="form-label">
            Titulo{" "}
            <small className="text-muted">
              (Grupo, Familia u otra información necesaria)
            </small>
          </label>
          <textarea
            id="descripcion"
            className="form-control"
            placeholder="Ejemplo: Grupo A - Familia X"
            value={descripcion}
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
            disabled={!!id || descripcion.trim().length < 1} // aquí agregas el !!id para bloquear edición en modo editar
            className="form-select"
            value={tipoReserva}
            onChange={(e) => {
              setTipoReserva(e.target.value);
              setDiasSeleccionados([]); // Limpia días si cambia tipo
            }}
            required
          >
            <option value="">Selecciona el tipo</option>
            <option value="evento">Evento</option>
            <option value="clase">Clase</option>
            <option value="clase_recurrente">Clase Recurrente</option>
          </select>
        </div>
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
              }
            }}
            className="form-control"
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona la fecha"
            required
            disabled={
              !selectedClassroom ||
              loadingHorarios ||
              tipoReserva == "" ||
              tipoReserva == null
            }
            filterDate={isDateEnabled}
          />
          {loadingHorarios && (
            <small className="text-muted">Restringiendo horarios...</small>
          )}
        </div>
        {tipoReserva === "clase_recurrente" && (
          <div className="mb-4">
            <label htmlFor="endDate" className="form-label">
              <FaCalendarAlt className="me-2" /> Fecha de Finalización
            </label>
            <DatePicker
              id="endDate"
              selected={endDate}
              filterDate={isDateEnabled}
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
              disabled={selectedDate == null || loadingHorarios}
            />
            {loadingHorarios && (
              <small className="text-muted">Restringiendo horarios...</small>
            )}
          </div>
        )}
        {tipoReserva === "clase_recurrente" && (
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
        )}
        <div className="mb-4">
          <label className="form-label">
            <FaClock className="me-2" /> Horario
          </label>
          <div className="mb-4 row">
            <div className="col-md-6 mb-2">
              <label htmlFor="startTime" className="form-label">
                Inicio
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
                disabled={!selectedDate}
              />
            </div>
            <div className="col-md-6 mb-2">
              <label htmlFor="endTime" className="form-label">
                Fin
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
                disabled={!startTime}
              />
            </div>
          </div>
        </div>

        {(user?.role === Role.Administrador ||
          user?.role === Role.EspacioEncargado) && (
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
              isDisabled={!isDateTimeComplete || !!id}
            />
            {id && (
              <div className="form-text text-muted">
                No se puede cambiar el usuario prestamista en modo edición
              </div>
            )}
          </div>
        )}

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
              ((user?.role === Role.Administrador ||
                user?.role === Role.EspacioEncargado) &&
                !selectedPrestamista) ||
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

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        fullscreen
      >
        <Modal.Header closeButton>
          <Modal.Title>Imágenes del Aula</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedClassroomData?.imagenes &&
            selectedClassroomData.imagenes.length > 0 && (
              <>
                {selectedClassroomData.imagenes[carouselIndex].is_360 ? (
                  <PanoramaViewer
                    image={selectedClassroomData.imagenes[carouselIndex].url}
                    pitch={10}
                    yaw={180}
                    hfov={110}
                  />
                ) : (
                  <Card style={{ width: "100%" }}>
                    <Card.Img
                      variant="top"
                      src={selectedClassroomData.imagenes[carouselIndex].url}
                      style={{ maxHeight: "80vh", objectFit: "contain" }}
                    />
                  </Card>
                )}
                {selectedClassroomData?.imagenes &&
                  selectedClassroomData.imagenes.length > 1 && (
                    <div className="mt-3 d-flex justify-content-between">
                      <Button variant="secondary" onClick={handlePrev}>
                        Anterior
                      </Button>
                      <Button variant="secondary" onClick={handleNext}>
                        Siguiente
                      </Button>
                    </div>
                  )}
              </>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

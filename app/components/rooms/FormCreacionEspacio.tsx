import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaSave,
  FaPlus,
  FaBroom,
  FaUpload,
  FaTrash,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { APPLARAVEL } from "~/constants/constant";
import { Spinner } from "react-bootstrap";
import { diasSemana } from "../../constants/day";
import type { AvailableTime } from "../../types/aula";
import * as exifr from "exifr";
import EspacioNoEncontrado from "../error/EspacioNoEncontrado";
import { formatDate } from "~/utils/time";

type RenderImageInfo = {
  id?: number;
  file: File | null;
  preview: string;
  is360: boolean;
};

export const CreateSpaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidadMaxima, setCapacidadMaxima] = useState("");

  const [pathModelo, setPathModelo] = useState("");

  const [renderImages, setRenderImages] = useState<RenderImageInfo[]>([]);
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);
  const [timeInput, setTimeInput] = useState<AvailableTime>({
    start_date: "",
    end_date: "",
    days: [],
  });

  const [loading, setLoading] = useState(isEdit);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleBack = () => {
    navigate("/rooms");
  };

  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api
        .get(`/aulas/${id}`)
        .then((res) => {
          const aula = res.data;
          setName(aula.name);
          setDescripcion(aula.descripcion || "");
          setCapacidadMaxima(aula.capacidad_maxima?.toString() || "");

          const horariosParseados = aula.horarios.map((h: any) => ({
            ...h,
            days: typeof h.days === "string" ? JSON.parse(h.days) : h.days,
          }));
          setAvailableTimes(horariosParseados);
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            toast.error("Error al cargar el aula");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddTime = () => {
    const { start_date, end_date, days } = timeInput;

    toast.dismiss("add-time-error");

    if (!start_date || !end_date || days.length === 0) {
      toast.error("Completa todos los campos y selecciona al menos un día.", {
        id: "add-time-error",
      });
      return;
    }

    if (end_date < start_date) {
      toast.error("La fecha fin no puede ser menor a la fecha inicio.", {
        id: "add-time-error",
      });
      return;
    }

    const isOverlap = availableTimes.some((t) => {
      const dateOverlap = !(end_date < t.start_date || start_date > t.end_date);
      const dayOverlap = t.days.some((d: string) => days.includes(d));
      return dateOverlap && dayOverlap;
    });

    if (isOverlap) {
      toast.error("Ya existe un rango con fechas y días similares.", {
        id: "add-time-error",
      });
      return;
    }

    setAvailableTimes([...availableTimes, { ...timeInput }]);
    setTimeInput({
      start_date: "",
      end_date: "",
      days: [],
    });
  };

  const handleRemoveTime = (index: number) => {
    const newTimes = [...availableTimes];
    newTimes.splice(index, 1);
    setAvailableTimes(newTimes);
  };

  const handleClear = () => {
    setName("");
    setDescripcion("");
    setCapacidadMaxima("");

    setPathModelo("");
    setRenderImages([]);
    setAvailableTimes([]);
    setTimeInput({
      start_date: "",
      end_date: "",
      days: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre del espacio es obligatorio");
      return;
    }

    if (availableTimes.length === 0) {
      toast.error("Debes agregar al menos un horario disponible");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("descripcion", descripcion);
    formData.append("capacidad_maxima", capacidadMaxima);

    formData.append("available_times", JSON.stringify(availableTimes));
    setLoadingSubmit(true);

    try {
      const endpoint = isEdit ? `/aulas/${id}/update` : "/aulas";
      await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        isEdit
          ? "Espacio actualizado correctamente"
          : "Espacio creado correctamente"
      );
      if (!isEdit) handleClear();
      navigate("/rooms");
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors) {
          Object.values(errors).forEach((msgs) => {
            (msgs as string[]).forEach((msg) => {
              toast.error(msg);
            });
          });
          return;
        }
      }

      toast.error(
        isEdit ? "Error actualizando el espacio" : "Error creando el espacio"
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading || loadingSubmit) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (notFound) return <EspacioNoEncontrado />;

  return (
    <div className="form-container position-relative">
      <div className="d-flex align-items-center gap-2 gap-md-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <h2 className="fw-bold m-0">
          {isEdit ? "Editar Espacio" : "Crear Nuevo Espacio"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Nombre del espacio</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Capacidad máxima</label>
          <input
            type="number"
            min={1}
            className="form-control"
            value={capacidadMaxima}
            onChange={(e) => setCapacidadMaxima(e.target.value)}
          />
        </div>

        {/* Horarios */}
        <div className="mb-4">
          <h5 className="mb-3">Horarios disponibles</h5>
          <div className="row mb-3">
            <div className="col-md-3 mb-2">
              <label className="form-label">Fecha de inicio</label>
              <input
                type="date"
                value={timeInput.start_date}
                onChange={(e) =>
                  setTimeInput({ ...timeInput, start_date: e.target.value })
                }
                className="form-control"
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Fecha de fin</label>
              <input
                type="date"
                value={timeInput.end_date}
                onChange={(e) =>
                  setTimeInput({ ...timeInput, end_date: e.target.value })
                }
                className="form-control"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Días de la semana</label>
            <div className="d-flex flex-wrap gap-3">
              {diasSemana.map((d) => (
                <div key={d.value} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`day-${d.value}`}
                    value={d.value}
                    checked={timeInput.days.includes(d.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTimeInput((prev) => ({
                        ...prev,
                        days: checked
                          ? [...prev.days, d.value]
                          : prev.days.filter((x) => x !== d.value),
                      }));
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`day-${d.value}`}
                  >
                    {d.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleAddTime}
          >
            <FaPlus className="me-2" /> Agregar horario
          </button>
        </div>

        {availableTimes.length > 0 && (
          <ul className="list-group mb-4">
            {availableTimes.map((t, i) => (
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  Del {formatDate(t.start_date)} al {formatDate(t.end_date)} –{" "}
                  {t.days
                    .map((d) => diasSemana.find((x) => x.value === d)?.label)
                    .join(", ")}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleRemoveTime(i)}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="form-actions">
          <button type="submit" className="btn primary-btn">
            <FaSave className="me-2" />{" "}
            {isEdit ? "Actualizar espacio" : "Crear espacio"}
          </button>
          {!isEdit && (
            <button
              type="button"
              className="btn secondary-btn"
              onClick={handleClear}
            >
              <FaBroom className="me-2" /> Limpiar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

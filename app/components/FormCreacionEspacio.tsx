import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaSave,
  FaTimes,
  FaPlus,
  FaBroom,
  FaUpload,
  FaTrash,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "../api/axios";
import { APPLARAVEL } from "~/constants/constant";
import { Spinner } from "react-bootstrap";
import { diasSemana } from "../constants/day";
import type { AvailableTime } from "../types/aula";
export const CreateSpaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [renderImages, setRenderImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);
  const [timeInput, setTimeInput] = useState<AvailableTime>({
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    days: [],
  });

  const [loading, setLoading] = useState(isEdit);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api
        .get(`/aulas/${id}`)
        .then((res) => {
          const aula = res.data;
          setName(aula.name);

          const imageUrls = aula.imagenes.map((img: any) =>
            img.image_path.startsWith("http")
              ? img.image_path
              : `${APPLARAVEL + "/"}${img.image_path}`
          );
          setImagePreviews(imageUrls);

          const horariosParseados = aula.horarios.map((h: any) => ({
            ...h,
            days: typeof h.days === "string" ? JSON.parse(h.days) : h.days,
          }));
          setAvailableTimes(horariosParseados);
        })
        .catch(() => toast.error("Error al cargar el aula"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const files = acceptedFiles.filter((file) => file.type.match("image.*"));
      if (files.length !== acceptedFiles.length) {
        toast.error("Solo se permiten archivos de imagen");
      }
      setRenderImages(files);
      setImagePreviews(files.map((file) => URL.createObjectURL(file)));
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    multiple: true,
  });

  const handleAddTime = () => {
    const { start_date, end_date, start_time, end_time, days } = timeInput;

    if (
      !start_date ||
      !end_date ||
      !start_time ||
      !end_time ||
      days.length === 0
    ) {
      toast.error("Completa todos los campos y selecciona al menos un día.");
      return;
    }

    if (end_date < start_date) {
      toast.error("La fecha fin no puede ser menor a la fecha inicio.");
      return;
    }

    if (end_time <= start_time) {
      toast.error("La hora fin debe ser mayor a la hora inicio.");
      return;
    }

    const isOverlap = availableTimes.some((t) => {
      const dateOverlap = !(end_date < t.start_date || start_date > t.end_date);
      const dayOverlap = t.days.some((d: string) => days.includes(d));
      return dateOverlap && dayOverlap;
    });

    if (isOverlap) {
      toast.error("Ya existe un rango con fechas y días similares.");
      return;
    }

    setAvailableTimes([...availableTimes, { ...timeInput }]);
    setTimeInput({
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      days: [],
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...renderImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setRenderImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleRemoveTime = (index: number) => {
    const newTimes = [...availableTimes];
    newTimes.splice(index, 1);
    setAvailableTimes(newTimes);
  };

  const handleClear = () => {
    setName("");
    setRenderImages([]);
    setImagePreviews([]);
    setAvailableTimes([]);
    setTimeInput({
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
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
    renderImages.forEach((file, i) =>
      formData.append(`render_images[${i}]`, file)
    );
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
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el espacio");
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
        <div className="text-center">
          <Spinner
            animation="border"
            variant="dark"
            style={{ width: "3rem", height: "3rem" }}
          />
          <div>
            {loading
              ? "Cargando espacio..."
              : isEdit
              ? "Actualizando espacio..."
              : "Creando espacio..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        {isEdit ? "Editar Espacio" : "Crear Nuevo Espacio"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="form-label">
            Nombre del espacio
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
            placeholder="Nombre del espacio"
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Imágenes 360° (Opcionales)</label>

          {imagePreviews.length > 0 ? (
            <div className="d-flex flex-wrap justify-content-center gap-4">
              {imagePreviews.map((src, i) => (
                <div key={i} className="d-flex flex-column align-items-center">
                  <img
                    src={src}
                    alt={`Vista previa ${i + 1}`}
                    className="img-fluid rounded border mb-2"
                    style={{
                      maxWidth: "220px",
                      maxHeight: "220px",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="btn btn-outline-danger btn-sm mt-2"
                  >
                    <FaTrash className="me-1" />
                    Eliminar imagen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border border-secondary-subtle rounded p-4 text-center cursor-pointer ${
                isDragActive ? "border-primary bg-light" : ""
              }`}
            >
              <input {...getInputProps()} />
              <div className="d-flex flex-column align-items-center justify-content-center">
                <FaUpload className="text-muted mb-2" />
                {isDragActive ? (
                  <p className="text-primary mb-0">
                    Suelta las imágenes aquí...
                  </p>
                ) : (
                  <>
                    <p className="mb-1">
                      Arrastra y suelta imágenes aquí, o haz clic para
                      seleccionar
                    </p>
                    <p className="text-muted small mb-0">
                      Formatos: JPEG, PNG, GIF (Opcionales)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

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
            <div className="col-md-3 mb-2">
              <label className="form-label">Hora inicio</label>
              <input
                type="time"
                value={timeInput.start_time}
                onChange={(e) =>
                  setTimeInput({ ...timeInput, start_time: e.target.value })
                }
                className="form-control"
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Hora fin</label>
              <input
                type="time"
                value={timeInput.end_time}
                onChange={(e) =>
                  setTimeInput({ ...timeInput, end_time: e.target.value })
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
                      const day = e.target.value;
                      setTimeInput((prev) => ({
                        ...prev,
                        days: checked
                          ? [...prev.days, day]
                          : prev.days.filter((d) => d !== day),
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
            <FaPlus className="me-2" />
            Agregar horario
          </button>
        </div>

        {availableTimes.length > 0 && (
          <div className="mb-4">
            <h6>Horarios agregados:</h6>
            <ul className="list-group">
              {availableTimes.map((t, i) => (
                <li
                  key={i}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    Del {t.start_date} al {t.end_date} de {t.start_time} a{" "}
                    {t.end_time} –{" "}
                    {t.days
                      .map(
                        (d: string) =>
                          diasSemana.find((x) => x.value === d)?.label
                      )
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
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn primary-btn">
            <FaSave className="me-2" />
            {isEdit ? "Actualizar espacio" : "Crear espacio"}
          </button>
          {!isEdit && (
            <button
              type="button"
              className="btn secondary-btn"
              onClick={handleClear}
            >
              <FaBroom className="me-2" />
              Limpiar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

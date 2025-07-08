import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaSave,
  FaTimes,
  FaPlus,
  FaBroom,
  FaUpload,
  FaTrash,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "../api/axios";
import { APPLARAVEL } from "~/constants/constant";
import { Spinner } from "react-bootstrap";
import { diasSemana } from "../constants/day";
import type { AvailableTime } from "../types/aula";
import * as exifr from "exifr";

type RenderImageInfo = {
  file: File | null;
  preview: string;
  is360: boolean;
};

export const CreateSpaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [renderImages, setRenderImages] = useState<RenderImageInfo[]>([]);
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

          const imageUrls = aula.imagenes.map((img: any) => ({
            file: null,
            preview: img.image_path.startsWith("http")
              ? img.image_path
              : `${APPLARAVEL + "/"}${img.image_path}`,
            is360: img.is360 ?? false,
          }));
          setRenderImages(imageUrls);

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

  const checkIf360ByAspect = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        resolve(Math.abs(aspect - 2) < 0.1);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const checkIf360ByExif = async (file: File): Promise<boolean> => {
    try {
      const exif = await exifr.parse(file);
      return (
        exif?.ProjectionType === "equirectangular" ||
        exif?.UsePanoramaViewer === true
      );
    } catch {
      return false;
    }
  };

  const handleDropImages = async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) =>
      file.type.match("image.*")
    );
    if (validFiles.length !== acceptedFiles.length) {
      toast.error("Solo se permiten archivos de imagen");
    }

    const results: RenderImageInfo[] = [];

    for (const file of validFiles) {
      const [isExif360, isAspect360] = await Promise.all([
        checkIf360ByExif(file),
        checkIf360ByAspect(file),
      ]);
      const is360 = isExif360 || isAspect360;

      console.log(
        `${file.name} -> EXIF: ${isExif360} | Aspect: ${isAspect360}`
      );

      results.push({
        file,
        preview: URL.createObjectURL(file),
        is360,
      });
    }

    setRenderImages(results);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDropImages,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    multiple: true,
  });

  const handleRemoveImage = (index: number) => {
    const newImages = [...renderImages];
    newImages.splice(index, 1);
    setRenderImages(newImages);
  };

  const handleAddTime = () => {
    const { start_date, end_date, start_time, end_time, days } = timeInput;

    toast.dismiss("add-time-error");

    if (
      !start_date ||
      !end_date ||
      !start_time ||
      !end_time ||
      days.length === 0
    ) {
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

    if (end_time <= start_time) {
      toast.error("La hora fin debe ser mayor a la hora inicio.", {
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
      start_time: "",
      end_time: "",
      days: [],
    });
  };

  const handleRemoveTime = (index: number) => {
    const toastId = `remove-time-${index}`;

    toast.dismiss(toastId);

    toast(
      (t) => (
        <div>
          <p>¿Desea eliminar este horario?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                const newTimes = [...availableTimes];
                newTimes.splice(index, 1);
                setAvailableTimes(newTimes);
                toast.dismiss(t.id);
                toast.success("Horario eliminado", {
                  id: `${toastId}-success`,
                  duration: 2000,
                });
              }}
            >
              Sí, eliminar
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        id: toastId,
      }
    );
  };

  const updateMessages = {
    question: "¿Seguro que deseas actualizar este espacio?",
    confirmText: "Sí, actualizar",
    cancelText: "Cancelar",
    success: "Espacio actualizado correctamente",
    error: "Error actualizando el espacio",
  };

  const handleClear = () => {
    setName("");
    setRenderImages([]);
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
    const errorToastId = "submit-error";
    const confirmToastId = "edit-confirm-toast";

    toast.dismiss(errorToastId);
    toast.dismiss(confirmToastId);

    if (!name.trim()) {
      toast.error("El nombre del espacio es obligatorio", {
        id: errorToastId,
      });
      return;
    }

    if (availableTimes.length === 0) {
      toast.error("Debes agregar al menos un horario disponible", {
        id: errorToastId,
      });
      return;
    }

    if (isEdit) {
      const confirmed = await new Promise<boolean>((resolve) => {
        toast(
          (t) => (
            <div>
              <p>{updateMessages.question}</p>
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                >
                  {updateMessages.confirmText}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                >
                  {updateMessages.cancelText}
                </button>
              </div>
            </div>
          ),
          {
            id: confirmToastId,
            duration: 8000,
          }
        );
      });

      if (!confirmed) return;
    }

    const formData = new FormData();
    formData.append("name", name);

    // 🚫 NO uses index fijo del forEach: solo indexa reales
    let fileIndex = 0;

    renderImages.forEach((img) => {
      if (img.file) {
        formData.append(`render_images[${fileIndex}]`, img.file);
        formData.append(
          `render_images_is360[${fileIndex}]`,
          img.is360 ? "1" : "0"
        );
        fileIndex++;
      }
    });

    formData.append("available_times", JSON.stringify(availableTimes));
    setLoadingSubmit(true);

    try {
      const endpoint = isEdit ? `/aulas/${id}/update` : "/aulas";
      await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        isEdit ? updateMessages.success : "Espacio creado correctamente"
      );
      if (!isEdit) handleClear();
      navigate("/rooms");
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? updateMessages.error : "Error creando el espacio", {
        id: errorToastId,
      });
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
            variant="primary"
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
    <div className="form-container position-relative">
      <FaLongArrowAltLeft
        onClick={handleBack}
        title="Regresar"
        style={{
          position: "absolute",
          top: "25px",
          left: "30px",
          cursor: "pointer",
          fontSize: "2rem",
          zIndex: 10,
        }}
      />
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
          <label className="form-label">Imágenes 360°</label>

          {renderImages.length > 0 ? (
            <div className="d-flex flex-wrap justify-content-center gap-4">
              {renderImages.map((img, i) => (
                <div key={i} className="d-flex flex-column align-items-center">
                  <img
                    src={img.preview}
                    alt={`Vista previa ${i + 1}`}
                    className="img-fluid rounded border mb-2"
                    style={{
                      maxWidth: "220px",
                      maxHeight: "220px",
                      objectFit: "cover",
                    }}
                  />
                  <small className="text-muted mb-1">
                    {img.is360
                      ? "✅ Imagen 360° detectada"
                      : "❌ Imagen NO 360°"}
                  </small>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="btn btn-outline-danger btn-sm"
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
                      Formatos: JPEG, PNG, GIF
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
                className="form-control timeForm"
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
                className="form-control timeForm"
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
                          : prev.days.filter((x) => x !== day),
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

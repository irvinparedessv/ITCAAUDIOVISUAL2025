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
import api from "../api/axios";
import { APPLARAVEL } from "~/constants/constant";
import { Spinner } from "react-bootstrap";
import { diasSemana } from "../constants/day";
import type { AvailableTime } from "../types/aula";
import * as exifr from "exifr";
import EspacioNoEncontrado from "./error/EspacioNoEncontrado";

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
    if (renderImages.length >= 5) {
      toast.error("Solo puedes subir hasta 5 imágenes.");
      return;
    }

    const remainingSlots = 5 - renderImages.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const validFiles = filesToAdd.filter((file) => file.type.match("image.*"));
    if (validFiles.length !== filesToAdd.length) {
      toast.error("Solo se permiten archivos de imagen.");
    }

    const results: RenderImageInfo[] = [];

    for (const file of validFiles) {
      const [isExif360, isAspect360] = await Promise.all([
        checkIf360ByExif(file),
        checkIf360ByAspect(file),
      ]);
      const is360 = isExif360 || isAspect360;

      results.push({
        file,
        preview: URL.createObjectURL(file),
        is360,
      });
    }

    setRenderImages((prev) => [...prev, ...results]);
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

    renderImages.forEach((img, index) => {
      if (img.file) {
        formData.append(`render_images[${index}]`, img.file);
        formData.append(`render_images_is360[${index}]`, img.is360 ? "1" : "0");
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
        isEdit
          ? "Espacio actualizado correctamente"
          : "Espacio creado correctamente"
      );
      if (!isEdit) handleClear();
      navigate("/rooms");
    } catch (err) {
      console.error(err);
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
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Imágenes 360° (máx. 5)</label>

          <div
            {...getRootProps()}
            className={`border border-secondary-subtle rounded p-4 text-center cursor-pointer ${
              isDragActive ? "border-primary bg-light" : ""
            }`}
          >
            <input {...getInputProps()} />
            <FaUpload className="text-muted mb-2" />
            <p>Arrastra y suelta imágenes aquí, o haz clic para seleccionar</p>
            <p className="text-muted small mb-0">Formatos: JPEG, PNG, GIF</p>
          </div>

          {renderImages.length > 0 && (
            <div className="d-flex flex-wrap justify-content-center gap-4 mt-3">
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
                    {img.is360 ? "✅ 360° detectada" : "❌ No 360°"}
                  </small>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="btn btn-outline-danger btn-sm"
                  >
                    <FaTrash className="me-1" /> Eliminar
                  </button>
                </div>
              ))}
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
                  Del {t.start_date} al {t.end_date}–{" "}
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

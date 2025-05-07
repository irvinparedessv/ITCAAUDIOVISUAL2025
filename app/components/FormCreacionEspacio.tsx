import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import api from "../api/axios";

const diasSemana = [
  { value: "Monday", label: "Lunes" },
  { value: "Tuesday", label: "Martes" },
  { value: "Wednesday", label: "Miércoles" },
  { value: "Thursday", label: "Jueves" },
  { value: "Friday", label: "Viernes" },
  { value: "Saturday", label: "Sábado" },
  { value: "Sunday", label: "Domingo" },
];

export const CreateSpaceForm = () => {
  const [name, setName] = useState("");
  const [renderImages, setRenderImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<any[]>([]);
  const [timeInput, setTimeInput] = useState({
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    days: [] as string[],
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
      alert("Completa todos los campos y selecciona al menos un día.");
      return;
    }

    if (end_date < start_date) {
      alert("La fecha fin no puede ser menor a la fecha inicio.");
      return;
    }

    if (end_time <= start_time) {
      alert("La hora fin debe ser mayor a la hora inicio.");
      return;
    }

    const isOverlap = availableTimes.some((t) => {
      const dateOverlap = !(end_date < t.start_date || start_date > t.end_date);
      const dayOverlap = t.days.some((d: string) => days.includes(d));
      return dateOverlap && dayOverlap;
    });

    if (isOverlap) {
      alert("Ya existe un rango con fechas y días similares.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    renderImages.forEach((file, i) =>
      formData.append(`render_images[${i}]`, file)
    );
    formData.append("available_times", JSON.stringify(availableTimes));

    try {
      await api.post("/aulas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Espacio creado correctamente");
      setName("");
      setRenderImages([]);
      setImagePreviews([]);
      setAvailableTimes([]);
    } catch (err) {
      console.error(err);
      alert("Error al crear el espacio");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formName">
        <Form.Label>Nombre del espacio</Form.Label>
        <Form.Control
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group controlId="formImages" className="mt-3">
        <Form.Label>Imágenes 360°</Form.Label>
        <Form.Control
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const input = e.target as HTMLInputElement;
            const files = Array.from(input.files || []) as File[];
            setRenderImages(files);
            const previews = files.map((file) => URL.createObjectURL(file));
            setImagePreviews(previews);
          }}
        />
      </Form.Group>

      {imagePreviews.length > 0 && (
        <div className="mt-3 d-flex flex-wrap gap-3">
          {imagePreviews.map((src, i) => (
            <div key={i} className="text-center">
              <img
                src={src}
                alt={`Vista previa ${i + 1}`}
                style={{
                  width: "150px",
                  height: "auto",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveImage(i)}
                className="mt-1"
              >
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      )}

      <h5 className="mt-4">Agregar horario disponible</h5>
      <Row className="mb-2">
        <Col md={3}>
          <Form.Label>Fecha de inicio</Form.Label>
          <Form.Control
            type="date"
            value={timeInput.start_date}
            onChange={(e) =>
              setTimeInput({ ...timeInput, start_date: e.target.value })
            }
          />
        </Col>
        <Col md={3}>
          <Form.Label>Fecha de fin</Form.Label>
          <Form.Control
            type="date"
            value={timeInput.end_date}
            onChange={(e) =>
              setTimeInput({ ...timeInput, end_date: e.target.value })
            }
          />
        </Col>
        <Col md={3}>
          <Form.Label>Hora inicio</Form.Label>
          <Form.Control
            type="time"
            value={timeInput.start_time}
            onChange={(e) =>
              setTimeInput({ ...timeInput, start_time: e.target.value })
            }
          />
        </Col>
        <Col md={3}>
          <Form.Label>Hora fin</Form.Label>
          <Form.Control
            type="time"
            value={timeInput.end_time}
            onChange={(e) =>
              setTimeInput({ ...timeInput, end_time: e.target.value })
            }
          />
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Días de la semana</Form.Label>
        <div className="d-flex flex-wrap">
          {diasSemana.map((d) => (
            <Form.Check
              key={d.value}
              type="checkbox"
              label={d.label}
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
              className="me-3"
            />
          ))}
        </div>
      </Form.Group>

      <Button variant="secondary" onClick={handleAddTime}>
        Agregar horario
      </Button>

      <ul className="mt-3">
        {availableTimes.map((t, i) => (
          <li key={i}>
            Del {t.start_date} al {t.end_date} de {t.start_time} a {t.end_time}{" "}
            –{" "}
            {t.days
              .map((d: string) => diasSemana.find((x) => x.value === d)?.label)
              .join(", ")}
          </li>
        ))}
      </ul>

      <Button variant="primary" type="submit" className="mt-4">
        Crear espacio
      </Button>
    </Form>
  );
};

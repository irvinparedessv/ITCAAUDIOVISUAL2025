import { useState } from "react";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import { IconBase } from "react-icons";
import { FaImage } from "react-icons/fa";

export default function CreateClassroomForm() {
  const [formData, setFormData] = useState({
    name: "",
    day: "",
    availableHours: {
      startTime: "",
      endTime: "",
    },
    images: [] as File[],
  });

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData((prev) => ({
        ...prev,
        images: Array.from(files), // Convertir FileList a File[]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica para enviar los datos al backend
    alert("Formulario enviado: " + JSON.stringify(formData, null, 2));
  };

  return (
    <Container className="my-5">
      <h3 className="text-center mb-4">Crear Espacio de Aula</h3>
      <Card className="shadow-lg">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Nombre del Aula */}
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Nombre del Aula</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el nombre del aula"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            {/* Día */}
            <Form.Group className="mb-3" controlId="formDay">
              <Form.Label>Día</Form.Label>
              <Button>+</Button>
              <Form.Control
                type="text"
                placeholder="Ejemplo: Lunes, Martes, etc."
                name="day"
                value={formData.day}
                onChange={handleChange}
                required
              />
            </Form.Group>

            {/* Horarios Disponibles */}
            <Row>
              <Col sm={6}>
                <Form.Group className="mb-3" controlId="formStartTime">
                  <Form.Label>Hora de Inicio</Form.Label>
                  <Form.Control
                    type="time"
                    name="availableHours.startTime"
                    value={formData.availableHours.startTime}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group className="mb-3" controlId="formEndTime">
                  <Form.Label>Hora de Fin</Form.Label>
                  <Form.Control
                    type="time"
                    name="availableHours.endTime"
                    value={formData.availableHours.endTime}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Subida de Imágenes */}
            <Form.Group className="mb-3" controlId="formImages">
              <Form.Label className="d-flex align-items-center">
                <FaImage className="me-2" />
                Subir Imágenes del Aula
              </Form.Label>
              <Form.Control
                type="file"
                name="images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
              />
              {formData.images.length > 0 && (
                <div className="mt-3">
                  <strong>Imágenes seleccionadas:</strong>
                  <ul>
                    {formData.images.map((image, index) => (
                      <li key={index}>{image.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>

            {/* Botón de Enviar */}
            <Button variant="primary" type="submit" className="w-100">
              Crear Aula
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

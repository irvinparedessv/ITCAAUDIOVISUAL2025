import { useState } from "react";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";

export default function CreateEquipmentForm() {
  const equipmentCategories = [
    { value: "Cámara", label: "Cámara" },
    { value: "Proyector", label: "Proyector" },
    { value: "Micrófono", label: "Micrófono" },
    { value: "Luces", label: "Luces" },
    { value: "Trípode", label: "Trípode" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    quantity: 1,
  });

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí enviarías los datos a tu API backend
    console.log("Equipo creado:", formData);
    alert("Equipo creado con éxito");
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">Crear Nuevo Equipo Audiovisual</h4>
            </Card.Header>

            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Nombre del equipo */}
                <Form.Group className="mb-3" controlId="formName">
                  <Form.Label>Nombre del Equipo</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nombre del equipo"
                    required
                  />
                </Form.Group>

                {/* Categoría del equipo */}
                <Form.Group className="mb-3" controlId="formCategory">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Control
                    as="select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {equipmentCategories.map((category, index) => (
                      <option key={index} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>

                {/* Descripción del equipo */}
                <Form.Group className="mb-3" controlId="formDescription">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descripción del equipo"
                    required
                  />
                </Form.Group>

                {/* Cantidad de equipo */}
                <Form.Group className="mb-3" controlId="formQuantity">
                  <Form.Label>Cantidad</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </Form.Group>

                {/* Botón de enviar */}
                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    Crear Equipo
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

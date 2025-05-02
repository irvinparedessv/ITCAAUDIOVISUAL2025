import { useState } from "react";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import { createUsuario } from "~/services/userService";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function FormUsuario() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_id: "",
    phone: "",
    address: "",
    image: null as File | null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  const validateForm = (): string | null => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    const phoneRegex = /^[0-9]{8}$/;
    const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    const maxImageSize = 2 * 1024 * 1024; // 2MB

    if (!nameRegex.test(formData.first_name)) {
      return "El primer nombre debe contener al menos 2 letras y solo puede tener letras y espacios.";
    }

    if (!nameRegex.test(formData.last_name)) {
      return "El apellido debe contener al menos 2 letras y solo puede tener letras y espacios.";
    }

    if (!emailRegex.test(formData.email)) {
      return "Ingrese un correo electrónico válido.";
    }

    if (!passwordRegex.test(formData.password)) {
      return "La contraseña debe tener al menos 6 caracteres e incluir al menos una letra y un número.";
    }

    if (!formData.role_id) {
      return "Seleccione un rol.";
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      return "El teléfono debe contener exactamente 8 dígitos numéricos.";
    }

    if (formData.address && formData.address.length < 5) {
      return "La dirección debe tener al menos 5 caracteres si se proporciona.";
    }

    if (formData.image) {
      if (!imageTypes.includes(formData.image.type)) {
        return "La imagen debe ser de tipo JPG, JPEG, PNG o GIF.";
      }
      if (formData.image.size > maxImageSize) {
        return "La imagen no debe exceder los 2MB.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formError = validateForm();
    if (formError) {
      toast.error(formError);
      return;
    }

    setIsLoading(true);

    const formDataWithRoleIdAsNumber = {
      ...formData,
      role_id: Number(formData.role_id),
    };

    try {
      const formDataWithImage = new FormData();
      Object.entries(formDataWithRoleIdAsNumber).forEach(([key, value]) => {
        if (key !== "image" && value !== null) {
          formDataWithImage.append(key, value.toString());
        }
      });
      if (formData.image) {
        formDataWithImage.append("image", formData.image);
      }

      await createUsuario(formDataWithImage);
      toast.success("Usuario creado con éxito");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role_id: "",
        phone: "",
        address: "",
        image: null,
      });
    } catch (error) {
      toast.error("Hubo un error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 1, name: "Administrador" },
    { id: 2, name: "Encargado" },
    { id: 3, name: "Prestamista" },
  ];

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">Crear Nuevo Usuario</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Primer Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Primer nombre"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Apellido"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Correo electrónico"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Contraseña"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Teléfono (Opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Teléfono"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección (Opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Dirección"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Imagen (Opcional)</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? "Procesando..." : "Crear Usuario"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ToastContainer />
    </Container>
  );
}

import { useState, useRef } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  Image,
} from "react-bootstrap";
import { createUsuario } from "~/services/userService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function FormUsuario() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@itca\.edu\.sv$/; //Permitir correo institucional (JOSUE)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  const phoneRegex = /^[0-9]{4}-[0-9]{4}$/;
  const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const maxImageSize = 2 * 1024 * 1024;

  const validateField = (name: string, value: any): string => {
    if (
      ["first_name", "last_name", "email", "password", "role_id"].includes(
        name
      ) &&
      (!value || value.trim() === "")
    ) {
      return "Este campo es obligatorio";
    }
    switch (name) {
      case "first_name":
      case "last_name":
        if (!nameRegex.test(value))
          return "Debe tener al menos 2 letras y solo letras/espacios.";
        break;
      case "email":
        if (!emailRegex.test(value))
          //JOSUE
          return "Solo se permiten correos institucionales (@itca.edu.sv).";
        break;
      case "role_id":
        if (!value) return "Debe seleccionar un rol.";
        break;
      case "phone":
        if (value && !phoneRegex.test(value))
          return "Debe tener el formato 0000-0000.";
        break;
      case "address":
        if (value && value.length < 5)
          return "Debe tener al menos 5 caracteres.";
        break;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 4) {
        newValue = digitsOnly;
      } else {
        newValue = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}`;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, image: file }));

    if (file) {
      if (!imageTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          image: "Tipo de imagen no permitido.",
        }));
        return;
      }
      if (file.size > maxImageSize) {
        setFormErrors((prev) => ({
          ...prev,
          image: "La imagen no debe exceder los 2MB.",
        }));
        return;
      }

      setFormErrors((prev) => ({ ...prev, image: "" }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const isFormValid = (): boolean => {
    const errors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image") return;
      const error = validateField(key, value);
      if (error) errors[key] = error;
    });

    if (formData.image) {
      if (!imageTypes.includes(formData.image.type)) {
        errors.image = "La imagen debe ser de tipo JPG, JPEG, PNG o GIF.";
      } else if (formData.image.size > maxImageSize) {
        errors.image = "La imagen no debe exceder los 2MB.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Revisa los campos antes de enviar.");
      return;
    }

    toast.info("Creando usuario...", {
      autoClose: 2000,
      hideProgressBar: false,
    });

    setIsLoading(true);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        if (key === "role_id")
          formDataToSend.append(key, Number(value).toString());
        else if (key !== "image") formDataToSend.append(key, value.toString());
      }
    });
    if (formData.image) formDataToSend.append("image", formData.image);

    // ✅ JOSUE (ESTADO DE USUARIO AL SER CREADO 3-PENDIENTE)
    formDataToSend.append("estado", "3");

    try {
      await createUsuario(formDataToSend);
      toast.success("Usuario creado con éxito", {
        autoClose: 3000,
        hideProgressBar: false,
      });

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
      setFormErrors({});
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => navigate("/usuarios"), 3200);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      toast.error("Error al crear usuario", {
        autoClose: 2500,
        hideProgressBar: false,
      });
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
              <Form onSubmit={handleSubmit} encType="multipart/form-data">
                {[
                  { label: "Nombres", name: "first_name", type: "text" },
                  { label: "Apellidos", name: "last_name", type: "text" },
                  { label: "Email", name: "email", type: "email" },
                  { label: "Contraseña", name: "password", type: "password" },
                  { label: "Teléfono (Opcional)", name: "phone", type: "text" },
                  {
                    label: "Dirección (Opcional)",
                    name: "address",
                    type: "text",
                  },
                ].map(({ label, name, type }) => (
                  <Form.Group className="mb-3" key={name}>
                    <Form.Label>{label}</Form.Label>
                    <Form.Control
                      type={type}
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={label}
                      isInvalid={!!formErrors[name]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors[name]}
                    </Form.Control.Feedback>
                  </Form.Group>
                ))}

                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={!!formErrors.role_id}
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.role_id}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Imagen (Opcional)</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    ref={fileInputRef}
                    isInvalid={!!formErrors.image}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.image}
                  </Form.Control.Feedback>
                  {previewImage && (
                    <div className="mt-3 text-center">
                      <Image
                        src={previewImage}
                        alt="Vista previa"
                        fluid
                        rounded
                        thumbnail
                        style={{ maxHeight: "200px" }}
                      />
                    </div>
                  )}
                </Form.Group>

                <div className="d-grid mb-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/usuarios")}
                  >
                    Cancelar
                  </Button>
                </div>

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

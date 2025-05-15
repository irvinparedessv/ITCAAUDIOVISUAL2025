import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUsuarioById, updateUsuario } from "~/services/userService";
import type { UserUpdateDTO } from "~/types/user";

const rolesMap: Record<number, string> = {
  1: "Administrador",
  2: "Encargado",
  3: "Prestamista",
};

const estadosMap: Record<number, string> = {
  1: "Activo",
  0: "Inactivo",
  3: "Pendiente",
};

const EditUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<UserUpdateDTO>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    role_id: 1,
    estado: 1,
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const phoneRegex = /^\d{4}-\d{4}$/;

  useEffect(() => {
    if (id) {
      getUsuarioById(id)
        .then((data) => {
          setFormData(data);
        })
        .catch((error) => console.error("Error al obtener usuario:", error))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "Nombres es requerido.";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.first_name))
      newErrors.first_name = "Solo se permiten letras.";

    if (!formData.last_name.trim())
      newErrors.last_name = "Apellidos es requerido.";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.last_name))
      newErrors.last_name = "Solo se permiten letras.";

    if (!formData.email.trim()) newErrors.email = "Correo es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Formato de correo inválido.";

    if (formData.phone && !phoneRegex.test(formData.phone))
      newErrors.phone = "Debe tener el formato 0000-0000.";

    if (formData.address && formData.address.length < 5)
      newErrors.address = "Debe tener al menos 5 caracteres.";

    if (!formData.role_id) newErrors.role_id = "Rol es requerido.";
    if (formData.estado === undefined) newErrors.estado = "Estado es requerido.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 8);
      if (digitsOnly.length > 4) {
        newValue = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
      } else {
        newValue = digitsOnly;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "role_id" || name === "estado" ? parseInt(newValue) : newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Aquí se elimina el uso de SweetAlert y se usa solo Toastify
    toast.info("Se actualizará la información del usuario", {
      autoClose: 2500,
      hideProgressBar: false,
    });

    const confirmUpdate = window.confirm("¿Guardar cambios?");

    if (confirmUpdate) {
      if (!id) return;

      const numericId = Number(id);
      if (isNaN(numericId)) {
        console.error("ID no válido");
        return;
      }

      const dataToSend: UserUpdateDTO = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.address || "",
        role_id: formData.role_id,
        estado: formData.estado,
        ...(formData.password && { password: formData.password }),
      };

      try {
        await updateUsuario(numericId, dataToSend);
        toast.success("Usuario actualizado correctamente", {
          autoClose: 2500,
          hideProgressBar: false,
        });
        setTimeout(() => navigate("/usuarios"), 3000);
      } catch (error) {
        console.error("Error al actualizar usuario:", error);
        toast.error("Error al actualizar usuario", {
          autoClose: 2500,
          hideProgressBar: false,
        });
      }
    } else {
      toast.info("Acción cancelada por el usuario", {
        autoClose: 2000,
        hideProgressBar: false,
      });
    }
  };

  const handleCancel = () => {
    toast.info("Acción cancelada por el usuario", {
      autoClose: 2000,
    });
    setTimeout(() => navigate("/usuarios"), 2200);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Editar Usuario</h2>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3">
            <Form.Label>Nombres</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              isInvalid={!!errors.first_name}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Apellidos</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              isInvalid={!!errors.last_name}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Contraseña (opcional)</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder="Deja en blanco para no cambiarla"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              isInvalid={!!errors.phone}
              placeholder="0000-0000"
            />
            <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              isInvalid={!!errors.address}
            />
            <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              isInvalid={!!errors.role_id}
            >
              {Object.entries(rolesMap).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.role_id}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              isInvalid={!!errors.estado}
            >
              {Object.entries(estadosMap).map(([key, label]) => (
                <option key={key} value={Number(key)}>
                  {label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.estado}</Form.Control.Feedback>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </div>
        </Form>
      )}
      <ToastContainer />
    </div>
  );
};

export default EditUsuario;

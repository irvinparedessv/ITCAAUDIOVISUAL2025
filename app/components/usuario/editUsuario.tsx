import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getUsuarioById, updateUsuario } from "../../services/userService";
import type { UserUpdateDTO } from "app/types/user";
import {
  FaSave,
  FaTimes,
  FaUserEdit,
  FaTrash,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import UsuarioNoEncontrado from "../error/UsuarioNoEncontrado";

const rolesMap = [
  { id: 1, nombre: "Administrador" },
  { id: 2, nombre: "Encargado" },
  { id: 3, nombre: "Prestamista" },
  { id: 4, nombre: "Encargado Espacio" },
];

const estadosMap = [
  { id: 1, nombre: "Activo" },
  { id: 0, nombre: "Inactivo" },
  { id: 3, nombre: "Pendiente" },
];

const EditUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<UserUpdateDTO>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    role_id: 1,
    estado: 1,
  });

  useEffect(() => {
    toast.dismiss();
    if (id) {
      getUsuarioById(id)
        .then((data) => {
          setFormData({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            role_id: data.role_id,
            estado: data.estado,
          });
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error al obtener usuario:", error);
          if (error?.response?.status === 404) {
            setNotFound(true);
          } else {
            toast.error("Error al cargar usuario");
          }
          setLoading(false);
        });
    }
  }, [id]);

  const validateForm = (): boolean => {
    let isValid = true;
    let firstError: string | null = null;

    // Validación de nombres
    if (!formData.first_name.trim()) {
      firstError = "El nombre es obligatorio";
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.first_name)) {
      firstError = "El nombre solo puede contener letras";
      isValid = false;
    }

    // Validación de apellidos
    else if (!formData.last_name.trim()) {
      firstError = "El apellido es obligatorio";
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.last_name)) {
      firstError = "El apellido solo puede contener letras";
      isValid = false;
    }

    // Validación de email (cualquier correo)
    else if (!formData.email.trim()) {
      firstError = "El correo electrónico es obligatorio";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      firstError = "Debe ingresar un correo electrónico válido";
      isValid = false;
    }

    // Validación de teléfono
    else if (formData.phone && !/^\d{4}-\d{4}$/.test(formData.phone)) {
      firstError = "El teléfono debe tener el formato 0000-0000";
      isValid = false;
    }

    // Validación de dirección
    else if (formData.address && formData.address.length < 5) {
      firstError = "La dirección debe tener al menos 5 caracteres";
      isValid = false;
    }

    if (!isValid && firstError) {
      toast.dismiss("form-validation-toast");
      toast.error(firstError, {
        id: "form-validation-toast",
      });
    }

    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Formateo especial para teléfono
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
      [name]:
        name === "role_id" || name === "estado" ? Number(newValue) : newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!id) return;

    // Evita que se abra más de un toast de confirmación de actualización
    toast.dismiss(`update-toast-${id}`);

    toast(
      (t) => (
        <div className="text-center">
          <p>¿Seguro que deseas actualizar este usuario?</p>
          <div className="d-flex justify-content-center gap-3 mt-3">
            <button
              className="btn btn-sm btn-success"
              onClick={async () => {
                await submitUpdate();
                toast.dismiss(t.id);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : null}
              Sí, actualizar
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        id: `update-toast-${id}`,
      }
    );
  };

  const submitUpdate = async () => {
    setIsSubmitting(true); // Comienza el envío
    try {
      await updateUsuario(Number(id), formData);
      toast.success("Usuario actualizado correctamente");
      // No reiniciamos isSubmitting aquí, lo haremos después de la navegación

      navigate("/usuarios");
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast.error("Error al actualizar usuario");
      setIsSubmitting(false); // Solo reiniciamos si hay error
    }
  };

  const handleBack = () => {
    if (!isSubmitting) {
      // Solo permite retroceder si no se está enviando
      navigate("/usuarios");
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      // Solo permite cancelar si no se está enviando
      navigate("/usuarios");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <UsuarioNoEncontrado />;
  }

  return (
    <div className="form-container position-relative">
      <div
        className="d-flex align-items-center gap-2 gap-md-3"
        style={{ marginBottom: "30px" }}
      >
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: "pointer",
            fontSize: "2rem",
          }}
        />
        <h2 className="fw-bold m-0">
          <FaUserEdit className="me-2" />
          Editar Usuario
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="first_name" className="form-label">
              Nombres
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className="form-control"
              value={formData.first_name}
              onChange={handleChange}
              disabled={isSubmitting} // Deshabilitar si se está enviando
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="last_name" className="form-label">
              Apellidos
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="form-control"
              value={formData.last_name}
              onChange={handleChange}
              disabled={isSubmitting} // Deshabilitar si se está enviando
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="form-label">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            disabled
          />
          <small className="text-muted">
            El correo institucional no puede modificarse
          </small>
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="phone" className="form-label">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              className="form-control"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="0000-0000"
              disabled={isSubmitting} // Deshabilitar si se está enviando
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="role_id" className="form-label">
              Rol
            </label>
            <select
              id="role_id"
              name="role_id"
              className="form-select"
              value={formData.role_id}
              onChange={handleChange}
              required
              disabled={isSubmitting} // Deshabilitar si se está enviando
            >
              {rolesMap.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="form-label">
            Dirección
          </label>
          <textarea
            id="address"
            name="address"
            className="form-control"
            rows={3}
            value={formData.address || ""}
            onChange={handleChange}
            disabled={isSubmitting} // Deshabilitar si se está enviando
          />
        </div>

        <div className="mb-4">
          <label htmlFor="estado" className="form-label">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            className="form-select"
            value={formData.estado}
            onChange={handleChange}
            required
            disabled={isSubmitting} // Deshabilitar si se está enviando
          >
            {estadosMap.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Guardando...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar Cambios
              </>
            )}
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUsuario;

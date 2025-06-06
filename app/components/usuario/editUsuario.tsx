import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getUsuarioById, updateUsuario } from "~/services/userService";
import type { UserUpdateDTO } from "~/types/user";
import { FaSave, FaTimes, FaUserEdit, FaTrash } from "react-icons/fa";

const rolesMap = [
  { id: 1, nombre: "Administrador" },
  { id: 2, nombre: "Encargado" },
  { id: 3, nombre: "Prestamista" },
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
    if (id) {
      getUsuarioById(id)
        .then((data) => {
          setFormData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error al obtener usuario:", error);
          toast.error("Error al cargar usuario");
          setLoading(false);
        });
    }
  }, [id]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validación de nombres
    if (!formData.first_name.trim()) {
      toast.error("El nombre es obligatorio");
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.first_name)) {
      toast.error("El nombre solo puede contener letras");
      isValid = false;
    }

    // Validación de apellidos
    if (!formData.last_name.trim()) {
      toast.error("El apellido es obligatorio");
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.last_name)) {
      toast.error("El apellido solo puede contener letras");
      isValid = false;
    }

    // Validación de email (correo institucional)
    if (!formData.email.trim()) {
      toast.error("El correo electrónico es obligatorio");
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)?(edu\.sv|esdu\.edu\.sv)$/.test(formData.email)) {
      toast.error("Debe ingresar un correo institucional válido (terminado en .edu.sv o esdu.edu.sv)");
      isValid = false;
    }

    // Validación de teléfono
    if (formData.phone && !/^\d{4}-\d{4}$/.test(formData.phone)) {
      toast.error("El teléfono debe tener el formato 0000-0000");
      isValid = false;
    }

    // Validación de dirección
    if (formData.address && formData.address.length < 5) {
      toast.error("La dirección debe tener al menos 5 caracteres");
      isValid = false;
    }

    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      [name]: name === "role_id" || name === "estado" ? Number(newValue) : newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!id) return;

    toast((t) => (
      <div className="text-center">
        <p>¿Confirmas que deseas actualizar este usuario?</p>
        <div className="d-flex justify-content-center gap-3 mt-3">
          <button 
            className="btn btn-sm btn-success"
            onClick={() => {
              submitUpdate();
              toast.dismiss(t.id);
            }}
          >
            Sí, actualizar
          </button>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  const submitUpdate = async () => {
    try {
      await updateUsuario(Number(id), formData);
      toast.success("Usuario actualizado correctamente");
      setTimeout(() => navigate("/usuarios"), 1500);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const handleCancel = () => {
    navigate("/usuarios");
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

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        <FaUserEdit className="me-2" />
        Editar Usuario
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="first_name" className="form-label">Nombres</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className="form-control"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="last_name" className="form-label">Apellidos</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="form-control"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="form-label">Correo Electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <small className="text-muted">El correo institucional no puede modificarse</small>
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="phone" className="form-label">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="text"
              className="form-control"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="0000-0000"
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="role_id" className="form-label">Rol</label>
            <select
              id="role_id"
              name="role_id"
              className="form-select"
              value={formData.role_id}
              onChange={handleChange}
              required
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
          <label htmlFor="address" className="form-label">Dirección</label>
          <textarea
            id="address"
            name="address"
            className="form-control"
            rows={3}
            value={formData.address || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="estado" className="form-label">Estado</label>
          <select
            id="estado"
            name="estado"
            className="form-select"
            value={formData.estado}
            onChange={handleChange}
            required
          >
            {estadosMap.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary-btn">
            <FaSave className="me-2" />
            Guardar Cambios
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleCancel}
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
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { createUsuario } from "~/services/userService";
import { useNavigate } from "react-router-dom";
import {
  FaSave,
  FaTimes,
  FaPlus,
  FaBroom,
  FaUpload,
  FaTrash,
} from "react-icons/fa";

export default function FormUsuario() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_id: "",
    phone: "",
    address: "",
    image: null as File | null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation regex patterns
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@itca\.edu\.sv$/; //Permitir correo institucional (JOSUE)
  const phoneRegex = /^[0-9]{4}-[0-9]{4}$/;
  const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const maxImageSize = 2 * 1024 * 1024;

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!imageTypes.includes(file.type)) {
        toast.error(
          "Solo se permiten archivos de imagen (JPEG, PNG, JPG, GIF)"
        );
        return;
      }

      if (file.size > maxImageSize) {
        toast.error("La imagen no puede ser mayor a 2MB");
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setFormErrors((prev) => ({ ...prev, image: "" }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const validateField = (name: string, value: any): string => {
    if (
      ["first_name", "last_name", "email", "role_id"].includes(
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
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isFormValid = (): boolean => {
    const errors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image") return;
      const error = validateField(key, value);
      if (error) errors[key] = error;
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Por favor corrija los errores antes de enviar");
      return;
    }

    toast.success("Creando usuario...", {
     
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
    formDataToSend.append("estado", "0");

    try {
      await createUsuario(formDataToSend);
      toast.success("Usuario creado con éxito");
      handleClear();
      navigate("/usuarios");
    } catch (error) {
      toast.error("Error al crear el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      role_id: "",
      phone: "",
      address: "",
      image: null,
    });
    setFormErrors({});
    setImagePreview(null);
  };

  const roles = [
    { id: 1, name: "Administrador" },
    { id: 2, name: "Encargado" },
    { id: 3, name: "Prestamista" },
  ];

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Crear Nuevo Usuario</h2>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="first_name" className="form-label">
              Nombres
            </label>
            <input
              id="first_name"
              name="first_name"
              placeholder="Nombres del usuario"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-control ${
                formErrors.first_name ? "is-invalid" : ""
              }`}
            />
            {formErrors.first_name && (
              <div className="invalid-feedback">{formErrors.first_name}</div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="last_name" className="form-label">
              Apellidos
            </label>
            <input
              id="last_name"
              name="last_name"
              placeholder="Apellidos del usuario"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-control ${
                formErrors.last_name ? "is-invalid" : ""
              }`}
            />
            {formErrors.last_name && (
              <div className="invalid-feedback">{formErrors.last_name}</div>
            )}
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
            />
            {formErrors.email && (
              <div className="invalid-feedback">{formErrors.email}</div>
            )}
          </div>

          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="phone" className="form-label">
              Teléfono (Opcional)
            </label>
            <input
              id="phone"
              name="phone"
              placeholder="0000-0000"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
            />
            {formErrors.phone && (
              <div className="invalid-feedback">{formErrors.phone}</div>
            )}
          </div>
        </div>

        <div className="mb-4">
            <label htmlFor="address" className="form-label">
              Dirección (Opcional)
            </label>
            <textarea
              id="address"
              name="address"
              placeholder="Dirección"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-control ${
                formErrors.address ? "is-invalid" : ""
              }`}
            />
            {formErrors.address && (
              <div className="invalid-feedback">{formErrors.address}</div>
            )}
        </div>


        

        <div className="mb-4">
          <label htmlFor="role_id" className="form-label">
            Rol
          </label>
          <select
            id="role_id"
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-select ${formErrors.role_id ? "is-invalid" : ""}`}
          >
            <option value="">Seleccione un rol</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {formErrors.role_id && (
            <div className="invalid-feedback">{formErrors.role_id}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="form-label">Imagen (Opcional)</label>

          {imagePreview ? (
            <div className="d-flex flex-column align-items-center">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="img-fluid rounded border mb-2"
                style={{ maxWidth: "220px" }}
              />
              <button
                type="button"
                onClick={removeImage}
                className="btn btn-outline-danger btn-sm"
              >
                <FaTrash className="me-1" />
                Eliminar imagen
              </button>
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
                  <p className="text-primary mb-0">Suelta la imagen aquí...</p>
                ) : (
                  <>
                    <p className="mb-1">
                      Arrastra y suelta una imagen aquí, o haz clic para
                      seleccionar
                    </p>
                    <p className="text-muted small mb-0">
                      Formatos: JPEG, PNG, JPG, GIF (Máx. 2MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {formErrors.image && (
            <div className="text-danger small mt-2">{formErrors.image}</div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              "Procesando..."
            ) : (
              <>
                <FaPlus className="me-2" />
                Crear Usuario
              </>
            )}
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleClear}
          >
            <FaBroom className="me-2" />
            Limpiar
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/usuarios")}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

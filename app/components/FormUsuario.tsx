import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { createUsuario } from "../services/userService";
import { useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaPlus,
  FaBroom,
  FaTrash,
  FaUserCircle,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

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

  // Image crop state
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/usuarios");
  };

  // Validation regex patterns
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[0-9]{4}-[0-9]{4}$/;
  const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const maxImageSize = 2 * 1024 * 1024;

  useEffect(() => {
    toast.dismiss();
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop]);

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

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
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

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const handleSaveCroppedImage = () => {
    if (previewCanvasRef.current) {
      previewCanvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "profile-image.jpg", {
              type: "image/jpeg",
            });
            setFormData((prev) => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(blob));
            setShowCropModal(false);
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const validateField = (name: string, value: any): string => {
    if (
      ["first_name", "last_name", "email", "role_id"].includes(name) &&
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

    // Convertir email a minúsculas
    if (name === "email") {
      newValue = newValue.toLowerCase();
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
      toast.error("Por favor corrija los errores antes de enviar", {
        id: "submit-toast",
      });
      return;
    }

    setIsLoading(true);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        if (key === "role_id") {
          formDataToSend.append(key, Number(value).toString());
        } else if (key !== "image") {
          formDataToSend.append(key, value.toString());
        }
      }
    });

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    formDataToSend.append("estado", "0");

    toast.dismiss("submit-toast");
    toast.loading(
      "Estamos creando el usuario. Por favor, espere un momento...",
      {
        position: "top-right",
        id: "submit-toast",
      }
    );

    try {
      const response = await createUsuario(formDataToSend);

      toast.dismiss("submit-toast");
      toast.success("Usuario creado con éxito", {
        position: "top-right",
        duration: 3000,
        id: "submit-toast",
      });

      handleClear();
      navigate("/usuarios");
    } catch (error: any) {
      toast.dismiss("submit-toast");

      const errorData = error.response?.data;
      const isEmailExists = errorData?.error === "email_exists";
      const errorMessage = isEmailExists
        ? "El correo electrónico ya está registrado"
        : errorData?.message || "Error al crear el usuario";

      toast.error(errorMessage, {
        position: "top-right",
        duration: 5000,
        id: "submit-toast",
      });

      if (isEmailExists) {
        setFormErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
      }

      console.error("Error al crear usuario:", {
        status: error.response?.status,
        data: errorData,
        message: error.message,
      });
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
    { id: 4, name: "Encargado Espacio" },
  ];

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
            className={`form-control ${formErrors.address ? "is-invalid" : ""}`}
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
                className="img-fluid rounded-circle border mb-2"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={removeImage}
                className="btn btn-outline-danger btn-sm"
                disabled={isLoading}
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
                <FaUserCircle size={50} className="text-muted mb-2" />
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
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Procesando...
              </>
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
            disabled={isLoading}
          >
            <FaBroom className="me-2" />
            Limpiar
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/usuarios")}
            disabled={isLoading}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal para recortar imagen */}
      <div
        className={`modal ${showCropModal ? "d-block" : "d-none"}`}
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Recortar Imagen</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCropModal(false)}
                disabled={isLoading}
              ></button>
            </div>
            <div className="modal-body">
              <div className="d-flex flex-column align-items-center">
                {imgSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="img-fluid"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                )}

                <div className="mt-3">
                  <h5>Vista previa:</h5>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      display: "block",
                      width: 150,
                      height: 150,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCropModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCroppedImage}
                disabled={isLoading}
              >
                Guardar Recorte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para el preview del canvas
function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * pixelRatio);
  canvas.height = Math.floor(crop.height * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(
    canvas.width / 2 / pixelRatio,
    canvas.height / 2 / pixelRatio,
    Math.min(canvas.width, canvas.height) / 2 / pixelRatio,
    0,
    Math.PI * 2
  );
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width / pixelRatio,
    canvas.height / pixelRatio
  );

  ctx.restore();
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import { FaSave, FaTimes, FaUserCircle, FaTrash } from "react-icons/fa";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import { getPerfil, updateProfile } from "~/services/userService";
import type { UserProfileUpdateDTO } from "~/types/user";
import "react-image-crop/dist/ReactCrop.css";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const EditPerfil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfileUpdateDTO>({
    first_name: "",
    last_name: "",
    email: "",
    role_id: 1,
    phone: "",
    address: "",
    estado: 1,
    image: "",
    image_url: "",
  });
  
  // Image crop state
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  const phoneRegex = /^[0-9]{4}-[0-9]{4}$/;

  useEffect(() => {
    getPerfil()
      .then((data) => {
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          role_id: data.role_id,
          phone: data.phone || "",
          address: data.address || "",
          estado: data.estado ?? 1,
          image: "",
          image_url: data.image_url || "",
        });
      })
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
      );
    }
  }, [completedCrop]);

  const validateField = (name: string, value: any): string => {
    if (["first_name", "last_name"].includes(name) && (!value || value.trim() === "")) {
      return "Este campo es obligatorio";
    }

    switch (name) {
      case "first_name":
      case "last_name":
        if (!nameRegex.test(value))
          return "Debe tener al menos 2 letras y solo letras/espacios.";
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
    ["first_name", "last_name", "phone", "address"].forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
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
      previewCanvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile-image.jpg", { type: "image/jpeg" });
          setFormData((prev) => ({ ...prev, image: file, image_url: URL.createObjectURL(blob) }));
          setShowCropModal(false);
        }
      }, "image/jpeg", 0.9);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "", image_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Por favor corrija los errores antes de enviar");
      return;
    }

    setSaving(true);
    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image") {
        if (value instanceof File) {
          form.append("image", value);
        }
      } else {
        form.append(key, value?.toString() ?? "");
      }
    });

    try {
      await updateProfile(form);
      toast.success("Perfil actualizado correctamente");
      navigate("/perfil");
    } catch (error) {
      toast.error("Error al actualizar el perfil");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="form-container">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">Editar Perfil</h2>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="first_name" className="form-label">
              Nombres
            </label>
            <input
              id="first_name"
              name="first_name"
              placeholder="Nombres"
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
              placeholder="Apellidos"
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
              className="form-control"
              disabled
            />
          </div>

          <div className="col-md-6">
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
          <label className="form-label">Imagen de Perfil</label>

          {formData.image_url ? (
            <div className="d-flex flex-column align-items-center">
              <img
                src={formData.image_url}
                alt="Foto de perfil"
                className="img-fluid rounded-circle border mb-2"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
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
                      Formatos: JPEG, PNG, JPG, GIF
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={saving}
          >
            {saving ? "Guardando..." : (
              <>
                <FaSave className="me-2" />
                Guardar Cambios
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/perfil")}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal para recortar imagen */}
      <div className={`modal ${showCropModal ? 'd-block' : 'd-none'}`} tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Recortar Imagen</h5>
              <button type="button" className="btn-close" onClick={() => setShowCropModal(false)}></button>
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowCropModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveCroppedImage}>
                Guardar Recorte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPerfil;

// Función auxiliar para el preview del canvas
function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * pixelRatio);
  canvas.height = Math.floor(crop.height * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;
  const maxSquareHalf = Math.min(image.naturalWidth, image.naturalHeight) / 2;

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
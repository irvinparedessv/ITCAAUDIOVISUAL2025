import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import type { Equipo, EquipoCreateDTO } from "app/types/equipo";
import type { TipoEquipo } from "app/types/tipoEquipo";
import { getTipoEquipos } from "../../services/tipoEquipoService";
import { getTipoReservas } from "../../services/tipoReservaService";
import type { TipoReserva } from "app/types/tipoReserva";

import {
  FaSave,
  FaTimes,
  FaPlus,
  FaBroom,
  FaUpload,
  FaTrash,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  onSubmit: (data: EquipoCreateDTO, isEdit?: boolean, id?: number) => void;
  equipoEditando?: Equipo | null;
  resetEdit: () => void;
  onCancel?: () => void;
  onDelete?: (id: number) => void;
}

export default function EquipmentForm({
  onSubmit,
  equipoEditando,
  resetEdit,
  onCancel,
  onDelete,
}: Props) {
  const [form, setForm] = useState<EquipoCreateDTO>({
    nombre: "",
    descripcion: "",
    estado: true,
    cantidad: 0,
    tipo_equipo_id: 0,
    tipo_reserva_id: 0,
    imagen: null,
  });

  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tipoReservas, setTipoReservas] = useState<TipoReserva[]>([]);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/equipolist"); // Regresa a la página anterior
  };

  useEffect(() => {
    toast.dismiss(); // limpia cualquier confirmación colgada
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (!file.type.match("image.*")) {
          toast.error("Solo se permiten archivos de imagen (JPEG, PNG, GIF)");
          return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error("La imagen no puede ser mayor a 5MB");
          return;
        }

        setForm({ ...form, imagen: file });
        setImagePreview(URL.createObjectURL(file));
      }
    },
    [form]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeImage = () => {
    setForm({ ...form, imagen: null });
    setImagePreview(null);
  };

  const showConfirmationToast = (
    action: "update" | "delete",
    onConfirm: () => void
  ) => {
    const messages = {
      update: {
        question: "¿Seguro que deseas actualizar este equipo?",
        confirmText: "Sí, actualizar",
        success: "Equipo actualizado correctamente",
      },
      delete: {
        question: "¿Seguro que deseas eliminar este equipo?",
        confirmText: "Sí, eliminar",
        success: "Equipo eliminado correctamente",
      },
    };

    const { question, confirmText, success } = messages[action];

    toast.dismiss("confirmation-toast"); // 👈 Cierra uno previo si existe

    toast(
      (t) => (
        <div>
          <p>{question}</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-success"
              onClick={() => {
                onConfirm();
                toast.dismiss(t.id);
                toast.success(success, { id: "action-success" }); // opcional: evita duplicados de éxito también
              }}
            >
              {confirmText}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        id: "confirmation-toast", // 👈 ID único para evitar múltiples toasts simultáneos
      }
    );

  };

  useEffect(() => {
    const loadTipos = async () => {
      try {
        const [tiposEquipoData, tiposReservaData] = await Promise.all([
          getTipoEquipos(),
          getTipoReservas(),
        ]);

        setTipos(tiposEquipoData);
        setTipoReservas(tiposReservaData);
      } catch (err) {
        console.error("Error cargando tipos:", err);
        toast.error("Error al cargar tipos");
      } finally {
        setLoading(false);
      }
    };

    loadTipos();
  }, []);

  useEffect(() => {
    if (equipoEditando) {
      setForm({
        nombre: equipoEditando.nombre,
        descripcion: equipoEditando.descripcion,
        estado: equipoEditando.estado,
        cantidad: equipoEditando.cantidad,
        tipo_equipo_id: equipoEditando.tipo_equipo_id,
        tipo_reserva_id: equipoEditando.tipo_reserva_id,
        imagen: null,
      });
      setImagePreview(equipoEditando.imagen_url || null);
    } else {
      handleClear();
    }
  }, [equipoEditando]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Cierra cualquier toast anterior de submit
    toast.dismiss("submit-toast");

    // Validaciones
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio", { id: "submit-toast" });
      return;
    }

    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria", { id: "submit-toast" });
      return;
    }

    if (form.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a cero", { id: "submit-toast" });
      return;
    }

    if (!form.tipo_equipo_id) {
      toast.error("Debe seleccionar un tipo de equipo", { id: "submit-toast" });
      return;
    }

    if (!form.tipo_reserva_id) {
      toast.error("Debe seleccionar un tipo de reserva", { id: "submit-toast" });
      return;
    }

    // Edición con confirmación
    if (equipoEditando) {
      showConfirmationToast("update", () => {
        onSubmit(form, true, equipoEditando.id);
        handleClear();
      });
    } else {
      // Creación directa
      onSubmit(form, false);
      toast.success("Equipo creado exitosamente", { id: "submit-toast" });
      handleClear();
      setTimeout(() => {
        navigate("/equipolist"); // Ajusta según ruta real
      }, 2000);
    }
  };


  const handleDelete = () => {
    if (!equipoEditando || !onDelete) return;

    showConfirmationToast("delete", () => {
      onDelete(equipoEditando.id);
      handleClear();
    });
  };

  const handleClear = () => {
    setForm({
      nombre: "",
      descripcion: "",
      estado: true,
      cantidad: 0,
      tipo_equipo_id: 0,
      tipo_reserva_id: 0,
      imagen: null,
    });
    setImagePreview(null);
    resetEdit();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    handleClear();
  };

  return (
    <div className="form-container position-relative">
      {/* Flecha de regresar en esquina superior izquierda */}
      <FaLongArrowAltLeft
        onClick={handleBack}
        title="Regresar"
        style={{
          position: 'absolute',
          top: '25px',
          left: '30px',
          cursor: 'pointer',
          fontSize: '2rem',
          zIndex: 10
        }}
      />
      <h2 className="mb-4 text-center fw-bold">
        {equipoEditando ? "Editar Equipo" : "Agregar Nuevo Equipo"}
      </h2>


      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nombre" className="form-label">
            Nombre
          </label>
          <input
            id="nombre"
            placeholder="Nombre del equipo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="form-control"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="descripcion" className="form-label">
            Descripción
          </label>
          <textarea
            id="descripcion"
            placeholder="Descripción del equipo"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="form-control"
            rows={3}
          />
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              id="estado"
              value={form.estado ? "1" : "0"}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value === "1" })
              }
              className="form-select"
              disabled={!equipoEditando}
            >
              <option value="1">Disponible</option>
              <option value="0">No disponible</option>
            </select>
          </div>



          <div className="col-md-6">
            <label htmlFor="cantidad" className="form-label">
              Cantidad
            </label>
            <input
              id="cantidad"
              type="number"
              min="1"
              placeholder="0"
              value={form.cantidad || ""}
              onChange={(e) =>
                setForm({ ...form, cantidad: Number(e.target.value) || 0 })
              }
              className="form-control"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label">Imagen</label>

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
              className={`border border-secondary-subtle rounded p-4 text-center cursor-pointer ${isDragActive ? "border-primary bg-light" : ""
                }`}
            >
              <input {...getInputProps()} />
              <div className="d-flex flex-column align-items-center justify-content-center">
                <FaUpload className="text-muted mb-2" size={24} />
                {isDragActive ? (
                  <p className="text-primary mb-0">Suelta la imagen aquí...</p>
                ) : (
                  <>
                    <p className="mb-1">
                      Arrastra y suelta una imagen aquí, o haz clic para seleccionar
                    </p>
                    <p className="text-muted small mb-0">
                      Formatos: JPEG, PNG, GIF (Máx. 5MB)
                    </p>
                    {equipoEditando?.imagen_url && (
                      <p className="text-info small mt-2">
                        Ya hay una imagen cargada para este equipo. Subir una nueva la reemplazará.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="tipo_equipo" className="form-label">
            Tipo de equipo
          </label>
          <select
            id="tipo_equipo"
            value={form.tipo_equipo_id || ""}
            onChange={(e) =>
              setForm({ ...form, tipo_equipo_id: Number(e.target.value) })
            }
            className="form-select"
            disabled={loading}
          >
            <option value="">
              {loading ? "Cargando tipos..." : "Seleccione un tipo"}
            </option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="tipo_reserva" className="form-label">
            Tipo de reserva
          </label>
          <select
            id="tipo_reserva"
            value={form.tipo_reserva_id || ""}
            onChange={(e) =>
              setForm({ ...form, tipo_reserva_id: Number(e.target.value) })
            }
            className="form-select"
            disabled={loading}
          >
            <option value="">
              {loading ? "Cargando tipos de reserva..." : "Seleccione un tipo"}
            </option>
            {tipoReservas.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          {equipoEditando ? (
            <>
              <button type="submit" className="btn primary-btn">
                <FaSave className="me-2" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleCancel}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="btn primary-btn">
                <FaPlus className="me-2" />
                Crear
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleClear}
              >
                <FaBroom className="me-2" />
                Limpiar
              </button>

            </>
          )}
        </div>

        {equipoEditando && onDelete && (
          <div className="form-actions mt-3">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <FaTrash className="me-2" />
              Eliminar Equipo
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

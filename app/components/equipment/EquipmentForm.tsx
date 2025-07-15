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
  onSubmit: (data: EquipoCreateDTO, isEdit?: boolean, id?: number) => Promise<boolean>;
  equipoEditando?: Equipo | null;
  resetEdit: () => void;
  onCancel?: () => void;
  onDelete?: (id: number) => Promise<void>;
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
    navigate("/equipolist");
  };

  useEffect(() => {
    toast.dismiss();
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
  onConfirm: () => Promise<void>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const messages = {
      update: {
        question: "¿Seguro que deseas actualizar este equipo?",
        confirmText: "Sí, actualizar",
      },
      delete: {
        question: "¿Seguro que deseas eliminar este equipo?",
        confirmText: "Sí, eliminar",
      },
    };

    const { question, confirmText } = messages[action];

    toast.dismiss("confirmation-toast");

    toast(
      (t) => (
        <div>
          <p>{question}</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-success"
              onClick={async () => {
                try {
                  await onConfirm();
                  toast.dismiss(t.id);
                  resolve();
                } catch (error) {
                  toast.dismiss(t.id);
                  reject(error);
                }
              }}
            >
              {confirmText}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                toast.dismiss(t.id);
                reject(new Error("cancelled"));
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 999999, // Para que no se cierre solo
        id: "confirmation-toast",
      }
    );
  });
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
      } catch (error: any) {
        console.error(error);
        toast.dismiss("error-guardar");

        const message = error?.response?.data?.message;

        if (error?.response?.status === 422 && message) {
          toast.error(message, {
            id: "error-nombre-duplicado",
            style: {
              background: "#363636",
              color: "#fff",
            },
          });
        } else {
          toast.error("Ocurrió un error al cargar los tipos de equipo", {
            id: "error-guardar",
            style: {
              background: "#363636",
              color: "#fff",
            },
          });
        }
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

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  toast.dismiss("submit-toast");

  // Validaciones ...
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

 try {
    if (equipoEditando) {
      await showConfirmationToast("update", async () => {
        try {
          const success = await onSubmit(form, true, equipoEditando.id);
          if (success) {
            toast.success("Equipo actualizado correctamente", {
              id: "submit-toast",
            });
            handleClear();
          }
        } catch (error: any) {
          throw error;
        }
      });
    } else {
      try {
        const success = await onSubmit(form, false);
        if (success) {
          toast.success("Equipo creado exitosamente", { id: "submit-toast" });
          handleClear();
          setTimeout(() => {
            navigate("/equipolist");
          }, 500);
        }
      } catch (error: any) {
        throw error;
      }
    }
  } catch (error: any) {
    if (error.message === "cancelled") return;

    if (error?.response?.status === 422) {
      const errors = error.response.data.errors;
      if (errors) {
        Object.values(errors).forEach((msgs) => {
          (msgs as string[]).forEach((msg) => {
            toast.error(msg, { id: "submit-toast" });
          });
        });
        return;
      }
    }

    const msg =
      error?.response?.data?.message ||
      (equipoEditando
        ? "Error al actualizar equipo"
        : "Error al crear equipo");

    toast.error(msg, { id: "submit-toast" });
  }
};



  const handleDelete = () => {
    if (!equipoEditando || !onDelete) return;

    showConfirmationToast("delete", async () => {
      try {
        await onDelete(equipoEditando.id);
        handleClear();
        toast.success("Equipo eliminado correctamente", {
          id: "submit-toast",
        });
      } catch (error: any) {
        const msg = error?.response?.data?.message || "Error al eliminar equipo";
        toast.error(msg, { id: "submit-toast" });
        throw error;
      }
    }).catch((error) => {
      if (error.message !== "cancelled") {
        toast.error("Error al eliminar equipo");
      }
      // Si fue cancelado no mostrar nada
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
          {equipoEditando ? "Editar Equipo" : "Agregar Nuevo Equipo"}
        </h2>
      </div>

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
              onChange={(e) => setForm({ ...form, estado: e.target.value === "1" })}
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
              className={`border border-secondary-subtle rounded p-4 text-center cursor-pointer ${
                isDragActive ? "border-primary bg-light" : ""
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
                        Ya hay una imagen cargada para este equipo. Subir una nueva la
                        reemplazará.
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

import { useState, useEffect } from "react";
import {
  createTipoEquipo,
  updateTipoEquipo,
} from "../../services/tipoEquipoService";
import type { TipoEquipo } from "app/types/tipoEquipo";
import toast from "react-hot-toast";
import { FaSave, FaTimes, FaPlus, FaBroom, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  tipoEditado?: TipoEquipo;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function TipoEquipoForm({
  tipoEditado,
  onSuccess,
  onCancel,
}: Props) {
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (tipoEditado) {
      setNombre(tipoEditado.nombre);
    } else {
      setNombre("");
    }
  }, [tipoEditado]);

  const handleBack = () => {
    navigate("/");
  };

  const handleSubmit = async () => {
    toast.dismiss();
    if (!nombre.trim()) {
      toast.error("El nombre del tipo de equipo es obligatorio", {
        id: "error-nombre-obligatorio",
        style: {
          background: "#363636",
          color: "#fff",
        },
      });
      return;
    }

    try {
      if (tipoEditado) {
        await updateTipoEquipo(tipoEditado.id, { nombre });
        toast.success("Tipo de equipo actualizado correctamente", {
          id: "exito-actualizacion",
          style: {
            background: "#363636",
            color: "#fff",
          },
        });
      } else {
        await createTipoEquipo({ nombre });
        toast.success("Tipo de equipo creado exitosamente", {
          id: "exito-creacion",
          style: {
            background: "#363636",
            color: "#fff",
          },
        });
      }

      setNombre("");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al guardar el tipo de equipo", {
        id: "error-guardar",
        style: {
          background: "#363636",
          color: "#fff",
        },
      });
    }
  };

  const handleClear = () => {
    setNombre("");
    if (onCancel) onCancel();
  };

  const handleUpdateWithConfirmation = () => {
    const toastId = "confirmar-actualizacion";
    toast.dismiss();
    // Cierra cualquier toast con este id abierto para evitar duplicados
    toast.dismiss(toastId);

    toast(
      (t) => (
        <div>
          <p>¿Estás seguro que deseas actualizar este registro?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-success"
              onClick={async () => {
                toast.dismiss(t.id);
                await handleSubmit();
              }}
              style={{ transition: "transform 0.2s ease-in-out" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Sí, actualizar
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => toast.dismiss(t.id)}
              style={{ transition: "transform 0.2s ease-in-out" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: "#363636",
          color: "#fff",
        },
        id: toastId, // <-- aquí el id para controlar la instancia
      }
    );
  };


  return (
    <div className="form-container">
      <div className="d-flex">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
            transition: 'transform 0.2s ease-in-out',
            marginRight: '0.5rem' // Añadido este estilo
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'scale(1.1)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = 'scale(1)')
          }
        />
        <h2 className="fw-bold">
          {tipoEditado ? "Editar Tipo de Equipo" : "Agregar Nuevo Tipo de Equipo"}
        </h2>
      </div>

      <form>
        <div className="mb-4">
          <label htmlFor="nombre" className="form-label">
            Nombre del tipo de equipo
          </label>
          <input
            id="nombre"
            type="text"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Laptop, Proyector..."
          />
        </div>

        <div className="form-actions">
          {tipoEditado ? (
            <>
              <button
                type="button"
                className="btn primary-btn"
                onClick={handleUpdateWithConfirmation}
                style={{
                  transition: "transform 0.2s ease-in-out"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <FaSave className="me-2" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleClear}
                style={{
                  transition: "transform 0.2s ease-in-out"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn primary-btn"
                onClick={handleSubmit}
                style={{
                  transition: "transform 0.2s ease-in-out"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <FaPlus className="me-2" />
                Crear
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleClear}
                style={{
                  transition: "transform 0.2s ease-in-out"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <FaBroom className="me-2" />
                Limpiar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
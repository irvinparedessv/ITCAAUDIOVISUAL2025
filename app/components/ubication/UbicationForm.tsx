import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  createUbicacion,
  updateUbicacion,
  getUbicacionById,
} from "../../services/ubicationService";
import toast from "react-hot-toast";
import UbicacionNoEncontrada from "../error/UbicacionNoEncontrada";
import { Spinner } from "react-bootstrap";
import { FaSave, FaTimes, FaPlus, FaBroom, FaLongArrowAltLeft } from "react-icons/fa";

interface UbicacionCreateDTO {
  nombre: string;
  descripcion: string;
}

export default function UbicacionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<UbicacionCreateDTO>({
    nombre: "",
    descripcion: "",
  });
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      setLoadingData(true);
      getUbicacionById(Number(id))
        .then((data) => {
          setForm({
            nombre: data.nombre,
            descripcion: data.descripcion,
          });
        })
        .catch((error) => {
          console.error("Error cargando la ubicación:", error);
          if (error?.response?.status === 404) {
            setNotFound(true);
          } else {
            toast.error("Error cargando la ubicación");
          }
        })
        .finally(() => setLoadingData(false));
    }
  }, [id]);

  const handleBack = () => {
    navigate("/ubications");
  };

  const showConfirmationToast = (onConfirm: () => void) => {
    toast.dismiss("confirmation-toast");

    toast(
      (t) => (
        <div>
          <p>¿Seguro que deseas actualizar esta ubicación?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-success"
              onClick={() => {
                onConfirm();
                toast.dismiss(t.id);
                toast.success("Ubicación actualizada correctamente", { id: "action-success" });
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
      ),
      {
        duration: 5000,
        id: "confirmation-toast",
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (id) {
      showConfirmationToast(async () => {
        setLoadingSubmit(true);
        try {
          await updateUbicacion(Number(id), form);
          toast.success("Ubicación actualizada");
          setTimeout(() => {
            navigate("/ubications");
          }, 2000);
        } catch (error) {
          toast.error("Error al actualizar");
        } finally {
          setLoadingSubmit(false);
        }
      });
      return;
    }

    // Crear
    setLoadingSubmit(true);
    try {
      await createUbicacion(form);
      toast.success("Ubicación creada");
      setTimeout(() => {
        navigate("/ubications");
      }, 2000);
    } catch (error) {
      toast.error("Error al crear");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleClear = () => {
    setForm({
      nombre: "",
      descripcion: "",
    });
  };

  if (loadingData) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Cargando ubicación...</p>
      </div>
    );
  }

  if (notFound) {
    return <UbicacionNoEncontrada />;
  }

  return (
    <div className="form-container position-relative">
      {/* Encabezado con flecha y título */}
      <div
        className="d-flex align-items-center gap-2 gap-md-3"
        style={{ marginBottom: '30px' }}
      >
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
          }}
        />
        <h2 className="fw-bold m-0">
          {id ? "Editar Ubicación" : "Agregar Nueva Ubicación"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nombre" className="form-label">
            Nombre
          </label>
          <input
            id="nombre"
            placeholder="Nombre de la ubicación"
            className="form-control"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            disabled={loadingSubmit}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="descripcion" className="form-label">
            Descripción
          </label>
          <textarea
            id="descripcion"
            placeholder="Descripción de la ubicación"
            className="form-control"
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            disabled={loadingSubmit}
          ></textarea>
        </div>

        <div className="form-actions">
          {id ? (
            <>
              <button 
                type="submit" 
                className="btn primary-btn"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Actualizar
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleBack}
                disabled={loadingSubmit}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button 
                type="submit" 
                className="btn primary-btn"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Creando...
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" />
                    Crear
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn secondary-btn"
                onClick={handleClear}
                disabled={loadingSubmit}
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
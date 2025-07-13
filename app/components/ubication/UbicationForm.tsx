import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  createUbicacion,
  updateUbicacion,
  getUbicacionById,
} from "../../services/ubicationService";
import toast from "react-hot-toast";

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
        .catch(() => {
          toast.error("Error cargando la ubicación");
        })
        .finally(() => setLoadingData(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoadingSubmit(true);

    try {
      if (id) {
        await updateUbicacion(Number(id), form);
        toast.success("Ubicación actualizada");
      } else {
        await createUbicacion(form);
        toast.success("Ubicación creada");
      }
      setTimeout(() => {
        navigate("/ubications");
      }, 2000);
    } catch (error) {
      toast.error("Error al guardar la ubicación");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status" />
        <p>Cargando ubicación...</p>
      </div>
    );
  }

  return (
    <div>
      <h3>{id ? "Editar Ubicación" : "Agregar Ubicación"}</h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">
            Nombre
          </label>
          <input
            id="nombre"
            className="form-control"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            disabled={loadingSubmit}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="descripcion" className="form-label">
            Descripción
          </label>
          <textarea
            id="descripcion"
            className="form-control"
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            disabled={loadingSubmit}
          ></textarea>
        </div>

        <button
          type="submit"
          className="btn btn-primary me-2"
          disabled={loadingSubmit}
        >
          {loadingSubmit && (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
          )}
          {id ? "Actualizar" : "Crear"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/ubications")}
          disabled={loadingSubmit}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

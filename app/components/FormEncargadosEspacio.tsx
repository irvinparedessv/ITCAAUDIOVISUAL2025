import React, { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaPlus, FaTrash, FaLongArrowAltLeft } from "react-icons/fa";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import type { User } from "../types/user";
import api from "./../api/axios";

interface AulaDetalle {
  id: number;
  name: string;
  primeraImagen?: {
    image_path: string;
  };
  encargados?: User[];
}

export default function AsignarEncargadosForm() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selectedEncargado, setSelectedEncargado] = useState<number | "">("");
  const [encargados, setEncargados] = useState<User[]>([]);
  const [aula, setAula] = useState<AulaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const { aulaId } = useParams<{ aulaId: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, aulaRes] = await Promise.all([
          api.get<User[]>("/encargados"),
          aulaId
            ? api.get(`/aulas/${aulaId}/encargados`)
            : Promise.resolve({ data: null }),
        ]);

        setUsuarios(usersRes.data);
        setAula(aulaRes.data);

        if (aulaRes.data?.encargados) {
          setEncargados(aulaRes.data.encargados);
        }
      } catch (error) {
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [aulaId]);

  const handleBack = () => {
    navigate("/rooms");
  };

  const handleAddEncargado = () => {
    if (!selectedEncargado) return;

    const user = usuarios.find((u) => u.id === selectedEncargado);
    if (!user) return;

    if (encargados.find((e) => e.id === user.id)) {
      toast.error("Este encargado ya fue agregado");
      return;
    }

    setEncargados([...encargados, user]);
    setSelectedEncargado("");
  };

  const handleRemoveEncargado = (id: number) => {
    setEncargados(encargados.filter((e) => e.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!aulaId) return;

    if (encargados.length === 0) {
      toast.error("Debes agregar al menos un encargado");
      return;
    }

    setSaving(true);

    const ids = encargados.map((e) => e.id);

    try {
      await api.post(`/aulas/${aulaId}/encargados`, { user_ids: ids });
      toast.success("Encargados asignados correctamente");
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch {
      toast.error("Error al asignar encargados");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setEncargados([]);
    setSelectedEncargado("");
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando datos del aula...</p>
      </div>
    );
  }

  const encargadosDisponibles = usuarios.filter(
    (u) => !encargados.some((e) => e.id === u.id)
  );

  return (
    <div className="form-container position-relative">

    <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: 'pointer',
              fontSize: '2rem',
            }}
          />
          <h2 className="fw-bold m-0 flex-grow-1">Asignar Encargados</h2>
        </div>
        <br />



      {aula && (
        <div className="mb-4 aula-info">
          <h5 className="fw-bold">{aula.name}</h5>
          {aula.primeraImagen?.image_path && (
            <img
              src={aula.primeraImagen.image_path}
              alt="Imagen del aula"
              className="img-fluid rounded shadow-sm mt-2 aula-image"
            />
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="encargado" className="form-label">
            Selecciona un encargado
          </label>
          <div className="row">
            <div className="col-md-8 mb-2 mb-md-0">
              <select
                id="encargado"
                value={selectedEncargado}
                onChange={(e) => setSelectedEncargado(Number(e.target.value))}
                className="form-select"
                disabled={encargadosDisponibles.length === 0}
              >
                <option value="">-- Selecciona un encargado --</option>
                {encargadosDisponibles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                type="button"
                className="btn primary-btn w-100"
                onClick={handleAddEncargado}
                disabled={!selectedEncargado || encargadosDisponibles.length === 0}
              >
                <FaPlus className="me-2" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {encargados.length > 0 && (
          <div className="mb-4">
            <label className="form-label">Encargados asignados</label>
            <div className="list-group">
              {encargados.map((e) => (
                <div
                  key={e.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{e.first_name} {e.last_name}</strong>
                    <span className="badge bg-secondary ms-2">ID: {e.id}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleRemoveEncargado(e.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn me-2"
            disabled={saving || encargados.length === 0}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Guardando...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar encargados
              </>
            )}
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleClear}
            disabled={encargados.length === 0}
          >
            <FaTimes className="me-2" />
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
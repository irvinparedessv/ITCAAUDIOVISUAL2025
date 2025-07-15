import React, { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaPlus, FaTrash, FaLongArrowAltLeft } from "react-icons/fa";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Select from 'react-select';

import type { User } from "../types/user";
import api from "./../api/axios";
import EspacioNoEncontrado from "./error/EspacioNoEncontrado";

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
  const [notFound, setNotFound] = useState(false);

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
      } catch (error: any) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Error al cargar datos");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [aulaId]);

  if (notFound) {
    return <EspacioNoEncontrado />;
  }

  const handleBack = () => {
    navigate("/rooms");
  };

  const handleAddEncargado = (selectedOption: any) => {
    if (!selectedOption) return;

    const userId = selectedOption.value;
    const user = usuarios.find((u) => u.id === userId);
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
      }, 500);
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

  // Preparar opciones para react-select
  const options = encargadosDisponibles.map((u) => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name}`
  }));

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
              <Select
                id="encargado"
                options={options}
                onChange={handleAddEncargado}
                placeholder="Buscar encargado..."
                isDisabled={encargadosDisponibles.length === 0}
                noOptionsMessage={() => "No hay encargados disponibles"}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable
                isClearable
                value={null}
                menuPortalTarget={document.body}
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    minHeight: '38px',
                    height: '38px',
                    borderColor: state.isFocused ? '#b90a01ff' : '#ced4da',
                    boxShadow: state.isFocused ? '0 0 0 1px #db2209ff' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#b60000ff' : '#adb5bd'
                    },
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }),
                  valueContainer: (provided) => ({
                    ...provided,
                    height: '38px',
                    padding: '0 12px',
                  }),
                  input: (provided) => ({
                    ...provided,
                    margin: '0',
                    padding: '0',
                    color: '#495057'
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: '#6c757d'
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected ? '#2684FF' : state.isFocused ? '#e9ecef' : 'white',
                    color: state.isSelected ? 'white' : '#495057',
                    padding: '10px 16px',
                    fontSize: '0.95rem'
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  indicatorSeparator: () => ({
                    display: 'none'
                  }),
                  dropdownIndicator: (provided) => ({
                    ...provided,
                    color: '#6c757d',
                    padding: '8px'
                  }),
                  clearIndicator: (provided) => ({
                    ...provided,
                    color: '#6c757d',
                    padding: '8px'
                  })
                }}
              />
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
import { useState, useEffect } from "react";
import {
  createCaracteristica,
  createTipoEquipo,
  getCaracteristicas,
  getCategorias,
  updateTipoEquipo,
} from "../../services/tipoEquipoService";
import type { Categoria, TipoEquipo } from "app/types/tipoEquipo";
import toast from "react-hot-toast";
import {
  FaSave,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

interface Props {
  tipoEditado?: TipoEquipo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CaracteristicaLocal {
  id: number;
  nombre: string;
  tipo_dato: string;
  esNueva?: boolean;
}

export default function TipoEquipoForm({
  tipoEditado,
  onSuccess,
  onCancel,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaLocal[]>([]);
  const [caracSeleccionadas, setCaracSeleccionadas] = useState<number[]>([]);
  const [mostrarAgregarCarac, setMostrarAgregarCarac] = useState(false);
  const [nuevaCarac, setNuevaCarac] = useState("");
  const [tipoDato, setTipoDato] = useState("string");

  const navigate = useNavigate();

  // Cargar características del localStorage al iniciar
  useEffect(() => {
    const cargarCaracteristicasLocales = () => {
      const caracLocales = localStorage.getItem('caracteristicasLocales');
      return caracLocales ? JSON.parse(caracLocales) : [];
    };

    async function fetchData() {
      try {
        const [catJson, caracJson] = await Promise.all([
          getCategorias(),
          getCaracteristicas(),
        ]);

        console.log("Características desde backend:", caracJson); // <--- Agrega aquí

        const caracLocales = cargarCaracteristicasLocales();

        setCaracteristicas([
          ...caracJson,
          ...caracLocales.map((c: any) => ({ ...c, esNueva: true })),
        ]);
        setCategorias(catJson);
      } catch (error) {
        toast.error("Error al cargar datos");
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (tipoEditado) {
      console.log("Características del tipo editado:", tipoEditado.caracteristicas);
      setNombre(tipoEditado.nombre);
      setCategoriaId(tipoEditado.categoria_id ?? null);
      if (tipoEditado.caracteristicas) {
        setCaracSeleccionadas(tipoEditado.caracteristicas.map(c => c.id));
      }
    }
  }, [tipoEditado]);

  useEffect(() => {
    console.log("Características seleccionadas (ids):", caracSeleccionadas);
  }, [caracSeleccionadas]);

  const handleSubmit = async () => {
    if (!nombre.trim() || !categoriaId) {
      toast.error("Nombre y categoría son obligatorios");
      return;
    }

    try {
      // Preparar payload
      const payload = {
        nombre,
        categoria_id: categoriaId,
        caracteristicas: caracteristicas
          .filter(c => caracSeleccionadas.includes(c.id))
          .map(c => ({
            id: c.esNueva ? undefined : c.id, // No enviar ID si es nueva
            nombre: c.esNueva ? c.nombre : undefined, // Solo enviar nombre si es nueva
            tipo_dato: c.esNueva ? c.tipo_dato : undefined // Solo enviar tipo_dato si es nueva
          }))
      };

      // Limpiar localStorage si hay características nuevas
      const tieneNuevas = caracteristicas.some(c =>
        c.esNueva && caracSeleccionadas.includes(c.id)
      );

      if (tieneNuevas) {
        localStorage.removeItem('caracteristicasLocales');
      }

      // Enviar datos al servidor
      if (tipoEditado) {
        await updateTipoEquipo(tipoEditado.id, payload);
        toast.success("Tipo de equipo actualizado");
      } else {
        await createTipoEquipo(payload);
        toast.success("Tipo de equipo creado");
      }

      // Resetear formulario
      setNombre("");
      setCategoriaId(null);
      setCaracSeleccionadas([]);
      onSuccess?.();

    } catch (error) {
      console.error("Error al guardar el tipo de equipo:", error);
      toast.error("Error al guardar el tipo de equipo");
    }
  };

  const handleBack = () => navigate("/tipoEquipo");

  const agregarNuevaCaracteristica = () => {
    if (!nuevaCarac.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    // Buscar si ya existe (en base de datos o en localStorage)
    const caracteristicaExistente = caracteristicas.find(
      c => c.nombre.toLowerCase() === nuevaCarac.trim().toLowerCase()
    );

    if (caracteristicaExistente) {
      // Si ya existe, seleccionarla en lugar de mostrar error
      if (!caracSeleccionadas.includes(caracteristicaExistente.id)) {
        setCaracSeleccionadas(prev => [...prev, caracteristicaExistente.id]);
        toast.success(`Característica "${caracteristicaExistente.nombre}" seleccionada`);
      } else {
        toast(`La característica "${caracteristicaExistente.nombre}" ya está seleccionada`, {
          icon: "ℹ️"
        });
      }
      setNuevaCarac("");
      setMostrarAgregarCarac(false);
      return;
    }

    // Generar un ID temporal negativo para identificar las nuevas
    const nuevoId = -Math.floor(Math.random() * 1000000);
    const nuevaCaracObj = {
      id: nuevoId,
      nombre: nuevaCarac.trim(),
      tipo_dato: tipoDato,
      esNueva: true
    };

    // Agregar a la lista de características
    setCaracteristicas(prev => [...prev, nuevaCaracObj]);

    // Agregar a las seleccionadas
    setCaracSeleccionadas(prev => [...prev, nuevoId]);

    // Guardar en localStorage
    const caracLocales = JSON.parse(localStorage.getItem('caracteristicasLocales') || '[]');
    caracLocales.push(nuevaCaracObj);
    localStorage.setItem('caracteristicasLocales', JSON.stringify(caracLocales));

    setNuevaCarac("");
    setMostrarAgregarCarac(false);
    toast.success("Característica agregada temporalmente");
  };

  const eliminarCaracteristicaLocal = (id: number) => {
    // Eliminar de la lista general
    setCaracteristicas(prev => prev.filter(c => c.id !== id));

    // Eliminar de las seleccionadas si está ahí
    setCaracSeleccionadas(prev => prev.filter(cId => cId !== id));

    // Actualizar localStorage
    const caracLocales = JSON.parse(localStorage.getItem('caracteristicasLocales') || '[]')
      .filter((c: any) => c.id !== id);
    localStorage.setItem('caracteristicasLocales', JSON.stringify(caracLocales));

    toast.success("Característica temporal eliminada");
  };

  return (
    <div className="form-container">
      <div className="d-flex align-items-center mb-3">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem", marginRight: "0.5rem" }}
        />
        <h2 className="fw-bold">
          {tipoEditado ? "Editar Tipo de Equipo" : "Agregar Nuevo Tipo de Equipo"}
        </h2>
      </div>

      <form>
        {/* Categoría */}
        <div className="mb-3">
          <label className="form-label">Categoría</label>
          <select
            className="form-select"
            value={categoriaId ?? ""}
            onChange={(e) => setCategoriaId(Number(e.target.value))}
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre */}
        <div className="mb-4">
          <label className="form-label">Nombre del tipo de equipo</label>
          <input
            type="text"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Laptop, Proyector..."
          />
        </div>

        {/* Características seleccionables */}
        <div className="mb-3">
          <label className="form-label">Características</label>
          <Select
            isMulti
            options={caracteristicas.map((c) => ({
              value: c.id,
              label: c.nombre,
              tipo_dato: c.tipo_dato,
            }))}
            value={caracteristicas
              .filter(c => caracSeleccionadas.includes(c.id))
              .map(c => ({
                value: c.id,
                label: c.nombre,
                tipo_dato: c.tipo_dato,
              }))
            }
            onChange={(selectedOptions) => {
              const nuevasIds = selectedOptions.map(opt => opt.value);
              setCaracSeleccionadas(nuevasIds);
            }}
            placeholder="Selecciona características..."
            className="react-select-container"
            classNamePrefix="react-select"
            noOptionsMessage={() => "No hay características disponibles"}
          />

          {/* Link para mostrar el formulario para agregar característica */}
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => setMostrarAgregarCarac(!mostrarAgregarCarac)}
            >
              {mostrarAgregarCarac ? "Cancelar" : "+ Agregar nueva característica"}
            </button>
          </div>

          {/* Formulario para agregar nueva característica */}
          {mostrarAgregarCarac && (
            <div className="mt-3 d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre de la característica"
                value={nuevaCarac}
                onChange={(e) => setNuevaCarac(e.target.value)}
              />
              <select
                className="form-select"
                style={{ maxWidth: "150px" }}
                value={tipoDato}
                onChange={(e) => setTipoDato(e.target.value)}
              >
                <option value="string">Texto</option>
                <option value="integer">Entero</option>
                <option value="decimal">Decimal</option>
                <option value="boolean">Booleano</option>
              </select>
              <button
                type="button"
                className="btn btn-success"
                onClick={agregarNuevaCaracteristica}
              >
                Agregar
              </button>
            </div>
          )}
        </div>

        {/* Lista de características seleccionadas */}
        {caracSeleccionadas.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Características seleccionadas</label>
            <ul className="list-group">
              {caracteristicas
                .filter(c => caracSeleccionadas.includes(c.id))
                .map((carac) => (
                  <li key={carac.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {carac.nombre}
                    {carac.esNueva && (
                      <span className="badge bg-warning text-dark me-2">Nueva</span>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (carac.esNueva) {
                          eliminarCaracteristicaLocal(carac.id);
                        } else {
                          setCaracSeleccionadas(prev => prev.filter(id => id !== carac.id));
                        }
                      }}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Botones */}
        <div className="form-actions d-flex gap-2 mt-4">
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <FaSave className="me-2" />
            {tipoEditado ? "Actualizar" : "Crear"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
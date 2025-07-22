import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FaSave, FaTimes, FaBroom, FaUpload, FaTrash, FaLongArrowAltLeft, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { Marca, Modelo, Estado } from "../../types/item";
import type { TipoEquipo } from "~/types/tipoEquipo";
import type { TipoReserva } from "~/types/tipoReserva";
import api from "../../api/axios";
import MarcaModal from "./MarcaModal";
import ModeloModal from "./ModeloModal";

interface Caracteristica {
  id: number;
  nombre: string;
  tipo_dato: string;
  valor: string;
}

interface Props {
  loading: boolean;
  tiposEquipo: TipoEquipo[];
  tipoReservas: TipoReserva[];
  marcas: Marca[];
  modelos: Modelo[];
  estados: Estado[];
  onSubmit: (data: any) => Promise<void>;
}

export default function ItemForm({
  loading,
  tiposEquipo,
  tipoReservas,
  marcas,
  modelos,
  estados,
  onSubmit,
}: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo_equipo_id: "",
    marca_id: "",
    modelo_id: "",
    estado_id: "",
    tipo_reserva_id: "",
    detalles: "",
    fecha_adquisicion: "",
    numero_serie: "",
    vida_util: "",
    cantidad: "",
    imagen: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filteredModelos, setFilteredModelos] = useState<Modelo[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>([]);
  const [loadingCaracteristicas, setLoadingCaracteristicas] = useState(false);
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showModeloModal, setShowModeloModal] = useState(false);

  // Determina si el tipo seleccionado es insumo
  const esInsumo = (() => {
    const tipo = tiposEquipo.find((t) => t.id === Number(form.tipo_equipo_id));
    return tipo?.categoria_id === 2;
  })();

  useEffect(() => {
    if (form.marca_id) {
      const filtrados = modelos.filter((m) => m.marca_id === Number(form.marca_id));
      setFilteredModelos(filtrados);
      setForm((prev) => ({ ...prev, modelo_id: "" }));
    } else {
      setFilteredModelos([]);
      setForm((prev) => ({ ...prev, modelo_id: "" }));
    }
  }, [form.marca_id, modelos]);

  useEffect(() => {
    const fetchCaracteristicas = async () => {
      if (form.tipo_equipo_id) {
        setLoadingCaracteristicas(true);
        try {
          const response = await api.get(
            `/tipo-equipos/${form.tipo_equipo_id}/caracteristicas`
          );
          const data = response.data;
          setCaracteristicas(
            data.map((c: any) => ({
              ...c,
              valor: "",
            }))
          );
        } catch (error) {
          toast.error("Error al cargar características");
          console.error(error);
        } finally {
          setLoadingCaracteristicas(false);
        }
      } else {
        setCaracteristicas([]);
      }
    };

    fetchCaracteristicas();
  }, [form.tipo_equipo_id]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
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

      setForm((prev) => ({ ...prev, imagen: file }));
      setImagePreview(URL.createObjectURL(file));
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

  const removeImage = () => {
    setForm((prev) => ({ ...prev, imagen: null }));
    setImagePreview(null);
  };

  const handleBack = () => {
    navigate("/inventario");
  };

  const handleClear = () => {
    setForm({
      tipo_equipo_id: "",
      marca_id: "",
      modelo_id: "",
      estado_id: "",
      tipo_reserva_id: "",
      detalles: "",
      fecha_adquisicion: "",
      numero_serie: "",
      vida_util: "",
      cantidad: "",
      imagen: null,
    });
    setImagePreview(null);
    setCaracteristicas([]);
  };

  const handleCaracteristicaChange = (id: number, valor: string) => {
    setCaracteristicas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, valor } : c))
    );
  };

  const handleAddMarca = async (nombre: string) => {
    const nombreNormalizado = nombre.trim().toLowerCase();
    if (!nombreNormalizado) return;

    const yaExiste = marcas.find(
      (m) => m.nombre.trim().toLowerCase() === nombreNormalizado
    );

    if (yaExiste) {
      setForm((prev) => ({
        ...prev,
        marca_id: String(yaExiste.id),
        modelo_id: "",
      }));
      setShowMarcaModal(false);
      toast.success("Marca ya existente seleccionada");
      return;
    }

    try {
      const response = await api.post("/marcas", { nombre: nombre.trim() });
      const nuevaMarca = response.data;
      marcas.push(nuevaMarca);

      setForm((prev) => ({
        ...prev,
        marca_id: String(nuevaMarca.id),
        modelo_id: "",
      }));
      setShowMarcaModal(false);
      toast.success("Marca agregada y seleccionada");
    } catch (error: any) {
      if (error.response?.status === 422 || error.response?.status === 409) {
        const existente = marcas.find(
          (m) => m.nombre.trim().toLowerCase() === nombreNormalizado
        );

        if (existente) {
          setForm((prev) => ({
            ...prev,
            marca_id: String(existente.id),
            modelo_id: "",
          }));
          setShowMarcaModal(false);
          toast.success("Marca ya existente seleccionada");
        } else {
          toast.error("Marca duplicada, pero no encontrada localmente");
        }
      } else {
        toast.error("Error al agregar marca");
      }
    }
  };

  const handleAddModelo = async (nombre: string, marca_id: number) => {
    const existente = modelos.find(
      (m) =>
        m.nombre.toLowerCase() === nombre.toLowerCase() &&
        String(m.marca_id) === String(marca_id)
    );

    if (existente) {
      setForm((prev) => ({
        ...prev,
        modelo_id: String(existente.id),
      }));
      setShowModeloModal(false);
      toast.success("Modelo ya existente seleccionado");
      return;
    }

    try {
      const response = await api.post("/modelos", { nombre, marca_id });
      const nuevoModelo = response.data;
      modelos.push(nuevoModelo);
      setForm((prev) => ({
        ...prev,
        modelo_id: String(nuevoModelo.id),
      }));
      setShowModeloModal(false);
      toast.success("Modelo agregado");
    } catch (error: any) {
      if (error.response?.status === 422 || error.response?.status === 409) {
        const existente = modelos.find(
          (m) =>
            m.nombre.toLowerCase() === nombre.toLowerCase() &&
            String(m.marca_id) === String(marca_id)
        );

        if (existente) {
          setForm((prev) => ({
            ...prev,
            modelo_id: String(existente.id),
          }));
          setShowModeloModal(false);
          toast.success("Modelo ya existente seleccionado");
        } else {
          toast.error("Modelo duplicado, pero no encontrado localmente");
        }
      } else {
        toast.error("Error al agregar modelo");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();

    if (!form.tipo_equipo_id) {
      toast.error("Seleccione un tipo de equipo");
      return;
    }
    if (!form.marca_id) {
      toast.error("Seleccione una marca");
      return;
    }
    if (!form.modelo_id) {
      toast.error("Seleccione un modelo");
      return;
    }
    if (!form.estado_id) {
      toast.error("Seleccione un estado");
      return;
    }
    if (!form.detalles) {
      toast.error("Ingrese los detalles");
      return;
    }

    if (esInsumo) {
      if (!form.cantidad || Number(form.cantidad) <= 0) {
        toast.error("La cantidad debe ser mayor a cero");
        return;
      }
    } else {
      if (!form.numero_serie) {
        toast.error("Ingrese el número de serie");
        return;
      }
    }

    for (const c of caracteristicas) {
      if (!c.valor || c.valor.trim() === "") {
        toast.error(`La característica "${c.nombre}" es requerida`);
        return;
      }
    }

    try {
      const dataToSubmit = {
        ...form,
        tipo_equipo_id: Number(form.tipo_equipo_id),
        marca_id: Number(form.marca_id),
        modelo_id: Number(form.modelo_id),
        estado_id: Number(form.estado_id),
        tipo_reserva_id: Number(form.tipo_reserva_id),
        vida_util: form.vida_util ? Number(form.vida_util) : 0,
        cantidad: form.cantidad ? Number(form.cantidad) : 0,
        caracteristicas: caracteristicas.map((c) => ({
          id: c.id,
          valor: c.valor,
        })),
      };
      await onSubmit(dataToSubmit);
      toast.success("Ítem guardado correctamente");
      handleClear();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar el equipo");
    }
  };

  return (
    <div className="form-container position-relative">
      <div className="d-flex align-items-center gap-2 gap-md-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <h2 className="fw-bold m-0">Crear Nuevo Ítem</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="tipo_equipo" className="form-label">
              Tipo de Equipo
            </label>
            <select
              id="tipo_equipo"
              value={form.tipo_equipo_id}
              onChange={(e) => setForm({ ...form, tipo_equipo_id: e.target.value })}
              className="form-select"
              disabled={loading}
            >
              <option value="">Seleccione un tipo</option>
              {tiposEquipo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label htmlFor="tipo_reserva" className="form-label">
              Tipo de Reserva
            </label>
            <select
              id="tipo_reserva"
              value={form.tipo_reserva_id}
              onChange={(e) => setForm({ ...form, tipo_reserva_id: e.target.value })}
              className="form-select"
              disabled={loading}
            >
              <option value="">Seleccione un tipo</option>
              {tipoReservas.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="marca" className="form-label">
              Marca
            </label>
            <div className="d-flex gap-2">
              <select
                id="marca"
                value={form.marca_id}
                onChange={(e) => setForm({ ...form, marca_id: e.target.value })}
                className="form-select"
                disabled={loading}
              >
                <option value="">Seleccione una marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowMarcaModal(true)}
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="modelo" className="form-label">
              Modelo
            </label>
            <div className="d-flex gap-2">
              <select
                id="modelo"
                value={form.modelo_id}
                onChange={(e) => setForm({ ...form, modelo_id: e.target.value })}
                className="form-select"
                disabled={loading || !form.marca_id}
              >
                <option value="">Seleccione un modelo</option>
                {filteredModelos.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowModeloModal(true)}
                disabled={!form.marca_id}
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="col-md-4">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              id="estado"
              value={form.estado_id}
              onChange={(e) => setForm({ ...form, estado_id: e.target.value })}
              className="form-select"
              disabled={loading}
            >
              <option value="">Seleccione un estado</option>
              {estados.map((estado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="detalles" className="form-label">
            Detalles
          </label>
          <textarea
            id="detalles"
            className="form-control"
            rows={3}
            value={form.detalles}
            onChange={(e) => setForm({ ...form, detalles: e.target.value })}
            placeholder="Descripción detallada del ítem"
          />
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="fecha_adquisicion" className="form-label">
              Fecha de Adquisición
            </label>
            <input
              id="fecha_adquisicion"
              type="date"
              className="form-control"
              value={form.fecha_adquisicion}
              onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })}
            />
          </div>

          {form.tipo_equipo_id && (
            esInsumo ? (
              <div className="col-md-6">
                <label htmlFor="cantidad" className="form-label">
                  Cantidad
                </label>
                <input
                  id="cantidad"
                  type="number"
                  min={1}
                  className="form-control"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  placeholder="Cantidad disponible"
                />
              </div>
            ) : (
              <>
                <div className="col-md-3">
                  <label htmlFor="numero_serie" className="form-label">
                    Número de Serie
                  </label>
                  <input
                    id="numero_serie"
                    type="text"
                    className="form-control"
                    value={form.numero_serie}
                    onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}
                    placeholder="Número de serie"
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="vida_util" className="form-label">
                    Vida Útil (años)
                  </label>
                  <input
                    id="vida_util"
                    type="number"
                    min={0}
                    className="form-control"
                    value={form.vida_util}
                    onChange={(e) => setForm({ ...form, vida_util: e.target.value })}
                    placeholder="Años de vida útil"
                  />
                </div>
              </>
            )
          )}
        </div>

        {form.tipo_equipo_id && (
          loadingCaracteristicas ? (
            <div className="mb-4 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando características...</span>
              </div>
              <p className="mt-2">Cargando características...</p>
            </div>
          ) : (
            caracteristicas.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-3">Características del Equipo</h5>
                <div className="border rounded p-3">
                  {caracteristicas.map((caracteristica) => (
                    <div key={caracteristica.id} className="mb-3">
                      <label htmlFor={`caracteristica-${caracteristica.id}`} className="form-label">
                        {caracteristica.nombre}
                        <span className="badge bg-info ms-2">
                          {caracteristica.tipo_dato}
                        </span>
                      </label>
                      {caracteristica.tipo_dato === "boolean" ? (
                        <select
                          id={`caracteristica-${caracteristica.id}`}
                          className="form-select"
                          value={caracteristica.valor}
                          onChange={(e) =>
                            handleCaracteristicaChange(caracteristica.id, e.target.value)
                          }
                        >
                          <option value="">Seleccione...</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          id={`caracteristica-${caracteristica.id}`}
                          type={
                            caracteristica.tipo_dato === "integer"
                              ? "number"
                              : caracteristica.tipo_dato === "decimal"
                                ? "number"
                                : "text"
                          }
                          step={caracteristica.tipo_dato === "decimal" ? "0.01" : undefined}
                          className="form-control"
                          value={caracteristica.valor}
                          onChange={(e) =>
                            handleCaracteristicaChange(caracteristica.id, e.target.value)
                          }
                          placeholder={`Ingrese ${caracteristica.nombre.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        )}

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
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary-btn" disabled={loading}>
            <FaSave className="me-2" />
            Guardar
          </button>
          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleClear}
            disabled={loading}
          >
            <FaBroom className="me-2" />
            Limpiar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={loading}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>

      <MarcaModal
        show={showMarcaModal}
        onHide={() => setShowMarcaModal(false)}
        marcas={marcas}
        onAdd={handleAddMarca}
      />

      <ModeloModal
        show={showModeloModal}
        onHide={() => setShowModeloModal(false)}
        modelos={modelos}
        marcaSeleccionada={marcas.find((m) => m.id === Number(form.marca_id))}
        onAdd={(nombre) => {
          const marcaId = Number(form.marca_id);
          if (marcaId) {
            return handleAddModelo(nombre, marcaId);
          } else {
            return Promise.reject("Marca no seleccionada");
          }
        }}
      />
    </div>
  );
}
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FaSave, FaTimes, FaPlus, FaBroom, FaUpload, FaTrash, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Form, Button, Badge } from "react-bootstrap";
import toast from "react-hot-toast";
import type { Marca, Modelo, Estado } from "../../types/item";
import type { TipoEquipo } from "~/types/tipoEquipo";
import type { TipoReserva } from "~/types/tipoReserva";
import api from "../../api/axios";

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
  onSubmit: (data: any, tipo: 'equipo' | 'insumo') => Promise<void>;
}

export default function ItemForm({
  loading,
  tiposEquipo,
  tipoReservas,
  marcas,
  modelos,
  estados,
  onSubmit
}: Props) {
  const navigate = useNavigate();
  const [tipoItem, setTipoItem] = useState<'equipo' | 'insumo'>('equipo');
  const [form, setForm] = useState({
    tipo_equipo_id: 0,
    marca_id: 0,
    modelo_id: 0,
    estado_id: 0,
    tipo_reserva_id: 0,
    detalles: '',
    fecha_adquisicion: '',
    numero_serie: '',
    vida_util: 0,
    cantidad: 0,
    imagen: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filteredModelos, setFilteredModelos] = useState<Modelo[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>([]);
  const [loadingCaracteristicas, setLoadingCaracteristicas] = useState(false);

  // Filtrar modelos cuando cambia la marca seleccionada
  useEffect(() => {
    if (form.marca_id) {
      const filtrados = modelos.filter(m => m.marca_id === form.marca_id);
      setFilteredModelos(filtrados);
      setForm(prev => ({ ...prev, modelo_id: 0 })); // Reset modelo al cambiar marca
    } else {
      setFilteredModelos([]);
    }
  }, [form.marca_id, modelos]);

  // Cargar características cuando cambia el tipo de equipo
  useEffect(() => {
   const fetchCaracteristicas = async () => {
  if (form.tipo_equipo_id) {
    setLoadingCaracteristicas(true);
    try {
      const response = await api.get(`/tipo-equipos/${form.tipo_equipo_id}/caracteristicas`);

      const data = response.data;

      setCaracteristicas(data.map((c: any) => ({
        ...c,
        valor: ''
      })));
    } catch (error) {
      toast.error('Error al cargar características');
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

      setForm(prev => ({ ...prev, imagen: file }));
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
    setForm(prev => ({ ...prev, imagen: null }));
    setImagePreview(null);
  };

  const handleBack = () => {
    navigate("/inventario");
  };

  const handleClear = () => {
    setForm({
      tipo_equipo_id: 0,
      marca_id: 0,
      modelo_id: 0,
      estado_id: 0,
      tipo_reserva_id: 0,
      detalles: '',
      fecha_adquisicion: '',
      numero_serie: '',
      vida_util: 0,
      cantidad: 0,
      imagen: null
    });
    setImagePreview(null);
    setCaracteristicas([]);
  };

  const handleCaracteristicaChange = (id: number, valor: string) => {
    setCaracteristicas(prev => 
      prev.map(c => 
        c.id === id ? { ...c, valor } : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
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
    if (tipoItem === 'equipo' && !form.numero_serie) {
      toast.error("Ingrese el número de serie");
      return;
    }
    if (tipoItem === 'insumo' && form.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a cero");
      return;
    }

    try {
      const dataToSubmit = {
        ...form,
        caracteristicas: caracteristicas.map(c => ({
          id: c.id,
          valor: c.valor
        }))
      };
      
      await onSubmit(dataToSubmit, tipoItem);
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar el equipo");
    }
  };

  return (
    <div className="form-container position-relative">
      <div className="d-flex align-items-center gap-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: 'pointer', fontSize: '2rem' }}
        />
        <h2 className="fw-bold m-0">Crear Nuevo Ítem</h2>
      </div>

      <div className="mb-4">
        <label className="form-label">Tipo de Ítem</label>
        <div className="d-flex gap-2">
          <Button
            variant={tipoItem === 'equipo' ? 'primary' : 'outline-primary'}
            onClick={() => setTipoItem('equipo')}
          >
            Equipo
          </Button>
          <Button
            variant={tipoItem === 'insumo' ? 'primary' : 'outline-primary'}
            onClick={() => setTipoItem('insumo')}
          >
            Insumo
          </Button>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Tipo de Equipo</Form.Label>
          <Form.Select
            value={form.tipo_equipo_id || ""}
            onChange={(e) => setForm({...form, tipo_equipo_id: Number(e.target.value)})}
            disabled={loading}
          >
            <option value="">Seleccione un tipo</option>
            {tiposEquipo.map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Marca</Form.Label>
          <Form.Select
            value={form.marca_id || ""}
            onChange={(e) => setForm({...form, marca_id: Number(e.target.value)})}
            disabled={loading}
          >
            <option value="">Seleccione una marca</option>
            {marcas.map(marca => (
              <option key={marca.id} value={marca.id}>{marca.nombre}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Modelo</Form.Label>
          <Form.Select
            value={form.modelo_id || ""}
            onChange={(e) => setForm({...form, modelo_id: Number(e.target.value)})}
            disabled={loading || !form.marca_id}
          >
            <option value="">Seleccione un modelo</option>
            {filteredModelos.map(modelo => (
              <option key={modelo.id} value={modelo.id}>{modelo.nombre}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Estado</Form.Label>
          <Form.Select
            value={form.estado_id || ""}
            onChange={(e) => setForm({...form, estado_id: Number(e.target.value)})}
            disabled={loading}
          >
            <option value="">Seleccione un estado</option>
            {estados.map(estado => (
              <option key={estado.id} value={estado.id}>{estado.nombre}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Tipo de Reserva</Form.Label>
          <Form.Select
            value={form.tipo_reserva_id || ""}
            onChange={(e) => setForm({...form, tipo_reserva_id: Number(e.target.value)})}
            disabled={loading}
          >
            <option value="">Seleccione un tipo</option>
            {tipoReservas.map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Detalles</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={form.detalles}
            onChange={(e) => setForm({...form, detalles: e.target.value})}
            placeholder="Descripción detallada del ítem"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Fecha de Adquisición</Form.Label>
          <Form.Control
            type="date"
            value={form.fecha_adquisicion}
            onChange={(e) => setForm({...form, fecha_adquisicion: e.target.value})}
          />
        </Form.Group>

        {tipoItem === 'equipo' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Número de Serie</Form.Label>
              <Form.Control
                type="text"
                value={form.numero_serie}
                onChange={(e) => setForm({...form, numero_serie: e.target.value})}
                placeholder="Ingrese el número de serie"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vida Útil (años)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={form.vida_util || ""}
                onChange={(e) => setForm({...form, vida_util: Number(e.target.value)})}
                placeholder="Años de vida útil estimada"
              />
            </Form.Group>
          </>
        )}

        {tipoItem === 'insumo' && (
          <Form.Group className="mb-3">
            <Form.Label>Cantidad</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={form.cantidad || ""}
              onChange={(e) => setForm({...form, cantidad: Number(e.target.value)})}
              placeholder="Cantidad disponible"
            />
          </Form.Group>
        )}

        {/* Sección de Características */}
        {loadingCaracteristicas ? (
          <div className="mb-4 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando características...</span>
            </div>
            <p className="mt-2">Cargando características...</p>
          </div>
        ) : (
          caracteristicas.length > 0 && (
            <div className="mb-4 characteristics-section">
              <h5>Características del Equipo</h5>
              <div className="border rounded p-3">
                {caracteristicas.map((caracteristica) => (
                  <Form.Group key={caracteristica.id} className="mb-3">
                    <Form.Label>
                      {caracteristica.nombre}
                      <Badge bg="info" className="ms-2">
                        {caracteristica.tipo_dato}
                      </Badge>
                    </Form.Label>
                    {caracteristica.tipo_dato === 'boolean' ? (
                      <Form.Select
                        value={caracteristica.valor}
                        onChange={(e) => 
                          handleCaracteristicaChange(caracteristica.id, e.target.value)
                        }
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </Form.Select>
                    ) : (
                      <Form.Control
                        type={
                          caracteristica.tipo_dato === 'integer' ? 'number' : 
                          caracteristica.tipo_dato === 'decimal' ? 'number' : 'text'
                        }
                        step={caracteristica.tipo_dato === 'decimal' ? '0.01' : undefined}
                        value={caracteristica.valor}
                        onChange={(e) => 
                          handleCaracteristicaChange(caracteristica.id, e.target.value)
                        }
                        placeholder={`Ingrese ${caracteristica.nombre.toLowerCase()}`}
                        required
                      />
                    )}
                  </Form.Group>
                ))}
              </div>
            </div>
          )
        )}

        <Form.Group className="mb-4">
          <Form.Label>Imagen</Form.Label>
          {imagePreview ? (
            <div className="d-flex flex-column align-items-center">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="img-fluid rounded border mb-2"
                style={{ maxWidth: "220px" }}
              />
              <Button
                variant="outline-danger"
                size="sm"
                onClick={removeImage}
              >
                <FaTrash className="me-1" />
                Eliminar imagen
              </Button>
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
        </Form.Group>

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={loading}>
            <FaSave className="me-2" />
            Guardar
          </Button>
          <Button variant="secondary" onClick={handleClear} disabled={loading}>
            <FaBroom className="me-2" />
            Limpiar
          </Button>
          <Button variant="outline-secondary" onClick={handleBack} disabled={loading}>
            <FaTimes className="me-2" />
            Cancelar
          </Button>
        </div>
      </Form>
    </div>
  );
}
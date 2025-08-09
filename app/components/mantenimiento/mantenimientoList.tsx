import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button, Form, InputGroup, Spinner, Modal } from "react-bootstrap";
import {
  FaEdit,
  FaSearch,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
  FaTrash,
  FaExchangeAlt,
  FaFilter,
  FaEye
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";
import type { Mantenimiento } from "../../types/mantenimiento";
import { getMantenimientos, deleteMantenimiento, updateVidaUtilMantenimiento } from "../../services/mantenimientoService";
import { getTiposMantenimiento } from "~/services/tipoMantenimientoService";
import { getEstados, updateEstadoEquipo } from "../../services/itemService";
import { formatDate, formatTo12h } from "~/utils/time";
import type { Estado } from "~/types/item";
import { EstadoEquipo } from "~/types/estados";
import "animate.css";

interface Filters {
  search: string;
  page: number;
  per_page: number;
  tipo_id?: number;
  estado_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  vida_util_min?: number;
  vida_util_max?: number;
}

export default function MantenimientoList() {
  const location = useLocation();
  const navigate = useNavigate();
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    page: 1,
    per_page: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState<Record<number, string>>({});
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [comentarioEstado, setComentarioEstado] = useState("");

  // Efecto para el highlight al venir desde futuro mantenimiento
  useEffect(() => {
    if (location.state?.highlightId) {
      setHighlightedId(location.state.highlightId);
      
      // Limpiar el resaltado después de 7 segundos
      const timer = setTimeout(() => {
        setHighlightedId(null);
        navigate(location.pathname, { replace: true, state: {} });
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (highlightedId !== null && mantenimientos.length > 0) {
      // Verificar que el ID existe en los mantenimientos
      const existeMantenimiento = mantenimientos.some(m => m.id === highlightedId);
      
      if (existeMantenimiento && highlightRef.current) {
        highlightRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [highlightedId, mantenimientos]);

  const handleBack = () => navigate("/equipos");

  const cargarTipos = async () => {
    try {
      const { data: tipos = [] } = await getTiposMantenimiento();

      const tiposActivos = tipos
        .filter(tipo => tipo.estado === true || tipo.estado === 1)
        .reduce((acc, tipo) => ({ ...acc, [tipo.id]: tipo.nombre }), {});

      setTipos(tiposActivos);
    } catch (error) {
      console.error('Error al cargar tipos:', error);
      toast.error("No se pudieron cargar los tipos de mantenimiento");
      setTipos({});
    }
  };

  const cargarEstados = async () => {
    try {
      const data = await getEstados();
      setEstados(data);
    } catch {
      toast.error("Error al cargar estados");
    }
  };

  const cargarMantenimientos = async () => {
    setLoading(true);
    try {
      const response = await getMantenimientos(filters);
      setMantenimientos(response.data || []);
      setLastPage(response.last_page || 1);
    } catch {
      toast.error("Error al cargar mantenimientos");
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminacion = async (id: number) => {
    const mantenimiento = mantenimientos.find((m) => m.id === id);
    if (!mantenimiento) {
      toast.error("Mantenimiento no encontrado");
      return;
    }

    const toastId = `eliminar-mantenimiento-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Seguro que deseas eliminar el mantenimiento del equipo <strong>
              {mantenimiento.equipo ? `${mantenimiento.equipo.numero_serie} - ${mantenimiento.equipo.modelo?.nombre}` : "Sin equipo"}
            </strong>?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                try {
                  const result = await deleteMantenimiento(id);
                  toast.dismiss(t.id);
                  if (result.success) {
                    toast.success("Mantenimiento eliminado correctamente", { duration: 4000 });
                    cargarMantenimientos();
                  } else {
                    toast.error(result.message || "No se pudo eliminar el mantenimiento", { duration: 4000 });
                  }
                } catch (error) {
                  toast.dismiss(t.id);
                  toast.error("Error inesperado al eliminar el mantenimiento", { duration: 4000 });
                  console.error(error);
                }
              }}
            >
              Sí, eliminar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        id: toastId,
      }
    );
  };

  const handleCambiarEstado = async () => {
    if (!selectedMantenimiento) return;

    try {
      setLoadingEstados(true);

      if (selectedMantenimiento.fecha_mantenimiento_final) {
        const result = await updateVidaUtilMantenimiento(
          selectedMantenimiento.id,
          selectedMantenimiento.vida_util || 0,
          selectedMantenimiento.comentario || ''
        );

        if (result.success) {
          toast.success("Vida útil actualizada correctamente", { duration: 4000 });
          cargarMantenimientos();
          setShowEstadoModal(false);
        } else {
          toast.error(result.message || "Error al actualizar vida útil", { duration: 4000 });
        }
      } else {
        const result = await updateEstadoEquipo(
          selectedMantenimiento.equipo_id,
          selectedEstado,
          selectedMantenimiento.id,
          selectedMantenimiento.comentario || '',
          selectedMantenimiento.vida_util || 0
        );

        if (result.success) {
          toast.success("Mantenimiento finalizado correctamente", { duration: 4000 });
          cargarMantenimientos();
          setShowEstadoModal(false);
        } else {
          toast.error(result.message || "Error al finalizar mantenimiento", { duration: 4000 });
        }
      }
    } catch (error) {
      toast.error("Error inesperado al realizar la operación", { duration: 4000 });
      console.error(error);
    } finally {
      setLoadingEstados(false);
    }
  };

  const handleFilterUpdate = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      page: 1,
      per_page: 10,
      tipo_id: undefined,
      estado_id: undefined,
      fecha_inicio: undefined,
      fecha_fin: undefined,
      vida_util_min: undefined,
      vida_util_max: undefined,
    });
    setSearchInput("");
  };

  const mapNombreToEstadoEquipo = (nombre: string): EstadoEquipo | undefined => {
    const lower = nombre.toLowerCase();

    if (lower.includes("no disponible")) return EstadoEquipo.NoDisponible;
    if (lower.includes("dañado")) return EstadoEquipo.Dañado;
    if (lower.includes("mantenimiento")) return EstadoEquipo.Mantenimiento;
    if (lower.includes("reposo")) return EstadoEquipo.EnReposo;
    if (lower.includes("disponible")) return EstadoEquipo.Disponible;

    return undefined;
  };

  const estadoColorMap: Record<EstadoEquipo, string> = {
    [EstadoEquipo.Disponible]: "success",
    [EstadoEquipo.Mantenimiento]: "warning",
    [EstadoEquipo.EnReposo]: "info",
    [EstadoEquipo.Dañado]: "danger",
    [EstadoEquipo.NoDisponible]: "secondary",
  };

  const getEstadoBadgeColor = (estadoId?: number): string => {
    if (!estadoId || !(estadoId in estadoColorMap)) return "secondary";
    return estadoColorMap[estadoId as EstadoEquipo];
  };

  const getEstadoBadgeColorByNombre = (nombre?: string): string => {
    const estado = mapNombreToEstadoEquipo(nombre ?? "");
    return getEstadoBadgeColor(estado);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      handleFilterUpdate("search", searchInput);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchInput]);

  useEffect(() => {
    cargarTipos();
    cargarEstados();
  }, []);

  useEffect(() => {
    cargarMantenimientos();
  }, [filters]);

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{ cursor: "pointer", fontSize: "2rem" }}
          />
          <h2 className="fw-bold m-0">Listado de Mantenimientos</h2>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="flex-grow-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por equipo, tipo, usuario, comentarios o vida útil"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {filters.search && (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchInput("");
                  handleFilterUpdate("search", "");
                }}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>
        <Button
          variant={showFilters ? "primary" : "outline-secondary"}
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0"
        >
          {showFilters ? (
            <>
              <FaTimes className="me-2" />
              Ocultar Filtros
            </>
          ) : (
            <>
              <FaFilter className="me-2" />
              Mostrar Filtros
            </>
          )}
          {Object.values(filters).some(
            (val) => val !== undefined && val !== "" && val !== 1 && val !== 10
          ) && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                !
                <span className="visually-hidden">Filtros activos</span>
              </span>
            )}
        </Button>
      </div>

      {showFilters && (
        <div className="border p-3 rounded mb-3">
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Label>Tipo de Mantenimiento</Form.Label>
              <Form.Select
                value={filters.tipo_id || ""}
                onChange={(e) =>
                  handleFilterUpdate(
                    "tipo_id",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="">Todos</option>
                {Object.entries(tipos).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-4">
              <Form.Label>Estado del Equipo</Form.Label>
              <Form.Select
                value={filters.estado_id || ""}
                onChange={(e) =>
                  handleFilterUpdate(
                    "estado_id",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="">Todos</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-4">
              <Form.Label>Rango de Vida Útil</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="number"
                  placeholder="Mínimo"
                  value={filters.vida_util_min ?? ""}
                  onChange={(e) =>
                    handleFilterUpdate(
                      "vida_util_min",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  min="0"
                />
                <Form.Control
                  type="number"
                  placeholder="Máximo"
                  value={filters.vida_util_max ?? ""}
                  onChange={(e) =>
                    handleFilterUpdate(
                      "vida_util_max",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="col-md-6">
              <Form.Label>Fecha desde</Form.Label>
              <Form.Control
                type="date"
                value={filters.fecha_inicio ?? ""}
                onChange={(e) =>
                  handleFilterUpdate("fecha_inicio", e.target.value || undefined)
                }
              />
            </div>

            <div className="col-md-6">
              <Form.Label>Fecha hasta</Form.Label>
              <Form.Control
                type="date"
                value={filters.fecha_fin ?? ""}
                onChange={(e) =>
                  handleFilterUpdate("fecha_fin", e.target.value || undefined)
                }
                min={filters.fecha_inicio}
              />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={() => setShowFilters(false)}>
                Ocultar Filtros
              </Button>
              <Button variant="outline-danger" onClick={resetFilters}>
                <FaTimes className="me-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando mantenimientos...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>Equipo</th>
                  <th>Fecha Inicio</th>
                  <th>Hora Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Hora Fin</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Estado</th>
                  <th>Vida Útil</th>
                  <th>Comentarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length > 0 ? (
                  mantenimientos.map((m) => (
                    <tr 
                      key={m.id}
                      id={`mantenimiento-${m.id}`}
                      ref={highlightedId === m.id ? highlightRef : null}
                      className={
                        highlightedId === m.id 
                          ? "table-warning animate__animated animate__flash" 
                          : ""
                      }
                    >
                      <td>
                        {m.equipo
                          ? `${m.equipo.numero_serie} - ${m.equipo.modelo?.nombre ?? ""} (${m.equipo.modelo?.marca?.nombre ?? ""})`
                          : "Sin equipo"}
                      </td>
                      <td>{formatDate(m.fecha_mantenimiento)}</td>
                      <td>{formatTo12h(m.hora_mantenimiento_inicio)}</td>
                      <td>{formatDate(m.fecha_mantenimiento_final) || "-"}</td>
                      <td>{formatTo12h(m.hora_mantenimiento_final) || "-"}</td>
                      <td>{m.tipo_mantenimiento?.nombre ?? "-"}</td>
                      <td>
                        {m.usuario
                          ? `${m.usuario.first_name ?? ""} ${m.usuario.last_name ?? ""}`.trim()
                          : "Sin usuario"}
                      </td>
                      <td>
                        {m.estado_equipo_final ? (
                          <span className={`badge bg-${getEstadoBadgeColor(m.estado_equipo_final)}`}>
                            {estados.find(e => e.id === m.estado_equipo_final)?.nombre || 'Finalizado'}
                          </span>
                        ) : (
                          <span className="badge bg-warning">{m.equipo.estado.nombre}</span>
                        )}
                      </td>
                      <td>{m.vida_util ?? "-"}</td>
                      <td>{m.comentario ?? "-"}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            title="Editar mantenimiento"
                            onClick={() => navigate(`/mantenimientos/editar/${m.id}`)}
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                            className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                            disabled={m.equipo?.estado?.id !== EstadoEquipo.Mantenimiento}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-success"
                            title="Cambiar estado del equipo"
                            onClick={() => {
                              setSelectedMantenimiento(m);
                              setSelectedEstado(null);
                              setShowEstadoModal(true);
                            }}
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                            className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                          >
                            <FaExchangeAlt />
                          </Button>
                          <Button
                            variant="outline-danger"
                            title="Eliminar mantenimiento"
                            onClick={() => confirmarEliminacion(m.id)}
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                            className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                            disabled={m.equipo?.estado?.id !== EstadoEquipo.Mantenimiento}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-muted">
                      No se encontraron mantenimientos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationComponent
            page={filters.page}
            totalPages={lastPage}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Modal show={showEstadoModal} onHide={() => setShowEstadoModal(false)}>
        <Modal.Header
          className="text-white py-3"
          style={{ backgroundColor: "#b1291d" }}
          closeButton
        >
          <Modal.Title>
            {selectedMantenimiento?.fecha_mantenimiento_final
              ? "Ajustar Mantenimiento"
              : "Cambiar estado del equipo"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMantenimiento && (
            <div>
              <div className="mb-4 p-3 border-bottom">
                <h5 className="fw-bold mb-3">Información del Equipo</h5>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <p className="mb-1 text-muted small">Equipo:</p>
                    <p className="fw-semibold">
                      {selectedMantenimiento.equipo
                        ? `${selectedMantenimiento.equipo.numero_serie} - ${selectedMantenimiento.equipo.modelo?.nombre ?? ""}`
                        : "Sin equipo"}
                    </p>
                  </div>
                  <div className="col-md-6 mb-2">
                    <p className="mb-1 text-muted small">Estado del equipo:</p>
                    {selectedMantenimiento.estado_equipo_final ? (
                      <span className={`badge bg-${getEstadoBadgeColor(selectedMantenimiento.estado_equipo_final)}`}>
                        {estados.find(e => e.id === selectedMantenimiento.estado_equipo_final)?.nombre || 'Finalizado'}
                      </span>
                    ) : (
                      <span className="badge bg-warning">{selectedMantenimiento.equipo.estado.nombre}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 border rounded">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <span>Vida Útil del Equipo</span>
                  {selectedMantenimiento.fecha_mantenimiento_final && (
                    <span className="badge bg-success">Completado</span>
                  )}
                </h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="text-muted small">Vida Útil Actual</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          value={selectedMantenimiento.equipo?.vida_util || 0}
                          readOnly
                        />
                        <InputGroup.Text>horas</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="text-muted small">
                        {selectedMantenimiento.fecha_mantenimiento_final
                          ? "Modificación de Vida Útil "
                          : "Vida Útil a Añadir"}
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          min="0"
                          step="1"
                          value={selectedMantenimiento.vida_util || 0}

                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setSelectedMantenimiento({
                              ...selectedMantenimiento,
                              vida_util: value
                            });
                          }}
                          disabled={selectedMantenimiento.fecha_mantenimiento_final &&
                            selectedMantenimiento.equipo?.estado?.id !== EstadoEquipo.Disponible}
                        />
                        <InputGroup.Text>horas</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded"
                  style={{
                    backgroundColor: '#5cbaf8ff',
                    borderLeft: '4px solid #0d6efd'
                  }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Nueva Vida Útil Total:</span>
                    <span className="fs-5 fw-bold">
                      {selectedMantenimiento.fecha_mantenimiento_final
                        ? selectedMantenimiento.equipo?.vida_util || 0
                        : (selectedMantenimiento.equipo?.vida_util || 0) + (selectedMantenimiento.vida_util || 0)
                      } horas
                    </span>

                  </div>
                </div>
              </div>
              {selectedMantenimiento.fecha_mantenimiento_final ? (
                <div className="mb-3 p-3 border rounded">
                  <h5 className="fw-bold mb-3">Estado del Equipo</h5>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Estado:</span>
                    {selectedMantenimiento.estado_equipo_final ? (
                      <span className={`badge bg-${getEstadoBadgeColor(selectedMantenimiento.estado_equipo_final)}`}>
                        {estados.find(e => e.id === selectedMantenimiento.estado_equipo_final)?.nombre || 'Finalizado'}
                      </span>
                    ) : (
                      <span className="badge bg-secondary">Desconocido</span>
                    )}
                  </div>
                </div>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Nuevo estado</Form.Label>
                  <Form.Select
                    value={selectedEstado || ""}
                    onChange={(e) => setSelectedEstado(Number(e.target.value))}
                  >
                    <option value="">Seleccione un estado</option>
                    {estados
                      .filter((estado) =>
                        [EstadoEquipo.Disponible, EstadoEquipo.NoDisponible, EstadoEquipo.Dañado].includes(estado.id)
                      )
                      .map((estado) => (
                        <option key={estado.id} value={estado.id}>
                          {estado.nombre}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Comentarios</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedMantenimiento.comentario || ''}
                  onChange={(e) => {
                    setSelectedMantenimiento({
                      ...selectedMantenimiento,
                      comentario: e.target.value
                    });
                  }}
                  placeholder="Agregue un comentario sobre el cambio de estado..."
                  disabled={selectedMantenimiento.fecha_mantenimiento_final &&
                    selectedMantenimiento.equipo?.estado?.id !== EstadoEquipo.Disponible}
                />
              </Form.Group>

              {selectedMantenimiento.fecha_mantenimiento_final && (
                <div className="mt-3 p-3 border rounded">
                  <h5 className="fw-bold mb-3">Información de Finalización</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1 text-muted small">Fecha de finalización:</p>
                      <p>{formatDate(selectedMantenimiento.fecha_mantenimiento_final)}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1 text-muted small">Hora de finalización:</p>
                      <p>{formatTo12h(selectedMantenimiento.hora_mantenimiento_final)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEstadoModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={handleCambiarEstado}
            disabled={
              (selectedMantenimiento?.fecha_mantenimiento_final
                ? selectedMantenimiento.equipo?.estado?.id !== EstadoEquipo.Disponible
                : !selectedEstado) || loadingEstados
            }
          >
            {loadingEstados ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : selectedMantenimiento?.fecha_mantenimiento_final ? (
              "Actualizar Mantenimiento"
            ) : (
              "Finalizar Mantenimiento"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
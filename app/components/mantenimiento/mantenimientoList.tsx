import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button, Form, InputGroup, Spinner, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaSearch,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
  FaTrash,
  FaExchangeAlt,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";
import type { Mantenimiento } from "../../types/mantenimiento";
import { getMantenimientos, deleteMantenimiento } from "../../services/mantenimientoService";
import { getTiposMantenimiento } from "~/services/tipoMantenimientoService";
import { getEstados, updateEstadoEquipo } from "../../services/itemService";
import { formatDate, formatTo12h } from "~/utils/time";
import type { Estado } from "~/types/item";
import { EstadoEquipo } from "~/types/estados";

export default function MantenimientoList() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    per_page: 10,
    tipo_id: undefined as number | undefined,
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
  const navigate = useNavigate();

  const handleBack = () => navigate("/equipos");

  const cargarTipos = async () => {
    try {
      const data = await getTiposMantenimiento();
      const activos = data.filter((t: any) => t.estado === true);
      const formateados: Record<number, string> = {};
      activos.forEach((t: any) => {
        formateados[t.id] = t.nombre;
      });
      setTipos(formateados);
    } catch {
      toast.error("Error al cargar tipos de mantenimiento");
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este mantenimiento?")) return;
    try {
      const result = await deleteMantenimiento(id);
      if (result.success) {
        toast.success("Mantenimiento eliminado correctamente");
        cargarMantenimientos();
      } else {
        toast.error(result.message || "No se pudo eliminar el mantenimiento");
      }
    } catch (error) {
      toast.error("Error inesperado al eliminar el mantenimiento");
      console.error(error);
    }
  };

  const handleCambiarEstado = async () => {
    if (!selectedMantenimiento || !selectedEstado) return;

    try {
      setLoadingEstados(true);
      const result = await updateEstadoEquipo(
        selectedMantenimiento.equipo_id,
        selectedEstado,
        selectedMantenimiento.id,
        selectedMantenimiento.comentario || ''
      );

      if (result.success) {
        toast.success("Estado del equipo actualizado correctamente");
        cargarMantenimientos();
        setShowEstadoModal(false);
      } else {
        toast.error(result.message || "Error al actualizar estado");
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar estado");
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
    });
    setSearchInput("");
  };


  const mapNombreToEstadoEquipo = (nombre: string): EstadoEquipo | undefined => {
    const lower = nombre.toLowerCase();

    if (lower.includes("no disponible")) return EstadoEquipo.NoDisponible; // primero
    if (lower.includes("dañado") || lower.includes("averiado")) return EstadoEquipo.Dañado;
    if (lower.includes("mantenimiento")) return EstadoEquipo.Mantenimiento;
    if (lower.includes("reposo")) return EstadoEquipo.EnReposo;
    if (lower.includes("disponible")) return EstadoEquipo.Disponible; // último

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

  // Función para determinar el color del badge según el estado
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
              placeholder="Buscar por equipo, tipo o usuario"
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
      </div>

      {showFilters && (
        <div className="border p-3 rounded mb-3">
          <div className="row g-3">
            <div className="col-md-6">
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
            <div className="col-md-6 d-flex align-items-end">
              <Button variant="outline-danger" onClick={resetFilters} className="w-100">
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
                    <tr key={m.id}>
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
                        {m.equipo?.estado ? (
                          <span className={`badge bg-${getEstadoBadgeColorByNombre(m.equipo.estado.nombre)}`}>
                            {m.equipo.estado.nombre}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Desconocido</span>
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
                            disabled={m.equipo?.estado?.id !== EstadoEquipo.Mantenimiento}
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
                            onClick={() => handleDelete(m.id)}
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
                    <td colSpan={9} className="text-center py-4 text-muted">
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
          <Modal.Title>Cambiar estado del equipo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMantenimiento && (
            <div>
              <p>
                Equipo: {selectedMantenimiento.equipo
                  ? `${selectedMantenimiento.equipo.numero_serie} - ${selectedMantenimiento.equipo.modelo?.nombre ?? ""}`
                  : "Sin equipo"}
              </p>
              <p>
                Estado actual: {selectedMantenimiento.equipo?.estado ? (
                  <span className={`badge bg-${getEstadoBadgeColorByNombre(selectedMantenimiento.equipo.estado.nombre)}`}>
                    {selectedMantenimiento.equipo.estado.nombre}
                  </span>
                ) : "Desconocido"}
              </p>

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
              <Form.Group className="mb-3">
                <Form.Label>Comentario (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedMantenimiento?.comentario || ''}
                  onChange={(e) => {
                    if (selectedMantenimiento) {
                      setSelectedMantenimiento({
                        ...selectedMantenimiento,
                        comentario: e.target.value
                      });
                    }
                  }}
                  placeholder="Agregue un comentario sobre el cambio de estado..."
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEstadoModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCambiarEstado}
            disabled={!selectedEstado || loadingEstados}
          >
            {loadingEstados ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
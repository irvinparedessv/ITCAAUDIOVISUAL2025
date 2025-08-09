import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Spinner, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
  FaFilter,
  FaEye
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";
import { getFuturosMantenimiento, deleteFuturoMantenimiento } from "~/services/futuroMantenimientoService";
import { getTiposMantenimiento } from "~/services/tipoMantenimientoService";
import { getMantenimientos } from "~/services/mantenimientoService";
import type { FuturoMantenimiento } from "~/types/futuroMantenimiento";
import { formatDate, formatTo12h } from "~/utils/time";

interface Filters {
  search: string;
  page: number;
  per_page: number;
  tipo_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface MantenimientoRelacionado {
  id: number;
  equipo_id: number;
  fecha_mantenimiento: string;
}

export default function FuturoMantenimientoList() {
  const [mantenimientos, setMantenimientos] = useState<FuturoMantenimiento[]>([]);
  const [mantenimientosRelacionados, setMantenimientosRelacionados] = useState<Record<number, MantenimientoRelacionado>>({});
  const [filters, setFilters] = useState<Filters>({
    search: "",
    page: 1,
    per_page: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false); // Nuevo estado para carga de filtros
  const [tipos, setTipos] = useState<Record<number, string>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => navigate("/equipos");

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const response = await getTiposMantenimiento();

      let tiposData = [];
      if (Array.isArray(response)) {
        tiposData = response;
      } else if (response && Array.isArray(response.data)) {
        tiposData = response.data;
      } else {
        throw new Error('Formato de respuesta inesperado');
      }

      const tiposActivos = tiposData
        .filter(tipo => tipo.estado === true || tipo.estado === 1)
        .reduce((acc: Record<number, string>, tipo) => {
          acc[tipo.id] = tipo.nombre;
          return acc;
        }, {});

      setTipos(tiposActivos);
    } catch (error) {
      console.error('Error al cargar tipos:', error);
      toast.error("No se pudieron cargar los tipos de mantenimiento");
      setTipos({});
    } finally {
      setLoading(false);
    }
  };

  const cargarMantenimientosRelacionados = async (futuroIds: number[]) => {
    try {
      const response = await getMantenimientos({ futuro_id: futuroIds });
      const relacionados = response.data.reduce((acc, m) => {
        if (m.futuro_mantenimiento_id) {
          acc[m.futuro_mantenimiento_id] = m;
        }
        return acc;
      }, {} as Record<number, MantenimientoRelacionado>);
      setMantenimientosRelacionados(relacionados);
    } catch (error) {
      console.error('Error al cargar mantenimientos relacionados:', error);
    }
  };

  const cargarMantenimientos = async () => {
    try {
      const response = await getFuturosMantenimiento(filters);
      setMantenimientos(response?.data || []);
      setLastPage(response?.last_page || 1);

      if (response?.data?.length > 0) {
        await cargarMantenimientosRelacionados(response.data.map(m => m.id));
      }
    } catch (error) {
      toast.error("Error al cargar mantenimientos futuros");
      setMantenimientos([]);
    } finally {
      setLoading(false);
      setFilterLoading(false); // Asegurarse de desactivar el loading de filtros
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await cargarTipos();
      await cargarMantenimientos();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      setFilterLoading(true); // Activar loading cuando cambian los filtros
      const timer = setTimeout(() => {
        cargarMantenimientos();
      }, 300); // Pequeño delay para evitar parpadeos en cambios rápidos

      return () => clearTimeout(timer);
    }
  }, [filters]);

  useEffect(() => {
    setFilterLoading(true); // Activar loading cuando se escribe en el search
    const delayDebounce = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const confirmarEliminacion = (id: number) => {
    const mantenimiento = mantenimientos.find(m => m.id === id);
    if (!mantenimiento) return;

    const equipoInfo = mantenimiento.equipo
      ? `${mantenimiento.equipo.numero_serie || 'Sin número de serie'}${mantenimiento.equipo.modelo ? ` (${mantenimiento.equipo.modelo.nombre})` : ''}`
      : 'Equipo desconocido';

    const toastId = `delete-toast-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Deseas eliminar el mantenimiento futuro programado para el equipo{' '}
            <strong>{equipoInfo}</strong>?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                try {
                  await deleteFuturoMantenimiento(id);
                  toast.dismiss(t.id);
                  toast.success(`Mantenimiento para ${equipoInfo} eliminado`, {
                    id: `${toastId}-success`,
                    duration: 4000,
                  });
                  cargarMantenimientos();
                } catch {
                  toast.dismiss(t.id);
                  toast.error(`Error al eliminar mantenimiento para ${equipoInfo}`, {
                    id: `${toastId}-error`,
                    duration: 4000,
                  });
                }
              }}
            >
              Sí, eliminar
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
      { duration: 10000, id: toastId }
    );
  };

  const handleFilterUpdate = (key: string, value: any) => {
    setFilterLoading(true); // Activar loading al cambiar filtros
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilterLoading(true); // Activar loading al cambiar página
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const resetFilters = () => {
    setFilterLoading(true); // Activar loading al resetear filtros
    setSearchInput("");
    setFilters({
      search: "",
      page: 1,
      per_page: 10,
      tipo_id: undefined,
      fecha_inicio: undefined,
      fecha_fin: undefined,
    });
  };

  const yaPasoFechaYHora = (fecha: string, hora: string) => {
    const fechaHora = new Date(`${fecha}T${hora}`);
    const ahora = new Date();
    return fechaHora < ahora;
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{ cursor: "pointer", fontSize: "2rem" }}
          />
          <h2 className="fw-bold m-0">Mantenimientos Futuros</h2>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate(`/futuroMantenimiento/crear`)}
          className="d-flex align-items-center gap-2"
          style={{ transition: "transform 0.2s ease-in-out" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FaPlus /> Crear Mantenimiento Futuro
        </Button>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="flex-grow-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por equipo, usuario o tipo"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <Button variant="outline-secondary" onClick={() => setSearchInput("")}>
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>
        <Button
          variant={showFilters ? "primary" : "outline-secondary"}
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0 position-relative"
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
                disabled={filterLoading}
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
              <Form.Label>Rango de Fechas</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="date"
                  placeholder="Desde"
                  value={filters.fecha_inicio || ""}
                  onChange={(e) =>
                    handleFilterUpdate("fecha_inicio", e.target.value || undefined)
                  }
                  disabled={filterLoading}
                />
                <Form.Control
                  type="date"
                  placeholder="Hasta"
                  value={filters.fecha_fin || ""}
                  onChange={(e) =>
                    handleFilterUpdate("fecha_fin", e.target.value || undefined)
                  }
                  min={filters.fecha_inicio}
                  disabled={filterLoading}
                />
              </div>
            </div>

            <div className="col-12 d-flex justify-content-end gap-2">
              <Button 
                variant="outline-danger" 
                onClick={resetFilters}
                disabled={filterLoading}
              >
                <FaTimes className="me-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {(loading || filterLoading) ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>Tipo de Mantenimiento</th>
                  <th>Fecha Programada</th>
                  <th>Hora Inicio</th>
                  <th>Fecha Final Programada</th>
                  <th>Hora Final</th>
                  <th>Usuario</th>
                  <th>Detalle</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length > 0 ? (
                  mantenimientos.map((item) => {
                    const mantenimientoRelacionado = mantenimientosRelacionados[item.id];
                    const tieneRelacion = !!mantenimientoRelacionado;
                    const yaPasado = yaPasoFechaYHora(item.fecha_mantenimiento, item.hora_mantenimiento_inicio);

                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          {item.equipo
                            ? `${item.equipo.numero_serie} - ${item.equipo.modelo?.nombre ?? ""} (${item.equipo.modelo?.marca?.nombre ?? ""})`
                            : "Sin equipo"}
                        </td>
                        <td>{item.tipo_mantenimiento?.nombre || "-"}</td>
                        <td>{formatDate(item.fecha_mantenimiento)}</td>
                        <td>{formatTo12h(item.hora_mantenimiento_inicio)}</td>
                        <td>{formatDate(item.fecha_mantenimiento_final) || "-"}</td>
                        <td>{formatTo12h(item.hora_mantenimiento_final)}</td>
                        <td>
                          {item.usuario
                            ? `${item.usuario.first_name ?? ""} ${item.usuario.last_name ?? ""}`.trim()
                            : "Sin usuario"}
                        </td>
                        <td>{item.detalles || "-"}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            {tieneRelacion && (
                              <Button
                                variant="outline-info"
                                className="rounded-circle"
                                title="Ver mantenimiento relacionado"
                                onClick={() => navigate('/mantenimiento', {
                                  state: {
                                    highlightId: mantenimientoRelacionado.id,
                                    fromFuturo: true
                                  }
                                })}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  transition: "transform 0.2s ease-in-out",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              >
                                <FaEye />
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              className="rounded-circle"
                              title={
                                yaPasado
                                  ? "Ya no se puede editar un mantenimiento pasado"
                                  : "Editar"
                              }
                              onClick={() => navigate(`/futuroMantenimiento/editar/${item.id}`)}
                              disabled={yaPasado}
                              style={{
                                width: "44px",
                                height: "44px",
                                transition: "transform 0.2s ease-in-out",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              className="rounded-circle"
                              title="Eliminar"
                              onClick={() => confirmarEliminacion(item.id)}
                              disabled={yaPasado}
                              style={{
                                width: "44px",
                                height: "44px",
                                transition: "transform 0.2s ease-in-out",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted">
                      No se encontraron mantenimientos futuros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {mantenimientos.length > 0 && (
            <PaginationComponent
              page={filters.page}
              totalPages={lastPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
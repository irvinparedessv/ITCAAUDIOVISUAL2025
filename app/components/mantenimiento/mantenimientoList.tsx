import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaSearch,
  FaTimes,
  FaFilter,
  FaPlus,
  FaLongArrowAltLeft,
  FaTrash,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";
import type { Mantenimiento } from "../../types/mantenimiento";
import { getMantenimientos, deleteMantenimiento } from "../../services/mantenimientoService";
import { getTiposMantenimiento } from "~/services/tipoMantenimientoService";

export default function MantenimientoList() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    per_page: 10,
    tipo_id: undefined as number | undefined,
  });
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/equipos");
  };

  const cargarTipos = async () => {
    try {
      // Ya no se necesita el token aquí ni validarlo
      const data = await getTiposMantenimiento();
      const tiposActivos = data.filter((tipo: any) => tipo.estado === true);

      const tiposFormateados: Record<number, string> = {};
      tiposActivos.forEach((tipo: any) => {
        tiposFormateados[tipo.id] = tipo.nombre;
      });

      setTipos(tiposFormateados);
    } catch (error) {
      toast.error("Error al cargar tipos de mantenimiento");
    }
  };

  const cargarMantenimientos = async () => {
    setLoading(true);
    try {
      // Tampoco pasamos token aquí
      const response = await getMantenimientos(filters);
      setMantenimientos(response.data || []);
      setLastPage(response.last_page || 1);
    } catch (error) {
      toast.error("Error al cargar mantenimientos");
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este mantenimiento?")) return;

    try {
      // No pasamos token aquí
      const result = await deleteMantenimiento(id);
      if (result.success) {
        toast.success("Mantenimiento eliminado correctamente");
        cargarMantenimientos(); // refresca la lista
      } else {
        toast.error(result.message || "No se pudo eliminar el mantenimiento");
      }
    } catch (error) {
      toast.error("Error inesperado al eliminar el mantenimiento");
      console.error(error);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  useEffect(() => {
    cargarMantenimientos();
  }, [filters]);

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
          <h2 className="fw-bold m-0">Listado de Mantenimientos</h2>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate("/mantenimientos/nuevo")}
          className="d-flex align-items-center gap-2"
          style={{ transition: "transform 0.2s ease-in-out" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FaPlus /> Nuevo Mantenimiento
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
              placeholder="Buscar por equipo o usuario"
              value={filters.search}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
            {filters.search && (
              <Button
                variant="outline-secondary"
                onClick={() => handleFilterUpdate("search", "")}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>

        <Button
          variant="outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center gap-2"
          style={{ transition: "transform 0.2s ease-in-out" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FaFilter />
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
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
              <Button
                variant="outline-danger"
                onClick={resetFilters}
                className="w-100"
              >
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
                  <th>Fecha</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Vida Útil</th>
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
                      <td>{m.fecha_mantenimiento}</td>
                      <td>{m.hora_mantenimiento_inicio}</td>
                      <td>{m.hora_mantenimiento_final}</td>
                      <td>{m.tipo_mantenimiento?.nombre ?? "-"}</td>
                      <td>
                        {m.usuario
                          ? `${m.usuario.first_name ?? ""} ${m.usuario.last_name ?? ""}`.trim()
                          : "Sin usuario"}
                      </td>
                      <td>{m.vida_util ?? "-"}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            title="Editar mantenimiento"
                            onClick={() => navigate(`/mantenimientos/editar/${m.id}`)}
                            style={{ minWidth: "44px", minHeight: "44px" }}
                            className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            title="Eliminar mantenimiento"
                            onClick={() => handleDelete(m.id)}
                            style={{ minWidth: "44px", minHeight: "44px" }}
                            className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
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
    </div>
  );
}

import { useEffect, useState } from "react";
import type { Equipo, EquipoFilters, TipoEquipo } from "app/types/equipo";
import { Button, Form, InputGroup } from "react-bootstrap";
import toast from "react-hot-toast";
import { FaEdit, FaFilter, FaTrash, FaTimes, FaSearch } from "react-icons/fa";
import { getEquipos } from "../../services/equipoService";
import { useNavigate } from "react-router-dom";

interface Props {
  tipos: TipoEquipo[];
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
}

export default function EquipoList({ tipos, onEdit, onDelete }: Props) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filters, setFilters] = useState<EquipoFilters>({
    search: "",
    page: 1,
    perPage: 5,
  });
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchEquipos = async () => {
    try {
      const res = await getEquipos(filters);
      setEquipos(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total);
      setLastPage(res.last_page);
    } catch (error) {
      toast.error("Error al cargar los equipos");
      console.error("Error fetching equipos:", error);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, [filters]);

  const getTipoNombre = (id: number) => {
    const tipo = tipos.find((t) => t.id === id);
    return tipo ? tipo.nombre : "Desconocido";
  };

  const confirmarEliminacion = (id: number) => {
    toast(
      (t) => (
        <div>
          <p>¿Seguro que deseas eliminar este equipo?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                onDelete(id);
                toast.dismiss(t.id);
                toast.success("Equipo eliminado");
                fetchEquipos();
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
      { duration: 5000 }
    );
  };

  const handleFilterUpdate = <K extends keyof EquipoFilters>(
    key: K,
    value: EquipoFilters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page: page,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      page: 1,
      perPage: 5,
      tipoEquipoId: undefined,
      estado: undefined,
    });
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <h4 className="mb-3 text-center">Listado de Equipos</h4>

      {/* Buscador con icono y limpiar + botón de filtros */}
      <div className="d-flex flex-wrap justify-content-between mb-3 gap-2">
        <div className="flex-grow-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre o descripción"
              value={filters.search || ""}
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
        >
          <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
      </div>


      {/* Filtros avanzados */}
      {showFilters && (
        <div className="p-3 rounded mb-4 border border-secondary">
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Tipo de equipo</Form.Label>
                <Form.Select
                  value={filters.tipoEquipoId || ""}
                  onChange={(e) =>
                    handleFilterUpdate(
                      "tipoEquipoId",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                >
                  <option value="">Todos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={
                    filters.estado === undefined
                      ? ""
                      : filters.estado
                      ? "true"
                      : "false"
                  }
                  onChange={(e) =>
                    handleFilterUpdate(
                      "estado",
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true"
                    )
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Disponible</option>
                  <option value="false">No disponible</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-12">
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

      {/* Tabla de equipos */}
      <table className="table table-hover align-middle text-center overflow-hidden">
        <thead className="table-dark">
          <tr>
            <th className="rounded-top-start">Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Imagen</th>
            <th className="rounded-top-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.length > 0 ? (
            equipos.map((equipo) => (
              <tr key={equipo.id}>
                <td className="fw-bold">{equipo.nombre}</td>
                <td>{equipo.descripcion}</td>
                <td>
                  <span
                    className={`badge ${
                      equipo.estado ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {equipo.estado ? "Disponible" : "No disponible"}
                  </span>
                </td>
                <td>{equipo.cantidad}</td>
                <td>
                  <em>{getTipoNombre(equipo.tipo_equipo_id)}</em>
                </td>
                <td>
                  {equipo.imagen_url ? (
                    <img
                      src={equipo.imagen_url}
                      alt={equipo.nombre}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <span className="text-muted">Sin imagen</span>
                  )}
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="outline-primary"
                      className="rounded-circle"
                      title="Editar equipo"
                      style={{ width: "44px", height: "44px" }}
                      onClick={() => navigate(`/equipos/editar/${equipo.id}`)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="rounded-circle"
                      title="Eliminar equipo"
                      style={{ width: "44px", height: "44px" }}
                      onClick={() => confirmarEliminacion(equipo.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-muted text-center">
                No se encontraron equipos.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {lastPage > 1 && (
        <nav className="d-flex justify-content-center mt-3">
          <ul className="pagination">
            <li className={`page-item ${filters.page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange((filters.page || 1) - 1)}
              >
                Anterior
              </button>
            </li>
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((num) => (
              <li
                key={num}
                className={`page-item ${
                  filters.page === num ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                filters.page === lastPage ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange((filters.page || 1) + 1)}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

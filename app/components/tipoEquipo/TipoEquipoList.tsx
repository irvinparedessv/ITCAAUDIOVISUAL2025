import { useEffect, useState } from "react";
import { getTipoEquipo } from "../../services/tipoEquipoService";
import type { TipoEquipo } from "app/types/tipoEquipo";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaLongArrowAltLeft, FaPlus, FaFilter, FaTimes, FaSearch } from "react-icons/fa";
import { Button, Spinner, Form, InputGroup, Badge } from "react-bootstrap";
import PaginationComponent from "~/utils/Pagination";
import { useNavigate } from "react-router-dom";

interface Props {
  onEdit: (tipo: TipoEquipo) => void;
  onDelete: (id: number) => void;
  onSuccess: () => void;
}

export default function TipoEquipoList({ onEdit, onDelete, onSuccess }: Props) {
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    perPage: 5,
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Función para determinar el color según la categoría
  const getCategoryColor = (categoryName: string) => {
    if (!categoryName) return 'secondary';
    const lowerName = categoryName.toLowerCase();
    return lowerName.includes('equipo') ? 'primary' :
      lowerName.includes('insumo') ? 'info' : 'light';
  };

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const res = await getTipoEquipo(filters.page);
      setTipos(res.data);
      setTotalPaginas(res.last_page);
    } catch (error) {
      console.error("Error al cargar tipos de equipo:", error);
      toast.error("Error al cargar tipos de equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, [filters.page]);

  const handleEdit = (tipo: TipoEquipo) => {
    onEdit(tipo);
  };

  const handleBack = () => {
    navigate("/inventario");
  };

  const handleFilterUpdate = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      page: 1,
      perPage: 5,
    });
  };

  const confirmarEliminacion = async (id: number) => {
    const tipoAEliminar = tipos.find((tipo) => tipo.id === id);
    if (!tipoAEliminar) return;

    const toastId = `eliminar-tipo-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Seguro que deseas eliminar el tipo de equipo{" "}
            <strong>{tipoAEliminar.nombre}</strong>?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await onDelete(id);
                toast.dismiss(t.id);
                toast.success(`Tipo de equipo ${tipoAEliminar.nombre} eliminado`);
                cargarTipos();
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
        duration: 8000,
        id: toastId,
      }
    );
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: 'pointer',
              fontSize: '2rem',
            }}
          />
          <h2 className="fw-bold m-0">Listado de Tipos de Equipo</h2>
        </div>

        <div className="d-flex align-items-center gap-2 ms-md-0 ms-auto">
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => navigate('/formTipoEquipo')}
          >
            <FaPlus />
            Nuevo Tipo de Equipo
          </Button>
        </div>
      </div>

      {/* Buscador + Filtros */}
      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="d-flex flex-grow-1">
          <InputGroup className="flex-grow-1">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre"
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
          variant={showFilters ? "secondary" : "outline-secondary"}
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center gap-2"
        >
          <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
      </div>

      {showFilters && (
        <div className="p-3 rounded mb-4 border border-secondary">
          <div className="row g-3">
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

      {loading ? (
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
                  <th>Categoría</th>
                  <th className="rounded-top-start">Nombre</th>
                  <th>Características</th>
                  <th className="rounded-top-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tipos.length > 0 ? (
                  tipos.map((tipo) => (
                    <tr key={tipo.id}>
                      <td>
                        {tipo.categoria?.nombre ? (
                          <Badge
                            bg={getCategoryColor(tipo.categoria.nombre)}
                            className="text-capitalize"
                            pill
                            style={{ fontSize: '0.9em' }}
                          >
                            {tipo.categoria.nombre}
                          </Badge>
                        ) : (
                          <Badge bg="secondary" pill>
                            Sin categoría
                          </Badge>
                        )}
                      </td>
                      <td className="fw-bold">{tipo.nombre}</td>
                      <td className="text-start">
                        {tipo.caracteristicas?.length ? (
                          <ul className="mb-0 small">
                            {tipo.caracteristicas.map((c) => (
                              <li key={c.id}>
                                {c.nombre} <span className="text-muted">({c.tipo_dato})</span>
                              </li>
                            ))}
                          </ul>
                        ) : 'Sin características'}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Editar tipo"
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out"
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                            onClick={() => navigate(`/tipoEquipo/${tipo.id}`)}
                          >
                            <FaEdit />
                          </Button>

                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title="Eliminar tipo"
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out"
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                            onClick={() => confirmarEliminacion(tipo.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-muted text-center">
                      No se encontraron tipos de equipo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationComponent
            page={filters.page}
            totalPages={totalPaginas}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
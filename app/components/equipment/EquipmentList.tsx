import { useEffect, useState } from "react";
import type { Equipo, EquipoFilters, TipoEquipo } from "app/types/equipo";
import { Button, Form, InputGroup, Spinner, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { FaEdit, FaFilter, FaTrash, FaTimes, FaSearch, FaLongArrowAltLeft, FaPlus } from "react-icons/fa";
import { getEquipos } from "../../services/equipoService";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";

interface Props {
  tipos: TipoEquipo[];
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
}

export default function EquipmentList({ tipos, onEdit, onDelete }: Props) {
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
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    imageUrl: string;
    name: string;
  } | null>(null);

  const fetchEquipos = async () => {
    setLoading(false);
    try {
      const res = await getEquipos(filters);
      setEquipos(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total);
      setLastPage(res.last_page);
    } catch (error) {
      toast.error("Error al cargar los equipos");
      console.error("Error fetching equipos:", error);
    } finally {
      setLoading(true);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, [filters]);

  const getTipoNombre = (id: number) => {
    const tipo = tipos.find((t) => t.id === id);
    return tipo ? tipo.nombre : "Desconocido";
  };

  const handleImageClick = (imageUrl: string, equipmentName: string) => {
    setSelectedEquipment({
      imageUrl,
      name: equipmentName
    });
    setShowImageModal(true);
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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="rounded shadow p-3 mt-4 position-relative">
      {/* Modal para imagen ampliada */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedEquipment?.name || 'Imagen del equipo'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={selectedEquipment?.imageUrl}
            alt={selectedEquipment?.name || 'Imagen ampliada'}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: '8px',
              objectFit: 'contain'
            }}
          />
        </Modal.Body>
      </Modal>

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
          <h2 className="fw-bold m-0">Listado de Equipos</h2>
        </div>

        <Button
          variant="primary"
          className="d-flex align-items-center gap-2 ms-md-0 ms-auto"
          onClick={() => navigate('/equipo')}
        >
          <FaPlus />
          Crear Nuevo Equipo
        </Button>
      </div>

      {/* Buscador + botón de filtros */}
      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        {/* Input con ícono */}
        <div className="d-flex flex-grow-1">
          <InputGroup className="flex-grow-1">
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

        {/* Botón de filtros */}
        <Button
          variant="outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center gap-2 flex-shrink-0 text-nowrap align-self-end align-self-md-center w-auto"
          style={{ whiteSpace: 'nowrap' }}
        >
          <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
      </div>

      {!loading && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      )}

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

      {loading && (
        <>
          <div className="table-container" style={{ 
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginBottom: '1rem',
            borderRadius: '0.375rem',
            border: '1px solid #dee2e6'
          }}>
            <table className="table table-hover align-middle text-center mb-0" style={{ 
              minWidth: '800px',
              width: '100%',
              marginBottom: 0
            }}>
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
                          className={`badge ${equipo.estado ? "bg-success" : "bg-danger"
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
                              cursor: "pointer"
                            }}
                            onClick={() => {
                              if (equipo.imagen_url) {
                                handleImageClick(equipo.imagen_url, equipo.nombre);
                              }
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
                            onClick={() => onEdit(equipo)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title="Eliminar equipo"
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
          </div>

          <PaginationComponent
            page={filters.page || 1}
            totalPages={lastPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
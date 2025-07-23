import { useEffect, useState } from "react";
import { Spinner, Table, Badge, Button, Form, InputGroup } from "react-bootstrap";
import api from "../../api/axios";
import { FaEye, FaBoxes, FaLongArrowAltLeft, FaFilter, FaTimes, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";

interface ResumenItem {
  modelo_id: number;
  nombre_categoria: string;
  nombre_tipo_equipo: string;
  nombre_marca: string;
  nombre_modelo: string;
  cantidad_total: number;
  cantidad_disponible: number;
  cantidad_eliminada: number;
  equipos_id_disponibles: string | null;
  series_disponibles: string | null;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Equipo': 'primary',
    'Insumo': 'info',
  };
  return colors[category] || 'light';
};

export default function InventoryList() {
  const [datos, setDatos] = useState<ResumenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    categoria: "",
    tipo_equipo: "",
    marca: "",
    page: 1,
    perPage: 10
  });

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/resumen-inventario", {
        params: filters
      });
      setDatos(res.data.data);
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
    } catch (error) {
      console.error("Error cargando resumen:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewEquipment = (modeloId: number) => {
    navigate(`/inventarioEquipo/${modeloId}`);
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      categoria: "",
      tipo_equipo: "",
      marca: "",
      page: 1,
      perPage: 10
    });
  };

  return (
    <div className="rounded shadow p-3 mt-4">
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
          <h2 className="fw-bold m-0">
            <FaBoxes className="me-2" />
            Inventario
          </h2>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="d-flex flex-grow-1">
          <InputGroup className="flex-grow-1">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por modelo, marca, tipo..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
            {filters.search && (
              <Button
                variant="outline-secondary"
                onClick={() => handleFilterChange("search", "")}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>

        <Button
          variant={showFilters ? "secondary" : "outline-secondary"}
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center gap-2 flex-shrink-0 text-nowrap"
        >
          <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="p-3 rounded mb-4 border border-secondary">
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange("categoria", e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  <option value="Equipo">Equipo</option>
                  <option value="Insumo">Insumo</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Repuesto">Repuesto</option>
                  <option value="Consumible">Consumible</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Tipo de equipo</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Filtrar por tipo"
                  value={filters.tipo_equipo}
                  onChange={(e) => handleFilterChange("tipo_equipo", e.target.value)}
                />
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Marca</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Filtrar por marca"
                  value={filters.marca}
                  onChange={(e) => handleFilterChange("marca", e.target.value)}
                />
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

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando inventario...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table bordered hover className="text-center align-middle" style={{ borderColor: '#dee2e6' }}>
              <thead className="table-dark">
                <tr>
                  <th style={{ borderTopLeftRadius: '10px', borderColor: '#dee2e6' }}>Categoría</th>
                  <th style={{ borderColor: '#dee2e6' }}>Tipo Equipo</th>
                  <th style={{ borderColor: '#dee2e6' }}>Marca</th>
                  <th style={{ borderColor: '#dee2e6' }}>Modelo</th>
                  <th style={{ borderColor: '#dee2e6' }}>Total</th>
                  <th style={{ borderColor: '#dee2e6' }}>Disponibles</th>
                  <th style={{ borderColor: '#dee2e6' }}>Dañados</th>
                  <th style={{ borderColor: '#dee2e6' }}>Series Disponibles</th>
                  <th style={{ borderTopRightRadius: '10px', borderColor: '#dee2e6' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datos.length > 0 ? (
                  datos.map((item) => (
                    <tr key={item.modelo_id}>
                      <td style={{ borderColor: '#dee2e6' }}>
                        <Badge
                          bg={getCategoryColor(item.nombre_categoria)}
                          className="text-capitalize"
                          pill
                          style={{ fontSize: '0.9em' }}
                        >
                          {item.nombre_categoria}
                        </Badge>
                      </td>
                      <td style={{ borderColor: '#dee2e6' }}><em>{item.nombre_tipo_equipo}</em></td>
                      <td style={{ borderColor: '#dee2e6' }}>{item.nombre_marca}</td>
                      <td style={{ borderColor: '#dee2e6' }}>{item.nombre_modelo}</td>
                      <td style={{ borderColor: '#dee2e6' }}>
                        <Badge bg="secondary" pill>
                          {item.cantidad_total}
                        </Badge>
                      </td>
                      <td style={{ borderColor: '#dee2e6' }}>
                        <Badge bg="success" pill>
                          {item.cantidad_disponible}
                        </Badge>
                      </td>
                      <td style={{ borderColor: '#dee2e6' }}>
                        <Badge bg="danger" pill>
                          {item.cantidad_eliminada}
                        </Badge>
                      </td>
                      <td style={{ fontSize: "0.9rem", textAlign: "left", borderColor: '#dee2e6' }}>
                        {item.series_disponibles || "-"}
                      </td>
                      <td style={{ borderColor: '#dee2e6' }}>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="Ver equipos"
                            onClick={() => handleViewEquipment(item.modelo_id)}
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                              borderColor: '#dee2e6'
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <FaEye />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-muted text-center" style={{ borderColor: '#dee2e6' }}>
                      No se encontraron registros con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <PaginationComponent
            page={page}
            totalPages={lastPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
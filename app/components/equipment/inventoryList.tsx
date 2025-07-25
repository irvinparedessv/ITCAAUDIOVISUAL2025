import { useEffect, useState } from "react";
import { Spinner, Badge, Button, Form, InputGroup } from "react-bootstrap";
import api from "../../api/axios";
import { FaEye, FaBoxes, FaLongArrowAltLeft, FaFilter, FaTimes, FaSearch, FaTools, FaToolbox, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";
import toast from "react-hot-toast";

interface ResumenItem {
  modelo_id: number;
  nombre_categoria: string;
  nombre_tipo_equipo: string;
  nombre_marca: string;
  nombre_modelo: string;
  cantidad_total: number;
  cantidad_disponible: number;
  cantidad_mantenimiento: number;
  cantidad_eliminada: number;
  accesorios_completos: string | null;
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
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");

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
      setLastPage(res.data.last_page);
    } catch (error) {
      console.error("Error cargando resumen:", error);
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [filters]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterChange("search", searchInput);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

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
    setSearchInput("");
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{ cursor: 'pointer', fontSize: '2rem' }}
          />
          <h2 className="fw-bold m-0"> <FaBoxes className="me-2" />Inventario</h2>
        </div>
        <div className="d-flex align-items-center gap-2 ms-md-0 ms-auto">
          <Button
            variant="primary"
            onClick={() => navigate('/tipoEquipo')}
            className="d-inline-flex align-items-center gap-2 me-2"
          >
            <FaTools />
            Tipo de Equipo
          </Button>
          <Button
            variant="success"
            onClick={() => navigate('/crearItem')}
            className="d-inline-flex align-items-center gap-2"
            style={{ padding: '12px' }}
          >
            <FaPlus />
            Agregar Equipo
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="flex-grow-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por modelo, marca, tipo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchInput("")}
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
        <div className="p-3 rounded mb-4 bg-light">
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
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <FaTimes />
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
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th className="rounded-top-start">Categoría</th>
                  <th>Tipo Equipo</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Total</th>
                  <th>Disponibles</th>
                  <th>Mantenimiento</th>
                  <th>Dañados</th>
                  <th>Accesorios</th>
                  <th className="rounded-top-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datos.length > 0 ? (
                  datos.map((item) => (
                    <tr key={`${item.modelo_id}-${item.nombre_categoria}`}>
                      <td>
                        <Badge
                          bg={getCategoryColor(item.nombre_categoria)}
                          className="text-capitalize"
                          pill
                          style={{ fontSize: '0.9em' }}
                        >
                          {item.nombre_categoria}
                        </Badge>
                      </td>
                      <td><em>{item.nombre_tipo_equipo}</em></td>
                      <td>{item.nombre_marca}</td>
                      <td>{item.nombre_modelo}</td>
                      <td>
                        <Badge bg="secondary" pill>
                          {item.cantidad_total}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="success" pill>
                          {item.cantidad_disponible}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="warning" pill>
                          {item.cantidad_mantenimiento}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="danger" pill>
                          {item.cantidad_eliminada}
                        </Badge>
                      </td>
                      <td style={{ fontSize: "0.9rem", textAlign: "left" }}>
                        {item.accesorios_completos || "-"}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Ver equipos"
                            onClick={() => handleViewEquipment(item.modelo_id)}
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
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-secondary"
                            className="rounded-circle"
                            title="Asociar accesorios"
                            onClick={() => navigate(`/modelo/${item.modelo_id}/accesorios`)}
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
                            disabled={item.nombre_categoria === "Insumo"} 
                          >
                            <FaToolbox />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-muted">
                      No se encontraron registros con los filtros aplicados.
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
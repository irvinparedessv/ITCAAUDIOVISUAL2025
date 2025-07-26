import { useEffect, useState, useMemo } from "react";
import { Spinner, Badge, Button, Form, InputGroup } from "react-bootstrap";
import api from "../../api/axios";
import { FaEye, FaBoxes, FaLongArrowAltLeft, FaFilter, FaTimes, FaSearch, FaTools, FaToolbox, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";
import toast from "react-hot-toast";
import AsyncSelect from "react-select/async";
import { useTheme } from "~/hooks/ThemeContext";

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

interface SelectOption {
  value: string;
  label: string;
  originalId: number; // Cambiado de opcional a obligatorio
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Equipo': 'primary',
    'Insumo': 'info',
  };
  return colors[category] || 'light';
};

const searchMarcasForFilter = async (
  inputValue: string
): Promise<Array<{ value: string; label: string; originalId: number }>> => {
  try {
    const response = await api.get('/marcas', {
      params: { 
        search: inputValue, 
        limit: 10,
        fields: 'id,nombre'
      }
    });
    return response.data.data.map((marca: any) => ({
      value: marca.nombre,
      label: marca.nombre,
      originalId: marca.id
    }));
  } catch (error) {
    console.error("Error buscando marcas:", error);
    toast.error("Error al cargar marcas");
    return [];
  }
};

const searchTiposEquipoForFilter = async (
  inputValue: string
): Promise<Array<{ value: string; label: string; originalId: number }>> => {
  try {
    const response = await api.get('/tipoEquipos', {
      params: { 
        search: inputValue, 
        limit: 10,
        fields: 'id,nombre,categoria_id'
      }
    });
    return response.data.data.map((tipo: any) => ({
      value: tipo.nombre,
      label: `${tipo.nombre} (${tipo.categoria_id === 1 ? 'Equipo' : 'Insumo'})`,
      originalId: tipo.id
    }));
  } catch (error) {
    console.error("Error buscando tipos de equipo:", error);
    toast.error("Error al cargar tipos de equipo");
    return [];
  }
};

export default function InventoryList() {
  const [datos, setDatos] = useState<ResumenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const { darkMode } = useTheme();

  const [filters, setFilters] = useState({
    search: "",
    categoria: "",
    tipo_equipo: "",
    marca: "",
    page: 1,
    perPage: 10,
    marca_id: "",
    tipo_equipo_id: ""
  });

  const customSelectStyles = useMemo(() => ({
    control: (base: any, { isDisabled }: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      borderColor: darkMode ? "#444" : "#ccc",
      color: darkMode ? "#f8f9fa" : "#212529",
      minHeight: '38px',
      opacity: isDisabled ? 0.7 : 1,
      cursor: isDisabled ? 'not-allowed' : 'default',
      boxShadow: 'none',
      ':hover': {
        borderColor: darkMode ? "#666" : "#adb5bd"
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: darkMode ? "#2d2d2d" : "#fff",
      color: darkMode ? "#f8f9fa" : "#212529",
      zIndex: 9999,
      marginTop: '2px'
    }),
    input: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: darkMode ? "#f8f9fa" : "#212529",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: darkMode ? "#bbb" : "#6c757d",
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? (darkMode ? "#555" : "#d3d3d3")
        : isFocused
          ? (darkMode ? "#444" : "#e6e6e6")
          : "transparent",
      color: darkMode ? "#f8f9fa" : "#212529",
      cursor: "pointer",
      ':active': {
        backgroundColor: darkMode ? "#666" : "#e9ecef"
      }
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      padding: '0 8px'
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: darkMode ? "#aaa" : "#666",
      ':hover': {
        color: darkMode ? "#fff" : "#333"
      }
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: darkMode ? "#aaa" : "#666",
      ':hover': {
        color: darkMode ? "#fff" : "#333"
      }
    })
  }), [darkMode]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const params = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
        )
      };

      const res = await api.get("/resumen-inventario", { params });
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
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterChange("search", searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewEquipment = (modeloId: number) => {
    navigate(`/inventarioEquipo/${modeloId}`);
  };

  const handleBack = () => {
    navigate("/equipos");
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleMarcaChange = (selected: SelectOption | null) => {
    handleFilterChange("marca", selected?.value || "");
    handleFilterChange("marca_id", selected?.originalId ? String(selected.originalId) : "");
  };

  const handleTipoEquipoChange = (selected: SelectOption | null) => {
    handleFilterChange("tipo_equipo", selected?.value || "");
    handleFilterChange("tipo_equipo_id", selected?.originalId ? String(selected.originalId) : "");

    if (selected?.label?.includes("Equipo")) {
      handleFilterChange("categoria", "Equipo");
    } else if (selected?.label?.includes("Insumo")) {
      handleFilterChange("categoria", "Insumo");
    }
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      categoria: "",
      tipo_equipo: "",
      marca: "",
      page: 1,
      perPage: 10,
      marca_id: "",
      tipo_equipo_id: ""
    });
    setSearchInput("");
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
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
            onClick={() => navigate('/crearItem')}
            className="d-inline-flex align-items-center gap-2"
          >
            <FaPlus />
            Agregar Equipo
          </Button>
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
                <Form.Label>Tipo de Equipo</Form.Label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={searchTiposEquipoForFilter}
                  value={
                    filters.tipo_equipo
                      ? { 
                          value: filters.tipo_equipo, 
                          label: filters.tipo_equipo,
                          originalId: Number(filters.tipo_equipo_id)
                        }
                      : null
                  }
                  onChange={handleTipoEquipoChange}
                  placeholder="Buscar tipo de equipo..."
                  noOptionsMessage={({ inputValue }) =>
                    inputValue ? "No se encontraron tipos" : "Escribe para buscar..."
                  }
                  loadingMessage={() => "Buscando tipos..."}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  isClearable
                />
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Marca</Form.Label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={searchMarcasForFilter}
                  value={
                    filters.marca
                      ? { 
                          value: filters.marca, 
                          label: filters.marca,
                          originalId: Number(filters.marca_id)
                        }
                      : null
                  }
                  onChange={handleMarcaChange}
                  placeholder="Buscar marca..."
                  noOptionsMessage={({ inputValue }) =>
                    inputValue ? "No se encontraron marcas" : "Escribe para buscar..."
                  }
                  loadingMessage={() => "Buscando marcas..."}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  isClearable
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
                Limpiar todos los filtros
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
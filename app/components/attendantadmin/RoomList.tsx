import { useEffect, useState } from "react";
import type { Aula, AulaFilters } from "app/types/aula";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaCheck,
  FaUser,
  FaLongArrowAltLeft,
  FaPlus,
} from "react-icons/fa";
import { getAulas, deleteAula } from "../../services/aulaService";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";

export default function AulaList() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [filters, setFilters] = useState<AulaFilters>({
    search: "",
    page: 1,
    perPage: 5,
  });
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const fetchAulas = async () => {
    try {
      setLoading(true);
      const res = await getAulas(filters);
      setAulas(res.data || []);
      setTotal(res.total);
      setLastPage(res.last_page);
    } catch (error) {
      toast.error("Error al cargar aulas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAulas();
  }, [filters]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterUpdate("search", searchInput);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const confirmarEliminacion = (id: number, name: string) => {
    const toastId = `delete-aula-${id}`; // ID único por aula

    toast.dismiss(); // Cierra cualquier toast abierto anteriormente

    toast(
      (t) => (
        <div>
          <p>¿Desea eliminar el aula <strong>{name}</strong>?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                try {
                  await deleteAula(id);
                  toast.dismiss(t.id);
                  toast.success(`Aula "${name}" eliminada`, {
                    id: `${toastId}-success`,
                  });
                  fetchAulas();
                } catch (error) {
                  toast.dismiss(t.id);
                  toast.error(`Error al eliminar el aula "${name}"`, {
                    id: `${toastId}-error`,
                  });
                }
              }}
            >
              Sí
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
      {
        duration: 5000,
        id: toastId,
      }
    );
  };



  const handleFilterUpdate = <K extends keyof AulaFilters>(
    key: K,
    value: AulaFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="mb-4">
        {/* Título y flecha */}
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: 'pointer',
              fontSize: '2rem',
            }}
          />
          <h2 className="fw-bold m-0 flex-grow-1">Listado de Aulas</h2>
        </div>

        {/* Botón, separado y alineado en mobile y desktop */}
        <div className="text-end mt-3">
          <Button
            variant="primary"
            onClick={() => navigate("/createRoom")}
            className="d-inline-flex align-items-center gap-2"
          >
            <FaPlus />
            Crear Aula
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
              placeholder="Buscar por nombre"
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
      </div>
      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">


        {/* Filtro por imagen */}
        <Form.Select
          value={filters.has_images === null ? "" : filters.has_images ? "yes" : "no"}
          onChange={(e) => {
            const val = e.target.value;
            handleFilterUpdate(
              "has_images",
              val === "yes" ? true : val === "no" ? false : null
            );
          }}
        >
          <option value="">Todas</option>
          <option value="yes">Con imagen</option>
          <option value="no">Sin imagen</option>
        </Form.Select>
      </div>


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
                  <th className="rounded-top-start">Nombre</th>
                  <th>Imagen</th>
                  <th>Encargados</th>
                  <th className="rounded-top-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {aulas.length > 0 ? (
                  aulas.map((aula) => (
                    <tr key={aula.id}>
                      <td className="fw-bold">{aula.name}</td>
                      <td>
                        {aula.has_images ? (
                          <FaCheck className="text-success" title="Con imagen" />
                        ) : (
                          <FaTimes className="text-muted" title="Sin imagen" />
                        )}
                      </td>
                      <td className="text-start">
                        {aula.encargados.length > 0 ? (
                          <>
                            {aula.encargados.length > 0 && (
                              <ul
                                className="mb-0 ps-3"
                                style={{
                                  listStyleType: "disc",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {aula.encargados.map((enc) => (
                                  <li
                                    key={enc.id}
                                    style={{
                                      marginBottom: "0.3rem",
                                      fontWeight: 500,
                                      color: "var(--bs-body-color)",
                                    }}
                                    title={`ID: ${enc.id}`}
                                  >
                                    {enc.first_name} {enc.last_name}{" "}
                                    <small style={{ color: "var(--bs-secondary-text)", fontWeight: 400 }}>
                                      (ID: {enc.id})
                                    </small>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>

                        ) : (
                          <label>Sin encargados</label>
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-success"
                            className="rounded-circle"
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
                            onClick={() => navigate(`/aulas/encargados/${aula.id}`)}
                            title="Asignar encargados"
                          >
                            <FaUser />
                          </Button>
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
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
                            onClick={() => navigate(`/aulas/editar/${aula.id}`)}
                            title="Editar aula"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
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
                            onClick={() => confirmarEliminacion(aula.id, aula.name)}
                            title="Eliminar aula"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      No se encontraron aulas.
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
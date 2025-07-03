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
  FaChevronDown,
  FaChevronUp,
  FaLongArrowAltLeft,
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
    navigate(-1); // Regresa a la página anterior
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

  const confirmarEliminacion = (id: number) => {
    toast(
      (t) => (
        <div>
          <p>¿Eliminar esta aula?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                await deleteAula(id);
                toast.dismiss(t.id);
                toast.success("Aula eliminada");
                fetchAulas();
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
      { duration: 5000 }
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
      <div className="d-flex justify-content-between align-items-center mb-4 position-relative">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: 'pointer',
              fontSize: '2rem',
            }}
          />
          <h2 className="fw-bold m-0">Listado de Aulas</h2>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="primary" onClick={() => navigate("/createRoom")}>
            + Crear Aula
          </Button>
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between mb-3 gap-2">
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
          {loading ? (
            <tr>
              <td colSpan={4} className="text-center py-4">
                <Spinner animation="border" role="status" />
              </td>
            </tr>
          ) : aulas.length > 0 ? (
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
                  {aula.encargados.length > 0 && (
                    <>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpand(aula.id)}
                      >
                        {expandedRow === aula.id ? (
                          <>
                            Ocultar <FaChevronUp />
                          </>
                        ) : (
                          <>
                            Ver <FaChevronDown />
                          </>
                        )}
                      </Button>

                      {expandedRow === aula.id && (
                        <ul className="mb-0 mt-2 ps-3">
                          {aula.encargados.map((enc) => (
                            <li key={enc.id}>
                              {enc.first_name} {enc.last_name} (ID: {enc.id})
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  {aula.encargados.length === 0 && (
                    <label>Sin encargados</label>
                  )}
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="outline-success"
                      className="rounded-circle"
                      style={{ width: 44, height: 44 }}
                      onClick={() => navigate(`/aulas/encargados/${aula.id}`)}
                      title="Asignar encargados"
                    >
                      <FaUser />
                    </Button>
                    <Button
                      variant="outline-warning"
                      className="rounded-circle"
                      style={{ width: 44, height: 44, transition: "transform 0.2s ease-in-out" }}
                      title="Editar reserva"
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onClick={() => navigate(`/aulas/editar/${aula.id}`)}
                    >
                      <FaEdit />
                    </Button>

                    <Button
                      variant="outline-danger"
                      className="rounded-circle"
                      style={{ width: 44, height: 44 }}
                      onClick={() => confirmarEliminacion(aula.id)}
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

      <PaginationComponent
        page={filters.page || 1}
        totalPages={lastPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

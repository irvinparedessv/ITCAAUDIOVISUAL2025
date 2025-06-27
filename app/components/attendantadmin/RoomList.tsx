import { useEffect, useState } from "react";
import type { Aula, AulaFilters } from "app/types/aula";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaFilter,
  FaTrash,
  FaTimes,
  FaSearch,
  FaCheck,
} from "react-icons/fa";
import { getAulas, deleteAula } from "../../services/aulaService";
import { useNavigate } from "react-router-dom";
import { APPLARAVEL } from "./../../constants/constant";

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
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    }, 1000);
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

  const resetFilters = () => {
    setFilters({ search: "", page: 1, perPage: 5 });
    setSearchInput("");
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Listado de Aulas</h4>
        <Button variant="success" onClick={() => navigate("/createRoom")}>
          + Crear Aula
        </Button>
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

        {/*  <Button
          variant="outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center gap-2"
        >
          <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button> */}
      </div>

      <table className="table table-hover align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th className="rounded-top-start">Nombre</th>
            <th>Imagen</th>
            <th className="rounded-top-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="text-center py-4">
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
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="outline-primary"
                      className="rounded-circle"
                      style={{ width: 44, height: 44 }}
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
              <td colSpan={3} className="text-muted">
                No se encontraron aulas.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
                className={`page-item ${filters.page === num ? "active" : ""}`}
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

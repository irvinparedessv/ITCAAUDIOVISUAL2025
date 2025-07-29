import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";
import { getFuturosMantenimiento, deleteFuturoMantenimiento } from "~/services/futuroMantenimientoService";
import type { FuturoMantenimiento } from "app/types/futuroMantenimiento";

export default function FuturoMantenimientoList() {
  const [mantenimientos, setMantenimientos] = useState<FuturoMantenimiento[]>([]);
  const [filters, setFilters] = useState<any>({
    search: "",
    page: 1,
    per_page: 10,
  });
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigate("/equipos");
  };

  const cargarMantenimientos = async () => {
    setLoading(true);
    try {
      const response = await getFuturosMantenimiento(filters);
      setMantenimientos(response?.data || []);
      setLastPage(response?.last_page || 1);
    } catch (error) {
      toast.error("Error al cargar mantenimientos");
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMantenimientos();
  }, [filters]);

  const confirmarEliminacion = (id: number) => {
    const toastId = `delete-toast-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>¿Deseas eliminar este mantenimiento futuro?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                try {
                  await deleteFuturoMantenimiento(id);
                  toast.dismiss(t.id);
                  toast.success("Mantenimiento eliminado", { id: `${toastId}-success` });
                  cargarMantenimientos();
                } catch {
                  toast.dismiss(t.id);
                  toast.error("Error al eliminar", { id: `${toastId}-error` });
                }
              }}
            >
              Sí, eliminar
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(t.id)}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000, id: toastId }
    );
  };

  const handleFilterUpdate = (key: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({
      ...prev,
      page: page,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      page: 1,
      per_page: 10,
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
          <h2 className="fw-bold m-0">Mantenimientos Futuros</h2>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate(`/futuroMantenimiento/crear`)}
          className="d-flex align-items-center gap-2"
          style={{ transition: "transform 0.2s ease-in-out" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FaPlus /> Crear Futuro Mantenimiento
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
              placeholder="Buscar por equipo o tipo"
              value={filters.search}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
            {filters.search && (
              <Button variant="outline-secondary" onClick={() => handleFilterUpdate("search", "")}>
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
          <FaFilter /> {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
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
                  <th>ID</th>
                  <th>Equipo</th>
                  <th>Tipo de Mantenimiento</th>
                  <th>Fecha Programada</th>
                  <th>Hora Inicio</th>
                  <th>Hora Final</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length > 0 ? (
                  mantenimientos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.equipo?.numero_serie || "-"}</td>
                      <td>{item.tipo_mantenimiento?.nombre || "-"}</td>
                      <td>{item.fecha_mantenimiento}</td>
                      <td>{item.hora_mantenimiento_inicio || "-"}</td>
                      <td>{item.hora_mantenimiento_final || "-"}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Editar"
                            onClick={() => navigate(`/futuroMantenimiento/editar/${item.id}`)}
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title="Eliminar"
                            onClick={() => confirmarEliminacion(item.id)}
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No se encontraron mantenimientos futuros.
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

import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaTimes,
  FaPlus,
  FaLongArrowAltLeft,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";
import { getFuturosMantenimiento, deleteFuturoMantenimiento } from "~/services/futuroMantenimientoService";
import type { FuturoMantenimiento } from "app/types/futuroMantenimiento";
import { formatDate, formatTo12h } from "~/utils/time";

export default function FuturoMantenimientoList() {
  const [mantenimientos, setMantenimientos] = useState<FuturoMantenimiento[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    per_page: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleBack = () => navigate("/equipos");

  const cargarMantenimientos = async () => {
    setLoading(true);
    try {
      const response = await getFuturosMantenimiento(filters);
      setMantenimientos(response?.data || []);
      setLastPage(response?.last_page || 1);
    } catch (error) {
      toast.error("Error al cargar mantenimientos futuros");
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMantenimientos();
  }, [filters]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const confirmarEliminacion = (id: number) => {
    const mantenimiento = mantenimientos.find(m => m.id === id);
    if (!mantenimiento) return;

    const equipoInfo = mantenimiento.equipo
      ? `${mantenimiento.equipo.numero_serie || 'Sin número de serie'}${mantenimiento.equipo.modelo ? ` (${mantenimiento.equipo.modelo.nombre})` : ''
      }`
      : 'Equipo desconocido';

    const toastId = `delete-toast-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Deseas eliminar el mantenimiento futuro programado para el equipo{' '}
            <strong>{equipoInfo}</strong>?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                try {
                  await deleteFuturoMantenimiento(id);
                  toast.dismiss(t.id);
                  toast.success(`Mantenimiento para ${equipoInfo} eliminado`, {
                    id: `${toastId}-success`,
                    duration: 4000,
                  });
                  cargarMantenimientos();
                } catch {
                  toast.dismiss(t.id);
                  toast.error(`Error al eliminar mantenimiento para ${equipoInfo}`, {
                    id: `${toastId}-error`,
                    duration: 4000,
                  });
                }
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
      { duration: 10000, id: toastId }
    );
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      page: 1,
      per_page: 10,
    });
  };

  const yaPasoFechaYHora = (fecha: string, hora: string) => {
    const fechaHora = new Date(`${fecha}T${hora}`);
    const ahora = new Date();
    return fechaHora < ahora;
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
          <FaPlus /> Crear Mantenimiento
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <Button variant="outline-secondary" onClick={() => setSearchInput("")}>
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>
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
                  <th>#</th>
                  <th>Equipo</th>
                  <th>Tipo de Mantenimiento</th>
                  <th>Fecha Programada</th>
                  <th>Hora Inicio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length > 0 ? (
                  mantenimientos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        {item.equipo
                          ? `${item.equipo.numero_serie} - ${item.equipo.modelo?.nombre ?? ""} (${item.equipo.modelo?.marca?.nombre ?? ""})`
                          : "Sin equipo"}
                      </td>
                      <td>{item.tipo_mantenimiento?.nombre || "-"}</td>
                      <td>{formatDate(item.fecha_mantenimiento)}</td>
                      <td>{formatTo12h(item.hora_mantenimiento_inicio)}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title={
                              yaPasoFechaYHora(item.fecha_mantenimiento, item.hora_mantenimiento_inicio)
                                ? "Ya no se puede editar un mantenimiento pasado"
                                : "Editar"
                            }
                            onClick={() => navigate(`/futuroMantenimiento/editar/${item.id}`)}
                            disabled={yaPasoFechaYHora(item.fecha_mantenimiento, item.hora_mantenimiento_inicio)}
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
                            disabled={yaPasoFechaYHora(item.fecha_mantenimiento, item.hora_mantenimiento_inicio)}
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
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No se encontraron mantenimientos futuros.
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
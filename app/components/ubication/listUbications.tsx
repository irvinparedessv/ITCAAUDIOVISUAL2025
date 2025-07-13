import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUbicacionesPaginadas,
  deleteUbicacion,
} from "../../services/ubicationService";
import toast from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash, FaLongArrowAltLeft, FaSearch, FaTimes } from "react-icons/fa";
import { Button, Spinner, Form, InputGroup } from "react-bootstrap";
import PaginationComponent from "~/utils/Pagination";

interface Ubicacion {
  id: number;
  nombre: string;
  descripcion: string;
}

interface PaginationData {
  data: Ubicacion[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

const ITEMS_PER_PAGE = 5;

export default function UbicacionList() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true); // Inicialmente en true para mostrar spinner
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const cargarUbicaciones = async (page: number) => {
    try {
      setLoading(true);
      const res: PaginationData = await getUbicacionesPaginadas(
        page,
        ITEMS_PER_PAGE,
        search
      );
      setUbicaciones(res.data);
      setLastPage(res.last_page);
    } catch (error) {
      console.error("Error cargando ubicaciones:", error);
      toast.error("Error cargando ubicaciones");
      setUbicaciones([]); // Asegurarse de que el estado no quede undefined
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUbicaciones(currentPage);
  }, [currentPage, search]);

  const handleDelete = async (id: number, nombre: string) => {
    const toastId = `delete-confirmation-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>¿Seguro que deseas eliminar la ubicación <strong>{nombre}</strong>?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await toast.promise(deleteUbicacion(id), {
                    loading: "Eliminando...",
                    success: "Ubicación eliminada",
                    error: "Error al eliminar",
                  });
                  await cargarUbicaciones(currentPage); // Esperar a recargar
                } catch (error) {
                  console.error("Error eliminando ubicación:", error);
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
      {
        duration: 5000,
        id: toastId,
      }
    );
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
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
          <h2 className="fw-bold m-0">Listado de Ubicaciones</h2>
        </div>

        <Button
          variant="primary"
          className="d-flex align-items-center gap-2 ms-md-0 ms-auto"
          onClick={() => navigate("/ubications/add")}
        >
          <FaPlus />
          Agregar Ubicación
        </Button>
      </div>

      {/* Buscador */}
      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="d-flex flex-grow-1">
          <InputGroup className="flex-grow-1">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearch("")}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando ubicaciones...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th className="rounded-top-start">Nombre</th>
                  <th>Descripción</th>
                  <th className="rounded-top-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.length > 0 ? (
                  ubicaciones.map((ubicacion) => (
                    <tr key={ubicacion.id}>
                      <td className="fw-bold">{ubicacion.nombre}</td>
                      <td>{ubicacion.descripcion}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Editar ubicación"
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
                            onClick={() =>
                              navigate(`/ubications/edit/${ubicacion.id}`)
                            }
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title="Eliminar ubicación"
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
                            onClick={() => handleDelete(ubicacion.id, ubicacion.nombre)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-muted text-center">
                      {search ? "No se encontraron ubicaciones con ese criterio de búsqueda" : "No hay ubicaciones registradas"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {ubicaciones.length > 0 && (
            <PaginationComponent
              page={currentPage}
              totalPages={lastPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
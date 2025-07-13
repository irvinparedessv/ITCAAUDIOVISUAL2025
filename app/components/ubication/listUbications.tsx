import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUbicacionesPaginadas,
  deleteUbicacion,
} from "../../services/ubicationService";
import toast from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { Button, Spinner } from "react-bootstrap";
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();

  const cargarUbicaciones = async (page: number) => {
    setLoading(true);
    try {
      const res: PaginationData = await getUbicacionesPaginadas(
        page,
        ITEMS_PER_PAGE
      );
      setUbicaciones(res.data);
      setLastPage(res.last_page);
    } catch (error) {
      toast.error("Error cargando ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUbicaciones(currentPage);
  }, [currentPage]);

  const handleDelete = async (id: number) => {
    const confirmId = toast(
      (t) => (
        <span>
          ¿Seguro que quieres eliminar?
          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={async () => {
                toast.dismiss(t.id);
                await toast.promise(deleteUbicacion(id), {
                  loading: "Eliminando...",
                  success: "Ubicación eliminada",
                  error: "Error al eliminar",
                });
                cargarUbicaciones(currentPage);
              }}
            >
              Sí
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        </span>
      ),
      { duration: 6000 }
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-primary"
          onClick={() => navigate("/ubications/add")}
        >
          <FaPlus className="me-2" />
          Agregar Ubicación
        </button>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando ubicaciones...</p>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ubicaciones.map((ubicacion) => (
                <tr key={ubicacion.id}>
                  <td>{ubicacion.nombre}</td>
                  <td>{ubicacion.descripcion}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        className="rounded-circle"
                        title="Editar ubicacion"
                        onClick={() =>
                          navigate(`/ubications/edit/${ubicacion.id}`)
                        }
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
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        className="rounded-circle"
                        title="Eliminar ubicacion"
                        onClick={() => handleDelete(ubicacion.id)}
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
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <PaginationComponent
            page={currentPage}
            totalPages={lastPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}

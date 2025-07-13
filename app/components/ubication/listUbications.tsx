import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUbicacionesPaginadas,
  deleteUbicacion,
} from "../../services/ubicationService";
import toast from "react-hot-toast";

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
      setCurrentPage(res.current_page);
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
    if (!confirm("¿Seguro que quieres eliminar esta ubicación?")) return;

    try {
      await deleteUbicacion(id);
      toast.success("Ubicación eliminada");
      cargarUbicaciones(currentPage);
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div>
      <h2>Listado de Ubicaciones</h2>

      <button
        className="btn btn-success mb-3"
        onClick={() => navigate("/ubications/add")}
      >
        Agregar Ubicación
      </button>

      {loading ? (
        <p>Cargando ubicaciones...</p>
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
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() =>
                        navigate(`/ubications/edit/${ubicacion.id}`)
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(ubicacion.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
              </li>

              {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                <li
                  key={page}
                  className={`page-item ${
                    page === currentPage ? "active" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  currentPage === lastPage ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === lastPage}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}

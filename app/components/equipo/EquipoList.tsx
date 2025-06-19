import { useEffect, useState } from "react";
import type { Equipo } from "app/types/equipo";
import type { TipoEquipo } from "app/types/tipoEquipo";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getEquipos } from "../../services/equipoService";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  tipos: TipoEquipo[];
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
}

export default function EquipoList({ tipos, onEdit, onDelete }: Props) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / perPage);
  const [lastPage, setLastPage] = useState(1);
    const navigate = useNavigate();



  const fetchEquipos = async () => {
    try {
      const res = await getEquipos({ search, page, perPage });

      setEquipos(Array.isArray(res.data) ? res.data : []);
      setTotal(typeof res.total === "number" ? res.total : 0);
      setLastPage(res.last_page); // 👈 usa el valor del backend
    } catch (error) {
      toast.error("Error al cargar los equipos");
    }
  };



  useEffect(() => {
    fetchEquipos();
  }, [search, page]);

  const getTipoNombre = (id: number) => {
    const tipo = tipos.find((t) => t.id === id);
    return tipo ? tipo.nombre : "Desconocido";
  };

  const confirmarEliminacion = (id: number) => {
    toast(
      (t) => (
        <div>
          <p>¿Seguro que deseas eliminar este equipo?</p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                onDelete(id);
                toast.dismiss(t.id);
                toast.success("Equipo eliminado");
                fetchEquipos();
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
      }
    );
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <h4 className="mb-3 text-center">Listado de Equipos</h4>

      <div className="mb-3 d-flex justify-content-end">
        <input
          type="text"
          className="form-control w-auto"
          placeholder="Buscar por nombre o descripción"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <table
        className="table table-hover align-middle text-center overflow-hidden"
        style={{ borderRadius: "0.8rem" }}
      >
        <thead className="table-dark">
          <tr>
            <th className="rounded-top-start">Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Imagen</th>
            <th className="rounded-top-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.length > 0 ? (
            equipos.map((equipo) => (
              <tr key={equipo.id}>
                <td className="fw-bold">{equipo.nombre}</td>
                <td>{equipo.descripcion}</td>
                <td>
                  <span
                    className={`badge ${
                      equipo.estado ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {equipo.estado ? "Disponible" : "No disponible"}
                  </span>
                </td>
                <td>{equipo.cantidad}</td>
                <td>
                  <em>{getTipoNombre(equipo.tipo_equipo_id)}</em>
                </td>
                <td>
                  {equipo.imagen_url ? (
                    <img
                      src={equipo.imagen_url}
                      alt={equipo.nombre}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <span className="text-muted">Sin imagen</span>
                  )}
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">

                    <button
                        className="btn btn-outline-primary rounded-circle"
                        title="Editar equipo"
                        style={{ width: "44px", height: "44px" }}
                        onClick={() => navigate(`/equipos/editar/${equipo.id}`)}
                      >
                        <FaEdit />
                    </button>

                    <button
                      className="btn btn-outline-danger rounded-circle"
                      title="Eliminar equipo"
                      onClick={() => confirmarEliminacion(equipo.id)}
                      style={{ width: "44px", height: "44px" }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                No se encontraron equipos
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {lastPage >= 1 && (
        <nav className="mt-3 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </button>
            </li>
            {[...Array(lastPage)].map((_, index) => (
              <li
                key={index}
                className={`page-item ${page === index + 1 ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setPage(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${page === lastPage ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
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

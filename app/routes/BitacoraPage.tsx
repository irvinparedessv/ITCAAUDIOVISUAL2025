import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Bitacora } from "app/types/bitacora";
import { Badge } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const getDefaultDates = () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    inicio: formatDate(sevenDaysAgo),
    fin: formatDate(today),
  };
};

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<Bitacora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState<string>("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    const { inicio, fin } = getDefaultDates();
    setFechaInicio(inicio);
    setFechaFin(fin);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page,
        };

        if (moduloFiltro !== "todos") params.modulo = moduloFiltro;
        if (fechaInicio) params.fecha_inicio = fechaInicio;
        if (fechaFin) params.fecha_fin = fechaFin;

        const query = new URLSearchParams(params).toString();
        const response = await api.get(`/bitacora?${query}`);
        setRegistros(response.data.data);
        setLastPage(response.data.last_page);
      } catch (error) {
        toast.error("Error al cargar la bitácora");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, moduloFiltro, fechaInicio, fechaFin]);

  const filteredRegistros = registros.filter(
    (log) =>
      log.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4 className="mb-0">Bitácora del Sistema</h4>
          </div>

          <form className="border rounded p-3">
            <div className="row gy-3 gx-4">
              <div className="col-md-3">
                <label className="form-label">Módulo</label>
                <select
                  className="form-select"
                  value={moduloFiltro}
                  onChange={(e) => {
                    setPage(1);
                    setModuloFiltro(e.target.value);
                  }}
                >
                  <option value="todos">Todos los módulos</option>
                  <option value="Reserva Aula">Reserva Aula</option>
                  <option value="Reserva Equipo">Reserva Equipo</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Fecha inicio</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaInicio}
                  onChange={(e) => {
                    setPage(1);
                    setFechaInicio(e.target.value);
                  }}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Fecha fin</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaFin}
                  onChange={(e) => {
                    setPage(1);
                    setFechaFin(e.target.value);
                  }}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Buscar</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Usuario, acción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 text-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    const { inicio, fin } = getDefaultDates();
                    setModuloFiltro("todos");
                    setFechaInicio(inicio);
                    setFechaFin(fin);
                    setSearchTerm("");
                    setPage(1);
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </form>
        </div>
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th className="rounded-top-start">Fecha</th>
              <th>Usuario</th>
              <th>Módulo</th>
              <th>Acción</th>
              <th className="rounded-top-end">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRegistros.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              filteredRegistros.map((log) => (
                <tr key={log.id}>
                  <td className="text-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="fw-semibold">{log.nombre_usuario}</td>
                  <td>
                    <Badge bg="info" className="px-2 py-1">
                      {log.modulo}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      bg={getActionBadgeColor(log.accion)}
                      className="px-2 py-1"
                    >
                      {log.accion}
                    </Badge>
                  </td>
                  <td className="text-break" style={{ maxWidth: "300px" }}>
                    {log.descripcion}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {lastPage > 1 && (
          <nav className="mt-3 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Anterior
                </button>
              </li>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((num) => (
                <li
                  key={num}
                  className={`page-item ${num === page ? "active" : ""}`}
                >
                  <button className="page-link" onClick={() => setPage(num)}>
                    {num}
                  </button>
                </li>
              ))}
              <li className={`page-item ${page === lastPage ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((prev) => Math.min(prev + 1, lastPage))}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

function getActionBadgeColor(accion: string) {
  switch (accion.toLowerCase()) {
    case "crear":
    case "creación":
      return "success";
    case "editar":
    case "actualizar":
      return "warning";
    case "eliminar":
      return "danger";
    case "login":
      return "primary";
    default:
      return "secondary";
  }
}

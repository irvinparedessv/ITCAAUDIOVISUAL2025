import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Bitacora } from "app/types/bitacora";
import { Badge, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { FaLongArrowAltLeft, FaSearch, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";

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
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

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

  const resetFilters = () => {
    const { inicio, fin } = getDefaultDates();
    setModuloFiltro("todos");
    setFechaInicio(inicio);
    setFechaFin(fin);
    setSearchTerm("");
    setPage(1);
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: "pointer",
              fontSize: "2rem",
            }}
          />
          <h2 className="fw-bold m-0 flex-grow-1">Bitácora de estados</h2>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="flex-grow-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por usuario, acción o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <Form.Select
          value={moduloFiltro}
          onChange={(e) => {
            setPage(1);
            setModuloFiltro(e.target.value);
          }}
        >
          <option value="todos">Todos los módulos</option>
          <option value="Reserva Aula">Reserva Aula</option>
          <option value="Reserva Equipo">Reserva Equipo</option>
        </Form.Select>

        <Form.Control
          type="date"
          value={fechaInicio}
          onChange={(e) => {
            setPage(1);
            setFechaInicio(e.target.value);
          }}
        />

        <Form.Control
          type="date"
          value={fechaFin}
          onChange={(e) => {
            setPage(1);
            setFechaFin(e.target.value);
          }}
        />

        <Button
          variant="outline-danger"
          onClick={resetFilters}
        >
          Limpiar filtros
        </Button>
      </div>

      {isLoading ? (
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
                  <th className="rounded-top-start">Fecha</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th className="rounded-top-end">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistros.length > 0 ? (
                  filteredRegistros.map((log) => (
                    <tr key={log.id}>
                      <td className="text-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="fw-bold">{log.nombre_usuario}</td>
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
                ) : (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      No se encontraron resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationComponent
            page={page}
            totalPages={lastPage}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}
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
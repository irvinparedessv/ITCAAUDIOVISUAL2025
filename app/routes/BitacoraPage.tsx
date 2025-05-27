import { useEffect, useState } from 'react';
import api from '~/api/axios';
import type { Bitacora } from '~/types/bitacora';
import { Badge } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<Bitacora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/bitacora');
        setRegistros(response.data.data);
      } catch (error) {
        toast.error("Error al cargar la bitácora");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRegistros = registros.filter(log => 
    log.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Bitácora del Sistema</h4>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                  {searchTerm ? "No se encontraron resultados" : "No hay registros en la bitácora"}
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
                    <Badge bg={getActionBadgeColor(log.accion)} className="px-2 py-1">
                      {log.accion}
                    </Badge>
                  </td>
                  <td className="text-break" style={{ maxWidth: '300px' }}>
                    {log.descripcion}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getActionBadgeColor(accion: string) {
  switch (accion.toLowerCase()) {
    case 'crear':
    case 'creación':
      return 'success';
    case 'editar':
    case 'actualizar':
      return 'warning';
    case 'eliminar':
      return 'danger';
    case 'login':
      return 'primary';
    default:
      return 'secondary';
  }
}
import { useEffect, useState } from "react";
import { Button, Spinner, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaLongArrowAltLeft, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import type { TipoMantenimiento } from "../../types/tipoMantenimiento";
import {
  getTiposMantenimiento,
  deleteTipoMantenimiento,
} from "../../services/tipoMantenimientoService";
import FormTipoMantenimientoModal from "../FormTipoMantenimiento";
import TipoMantenimientoEditModal from "./tipoMantenimientoEdit";


export default function TipoMantenimientoList() {
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchTipos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token no encontrado");

      const tipos = await getTiposMantenimiento();
      setTipos(tipos);
    } catch (error) {
      toast.error("Error al cargar los tipos de mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
  const tipo = tipos.find(t => t.id === id);
  if (!tipo) return;

  // Mostrar diálogo de confirmación personalizado
  const toastId = `eliminar-tipo-${id}`;
  toast.dismiss();

  toast(
    (t) => (
      <div className="p-2">
        <p className="mb-2">
          ¿Seguro que deseas eliminar el tipo de mantenimiento{" "}
          <strong>{tipo.nombre}</strong>?
        </p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              try {
                const result = await deleteTipoMantenimiento(id);
                toast.dismiss(t.id);
                
                if (result.success) {
                  toast.success(
                    `Tipo de mantenimiento "${tipo.nombre}" eliminado correctamente`,
                    { duration: 4000 }
                  );
                  await fetchTipos();
                } else {
                  toast.error(
                    result.message || `Error al eliminar "${tipo.nombre}"`,
                    { duration: 4000 }
                  );
                }
              } catch (error) {
                console.error("Error al eliminar:", error);
                toast.error(
                  `Error inesperado al eliminar "${tipo.nombre}"`,
                  { duration: 4000 }
                );
              }
            }}
          >
            Sí, eliminar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ),
    {
      duration: 10000, // 10 segundos para decidir
      id: toastId,
    }
  );
};

  const handleEditClick = (id: number) => {
    setSelectedTipoId(id);
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const handleBack = () => {
    navigate("/equipos");
  };

  return (
    <div className="container mt-4">
      <div className="table-responsive rounded shadow p-3">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <FaLongArrowAltLeft
              onClick={handleBack}
              title="Regresar"
              style={{ cursor: "pointer", fontSize: "2rem" }}
            />
            <h2 className="fw-bold m-0">Tipos de Mantenimiento</h2>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="d-flex align-items-center gap-2"
            style={{ transition: "transform 0.2s ease-in-out" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <FaPlus /> Nuevo Tipo
          </Button>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando tipos de mantenimiento...</p>
          </div>
        ) : tipos.length === 0 ? (
          <p className="text-center text-muted">No hay tipos de mantenimiento registrados.</p>
        ) : (
          <Table striped bordered hover responsive className="text-center">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td>{tipo.id}</td>
                  <td>{tipo.nombre}</td>
                  <td>{tipo.estado ? "Activo" : "Inactivo"}</td>
                  <td className="d-flex justify-content-center gap-2">
                    <Button
                      variant="outline-primary"
                      title="Editar"
                      onClick={() => handleEditClick(tipo.id)}
                      className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      title="Eliminar"
                      onClick={() => handleDelete(tipo.id)}
                      className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Modal para crear nuevo tipo */}
        <FormTipoMantenimientoModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={fetchTipos}
        />

        {/* Modal para editar tipo */}
        {selectedTipoId && (
          <TipoMantenimientoEditModal
            show={showEditModal}
            onHide={() => {
              setShowEditModal(false);
              setSelectedTipoId(null);
            }}
            tipoId={selectedTipoId}
            onSuccess={fetchTipos}
          />
        )}
      </div>
    </div>
  );
}
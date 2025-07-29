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

export default function TipoMantenimientoList() {
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchTipos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token no encontrado");

      const tipos = await getTiposMantenimiento(); // ya es directamente el arreglo
      setTipos(tipos);
    } catch (error) {
      toast.error("Error al cargar los tipos de mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este tipo de mantenimiento?")) return;

    try {
      const result = await deleteTipoMantenimiento(id);

      if (result.success) {
        toast.success("Tipo eliminado correctamente");
        fetchTipos();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error inesperado al eliminar el tipo");
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const handleBack = () => {
    navigate("/equipos");
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
          <h2 className="fw-bold m-0">Tipos de Mantenimiento</h2>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate("/tipoMantenimiento/nuevo")}
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
                    onClick={() => navigate(`/tipoMantenimiento/editar/${tipo.id}`)}
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
    </div>
  );
}

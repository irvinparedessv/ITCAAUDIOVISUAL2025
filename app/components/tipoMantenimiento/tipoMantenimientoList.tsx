import { useEffect, useState } from "react";
import { Button, Spinner, Table, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaLongArrowAltLeft, FaPlus, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import type { TipoMantenimiento } from "../../types/tipoMantenimiento";
import { getTiposMantenimiento, deleteTipoMantenimiento } from "../../services/tipoMantenimientoService";
import FormTipoMantenimientoModal from "../FormTipoMantenimiento";
import TipoMantenimientoEditModal from "./tipoMantenimientoEdit";

export default function TipoMantenimientoList() {
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [filteredTipos, setFilteredTipos] = useState<TipoMantenimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchTipos = async () => {
    setLoading(true);
    try {
      const tipos = await getTiposMantenimiento();
      setTipos(tipos);
      setFilteredTipos(tipos);
    } catch (error) {
      toast.error("Error al cargar los tipos de mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTipos(tipos);
    } else {
      const filtered = tipos.filter(tipo =>
        tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tipo.id.toString().includes(searchTerm)
      );
      setFilteredTipos(filtered);
    }
  }, [searchTerm, tipos]);

  const handleDelete = async (id: number) => {
    const tipo = tipos.find(t => t.id === id);
    if (!tipo) return;

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
        duration: 10000,
        id: toastId,
      }
    );
  };

  const handleEditClick = (id: number) => {
    setSelectedTipoId(id);
    setShowEditModal(true);
  };

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
          onClick={() => setShowCreateModal(true)}
          className="d-flex align-items-center gap-2"
          style={{ transition: "transform 0.2s ease-in-out" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FaPlus /> Nuevo Tipo
        </Button>
      </div>

      <div className="mb-3">
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Buscar por nombre o #"
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

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando tipos de mantenimiento...</p>
        </div>
      ) : filteredTipos.length === 0 ? (
        <p className="text-center text-muted py-4">
          {searchTerm ? "No se encontraron resultados" : "No hay tipos de mantenimiento registrados"}
        </p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td>{tipo.id}</td>
                  <td>{tipo.nombre}</td>
                  <td>
                    <span className={`badge bg-${tipo.estado ? "success" : "secondary"}`}>
                      {tipo.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-primary"
                        title="Editar"
                        onClick={() => handleEditClick(tipo.id)}
                        style={{
                          width: "44px",
                          height: "44px",
                          transition: "transform 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        title="Eliminar"
                        onClick={() => handleDelete(tipo.id)}
                        style={{
                          width: "44px",
                          height: "44px",
                          transition: "transform 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        className="d-flex justify-content-center align-items-center p-0 rounded-circle"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      <FormTipoMantenimientoModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={fetchTipos}
      />

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
  );
}
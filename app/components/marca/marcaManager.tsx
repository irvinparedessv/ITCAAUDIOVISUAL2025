import { useEffect, useState, useCallback } from "react";
import { Button, Spinner, Form, InputGroup, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import api from "../../api/axios";
import {
  FaSave,
  FaTimes,
  FaEdit,
  FaTrash,
  FaLongArrowAltLeft,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";

interface Marca {
  id: number;
  nombre: string;
  is_deleted?: boolean;
  modelos_count?: number; // Si tu backend lo incluye
}

export default function MarcaManager() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    perPage: 5,
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);
  const [formData, setFormData] = useState({ nombre: "" });

  const navigate = useNavigate();

  // Cambiado a /mar/marcas
  const fetchMarcas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/mar/marcas", {
        params: {
          search: filters.search,
          perPage: filters.perPage,
          page: filters.page,
        },
      });

      const data = res.data;
      if (Array.isArray(data.data)) {
        setMarcas(data.data);
        setTotalPaginas(data.last_page ?? 1);
      } else {
        setMarcas([]);
        setTotalPaginas(1);
      }
    } catch (err) {
      setMarcas([]);
      setTotalPaginas(1);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce(() => {
      fetchMarcas();
    }, 500),
    [filters.search, filters.page, filters.perPage]
  );

  useEffect(() => {
    fetchMarcas();
  }, [filters.page]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [filters.search]);

  const handleShow = (marca?: Marca) => {
    if (marca) {
      setEditing(marca);
      setFormData({ nombre: marca.nombre });
    } else {
      setEditing(null);
      setFormData({ nombre: "" });
    }
    setFormValidated(false);
    setShowModal(true);
  };

  const handleClose = () => {
    setFormData({ nombre: "" });
    setEditing(null);
    setShowModal(false);
    setFormValidated(false);
  };

  const handleFilterUpdate = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      page: 1,
      perPage: 5,
    });
  };

  // Cambiado a /mar/marcas
  const handleSubmit = async () => {
    setFormValidated(true);

    if (formData.nombre.trim() === "") {
      toast.error("Por favor, completa el nombre de la marca.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/mar/marcas/${editing.id}`, formData);
        toast.success("Marca actualizada correctamente.");
      } else {
        await api.post("/mar/marcas", formData);
        toast.success("Marca creada correctamente.");
      }
      fetchMarcas();
      handleClose();
    } catch (err) {
      toast.error("Ocurrió un error al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cambiado a /mar/marcas
  const confirmarEliminacion = async (id: number) => {
    const marca = marcas.find((m) => m.id === id);
    if (!marca) {
      toast.error("Marca no encontrada");
      return;
    }

    if (marca.modelos_count && marca.modelos_count > 0) {
      toast.error(
        `No se puede eliminar "${marca.nombre}" porque tiene ${marca.modelos_count} modelo(s) asociado(s)`,
        { duration: 5000 }
      );
      return;
    }

    const toastId = `eliminar-marca-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Seguro que deseas eliminar la marca <strong>{marca.nombre}</strong>
            ?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                try {
                  await api.delete(`/mar/marcas/${id}`);
                  toast.dismiss(t.id);
                  toast.success(
                    `Marca "${marca.nombre}" eliminada correctamente`,
                    { duration: 4000 }
                  );
                  await fetchMarcas();
                } catch (err: any) {
                  toast.dismiss(t.id);
                  toast.error("Error al eliminar la marca.", {
                    duration: 4000,
                  });
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

  const handleBack = () => {
    navigate("/equipos");
  };

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{
              cursor: "pointer",
              fontSize: "2rem",
            }}
          />
          <h2 className="fw-bold m-0">Gestión de Marcas</h2>
        </div>
        <div className="d-flex align-items-center gap-2 ms-md-0 ms-auto">
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => handleShow()}
          >
            <FaPlus />
            Nueva Marca
          </Button>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
        <div className="d-flex flex-grow-1">
          <InputGroup className="flex-grow-1">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre"
              value={filters.search}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
            {filters.search && (
              <Button
                variant="outline-secondary"
                onClick={() => handleFilterUpdate("search", "")}
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
          <p className="mt-3">Cargando datos...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th className="rounded-top-start">Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {marcas.length > 0 ? (
                  marcas.map((marca) => (
                    <tr key={marca.id}>
                      <td className="fw-bold">{marca.nombre}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Editar marca"
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
                            onClick={() => handleShow(marca)}
                          >
                            <FaEdit />
                          </Button>

                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title={
                              (marca.modelos_count || 0) > 0
                                ? `No se puede eliminar (${marca.modelos_count} modelo(s) asociado(s))`
                                : "Eliminar marca"
                            }
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                              opacity: (marca.modelos_count || 0) > 0 ? 0.6 : 1,
                              cursor:
                                (marca.modelos_count || 0) > 0
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            onMouseEnter={(e) => {
                              if (!(marca.modelos_count || 0)) {
                                e.currentTarget.style.transform = "scale(1.15)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            onClick={() => {
                              if (!(marca.modelos_count || 0)) {
                                confirmarEliminacion(marca.id);
                              }
                            }}
                            disabled={(marca.modelos_count || 0) > 0}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-muted text-center">
                      No se encontraron marcas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationComponent
            page={filters.page}
            totalPages={totalPaginas}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header className="text-white py-3"
          style={{ backgroundColor: "#b1291d" }} closeButton>
          <Modal.Title>
            {editing ? "Editar Marca" : "Agregar Marca"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={formValidated}>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                required
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                isInvalid={formValidated && formData.nombre.trim() === ""}
              />
              <Form.Control.Feedback type="invalid">
                Este campo es obligatorio.
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
            className="d-flex align-items-center gap-2"
          >
            {submitting ? <Spinner size="sm" animation="border" /> : <FaSave />}
            {editing ? "Actualizar" : "Crear"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="d-flex align-items-center gap-2"
          >
            <FaTimes />
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

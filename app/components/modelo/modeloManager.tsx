import { useEffect, useState, useCallback } from "react";
import {
  Button,
  Spinner,
  Form,
  InputGroup,
  Badge,
  Modal,
} from "react-bootstrap";
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
  FaFilter,
  FaSearch,
  FaImages,
} from "react-icons/fa";
import PaginationComponent from "~/utils/Pagination";

interface Modelo {
  id: number;
  nombre: string;
  marca_id: number;
  marca: { nombre: string };
  equipos_count?: number;
}

interface Marca {
  id: number;
  nombre: string;
}

export default function ModeloManager() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    perPage: 5,
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true); // Cambiado a true inicialmente
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Modelo | null>(null);
  const [formData, setFormData] = useState({ nombre: "", marca_id: "" });

  const navigate = useNavigate();

  const fetchMarcas = async () => {
    setLoadingMarcas(true);
    try {
      const res = await api.get("/mod/marcas");
      const data = res.data;
      console.log(data);
      if (Array.isArray(data)) {
        setMarcas(data);
      } else {
        console.error("❌ Respuesta inesperada de marcas:", data);
        setMarcas([]);
      }
    } catch (err) {
      console.error("Error al cargar marcas:", err);
      setMarcas([]);
    } finally {
      setLoadingMarcas(false);
    }
  };

  const fetchModelos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/mod/modelos", {
        params: {
          search: filters.search,
          perPage: filters.perPage,
          page: filters.page,
        },
      });

      const data = res.data;
      if (Array.isArray(data.data)) {
        setModelos(data.data);
        setTotalPaginas(data.last_page ?? 1);
      } else {
        console.error("❌ Respuesta inesperada de modelos:", data);
        setModelos([]);
        setTotalPaginas(1);
      }
    } catch (err) {
      console.error("Error al cargar modelos:", err);
      setModelos([]);
      setTotalPaginas(1);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce(() => {
      fetchModelos();
    }, 500),
    []
  );

  useEffect(() => {
    const debounced = debounce(() => {
      fetchModelos();
    }, 500);

    debounced();

    return () => {
      debounced.cancel();
    };
  }, [filters.search, filters.page, filters.perPage]);

  useEffect(() => {
    fetchMarcas();
  }, []);

  const handleShow = (modelo?: Modelo) => {
    if (modelo) {
      setEditing(modelo);
      setFormData({ nombre: modelo.nombre, marca_id: String(modelo.marca_id) });
    } else {
      setEditing(null);
      setFormData({ nombre: "", marca_id: "" });
    }
    setFormValidated(false);
    setShowModal(true);
  };

  const handleClose = () => {
    setFormData({ nombre: "", marca_id: "" });
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

  const handleSubmit = async () => {
    setFormValidated(true);

    if (formData.nombre.trim() === "" || formData.marca_id === "") {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/mod/modelos/${editing.id}`, formData);
        toast.success("Modelo actualizado correctamente.");
      } else {
        await api.post("/mod/modelos", formData);
        toast.success("Modelo creado correctamente.");
      }
      fetchModelos();
      handleClose();
    } catch (err) {
      console.error("Error al guardar modelo:", err);
      toast.error("Ocurrió un error al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmarEliminacion = async (id: number) => {
    const modelo = modelos.find((m) => m.id === id);
    if (!modelo) {
      toast.error("Modelo no encontrado");
      return;
    }

    // Verificar si tiene equipos asociados
    if (modelo.equipos_count && modelo.equipos_count > 0) {
      toast.error(
        `No se puede eliminar "${modelo.nombre}" porque tiene ${modelo.equipos_count} equipo(s) asociado(s)`,
        { duration: 5000 }
      );
      return;
    }

    const toastId = `eliminar-modelo-${id}`;
    toast.dismiss();

    toast(
      (t) => (
        <div>
          <p>
            ¿Seguro que deseas eliminar el modelo{" "}
            <strong>{modelo.nombre}</strong>?
          </p>
          <div className="d-flex justify-content-end gap-2 mt-2">
            {/* @ts-ignore*/}
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                try {
                  await api.delete(`/mod/modelos/${id}`);
                  toast.dismiss(t.id);
                  toast.success(
                    `Modelo "${modelo.nombre}" eliminado correctamente`,
                    { duration: 4000 }
                  );
                  await fetchModelos();
                } catch (err: any) {
                  toast.dismiss(t.id);
                  const msg =
                    err?.response?.data?.message ||
                    "Error al eliminar el modelo.";
                  toast.error(msg, { duration: 4000 });
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
      {/* Encabezado */}
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
          <h2 className="fw-bold m-0">Gestión de Modelos</h2>
        </div>

        <div className="d-flex align-items-center gap-2 ms-md-0 ms-auto">
          {/* @ts-ignore */}
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => handleShow()}
          >
            <FaPlus />
            Nuevo Modelo
          </Button>
        </div>
      </div>

      {/* Buscador + Filtros */}
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

      {showFilters && (
        <div className="p-3 rounded mb-4 border border-secondary">
          <div className="row g-3">
            <div className="col-12">
              <Button
                variant="outline-danger"
                onClick={resetFilters}
                className="w-100"
              >
                <FaTimes className="me-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar spinner si está cargando */}
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
                  <th>Marca</th>
                  <th className="rounded-top-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modelos.length > 0 ? (
                  modelos.map((modelo) => (
                    <tr key={modelo.id}>
                      <td className="fw-bold">{modelo.nombre}</td>
                      <td>
                        <Badge bg="info" pill>
                          {modelo.marca?.nombre || "Sin marca"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            className="rounded-circle"
                            title="Editar modelo"
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
                            onClick={() => handleShow(modelo)}
                          >
                            <FaEdit />
                          </Button>

                          <Button
                            variant="outline-info"
                            className="rounded-circle"
                            title="Gestionar imágenes"
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
                            onClick={() =>
                              navigate(`/modelos/gestionar/${modelo.id}`)
                            }
                          >
                            <FaImages />
                          </Button>

                          <Button
                            variant="outline-danger"
                            className="rounded-circle"
                            title={
                              (modelo.equipos_count || 0) > 0
                                ? `No se puede eliminar (${modelo.equipos_count} equipo(s) asociado(s))`
                                : "Eliminar modelo"
                            }
                            style={{
                              width: "44px",
                              height: "44px",
                              transition: "transform 0.2s ease-in-out",
                              opacity:
                                (modelo.equipos_count || 0) > 0 ? 0.6 : 1,
                              cursor:
                                (modelo.equipos_count || 0) > 0
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            onMouseEnter={(e) => {
                              if (!(modelo.equipos_count || 0)) {
                                e.currentTarget.style.transform = "scale(1.15)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            onClick={() => {
                              if (!(modelo.equipos_count || 0)) {
                                confirmarEliminacion(modelo.id);
                              }
                            }}
                            disabled={(modelo.equipos_count || 0) > 0}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-muted text-center">
                      No se encontraron modelos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && modelos.length > 0 && (
            <PaginationComponent
              page={filters.page}
              totalPages={totalPaginas}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Modal para crear/editar */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header className="text-white py-3"
          style={{ backgroundColor: "#b1291d" }} closeButton>
          <Modal.Title>
            {editing ? "Editar Modelo" : "Agregar Modelo"}
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

            <Form.Group controlId="marca">
              <Form.Label>Marca</Form.Label>
              {loadingMarcas ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>Cargando marcas...</span>
                </div>
              ) : (
                <>
                  <Form.Select
                    required
                    name="marca_id"
                    value={formData.marca_id}
                    onChange={(e) =>
                      setFormData({ ...formData, marca_id: e.target.value })
                    }
                    isInvalid={formValidated && formData.marca_id === ""}
                  >
                    <option value="">Seleccionar marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Selecciona una marca.
                  </Form.Control.Feedback>
                </>
              )}
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
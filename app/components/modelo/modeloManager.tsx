import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Pagination,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { FaSave, FaTimes } from "react-icons/fa";

interface Modelo {
  id: number;
  nombre: string;
  marca_id: number;
  marca: { nombre: string };
}

interface Marca {
  id: number;
  nombre: string;
}

export default function ModeloManager() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Modelo | null>(null);
  const [formData, setFormData] = useState({ nombre: "", marca_id: "" });

  const navigate = useNavigate();

  const fetchMarcas = async () => {
    setLoadingMarcas(true);
    try {
      const res = await api.get("/mod/marcas");
      const data = res.data;
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

  const fetchModelos = async (
    searchText: string = "",
    currentPage: number = 1
  ) => {
    setLoading(true);
    try {
      const res = await api.get("/mod/modelos", {
        params: { search: searchText, perPage, page: currentPage },
      });

      const data = res.data;
      if (Array.isArray(data.data)) {
        setModelos(data.data);
        setTotalPages(data.last_page ?? 1);
      } else {
        console.error("❌ Respuesta inesperada de modelos:", data);
        setModelos([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error al cargar modelos:", err);
      setModelos([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((val: string) => {
      fetchModelos(val, 1);
      setPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<any>) => {
    const val = e.target.value;
    setSearch(val);
    debouncedFetch(val);
  };

  useEffect(() => {
    fetchModelos(search, page);
    fetchMarcas();
  }, [page]);

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

  const handleChange = (e: React.ChangeEvent<any>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      fetchModelos(search, page);
      handleClose();
    } catch (err) {
      console.error("Error al guardar modelo:", err);
      toast.error("Ocurrió un error al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    toast.custom((t) => (
      <div className="bg-white p-3 rounded shadow-sm">
        ¿Eliminar modelo?
        <div className="mt-2 d-flex gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              try {
                await api.delete(`/mod/modelos/${id}`);
                fetchModelos(search, page);
                toast.dismiss(t.id);
                toast.success("Modelo eliminado correctamente.");
              } catch (err: any) {
                toast.dismiss(t.id);
                const msg =
                  err?.response?.data?.message ||
                  "Error al eliminar el modelo.";
                toast.error(msg);
              }
            }}
          >
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ));
  };

  const renderPagination = () => (
    <Pagination>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
        <Pagination.Item
          key={number}
          active={number === page}
          onClick={() => setPage(number)}
        >
          {number}
        </Pagination.Item>
      ))}
    </Pagination>
  );

  return (
    <div className="p-4">
      <h3>Gestión de Modelos</h3>

      <InputGroup className="mb-3 w-50">
        <Form.Control
          placeholder="Buscar por nombre..."
          value={search}
          onChange={handleSearchChange}
        />
        <Button onClick={handleShow}>Agregar</Button>
      </InputGroup>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="text-center">
                <Spinner animation="border" size="sm" /> Cargando modelos...
              </td>
            </tr>
          ) : modelos.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center">
                No hay resultados
              </td>
            </tr>
          ) : (
            modelos.map((modelo) => (
              <tr key={modelo.id}>
                <td>{modelo.nombre}</td>
                <td>{modelo.marca?.nombre}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleShow(modelo)}
                    className="me-2"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => navigate(`/modelos/gestionar/${modelo.id}`)}
                  >
                    Imágenes
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(modelo.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {renderPagination()}

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
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
                onChange={handleChange}
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
                    onChange={handleChange}
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
          >
            {submitting && <Spinner size="sm" className="me-2" />}
            <FaSave className="me-2" />
            {editing ? "Actualizar" : "Crear"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            <FaTimes className="me-2" />
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

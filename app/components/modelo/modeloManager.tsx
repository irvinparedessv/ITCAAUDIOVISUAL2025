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
import debounce from "lodash.debounce";
import api from "../../api/axios";
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
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Modelo | null>(null);
  const [formData, setFormData] = useState({ nombre: "", marca_id: "" });

  const fetchMarcas = async () => {
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
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleChange = (e: React.ChangeEvent<any>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await api.put(`/mod/modelos/${editing.id}`, formData);
      } else {
        await api.post("/mod/modelos", formData);
      }
      fetchModelos(search, page);
      handleClose();
    } catch (err) {
      console.error("Error al guardar modelo:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        "¿Eliminar modelo?(si el modelo esta asociado este no se podra eliminar)"
      )
    ) {
      try {
        await api.delete(`/mod/modelos/${id}`);
        fetchModelos(search, page);
      } catch (err) {
        console.error("Error al eliminar modelo:", err);
      }
    }
  };

  const renderPagination = () => {
    return (
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
  };

  return (
    <div className="p-4">
      <h3>Gestión de Modelos</h3>

      <InputGroup className="mb-3 w-50">
        <Form.Control
          placeholder="Buscar por nombre..."
          value={search}
          onChange={handleSearchChange}
        />
        {/* @ts-ignore */}
        <Button onClick={() => handleShow()}>Agregar</Button>
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
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Marca</Form.Label>
              <Form.Select
                name="marca_id"
                value={formData.marca_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editing ? "Actualizar" : "Crear"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

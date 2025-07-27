import { useState, useEffect } from "react";
import { Modal, Button, Form, ListGroup, Spinner, Row, Col, Alert, OverlayTrigger, Tooltip, InputGroup } from "react-bootstrap";
import type { Marca } from "~/types/item";
import api from "../../api/axios";
import PaginationComponent from "~/utils/Pagination";
import { FaCheckCircle, FaSearch } from "react-icons/fa";

interface Props {
  show: boolean;
  onHide: () => void;
  onAdd: (nombre: string) => Promise<void>;
}

interface PaginacionMarcas {
  data: Marca[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function MarcaModal({
  show,
  onHide,
  onAdd,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [marcasPaginadas, setMarcasPaginadas] = useState<PaginacionMarcas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (show) {
      setLoading(true);
      setError(null);
      api.get("/marcas/obtener", {
        params: {
          search: debouncedSearch || undefined,
          page,
          per_page: 10,
        },
      })
        .then((res) => {
          setMarcasPaginadas(res.data);
        })
        .catch(() => {
          setError("Error al cargar marcas");
          setMarcasPaginadas(null);
        })
        .finally(() => setLoading(false));
    } else {
      setMarcasPaginadas(null);
    }
  }, [show, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const marcas = marcasPaginadas?.data || [];

  const nombreExiste = marcas.some(
    (m) => m.nombre.toLowerCase() === nombre.trim().toLowerCase()
  );

  const handleSubmit = async () => {
    if (!nombre.trim()) return;
    await onAdd(nombre.trim());
    setNombre("");
    setSearch("");
    setPage(1);
  };

  const handleSeleccionar = async (nombreExistente: string) => {
    await onAdd(nombreExistente);
    setNombre("");
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="text-white py-3" style={{ backgroundColor: "#b1291d" }} closeButton>
        <Modal.Title className="fw-bold">
          Gestionar Marcas
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar marcas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading}
                  aria-label="Buscar marcas"
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                disabled={loading || !search.trim()}
                className="w-100"
              >
                Limpiar búsqueda
              </Button>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Agregar Nueva Marca</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese nueva marca"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              isInvalid={!!nombre && nombreExiste}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              Esta marca ya existe. Puedes seleccionarla abajo.
            </Form.Control.Feedback>
            <Button
              variant="success"
              className="mt-2"
              onClick={handleSubmit}
              disabled={!nombre.trim() || loading || nombreExiste}
            >
              Agregar Marca
            </Button>
          </Form.Group>

          <h6 className="mb-3">Marcas Existentes</h6>

          {loading && (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" role="status" />
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && marcas.length === 0 && (
            <p className="text-muted text-center">No se encontraron marcas.</p>
          )}

          {!loading && !error && marcas.length > 0 && (
            <>
              <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
                {marcas.map((m) => (
                  <ListGroup.Item
                    key={m.id}
                    onClick={() => handleSeleccionar(m.nombre)}
                    className="d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                  >
                    {m.nombre}
                    <OverlayTrigger
                      placement="left"
                      overlay={<Tooltip id={`tooltip-${m.id}`}>Seleccionar esta marca</Tooltip>}
                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeleccionar(m.nombre);
                        }}
                        className="text-success"
                        role="button"
                        tabIndex={0}
                        style={{ fontSize: "1.2rem" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSeleccionar(m.nombre);
                          }
                        }}
                      >
                        <FaCheckCircle />
                      </span>
                    </OverlayTrigger>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="mt-3 d-flex justify-content-center">
                {marcasPaginadas && (
                  <PaginationComponent
                    page={page}
                    totalPages={marcasPaginadas.last_page}
                    onPageChange={(newPage) => setPage(newPage)}
                  />
                )}
              </div>
            </>
          )}
        </Form>
      </Modal.Body>
    </Modal>
  );
}
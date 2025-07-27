import { useState, useEffect } from "react";
import { Modal, Button, Form, ListGroup, Spinner, Row, Col, Alert, OverlayTrigger, Tooltip, InputGroup } from "react-bootstrap";
import type { Modelo, Marca } from "~/types/item";
import api from "../../../api/axios";
import PaginationComponent from "~/utils/Pagination";
import { FaCheckCircle, FaSearch } from "react-icons/fa";

interface Props {
  show: boolean;
  onHide: () => void;
  marcaSeleccionada?: Marca;
  tipoEquipoSeleccionado?: { id: number };
  onAdd: (nombre: string) => Promise<void>;
}

interface PaginacionModelos {
  data: Modelo[];
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

export default function ModeloModal({
  show,
  onHide,
  marcaSeleccionada,
  tipoEquipoSeleccionado,
  onAdd,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [modelosPaginados, setModelosPaginados] = useState<PaginacionModelos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (show && marcaSeleccionada && tipoEquipoSeleccionado) {
      setLoading(true);
      setError(null);
      api.get("/modelos/por-marca-y-tipo", {
        params: {
          marca_id: marcaSeleccionada.id,
          tipo_equipo_id: tipoEquipoSeleccionado.id,
          search: debouncedSearch || undefined,
          page,
          per_page: 10,
        },
      })
        .then((res) => {
          setModelosPaginados(res.data);
        })
        .catch(() => {
          setError("Error al cargar modelos");
          setModelosPaginados(null);
        })
        .finally(() => setLoading(false));
    } else {
      setModelosPaginados(null);
    }
  }, [show, marcaSeleccionada, tipoEquipoSeleccionado, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [marcaSeleccionada, tipoEquipoSeleccionado, search]);

  const modelos = modelosPaginados?.data || [];

  const nombreExiste = modelos.some(
    (m) => m.nombre.toLowerCase() === nombre.trim().toLowerCase()
  );

  const handleSubmit = async () => {
    if (!nombre.trim() || !marcaSeleccionada) return;
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
          Gestionar Modelos de <span className="text-primary">{marcaSeleccionada?.nombre}</span>
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
                  placeholder="Buscar modelos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading}
                  aria-label="Buscar modelos"
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
            <Form.Label className="fw-semibold">Agregar Nuevo Modelo</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese nuevo modelo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              isInvalid={!!nombre && nombreExiste}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              Este modelo ya existe. Puedes seleccionarlo abajo.
            </Form.Control.Feedback>
            <Button
              variant="success"
              className="mt-2"
              onClick={handleSubmit}
              disabled={!nombre.trim() || loading || nombreExiste}
            >
              Agregar Modelo
            </Button>
          </Form.Group>

          <h6 className="mb-3">Modelos Existentes</h6>

          {loading && (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" role="status" variant="primary" />
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && modelos.length === 0 && (
            <p className="text-muted text-center">No se encontraron modelos.</p>
          )}

          {!loading && !error && modelos.length > 0 && (
            <>
              <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
                {modelos.map((m) => (
                  <ListGroup.Item
                    key={m.id}
                    onClick={() => handleSeleccionar(m.nombre)}
                    className="d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                  >
                    {m.nombre}
                    <OverlayTrigger
                      placement="left"
                      overlay={<Tooltip id={`tooltip-${m.id}`}>Seleccionar este modelo</Tooltip>}
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
                {modelosPaginados && (
                  <PaginationComponent
                    page={page}
                    totalPages={modelosPaginados.last_page}
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

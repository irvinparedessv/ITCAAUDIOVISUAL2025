import React, { useState, useEffect, type FormEvent } from "react";
import {
  Form,
  Button,
  ListGroup,
  Badge,
  Spinner,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import type { User } from "../types/user";
import api from "./../api/axios";

interface AulaDetalle {
  id: number;
  name: string;
  primeraImagen?: {
    image_path: string;
  };
  encargados?: User[];
}

export default function AsignarEncargadosForm() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selectedEncargado, setSelectedEncargado] = useState<number | "">("");
  const [encargados, setEncargados] = useState<User[]>([]);
  const [aula, setAula] = useState<AulaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { aulaId } = useParams<{ aulaId: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, aulaRes] = await Promise.all([
          api.get<User[]>("/encargados"),
          aulaId
            ? api.get(`/aulas/${aulaId}/encargados`)
            : Promise.resolve({ data: null }),
        ]);

        setUsuarios(usersRes.data);
        setAula(aulaRes.data);

        if (aulaRes.data?.encargados) {
          setEncargados(aulaRes.data.encargados);
        }
      } catch (error) {
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [aulaId]);

  const handleAddEncargado = () => {
    if (!selectedEncargado) return;

    const user = usuarios.find((u) => u.id === selectedEncargado);
    if (!user) return;

    if (encargados.find((e) => e.id === user.id)) {
      toast.error("Este encargado ya fue agregado");
      return;
    }

    setEncargados([...encargados, user]);
    setSelectedEncargado("");
  };

  const handleRemoveEncargado = (id: number) => {
    setEncargados(encargados.filter((e) => e.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!aulaId) return;

    if (encargados.length === 0) {
      toast.error("Debes agregar al menos un encargado");
      return;
    }

    setSaving(true);

    const ids = encargados.map((e) => e.id);

    try {
      await api.post(`/aulas/${aulaId}/encargados`, { user_ids: ids });
      toast.success("Encargados asignados correctamente");
    } catch {
      toast.error("Error al asignar encargados");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando datos del aula...</p>
      </div>
    );
  }

  const encargadosDisponibles = usuarios.filter(
    (u) => !encargados.some((e) => e.id === u.id)
  );

  return (
    <div className="container py-4">
      <Card className="shadow-sm border-0">
        <Card.Body>
          <h3 className="mb-4 text-primary">Asignar Encargados</h3>

          {aula && (
            <Row className="mb-4">
              <Col md={8}>
                <h5 className="fw-bold">{aula.name}</h5>
              </Col>
              <Col md={4}>
                {aula.primeraImagen?.image_path && (
                  <img
                    src={aula.primeraImagen.image_path}
                    alt="Imagen del aula"
                    className="img-fluid rounded shadow-sm"
                  />
                )}
              </Col>
            </Row>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                Selecciona un encargado
              </Form.Label>
              <Row>
                <Col md={8}>
                  <Form.Select
                    value={selectedEncargado}
                    onChange={(e) =>
                      setSelectedEncargado(Number(e.target.value))
                    }
                    disabled={encargadosDisponibles.length === 0}
                  >
                    <option value="">-- Selecciona --</option>
                    {encargadosDisponibles.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4} className="mt-2 mt-md-0">
                  <Button
                    variant="outline-primary"
                    className="w-100"
                    onClick={handleAddEncargado}
                    disabled={
                      !selectedEncargado || encargadosDisponibles.length === 0
                    }
                  >
                    + Agregar
                  </Button>
                </Col>
              </Row>
            </Form.Group>

            {encargados.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-semibold">Encargados asignados</h6>
                <ListGroup variant="flush">
                  {encargados.map((e) => (
                    <ListGroup.Item
                      key={e.id}
                      className="d-flex justify-content-between align-items-center border-bottom py-2"
                    >
                      <div>
                        <strong>
                          {e.first_name} {e.last_name}
                        </strong>{" "}
                        <Badge bg="secondary" className="ms-2">
                          ID: {e.id}
                        </Badge>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveEncargado(e.id)}
                      >
                        Quitar
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="px-4"
              disabled={saving || encargados.length === 0}
            >
              {saving ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Guardando...
                </>
              ) : (
                "Guardar encargados"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

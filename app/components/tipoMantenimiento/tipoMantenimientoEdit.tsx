import React, { useEffect, useState } from "react";
import { Button, Form, Spinner, Modal } from "react-bootstrap";
import { toast } from "react-hot-toast";
import {
  getTipoMantenimientoById,
  updateTipoMantenimiento,
} from "../../services/tipoMantenimientoService";
import type { TipoMantenimiento } from "../../types/tipoMantenimiento";

interface Props {
  show: boolean;
  onHide: () => void;
  tipoId: number;
  onSuccess: () => void;
}

export default function TipoMantenimientoEditModal({
  show,
  onHide,
  tipoId,
  onSuccess,
}: Props) {
  const [tipo, setTipo] = useState<TipoMantenimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState(true);
  const [errors, setErrors] = useState<{ nombre?: string }>({});

  useEffect(() => {
    if (!show) return;

    setLoading(true);
    getTipoMantenimientoById(tipoId)
      .then((data) => {
        setTipo(data);
        setNombre(data.nombre);
        setEstado(data.estado);
      })
      .catch(() => {
        toast.error("Error al cargar el tipo de mantenimiento");
        onHide();
      })
      .finally(() => setLoading(false));
  }, [tipoId, show, onHide]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setSaving(true);
    try {
      await updateTipoMantenimiento(tipoId, { nombre: nombre.trim(), estado });
      toast.success("Tipo de mantenimiento actualizado correctamente");
      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNombre("");
    setEstado(true);
    setErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header className="text-white py-3" style={{ backgroundColor: "#b1291d" }} closeButton>
        <Modal.Title>Editar Tipo de Mantenimiento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center my-3">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando tipo de mantenimiento...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="nombre" className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                isInvalid={!!errors.nombre}
                disabled={saving}
              />
              <Form.Control.Feedback type="invalid">
                {errors.nombre}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="estado" className="mb-4">
              <Form.Check
                type="checkbox"
                label="Activo"
                checked={estado}
                onChange={(e) => setEstado(e.target.checked)}
                disabled={saving}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
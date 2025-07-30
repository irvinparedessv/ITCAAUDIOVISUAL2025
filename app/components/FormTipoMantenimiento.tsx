import React, { useState } from "react";
import { createTipoMantenimiento } from "../services/tipoMantenimientoService";
import { toast } from "react-hot-toast";
import { Form, Button, Spinner, Modal } from "react-bootstrap";

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const FormTipoMantenimientoModal: React.FC<Props> = ({ show, onHide, onSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      await createTipoMantenimiento({ nombre: nombre.trim(), estado });
      toast.success("Tipo de mantenimiento creado correctamente");
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error("Error al crear tipo de mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNombre("");
    setEstado(true);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header className="text-white py-3" style={{ backgroundColor: "#b1291d" }} closeButton>
        <Modal.Title>Nuevo Tipo de Mantenimiento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="nombre" className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              required
            />
          </Form.Group>

          <Form.Group controlId="estado" className="mb-4">
            <Form.Check
              type="checkbox"
              label="Activo"
              checked={estado}
              onChange={(e) => setEstado(e.target.checked)}
              disabled={loading}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creando...
                </>
              ) : (
                "Crear Tipo"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default FormTipoMantenimientoModal;
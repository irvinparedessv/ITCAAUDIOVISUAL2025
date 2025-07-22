import { useState } from "react";
import { Modal, Button, Form, ListGroup } from "react-bootstrap";
import type { Marca } from "~/types/item";

interface Props {
  show: boolean;
  onHide: () => void;
  marcas: Marca[];
  onAdd: (nombre: string) => Promise<void>;
}

export default function MarcaModal({ show, onHide, marcas, onAdd }: Props) {
  const [nombre, setNombre] = useState("");

  const handleSubmit = async () => {
    const nombreNormalizado = nombre.trim().toLowerCase();

    if (!nombreNormalizado) return;

    const marcaExistente = marcas.find(
      (m) => m.nombre.trim().toLowerCase() === nombreNormalizado
    );

    if (marcaExistente) {
      // Marca ya existe: solo cerramos el modal (o podrías hacer algo más)
      alert("La marca ya existe. Será seleccionada automáticamente.");
      setNombre("");
      onHide();
      return;
    }

    // Marca no existe: crearla
    await onAdd(nombre.trim());
    setNombre("");
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Marcas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Nueva Marca</Form.Label>
          <Form.Control
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ingrese nueva marca"
          />
          <Button className="mt-2" onClick={handleSubmit}>
            Agregar
          </Button>
        </Form.Group>

        <h6>Marcas Existentes</h6>
        <ListGroup>
          {marcas.map((m) => (
            <ListGroup.Item key={m.id}>{m.nombre}</ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
}

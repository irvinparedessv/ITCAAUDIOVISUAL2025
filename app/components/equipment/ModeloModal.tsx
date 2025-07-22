import { useState, useMemo } from "react";
import { Modal, Button, Form, ListGroup } from "react-bootstrap";
import type { Modelo, Marca } from "~/types/item";

interface Props {
  show: boolean;
  onHide: () => void;
  modelos: Modelo[];
  marcaSeleccionada?: Marca;
  onAdd: (nombre: string) => Promise<void>; // este setea también el modelo seleccionado
}

export default function ModeloModal({
  show,
  onHide,
  modelos,
  marcaSeleccionada,
  onAdd,
}: Props) {
  const [nombre, setNombre] = useState("");

  const modelosFiltrados = useMemo(
    () => modelos.filter((m) => m.marca_id === marcaSeleccionada?.id),
    [modelos, marcaSeleccionada]
  );

  const nombreExiste = modelosFiltrados.some(
    (m) => m.nombre.toLowerCase() === nombre.trim().toLowerCase()
  );

  const handleSubmit = async () => {
    if (!nombre.trim() || !marcaSeleccionada) return;
    await onAdd(nombre.trim());
    setNombre(""); // limpiar campo
  };

  const handleSeleccionar = async (nombreExistente: string) => {
    await onAdd(nombreExistente); // esto ya lo maneja tu lógica para seleccionar si ya existe
    setNombre("");
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Modelos de {marcaSeleccionada?.nombre}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Nuevo Modelo</Form.Label>
          <Form.Control
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ingrese nuevo modelo"
            isInvalid={!!nombre && nombreExiste}
          />
          <Form.Control.Feedback type="invalid">
            Este modelo ya existe. Puedes seleccionarlo abajo.
          </Form.Control.Feedback>
          <Button
            className="mt-2"
            onClick={handleSubmit}
            disabled={!nombre.trim()}
          >
            Agregar
          </Button>
        </Form.Group>

        <h6>Modelos Existentes</h6>
        <ListGroup>
          {modelosFiltrados.map((m) => (
            <ListGroup.Item
              key={m.id}
              action
              onClick={() => handleSeleccionar(m.nombre)}
            >
              {m.nombre}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
}

// src/components/modals/VisualizarModal.tsx
import React from "react";
import { Modal } from "react-bootstrap";
import SceneViewer from "../renders/rooms/Visualizacion";
import { APIURL } from "~/constants/constant";

interface Props {
  show: boolean;
  onHide: () => void;
  path: string; // Cambialo si tenés un tipo
  escala?: string; // Prop opcional
}

export default function VisualizarModal({ show, onHide, path, escala }: Props) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen
      backdrop="static"
      keyboard={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Vista Inmersiva del Aula</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0 }}>
        <SceneViewer filePath={path} escala={escala} />
      </Modal.Body>
    </Modal>
  );
}

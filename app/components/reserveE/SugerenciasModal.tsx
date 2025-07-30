import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import SceneViewer from "../renders/rooms/Visualizacion";
import { APIURL } from "~/constants/constant";

interface SugerenciasModelosModalProps {
  show: boolean;
  onHide: () => void;
  sugerencias: string[];
  handleCopy;
}

const SugerenciasModelosModal: React.FC<SugerenciasModelosModalProps> = ({
  show,
  onHide,
  sugerencias,
  handleCopy,
}) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Sugerencias de modelos previos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {sugerencias.length === 0 ? (
          <div className="text-center text-muted">No hay sugerencias.</div>
        ) : (
          sugerencias.map((sug, idx) => (
            <div
              key={idx}
              className="border rounded p-3 mb-3 d-flex justify-content-between align-items-center"
            >
              <div>
                <div>
                  <b>Modelo 3D:</b> {sug}
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => setSelectedPath(APIURL + "/" + sug)}
              >
                Previsualizar
              </Button>
              <Button
                variant="primary"
                onClick={() => handleCopy(APIURL + "/" + sug)}
              >
                Copiar
              </Button>
            </div>
          ))
        )}
        {selectedPath && (
          <div className="mt-4 border rounded p-2">
            <div
              className="scene-viewer-container"
              style={{
                width: "100%",
                maxWidth: "600px",
                height: "400px",
                margin: "0 auto",
                background: "#222",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SceneViewer filePath={selectedPath} />
            </div>
            <div className="text-center mt-2">
              <Button variant="secondary" onClick={() => setSelectedPath(null)}>
                Cerrar previsualización
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SugerenciasModelosModal;

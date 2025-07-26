import React, { useState, useEffect, Suspense } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import toast from "react-hot-toast";

// ==================== ErrorBoundary ====================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Error en modelo 3D:", error, info);
    toast.error("Error al cargar el modelo 3D.");
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ==================== Referencias visuales ====================
function ReferenceObjects() {
  return (
    <>
      <mesh position={[2, 0.6, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" transparent opacity={0.4} />
      </mesh>
      <mesh position={[-2, 1, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.8, 32]} />
        <meshStandardMaterial color="lightblue" transparent opacity={0.6} />
      </mesh>
    </>
  );
}

// ==================== Modelo 3D ====================
const ModelObject = ({
  url,
  scale,
  onSizeCalculated,
}: {
  url: string;
  scale: number;
  onSizeCalculated: (size: { x: number; y: number; z: number }) => void;
}) => {
  const { scene } = useGLTF(url);
  const [cloned] = useState(() => scene.clone(true));
  const [baseOffset, setBaseOffset] = useState(0);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    cloned.position.x -= center.x;
    cloned.position.z -= center.z;
    cloned.position.y += 0.1;
    setBaseOffset(box.min.y);

    onSizeCalculated({
      x: size.x,
      y: size.y,
      z: size.z,
    });
  }, []);

  return (
    <group position={[0, -baseOffset * scale + 0.1, 0]}>
      <primitive object={cloned} scale={[scale, scale, scale]} />
    </group>
  );
};

// ==================== Preview Wrapper ====================
const ModelPreview = ({
  file,
  scale,
  onSizeCalculated,
}: {
  file: File;
  scale: number;
  onSizeCalculated: (size: { x: number; y: number; z: number }) => void;
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    setUrl(tempUrl);
    return () => URL.revokeObjectURL(tempUrl);
  }, [file]);

  if (!url) return null;

  return (
    <Suspense fallback={null}>
      <ModelObject
        url={url}
        scale={scale}
        onSizeCalculated={onSizeCalculated}
      />
    </Suspense>
  );
};

// ==================== Modal principal ====================
export default function ModelUploader({
  show,
  onClose,
  onModelSubmit,
  initialUrl,
  initialScale = 0.5,
}: {
  show: boolean;
  onClose: () => void;
  onModelSubmit: (file: File, scale: number) => void;
  initialUrl?: string | null;
  initialScale?: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(initialScale);
  const [modelSize, setModelSize] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setRemoteUrl(initialUrl);
      setFile(null);
    }
  }, [initialUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".glb") && !f.name.endsWith(".gltf")) {
      toast.error("Formato inválido. Solo .glb o .gltf");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 10MB.");
      return;
    }

    setFile(f);
    setRemoteUrl(null);
    setModelSize(null);
  };

  const handleSubmit = () => {
    if (!file && !remoteUrl) {
      toast.error("Debes subir un archivo o usar el existente.");
      return;
    }

    if (file) {
      onModelSubmit(file, scale);
      toast.success("Modelo cargado correctamente.");
    } else {
      toast.error("Debes seleccionar un nuevo archivo para reenviar.");
    }

    setFile(null);
    setScale(initialScale);
    setModelSize(null);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Subir Modelo 3D</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-3">
          <strong>Referencia visual:</strong> El{" "}
          <span style={{ color: "orange" }}>cubo naranja</span> representa un
          volumen de <strong>1 metro cúbico (1m x 1m x 1m)</strong> y el{" "}
          <span style={{ color: "lightblue" }}>cilindro azul</span> representa
          la altura promedio de una persona (<strong>1.8 metros</strong>).
        </Alert>

        <Form.Group>
          <Form.Label>Selecciona un archivo .glb o .gltf</Form.Label>
          <Form.Control
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileChange}
          />
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label>Escala: {scale.toFixed(2)}</Form.Label>
          <Form.Range
            min={0.01}
            max={2}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </Form.Group>

        {modelSize && (
          <Alert variant="secondary" className="mt-3">
            <strong>Dimensiones originales:</strong> {modelSize.x.toFixed(2)}m x{" "}
            {modelSize.y.toFixed(2)}m x {modelSize.z.toFixed(2)}m<br />
            <strong>Dimensiones escaladas:</strong>{" "}
            {(modelSize.x * scale).toFixed(2)}m x{" "}
            {(modelSize.y * scale).toFixed(2)}m x{" "}
            {(modelSize.z * scale).toFixed(2)}m
          </Alert>
        )}

        <div style={{ height: "400px", marginTop: "1rem" }}>
          <ErrorBoundary fallback={<p>Error al previsualizar modelo.</p>}>
            <Canvas camera={{ position: [0, 1.2, 6], fov: 50 }}>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Environment preset="sunset" />
              <OrbitControls
                makeDefault
                target={[0, 2, 0]}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
              />
              <ReferenceObjects />
              {file && (
                <ModelPreview
                  file={file}
                  scale={scale}
                  onSizeCalculated={(size) => setModelSize(size)}
                />
              )}
              {!file && remoteUrl && (
                <Suspense fallback={null}>
                  <ModelObject
                    url={remoteUrl}
                    scale={scale}
                    onSizeCalculated={(size) => setModelSize(size)}
                  />
                </Suspense>
              )}
            </Canvas>
          </ErrorBoundary>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Subir modelo
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

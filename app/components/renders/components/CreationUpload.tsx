import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { APIURL, APPLARAVEL } from "~/constants/constant";
import { FaLongArrowAltLeft } from "react-icons/fa";

// ==================== Interfaces ====================
interface Producto {
  id: number;
  nombre: string;
  imagen_normal: string | null;
  imagen_glb: string | null;
  escala: number;
}

interface Size {
  x: number;
  y: number;
  z: number;
}

// ==================== Modelo cargado ====================
const ModelObject = ({
  url,
  scale,
  onSizeCalculated,
}: {
  url: string;
  scale: number;
  onSizeCalculated: (size: Size) => void;
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

const ReferenceObjects = () => (
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

// ==================== Componente Principal ====================
export default function GestorModelos() {
  const { id } = useParams<{ id: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileImg, setFileImg] = useState<File | null>(null);
  const [fileImgUrl, setFileImgUrl] = useState<string | null>(null); // NUEVO
  const [file3D, setFile3D] = useState<File | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [loading3D, setLoading3D] = useState(false);
  const [scale, setScale] = useState<number>(0.5);
  const [selectedType, setSelectedType] = useState<"normal" | "3d">("normal");
  const [modelSize, setModelSize] = useState<Size | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api
      .get(`/mod/modelos/${id}`)
      .then((res) => {
        const prod = res.data;
        setProducto(prod);
        setSelectedType(prod.imagen_glb ? "3d" : "normal");
        setScale(prod.escala || 0.5);
        if (prod.imagen_glb) setRemoteUrl(`${APIURL}/${prod.imagen_glb}`);
        if (prod.imagen_normal)
          setFileImgUrl(`${APPLARAVEL}/storage/${prod.imagen_normal}`);
      })
      .catch(() => toast.error("Error al cargar el modelo"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleImageUpload = async () => {
    if (!fileImg || !producto) return;
    const formData = new FormData();
    formData.append("producto_id", producto.id.toString());
    formData.append("file", fileImg);
    formData.append("tipo", selectedType);
    setLoadingImg(true);
    try {
      await api.post("/mod/modUpload", formData);
      toast.success("Imagen subida correctamente.");
      // Actualiza la vista para mostrar la imagen recién subida
      setFileImgUrl(URL.createObjectURL(fileImg));
    } catch {
      toast.error("Error al subir imagen.");
    } finally {
      setLoadingImg(false);
    }
  };

  const handleModelUpload = async () => {
    if (!producto) return;

    const formData = new FormData();
    formData.append("producto_id", producto.id.toString());
    formData.append("scale", scale.toString());
    formData.append("tipo", selectedType);

    if (file3D) {
      formData.append("file", file3D);
    } else if (!remoteUrl) {
      toast.error("Debes subir un archivo o tener uno existente.");
      return;
    }

    setLoading3D(true);
    try {
      await api.post("/mod/modUpload", formData);
      toast.success("Modelo 3D actualizado correctamente.");
    } catch {
      toast.error("Error al actualizar el modelo 3D.");
    } finally {
      setLoading3D(false);
    }
  };

  // ===== CORREGIDO para el error del input file =====
  const handleFileImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    setFileImg(f);
    setFileImgUrl(URL.createObjectURL(f)); // Mostrar previsualización inmediata
  };

  const handleFile3DChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".glb") && !f.name.endsWith(".gltf")) {
      toast.error("Formato inválido. Solo .glb o .gltf");
      return;
    }

    if (f.size > 20 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 20MB.");
      return;
    }

    setFile3D(f);
    setRemoteUrl(null);
    setModelSize(null);
  };

  if (loading) {
    return (
      <div className="p-4">
        <Spinner animation="border" /> Cargando modelo...
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="p-4">
        <Alert variant="danger">No se encontró el modelo solicitado.</Alert>
      </div>
    );
  }
  const handleBack = () => {
    navigate("/modelos"); // Regresa a la página anterior
  };
  return (
    <div className="p-4">
      <div
        className="d-flex align-items-center gap-2 gap-md-3"
        style={{ marginBottom: "30px" }}
      >
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: "pointer",
            fontSize: "2rem",
          }}
        />
        <h2 className="fw-bold m-0">
          Gestión de Imagenes para: {producto.nombre}
        </h2>
      </div>

      {(producto.imagen_normal || producto.imagen_glb) && (
        <Alert variant="info" className="mt-3">
          <strong>Recurso actual:</strong>{" "}
          {producto.imagen_glb
            ? "Modelo 3D cargado"
            : producto.imagen_normal
            ? "Imagen cargada"
            : "Ninguno"}
        </Alert>
      )}

      <Form.Group className="mt-3">
        <Form.Label>Tipo de visualización</Form.Label>
        <div>
          <Form.Check
            inline
            type="radio"
            label="Normal"
            checked={selectedType === "normal"}
            onChange={() => setSelectedType("normal")}
          />
          <Form.Check
            inline
            type="radio"
            label="3D"
            checked={selectedType === "3d"}
            onChange={() => setSelectedType("3d")}
          />
        </div>
      </Form.Group>

      {selectedType === "normal" && (
        <Form.Group className="mt-4">
          <Form.Label>Subir imagen normal (.jpg, .png)</Form.Label>
          {fileImgUrl && (
            <div className="mb-2">
              <img
                src={fileImgUrl}
                alt="Vista previa"
                style={{
                  maxWidth: "300px",
                  maxHeight: "300px",
                  border: "1px solid #eee",
                }}
              />
            </div>
          )}
          <Form.Control
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileImgChange}
          />
          <Button
            className="mt-2"
            variant="primary"
            disabled={loadingImg}
            onClick={handleImageUpload}
          >
            {loadingImg ? "Subiendo..." : "Guardar imagen"}
          </Button>
        </Form.Group>
      )}

      {selectedType === "3d" && (
        <>
          <Form.Group>
            <Form.Label>Archivo .glb o .gltf</Form.Label>
            <Form.Control
              type="file"
              accept=".glb,.gltf"
              onChange={handleFile3DChange}
            />
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Escala: {scale}</Form.Label>
            <Form.Range
              min={0.01}
              max={2}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
          </Form.Group>
          <Alert variant="info" className="mt-4">
            El <strong>cubo naranja</strong> representa 1m³. El{" "}
            <strong>cilindro azul</strong> mide 1.8m (altura promedio humana).
          </Alert>

          <div style={{ height: "400px", marginTop: "1rem" }}>
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
              {file3D && (
                <Suspense fallback={null}>
                  <ModelObject
                    url={URL.createObjectURL(file3D)}
                    scale={scale}
                    onSizeCalculated={setModelSize}
                  />
                </Suspense>
              )}
              {!file3D && remoteUrl && (
                <Suspense fallback={null}>
                  <ModelObject
                    url={remoteUrl}
                    scale={scale}
                    onSizeCalculated={setModelSize}
                  />
                </Suspense>
              )}
            </Canvas>
          </div>
          {modelSize && (
            <Alert variant="secondary" className="mt-3">
              <strong>Dimensiones originales:</strong> {modelSize.x.toFixed(2)}m
              x {modelSize.y.toFixed(2)}m x {modelSize.z.toFixed(2)}m
              <br />
              <strong>Escaladas:</strong> {(modelSize.x * scale).toFixed(2)}m x{" "}
              {(modelSize.y * scale).toFixed(2)}m x{" "}
              {(modelSize.z * scale).toFixed(2)}m
            </Alert>
          )}
          {/* @ts-ignore */}
          <Button
            className="mt-3"
            variant="primary"
            disabled={loading3D}
            onClick={handleModelUpload}
          >
            {loading3D ? "Subiendo..." : "Guardar modelo 3D"}
          </Button>
        </>
      )}
    </div>
  );
}

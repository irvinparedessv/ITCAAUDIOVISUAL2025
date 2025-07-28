import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Alert, Spinner } from "react-bootstrap";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { APIURL, APPLARAVEL } from "~/constants/constant";
import { FaLongArrowAltLeft, FaSave, FaTimes, FaUpload } from "react-icons/fa";

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

export default function GestorModelos() {
  const { id } = useParams<{ id: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileImg, setFileImg] = useState<File | null>(null);
  const [fileImgUrl, setFileImgUrl] = useState<string | null>(null);
  const [file3D, setFile3D] = useState<File | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [loading3D, setLoading3D] = useState(false);
  const [scale, setScale] = useState<number>(0.5);
  const [selectedType, setSelectedType] = useState<"normal" | "3d">("normal");
  const [modelSize, setModelSize] = useState<Size | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
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
      setIsNavigating(true);
      setTimeout(() => navigate("/modelos"), 1500);
    } catch {
      toast.error("Error al actualizar el modelo 3D.");
    } finally {
      if (!isNavigating) {
        setLoading3D(false);
      }
    }
  };

  const handleFileImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    setFileImg(f);
    setFileImgUrl(URL.createObjectURL(f));
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

  const handleBack = () => {
    if (!isNavigating) navigate("/modelos");
  };

  if (loading) {
    return (
      <div className="form-container">
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando modelo...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="form-container">
        <Alert variant="danger">No se encontró el modelo solicitado.</Alert>
      </div>
    );
  }

  return (
    <div className="form-container position-relative">
      <FaLongArrowAltLeft
        onClick={handleBack}
        title="Regresar"
        style={{
          position: 'absolute',
          top: '25px',
          left: '30px',
          cursor: isNavigating ? 'not-allowed' : 'pointer',
          fontSize: '2rem',
          zIndex: 10,
          opacity: isNavigating ? 0.5 : 1
        }}
      />
      
      <h2 className="mb-4 text-center fw-bold">
        Gestión de Imágenes para: {producto.nombre}
      </h2>

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

      <Form.Group className="mb-4">
        <Form.Label className="fw-bold">Tipo de visualización</Form.Label>
        <div className="d-flex gap-3">
          <Form.Check
            type="radio"
            label="Normal"
            id="normal-type"
            checked={selectedType === "normal"}
            onChange={() => setSelectedType("normal")}
          />
          <Form.Check
            type="radio"
            label="3D"
            id="3d-type"
            checked={selectedType === "3d"}
            onChange={() => setSelectedType("3d")}
          />
        </div>
      </Form.Group>

      {selectedType === "normal" && (
        <div className="mb-4">
          <Form.Label className="fw-bold">Subir imagen normal (.jpg, .png)</Form.Label>
          {fileImgUrl && (
            <div className="mb-3 text-center">
              <img
                src={fileImgUrl}
                alt="Vista previa"
                className="img-fluid rounded border mb-2"
                style={{ maxWidth: "300px", maxHeight: "300px" }}
              />
            </div>
          )}
          <Form.Control
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileImgChange}
            className="mb-3"
          />
          <button
            type="button"
            className="btn primary-btn"
            disabled={loadingImg || isNavigating || !fileImg}
            onClick={handleImageUpload}
          >
            {loadingImg ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Subiendo...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Guardar imagen
              </>
            )}
          </button>
        </div>
      )}

      {selectedType === "3d" && (
        <>
          <div className="mb-4">
            <Form.Label className="fw-bold">Archivo .glb o .gltf</Form.Label>
            <Form.Control
              type="file"
              accept=".glb,.gltf"
              onChange={handleFile3DChange}
              className="mb-3"
            />
          </div>

          <div className="mb-4">
            <Form.Label className="fw-bold">Escala: {scale}</Form.Label>
            <Form.Range
              min={0.01}
              max={2}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
          </div>

          <Alert variant="info" className="mb-4">
            El <strong>cubo naranja</strong> representa 1m³. El{" "}
            <strong>cilindro azul</strong> mide 1.8m (altura promedio humana).
          </Alert>

          <div style={{ height: "400px", marginBottom: "1.5rem" }}>
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
            <Alert variant="secondary" className="mb-4">
              <strong>Dimensiones originales:</strong> {modelSize.x.toFixed(2)}m
              x {modelSize.y.toFixed(2)}m x {modelSize.z.toFixed(2)}m
              <br />
              <strong>Escaladas:</strong> {(modelSize.x * scale).toFixed(2)}m x{" "}
              {(modelSize.y * scale).toFixed(2)}m x{" "}
              {(modelSize.z * scale).toFixed(2)}m
            </Alert>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn primary-btn"
              disabled={loading3D || isNavigating || (!file3D && !remoteUrl)}
              onClick={handleModelUpload}
            >
              {loading3D || isNavigating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isNavigating ? "Redirigiendo..." : "Subiendo..."}
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Guardar modelo 3D
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleBack}
              disabled={loading3D || isNavigating}
            >
              <FaTimes className="me-2" />
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
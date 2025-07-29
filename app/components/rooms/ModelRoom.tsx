import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { APIURL, APPLARAVEL } from "~/constants/constant";
import { FaLongArrowAltLeft } from "react-icons/fa";

// ===== INTERFACES AJUSTADAS =====
interface AulaImagen {
  id: number;
  aula_id: number;
  image_path: string;
  is360: boolean;
}

interface Aula {
  id: number;
  name: string;
  descripcion: string;
  capacidad_maxima: number;
  horarios: any[]; // Define mejor si lo usas
  imagenes: AulaImagen[];
  path_modelo: string | null;
  created_at: string;
  escala: number;
  updated_at: string;
}

// Para calcular medidas
interface Size {
  x: number;
  y: number;
  z: number;
}

// Modelo GLB
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

    //cloned.position.x -= center.x;
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

// Salones 4x4 y 8x8
const ReferenceRooms = () => (
  <>
    <mesh position={[0, 0.01, 0]}>
      <boxGeometry args={[4, 0.02, 4]} />
      <meshStandardMaterial color="orange" transparent opacity={0.28} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[8, 0.02, 8]} />
      <meshStandardMaterial color="blue" transparent opacity={0.13} />
    </mesh>
    <mesh position={[-2, 0.9, 2]}>
      <cylinderGeometry args={[0.2, 0.2, 1.8, 32]} />
      <meshStandardMaterial color="lightblue" transparent opacity={0.7} />
    </mesh>
  </>
);

export default function GestorModelosAula() {
  const { id } = useParams<{ id: string }>();
  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);

  // Para imagen
  const [fileImg, setFileImg] = useState<File | null>(null);
  const [fileImgUrl, setFileImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

  // Para modelo 3D
  const [file3D, setFile3D] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [loading3D, setLoading3D] = useState(false);
  const [scale, setScale] = useState<number>(1);
  const [modelSize, setModelSize] = useState<Size | null>(null);

  // UI
  const [selectedType, setSelectedType] = useState<"normal" | "3d">("normal");
  const navigate = useNavigate();

  // Cargar datos aula
  useEffect(() => {
    if (!id) return;
    api
      .get(`/aulas/${id}`)
      .then((res) => {
        const aulaData = res.data as Aula;
        setAula(aulaData);
        // Imagen preview por defecto: primera imagen de imágenes
        if (aulaData.imagenes?.length > 0)
          setFileImgUrl(`${APPLARAVEL}/${aulaData.imagenes[0].image_path}`);
        // Si tiene modelo glb, usarlo
        if (aulaData.path_modelo)
          setRemoteUrl(`${APIURL}/${aulaData.path_modelo}`);
        setSelectedType(aulaData.path_modelo ? "3d" : "normal");
        setScale(aulaData.escala ? Number(aulaData.escala) : 1);
      })
      .catch(() => toast.error("Error al cargar el aula"))
      .finally(() => setLoading(false));
  }, [id]);

  // Subir imagen
  const handleImageUpload = async () => {
    if (!fileImg || !aula) return;
    const formData = new FormData();
    formData.append("aula_id", aula.id.toString());
    formData.append("file", fileImg);
    formData.append("tipo", "normal");
    setLoadingImg(true);
    try {
      await api.post("/aula/aulaUpload", formData);
      toast.success("Imagen subida correctamente.");
      setFileImgUrl(URL.createObjectURL(fileImg));
    } catch {
      toast.error("Error al subir imagen.");
    } finally {
      setLoadingImg(false);
    }
  };

  // Subir modelo 3D
  const handleModelUpload = async () => {
    if (!aula) return;
    const formData = new FormData();
    formData.append("aula_id", aula.id.toString());
    formData.append("scale", scale.toString());
    formData.append("tipo", "3d");

    if (file3D) {
      formData.append("file", file3D);
    } else if (!remoteUrl) {
      toast.error("Debes subir un archivo o tener uno existente.");
      return;
    }
    setLoading3D(true);
    try {
      await api.post("/aula/aulaUpload", formData);
      toast.success("Modelo 3D actualizado correctamente.");
    } catch {
      toast.error("Error al actualizar el modelo 3D.");
    } finally {
      setLoading3D(false);
    }
  };

  // File changes
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

  if (loading) {
    return (
      <div className="p-4">
        <Spinner animation="border" /> Cargando aula...
      </div>
    );
  }

  if (!aula) {
    return (
      <div className="p-4">
        <Alert variant="danger">No se encontró el aula solicitada.</Alert>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/rooms");
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
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <h2 className="fw-bold m-0">
          Gestión de Recursos para Aula: {aula.name}
        </h2>
      </div>

      <div className="mb-2">
        <b>Descripción:</b> {aula.descripcion}
        <br />
        <b>Capacidad:</b> {aula.capacidad_maxima} personas
      </div>

      {(aula.imagenes?.length > 0 || aula.path_modelo) && (
        <Alert variant="info" className="mt-3">
          <strong>Recurso actual:</strong>{" "}
          {aula.path_modelo
            ? "Modelo 3D cargado"
            : aula.imagenes?.length > 0
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
          <Form.Label>Subir imagen (.jpg, .png)</Form.Label>
          {/* Galería de imágenes existentes */}
          {aula.imagenes && aula.imagenes.length > 0 && !fileImgUrl && (
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              {aula.imagenes.map((img) => (
                <img
                  key={img.id}
                  src={`${APPLARAVEL}/${img.image_path}`}
                  alt="Vista previa"
                  style={{
                    maxWidth: "160px",
                    maxHeight: "160px",
                    border: "1px solid #eee",
                    borderRadius: 7,
                    objectFit: "cover",
                  }}
                />
              ))}
            </div>
          )}
          {/* Nueva imagen subida */}
          {fileImgUrl && (
            <div className="mb-2">
              <img
                src={fileImgUrl}
                alt="Vista previa nueva"
                style={{
                  maxWidth: "160px",
                  maxHeight: "160px",
                  border: "1px solid #eee",
                  borderRadius: 7,
                  objectFit: "cover",
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
            El <strong>cuadro naranja</strong> es un aula de 4x4 metros.
            <br />
            El <strong>cuadro azul</strong> es un aula de 8x8 metros.
            <br />
            El <strong>cilindro azul claro</strong> representa la altura
            promedio humana (1.8 m).
          </Alert>
          <div style={{ height: "400px", marginTop: "1rem" }}>
            <Canvas camera={{ position: [0, 3.5, 11], fov: 50 }}>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <Environment preset="sunset" />
              <OrbitControls
                makeDefault
                target={[0, 1.5, 0]}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
              />
              <ReferenceRooms />
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

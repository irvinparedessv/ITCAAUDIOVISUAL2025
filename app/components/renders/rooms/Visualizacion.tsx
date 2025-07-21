import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  PerspectiveCamera,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { getModelPathByReserveId } from "~/services/uploadModelService";

interface ViewerProps {
  reserveId: number;
}

function LoadedScene({ filePath }: { filePath: string }) {
  const { scene, cameras } = useGLTF(filePath) as unknown as {
    scene: THREE.Group;
    cameras: THREE.Camera[];
  };

  const mainCamera = cameras.find((cam) => cam.name === "MainCamera");

  if (mainCamera) {
    // Log info y sumamos altura
    console.log("✅ Usando cámara embebida:", mainCamera.name);
    const pos = mainCamera.position.clone();
    pos.y += 1;
    pos.z += 0.5;
    return (
      <>
        <PerspectiveCamera
          makeDefault
          position={pos}
          rotation={mainCamera.rotation}
          fov={(mainCamera as THREE.PerspectiveCamera).fov}
          near={(mainCamera as THREE.PerspectiveCamera).near}
          far={(mainCamera as THREE.PerspectiveCamera).far}
        />
        <primitive object={scene} dispose={null} />
      </>
    );
  } else {
    console.log("⚠️ No se encontró cámara embebida. Usando fallback");
    return (
      <>
        <PerspectiveCamera
          makeDefault
          position={[0, 3.5, 3]}
          fov={60}
          near={0.1}
          far={1000}
        />
        <primitive object={scene} dispose={null} />
      </>
    );
  }
}

export default function SceneViewer({ reserveId }: ViewerProps) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelPathByReserveId(reserveId)
      .then((path) => {
        setFilePath(path);
        console.log("🗂️ Ruta del modelo:", path);
      })
      .catch((err) => {
        console.error("❌ Error al obtener modelo:", err);
      })
      .finally(() => setLoading(false));
  }, [reserveId]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "#fff",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          Cargando modelo...
        </div>
      )}

      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          {filePath && <LoadedScene filePath={filePath} />}
          <OrbitControls target={[0, 2.2, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

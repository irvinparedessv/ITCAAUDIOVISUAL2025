import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface ViewerProps {
  filePath: string;
}

function LoadedScene({
  filePath,
  onLoadComplete,
}: {
  filePath: string;
  onLoadComplete: () => void;
}) {
  const { scene, cameras } = useGLTF(filePath, true) as unknown as {
    scene: THREE.Group;
    cameras: THREE.Camera[];
  };

  useEffect(() => {
    onLoadComplete();
  }, [onLoadComplete]);

  const mainCamera = cameras.find((cam) => cam.name === "MainCamera");

  if (mainCamera) {
    console.log("✅ Usando cámara embebida:", mainCamera.name);
    const pos = mainCamera.position.clone();
    pos.y += 1.5;
    pos.z += 3; // alejamos más la cámara

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
          position={[0, 3, 10]} // alejamos más la cámara
          fov={50}
          near={0.1}
          far={1000}
        />
        <primitive object={scene} dispose={null} />
      </>
    );
  }
}

export default function SceneViewer({ filePath }: ViewerProps) {
  const [loading, setLoading] = useState(true);

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
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} />

        <Suspense fallback={null}>
          {filePath && (
            <LoadedScene
              filePath={filePath}
              onLoadComplete={() => setLoading(false)}
            />
          )}
          <OrbitControls target={[0, 2.2, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

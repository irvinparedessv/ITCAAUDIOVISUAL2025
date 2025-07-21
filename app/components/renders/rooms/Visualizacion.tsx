import React, { Suspense, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface ViewerProps {
  filePath: string; // Ruta al archivo .glb o .gltf
}

function LoadedScene({ filePath }: { filePath: string }) {
  const { scene, cameras } = useGLTF(filePath) as unknown as {
    scene: THREE.Group;
    cameras: THREE.Camera[];
  };

  const mainCamera = cameras.find((cam) => cam.name === "MainCamera");
  console.log(mainCamera);

  return (
    <>
      {/* Si hay una cámara embebida, la usamos */}
      {mainCamera && (
        <PerspectiveCamera
          makeDefault
          position={mainCamera.position}
          rotation={mainCamera.rotation}
          fov={(mainCamera as THREE.PerspectiveCamera).fov}
          near={(mainCamera as THREE.PerspectiveCamera).near}
          far={(mainCamera as THREE.PerspectiveCamera).far}
        />
      )}
      <primitive object={scene} dispose={null} />
    </>
  );
}

export default function SceneViewer({ filePath }: ViewerProps) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <LoadedScene filePath={filePath} />
          <OrbitControls enableRotate enableZoom enablePan />
        </Suspense>
      </Canvas>
    </div>
  );
}

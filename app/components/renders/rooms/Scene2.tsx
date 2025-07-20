import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

//@ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { availableModels } from "../types/data";

function ModelItem({ path, position, scale = 1 }) {
  //@ts-ignore
  const { scene } = useGLTF(path);
  const clonedScene = scene.clone(true);
  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={[scale, scale, scale]}
    />
  );
}
function RoomModel({
  path,
  children,
}: {
  path: string;
  children?: React.ReactNode;
}) {
  const { scene } = useGLTF(path);
  const clonedScene = scene.clone(true);

  return <primitive object={clonedScene}>{children}</primitive>;
}

export default function Scene() {
  const exportGroupRef = useRef<THREE.Group>(null);

  const handleExport = (type) => {
    if (!exportGroupRef.current) return;

    const exporter = new GLTFExporter();
    exporter.parse(
      exportGroupRef.current,
      (result) => {
        if (type === "glb" && result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "escena.glb";
          link.click();
          URL.revokeObjectURL(url);
        } else if (type === "gltf" && typeof result === "object") {
          const gltf = JSON.stringify(result);
          const blob = new Blob([gltf], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "escena.gltf";
          link.click();
          URL.revokeObjectURL(url);
        } else {
          console.error("Error al exportar");
        }
      },
      (error) => {
        console.error("Error al exportar GLTF:", error);
      },
      { binary: type === "glb" }
    );
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 2, 5], fov: 60 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 7.5]} intensity={1} />
        <OrbitControls />
        <group ref={exportGroupRef}>
          <RoomModel path="/models/room.glb">
            {availableModels.map((item, index) => (
              <ModelItem
                key={index}
                path={item.path}
                position={[index, 0, index]}
                scale={item.scale}
              />
            ))}
          </RoomModel>
        </group>
      </Canvas>

      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button onClick={() => handleExport("glb")}>Exportar GLB</button>
        <button onClick={() => handleExport("gltf")}>Exportar GLTF</button>
      </div>
    </div>
  );
}

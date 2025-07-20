import { Canvas } from "@react-three/fiber";
import { Environment, TransformControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import useSceneItems from "../hooks/useSceneItems";
import { availableModels, roomModel } from "../types/data";
import type { ItemType } from "../types/Item";
import type { Vector3 } from "@react-three/fiber";

// @ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

interface ModelItemProps {
  path: string;
  scale?: number;
}

function RoomModel({
  path,
  onReady,
}: {
  path: string;
  onReady?: (obj: THREE.Object3D) => void;
}) {
  const { scene } = useGLTF(path);
  const cloned = scene.clone(true);
  useEffect(() => {
    if (onReady) onReady(cloned);
  }, [cloned, onReady]);

  return <primitive object={cloned} />;
}

function ModelItem({ path, scale = 1 }: ModelItemProps) {
  const { scene } = useGLTF(path);
  const cloned = scene.clone(true);
  return <primitive object={cloned} scale={[scale, scale, scale]} />;
}

function MoveableItem({
  children,
  position,
  selected,
  onSelect,
  onPositionChange,
  mode = "translate",
}: {
  children: React.ReactNode;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  onPositionChange?: (newPos: [number, number, number]) => void;
  mode?: "translate" | "rotate";
}) {
  const groupRef = useRef<THREE.Group>(null!);

  // sincroniza el grupo con la posición del estado
  useEffect(() => {
    groupRef.current.position.set(...position);
  }, [position]);

  return (
    <>
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {children}
      </group>

      {selected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={mode}
          showY
          onObjectChange={() => {
            const p = groupRef.current.position;
            onPositionChange && onPositionChange([p.x, p.y, p.z]);
          }}
        />
      )}
    </>
  );
}

export default function InteractiveScene() {
  const exportGroupRef = useRef<THREE.Group>(null);
  const { items, addItem, updatePosition } = useSceneItems();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
    "translate"
  );
  const [roomObject, setRoomObject] = useState<THREE.Object3D | null>(null);

  const scales: Record<ItemType, number> = {
    desk: 0.8,
    projector: 0.01,
    plant: 1,
  };

  const handleAddItem = (type: ItemType, path: string) => {
    const id = addItem(type, path);
    setSelectedId(id);
  };

  const renderItem = (item: any) => {
    const scale = scales[item.type] ?? 0.5;
    return (
      <MoveableItem
        key={item.id}
        position={item.position}
        selected={item.id === selectedId}
        onSelect={() => setSelectedId(item.id)}
        onPositionChange={(newPos) => updatePosition(item.id, newPos)}
        mode={transformMode}
      >
        <ModelItem path={item.path} scale={scale} />
      </MoveableItem>
    );
  };

  const handleExport = (type: "glb" | "gltf") => {
    const group = exportGroupRef.current;
    if (!group) {
      console.warn("📤 No hay grupo para exportar");
      return;
    }

    console.log("📤 ExportGroupRef:", group);
    console.log(
      "📤 Children to export:",
      group.children.map((c) => c.type + (c.name ? `('${c.name}')` : ""))
    );

    // forzar recálculo de matrices en todo el árbol
    group.updateMatrixWorld(true);

    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        console.log("✅ Resultado export:", result);
        if (type === "glb" && result instanceof ArrayBuffer) {
          console.log("→ Es ArrayBuffer, tamaño:", result.byteLength);
          const blob = new Blob([result], { type: "model/gltf-binary" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "escena.glb";
          link.click();
          URL.revokeObjectURL(url);
        } else if (type === "gltf" && typeof result === "object") {
          console.log("→ Es JSON, claves:", Object.keys(result));
          const json = JSON.stringify(result, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "escena.gltf";
          link.click();
          URL.revokeObjectURL(url);
        } else {
          console.error("🚨 Resultado inesperado:", result);
        }
      },
      (err) => console.error("🚨 Error al exportar GLTF:", err),
      { binary: type === "glb" }
    );
  };

  return (
    <>
      {/* UI Controls */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 2,
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: 10,
          borderRadius: 6,
        }}
      >
        {availableModels.map((model) => (
          <div key={model.name} style={{ marginBottom: 6 }}>
            <button onClick={() => handleAddItem(model.name, model.path)}>
              Agregar {model.name}
            </button>
          </div>
        ))}

        <button
          onClick={() => setTransformMode("translate")}
          disabled={transformMode === "translate"}
        >
          Mover
        </button>
        <button
          onClick={() => setTransformMode("rotate")}
          disabled={transformMode === "rotate"}
          style={{ marginLeft: 8 }}
        >
          Rotar
        </button>

        <div style={{ marginTop: 10 }}>
          <button onClick={() => handleExport("glb")}>Exportar GLB</button>
          <button
            onClick={() => handleExport("gltf")}
            style={{ marginLeft: 8 }}
          >
            Exportar GLTF
          </button>
        </div>
      </div>

      {/* 3D Scene */}
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <Canvas
          style={{ width: "100%", height: "100%", display: "block" }}
          camera={{ position: [0, 3, 7], fov: 60 }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Environment preset="sunset" />

          <group ref={exportGroupRef}>
            {/* room model */}
            <RoomModel path={roomModel.path} onReady={setRoomObject} />

            {/* scene items */}
            {items.map(renderItem)}
          </group>
        </Canvas>
      </div>
    </>
  );
}

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import MoveableItem from "../controls/MoveableItem";
import useSceneItems from "../hooks/useSceneItems";
import { useState } from "react";
import ModelItem from "../items/ModelItem";
import RoomModel from "../items/RoomModel";
import RoomOrbitControls from "../controls/RoomOrbitControls"; // importalo así
import type { Models, ItemType } from "../types/Item";
import { roomModel, availableModels } from "../types/data";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export default function InteractiveRoom() {
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
    const newId = addItem(type, path);
    setSelectedId(newId);
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
        <ModelItem path={item.path} position={[0, 0, 0]} scale={scale} />
      </MoveableItem>
    );
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1,
          pointerEvents: "auto",
          backgroundColor: "rgba(255,255,255,0.8)",
          padding: 10,
          borderRadius: 4,
        }}
      >
        {availableModels.map((model) => (
          <div key={model.name} style={{ marginBottom: 6 }}>
            <button onClick={() => handleAddItem(model.name, model.path)}>
              Agregar {model.name.charAt(0).toUpperCase() + model.name.slice(1)}
            </button>
          </div>
        ))}
        <button
          onClick={() => setTransformMode("translate")}
          disabled={transformMode === "translate"}
          style={{ marginTop: 8 }}
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
      </div>
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <Canvas
          style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
          camera={{ position: [0, 3, 7], fov: 60 }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Environment preset="sunset" />

          <RoomModel
            path={roomModel.path}
            scale={roomModel.scale}
            onReady={setRoomObject}
          />

          <group>{items.map(renderItem)}</group>

          <RoomOrbitControls roomObject={roomObject} />
        </Canvas>
      </div>
    </>
  );
}

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import MoveableItem from "../controls/MoveableItem";
import useSceneItems from "../hooks/useSceneItems";
import { useState } from "react";
import ModelItem from "../items/ModelItem";
import RoomModel from "../items/RoomModel";
import RoomOrbitControls from "../controls/RoomOrbitControls";
import type { Models, ItemType } from "../types/Item";
import { roomModel, availableModels } from "../types/data";
import * as THREE from "three";

export default function InteractiveRoom() {
  const { items, addItem, updatePosition } = useSceneItems();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">("translate");
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

  const equiposFlotantes = [
    { name: "desk", label: "Escritorio" },
    { name: "projector", label: "Proyector" },
    { name: "plant", label: "Planta" },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: "50%",
          left: 10,
          transform: "translateY(-50%)",
          background: "#01071F", 
          borderRadius: "12px",
          padding: "1rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "180px",
          color: "#fff",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          userSelect: "none",
          zIndex: 20,
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", textAlign: "center" }}>
          Equipos 3D
        </h2>

        {equiposFlotantes.map(({ name, label }) => (
          <button
            key={name}
            onClick={() => {
              const model = availableModels.find((m) => m.name === name);
              if (model) handleAddItem(model.name as ItemType, model.path);
            }}
            style={{
              backgroundColor: "#822468",  
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1rem",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#9D2F7B"; // un tono más claro para hover
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#822468";
            }}
          >
            + {label}
          </button>
        ))}

        <hr style={{ borderColor: "#ffffff99" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            onClick={() => setTransformMode("translate")}
            disabled={transformMode === "translate"}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: transformMode === "translate" ? "default" : "pointer",
              backgroundColor: transformMode === "translate" ? "#444" : "#4caf50",
              color: "#fff",
              boxShadow:
                transformMode === "translate" ? "none" : "0 3px 8px rgba(76, 175, 80, 0.7)",
              transition: "background-color 0.3s ease",
            }}
          >
            Modo: Mover
          </button>

          <button
            onClick={() => setTransformMode("rotate")}
            disabled={transformMode === "rotate"}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: transformMode === "rotate" ? "default" : "pointer",
              backgroundColor: transformMode === "rotate" ? "#444" : "#2196f3",
              color: "#fff",
              boxShadow:
                transformMode === "rotate" ? "none" : "0 3px 8px rgba(33, 150, 243, 0.7)",
              transition: "background-color 0.3s ease",
            }}
          >
            Modo: Rotar
          </button>
        </div>
      </nav>

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

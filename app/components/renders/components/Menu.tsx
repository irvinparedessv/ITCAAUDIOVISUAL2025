// components/Menu.tsx
import React from "react";
import type { ItemType } from "../types/Item";
import { availableModels } from "../types/data";

interface ModelData {
  name: ItemType;
  path: string;
}

interface Props {
  transformMode: "translate" | "rotate";
  setTransformMode: (mode: "translate" | "rotate") => void;
  handleAddItem;
  handleExport;
}

const Menu: React.FC<Props> = ({
  transformMode,
  setTransformMode,
  handleAddItem,
  handleExport,
}) => {
  return (
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
      <h2
        style={{
          fontSize: "1.2rem",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        Equipos 3D
      </h2>

      {availableModels.map(({ name }, index) => (
        <button
          key={name + index}
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
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#9D2F7B"; // un tono más claro para hover
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#822468";
          }}
        >
          + {name}
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
              transformMode === "translate"
                ? "none"
                : "0 3px 8px rgba(76, 175, 80, 0.7)",
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
              transformMode === "rotate"
                ? "none"
                : "0 3px 8px rgba(33, 150, 243, 0.7)",
            transition: "background-color 0.3s ease",
          }}
        >
          Modo: Rotar
        </button>
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <button onClick={() => handleExport("glb")}>Exportar GLB</button>
          <button onClick={() => handleExport("gltf")}>Exportar GLTF</button>
        </div>
      </div>
    </nav>
  );
};

export default Menu;

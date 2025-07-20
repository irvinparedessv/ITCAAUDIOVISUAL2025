import React, { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  TransformControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import useSceneItems from "../hooks/useSceneItems";
import { availableModels } from "../types/data";
import type { ItemType } from "../types/Item";

// @ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

interface ModelItemProps {
  path: string;
  scale?: number;
}

function ModelItem({ path, scale = 1 }: ModelItemProps) {
  const { scene: raw } = useGLTF(path);
  const scene = useMemo(() => raw.clone(true), [raw]);
  return (
    <primitive object={scene} scale={[scale, scale, scale]} dispose={null} />
  );
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

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.userData.addedByUser = true; // Marca como agregado por el usuario
    }
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
      {selected && (
        <TransformControls
          object={groupRef.current}
          mode={mode}
          showY
          onObjectChange={() => {
            const p = groupRef.current.position;
            onPositionChange?.([p.x, p.y, p.z]);
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

  useEffect(() => {
    availableModels.forEach((model) => useGLTF.preload(model.path));
  }, []);

  const scales: Record<ItemType, number> = {
    desk: 0.8,
    projector: 0.01,
    plant: 1,
  };

  const handleAddItem = (type: ItemType, path: string) => {
    const id = addItem(type, path);
    setSelectedId(id);
  };

  function RoomModel({ path, scale = 1, onReady }) {
    //@ts-ignore
    const { scene } = useGLTF(path);
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      console.log("📏 Tamaño habitación (size):", size);
      console.log("🎯 Centro original:", center);

      // ✅ Centramos la habitación en X, Z y la bajamos en Y (para que repose en el suelo)
      clonedScene.position.x = clonedScene.position.x - center.x;
      clonedScene.position.y = clonedScene.position.y - center.y + size.y / 2;
      clonedScene.position.z = clonedScene.position.z - center.z;

      onReady?.(clonedScene);
    }, [clonedScene, onReady]);

    return <primitive object={clonedScene} scale={[scale, scale, scale]} />;
  }

  const renderItem = (item: any) => (
    <MoveableItem
      key={item.id}
      position={item.position}
      selected={item.id === selectedId}
      onSelect={() => setSelectedId(item.id)}
      onPositionChange={(newPos) => updatePosition(item.id, newPos)}
      mode={transformMode}
    >
      <ModelItem path={item.path} scale={scales[item.type] ?? 0.5} />
    </MoveableItem>
  );

  const handleExport = (type: "glb" | "gltf") => {
    const root = exportGroupRef.current;
    if (!root) {
      console.warn("❌ No hay root definido");
      return;
    }

    console.log("✅ Exportando desde root:", root);

    const exportGroup = new THREE.Group();

    root.traverse((obj) => {
      // Solo exportar objetos explícitamente marcados por el usuario
      if (!obj.userData?.addedByUser) return;

      if (obj instanceof THREE.Mesh) {
        const mesh = obj.clone();
        mesh.material = new THREE.MeshStandardMaterial({
          color: (mesh.material as any)?.color || new THREE.Color("white"),
          map: (mesh.material as any)?.map || null,
        });
        exportGroup.add(mesh);
        console.log("✅ Mesh exportado:", mesh.name || mesh.uuid);
      } else if (
        obj instanceof THREE.Group ||
        (obj instanceof THREE.Object3D && obj.type !== "Scene")
      ) {
        const clone = obj.clone(true);
        exportGroup.add(clone);
        console.log("✅ Grupo exportado:", clone.name || clone.uuid);
      }
    });

    try {
      exportGroup.updateMatrixWorld(true);
      console.log("✅ updateMatrixWorld() ejecutado correctamente");
    } catch (err) {
      console.error("💥 Error en updateMatrixWorld:", err);
      console.log("🧱 exportGroup.children:", exportGroup.children);
      return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      exportGroup,
      (result) => {
        if (type === "glb" && result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "escena.glb";
          a.click();
          URL.revokeObjectURL(url);
        } else if (type === "gltf" && typeof result === "object") {
          const json = JSON.stringify(result, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "escena.gltf";
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      (err) => console.error("❌ Error durante exportación:", err),
      { binary: type === "glb", embedImages: false }
    );
  };

  return (
    <>
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

      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <Canvas
          style={{ width: "100%", height: "100%", display: "block" }}
          camera={{ position: [0, 3.5, 3], fov: 60 }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Suspense fallback={null}>
            <Environment preset="sunset" />
            <OrbitControls makeDefault target={[0, 2.5, 0]} />
            <gridHelper args={[10, 10]} position={[0, 0, 0]} />
            <axesHelper args={[2]} />
            <RoomModel
              path="/models/room.glb" // ⚠️ Ajustá esta ruta si es diferente
              scale={1}
              onReady={(obj) => {
                obj.userData.addedByUser = true;
                console.log("🏠 Habitación cargada:", obj);
              }}
            />
            <group ref={exportGroupRef}>{items.map(renderItem)}</group>
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

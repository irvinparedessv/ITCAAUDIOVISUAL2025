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
import { uploadModel } from "~/services/uploadModelService";
import toast from "react-hot-toast";

interface InteractiveSceneProps {
  reserveId: number;
}

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
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.userData.addedByUser = true;
    }
  }, [position]);

  useEffect(() => {
    if (controlRef.current && groupRef.current && selected) {
      controlRef.current.attach(groupRef.current);
    }
    return () => {
      controlRef.current?.detach();
    };
  }, [selected]);

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
          ref={controlRef}
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

export default function InteractiveScene({ reserveId }: InteractiveSceneProps) {
  const exportGroupRef = useRef<THREE.Group>(null);
  const { items, addItem, updatePosition } = useSceneItems();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
    "translate"
  );
  const [loading, setLoading] = useState(false);

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

      clonedScene.position.x -= center.x;
      clonedScene.position.y -= center.y - size.y / 2;
      clonedScene.position.z -= center.z;

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

    const exportGroup = new THREE.Group();

    root.traverse((obj) => {
      if (!obj.userData?.addedByUser) return;

      if (obj instanceof THREE.Mesh) {
        const mesh = obj.clone();
        mesh.material = new THREE.MeshStandardMaterial({
          color: (mesh.material as any)?.color || new THREE.Color("white"),
          map: (mesh.material as any)?.map || null,
        });
        exportGroup.add(mesh);
      } else if (
        obj instanceof THREE.Group ||
        (obj instanceof THREE.Object3D && obj.type !== "Scene")
      ) {
        const clone = obj.clone(true);
        exportGroup.add(clone);
      }
    });

    const camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 1000);
    camera.position.set(0, 3.5, 3);
    camera.lookAt(new THREE.Vector3(0, 2.2, 0));
    camera.name = "MainCamera";
    exportGroup.add(camera);

    exportGroup.updateMatrixWorld(true);

    const exporter = new GLTFExporter();
    setLoading(true);

    exporter.parse(
      exportGroup,
      async (result) => {
        if (type === "glb" && result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          try {
            const res = await uploadModel(blob, "escena.glb", reserveId);
            toast.success("Archivo adjuntado a la reserva");
            console.log("✅ Subido al servidor:", res.path);
          } catch (err) {
            console.error("❌ Error al subir:", err);
          }
        }

        setLoading(false);
      },
      (err) => {
        console.error("❌ Error durante exportación:", err);
        setLoading(false);
      },
      { binary: type === "glb", embedImages: false }
    );
  };

  return (
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            fontSize: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Subiendo archivo...
        </div>
      )}

      {/* Menú flotante actualizado sin sombras y con colores sólidos */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
          backgroundColor: "#1e293b", // azul oscuro elegante
          padding: "20px 16px",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          minWidth: "180px",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          userSelect: "none",
          color: "#e0e0e0",
        }}
      >
        {availableModels.map((model) => (
          <button
            key={model.name}
            onClick={() => handleAddItem(model.name, model.path)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#06b6d4", // color aqua sólido
              color: "white",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Agregar {model.name}
          </button>
        ))}

        <button
          onClick={() => setTransformMode("translate")}
          disabled={transformMode === "translate"}
          style={{
            padding: "10px 14px",
            backgroundColor:
              transformMode === "translate" ? "#d1d5db" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Mover
        </button>

        <button
          onClick={() => setTransformMode("rotate")}
          disabled={transformMode === "rotate"}
          style={{
            padding: "10px 14px",
            backgroundColor: transformMode === "rotate" ? "#d1d5db" : "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Rotar
        </button>

        <button
          onClick={() => handleExport("glb")}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            fontWeight: "600",
            fontSize: "15px",
            backgroundColor: "#2563eb", // azul vibrante sólido
            color: "white",
            cursor: "pointer",
          }}
        >
          Exportar GLB
        </button>

        <button
          onClick={() => handleExport("gltf")}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            fontWeight: "600",
            fontSize: "15px",
            backgroundColor: "#6b7280", // gris sólido moderno
            color: "white",
            cursor: "pointer",
          }}
        >
          Exportar GLTF
        </button>
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
            <OrbitControls makeDefault target={[0, 2.2, 0]} />
            <gridHelper args={[10, 10]} position={[0, 0, 0]} />
            <axesHelper args={[2]} />
            <group ref={exportGroupRef}>
              <RoomModel
                path="/models/room.glb"
                scale={1}
                onReady={(obj) => {
                  obj.userData.addedByUser = true;
                  console.log("🏠 Habitación cargada:", obj);
                }}
              />
              {items.map(renderItem)}
            </group>
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

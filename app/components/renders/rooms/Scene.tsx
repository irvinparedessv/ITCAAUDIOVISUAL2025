import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  Suspense,
  useCallback,
} from "react";
import { Canvas } from "@react-three/fiber";
import RoomModel from "../items/RoomModel";
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
//@ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { uploadModel } from "~/services/uploadModelService";
import toast from "react-hot-toast";

interface InteractiveSceneProps {
  reserveId: number;
}

const LoadingOverlay = () => (
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
);

interface ModelItemProps {
  path: string;
  scale?: number;
}

const ModelItem = React.memo(function ModelItem({
  path,
  scale = 1,
}: ModelItemProps) {
  const { scene: raw } = useGLTF(path);
  const scene = useMemo(() => raw.clone(true), [raw]);
  return (
    <primitive object={scene} scale={[scale, scale, scale]} dispose={null} />
  );
});

const MoveableItem = ({
  children,
  position,
  rotation,
  selected,
  onSelect,
  onPositionChange,
  onRotationChange,
  mode = "translate",
}: {
  children: React.ReactNode;
  position: [number, number, number];
  rotation?: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  onPositionChange?: (newPos: [number, number, number]) => void;
  onRotationChange?: (newRot: [number, number, number]) => void;
  mode?: "translate" | "rotate";
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(...position);
    if (rotation) {
      groupRef.current.rotation.set(...rotation);
    }

    groupRef.current.userData.addedByUser = true;
    groupRef.current.name = `Item-${Math.floor(Math.random() * 10000)}`; // opcional para debug
  }, [position, rotation]);

  useEffect(() => {
    if (selected && controlRef.current && groupRef.current) {
      // Espera al siguiente frame para garantizar que la posición y rotación estén aplicadas
      requestAnimationFrame(() => {
        console.log(
          "🛠️ (deferred) Attaching control to:",
          groupRef.current.name
        );
        controlRef.current.attach(groupRef.current);
      });
    }
    return () => {
      if (controlRef.current) {
        controlRef.current.detach();
        console.log("🧹 Detached control");
      }
    };
  }, [selected]);

  return (
    <>
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          console.log("🟢 Item seleccionado:", groupRef.current?.name);
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
            if (!groupRef.current) return;

            const p = groupRef.current.position;
            const r = groupRef.current.rotation;
            console.log("📦 Nueva posición:", p.toArray());
            console.log("🎯 Nueva rotación:", r.toArray());
            onPositionChange?.([p.x, p.y, p.z]);
            onRotationChange?.([r.x, r.y, r.z]);
          }}
        />
      )}
    </>
  );
};

export default function InteractiveScene({ reserveId }: InteractiveSceneProps) {
  const exportGroupRef = useRef<THREE.Group>(null!);
  const { items, addItem, updatePosition, updateRotation } = useSceneItems();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
    "translate"
  );
  const [loading, setLoading] = useState(false);

  const handleRoomReady = useCallback((obj: THREE.Object3D) => {
    obj.userData.addedByUser = true;
  }, []);

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

  const renderItem = useCallback(
    (item) => (
      <MoveableItem
        key={item.id}
        position={item.position}
        rotation={item.rotation}
        selected={item.id === selectedId}
        onSelect={() => setSelectedId(item.id)}
        onPositionChange={(pos) => updatePosition(item.id, pos)}
        onRotationChange={(rot) => updateRotation(item.id, rot)}
        mode={transformMode}
      >
        <ModelItem path={item.path} scale={scales[item.type] ?? 0.5} />
      </MoveableItem>
    ),
    [selectedId, transformMode, updatePosition, updateRotation, scales]
  );

  const itemMeshes = useMemo(() => items.map(renderItem), [items, renderItem]);

  const handleExport = useCallback(
    (type: "glb" | "gltf") => {
      const root = exportGroupRef.current;
      if (!root) return;

      const exportGroup = new THREE.Group();

      root.traverse((obj) => {
        if (!obj.userData?.addedByUser) return;
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = (obj as THREE.Mesh).clone();
          mesh.material = new THREE.MeshStandardMaterial({
            color: (mesh.material as any)?.color || new THREE.Color("white"),
            map: (mesh.material as any)?.map || null,
          });
          exportGroup.add(mesh);
        } else if (obj.type !== "Scene") {
          exportGroup.add(obj.clone(true));
        }
      });

      const camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 1000);
      camera.position.set(0, 0, 2);
      camera.lookAt(new THREE.Vector3(0, 1.8, 0));
      camera.name = "MainCamera";
      exportGroup.add(camera);

      exportGroup.updateMatrixWorld(true);
      setLoading(true);

      new GLTFExporter().parse(
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
    },
    [reserveId]
  );

  return (
    <>
      {loading && <LoadingOverlay />}
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
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 1.7, 3], fov: 60 }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Environment preset="sunset" />
          <OrbitControls makeDefault target={[0, 2.2, 0]} />
          <gridHelper args={[10, 10]} />
          <axesHelper args={[2]} />
          <Suspense fallback={null}>
            <group ref={exportGroupRef}>
              <RoomModel
                path="/models/room.glb"
                scale={1} // <-- Puedes ajustar según tu modelo
                onReady={handleRoomReady}
              />
              {itemMeshes}
            </group>
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

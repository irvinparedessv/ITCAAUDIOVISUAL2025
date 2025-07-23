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
import useSceneItems from "../hooks/useSceneItems2";
import type { ItemType } from "../types/Item";

// @ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { uploadModel } from "~/services/uploadModelService";
import toast from "react-hot-toast";
import { APIURL } from "./../../../constants/constant";
import type { EquipmentSeleccionado } from "~/components/reserveE/types/Equipos";

interface InteractiveSceneProps {
  path_room: string;
  equipos: EquipmentSeleccionado[];
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

export default function InteractiveScene({
  path_room,
  equipos,
}: InteractiveSceneProps) {
  console.log("🎬 InteractiveScene: renderizando componente completo");

  const exportGroupRef = useRef<THREE.Group>(null);
  const { items, addItem, updatePosition } = useSceneItems();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
    "translate"
  );
  const [loading, setLoading] = useState(false);
  const handleRoomReady = useCallback((obj: THREE.Object3D) => {
    obj.userData.addedByUser = true;
    console.log("🏠 Habitación cargada:", obj);
  }, []);
  useEffect(() => {
    console.log("📦 Preloading modelos...");
    equipos.forEach((model) => useGLTF.preload(model.modelo_path));
  }, []);

  const scales: Record<ItemType, number> = {
    desk: 0.8,
    projector: 0.01,
    plant: 1,
  };

  const handleAddItem = (nombre: string, path: string) => {
    console.log("➕ Agregando item:", nombre, path);
    const id = addItem(nombre, APIURL + path);
    setSelectedId(id);
  };

  const renderItem = (item: any) => {
    console.log("🎯 renderItem: renderizando item", item.id);
    return (
      <MoveableItem
        key={item.id}
        position={item.position}
        selected={item.id === selectedId}
        onSelect={() => setSelectedId(item.id)}
        onPositionChange={(newPos) => {
          console.log("📍 Actualizando posición de item", item.id, newPos);
          updatePosition(item.id, newPos);
        }}
        mode={transformMode}
      >
        <ModelItem path={item.path} scale={scales[item.type] ?? 0.5} />
      </MoveableItem>
    );
  };

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
    camera.position.set(0, 0, 2);
    camera.lookAt(new THREE.Vector3(0, 1.8, 0));
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
            //const res = await uploadModel(blob, "escena.glb", reserveId);
            toast.success("Archivo adjuntado a la reserva");
            //console.log("✅ Subido al servidor:", res.path);
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
        {equipos.map((model) => (
          <div key={model.nombre_modelo} style={{ marginBottom: 6 }}>
            <button
              onClick={() =>
                handleAddItem(model.nombre_modelo, model.modelo_path)
              }
            >
              Agregar {model.nombre_modelo}
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
          camera={{ position: [0, 1.7, 3], fov: 60 }}
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
                path={APIURL + path_room}
                scale={0.01}
                onReady={handleRoomReady}
              />
              {items.map(renderItem)}
            </group>
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
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
import type { EquipmentSeleccionado } from "~/components/reserveE/types/Equipos";
//@ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import toast from "react-hot-toast";
import { APIURL } from "../../../constants/constant";

interface InteractiveSceneProps {
  path_room: string;
  equipos: EquipmentSeleccionado[];
  setFormData;
}

function LoadingOverlay() {
  return (
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
      Procesando exportación...
    </div>
  );
}
interface UIControlsProps {
  equipos: EquipmentSeleccionado[];
  transformMode: "translate" | "rotate";
  onAdd: (nombre: string, path: string) => void;
  onModeChange: (mode: "translate" | "rotate") => void;
  onExport: (type: "glb" | "gltf") => void;
}

function UIControls({
  equipos,
  transformMode,
  onAdd,
  onModeChange,
  onExport,
}: UIControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2,
        backgroundColor: "#1e293b",
        padding: "20px 16px",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        minWidth: "200px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: "none",
        color: "#e0e0e0",
      }}
    >
      <label
        style={{ marginBottom: "8px", fontSize: "1.1rem", fontWeight: "bold" }}
      >
        Equipos 3D
      </label>
      <div style={{ position: "relative" }}>
        <select
          onChange={(e) => {
            const selectedPath = e.target.value;
            const model = equipos.find((m) => m.modelo_path === selectedPath);
            if (model) onAdd(model.nombre_modelo, model.modelo_path);
            e.target.value = "";
          }}
          defaultValue=""
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "12px",
            backgroundColor: "#0f172a",
            color: "white",
            border: "1px solid #334155",
            fontSize: "14px",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          <option value="" disabled>
            ➕ Selecciona un equipo
          </option>
          {equipos.map((model) => (
            <option key={model.numero_serie} value={model.modelo_path}>
              {model.nombre_modelo}
            </option>
          ))}
        </select>
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "16px",
            color: "#cbd5e1",
          }}
        >
          ▼
        </span>
      </div>

      <button
        onClick={() => onModeChange("translate")}
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
        onClick={() => onModeChange("rotate")}
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
        onClick={() => onExport("glb")}
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          fontWeight: "bold",
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        Exportar GLB
      </button>
    </div>
  );
}

const MemoizedRoom = React.memo(RoomModel);

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

interface MoveableItemProps {
  children: React.ReactNode;
  position: [number, number, number];
  rotation?: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  onPositionChange?: (newPos: [number, number, number]) => void;
  onRotationChange?: (newRot: [number, number, number]) => void;
  mode?: "translate" | "rotate";
}
function MoveableItem({
  children,
  position,
  rotation,
  selected,
  onSelect,
  onPositionChange,
  onRotationChange,
  mode = "translate",
}: MoveableItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...position);
    if (rotation) groupRef.current.rotation.set(...rotation);
    groupRef.current.userData.addedByUser = true;
    groupRef.current.name = `Item-${Math.floor(Math.random() * 10000)}`;
  }, [position, rotation]);

  useEffect(() => {
    if (selected && controlRef.current && groupRef.current) {
      requestAnimationFrame(() => {
        controlRef.current.attach(groupRef.current);
      });
    }
    return () => controlRef.current?.detach();
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
            if (!groupRef.current) return;
            const p = groupRef.current.position;
            const r = groupRef.current.rotation;
            onPositionChange?.([p.x, p.y, p.z]);
            onRotationChange?.([r.x, r.y, r.z]);
          }}
        />
      )}
    </>
  );
}

export default function InteractiveScene({
  path_room,
  equipos,
  setFormData,
}: InteractiveSceneProps) {
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
    useGLTF.preload(APIURL + path_room);
    equipos.forEach((model) => useGLTF.preload(APIURL + model.modelo_path));
  }, [path_room, equipos]);

  const handleAdd = useCallback(
    (nombre: string, path: string) => {
      const id = addItem(nombre, APIURL + path);
      setSelectedId(id);
    },
    [addItem]
  );

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
        <ModelItem path={item.path} scale={0.5} />
      </MoveableItem>
    ),
    [selectedId, transformMode, updatePosition, updateRotation]
  );

  const itemMeshes = useMemo(() => items.map(renderItem), [items, renderItem]);

  const handleExport = useCallback((type: "glb" | "gltf") => {
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
      (result) => {
        if (type === "glb" && result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          const file = new File([blob], "escena.glb", {
            type: "model/gltf-binary",
          });
          setFormData((prev) => ({
            ...prev,
            modelFile: file,
          }));
          toast.success("Modelo adjuntado al formulario");
        }
        setLoading(false);
      },
      (err) => {
        console.error("❌ Error durante exportación:", err);
        setLoading(false);
      },
      { binary: type === "glb", embedImages: false }
    );
  }, []);

  return (
    <>
      {loading && <LoadingOverlay />}
      <UIControls
        equipos={equipos}
        transformMode={transformMode}
        onAdd={handleAdd}
        onModeChange={setTransformMode}
        onExport={handleExport}
      />
      <Canvas
        style={{ width: "95%", height: "95%" }}
        camera={{ position: [0, 2, 5], fov: 50 }}
      >
        <Environment preset="sunset" />
        <OrbitControls makeDefault target={[0, 2, 0]} />
        <Suspense fallback={null}>
          <group ref={exportGroupRef}>
            <MemoizedRoom
              path={APIURL + path_room}
              scale={0.01}
              onReady={handleRoomReady}
            />
            {itemMeshes}
          </group>
        </Suspense>
      </Canvas>
    </>
  );
}

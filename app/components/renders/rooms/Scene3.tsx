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
          <button onClick={() => onAdd(model.nombre_modelo, model.modelo_path)}>
            Agregar {model.nombre_modelo}
          </button>
        </div>
      ))}
      <button
        onClick={() => onModeChange("translate")}
        disabled={transformMode === "translate"}
      >
        Mover
      </button>
      <button
        onClick={() => onModeChange("rotate")}
        disabled={transformMode === "rotate"}
        style={{ marginLeft: 8 }}
      >
        Rotar
      </button>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => onExport("glb")}>Exportar GLB</button>
        <button onClick={() => onExport("gltf")} style={{ marginLeft: 8 }}>
          Exportar GLTF
        </button>
      </div>
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
  selected: boolean;
  onSelect: () => void;
  onPositionChange?: (newPos: [number, number, number]) => void;
  mode?: "translate" | "rotate";
}
function MoveableItem({
  children,
  position,
  selected,
  onSelect,
  onPositionChange,
  mode = "translate",
}: MoveableItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const controlRef = useRef<any>(null);

  useEffect(() => {
    groupRef.current.position.set(...position);
    groupRef.current.userData.addedByUser = true;
  }, [position]);

  useEffect(() => {
    if (controlRef.current && selected) {
      controlRef.current.attach(groupRef.current);
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
  const exportGroupRef = useRef<THREE.Group>(null!);
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
    useGLTF.preload(APIURL + path_room);
    equipos.forEach((model) => useGLTF.preload(APIURL + model.modelo_path));
  }, [path_room, equipos]);

  const scales: Record<ItemType, number> = {
    desk: 0.8,
    projector: 0.01,
    plant: 1,
  };

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
        selected={item.id === selectedId}
        onSelect={() => setSelectedId(item.id)}
        onPositionChange={(pos) => updatePosition(item.id, pos)}
        mode={transformMode}
      >
        <ModelItem path={item.path} scale={scales[item.type] ?? 0.5} />
      </MoveableItem>
    ),
    [selectedId, transformMode, updatePosition, scales]
  );

  const itemMeshes = useMemo(() => items.map(renderItem), [items, renderItem]);

  const handleExport = useCallback((type: "glb" | "gltf") => {
    const root = exportGroupRef.current;
    if (!root) return;
    const exportGroup = new THREE.Group();
    // include room and items
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
    // also add room root
    const roomObj = new THREE.Group();
    const sceneGroup = exportGroupRef.current.parent as THREE.Group;
    sceneGroup.traverse((obj) => {
      if (obj.userData?.addedByUser === true && !(obj as THREE.Mesh).isMesh) {
        roomObj.add(obj.clone(true));
      }
    });
    exportGroup.add(roomObj);

    // camera for export
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
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "scene.glb";
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          toast.success("Archivo GLB descargado");
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
            {/* Room */}
            <MemoizedRoom
              path={APIURL + path_room}
              scale={0.01}
              onReady={handleRoomReady}
            />
            {/* Items */}
            {itemMeshes}
          </group>
        </Suspense>
      </Canvas>
    </>
  );
}

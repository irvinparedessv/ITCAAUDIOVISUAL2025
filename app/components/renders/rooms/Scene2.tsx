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
import type { EquipmentSeleccionado } from "~/components/reserveE/types/Equipos";
import toast from "react-hot-toast";
//@ts-ignore
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { APIURL } from "../../../constants/constant";
import "../style/scene.css";
interface InteractiveSceneProps {
  path_room: string;
  equipos: EquipmentSeleccionado[];
  setFormData;
  onClose: () => void;
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
  onAdd: (nombre: string, path: string, serie: string) => void;
  onModeChange: (mode: "translate" | "rotate") => void;
  onExport: (type: "glb" | "gltf") => void;
  onDeleteSelected: () => void;
  canDelete: boolean;
}

function UIControls({
  equipos,
  transformMode,
  onAdd,
  onModeChange,
  onExport,
  onDeleteSelected,
  canDelete,
}: UIControlsProps) {
  return (
    <div className="menuscene">
      <label
        style={{ marginBottom: "8px", fontSize: "1.1rem", fontWeight: "bold" }}
      >
        Equipos 3D
      </label>
      <div style={{ position: "relative" }}>
        <select
          onChange={(e) => {
            const serie = e.target.value;
            const equipo = equipos.find((m) => m.numero_serie === serie);
            if (equipo) onAdd(equipo.nombre_modelo, equipo.modelo_path, serie);
            e.target.value = "";
          }}
          defaultValue=""
          className="btn primary-btn slbtn"
        >
          <option value="" disabled>
            Selecciona un equipo
          </option>
          {equipos.map((model) => (
            <option key={model.numero_serie} value={model.numero_serie}>
              {model.nombre_modelo}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onDeleteSelected}
        className="btn primary-btn"
        disabled={!canDelete}
        style={{
          cursor: canDelete ? "pointer" : "not-allowed",
        }}
      >
        Eliminar seleccionado
      </button>
      <button
        onClick={() => onModeChange("translate")}
        disabled={transformMode === "translate" || !canDelete}
        className={`btn primary-btn ${
          transformMode === "translate" ? "isselected" : ""
        }`}
      >
        Mover
      </button>
      <button
        className={`btn primary-btn ${
          transformMode === "rotate" ? "isselected" : ""
        }`}
        onClick={() => onModeChange("rotate")}
        disabled={transformMode === "rotate" || !canDelete}
      >
        Rotar
      </button>
      <button
        className="btn primary-btn"
        onClick={onExport.bind(null, "glb")}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
        }}
      >
        ADJUNTAR AL FORMULARIO
      </button>
    </div>
  );
}

const MemoizedRoom = React.memo(RoomModel);

const ModelItem = React.memo(function ModelItem({
  path,
  scale = 1,
}: {
  path: string;
  scale?: number;
}) {
  const { scene: raw } = useGLTF(path);
  const scene = useMemo(() => raw.clone(true), [raw]);
  return (
    <primitive object={scene} scale={[scale, scale, scale]} dispose={null} />
  );
});

function MoveableItem({
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
}) {
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
  onClose,
}: InteractiveSceneProps) {
  const exportGroupRef = useRef<THREE.Group>(null!);
  const { items, addItem, updatePosition, updateRotation, removeItem } =
    useSceneItems();
  const [equiposDisponibles, setEquiposDisponibles] =
    useState<EquipmentSeleccionado[]>(equipos);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
    "translate"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEquiposDisponibles(equipos);
  }, [equipos]);

  useEffect(() => {
    useGLTF.preload(APIURL + path_room);
    equipos.forEach((model) => useGLTF.preload(APIURL + model.modelo_path));
  }, [path_room, equipos]);

  const handleRoomReady = useCallback((obj: THREE.Object3D) => {
    obj.userData.addedByUser = true;
  }, []);

  const handleAdd = useCallback(
    (nombre: string, path: string, serie: string) => {
      const fullPath = APIURL + path;
      const id = addItem(nombre, fullPath);
      setSelectedId(id);

      setEquiposDisponibles((prev) =>
        prev.filter((e) => e.numero_serie !== serie)
      );
    },
    [addItem]
  );

  const handleRemoveItem = useCallback(
    (id: number) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      removeItem(id);
      setSelectedId(null);

      const originalPath = item.path.replace(APIURL, "");
      const equipo = equipos.find(
        (e) => e.modelo_path === originalPath && !equiposDisponibles.includes(e)
      );

      if (equipo) {
        setEquiposDisponibles((prev) => [...prev, equipo]);
      }
    },
    [items, removeItem, equipos, equiposDisponibles]
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
            onClose();
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
    [setFormData]
  );

  return (
    <>
      {loading && <LoadingOverlay />}
      <UIControls
        equipos={equiposDisponibles}
        transformMode={transformMode}
        onAdd={handleAdd}
        onModeChange={setTransformMode}
        onExport={handleExport}
        onDeleteSelected={() =>
          selectedId !== null && handleRemoveItem(selectedId)
        }
        canDelete={selectedId !== null}
      />
      <Canvas
        style={{ width: "100%", height: "100%", padding: "1rem" }}
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
            {items.map(renderItem)}
          </group>
        </Suspense>
      </Canvas>
    </>
  );
}

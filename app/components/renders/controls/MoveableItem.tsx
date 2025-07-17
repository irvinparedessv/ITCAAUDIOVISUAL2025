import { TransformControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function MoveableItem({
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
  const groupRef = useRef<THREE.Group>(null);
  const transformRef = useRef<any>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
    }
  }, [position]);

  useEffect(() => {
    if (!selected || !transformRef.current || !onPositionChange) return;

    const handleChange = () => {
      const pos = groupRef.current!.position;
      onPositionChange([pos.x, pos.y, pos.z]);
    };

    const controls = transformRef.current;
    controls.addEventListener("objectChange", handleChange);

    return () => {
      controls.removeEventListener("objectChange", handleChange);
    };
  }, [selected, onPositionChange]);

  return (
    <>
      {selected && groupRef.current && (
        <TransformControls
          ref={transformRef}
          object={groupRef.current}
          mode={mode}
          showY={true}
        />
      )}
      <group
        ref={groupRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {children}
      </group>
    </>
  );
}

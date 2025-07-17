import { useGLTF } from "@react-three/drei";
import type { Vector3 } from "@react-three/fiber";
import * as THREE from "three";

interface ModelItemProps {
  path: string;
  position: Vector3;
  scale?: number;
}

export default function ModelItem({
  path,
  position,
  scale = 1,
}: ModelItemProps) {
  const { scene } = useGLTF(path);

  // Clonamos el scene para tener una instancia independiente
  const clonedScene = scene.clone(true);

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={[scale, scale, scale]}
    />
  );
}

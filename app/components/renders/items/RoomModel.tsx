import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

interface RoomModelProps {
  path: string;
  scale?: number;
  onReady?: (obj: THREE.Object3D) => void;
}

export default function RoomModel({
  path,
  scale = 1,
  onReady,
}: RoomModelProps) {
  const { scene } = useGLTF(path);
  const clonedScene = scene.clone(true);

  useEffect(() => {
    if (onReady) onReady(clonedScene);
  }, [clonedScene, onReady]);

  return <primitive object={clonedScene} scale={[scale, scale, scale]} />;
}

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
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
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Mostrar info en consola
    console.log("Tamaño (size):", size);
    console.log("Centro original:", center);

    // Mover al centro del mundo y ajustar la altura
    clonedScene.position.sub(center); // centro en (0, 0, 0)
    clonedScene.position.y += size.y / 2; // levantar mitad de su altura

    if (onReady) onReady(clonedScene);
  }, [clonedScene, onReady]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={[scale, scale, scale]} />
    </group>
  );
}

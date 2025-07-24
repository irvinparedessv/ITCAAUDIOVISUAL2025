import React, { useMemo } from "react";
import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface RoomModelProps {
  path: string;
  scale?: number;
  onReady?: (obj: THREE.Object3D) => void;
}

const RoomModel = React.memo(function RoomModel({
  path,
  scale = 1,
  onReady,
}: RoomModelProps) {
  const { scene } = useGLTF(path);
  const clonedScene = useMemo(() => {
    console.log("🔁 RoomModel: clonando escena");
    return scene.clone(true);
  }, [scene]);

  useEffect(() => {
    console.log("🏗️ RoomModel: ejecutando useEffect para centrar modelo");

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

  return (
    <primitive
      object={clonedScene}
      pointerEvents="none"
      scale={[scale, scale, scale]}
    />
  );
});
export default RoomModel;

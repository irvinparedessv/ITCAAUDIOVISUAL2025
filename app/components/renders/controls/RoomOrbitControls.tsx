import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface RoomOrbitControlsProps {
  roomObject: THREE.Object3D | null;
}

export default function RoomOrbitControls({
  roomObject,
}: RoomOrbitControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (roomObject && controlsRef.current) {
      const box = new THREE.Box3().setFromObject(roomObject);
      const center = new THREE.Vector3();
      box.getCenter(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [roomObject, camera]);

  return <OrbitControls ref={controlsRef} />;
}

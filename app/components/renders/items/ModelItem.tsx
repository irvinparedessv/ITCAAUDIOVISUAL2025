import React, { useMemo, useEffect } from "react";
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
  console.log("[ModelItem] render", { path, position, scale });
  const { scene: raw } = useGLTF(path);

  const scene = useMemo(() => {
    console.log("[ModelItem] useMemo before clone");
    const cloned = raw.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    console.log("[ModelItem] bounding box", {
      min: box.min.toArray(),
      max: box.max.toArray(),
    });
    const center = box.getCenter(new THREE.Vector3());
    console.log("[ModelItem] center", center.toArray());
    cloned.position.sub(center);
    console.log("[ModelItem] cloned.position", cloned.position.toArray());
    return cloned;
  }, [raw]);

  useEffect(() => {
    console.log("[ModelItem] applied position prop", position);
  }, [position]);

  return (
    <primitive
      object={scene}
      position={position}
      scale={[scale, scale, scale]}
      dispose={null}
    />
  );
}

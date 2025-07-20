import { useState } from "react";
import type { SceneItem, ItemType } from "../types/Item";

export default function useSceneItems() {
  const [items, setItems] = useState<SceneItem[]>([]);

  const addItem = (type: ItemType, path: string): number => {
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    const newItem: SceneItem = {
      id: newId,
      type,
      path,
      position: [0, 2.5, 0],
    };
    setItems((prev) => [...prev, newItem]);
    return newId;
  };

  const updatePosition = (id: number, newPos: [number, number, number]) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: newPos } : item
      )
    );
  };

  const updateRotation = (id: number, newRot: [number, number, number]) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: newRot } : item
      )
    );
  };

  return { items, addItem, updatePosition, updateRotation };
}

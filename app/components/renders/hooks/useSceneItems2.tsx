import { useState } from "react";
import type { SceneItem, ItemType } from "../types/Item2";

export default function useSceneItems() {
  const [items, setItems] = useState<SceneItem[]>([]);

  const addItem = (name: string, path: string, scale: number = 1): number => {
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    const newItem: SceneItem = {
      id: newId,
      type: name,
      path,
      position: [0, 0.7, 0],
      scale,
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

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, addItem, updatePosition, updateRotation, removeItem };
}

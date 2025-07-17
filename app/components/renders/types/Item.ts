export type ItemType = "desk" | "plant" | "projector";

export interface SceneItem {
  id: number;
  type: ItemType;
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}
export interface Models {
  name: ItemType;
  path: string;
  scale: number;
}

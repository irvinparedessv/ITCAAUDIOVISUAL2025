export type ItemType = "desk" | "plant" | "projector";

export interface SceneItem {
  id: number;
  type: string;
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}
export interface Models {
  id: number;
  name: string;
  path: string;
  scale: number;
}

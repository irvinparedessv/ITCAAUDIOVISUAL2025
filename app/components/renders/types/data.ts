import type { Models } from "./Item";

export const roomModel = {
  name: "room",
  path: "/models/room.glb",
  scale: 1,
};

export const availableModels: Models[] = [
  { id: 1, name: "desk", path: "/models/desk.glb", scale: 0.8 },
  { id: 2, name: "projector", path: "/models/projector.glb", scale: 0.01 },
];

import type { Models } from "./Item";

export const roomModel = {
  name: "room",
  path: "/models/room.glb",
  scale: 1,
};

export const availableModels: Models[] = [
  { name: "desk", path: "/models/desk.glb", scale: 0.8 },
  { name: "projector", path: "/models/projector.glb", scale: 0.01 },
];

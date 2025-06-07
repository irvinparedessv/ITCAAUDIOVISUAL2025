import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  ssr: {
    noExternal: ["react-datepicker", "react-360-view", "pannellum"],
  },
  plugins: [tailwindcss(),  tsconfigPaths()],
  base: "./",
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"), // <-- apunta a tu carpeta app
    },
  },
});

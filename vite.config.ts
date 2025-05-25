import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  ssr: {
    noExternal: ["react-datepicker", "react-360-view"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: '0.0.0.0'
  }
});

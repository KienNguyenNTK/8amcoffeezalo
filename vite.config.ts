import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    base: "./",
    plugins: [
      react(),
      {
        name: "override-config",
        config: () => ({
          build: {
            outDir: "www",
            emptyOutDir: false,
            target: "esnext"
          }
        })
      }

    ],
    assetsInclude: ["**/*.otf"],
    define: {
      "process.env": process.env
    }
  });
};

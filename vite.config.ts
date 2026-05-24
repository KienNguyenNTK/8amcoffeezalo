import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zaloMiniApp from "zmp-vite-plugin";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    plugins: [
      react(),
      zaloMiniApp(),
    ],
    build: {
      outDir: "www",
      assetsInlineLimit: 0,
      target: "es2015",
      emptyOutDir: true,
    },
    assetsInclude: ["**/*.otf"],
    define: {
      "process.env": process.env
    }
  });
};

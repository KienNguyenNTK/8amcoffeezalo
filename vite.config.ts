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
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      outDir: "www",
      assetsInlineLimit: 0,
      target: "es2015",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-icons")) {
                return "vendor-icons";
              }
              if (id.includes("firebase")) {
                return "vendor-firebase";
              }
              if (id.includes("@amcharts") || id.includes("chart.js") || id.includes("recharts")) {
                return "vendor-charts";
              }
              if (
                id.includes("zmp-sdk") ||
                id.includes("zmp-ui") ||
                id.includes("antd") ||
                id.includes("@ant-design") ||
                id.includes("rc-") ||
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router-dom") ||
                id.includes("recoil")
              ) {
                return "vendor-framework";
              }
            }
          }
        }
      }
    },
    assetsInclude: ["**/*.otf"],
  });
};

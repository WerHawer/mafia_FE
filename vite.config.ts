import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    // WASM-based packages must be excluded from Vite pre-bundling
    exclude: ["@livekit/krisp-noise-filter", "@mediapipe/tasks-vision"],
  },
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "@babel/plugin-proposal-decorators",
            {
              version: "2023-05",
            },
          ],
        ],
      },
    }),
    tsconfigPaths(),
  ],
});

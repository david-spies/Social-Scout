import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Proxy /scan and /health to the FastAPI backend during development.
    // This eliminates CORS preflight issues — the browser sees one origin.
    proxy: {
      "/scan": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // Uncomment to debug proxied requests:
        // configure: (proxy) => { proxy.on("proxyReq", (_, req) => console.log("→", req.url)); },
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    // Raise chunk size warning threshold — monospace font + inline styles
    // push the main bundle slightly over Vite's default 500 kB warning.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },

  preview: {
    port: 4173,
  },
});

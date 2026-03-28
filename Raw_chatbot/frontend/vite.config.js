import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to backend so no CORS issues in dev
    proxy: {
      "/chat": "http://localhost:8000",
      "/location": "http://localhost:8000",
      "/samples": "http://localhost:8000",
      "/voice": "http://localhost:8000",
      "/guidance": "http://localhost:8000",
      "/static": "http://localhost:8000",
    },
  },
});
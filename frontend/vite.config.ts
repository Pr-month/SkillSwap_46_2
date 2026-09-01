/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { fileURLToPath } from "url";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // loadEnv читает файл .env и отдаёт объект { VITE_API_URL: "...", ... }
  const env = loadEnv(mode, process.cwd(), "");
  // Если переменной нет — используем локальный бэкенд по умолчанию
  const backendUrl = env.VITE_API_URL || "http://localhost:3000";

  return {
  plugins: [
    react(),
    svgr({
      svgrOptions: { icon: true },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [],
      },
    ],
  },
  };
});
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

// Defaults so the sandbox builds/runs after a plain clone. Replit injects
// PORT / BASE_PATH when the artifact is mounted under a sub-path.
const port = Number(process.env.PORT ?? 8081);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

// Replit's cartographer/runtime-error plugins are optional — only loaded
// inside Replit dev, and never fatal if the packages are absent.
async function loadReplitPlugins(): Promise<PluginOption[]> {
  if (process.env.NODE_ENV === "production" || process.env.REPL_ID === undefined) {
    return [];
  }
  const plugins: PluginOption[] = [];
  try {
    const m = await import(/* @vite-ignore */ "@replit/vite-plugin-runtime-error-modal");
    plugins.push((m.default ?? (m as any))());
  } catch {
    // not installed — skip
  }
  try {
    const m = await import(/* @vite-ignore */ "@replit/vite-plugin-cartographer");
    plugins.push(m.cartographer({ root: path.resolve(import.meta.dirname, "..") }));
  } catch {
    // not installed — skip
  }
  return plugins;
}

const replitPlugins = await loadReplitPlugins();

export default defineConfig({
  base: basePath,
  plugins: [mockupPreviewPlugin(), react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

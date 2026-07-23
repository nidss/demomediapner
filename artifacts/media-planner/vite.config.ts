import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Frontend dev-server port. Defaults to Vite's usual 5173 so the app runs
// out-of-the-box after a plain `git clone` (on Replit, PORT is injected).
const port = Number(process.env.PORT ?? 5173);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

// Base public path. Defaults to "/" for a standard deployment. Replit sets
// BASE_PATH when the app is mounted under a sub-path.
const basePath = process.env.BASE_PATH ?? "/";

// Where to proxy `/api` requests during local development. The API server
// listens on 8080 by default (see artifacts/api-server).
const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8080";

// Replit-only plugins. They are optional: on a public GitHub checkout the
// app builds and runs without them. We load them lazily and never fail if
// the packages are absent or we are not running inside Replit.
async function loadReplitPlugins(): Promise<PluginOption[]> {
  if (process.env.NODE_ENV === "production" || process.env.REPL_ID === undefined) {
    return [];
  }

  const plugins: PluginOption[] = [];

  const tryLoad = async (
    specifier: string,
    factory: (mod: any) => PluginOption,
  ) => {
    try {
      const mod = await import(/* @vite-ignore */ specifier);
      plugins.push(factory(mod));
    } catch {
      // Package not installed (e.g. stripped from a public fork) — skip it.
    }
  };

  await tryLoad("@replit/vite-plugin-runtime-error-modal", (m) =>
    (m.default ?? m)(),
  );
  await tryLoad("@replit/vite-plugin-cartographer", (m) =>
    m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
  );
  await tryLoad("@replit/vite-plugin-dev-banner", (m) => m.devBanner());

  return plugins;
}

const replitPlugins = await loadReplitPlugins();

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // Forward API calls to the Express server during development so the
    // frontend can use relative `/api/...` URLs just like in production.
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});

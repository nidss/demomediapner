#!/usr/bin/env node
// Runs the API server and the media-planner web app together for local
// development — no extra dependencies required. Loads variables from a
// root-level `.env` file (if present) and streams both processes' output
// with a short prefix. Ctrl-C stops everything.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- Minimal .env loader (no dependency) --------------------------------
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(path.join(repoRoot, ".env"));

const API_PORT = process.env.API_PORT ?? "8080";
const WEB_PORT = process.env.WEB_PORT ?? "5173";

const procs = [
  {
    name: "api",
    color: "\x1b[36m", // cyan
    args: ["--filter", "@workspace/api-server", "run", "dev"],
    env: { PORT: API_PORT, NODE_ENV: "development" },
  },
  {
    name: "web",
    color: "\x1b[35m", // magenta
    args: ["--filter", "@workspace/media-planner", "run", "dev"],
    env: {
      PORT: WEB_PORT,
      BASE_PATH: "/",
      API_PROXY_TARGET: `http://localhost:${API_PORT}`,
    },
  },
];

const reset = "\x1b[0m";
const children = [];
let shuttingDown = false;

function prefixStream(stream, name, color) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      process.stdout.write(`${color}[${name}]${reset} ${line}\n`);
    }
  });
}

for (const p of procs) {
  const child = spawn("pnpm", p.args, {
    cwd: repoRoot,
    env: { ...process.env, ...p.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  prefixStream(child.stdout, p.name, p.color);
  prefixStream(child.stderr, p.name, p.color);
  child.on("exit", (code) => {
    if (!shuttingDown) {
      process.stdout.write(`${p.color}[${p.name}]${reset} exited with code ${code}\n`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.stdout.write(
  `Starting dev servers:\n` +
    `  web  → http://localhost:${WEB_PORT}\n` +
    `  api  → http://localhost:${API_PORT}/api\n\n`,
);

import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ---------------------------------------------------------------------------
// Optionally serve the built frontend from the same process.
//
// This lets a single `node dist/index.mjs` serve both the REST API and the
// media-planner web app in production (e.g. a plain VPS or a container), so
// no separate router/reverse-proxy is required. During local development the
// Vite dev server serves the frontend and proxies `/api` here instead.
//
// Set WEB_STATIC_DIR to override the location of the built assets. When the
// directory is missing (API-only deployments) this block is skipped.
// ---------------------------------------------------------------------------
const webStaticDir =
  process.env.WEB_STATIC_DIR ??
  path.resolve(process.cwd(), "artifacts/media-planner/dist/public");

if (fs.existsSync(path.join(webStaticDir, "index.html"))) {
  logger.info({ webStaticDir }, "Serving static frontend");
  app.use(express.static(webStaticDir));

  // SPA fallback: send index.html for any non-API GET request so client-side
  // routing (wouter) works on deep links / page refreshes.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(webStaticDir, "index.html"));
  });
}

export default app;

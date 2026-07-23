# Media Planner

A content calendar tool for planning social media posts, videos, and articles,
with live platform previews (Instagram, Facebook, Twitter/X, TikTok, YouTube,
LinkedIn).

Built as a **pnpm workspace monorepo**:

| Package | Description |
| --- | --- |
| `artifacts/media-planner` | React + Vite frontend |
| `artifacts/api-server` | Express 5 REST API |
| `artifacts/mockup-sandbox` | Component preview sandbox (design tool, optional) |
| `lib/db` | PostgreSQL schema + Drizzle ORM |
| `lib/api-zod` | Zod schemas generated from the OpenAPI spec |
| `lib/api-client-react` | Generated React Query API client |
| `lib/object-storage-web` | File-upload React helpers |

> This project was originally created on Replit. It now runs **anywhere** with
> just Node.js and PostgreSQL — no Replit account required. (Replit support is
> preserved, so it still works there too.)

---

## Requirements

- **Node.js 20+** (24 recommended — see `.nvmrc`)
- **pnpm** (`corepack enable` or `npm i -g pnpm`)
- **PostgreSQL** (a `docker-compose.yml` is included for convenience)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start PostgreSQL (or point DATABASE_URL at your own instance)
docker compose up -d

# 4. Create the database schema
set -a; source .env; set +a
pnpm db:push

# 5. Run the app (API + frontend together)
pnpm dev
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api` requests to the Express API on port 8080, so
everything works from a single URL.

### ภาษาไทย (สรุปสั้น ๆ)

โปรเจกต์นี้เดิมสร้างบน Replit ตอนนี้ปรับให้รันได้ทั่วไปบน GitHub แล้ว
ขั้นตอนใช้งาน: ติดตั้งด้วย `pnpm install` → คัดลอก `.env.example` เป็น `.env` →
เปิดฐานข้อมูลด้วย `docker compose up -d` → สร้าง schema ด้วย `pnpm db:push` →
รันแอปด้วย `pnpm dev` แล้วเปิด http://localhost:5173

---

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the API server and the web app together (loads `.env`) |
| `pnpm build` | Typechecks and builds every package |
| `pnpm start` | Runs the production server (serves API **and** the built frontend on `PORT`, default 8080) |
| `pnpm db:push` | Pushes the Drizzle schema to the database |
| `pnpm typecheck` | Full typecheck across all packages |

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | — (**required**) | PostgreSQL connection string |
| `API_PORT` | `8080` | Port for the API server in dev |
| `WEB_PORT` | `5173` | Port for the Vite dev server |
| `PORT` | `8080` | Port used by the production server (`pnpm start`) |
| `LOG_LEVEL` | `info` | API server log level |
| `WEB_STATIC_DIR` | `artifacts/media-planner/dist/public` | Where the production server looks for built frontend assets |

## Production

```bash
pnpm build          # builds the frontend and bundles the API server
pnpm start          # single process serves API + frontend on $PORT
```

`pnpm start` runs the bundled Express server, which also serves the built
frontend from `artifacts/media-planner/dist/public` (with SPA fallback). Set
`DATABASE_URL` and `PORT` in the environment.

## Object storage (optional)

File uploads use an object-storage backend. By default this targets Replit's
Object Storage sidecar and requires `PUBLIC_OBJECT_SEARCH_PATHS` /
`PRIVATE_OBJECT_DIR`. **The calendar and content features work without it** —
only the upload endpoints are affected. To enable uploads on a non-Replit host,
replace the client in `artifacts/api-server/src/lib/objectStorage.ts` with your
own S3/GCS credentials.

## Database schema

See [`replit.md`](./replit.md) for the API route reference and the `content`
table schema.

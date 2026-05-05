# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Media Planner (`artifacts/media-planner`)
- **Preview path**: `/`
- **Purpose**: Content calendar tool for planning social media posts, videos, and articles
- **Pages**:
  - `/` — Monthly calendar view with per-day content chips and stats bar
  - `/create` — Create content with live platform previews (Instagram, Facebook, Twitter/X, TikTok, YouTube, LinkedIn)
  - `/content/:id` — View/edit content detail with platform preview

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- **Purpose**: Express 5 REST API for the media planner
- **Routes**:
  - `GET/POST /api/content` — List/create content
  - `GET/PUT/DELETE /api/content/:id` — Get/update/delete content
  - `GET /api/calendar/month-summary` — Per-day content counts for a month
  - `GET /api/calendar/stats` — Aggregate stats (totals, by type/status/platform)

## Database Schema

### `content` table
- `id` (serial PK)
- `title` (text)
- `caption` (text)
- `type` (enum: video | post | article)
- `status` (enum: draft | scheduled | published)
- `platforms` (text[]) — instagram, facebook, twitter, tiktok, youtube, linkedin
- `scheduled_date` (date)
- `media_url` (text, nullable)
- `thumbnail_url` (text, nullable)
- `tags` (text[])
- `created_at`, `updated_at` (timestamp)

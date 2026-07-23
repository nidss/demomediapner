/**
 * In-browser demo backend.
 *
 * GitHub Pages can only serve static files — there is no Express server or
 * PostgreSQL. When VITE_DEMO_MODE is enabled we intercept `window.fetch` for
 * `/api/*` routes and serve them from `localStorage`, so the app is fully
 * usable as a static site. Data persists per-browser and can be reset by
 * clearing the "media-planner-demo:*" localStorage keys.
 *
 * The responses mirror the shapes produced by artifacts/api-server so the
 * generated API client works unchanged.
 */
import type {
  Content,
  ContentStats,
  MonthSummary,
  ContentType,
  ContentStatus,
  Platform,
} from "@workspace/api-client-react";

const STORAGE_KEY = "media-planner-demo:content";
const SEQ_KEY = "media-planner-demo:seq";

type ContentRecord = Content;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
function readAll(): ContentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContentRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ContentRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nextId(): number {
  const current = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(SEQ_KEY, String(current));
  return current;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Seed data — a handful of items across the current month so the calendar
// and stats look alive on first visit.
// ---------------------------------------------------------------------------
function seedIfEmpty(): void {
  if (localStorage.getItem(STORAGE_KEY)) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based
  const on = (day: number) => ymd(new Date(y, m, day));

  const nowIso = now.toISOString();
  const seeds: Array<Omit<ContentRecord, "id" | "createdAt" | "updatedAt">> = [
    {
      title: "Product launch teaser",
      caption: "Something exciting is coming 👀 Stay tuned!",
      type: "video" as ContentType,
      status: "scheduled" as ContentStatus,
      platforms: ["instagram", "tiktok", "youtube"] as Platform[],
      scheduledDate: on(3),
      mediaUrl: null,
      thumbnailUrl: null,
      tags: ["launch", "teaser"],
    },
    {
      title: "Weekly tips thread",
      caption: "5 tips to plan your content calendar like a pro 🧵",
      type: "post" as ContentType,
      status: "published" as ContentStatus,
      platforms: ["twitter", "linkedin"] as Platform[],
      scheduledDate: on(6),
      mediaUrl: null,
      thumbnailUrl: null,
      tags: ["tips", "productivity"],
    },
    {
      title: "Behind the scenes",
      caption: "A look at how we build in public.",
      type: "post" as ContentType,
      status: "draft" as ContentStatus,
      platforms: ["instagram", "facebook"] as Platform[],
      scheduledDate: on(12),
      mediaUrl: null,
      thumbnailUrl: null,
      tags: ["bts"],
    },
    {
      title: "Deep-dive article: content strategy",
      caption: "Our full guide to a 90-day content strategy.",
      type: "article" as ContentType,
      status: "scheduled" as ContentStatus,
      platforms: ["linkedin"] as Platform[],
      scheduledDate: on(18),
      mediaUrl: null,
      thumbnailUrl: null,
      tags: ["strategy", "guide"],
    },
    {
      title: "Monthly recap reel",
      caption: "Everything that happened this month in 60 seconds.",
      type: "video" as ContentType,
      status: "draft" as ContentStatus,
      platforms: ["instagram", "tiktok", "youtube", "facebook"] as Platform[],
      scheduledDate: on(25),
      mediaUrl: null,
      thumbnailUrl: null,
      tags: ["recap"],
    },
  ];

  const items: ContentRecord[] = seeds.map((s) => ({
    ...s,
    id: nextId(),
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
  writeAll(items);
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------
function inMonth(dateStr: string, month: number, year: number): boolean {
  const [y, m] = dateStr.split("-").map(Number);
  return y === year && m === month;
}

function filterList(params: URLSearchParams): ContentRecord[] {
  const month = params.get("month") ? Number(params.get("month")) : undefined;
  const year = params.get("year") ? Number(params.get("year")) : undefined;
  const type = params.get("type") ?? undefined;
  const status = params.get("status") ?? undefined;
  const platform = params.get("platform") ?? undefined;

  return readAll()
    .filter((c) => {
      if (type && c.type !== type) return false;
      if (status && c.status !== status) return false;
      if (platform && !c.platforms.includes(platform as Platform)) return false;
      if (month && year && !inMonth(c.scheduledDate, month, year)) return false;
      if (year && !month) {
        const [cy] = c.scheduledDate.split("-").map(Number);
        if (cy !== year) return false;
      }
      return true;
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

function buildStats(params: URLSearchParams): ContentStats {
  const month = params.get("month") ? Number(params.get("month")) : undefined;
  const year = params.get("year") ? Number(params.get("year")) : undefined;

  const all = readAll();
  const rows =
    month && year ? all.filter((c) => inMonth(c.scheduledDate, month, year)) : all;

  const stats: ContentStats = {
    total: rows.length,
    byType: { video: 0, post: 0, article: 0 },
    byStatus: { draft: 0, scheduled: 0, published: 0 },
    byPlatform: {},
    publishedThisMonth: 0,
    scheduledThisMonth: 0,
  };

  for (const row of rows) {
    stats.byType[row.type]++;
    stats.byStatus[row.status]++;
    for (const p of row.platforms) {
      stats.byPlatform[p] = (stats.byPlatform[p] ?? 0) + 1;
    }
  }

  if (month && year) {
    stats.publishedThisMonth = stats.byStatus.published;
    stats.scheduledThisMonth = stats.byStatus.scheduled;
  } else {
    const now = new Date();
    const cm = now.getMonth() + 1;
    const cy = now.getFullYear();
    for (const row of all) {
      if (!inMonth(row.scheduledDate, cm, cy)) continue;
      if (row.status === "published") stats.publishedThisMonth++;
      if (row.status === "scheduled") stats.scheduledThisMonth++;
    }
  }

  return stats;
}

function buildMonthSummary(params: URLSearchParams): MonthSummary {
  const month = Number(params.get("month"));
  const year = Number(params.get("year"));
  const rows = readAll().filter((c) => inMonth(c.scheduledDate, month, year));

  const dayMap: Record<string, MonthSummary["days"][number]> = {};
  for (const row of rows) {
    const d = row.scheduledDate;
    dayMap[d] ??= {
      date: d,
      total: 0,
      byType: { video: 0, post: 0, article: 0 },
      byStatus: { draft: 0, scheduled: 0, published: 0 },
    };
    dayMap[d].total++;
    dayMap[d].byType[row.type]++;
    dayMap[d].byStatus[row.status]++;
  }

  return {
    month,
    year,
    days: Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)),
    totalContent: rows.length,
  };
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function applyCreate(body: any): Content {
  const nowIso = new Date().toISOString();
  const record: ContentRecord = {
    id: nextId(),
    title: body.title,
    caption: body.caption ?? "",
    type: body.type,
    status: body.status ?? "draft",
    platforms: body.platforms ?? [],
    scheduledDate: body.scheduledDate,
    mediaUrl: body.mediaUrl ?? null,
    thumbnailUrl: body.thumbnailUrl ?? null,
    tags: body.tags ?? [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const items = readAll();
  items.push(record);
  writeAll(items);
  return record;
}

function applyUpdate(id: number, body: any): Content | null {
  const items = readAll();
  const idx = items.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated: ContentRecord = {
    ...items[idx],
    ...Object.fromEntries(
      Object.entries(body).filter(([, v]) => v !== undefined),
    ),
    id,
    updatedAt: new Date().toISOString(),
  };
  items[idx] = updated;
  writeAll(items);
  return updated;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
async function handle(
  method: string,
  pathname: string,
  search: URLSearchParams,
  bodyText: string | null,
): Promise<Response | null> {
  const body = bodyText ? safeJson(bodyText) : undefined;

  // Object storage is not available on a static host.
  if (pathname.startsWith("/api/storage")) {
    return json({ error: "File uploads are disabled in the static demo." }, 501);
  }

  if (pathname === "/api/healthz") return json({ status: "ok" });

  if (pathname === "/api/content") {
    if (method === "GET") return json(filterList(search));
    if (method === "POST") return json(applyCreate(body), 201);
  }

  const contentMatch = pathname.match(/^\/api\/content\/(\d+)$/);
  if (contentMatch) {
    const id = Number(contentMatch[1]);
    if (method === "GET") {
      const found = readAll().find((c) => c.id === id);
      return found ? json(found) : json({ error: "Content not found" }, 404);
    }
    if (method === "PUT") {
      const updated = applyUpdate(id, body);
      return updated ? json(updated) : json({ error: "Content not found" }, 404);
    }
    if (method === "DELETE") {
      const items = readAll();
      const next = items.filter((c) => c.id !== id);
      if (next.length === items.length)
        return json({ error: "Content not found" }, 404);
      writeAll(next);
      return json(null, 204);
    }
  }

  if (pathname === "/api/calendar/stats" && method === "GET") {
    return json(buildStats(search));
  }

  if (pathname === "/api/calendar/month-summary" && method === "GET") {
    return json(buildMonthSummary(search));
  }

  return json({ error: `Not found: ${method} ${pathname}` }, 404);
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Install the fetch interceptor. Safe to call once at startup.
 */
export function installDemoApi(): void {
  seedIfEmpty();

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    let url: URL;
    let method = init?.method ?? "GET";
    let bodyText: string | null = null;

    try {
      if (typeof input === "string") {
        url = new URL(input, window.location.origin);
        bodyText = typeof init?.body === "string" ? init.body : null;
      } else if (input instanceof URL) {
        url = input;
        bodyText = typeof init?.body === "string" ? init.body : null;
      } else {
        // Request object
        url = new URL(input.url, window.location.origin);
        method = init?.method ?? input.method ?? "GET";
        bodyText =
          typeof init?.body === "string" ? init.body : await input.clone().text();
      }
    } catch {
      return originalFetch(input as RequestInfo, init);
    }

    if (!url.pathname.startsWith("/api/")) {
      return originalFetch(input as RequestInfo, init);
    }

    const response = await handle(
      method.toUpperCase(),
      url.pathname,
      url.searchParams,
      bodyText,
    );
    return response ?? originalFetch(input as RequestInfo, init);
  };

  // eslint-disable-next-line no-console
  console.info(
    "%c[demo] Static demo mode — API is served from your browser (localStorage).",
    "color:#7c3aed;font-weight:bold",
  );
}

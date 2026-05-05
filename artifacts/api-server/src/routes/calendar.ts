import { Router } from "express";
import { db, contentTable } from "@workspace/db";
import { sql, and } from "drizzle-orm";
import {
  GetMonthSummaryQueryParams,
  GetContentStatsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/calendar/month-summary", async (req, res) => {
  const parsed = GetMonthSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month, year } = parsed.data;
  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

  const rows = await db
    .select({
      date: contentTable.scheduledDate,
      type: contentTable.type,
      status: contentTable.status,
    })
    .from(contentTable)
    .where(
      sql`${contentTable.scheduledDate} >= ${startDate} AND ${contentTable.scheduledDate} <= ${endDate}`
    );

  const dayMap: Record<string, {
    date: string;
    total: number;
    byType: { video: number; post: number; article: number };
    byStatus: { draft: number; scheduled: number; published: number };
  }> = {};

  for (const row of rows) {
    const d = row.date;
    if (!dayMap[d]) {
      dayMap[d] = {
        date: d,
        total: 0,
        byType: { video: 0, post: 0, article: 0 },
        byStatus: { draft: 0, scheduled: 0, published: 0 },
      };
    }
    dayMap[d].total++;
    dayMap[d].byType[row.type]++;
    dayMap[d].byStatus[row.status]++;
  }

  res.json({
    month,
    year,
    days: Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)),
    totalContent: rows.length,
  });
});

router.get("/calendar/stats", async (req, res) => {
  const parsed = GetContentStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month, year } = parsed.data;

  let dateFilter = sql`1=1`;
  if (month && year) {
    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;
    dateFilter = sql`${contentTable.scheduledDate} >= ${startDate} AND ${contentTable.scheduledDate} <= ${endDate}`;
  }

  const rows = await db
    .select({
      type: contentTable.type,
      status: contentTable.status,
      platforms: contentTable.platforms,
    })
    .from(contentTable)
    .where(dateFilter);

  const stats = {
    total: rows.length,
    byType: { video: 0, post: 0, article: 0 },
    byStatus: { draft: 0, scheduled: 0, published: 0 },
    byPlatform: {} as Record<string, number>,
    publishedThisMonth: 0,
    scheduledThisMonth: 0,
  };

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  for (const row of rows) {
    stats.byType[row.type]++;
    stats.byStatus[row.status]++;
    for (const p of row.platforms) {
      stats.byPlatform[p] = (stats.byPlatform[p] ?? 0) + 1;
    }
  }

  if (!month || !year) {
    const monthStr = String(curMonth).padStart(2, "0");
    const startDate = `${curYear}-${monthStr}-01`;
    const daysInMonth = new Date(curYear, curMonth, 0).getDate();
    const endDate = `${curYear}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

    const monthRows = await db
      .select({ status: contentTable.status })
      .from(contentTable)
      .where(
        sql`${contentTable.scheduledDate} >= ${startDate} AND ${contentTable.scheduledDate} <= ${endDate}`
      );

    for (const r of monthRows) {
      if (r.status === "published") stats.publishedThisMonth++;
      if (r.status === "scheduled") stats.scheduledThisMonth++;
    }
  } else {
    stats.publishedThisMonth = stats.byStatus.published;
    stats.scheduledThisMonth = stats.byStatus.scheduled;
  }

  res.json(stats);
});

export default router;

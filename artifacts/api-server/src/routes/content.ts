import { Router } from "express";
import { db, contentTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  ListContentQueryParams,
  CreateContentBody,
  UpdateContentBody,
  GetContentParams,
  UpdateContentParams,
  DeleteContentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/content", async (req, res) => {
  const parsed = ListContentQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month, year, type, status, platform } = parsed.data;

  const conditions = [];

  if (type) conditions.push(eq(contentTable.type, type));
  if (status) conditions.push(eq(contentTable.status, status));

  if (month && year) {
    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const endDate = year && month
      ? new Date(year, month, 0).toISOString().slice(0, 10)
      : null;
    if (endDate) {
      conditions.push(
        sql`${contentTable.scheduledDate} >= ${startDate} AND ${contentTable.scheduledDate} <= ${endDate}`
      );
    }
  } else if (year) {
    conditions.push(
      sql`EXTRACT(YEAR FROM ${contentTable.scheduledDate}) = ${year}`
    );
  }

  if (platform) {
    conditions.push(sql`${platform} = ANY(${contentTable.platforms})`);
  }

  const rows = await db
    .select()
    .from(contentTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(contentTable.scheduledDate);

  const items = rows.map((row) => ({
    ...row,
    scheduledDate: row.scheduledDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    mediaUrl: row.mediaUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
  }));

  res.json(items);
});

router.post("/content", async (req, res) => {
  const parsed = CreateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, caption, type, status, platforms, scheduledDate, mediaUrl, thumbnailUrl, tags } = parsed.data;

  const [row] = await db
    .insert(contentTable)
    .values({
      title,
      caption: caption ?? "",
      type,
      status: status ?? "draft",
      platforms: platforms ?? [],
      scheduledDate,
      mediaUrl: mediaUrl ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      tags: tags ?? [],
    })
    .returning();

  res.status(201).json({
    ...row,
    scheduledDate: row.scheduledDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    mediaUrl: row.mediaUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
  });
});

router.get("/content/:id", async (req, res) => {
  const parsed = GetContentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .select()
    .from(contentTable)
    .where(eq(contentTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Content not found" });
    return;
  }

  res.json({
    ...row,
    scheduledDate: row.scheduledDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    mediaUrl: row.mediaUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
  });
});

router.put("/content/:id", async (req, res) => {
  const paramsParsed = UpdateContentParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateContentBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const body = bodyParsed.data;
  if (body.title !== undefined) updates.title = body.title;
  if (body.caption !== undefined) updates.caption = body.caption;
  if (body.type !== undefined) updates.type = body.type;
  if (body.status !== undefined) updates.status = body.status;
  if (body.platforms !== undefined) updates.platforms = body.platforms;
  if (body.scheduledDate !== undefined) updates.scheduledDate = body.scheduledDate;
  if (body.mediaUrl !== undefined) updates.mediaUrl = body.mediaUrl;
  if (body.thumbnailUrl !== undefined) updates.thumbnailUrl = body.thumbnailUrl;
  if (body.tags !== undefined) updates.tags = body.tags;

  const [row] = await db
    .update(contentTable)
    .set(updates)
    .where(eq(contentTable.id, paramsParsed.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Content not found" });
    return;
  }

  res.json({
    ...row,
    scheduledDate: row.scheduledDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    mediaUrl: row.mediaUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
  });
});

router.delete("/content/:id", async (req, res) => {
  const parsed = DeleteContentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .delete(contentTable)
    .where(eq(contentTable.id, parsed.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Content not found" });
    return;
  }

  res.status(204).send();
});

export default router;

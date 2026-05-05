import { pgTable, serial, text, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentTypeEnum = pgEnum("content_type", ["video", "post", "article"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "scheduled", "published"]);

export const contentTable = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  caption: text("caption").notNull().default(""),
  type: contentTypeEnum("type").notNull(),
  status: contentStatusEnum("status").notNull().default("draft"),
  platforms: text("platforms").array().notNull().default([]),
  scheduledDate: date("scheduled_date").notNull(),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContentSchema = createInsertSchema(contentTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contentTable.$inferSelect;

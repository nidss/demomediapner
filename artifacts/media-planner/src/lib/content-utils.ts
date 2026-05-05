export type ContentType = "video" | "post" | "article";
export type ContentStatus = "draft" | "scheduled" | "published";
export type Platform = "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "linkedin";

export const CONTENT_TYPE_COLORS: Record<ContentType, { bg: string; text: string; dot: string }> = {
  video: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  post: { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  article: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
};

export const CONTENT_STATUS_COLORS: Record<ContentStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  published: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter / X",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export const ALL_PLATFORMS: Platform[] = ["instagram", "facebook", "twitter", "tiktok", "youtube", "linkedin"];
export const ALL_CONTENT_TYPES: ContentType[] = ["video", "post", "article"];
export const ALL_STATUSES: ContentStatus[] = ["draft", "scheduled", "published"];

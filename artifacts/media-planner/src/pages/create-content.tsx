import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { RiArrowLeftLine, RiCalendarLine, RiCloseLine, RiSendPlaneLine } from "react-icons/ri";
import { useCreateContent } from "@workspace/api-client-react";
import { PLATFORM_LABELS, ALL_PLATFORMS, ALL_CONTENT_TYPES, ALL_STATUSES, CONTENT_TYPE_COLORS } from "@/lib/content-utils";
import type { Platform, ContentType, ContentStatus } from "@/lib/content-utils";
import { PlatformPreview, PlatformIcon } from "@/components/platform-preview";
import { MediaUploader } from "@/components/media-uploader";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  caption: z.string().default(""),
  type: z.enum(["video", "post", "article"]),
  status: z.enum(["draft", "scheduled", "published"]),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  scheduledDate: z.string().min(1, "Date is required"),
  tags: z.array(z.string()).default([]),
  mediaUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateContentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultDate = searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");

  const [activePlatformPreview, setActivePlatformPreview] = useState<Platform>("instagram");
  const [tagInput, setTagInput] = useState("");

  const createMutation = useCreateContent();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      caption: "",
      type: "post",
      status: "draft",
      platforms: ["instagram"],
      scheduledDate: defaultDate,
      tags: [],
      mediaUrl: null,
      thumbnailUrl: null,
    },
  });

  const { watch, setValue, register, handleSubmit, formState: { errors } } = form;
  const watchedValues = watch();

  function togglePlatform(p: Platform) {
    const current = watchedValues.platforms;
    if (current.includes(p)) {
      if (current.length === 1) return;
      setValue("platforms", current.filter(x => x !== p));
      if (activePlatformPreview === p) {
        setActivePlatformPreview(current.filter(x => x !== p)[0] as Platform);
      }
    } else {
      setValue("platforms", [...current, p]);
      setActivePlatformPreview(p);
    }
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, "");
      if (tag && !watchedValues.tags.includes(tag)) {
        setValue("tags", [...watchedValues.tags, tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setValue("tags", watchedValues.tags.filter(t => t !== tag));
  }

  async function onSubmit(data: FormData) {
    createMutation.mutate(
      {
        data: {
          title: data.title,
          caption: data.caption,
          type: data.type as ContentType,
          status: data.status as ContentStatus,
          platforms: data.platforms as Platform[],
          scheduledDate: data.scheduledDate,
          tags: data.tags,
          mediaUrl: data.mediaUrl ?? null,
          thumbnailUrl: data.thumbnailUrl ?? null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Content created", description: `"${data.title}" has been saved.` });
          navigate("/");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create content.", variant: "destructive" });
        },
      }
    );
  }

  const selectedPlatforms = watchedValues.platforms as Platform[];
  const mediaServingUrl = watchedValues.mediaUrl ? `/api/storage${watchedValues.mediaUrl}` : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background nm-raised relative z-10 px-6 py-4 flex items-center gap-3">
        <Link href="/">
          <button className="nm-raised w-9 h-9 flex items-center justify-center rounded-xl bg-background text-muted-foreground hover:text-primary transition-colors active:nm-inset">
            <RiArrowLeftLine className="text-base" />
          </button>
        </Link>
        <h1 className="text-foreground font-bold text-lg tracking-tight">Create Content</h1>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Content Type */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Content Type</label>
            <div className="nm-inset bg-background rounded-2xl p-1.5 flex gap-1.5">
              {ALL_CONTENT_TYPES.map(t => {
                const colors = CONTENT_TYPE_COLORS[t];
                const isSelected = watchedValues.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                      isSelected
                        ? `nm-raised ${colors.bg} ${colors.text}`
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {watchedValues.type === "video" ? "Video" : "Image"} / Media
            </label>
            <MediaUploader
              value={watchedValues.mediaUrl}
              onChange={(path) => setValue("mediaUrl", path)}
              accept={watchedValues.type === "video" ? "video" : "both"}
              label={watchedValues.type === "video" ? "Upload video" : "Upload image or video"}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Title</label>
            <input
              {...register("title")}
              placeholder="Give your content a title..."
              className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
            />
            {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title.message}</p>}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Caption / Body</label>
            <textarea
              {...register("caption")}
              rows={4}
              placeholder="Write your caption or content body..."
              className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none border-0"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platforms</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_PLATFORMS.map(p => {
                const isSelected = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "nm-inset bg-background text-primary"
                        : "nm-raised-sm bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <PlatformIcon platform={p} className="text-sm flex-shrink-0" />
                    <span className="truncate">{PLATFORM_LABELS[p]}</span>
                  </button>
                );
              })}
            </div>
            {errors.platforms && <p className="text-xs text-destructive mt-1.5">{errors.platforms.message as string}</p>}
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                <span className="inline-flex items-center gap-1"><RiCalendarLine /> Schedule</span>
              </label>
              <input
                type="date"
                {...register("scheduledDate")}
                className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
              />
              {errors.scheduledDate && <p className="text-xs text-destructive mt-1.5">{errors.scheduledDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Status</label>
              <select
                {...register("status")}
                className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Tags</label>
            {watchedValues.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {watchedValues.tags.map(tag => (
                  <span key={tag} className="nm-raised-sm inline-flex items-center gap-1 bg-background text-primary text-xs font-semibold px-2.5 py-1 rounded-lg">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                      <RiCloseLine className="text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Type a tag and press Enter..."
              className="nm-inset w-full bg-background rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link href="/" className="flex-1">
              <button type="button" className="nm-raised w-full py-3 rounded-2xl bg-background text-sm font-semibold text-muted-foreground hover:text-foreground transition-all active:nm-inset">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="nm-raised flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 active:nm-inset"
            >
              <RiSendPlaneLine />
              {createMutation.isPending ? "Saving..." : `Save${watchedValues.status === "published" ? " & Publish" : ""}`}
            </button>
          </div>
        </form>

        {/* Platform Preview Panel */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platform Preview</div>
            <div className="nm-inset bg-background rounded-2xl p-1.5 flex flex-wrap gap-1">
              {selectedPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePlatformPreview(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activePlatformPreview === p
                      ? "nm-raised bg-background text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PlatformIcon platform={p} className="text-sm" />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="nm-inset bg-background rounded-3xl p-6 flex items-start justify-center min-h-[420px]">
            <div className="w-full max-w-xs">
              <PlatformPreview
                platform={activePlatformPreview}
                title={watchedValues.title}
                caption={watchedValues.caption}
                contentType={watchedValues.type as ContentType}
                mediaUrl={mediaServingUrl}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Preview updates as you type — upload media to see it here
          </p>
        </div>
      </div>
    </div>
  );
}

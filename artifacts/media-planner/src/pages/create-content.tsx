import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { RiArrowLeftLine, RiCalendarLine, RiCloseLine, RiAddLine, RiSendPlaneLine } from "react-icons/ri";
import { useCreateContent } from "@workspace/api-client-react";
import { PLATFORM_LABELS, ALL_PLATFORMS, ALL_CONTENT_TYPES, ALL_STATUSES, CONTENT_TYPE_COLORS } from "@/lib/content-utils";
import type { Platform, ContentType, ContentStatus } from "@/lib/content-utils";
import { PlatformPreview, PlatformIcon } from "@/components/platform-preview";
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar border-b border-sidebar-border px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <button className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
            <RiArrowLeftLine className="text-xl" />
          </button>
        </Link>
        <h1 className="text-sidebar-foreground font-bold text-lg">Create Content</h1>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Content Type */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Content Type</label>
            <div className="flex gap-2">
              {ALL_CONTENT_TYPES.map(t => {
                const colors = CONTENT_TYPE_COLORS[t];
                const isSelected = watchedValues.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize border-2 transition-all ${isSelected ? `${colors.bg} ${colors.text} border-current` : "bg-card border-card-border text-muted-foreground hover:border-border"}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Title</label>
            <input
              {...register("title")}
              placeholder="Give your content a title..."
              className="w-full bg-card border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Caption / Body</label>
            <textarea
              {...register("caption")}
              rows={4}
              placeholder="Write your caption or content body..."
              className="w-full bg-card border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Platforms</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_PLATFORMS.map(p => {
                const isSelected = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${isSelected ? "bg-primary/10 border-primary text-primary" : "bg-card border-card-border text-muted-foreground hover:border-border"}`}
                  >
                    <PlatformIcon platform={p} className="text-base flex-shrink-0" />
                    <span className="truncate text-xs">{PLATFORM_LABELS[p]}</span>
                  </button>
                );
              })}
            </div>
            {errors.platforms && <p className="text-xs text-destructive mt-1">{errors.platforms.message as string}</p>}
          </div>

          {/* Date & Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <span className="inline-flex items-center gap-1"><RiCalendarLine /> Scheduled Date</span>
              </label>
              <input
                type="date"
                {...register("scheduledDate")}
                className="w-full bg-card border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              {errors.scheduledDate && <p className="text-xs text-destructive mt-1">{errors.scheduledDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</label>
              <select
                {...register("status")}
                className="w-full bg-card border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {watchedValues.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                    <RiCloseLine className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Type a tag and press Enter..."
              className="w-full bg-card border border-input rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/" className="flex-1">
              <button type="button" className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RiSendPlaneLine />
              {createMutation.isPending ? "Saving..." : `Save ${watchedValues.status === "published" ? "& Publish" : ""}`}
            </button>
          </div>
        </form>

        {/* Platform Preview Panel */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Platform Preview</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePlatformPreview(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activePlatformPreview === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  <PlatformIcon platform={p} className="text-sm" />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6 flex items-start justify-center min-h-[400px]">
            <div className="w-full max-w-xs">
              <PlatformPreview
                platform={activePlatformPreview}
                title={watchedValues.title}
                caption={watchedValues.caption}
                contentType={watchedValues.type as ContentType}
                mediaUrl={watchedValues.mediaUrl}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Preview updates as you type — select a platform above to switch views
          </p>
        </div>
      </div>
    </div>
  );
}

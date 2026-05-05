import { useState } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { RiArrowLeftLine, RiPencilLine, RiDeleteBinLine, RiCloseLine, RiSendPlaneLine, RiCalendarLine } from "react-icons/ri";
import {
  useGetContent,
  useUpdateContent,
  useDeleteContent,
  getGetContentQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CONTENT_TYPE_COLORS, CONTENT_STATUS_COLORS, PLATFORM_LABELS, ALL_PLATFORMS, ALL_CONTENT_TYPES, ALL_STATUSES } from "@/lib/content-utils";
import type { Platform, ContentType, ContentStatus } from "@/lib/content-utils";
import { PlatformPreview, PlatformIcon } from "@/components/platform-preview";
import { MediaUploader } from "@/components/media-uploader";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ContentDetailPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/content/:id");
  const id = match ? Number(params!.id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [activePlatformPreview, setActivePlatformPreview] = useState<Platform>("instagram");
  const [tagInput, setTagInput] = useState("");

  const { data: content, isLoading } = useGetContent(id, {
    query: { enabled: !!id, queryKey: getGetContentQueryKey(id) },
  });

  const updateMutation = useUpdateContent();
  const deleteMutation = useDeleteContent();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: content
      ? {
          title: content.title,
          caption: content.caption,
          type: content.type as ContentType,
          status: content.status as ContentStatus,
          platforms: content.platforms as Platform[],
          scheduledDate: content.scheduledDate,
          tags: content.tags,
          mediaUrl: content.mediaUrl,
          thumbnailUrl: content.thumbnailUrl,
        }
      : undefined,
  });

  const { watch, setValue, register, handleSubmit, formState: { errors } } = form;
  const watchedValues = watch();

  function togglePlatform(p: Platform) {
    const current = watchedValues.platforms ?? [];
    if (current.includes(p)) {
      if (current.length === 1) return;
      setValue("platforms", current.filter(x => x !== p));
    } else {
      setValue("platforms", [...current, p]);
      setActivePlatformPreview(p);
    }
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, "");
      if (tag && !watchedValues.tags?.includes(tag)) {
        setValue("tags", [...(watchedValues.tags ?? []), tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setValue("tags", (watchedValues.tags ?? []).filter(t => t !== tag));
  }

  async function onSubmit(data: FormData) {
    updateMutation.mutate(
      {
        id,
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
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey(id) });
          toast({ title: "Updated", description: "Content saved successfully." });
          setIsEditing(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        },
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Content has been deleted." });
          navigate("/");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-sidebar px-6 py-4 flex items-center gap-4">
          <Link href="/"><button className="nm-raised-dark w-8 h-8 flex items-center justify-center rounded-xl text-sidebar-foreground"><RiArrowLeftLine className="text-base" /></button></Link>
          <Skeleton className="h-6 w-48 rounded-xl" />
        </header>
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="nm-raised bg-background rounded-3xl p-12 text-center">
          <div className="text-5xl font-black text-primary/20 mb-3">404</div>
          <p className="text-muted-foreground mb-5">Content not found.</p>
          <Link href="/">
            <button className="nm-raised-sm bg-background text-primary text-sm font-semibold px-5 py-2.5 rounded-xl hover:text-primary/80 transition-colors active:nm-inset">
              Back to Calendar
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const displayType = isEditing ? (watchedValues.type as ContentType) : content.type as ContentType;
  const displayCaption = isEditing ? watchedValues.caption : content.caption;
  const displayTitle = isEditing ? watchedValues.title : content.title;
  const displayPlatforms = isEditing ? (watchedValues.platforms as Platform[]) : content.platforms as Platform[];
  const typeColors = CONTENT_TYPE_COLORS[content.type as ContentType];
  const statusColors = CONTENT_STATUS_COLORS[content.status as ContentStatus];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar px-6 py-4 flex items-center gap-3">
        <Link href="/">
          <button className="nm-raised-dark w-8 h-8 flex items-center justify-center rounded-xl text-sidebar-foreground hover:text-sidebar-primary transition-colors active:nm-inset-dark flex-shrink-0">
            <RiArrowLeftLine className="text-base" />
          </button>
        </Link>
        <h1 className="text-sidebar-foreground font-bold text-lg flex-1 truncate tracking-tight">{content.title}</h1>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="nm-raised-dark inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sidebar-accent/50 text-sidebar-foreground text-sm font-medium hover:text-sidebar-primary transition-colors active:nm-inset-dark"
            >
              <RiPencilLine className="text-sm" /> Edit
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="nm-raised-dark inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors active:nm-inset-dark">
                <RiDeleteBinLine className="text-sm" /> Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background border-0 nm-raised-lg rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete content?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{content.title}" will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="nm-raised bg-background rounded-2xl border-0 hover:text-primary transition-all active:nm-inset">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="nm-raised bg-destructive text-destructive-foreground rounded-2xl border-0 hover:opacity-90 active:nm-inset">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Content Type */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Content Type</label>
              <div className="nm-inset bg-background rounded-2xl p-1.5 flex gap-1.5">
                {ALL_CONTENT_TYPES.map(t => {
                  const colors = CONTENT_TYPE_COLORS[t];
                  const isSelected = watchedValues.type === t;
                  return (
                    <button key={t} type="button" onClick={() => setValue("type", t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                        isSelected
                          ? `nm-raised ${colors.bg} ${colors.text}`
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
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
                className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
              />
              {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title.message}</p>}
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Caption / Body</label>
              <textarea
                {...register("caption")}
                rows={4}
                className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none border-0"
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platforms</label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_PLATFORMS.map(p => {
                  const isSelected = (watchedValues.platforms ?? []).includes(p);
                  return (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? "nm-inset bg-background text-primary"
                          : "nm-raised-sm bg-background text-muted-foreground hover:text-foreground"
                      }`}>
                      <PlatformIcon platform={p} className="text-sm flex-shrink-0" />
                      <span className="truncate">{PLATFORM_LABELS[p]}</span>
                    </button>
                  );
                })}
              </div>
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
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Status</label>
                <select
                  {...register("status")}
                  className="nm-inset w-full bg-background rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Tags</label>
              {(watchedValues.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(watchedValues.tags ?? []).map(tag => (
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
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="nm-raised flex-1 py-3 rounded-2xl bg-background text-sm font-semibold text-muted-foreground hover:text-foreground transition-all active:nm-inset"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="nm-raised flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all active:nm-inset"
              >
                <RiSendPlaneLine />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* View mode */
          <div className="flex flex-col gap-6">
            {/* Type + Status badges */}
            <div className="nm-raised bg-background rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
              <span className={`nm-raised-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold capitalize ${typeColors.bg} ${typeColors.text}`}>
                {content.type}
              </span>
              <span className={`nm-raised-sm inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                {content.status}
              </span>
            </div>

            {/* Scheduled date */}
            <div className="nm-raised bg-background rounded-2xl px-5 py-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Scheduled</div>
              <div className="text-sm font-semibold text-foreground">
                {format(parseISO(content.scheduledDate), "EEEE, MMMM d, yyyy")}
              </div>
            </div>

            {/* Caption */}
            <div className="nm-raised bg-background rounded-2xl px-5 py-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Caption</div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {content.caption || <span className="text-muted-foreground italic">No caption</span>}
              </p>
            </div>

            {/* Platforms */}
            <div className="nm-raised bg-background rounded-2xl px-5 py-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platforms</div>
              <div className="flex flex-wrap gap-2">
                {(content.platforms as Platform[]).map(p => (
                  <span key={p} className="nm-raised-sm inline-flex items-center gap-1.5 bg-background text-muted-foreground text-xs font-semibold px-3 py-1.5 rounded-xl">
                    <PlatformIcon platform={p} className="text-sm" />
                    {PLATFORM_LABELS[p]}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            {content.tags.length > 0 && (
              <div className="nm-raised bg-background rounded-2xl px-5 py-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {content.tags.map(tag => (
                    <span key={tag} className="nm-raised-sm bg-background text-primary text-xs font-semibold px-2.5 py-1 rounded-lg">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Media */}
            {content.mediaUrl && (
              <div className="nm-raised bg-background rounded-2xl overflow-hidden">
                {content.type === "video" ? (
                  <video
                    src={`/api/storage${content.mediaUrl}`}
                    controls
                    className="w-full max-h-52 bg-black"
                  />
                ) : (
                  <img
                    src={`/api/storage${content.mediaUrl}`}
                    alt="content media"
                    className="w-full max-h-52 object-cover"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Platform Preview Panel */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platform Preview</div>
            <div className="nm-inset bg-background rounded-2xl p-1.5 flex flex-wrap gap-1">
              {displayPlatforms.map(p => (
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
                title={displayTitle}
                caption={displayCaption}
                contentType={displayType}
                mediaUrl={
                  isEditing && watchedValues.mediaUrl
                    ? `/api/storage${watchedValues.mediaUrl}`
                    : content.mediaUrl
                    ? `/api/storage${content.mediaUrl}`
                    : null
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

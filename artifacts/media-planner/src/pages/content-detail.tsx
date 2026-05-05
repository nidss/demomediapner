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
        <header className="bg-sidebar border-b border-sidebar-border px-6 py-4 flex items-center gap-4">
          <Link href="/"><button className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"><RiArrowLeftLine className="text-xl" /></button></Link>
          <Skeleton className="h-6 w-48" />
        </header>
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black text-primary/20 mb-3">404</div>
          <p className="text-muted-foreground mb-4">Content not found.</p>
          <Link href="/" className="text-primary text-sm font-medium hover:underline">Back to Calendar</Link>
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
      <header className="bg-sidebar border-b border-sidebar-border px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <button className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
            <RiArrowLeftLine className="text-xl" />
          </button>
        </Link>
        <h1 className="text-sidebar-foreground font-bold text-lg flex-1 truncate">{content.title}</h1>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium hover:bg-sidebar-accent/80 transition-colors"
            >
              <RiPencilLine /> Edit
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/30 transition-colors">
                <RiDeleteBinLine /> Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete content?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{content.title}" will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Content Type */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Content Type</label>
              <div className="flex gap-2">
                {ALL_CONTENT_TYPES.map(t => {
                  const colors = CONTENT_TYPE_COLORS[t];
                  const isSelected = watchedValues.type === t;
                  return (
                    <button key={t} type="button" onClick={() => setValue("type", t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize border-2 transition-all ${isSelected ? `${colors.bg} ${colors.text} border-current` : "bg-card border-card-border text-muted-foreground hover:border-border"}`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Title</label>
              <input {...register("title")} className="w-full bg-card border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Caption / Body</label>
              <textarea {...register("caption")} rows={4} className="w-full bg-card border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Platforms</label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_PLATFORMS.map(p => {
                  const isSelected = (watchedValues.platforms ?? []).includes(p);
                  return (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all ${isSelected ? "bg-primary/10 border-primary text-primary" : "bg-card border-card-border text-muted-foreground hover:border-border"}`}>
                      <PlatformIcon platform={p} className="text-base flex-shrink-0" />
                      <span className="truncate">{PLATFORM_LABELS[p]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  <span className="inline-flex items-center gap-1"><RiCalendarLine /> Scheduled Date</span>
                </label>
                <input type="date" {...register("scheduledDate")} className="w-full bg-card border border-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</label>
                <select {...register("status")} className="w-full bg-card border border-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
                  {ALL_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(watchedValues.tags ?? []).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><RiCloseLine className="text-xs" /></button>
                  </span>
                ))}
              </div>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter..." className="w-full bg-card border border-input rounded-xl px-4 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                <RiSendPlaneLine />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* View mode */
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${typeColors.bg} ${typeColors.text}`}>
                {content.type}
              </span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                {content.status}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Scheduled</div>
              <div className="text-sm font-medium text-foreground">
                {format(parseISO(content.scheduledDate), "EEEE, MMMM d, yyyy")}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Caption</div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content.caption || <span className="text-muted-foreground italic">No caption</span>}</p>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Platforms</div>
              <div className="flex flex-wrap gap-2">
                {(content.platforms as Platform[]).map(p => (
                  <span key={p} className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                    <PlatformIcon platform={p} className="text-sm" />
                    {PLATFORM_LABELS[p]}
                  </span>
                ))}
              </div>
            </div>

            {content.tags.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {content.tags.map(tag => (
                    <span key={tag} className="bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Platform Preview Panel */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Platform Preview</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {displayPlatforms.map(p => (
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
                title={displayTitle}
                caption={displayCaption}
                contentType={displayType}
                mediaUrl={content.mediaUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

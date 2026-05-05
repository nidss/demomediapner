import { useState } from "react";
import { Link } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine, RiAddLine, RiVideoLine, RiArticleLine, RiImageLine, RiCalendar2Line } from "react-icons/ri";
import { useListContent, useGetContentStats } from "@workspace/api-client-react";
import { CONTENT_TYPE_COLORS, CONTENT_STATUS_COLORS, PLATFORM_LABELS } from "@/lib/content-utils";
import type { ContentType, ContentStatus, Platform } from "@/lib/content-utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon } from "@/components/platform-preview";

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  video: RiVideoLine,
  post: RiImageLine,
  article: RiArticleLine,
};

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl px-4 py-3 flex flex-col gap-0.5">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: contentItems = [], isLoading: contentLoading } = useListContent({ month, year });
  const { data: stats } = useGetContentStats({ month, year });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = getDay(monthStart);
  const padDays = Array.from({ length: startPad });

  const contentByDay: Record<string, typeof contentItems> = {};
  for (const item of contentItems) {
    const d = item.scheduledDate;
    if (!contentByDay[d]) contentByDay[d] = [];
    contentByDay[d].push(item);
  }

  const selectedItems = selectedDay ? (contentByDay[selectedDay] ?? []) : [];

  function prevMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-sidebar border-b border-sidebar-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiCalendar2Line className="text-sidebar-primary text-xl" />
          <span className="text-sidebar-foreground font-bold text-lg tracking-tight">Media Planner</span>
        </div>
        <Link href="/create">
          <button className="inline-flex items-center gap-1.5 bg-sidebar-primary hover:opacity-90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity">
            <RiAddLine className="text-base" /> New Content
          </button>
        </Link>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats ? (
            <>
              <StatCard label="Total this month" value={stats.total} color="text-foreground" />
              <StatCard label="Published" value={stats.publishedThisMonth} color="text-emerald-600" />
              <StatCard label="Scheduled" value={stats.scheduledThisMonth} color="text-blue-600" />
              <StatCard label="Drafts" value={stats.byStatus.draft} color="text-muted-foreground" />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))
          )}
        </div>

        {/* Calendar header */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <RiArrowLeftSLine className="text-xl text-foreground" />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <RiArrowRightSLine className="text-xl text-foreground" />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-card-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {padDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[110px] border-r border-b border-card-border last:border-r-0 bg-muted/30" />
            ))}
            {daysInMonth.map((day, idx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const items = contentByDay[dateStr] ?? [];
              const isCurrentDay = isToday(day);
              const colIdx = (idx + startPad) % 7;
              const isLastCol = colIdx === 6;
              const isLastRow = idx >= daysInMonth.length - (7 - ((daysInMonth.length + startPad) % 7 || 7));

              return (
                <div
                  key={dateStr}
                  onClick={() => items.length > 0 && setSelectedDay(dateStr)}
                  className={`min-h-[110px] p-2 flex flex-col gap-1 border-b border-card-border transition-colors ${!isLastCol ? "border-r" : ""} ${items.length > 0 ? "cursor-pointer hover:bg-accent/30" : ""} ${isLastRow ? "border-b-0" : ""}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  {contentLoading ? (
                    items.length === 0 && idx === 0 ? <Skeleton className="h-5 rounded" /> : null
                  ) : (
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {items.slice(0, 3).map(item => {
                        const colors = CONTENT_TYPE_COLORS[item.type as ContentType];
                        const TypeIcon = TYPE_ICONS[item.type as ContentType];
                        return (
                          <div key={item.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${colors.bg} ${colors.text}`}>
                            <TypeIcon className="flex-shrink-0 text-xs" />
                            <span className="truncate">{item.title}</span>
                          </div>
                        );
                      })}
                      {items.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1 font-medium">+{items.length - 3} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {(["video", "post", "article"] as ContentType[]).map(t => {
            const colors = CONTENT_TYPE_COLORS[t];
            const Icon = TYPE_ICONS[t];
            return (
              <div key={t} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                <Icon className="text-sm" />
                <span className="capitalize">{t}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Day detail sheet */}
      <Sheet open={!!selectedDay} onOpenChange={open => !open && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base font-bold">
              {selectedDay ? format(parseISO(selectedDay), "EEEE, MMMM d, yyyy") : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-3">
            {selectedItems.map(item => {
              const typeColors = CONTENT_TYPE_COLORS[item.type as ContentType];
              const statusColors = CONTENT_STATUS_COLORS[item.status as ContentStatus];
              const TypeIcon = TYPE_ICONS[item.type as ContentType];
              return (
                <Link key={item.id} href={`/content/${item.id}`}>
                  <div className="bg-card border border-card-border rounded-xl p-4 hover:border-primary/40 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeColors.bg} ${typeColors.text}`}>
                          <TypeIcon className="text-xs" />
                          {item.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-foreground mb-1 truncate">{item.title}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.caption}</p>
                    <div className="flex flex-wrap gap-1">
                      {(item.platforms as Platform[]).map(p => (
                        <span key={p} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                          <PlatformIcon platform={p} className="text-xs" />
                          {PLATFORM_LABELS[p]}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
            <Link href={`/create?date=${selectedDay}`}>
              <button className="w-full mt-1 border-2 border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                <RiAddLine /> Add content for this day
              </button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

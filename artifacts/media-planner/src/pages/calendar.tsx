import { useState } from "react";
import { Link } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, parseISO } from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine, RiAddLine, RiVideoLine, RiArticleLine, RiImageLine, RiCalendar2Line } from "react-icons/ri";
import { useListContent, useGetContentStats } from "@workspace/api-client-react";
import { CONTENT_TYPE_COLORS, CONTENT_STATUS_COLORS, PLATFORM_LABELS } from "@/lib/content-utils";
import type { ContentType, ContentStatus, Platform } from "@/lib/content-utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon } from "@/components/platform-preview";

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  video: RiVideoLine,
  post: RiImageLine,
  article: RiArticleLine,
};

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="nm-raised bg-background rounded-2xl px-5 py-4 flex flex-col gap-1">
      <span className={`text-2xl font-black tracking-tight ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
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
      <header className="bg-background nm-raised relative z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="nm-inset w-9 h-9 rounded-xl flex items-center justify-center">
            <RiCalendar2Line className="text-primary text-lg" />
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">Media Planner</span>
        </div>
        <Link href="/create">
          <button className="nm-raised inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90 active:nm-inset">
            <RiAddLine className="text-base" /> New Content
          </button>
        </Link>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          {stats ? (
            <>
              <StatCard label="Total this month" value={stats.total} color="text-foreground" />
              <StatCard label="Published" value={stats.publishedThisMonth} color="text-emerald-500" />
              <StatCard label="Scheduled" value={stats.scheduledThisMonth} color="text-blue-500" />
              <StatCard label="Drafts" value={stats.byStatus.draft} color="text-muted-foreground" />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))
          )}
        </div>

        {/* Calendar container */}
        <div className="nm-raised-lg bg-background rounded-3xl overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-5">
            <button
              onClick={prevMonth}
              className="nm-raised-sm w-9 h-9 flex items-center justify-center rounded-xl bg-background text-foreground hover:text-primary transition-colors active:nm-inset"
            >
              <RiArrowLeftSLine className="text-xl" />
            </button>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={nextMonth}
              className="nm-raised-sm w-9 h-9 flex items-center justify-center rounded-xl bg-background text-foreground hover:text-primary transition-colors active:nm-inset"
            >
              <RiArrowRightSLine className="text-xl" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-2 pb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 px-2 pb-3">
            {padDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px] rounded-xl" />
            ))}
            {daysInMonth.map((day, idx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const items = contentByDay[dateStr] ?? [];
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dateStr}
                  onClick={() => items.length > 0 && setSelectedDay(dateStr)}
                  className={`min-h-[100px] rounded-xl p-2 flex flex-col gap-1 transition-all ${items.length > 0 ? "cursor-pointer nm-raised-sm hover:brightness-[1.02]" : ""} ${isCurrentDay ? "nm-raised-sm ring-2 ring-primary/30" : ""}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold transition-all ${isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  {contentLoading ? null : (
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {items.slice(0, 3).map(item => {
                        const colors = CONTENT_TYPE_COLORS[item.type as ContentType];
                        const TypeIcon = TYPE_ICONS[item.type as ContentType];
                        return (
                          <div key={item.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium truncate ${colors.bg} ${colors.text}`}>
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
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {(["video", "post", "article"] as ContentType[]).map(t => {
            const colors = CONTENT_TYPE_COLORS[t];
            const Icon = TYPE_ICONS[t];
            return (
              <div key={t} className={`nm-raised-sm flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-background ${colors.text}`}>
                <Icon className="text-sm" />
                <span className="capitalize">{t}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Day detail sheet */}
      <Sheet open={!!selectedDay} onOpenChange={open => !open && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background border-l-0 nm-raised-lg">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-base font-bold">
              {selectedDay ? format(parseISO(selectedDay), "EEEE, MMMM d, yyyy") : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            {selectedItems.map(item => {
              const typeColors = CONTENT_TYPE_COLORS[item.type as ContentType];
              const statusColors = CONTENT_STATUS_COLORS[item.status as ContentStatus];
              const TypeIcon = TYPE_ICONS[item.type as ContentType];
              return (
                <Link key={item.id} href={`/content/${item.id}`}>
                  <div className="nm-raised bg-background rounded-2xl p-4 cursor-pointer hover:brightness-[1.02] transition-all active:nm-inset">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${typeColors.bg} ${typeColors.text}`}>
                          <TypeIcon className="text-xs" />
                          {item.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColors.bg} ${statusColors.text}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-foreground mb-1 truncate">{item.title}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.caption}</p>
                    <div className="flex flex-wrap gap-1">
                      {(item.platforms as Platform[]).map(p => (
                        <span key={p} className="nm-raised-sm inline-flex items-center gap-1 bg-background text-muted-foreground text-[10px] font-medium px-2 py-1 rounded-lg">
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
              <button className="nm-inset-sm w-full mt-1 bg-background rounded-2xl py-3.5 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium">
                <RiAddLine /> Add content for this day
              </button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

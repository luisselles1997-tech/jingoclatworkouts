import { useEffect } from "react";
import { Calendar, CalendarRange, ClipboardList, Dumbbell, ScrollText, Timer, Users, Utensils } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { BoxPanel } from "@/components/box-panel";
import { MonthPanel, WeekPanel } from "@/components/calendar-panels";
import { FoodPanel } from "@/components/food-panel";
import { LogPanel } from "@/components/library-panels";
import { PlanPanel } from "@/components/plan-panel";
import { TimerChip, TimerPanel } from "@/components/timer-panel";
import { TodayPanel } from "@/components/today-panel";
import { useLog, type Tab } from "@/lib/store";

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: "today", label: "Today", icon: Dumbbell },
  { id: "week", label: "Week", icon: CalendarRange },
  { id: "month", label: "Month", icon: Calendar },
  { id: "plan", label: "Plan", icon: ClipboardList },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "log", label: "Log", icon: ScrollText },
  { id: "food", label: "Food", icon: Utensils },
];

export function LogApp() {
  const user = useCurrentUser();
  const boot = useLog((s) => s.boot);
  const ready = useLog((s) => s.ready);
  const failed = useLog((s) => s.failed);
  const tab = useLog((s) => s.tab);
  const setTab = useLog((s) => s.setTab);
  const theme = useLog((s) => s.theme);
  const setTheme = useLog((s) => s.setTheme);
  const unit = useLog((s) => s.unit);
  const toggleUnit = useLog((s) => s.toggleUnit);
  const sync = useLog((s) => s.sync);
  const toast = useLog((s) => s.toast);

  useEffect(() => {
    if (!user?.id) return;
    const suggested = user.displayName || user.primaryEmail?.split("@")[0] || "";
    void boot(user.id, suggested);
  }, [user?.id, boot]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const syncLabel = sync === "saving" ? "Saving…" : sync === "local" ? "On this phone" : "Saved";

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">CrossFit Log</div>
          <p className="text-sm text-muted" title={sync === "local" ? "Will upload when the connection is back" : "Stored on your account"}>
            {syncLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TimerChip />
          <button type="button" className="icon-btn" onClick={toggleUnit} aria-label="Switch units">{unit}</button>
          <button type="button" className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button type="button" className={`icon-btn${tab === "box" ? " border-fg" : ""}`} onClick={() => setTab("box")}>
            <Users className="size-4" aria-hidden />
            Box
          </button>
        </div>
      </header>
      {!ready ? (
        <div className="space-y-3" aria-hidden>
          <div className="h-16 rounded-2xl bg-surface" />
          <div className="h-40 rounded-2xl bg-surface" />
        </div>
      ) : failed ? (
        <div className="card">
          <p>{failed}</p>
          <button type="button" className="btn mt-3" onClick={() => user && void boot(user.id, user.displayName || "")}>Try again</button>
        </div>
      ) : tab === "today" ? (
        <TodayPanel />
      ) : tab === "week" ? (
        <WeekPanel />
      ) : tab === "month" ? (
        <MonthPanel />
      ) : tab === "plan" ? (
        <PlanPanel />
      ) : tab === "timer" ? (
        <TimerPanel />
      ) : tab === "log" ? (
        <LogPanel />
      ) : tab === "food" ? (
        <FoodPanel />
      ) : (
        <BoxPanel />
      )}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
      <nav className="app-dock">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs ${on ? "text-fg" : "text-muted"}`}>
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import { MN, WD, addD, blockNames, today, ymd } from "@/lib/model";
import { useLog } from "@/lib/store";

function Nav({ label, big, onPrev, onNext }: { label: string; big: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <button type="button" className="icon-btn h-11 w-11 rounded-full px-0" aria-label="Previous" onClick={onPrev}>‹</button>
      <div className="text-center">
        <div className="eyebrow">{label}</div>
        <div className="display text-3xl">{big}</div>
      </div>
      <button type="button" className="icon-btn h-11 w-11 rounded-full px-0" aria-label="Next" onClick={onNext}>›</button>
    </div>
  );
}

export function WeekPanel() {
  const wm = useLog((s) => s.wm);
  const sessions = useLog((s) => s.sessions);
  const shiftWeek = useLog((s) => s.shiftWeek);
  const pickDay = useLog((s) => s.pickDay);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addD(wm, i));
  const a = new Date(`${days[0]}T00:00`);
  const b = new Date(`${days[6]}T00:00`);
  const rng = `${MN[a.getMonth()]?.slice(0, 3).toUpperCase()} ${a.getDate()}–${a.getMonth() === b.getMonth() ? "" : `${MN[b.getMonth()]?.slice(0, 3).toUpperCase()} `}${b.getDate()}`;
  return (
    <div>
      <Nav label="Week" big={rng} onPrev={() => shiftWeek(-7)} onNext={() => shiftWeek(7)} />
      {days.map((ds) => {
        const d = new Date(`${ds}T00:00`);
        const list = sessions.filter((s) => s.date === ds);
        const f = list[0];
        return (
          <button key={ds} type="button" className={`card mb-2 flex w-full items-center gap-3 text-left ${ds === today() ? "border-fg" : ""}`} onClick={() => pickDay(ds)}>
            <div className="w-12 text-center">
              <div className="eyebrow">{WD[d.getDay()]?.slice(0, 3)}</div>
              <div className="display text-3xl">{d.getDate()}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{f ? f.title || blockNames(f.blocks) : "Rest"}</div>
              <div className="truncate text-sm text-muted">{f ? blockNames(f.blocks) : "Nothing logged"}</div>
            </div>
            <div className="text-sm text-muted">{list.length ? `${list.length} logged` : ds === today() ? "TODAY" : ""}</div>
          </button>
        );
      })}
    </div>
  );
}

export function MonthPanel() {
  const mc = useLog((s) => s.mc);
  const td = useLog((s) => s.td);
  const sessions = useLog((s) => s.sessions);
  const shiftMonth = useLog((s) => s.shiftMonth);
  const pickDay = useLog((s) => s.pickDay);
  const [y, m] = mc.split("-").map(Number);
  const first = new Date(y, (m || 1) - 1, 1);
  const start = addD(ymd(first), -((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => addD(start, i));
  return (
    <div>
      <Nav label="Month" big={`${MN[(m || 1) - 1]} ${y}`} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
      <div className="grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={`${d}${i}`} className="eyebrow text-center">{d}</div>
        ))}
        {cells.map((ds) => {
          const d = new Date(`${ds}T00:00`);
          const count = Math.min(3, sessions.filter((s) => s.date === ds).length);
          const out = d.getMonth() !== (m || 1) - 1;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => pickDay(ds)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm ${ds === td ? "border-line bg-surface" : "border-transparent"} ${ds === today() ? "border-fg" : ""} ${out ? "opacity-40" : ""}`}
            >
              <span>{d.getDate()}</span>
              <span className="flex gap-0.5">
                {Array.from({ length: count }, (_, i) => (
                  <i key={i} className="inline-block h-1.5 w-1.5 rounded-full bg-fg" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

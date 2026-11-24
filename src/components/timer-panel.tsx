import { useEffect, useState } from "react";
import {
  applyTimerPreset,
  fmtClock,
  setTimerField,
  setTimerMode,
  subscribeTimer,
  timerReset,
  timerRound,
  timerSkip,
  timerStart,
  timerPause,
  timerView,
  type TimerCfg,
  type TimerMode,
} from "@/lib/timer";
import { useLog } from "@/lib/store";

export function useTimerSnap() {
  const [, setN] = useState(0);
  useEffect(() => subscribeTimer(() => setN((n) => n + 1)), []);
  return timerView();
}

export function TimerChip() {
  const view = useTimerSnap();
  const setTab = useLog((s) => s.setTab);
  if (!view.live) return null;
  return (
    <button type="button" className="icon-btn tabular-nums" onClick={() => setTab("timer")}>
      {view.clock}
    </button>
  );
}

export function TimerPanel() {
  const view = useTimerSnap();
  const showToast = useLog((s) => s.showToast);
  const live = view.live;
  const cfg = view.cfg;
  return (
    <div>
      <h2 className="display mb-3 text-4xl">Timer</h2>
      {!live && view.st !== "done" ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {(["time", "amrap", "int"] as TimerMode[]).map((m) => (
              <button key={m} type="button" className={`chip${view.mode === m ? " on" : ""}`} onClick={() => setTimerMode(m)}>
                {m === "time" ? "For Time" : m === "amrap" ? "AMRAP" : "Tabata / Intervals"}
              </button>
            ))}
          </div>
          <div className="card mb-3 space-y-2">
            {view.mode === "int" ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="chip" onClick={() => applyTimerPreset({ w: 20, r: 10, n: 8, sn: 1, sr: 60 })}>Tabata 20/10 × 8</button>
                <button type="button" className="chip" onClick={() => applyTimerPreset({ w: 60, r: 0, n: 10, sn: 1, sr: 60 })}>EMOM 10</button>
              </div>
            ) : null}
            <div className="flex gap-2">
              {view.mode === "time" ? (
                <>
                  <Num f="cap" label="Time cap (min, 0 = none)" cfg={cfg} />
                  <Num f="rd" label="Get ready (sec)" cfg={cfg} />
                </>
              ) : null}
              {view.mode === "amrap" ? (
                <>
                  <Num f="am" label="Minutes per AMRAP" cfg={cfg} />
                  <Num f="an" label="How many AMRAPs" cfg={cfg} />
                </>
              ) : null}
              {view.mode === "int" ? (
                <>
                  <Num f="w" label="Work (sec)" cfg={cfg} />
                  <Num f="r" label="Rest (sec)" cfg={cfg} />
                  <Num f="n" label="Rounds" cfg={cfg} />
                </>
              ) : null}
            </div>
            {view.mode === "amrap" ? (
              <div className="flex gap-2">
                <Num f="ar" label="Rest between (sec)" cfg={cfg} />
                <Num f="rd" label="Get ready (sec)" cfg={cfg} />
              </div>
            ) : null}
            {view.mode === "int" ? (
              <div className="flex gap-2">
                <Num f="sn" label="Sets" cfg={cfg} />
                <Num f="sr" label="Rest between sets" cfg={cfg} />
                <Num f="rd" label="Get ready (sec)" cfg={cfg} />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      <div className={`card mb-3 py-8 text-center ${view.rest ? "bg-accent text-accent-fg" : ""}`}>
        <div className="display text-xl tracking-widest">{view.label}</div>
        <div className="display text-7xl tabular-nums">{view.st === "idle" ? "00:00" : view.clock}</div>
        <div className={`mt-2 text-sm ${view.rest ? "opacity-70" : "text-muted"}`}>{view.next}</div>
      </div>
      {view.total > 0 ? <p className="mb-3 text-sm text-muted">Total {fmtClock(view.total)}</p> : null}
      {view.round !== null ? (
        <div className="mb-3">
          <button type="button" className="btn" onClick={() => timerRound(1)}>+1 Round</button>
          <div className="mt-2 flex items-center justify-between">
            <span>Rounds this AMRAP: <b>{view.round}</b></span>
            <button type="button" className="icon-btn" onClick={() => timerRound(-1)}>−1</button>
          </div>
        </div>
      ) : null}
      {view.summary ? <p className="mb-3 text-sm text-muted">{view.summary}</p> : null}
      {view.st === "idle" ? (
        <button type="button" className="btn" onClick={() => { if (!timerStart()) showToast("Set a time first"); }}>Start</button>
      ) : view.st === "done" ? (
        <button type="button" className="btn" onClick={timerReset}>Reset</button>
      ) : (
        <>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={timerPause}>{view.st === "run" ? "Pause" : "Resume"}</button>
            <button type="button" className="btn btn-ghost" onClick={timerSkip}>Skip</button>
          </div>
          <button type="button" className="btn btn-ghost mt-2" onClick={timerReset}>Reset</button>
        </>
      )}
    </div>
  );
}

function Num({ f, label, cfg }: { f: Exclude<keyof TimerCfg, "mode">; label: string; cfg: TimerCfg }) {
  return (
    <label className="block min-w-0 flex-1 text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <input className="field" inputMode="decimal" value={String(cfg[f])} onChange={(e) => setTimerField(f, Number(e.target.value))} />
    </label>
  );
}

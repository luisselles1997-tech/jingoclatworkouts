import { useMemo, useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Summary } from "@/components/summary";
import { allEx, blockNames, estOf, fmtDate, series, type Session } from "@/lib/model";
import { useLog } from "@/lib/store";

export function LogPanel() {
  const sub = useLog((s) => s.sub);
  const setSub = useLog((s) => s.setSub);
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["hist", "prog", "orm"] as const).map((v) => (
          <button key={v} type="button" className={`chip${sub === v ? " on" : ""}`} onClick={() => setSub(v)}>
            {v === "hist" ? "History" : v === "prog" ? "Progress" : "1RMs"}
          </button>
        ))}
      </div>
      {sub === "prog" ? <Progress /> : sub === "orm" ? <Orms /> : <History />}
    </div>
  );
}

function History() {
  const sessions = useLog((s) => s.sessions);
  const hq = useLog((s) => s.hq);
  const setHq = useLog((s) => s.setHq);
  const editSession = useLog((s) => s.editSession);
  const deleteSession = useLog((s) => s.deleteSession);
  const [arm, setArm] = useState("");
  const words = hq.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const list = [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .filter((s) => words.every((w) => hay(s).includes(w)));
  if (!sessions.length) return <p className="text-muted">No workouts yet. Log the first one from Today.</p>;
  return (
    <div>
      <h2 className="display mb-3 text-4xl">History</h2>
      <div className="mb-3 flex gap-2">
        <input className="field" type="search" placeholder="Search title or exercise" value={hq} onChange={(e) => setHq(e.target.value)} />
        <button type="button" className="icon-btn" onClick={() => setHq("")}>Clear</button>
      </div>
      {words.length ? <p className="mb-2 text-sm text-muted">{list.length} found</p> : null}
      {!list.length ? <p className="text-muted">No workouts match.</p> : null}
      {list.map((s) => (
        <details key={s.id} className="card mb-2" open={words.length > 0}>
          <summary className="cursor-pointer font-medium">
            {fmtDate(s.date)} · {s.title || blockNames(s.blocks)}
          </summary>
          <Summary blocks={s.blocks} notes={s.notes} />
          <div className="mt-3 flex gap-2">
            <button type="button" className="icon-btn" onClick={() => editSession(s.id)}>Edit</button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                if (arm === s.id) deleteSession(s.id);
                else {
                  setArm(s.id);
                  window.setTimeout(() => setArm((a) => (a === s.id ? "" : a)), 2200);
                }
              }}
            >
              {arm === s.id ? "Tap again to delete" : "Delete"}
            </button>
          </div>
        </details>
      ))}
    </div>
  );
}

function hay(s: Session) {
  return [s.title, s.notes, s.date, fmtDate(s.date), ...s.blocks.flatMap((b) => [b.type, ...(b.ex || []).map((e) => e.name), b.m?.desc, b.m?.score, b.c?.mod, b.txt])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function Progress() {
  const sessions = useLog((s) => s.sessions);
  const unit = useLog((s) => s.unit);
  const pick = useLog((s) => s.pick);
  const setPick = useLog((s) => s.setPick);
  const names = useMemo(
    () => [...new Set(sessions.flatMap((s) => s.blocks.flatMap((b) => (b.ex || []).map((e) => e.name.trim()).filter(Boolean))))].filter((n) => series(sessions, n).length).sort(),
    [sessions],
  );
  if (!names.length) return <p className="text-muted">Log some lifts and the trends show up here.</p>;
  const name = names.includes(pick) ? pick : names[0] || "";
  const pts = series(sessions, name);
  const useW = pts.some((x) => x.w);
  const hasRm = pts.some((x) => x.rm);
  const un = pts[pts.length - 1]?.u || "reps";
  const k1 = hasRm ? "rm" : useW ? "w" : "r";
  const line = pts.filter((x) => x[k1] > 0).map((x) => ({ ...x, label: fmtDate(x.d) }));
  const k2 = useW ? "vol" : "tr";
  const bars = pts.filter((x) => x[k2] > 0).slice(-14).map((x) => ({ ...x, label: fmtDate(x.d) }));
  const bestRm = Math.round(Math.max(0, ...pts.map((x) => x.rm)));
  const bestW = Math.round(Math.max(0, ...pts.map((x) => x.w)));
  const bestR = Math.max(0, ...pts.map((x) => x.r));
  return (
    <div>
      <h2 className="display mb-3 text-4xl">Progress</h2>
      <select className="field mb-3" aria-label="Exercise" value={name} onChange={(e) => setPick(e.target.value)}>
        {names.map((n) => <option key={n}>{n}</option>)}
      </select>
      <div className="card mb-3">
        <div className="mb-3 grid grid-cols-3 text-center">
          {hasRm ? <Stat n={`${bestRm} ${unit}`} l="Best est. 1RM" /> : null}
          {useW ? <Stat n={`${bestW} ${unit}`} l="Heaviest" /> : <Stat n={`${bestR} ${un}`} l="Most" />}
          <Stat n={String(pts.length)} l="Sessions" />
        </div>
        <p className="mb-2 text-sm text-muted">{hasRm ? "Estimated 1RM" : useW ? "Heaviest weight" : "Most reps"} per session</p>
        <div className="h-36 w-full text-fg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={line}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--fg)" }} />
              <Line type="monotone" dataKey={k1} stroke="currentColor" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card mb-3">
        <p className="mb-2 text-sm text-muted">{useW ? "Total volume" : `Total ${un}`} per day</p>
        <div className="h-36 w-full text-fg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--fg)" }} />
              <Bar dataKey={k2} fill="currentColor" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {[...pts].slice(-8).reverse().map((x) => (
        <div key={x.d + x.rm} className="flex items-center justify-between py-1 text-sm">
          <span>{fmtDate(x.d)}</span>
          <span className="text-muted">
            {x.rm ? `1RM ${Math.round(x.rm)} · ` : ""}
            {useW ? "volume" : "total"} {Math.round(x[k2])} {useW ? unit : un}
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="display text-3xl">{n}</div>
      <div className="text-xs text-muted">{l}</div>
    </div>
  );
}

function Orms() {
  const sessions = useLog((s) => s.sessions);
  const orms = useLog((s) => s.orms);
  const unit = useLog((s) => s.unit);
  const setOrm = useLog((s) => s.setOrm);
  const showToast = useLog((s) => s.showToast);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const names = [...new Set([...orms.map((x) => x.n), ...allEx(sessions).filter((n) => estOf(sessions, n))])].sort((a, b) => a.localeCompare(b));
  return (
    <div>
      <h2 className="display mb-2 text-4xl">1RMs</h2>
      <p className="mb-3 text-sm text-muted">Percentages in the log use the max you save. If you have not saved one, the estimate from sets of 10 reps or fewer is used.</p>
      <div className="card mb-3 space-y-2">
        <div className="flex gap-2">
          <input className="field" list="exlist" placeholder="Lift" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field w-24 flex-none" inputMode="decimal" placeholder={unit} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            const w = parseFloat(weight);
            if (!name.trim() || !(w > 0)) {
              showToast("Enter a lift and a weight");
              return;
            }
            setOrm(name.trim(), w);
            setName("");
            setWeight("");
            showToast("1RM saved");
          }}
        >
          Save 1RM
        </button>
      </div>
      <datalist id="exlist">
        {allEx(sessions).map((n) => <option key={n} value={n} />)}
      </datalist>
      {names.map((n) => {
        const saved = orms.find((x) => x.n.toLowerCase() === n.toLowerCase());
        const est = estOf(sessions, n);
        return (
          <div key={n} className="card mb-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="display text-2xl">{n}</span>
              <span className="text-sm text-muted">{unit}</span>
            </div>
            <div className="flex gap-2">
              <input
                className="field"
                inputMode="decimal"
                placeholder="Your 1RM"
                defaultValue={saved ? String(saved.v) : ""}
                key={`${n}-${saved?.v ?? "e"}`}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  setOrm(n, v ? parseFloat(v) : null);
                }}
              />
              {est && (!saved || saved.v !== est) ? (
                <button type="button" className="icon-btn" onClick={() => setOrm(n, est)}>Use {est}</button>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted">{est ? `Estimated from training: ${est} ${unit}` : "No estimate yet"}</p>
          </div>
        );
      })}
    </div>
  );
}

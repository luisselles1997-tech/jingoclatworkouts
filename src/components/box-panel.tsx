import { useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { Summary } from "@/components/summary";
import { blockNames, fmtDate, type Session } from "@/lib/model";
import { useLog } from "@/lib/store";

export function BoxPanel() {
  const name = useLog((s) => s.name);
  const setName = useLog((s) => s.setName);
  const box = useLog((s) => s.box);
  const roster = useLog((s) => s.roster);
  const rosterBusy = useLog((s) => s.rosterBusy);
  const create = useLog((s) => s.createBox);
  const join = useLog((s) => s.joinBox);
  const leave = useLog((s) => s.leaveBox);
  const refresh = useLog((s) => s.refreshRoster);
  const importBackup = useLog((s) => s.importBackup);
  const sessions = useLog((s) => s.sessions);
  const plans = useLog((s) => s.plans);
  const orms = useLog((s) => s.orms);
  const foods = useLog((s) => s.foods);
  const food = useLog((s) => s.food);
  const [boxName, setBoxName] = useState("");
  const [code, setCode] = useState("");
  const [arm, setArm] = useState(false);

  function download() {
    const blob = new Blob(
      [JSON.stringify({ sessions, plans, orms, foods, food }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crossfit-log-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <h2 className="display text-4xl">Box</h2>
      <p className="text-sm text-muted">
        Athletes keep every workout on their own account. Joining your box only lets you see what they log. Leaving never deletes their history.
      </p>
      <label className="block">
        <span className="eyebrow">Name your coach sees</span>
        <input
          className="field mt-2"
          defaultValue={name}
          key={name}
          placeholder="Your name"
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next !== name) setName(next);
          }}
        />
      </label>

      {box?.role === "coach" ? (
        <section className="card space-y-3">
          <div className="eyebrow">{box.name}</div>
          <div className="display text-5xl tracking-widest">{box.id}</div>
          <p className="text-sm text-muted">Give athletes this code. They join from this same screen.</p>
          <button type="button" className="icon-btn" onClick={() => void refresh()}>{rosterBusy ? "Refreshing…" : "Refresh roster"}</button>
          {roster && !roster.athletes.length ? <p className="text-sm text-muted">No athletes yet.</p> : null}
          {roster?.athletes.map((a) => (
            <details key={a.id} className="border-t border-line pt-3">
              <summary className="cursor-pointer">
                <span className="font-medium">{a.name}</span>
                <span className="text-muted"> · {a.sessions.length} workout{a.sessions.length === 1 ? "" : "s"}</span>
              </summary>
              {a.sessions.length ? a.sessions.map((s) => <AthleteSession key={s.id} session={s} />) : <p className="mt-2 text-sm text-muted">Nothing logged yet.</p>}
            </details>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (!arm) {
                setArm(true);
                window.setTimeout(() => setArm(false), 2500);
                return;
              }
              void leave();
            }}
          >
            {arm ? "Tap again to close the box" : "Close box"}
          </button>
          <p className="text-sm text-muted">Closing stops sharing. Athlete logs stay on their accounts.</p>
        </section>
      ) : null}

      {box?.role === "athlete" ? (
        <section className="card space-y-3">
          <div className="eyebrow">You are in</div>
          <h3 className="display text-4xl">{box.name}</h3>
          <p className="text-sm text-muted">Coach: {box.coachName}. Workouts you save show up on their roster.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (!arm) {
                setArm(true);
                window.setTimeout(() => setArm(false), 2500);
                return;
              }
              void leave();
            }}
          >
            {arm ? "Tap again to leave" : "Leave box"}
          </button>
        </section>
      ) : null}

      {!box ? (
        <>
          <section className="card space-y-2">
            <div className="eyebrow">Start a box</div>
            <p className="text-sm text-muted">You become the coach and get a code.</p>
            <input className="field" placeholder="Box name" value={boxName} onChange={(e) => setBoxName(e.target.value)} />
            <button type="button" className="btn" onClick={() => void create(boxName, false)}>Create box</button>
          </section>
          <section className="card space-y-2">
            <div className="eyebrow">Join your coach</div>
            <input className="field uppercase" placeholder="Box code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <button type="button" className="btn" onClick={() => void join(code)}>Join</button>
          </section>
        </>
      ) : null}

      <section className="card space-y-2">
        <div className="eyebrow">Backup</div>
        <p className="text-sm text-muted">A copy you can keep. Restoring adds workouts back onto this account.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="icon-btn" onClick={download}>Download backup</button>
          <label className="icon-btn">
            Restore backup
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  await importBackup(JSON.parse(await file.text()));
                } catch {
                  useLog.getState().showToast("That file could not be read.");
                }
              }}
            />
          </label>
        </div>
      </section>
      <div className="card">
        <UserButton />
      </div>
    </div>
  );
}

function AthleteSession({ session }: { session: Session }) {
  return (
    <article className="mt-3">
      <div className="font-medium">{fmtDate(session.date)} · {session.title || blockNames(session.blocks)}</div>
      <Summary blocks={session.blocks} notes={session.notes} />
    </article>
  );
}

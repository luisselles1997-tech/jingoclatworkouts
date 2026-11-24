import { useState } from "react";
import { Editor } from "@/components/editor";
import { Summary } from "@/components/summary";
import { BLOCKS, PRESETS, WD, blockNames, fmtDate, today, type BlockType } from "@/lib/model";
import { useLog } from "@/lib/store";

function DayNav() {
  const td = useLog((s) => s.td);
  const shiftDay = useLog((s) => s.shiftDay);
  const d = new Date(`${td}T00:00`);
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <button type="button" className="icon-btn h-11 w-11 rounded-full px-0" aria-label="Previous day" onClick={() => shiftDay(-1)}>‹</button>
      <div className="text-center">
        <div className="eyebrow">{td === today() ? "Today" : "Day"}</div>
        <div className="display text-4xl">{WD[d.getDay()]}</div>
        <div className="text-sm text-muted">{fmtDate(td)}</div>
      </div>
      <button type="button" className="icon-btn h-11 w-11 rounded-full px-0" aria-label="Next day" onClick={() => shiftDay(1)}>›</button>
    </div>
  );
}

export function TodayPanel() {
  const td = useLog((s) => s.td);
  const draft = useLog((s) => s.draft);
  const sessions = useLog((s) => s.sessions);
  const plans = useLog((s) => s.plans);
  const box = useLog((s) => s.box);
  const editSession = useLog((s) => s.editSession);
  const startDraft = useLog((s) => s.startDraft);
  const startPlan = useLog((s) => s.startPlan);
  const [sel, setSel] = useState<BlockType[]>([]);
  const logged = sessions.filter((s) => s.date === td);
  const editing = Boolean(draft && !draft.plan);

  return (
    <div>
      <DayNav />
      <p className="mb-3 text-sm text-muted">
        {box?.role === "athlete"
          ? `Saved to your account and shared with ${box.name}.`
          : "Saved to your account, not just this phone."}
      </p>
      {logged.map((s) => (
        <article key={s.id} className="card mb-3">
          <div className="eyebrow">Logged</div>
          <h3 className="display text-2xl">{s.title || blockNames(s.blocks)}</h3>
          <Summary blocks={s.blocks} notes={s.notes} />
          <button type="button" className="icon-btn mt-3" onClick={() => editSession(s.id)}>Edit</button>
        </article>
      ))}
      {editing ? <Editor /> : <Picker sel={sel} setSel={setSel} plans={plans} onPreset={(types) => startDraft(types, false)} onStart={() => startDraft(sel, false)} onPlan={startPlan} />}
      {!editing && draft?.plan ? <p className="mt-3 text-sm text-muted">A plan is open. Finish or discard it on the Plan tab.</p> : null}
    </div>
  );
}

function Picker({
  sel,
  setSel,
  plans,
  onPreset,
  onStart,
  onPlan,
}: {
  sel: BlockType[];
  setSel: (next: BlockType[]) => void;
  plans: { id: string; title: string; blocks: { type: BlockType }[] }[];
  onPreset: (types: BlockType[]) => void;
  onStart: () => void;
  onPlan: (id: string) => void;
}) {
  return (
    <div>
      {plans.length ? (
        <>
          <h2 className="display mb-3 text-4xl">Planned</h2>
          {plans.map((p) => (
            <div key={p.id} className="card mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{p.title || "Untitled plan"}</div>
                <div className="text-sm text-muted">{blockNames(p.blocks)}</div>
              </div>
              <button type="button" className="icon-btn" onClick={() => onPlan(p.id)}>Start</button>
            </div>
          ))}
        </>
      ) : null}
      <h2 className="display mb-2 mt-4 text-4xl">What kind of day?</h2>
      <p className="mb-2 text-sm text-muted">Quick picks</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([label, types]) => (
          <button key={label} type="button" className="chip" onClick={() => onPreset(types)}>{label}</button>
        ))}
      </div>
      <p className="mb-2 mt-4 text-sm text-muted">Or combine your own</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCKS) as BlockType[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`chip${sel.includes(k) ? " on" : ""}`}
            onClick={() => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}
          >
            {BLOCKS[k].n}
          </button>
        ))}
      </div>
      <button type="button" className="btn mt-4" disabled={!sel.length} onClick={onStart}>Start workout</button>
    </div>
  );
}

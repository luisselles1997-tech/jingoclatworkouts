import { useState } from "react";
import { Editor } from "@/components/editor";
import { Summary } from "@/components/summary";
import { BLOCKS, PRESETS, blockNames, type BlockType, type Plan } from "@/lib/model";
import { useLog } from "@/lib/store";

export function PlanPanel() {
  const draft = useLog((s) => s.draft);
  const plans = useLog((s) => s.plans);
  const startDraft = useLog((s) => s.startDraft);
  const editPlan = useLog((s) => s.editPlan);
  const deletePlan = useLog((s) => s.deletePlan);
  const [sel, setSel] = useState<BlockType[]>([]);
  const [arm, setArm] = useState("");
  if (draft?.plan) return <Editor />;
  const groups = new Map<string, Plan[]>();
  for (const p of [...plans].sort((a, b) => a.title.localeCompare(b.title))) {
    const k = p.group || "";
    groups.set(k, [...(groups.get(k) || []), p]);
  }
  return (
    <div>
      <h2 className="display mb-2 text-4xl">Planning</h2>
      <p className="mb-3 text-sm text-muted">Plan a workout ahead, then start it from Today.</p>
      {draft && !draft.plan ? <p className="mb-3 text-sm text-muted">A workout is open on Today. Finish or discard it before planning.</p> : null}
      {!plans.length ? <p className="mb-4 text-muted">No plans yet.</p> : null}
      {[...groups.entries()].map(([group, list]) => (
        <section key={group || "none"} className="mb-3">
          {group ? <h3 className="eyebrow mb-2">{group}</h3> : null}
          {list.map((p) => (
            <article key={p.id} className="card mb-2">
              <h3 className="display text-2xl">{p.title || "Untitled plan"}</h3>
              <p className="text-sm text-muted">{blockNames(p.blocks)}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted">Details</summary>
                <Summary blocks={p.blocks} notes={p.notes} />
              </details>
              <div className="mt-3 flex gap-2">
                <button type="button" className="icon-btn" onClick={() => editPlan(p.id)}>Edit</button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    if (arm === p.id) deletePlan(p.id);
                    else {
                      setArm(p.id);
                      window.setTimeout(() => setArm((a) => (a === p.id ? "" : a)), 2200);
                    }
                  }}
                >
                  {arm === p.id ? "Tap again to delete" : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ))}
      <p className="eyebrow mb-2">New plan</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([label, types]) => (
          <button key={label} type="button" className="chip" onClick={() => startDraft(types, true)}>{label}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(BLOCKS) as BlockType[]).map((k) => (
          <button key={k} type="button" className={`chip${sel.includes(k) ? " on" : ""}`} onClick={() => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}>
            {BLOCKS[k].n}
          </button>
        ))}
      </div>
      <button type="button" className="btn mt-4" disabled={!sel.length} onClick={() => startDraft(sel, true)}>Start planning</button>
    </div>
  );
}

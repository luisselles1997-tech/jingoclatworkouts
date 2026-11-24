import { BLOCKS, DEX, autoPct, hintOf, mk, type Block, type BlockType, type Exercise, type SetLine } from "@/lib/model";
import { primeMetcon } from "@/lib/timer";
import { useLog } from "@/lib/store";

const METCON = ["AMRAP", "For Time", "EMOM", "Tabata", "Intervals", "Chipper", "Other"];
const MODS = ["Row", "Run", "Bike", "Ski", "Swim", "Jump rope", "Other"];

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  const a = next[i];
  const b = next[j];
  if (a === undefined || b === undefined) return list;
  next[i] = b;
  next[j] = a;
  return next;
}

export function Editor() {
  const draft = useLog((s) => s.draft);
  const sessions = useLog((s) => s.sessions);
  const orms = useLog((s) => s.orms);
  const unit = useLog((s) => s.unit);
  const patchDraft = useLog((s) => s.patchDraft);
  const setBlocks = useLog((s) => s.setBlocks);
  const saveWorkout = useLog((s) => s.saveWorkout);
  const savePlanDraft = useLog((s) => s.savePlanDraft);
  const discard = useLog((s) => s.discard);
  const setTab = useLog((s) => s.setTab);
  const names = [...new Set([...DEX, ...sessions.flatMap((s) => s.blocks.flatMap((b) => (b.ex || []).map((e) => e.name.trim()).filter(Boolean)))])].sort();

  if (!draft) return null;
  const blocks = draft.blocks;

  function put(next: Block[]) {
    setBlocks(next);
  }

  function patchAt(i: number, block: Block) {
    put(blocks.map((b, idx) => (idx === i ? block : b)));
  }

  return (
    <div className="space-y-3">
      <datalist id="exlist">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div className="card space-y-2">
        <div className="flex gap-2">
          {draft.plan ? null : (
            <input className="field" type="date" aria-label="Date" value={draft.date} onChange={(e) => patchDraft({ date: e.target.value })} />
          )}
          <input
            className="field"
            placeholder={draft.plan ? "Plan name, e.g. Monday heavy" : "Day name (optional)"}
            value={draft.title}
            onChange={(e) => patchDraft({ title: e.target.value })}
          />
        </div>
        {draft.plan ? (
          <input className="field" placeholder="Group, e.g. Strength cycle" value={draft.group || ""} onChange={(e) => patchDraft({ group: e.target.value })} />
        ) : null}
      </div>
      {blocks.map((b, i) => (
        <BlockCard
          key={`${b.type}-${i}`}
          block={b}
          hint={(name) => hintOf(sessions, orms, unit, name, draft.plan ? undefined : draft.id)}
          pct={(name, w) => autoPct(sessions, orms, name, w)}
          unit={unit}
          plan={Boolean(draft.plan)}
          onChange={(block) => patchAt(i, block)}
          onUp={() => put(move(blocks, i, -1))}
          onDown={() => put(move(blocks, i, 1))}
          onRemove={() => put(blocks.filter((_, idx) => idx !== i))}
          onTimer={() => {
            if (b.m && primeMetcon(b.m.fmt, b.m.cap)) setTab("timer");
            else setTab("timer");
          }}
        />
      ))}
      <p className="eyebrow">Add another block</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCKS) as BlockType[]).map((k) => (
          <button key={k} type="button" className="chip" onClick={() => put([...blocks, mk(k)])}>
            + {BLOCKS[k].n}
          </button>
        ))}
      </div>
      <div className="card">
        <textarea className="field" placeholder={draft.plan ? "Notes for this plan" : "Session notes (how it felt, scaling…)"} value={draft.notes} onChange={(e) => patchDraft({ notes: e.target.value })} />
      </div>
      <button type="button" className="btn" onClick={draft.plan ? savePlanDraft : saveWorkout}>
        {draft.plan ? "Save plan" : "Save workout"}
      </button>
      <button type="button" className="btn btn-ghost" onClick={discard}>
        Discard
      </button>
    </div>
  );
}

function BlockCard({
  block,
  unit,
  plan,
  hint,
  pct,
  onChange,
  onUp,
  onDown,
  onRemove,
  onTimer,
}: {
  block: Block;
  unit: string;
  plan: boolean;
  hint: (name: string) => string;
  pct: (name: string, w: string) => string;
  onChange: (b: Block) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  onTimer: () => void;
}) {
  const meta = BLOCKS[block.type];
  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="display text-2xl">{meta.n}</h3>
        <div className="flex gap-1">
          <button type="button" className="icon-btn" onClick={onUp} aria-label="Move block up">Up</button>
          <button type="button" className="icon-btn" onClick={onDown} aria-label="Move block down">Down</button>
          <button type="button" className="icon-btn" onClick={onRemove}>Remove</button>
        </div>
      </div>
      {meta.k === "sets" && block.ex
        ? block.ex.map((e, j) => (
            <ExerciseFields
              key={j}
              ex={e}
              type={block.type}
              unit={unit}
              plan={plan}
              hint={hint(e.name)}
              pct={(w) => pct(e.name, w)}
              onChange={(ex) => onChange({ ...block, ex: block.ex!.map((item, idx) => (idx === j ? ex : item)) })}
              onUp={() => onChange({ ...block, ex: move(block.ex || [], j, -1) })}
              onDown={() => onChange({ ...block, ex: move(block.ex || [], j, 1) })}
              onRemove={() => onChange({ ...block, ex: (block.ex || []).filter((_, idx) => idx !== j) })}
            />
          ))
        : null}
      {meta.k === "sets" ? (
        <button type="button" className="icon-btn" onClick={() => onChange({ ...block, ex: [...(block.ex || []), { name: "", sets: [{ w: "", r: "" }] }] })}>
          + Exercise
        </button>
      ) : null}
      {block.m ? (
        <>
          <div className="flex gap-2">
            <select className="field" aria-label="Format" value={block.m.fmt} onChange={(e) => onChange({ ...block, m: { ...block.m!, fmt: e.target.value } })}>
              {METCON.map((o) => <option key={o}>{o}</option>)}
            </select>
            <input className="field" placeholder="Time cap / length" value={block.m.cap} onChange={(e) => onChange({ ...block, m: { ...block.m!, cap: e.target.value } })} />
          </div>
          <textarea className="field" placeholder="Workout, e.g. 21-15-9 Thrusters 95/65 + Pull-ups" value={block.m.desc} onChange={(e) => onChange({ ...block, m: { ...block.m!, desc: e.target.value } })} />
          <div className="flex gap-2">
            <select className="field" aria-label="RX or scaled" value={block.m.rx} onChange={(e) => onChange({ ...block, m: { ...block.m!, rx: e.target.value } })}>
              <option>RX</option>
              <option>Scaled</option>
            </select>
            <input className="field" placeholder="Result (time or rounds + reps)" value={block.m.score} onChange={(e) => onChange({ ...block, m: { ...block.m!, score: e.target.value } })} />
          </div>
          <button type="button" className="icon-btn" onClick={onTimer}>Open timer</button>
        </>
      ) : null}
      {block.c ? (
        <>
          <select className="field" aria-label="Modality" value={block.c.mod} onChange={(e) => onChange({ ...block, c: { ...block.c!, mod: e.target.value } })}>
            {MODS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="field" placeholder="Distance" value={block.c.dist} onChange={(e) => onChange({ ...block, c: { ...block.c!, dist: e.target.value } })} />
            <input className="field" placeholder="Time" value={block.c.time} onChange={(e) => onChange({ ...block, c: { ...block.c!, time: e.target.value } })} />
          </div>
          <input className="field" placeholder="Notes" value={block.c.notes} onChange={(e) => onChange({ ...block, c: { ...block.c!, notes: e.target.value } })} />
        </>
      ) : null}
      {block.type === "other" ? (
        <textarea className="field" placeholder="Anything else for today" value={block.txt || ""} onChange={(e) => onChange({ ...block, txt: e.target.value })} />
      ) : null}
    </section>
  );
}

function ExerciseFields({
  ex,
  type,
  unit,
  plan,
  hint,
  pct,
  onChange,
  onUp,
  onDown,
  onRemove,
}: {
  ex: Exercise;
  type: BlockType;
  unit: string;
  plan: boolean;
  hint: string;
  pct: (w: string) => string;
  onChange: (e: Exercise) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  const gym = type === "gym";
  const showUnit = type === "acc" || type === "gym";
  const showPct = !gym;
  const showDone = (type === "lift" || type === "str") && !plan;
  function setLine(n: number, line: SetLine) {
    onChange({ ...ex, sets: ex.sets.map((s, i) => (i === n ? line : s)) });
  }
  return (
    <div className="space-y-2 border-t border-line pt-3 first:border-0 first:pt-0">
      <div className="flex gap-2">
        <input
          className="field"
          list="exlist"
          placeholder={type === "lift" ? "Lift or complex, e.g. Clean + Front Squat + Jerk" : "Exercise"}
          value={ex.name}
          onChange={(e) => onChange({ ...ex, name: e.target.value })}
        />
        {showUnit ? (
          <select className="field w-28 flex-none" aria-label="Unit" value={ex.u || "reps"} onChange={(e) => onChange({ ...ex, u: e.target.value as Exercise["u"] })}>
            <option value="reps">reps</option>
            <option value="sec">sec</option>
            <option value="min">min</option>
          </select>
        ) : null}
        <button type="button" className="icon-btn" onClick={onRemove} aria-label="Remove exercise">✕</button>
      </div>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {ex.sets.map((s, n) => (
        <div key={n} className="flex flex-wrap items-center gap-1.5">
          <span className="w-5 text-center text-xs text-muted">{n + 1}</span>
          {gym ? null : (
            <input className="field w-20 flex-1 text-center" inputMode="decimal" aria-label="Weight" placeholder={unit} value={s.w} onChange={(e) => setLine(n, { ...s, w: e.target.value })} />
          )}
          {gym ? null : <span className="text-muted">×</span>}
          <input
            className="field w-20 flex-1 text-center"
            inputMode="numeric"
            aria-label="Reps"
            placeholder={type === "str" ? "reps / sec" : showUnit ? ex.u || "reps" : "reps"}
            value={s.r}
            onChange={(e) => setLine(n, { ...s, r: e.target.value })}
          />
          {showPct ? (
            <input className="field w-16 flex-1 text-center" inputMode="decimal" aria-label="Percent" placeholder={pct(s.w)} value={s.p || ""} onChange={(e) => setLine(n, { ...s, p: e.target.value })} />
          ) : null}
          {showDone ? (
            <input className="check" type="checkbox" aria-label="Set done" checked={Boolean(s.d)} onChange={(e) => setLine(n, { ...s, d: e.target.checked ? 1 : 0 })} />
          ) : null}
          <button type="button" className="icon-btn" aria-label="Remove set" onClick={() => onChange({ ...ex, sets: ex.sets.filter((_, i) => i !== n) })}>−</button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            const last = ex.sets[ex.sets.length - 1] || { w: "", r: "" };
            onChange({ ...ex, sets: [...ex.sets, { w: last.w, r: last.r }] });
          }}
        >
          + Set
        </button>
        <button type="button" className="icon-btn" onClick={onUp}>Move up</button>
        <button type="button" className="icon-btn" onClick={onDown}>Move down</button>
      </div>
    </div>
  );
}

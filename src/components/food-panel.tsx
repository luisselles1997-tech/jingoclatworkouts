import { useState } from "react";
import { fmtDate, ymd, type FoodItem } from "@/lib/model";
import { useLog } from "@/lib/store";

export function FoodPanel() {
  const fd = useLog((s) => s.fd);
  const food = useLog((s) => s.food);
  const foods = useLog((s) => s.foods);
  const setFd = useLog((s) => s.setFd);
  const shiftFd = useLog((s) => s.shiftFd);
  const setFoodDay = useLog((s) => s.setFoodDay);
  const upsertFood = useLog((s) => s.upsertFood);
  const removeFood = useLog((s) => s.removeFood);
  const showToast = useLog((s) => s.showToast);
  const items = food[fd] || [];
  const total = items.reduce((a, x) => a + (x.cal || 0), 0);
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [kcal, setKcal] = useState("");
  const [auto, setAuto] = useState(false);
  const [edit, setEdit] = useState(-1);
  const known = foods.find((f) => f.n.toLowerCase() === name.trim().toLowerCase());

  function applyGrams(gRaw: string, nRaw: string, fromUserKcal: boolean) {
    setGrams(gRaw);
    const f = foods.find((x) => x.n.toLowerCase() === nRaw.trim().toLowerCase());
    const g = parseFloat(gRaw);
    if (f && g > 0 && !fromUserKcal) {
      setKcal(String(Math.round(g * f.k)));
      setAuto(true);
    }
  }

  function add() {
    const k = parseFloat(kcal);
    if (!(k >= 0)) {
      showToast("Enter the calories");
      return;
    }
    const g = parseFloat(grams) || 0;
    const item: FoodItem = { n: name.trim() || "Food", cal: Math.round(k), g };
    setFoodDay(fd, [...items, item]);
    if (!auto && g > 0 && k > 0 && item.n !== "Food") upsertFood({ n: item.n, k: k / g, g });
    setName("");
    setGrams("");
    setKcal("");
    setAuto(false);
  }

  return (
    <div>
      <h2 className="display mb-3 text-4xl">Calories</h2>
      <div className="mb-3 flex gap-2">
        <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => shiftFd(-1)}>‹</button>
        <input className="field" type="date" value={fd} onChange={(e) => setFd(e.target.value)} />
        <button type="button" className="icon-btn" aria-label="Next day" onClick={() => shiftFd(1)}>›</button>
      </div>
      <div className="card mb-3 space-y-2">
        <div className="flex gap-2">
          <input className="field" list="foodlist" placeholder="Food" value={name} onChange={(e) => { setName(e.target.value); applyGrams(grams, e.target.value, !auto && kcal !== ""); }} />
          <input className="field w-24 flex-none" inputMode="decimal" placeholder="grams" value={grams} onChange={(e) => applyGrams(e.target.value, name, false)} />
          <input className="field w-24 flex-none" inputMode="decimal" placeholder="kcal" value={kcal} onChange={(e) => { setKcal(e.target.value); setAuto(false); }} />
        </div>
        {known ? <p className="text-sm text-muted">{known.n}: {Math.round(known.k * 100)} kcal per 100 g</p> : null}
        <button type="button" className="icon-btn" onClick={add}>Add</button>
        <datalist id="foodlist">{foods.map((f) => <option key={f.n} value={f.n} />)}</datalist>
      </div>
      <CopyDay fd={fd} items={items} />
      <p className="mb-2 text-sm text-muted">{fmtDate(fd)}</p>
      {items.length ? items.map((x, i) => (
        edit === i ? (
          <EditItem key={i} item={x} foods={foods} onCancel={() => setEdit(-1)} onSave={(next) => {
            const copy = items.slice();
            copy[i] = next;
            setFoodDay(fd, copy);
            if (next.g > 0 && next.cal > 0) upsertFood({ n: next.n, k: next.cal / next.g, g: next.g });
            setEdit(-1);
            showToast("Updated");
          }} />
        ) : (
          <div key={i} className="card mb-2 flex items-center justify-between gap-2">
            <div>
              <div>{x.n}</div>
              {x.g ? <div className="text-sm text-muted">{x.g} g</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <b>{x.cal}</b>
              <button type="button" className="icon-btn" onClick={() => setEdit(i)}>Edit</button>
              <button type="button" className="icon-btn" aria-label="Remove" onClick={() => setFoodDay(fd, items.filter((_, j) => j !== i))}>✕</button>
            </div>
          </div>
        )
      )) : <p className="text-muted">Nothing logged for this day.</p>}
      <div className="card mt-3 flex items-center justify-between">
        <b>Total</b>
        <b className="display text-3xl">{total} kcal</b>
      </div>
      {foods.length ? <p className="eyebrow mb-2 mt-4">Saved foods</p> : null}
      {foods.map((f) => (
        <div key={f.n} className="card mb-2 flex items-center justify-between gap-2">
          <div>{f.n} <span className="text-muted">{Math.round(f.k * 100)}</span></div>
          <div className="flex gap-2">
            <button type="button" className="icon-btn" onClick={() => { const g = f.g || 100; setFoodDay(fd, [...(food[fd] || []), { n: f.n, cal: Math.round(g * f.k), g }]); showToast(`Added ${f.n}`); }}>Add</button>
            <button type="button" className="icon-btn" aria-label="Forget food" onClick={() => removeFood(f.n)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyDay({ fd, items }: { fd: string; items: FoodItem[] }) {
  const food = useLog((s) => s.food);
  const setFoodDay = useLog((s) => s.setFoodDay);
  const showToast = useLog((s) => s.showToast);
  const y = new Date(`${fd}T00:00`);
  y.setDate(y.getDate() - 1);
  const [src, setSrc] = useState(ymd(y));
  return (
    <div className="card mb-3">
      <div className="eyebrow mb-2">Copy from another day</div>
      <div className="flex gap-2">
        <input className="field" type="date" value={src} onChange={(e) => setSrc(e.target.value)} />
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            const list = food[src] || [];
            if (!src || src === fd || !list.length) {
              showToast(src === fd ? "Pick a different day" : "Nothing logged on that day");
              return;
            }
            setFoodDay(fd, [...items, ...list.map((x) => ({ ...x }))]);
            showToast(`Copied ${list.length} item${list.length > 1 ? "s" : ""}`);
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function EditItem({
  item,
  foods,
  onSave,
  onCancel,
}: {
  item: FoodItem;
  foods: { n: string; k: number }[];
  onSave: (item: FoodItem) => void;
  onCancel: () => void;
}) {
  const [n, setN] = useState(item.n);
  const [g, setG] = useState(item.g ? String(item.g) : "");
  const [k, setK] = useState(String(item.cal));
  return (
    <div className="card mb-2 space-y-2">
      <div className="flex gap-2">
        <input className="field" value={n} onChange={(e) => setN(e.target.value)} />
        <input className="field w-24 flex-none" inputMode="decimal" value={g} placeholder="grams" onChange={(e) => {
          setG(e.target.value);
          const f = foods.find((x) => x.n.toLowerCase() === n.trim().toLowerCase());
          const grams = parseFloat(e.target.value);
          if (f && grams > 0) setK(String(Math.round(grams * f.k)));
        }} />
        <input className="field w-24 flex-none" inputMode="decimal" value={k} placeholder="kcal" onChange={(e) => setK(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="button" className="icon-btn" onClick={() => onSave({ n: n.trim() || "Food", cal: Math.round(parseFloat(k) || 0), g: parseFloat(g) || 0 })}>Save</button>
        <button type="button" className="icon-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

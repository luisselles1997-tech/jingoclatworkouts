import { BLOCKS, fmtSets, type Block } from "@/lib/model";

export function Summary({ blocks, notes }: { blocks: Block[]; notes?: string }) {
  return (
    <div className="mt-3 space-y-3 text-sm">
      {blocks.map((b, i) => {
        const meta = BLOCKS[b.type];
        return (
          <section key={`${b.type}-${i}`}>
            <div className="eyebrow">{meta?.n || b.type}</div>
            {b.ex
              ? b.ex.map((e, j) => (
                  <p key={j}>
                    <span className="font-medium">{e.name || "—"}</span>{" "}
                    <span className="text-muted">{fmtSets(e.sets, e.u, b.type === "gym")}</span>
                  </p>
                ))
              : null}
            {b.m ? (
              <>
                <p>
                  {b.m.fmt} {b.m.cap} · {b.m.rx}
                </p>
                {b.m.desc ? <p className="whitespace-pre-wrap">{b.m.desc}</p> : null}
                {b.m.score ? <p>Result: {b.m.score}</p> : null}
              </>
            ) : null}
            {b.c ? (
              <>
                <p>
                  {b.c.mod} {b.c.dist} {b.c.time}
                </p>
                {b.c.notes ? <p className="text-muted">{b.c.notes}</p> : null}
              </>
            ) : null}
            {b.txt ? <p className="whitespace-pre-wrap">{b.txt}</p> : null}
          </section>
        );
      })}
      {notes ? <p className="whitespace-pre-wrap text-muted">{notes}</p> : null}
    </div>
  );
}

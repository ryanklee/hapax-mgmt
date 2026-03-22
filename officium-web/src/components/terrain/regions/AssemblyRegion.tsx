import { Region } from "../Region";
import { useManagement } from "../../../api/hooks";
import type { StimmungStance } from "../types";

export function AssemblyRegion({ stimmungStance }: { stimmungStance?: StimmungStance }) {
  return (
    <Region name="assembly" className="h-full" stimmungStance={stimmungStance}>
      {(depth) => {
        if (depth === "surface") return <AssemblySurface />;
        return <AssemblyStratum />;
      }}
    </Region>
  );
}

function AssemblySurface() {
  const { data: mgmt } = useManagement();
  const people = mgmt?.people ?? [];
  const stale = people.filter((p) => p.stale_1on1).length;
  const highLoad = people.filter((p) => (p.cognitive_load ?? 0) >= 4).length;

  return (
    <div className="flex items-center gap-3 px-3 h-full text-[11px] text-zinc-400">
      <span>{people.length} reports</span>
      {stale > 0 && <span className="text-yellow-400 font-medium">{stale} stale 1:1s</span>}
      {highLoad > 0 && <span className="text-orange-400">{highLoad} high load</span>}
    </div>
  );
}

function AssemblyStratum() {
  const { data: mgmt } = useManagement();
  const people = mgmt?.people ?? [];
  const coaching = mgmt?.coaching ?? [];
  const feedback = mgmt?.feedback ?? [];

  return (
    <div className="p-3 h-full overflow-y-auto space-y-3">
      <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Team</h3>
      <div className="space-y-1.5">
        {people.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-[11px]">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: p.stale_1on1
                  ? "#fabd2f"
                  : (p.cognitive_load ?? 0) >= 4
                    ? "#fe8019"
                    : "#98971a",
              }}
            />
            <span className="text-zinc-300">{p.name}</span>
            <span className="text-zinc-600 text-[10px]">{p.role ?? p.team}</span>
            {p.days_since_1on1 != null && (
              <span className="text-zinc-600 text-[10px] ml-auto">
                {p.days_since_1on1}d since 1:1
              </span>
            )}
          </div>
        ))}
      </div>

      {coaching.length > 0 && (
        <>
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Coaching</h3>
          <div className="space-y-1">
            {coaching.map((c, i) => (
              <div key={i} className="text-[11px] text-zinc-400">
                <span className={c.overdue ? "text-orange-400" : ""}>{c.title}</span>
                <span className="text-zinc-600"> — {c.person}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {feedback.length > 0 && (
        <>
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Feedback</h3>
          <div className="space-y-1">
            {feedback.map((f, i) => (
              <div key={i} className="text-[11px] text-zinc-400">
                <span className={f.overdue ? "text-red-400" : ""}>{f.title}</span>
                <span className="text-zinc-600">
                  {" "}
                  — {f.person} ({f.direction})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

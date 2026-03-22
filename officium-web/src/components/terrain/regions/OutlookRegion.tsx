import { Region } from "../Region";
import { useBriefing, useGoals, useNudges, useOKRs } from "../../../api/hooks";
import { NudgeList } from "../../dashboard/NudgeList";
import type { StimmungStance } from "../types";

export function OutlookRegion({ stimmungStance }: { stimmungStance?: StimmungStance }) {
  return (
    <Region name="outlook" className="h-full" stimmungStance={stimmungStance}>
      {(depth) => {
        if (depth === "surface") return <OutlookSurface />;
        return <OutlookStratum />;
      }}
    </Region>
  );
}

function OutlookSurface() {
  const { data: briefing } = useBriefing();
  const { data: nudges } = useNudges();
  const { data: okrs } = useOKRs();

  const headline = briefing?.headline ?? "No briefing yet";
  const nudgeCount = nudges?.length ?? 0;
  const atRisk = okrs?.at_risk_count ?? 0;

  return (
    <div className="flex items-center gap-4 px-3 h-full text-[11px] text-zinc-400">
      <span className="truncate flex-1">{headline}</span>
      {nudgeCount > 0 && (
        <span className="text-yellow-400 whitespace-nowrap">{nudgeCount} nudges</span>
      )}
      {atRisk > 0 && (
        <span className="text-orange-400 whitespace-nowrap">{atRisk} OKRs at risk</span>
      )}
    </div>
  );
}

function OutlookStratum() {
  const { data: briefing } = useBriefing();
  const { data: goals } = useGoals();
  const { data: okrs } = useOKRs();

  return (
    <div className="grid grid-cols-3 gap-3 p-3 h-full overflow-y-auto">
      {/* Column 1: Nudges */}
      <div className="space-y-2">
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Nudges</h3>
        <NudgeList />
      </div>

      {/* Column 2: Goals */}
      <div className="space-y-2">
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Goals</h3>
        {goals?.goals?.map((g) => (
          <div key={g.id ?? g.name} className="text-[11px] text-zinc-400">
            <span className={g.stale ? "text-yellow-400" : ""}>{g.stale ? "! " : ""}{g.name}</span>
            {g.progress_summary && (
              <span className="text-zinc-600 ml-1">— {g.progress_summary}</span>
            )}
          </div>
        )) ?? <span className="text-zinc-600 text-[11px]">No goals</span>}
      </div>

      {/* Column 3: OKRs + Briefing */}
      <div className="space-y-2">
        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">OKRs</h3>
        {okrs?.okrs?.map((o) => (
          <div key={o.objective} className="text-[11px] text-zinc-400">
            <span>{o.objective}</span>
            {o.at_risk_count > 0 && (
              <span className="text-orange-400 ml-1">({o.at_risk_count} at risk)</span>
            )}
          </div>
        )) ?? <span className="text-zinc-600 text-[11px]">No OKRs</span>}

        {briefing && (
          <>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mt-3">Briefing</h3>
            <div className="text-[11px] text-zinc-400 line-clamp-4">{briefing.headline}</div>
            {briefing.action_items && (
              <div className="text-[10px] text-zinc-500">
                {briefing.action_items.length} action items
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

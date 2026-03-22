import { Region } from "../Region";
import { useReviewCycles, useStatusReports } from "../../../api/hooks";
import type { StimmungStance } from "../types";

export function CadenceRegion({ stimmungStance }: { stimmungStance?: StimmungStance }) {
  return (
    <Region name="cadence" className="h-full" stimmungStance={stimmungStance}>
      {(depth) => {
        if (depth === "surface") return <CadenceSurface />;
        return <CadenceStratum />;
      }}
    </Region>
  );
}

function CadenceSurface() {
  const { data: reviews } = useReviewCycles();
  const { data: reports } = useStatusReports();

  const overdue = reviews?.overdue_count ?? 0;
  const reportStale = reports?.stale ?? false;

  return (
    <div className="flex items-center gap-3 px-3 h-full text-[11px] text-zinc-400">
      {overdue > 0 ? (
        <span className="text-red-400 font-medium">{overdue} overdue reviews</span>
      ) : (
        <span>reviews on track</span>
      )}
      <span className={reportStale ? "text-yellow-400" : ""}>
        status {reportStale ? "stale" : "current"}
      </span>
    </div>
  );
}

function CadenceStratum() {
  const { data: reviews } = useReviewCycles();
  const { data: reports } = useStatusReports();

  return (
    <div className="p-3 h-full overflow-y-auto space-y-3">
      <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Review Cycles</h3>
      <div className="space-y-1.5">
        {reviews?.cycles?.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: c.overdue ? "#fb4934" : "#98971a" }}
            />
            <span className="text-zinc-300">{c.person}</span>
            <span className="text-zinc-600 text-[10px]">{c.status}</span>
            {c.peer_feedback_gap > 0 && (
              <span className="text-yellow-400 text-[10px] ml-auto">
                {c.peer_feedback_gap} feedback gap
              </span>
            )}
          </div>
        )) ?? <span className="text-zinc-600 text-[11px]">No active cycles</span>}
      </div>

      <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Status Reports</h3>
      <div className="space-y-1.5">
        {reports?.reports?.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className={`text-zinc-300 ${r.stale ? "text-yellow-400" : ""}`}>
              {r.cadence} — {r.direction}
            </span>
            <span className="text-zinc-600 text-[10px] ml-auto">{r.days_since}d ago</span>
          </div>
        )) ?? <span className="text-zinc-600 text-[11px]">No status reports</span>}
      </div>
    </div>
  );
}

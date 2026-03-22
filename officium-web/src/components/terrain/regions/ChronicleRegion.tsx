import { Region } from "../Region";
import { useIncidents, usePostmortemActions } from "../../../api/hooks";
import type { StimmungStance } from "../types";

const SEV_COLORS: Record<string, string> = {
  sev1: "#fb4934",
  sev2: "#fe8019",
  sev3: "#fabd2f",
  sev4: "#98971a",
  sev5: "#665c54",
};

export function ChronicleRegion({ stimmungStance }: { stimmungStance?: StimmungStance }) {
  return (
    <Region name="chronicle" className="h-full" stimmungStance={stimmungStance}>
      {(depth) => {
        if (depth === "surface") return <ChronicleSurface />;
        return <ChronicleStratum />;
      }}
    </Region>
  );
}

function ChronicleSurface() {
  const { data: incidents } = useIncidents();

  const open = incidents?.open_count ?? 0;
  const missingPM = incidents?.missing_postmortem_count ?? 0;

  return (
    <div className="flex items-center gap-3 px-3 h-full text-[11px] text-zinc-400">
      {open > 0 ? (
        <span className="text-red-400 font-medium">{open} open incidents</span>
      ) : (
        <span>no incidents</span>
      )}
      {missingPM > 0 && (
        <span className="text-orange-400">{missingPM} need postmortem</span>
      )}
    </div>
  );
}

function ChronicleStratum() {
  const { data: incidents } = useIncidents();
  const { data: postmortems } = usePostmortemActions();

  return (
    <div className="p-3 h-full overflow-y-auto space-y-3">
      <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Incidents</h3>
      <div className="space-y-1.5">
        {incidents?.incidents
          ?.filter((inc) => inc.open)
          .map((inc, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: SEV_COLORS[inc.severity] ?? "#665c54" }}
              />
              <span className="text-zinc-300">{inc.title}</span>
              <span className="text-zinc-600 text-[10px]">{inc.severity}</span>
              {!inc.has_postmortem && (
                <span className="text-orange-400 text-[10px] ml-auto">no postmortem</span>
              )}
            </div>
          )) ?? <span className="text-zinc-600 text-[11px]">No open incidents</span>}
      </div>

      <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">Postmortem Actions</h3>
      <div className="space-y-1.5">
        {postmortems?.actions?.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className={`text-zinc-300 ${a.overdue ? "text-red-400" : ""}`}>{a.title}</span>
            <span className="text-zinc-600 text-[10px]">{a.owner}</span>
            <span className="text-zinc-600 text-[10px] ml-auto">{a.status}</span>
          </div>
        )) ?? <span className="text-zinc-600 text-[11px]">No actions</span>}
      </div>
    </div>
  );
}

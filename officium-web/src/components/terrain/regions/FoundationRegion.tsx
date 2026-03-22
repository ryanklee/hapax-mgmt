import { Region } from "../Region";
import { useAgents, useCycleMode } from "../../../api/hooks";
import { AgentGrid } from "../../dashboard/AgentGrid";
import { useAgentRun } from "../../../contexts/AgentRunContext";
import type { StimmungStance } from "../types";
import type { AgentInfo } from "../../../api/types";

export function FoundationRegion({ stimmungStance }: { stimmungStance?: StimmungStance }) {
  return (
    <Region name="foundation" className="h-full" stimmungStance={stimmungStance}>
      {(depth) => {
        if (depth === "surface") return <FoundationSurface />;
        return <FoundationStratum />;
      }}
    </Region>
  );
}

function FoundationSurface() {
  const { data: agents } = useAgents();
  const { data: cycleMode } = useCycleMode();

  const count = agents?.length ?? 0;
  const mode = cycleMode?.mode ?? "prod";

  return (
    <div className="flex items-center gap-3 px-3 h-full text-[11px] text-zinc-400">
      <span>{count} agents</span>
      <span className={mode === "dev" ? "text-blue-400" : ""}>{mode} mode</span>
    </div>
  );
}

function FoundationStratum() {
  const { runAgent, isRunning } = useAgentRun();

  const handleRun = (agent: AgentInfo, flags: string[]) => {
    runAgent(agent, flags);
  };

  return (
    <div className="p-3 h-full overflow-y-auto">
      <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Agents</h3>
      <AgentGrid onRun={handleRun} disabled={isRunning} />
    </div>
  );
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useSSE } from "../hooks/useSSE";
import { useTerrainActions } from "./TerrainContext";
import type { AgentInfo } from "../api/types";

interface AgentRunState {
  lines: string[];
  isRunning: boolean;
  error: string | null;
  agentName: string | null;
  startedAt: number | null;
  runAgent: (agent: AgentInfo, flags: string[]) => void;
  cancelAgent: () => void;
  clearOutput: () => void;
}

const AgentRunCtx = createContext<AgentRunState | null>(null);

export function AgentRunProvider({ children }: { children: ReactNode }) {
  const sse = useSSE();
  const [agentName, setAgentName] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const { setOverlay, setInvestigationTab } = useTerrainActions();

  const runAgent = useCallback(
    (agent: AgentInfo, flags: string[]) => {
      setAgentName(agent.name);
      setStartedAt(Date.now());
      sse.start(`/api/agents/${agent.name}/run`, { flags });
      setOverlay("investigation");
      setInvestigationTab("output");
    },
    [sse, setOverlay, setInvestigationTab],
  );

  const cancelAgent = useCallback(() => {
    sse.cancel();
    fetch("/api/agents/runs/current", { method: "DELETE" }).catch(() => {});
  }, [sse]);

  const clearOutput = useCallback(() => {
    sse.clear();
    setAgentName(null);
    setStartedAt(null);
  }, [sse]);

  const value = useMemo<AgentRunState>(
    () => ({
      lines: sse.lines,
      isRunning: sse.isRunning,
      error: sse.error,
      agentName,
      startedAt,
      runAgent,
      cancelAgent,
      clearOutput,
    }),
    [sse.lines, sse.isRunning, sse.error, agentName, startedAt, runAgent, cancelAgent, clearOutput],
  );

  return <AgentRunCtx.Provider value={value}>{children}</AgentRunCtx.Provider>;
}

export function useAgentRun(): AgentRunState {
  const ctx = useContext(AgentRunCtx);
  if (!ctx) throw new Error("useAgentRun must be used within AgentRunProvider");
  return ctx;
}

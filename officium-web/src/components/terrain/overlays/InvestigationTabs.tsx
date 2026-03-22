import { useTerrainDisplay, useTerrainActions } from "../../../contexts/TerrainContext";
import type { InvestigationTab } from "../types";
import { INVESTIGATION_TABS } from "../types";
import { ChatTab } from "./ChatTab";
import { QueryTab } from "./QueryTab";
import { PrepTab } from "./PrepTab";
import { OutputTab } from "./OutputTab";

const TAB_LABELS: Record<InvestigationTab, string> = {
  chat: "Chat",
  query: "Query",
  prep: "Prep",
  output: "Output",
};

export function InvestigationTabs() {
  const { investigationTab } = useTerrainDisplay();
  const { setInvestigationTab } = useTerrainActions();

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 px-3 pt-3 pb-1 shrink-0">
        {INVESTIGATION_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setInvestigationTab(tab)}
            className={`px-3 py-1 rounded text-[11px] uppercase tracking-wider transition-colors ${
              investigationTab === tab
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {investigationTab === "chat" && <ChatTab />}
        {investigationTab === "query" && <QueryTab />}
        {investigationTab === "prep" && <PrepTab />}
        {investigationTab === "output" && <OutputTab />}
      </div>
    </>
  );
}

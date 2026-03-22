import { TerrainProvider } from "../contexts/TerrainContext";
import { AgentRunProvider } from "../contexts/AgentRunContext";
import { TerrainLayout } from "../components/terrain/TerrainLayout";
import { Sidebar } from "../components/Sidebar";

export function TerrainPage() {
  return (
    <TerrainProvider>
      <AgentRunProvider>
        <div className="flex flex-1 overflow-hidden">
          <TerrainLayout />
          <Sidebar />
        </div>
      </AgentRunProvider>
    </TerrainProvider>
  );
}

import { useTerrainDisplay, useTerrainActions } from "../../../contexts/TerrainContext";
import { InvestigationTabs } from "./InvestigationTabs";

export function InvestigationOverlay() {
  const { activeOverlay } = useTerrainDisplay();
  const { setOverlay } = useTerrainActions();

  if (activeOverlay !== "investigation") return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 40 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOverlay(null);
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.3)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div
        className="relative rounded-lg overflow-hidden flex flex-col"
        style={{
          width: "60%",
          height: "90vh",
          maxWidth: 960,
          background: "rgba(29, 32, 33, 0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(80, 73, 69, 0.3)",
        }}
      >
        <InvestigationTabs />
      </div>
    </div>
  );
}

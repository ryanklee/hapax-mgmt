import { useCallback, useEffect } from "react";
import { useTerrainDisplay, useTerrainActions } from "../../contexts/TerrainContext";
import { useStimmung } from "../../hooks/useStimmung";
import { OutlookRegion } from "./regions/OutlookRegion";
import { AssemblyRegion } from "./regions/AssemblyRegion";
import { CadenceRegion } from "./regions/CadenceRegion";
import { ChronicleRegion } from "./regions/ChronicleRegion";
import { FoundationRegion } from "./regions/FoundationRegion";
import { InvestigationOverlay } from "./overlays/InvestigationOverlay";
import { KeyboardHintBar } from "./KeyboardHintBar";
import type { RegionName } from "./types";
import { REGION_KEYS } from "./types";

const MIDDLE_REGIONS: RegionName[] = ["assembly", "cadence", "chronicle"];

function useGridStyles() {
  const { regionDepths, focusedRegion } = useTerrainDisplay();
  const outlookExpanded = regionDepths.outlook !== "surface";
  const foundationExpanded = regionDepths.foundation !== "surface";
  const coreMiddle = MIDDLE_REGIONS.find((r) => regionDepths[r] === "core") ?? null;

  const rows = coreMiddle
    ? "3.5vh 1fr 3vh"
    : `${outlookExpanded ? "minmax(12vh, 35vh)" : "12vh"} 1fr ${foundationExpanded ? "minmax(10vh, 40vh)" : "10vh"}`;

  const cols = coreMiddle ? "1fr" : "1fr 2fr 1fr";

  return { rows, cols, coreMiddle };
}

export function TerrainLayout() {
  const { activeOverlay, focusedRegion, regionDepths } = useTerrainDisplay();
  const { setOverlay, focusRegion, cycleDepth, setRegionDepth } = useTerrainActions();
  const { rows, cols, coreMiddle } = useGridStyles();
  const stimmung = useStimmung();

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // / toggles investigation
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !isInput) {
        e.preventDefault();
        setOverlay(activeOverlay === "investigation" ? null : "investigation");
        return;
      }

      // Escape cascade
      if (e.key === "Escape") {
        if (document.fullscreenElement) return;
        if (activeOverlay) {
          setOverlay(null);
          return;
        }
        if (focusedRegion && regionDepths[focusedRegion] !== "surface") {
          setRegionDepth(focusedRegion, "surface");
          focusRegion(null);
          return;
        }
        if (focusedRegion) {
          focusRegion(null);
          return;
        }
        return;
      }

      // Region shortcuts — blocked during investigation
      if (activeOverlay !== "investigation" && !isInput && !e.ctrlKey && !e.metaKey) {
        const region = REGION_KEYS[e.key.toLowerCase()];
        if (region) {
          focusRegion(region);
          cycleDepth(region);
        }
      }
    },
    [activeOverlay, setOverlay, focusRegion, cycleDepth, focusedRegion, regionDepths, setRegionDepth],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      className="h-full w-full overflow-hidden relative"
      style={{ fontFamily: "'JetBrains Mono', monospace", background: "#1d2021" }}
    >
      {/* Terrain grid */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: cols,
          gridTemplateRows: rows,
          transition: "grid-template-rows 300ms ease, grid-template-columns 300ms ease",
        }}
      >
        {/* Row 1: Outlook (full width) */}
        <div style={{ gridColumn: coreMiddle ? "1" : "1 / -1" }}>
          <OutlookRegion stimmungStance={stimmung.outlook} />
        </div>

        {/* Row 2: Assembly | Cadence | Chronicle */}
        {(!coreMiddle || coreMiddle === "assembly") && (
          <AssemblyRegion stimmungStance={stimmung.assembly} />
        )}
        {(!coreMiddle || coreMiddle === "cadence") && (
          <CadenceRegion stimmungStance={stimmung.cadence} />
        )}
        {(!coreMiddle || coreMiddle === "chronicle") && (
          <ChronicleRegion stimmungStance={stimmung.chronicle} />
        )}

        {/* Row 3: Foundation (full width) */}
        <div style={{ gridColumn: coreMiddle ? "1" : "1 / -1" }}>
          <FoundationRegion stimmungStance={stimmung.foundation} />
        </div>
      </div>

      {/* Investigation overlay */}
      <InvestigationOverlay />

      {/* Keyboard hint bar */}
      <KeyboardHintBar />
    </div>
  );
}

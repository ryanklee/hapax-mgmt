import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import type { Depth, InvestigationTab, Overlay, RegionName } from "../components/terrain/types";
import { DEPTHS } from "../components/terrain/types";

export interface TerrainDisplayValue {
  focusedRegion: RegionName | null;
  regionDepths: Record<RegionName, Depth>;
  activeOverlay: Overlay;
  investigationTab: InvestigationTab;
}

export interface TerrainActionValue {
  focusRegion: (region: RegionName | null) => void;
  setRegionDepth: (region: RegionName, depth: Depth) => void;
  cycleDepth: (region: RegionName) => void;
  setOverlay: (overlay: Overlay) => void;
  setInvestigationTab: (tab: InvestigationTab) => void;
}

export const DisplayCtx = createContext<TerrainDisplayValue | null>(null);
export const ActionCtx = createContext<TerrainActionValue | null>(null);

const INITIAL_DEPTHS: Record<RegionName, Depth> = {
  outlook: "surface",
  assembly: "surface",
  cadence: "surface",
  chronicle: "surface",
  foundation: "surface",
};

export function TerrainProvider({ children }: { children: ReactNode }) {
  const [focusedRegion, setFocusedRegion] = useState<RegionName | null>(null);
  const [regionDepths, setRegionDepths] = useState<Record<RegionName, Depth>>({ ...INITIAL_DEPTHS });
  const [activeOverlay, setActiveOverlay] = useState<Overlay>(null);
  const [investigationTab, setInvestigationTab] = useState<InvestigationTab>("output");

  const focusRegion = useCallback((region: RegionName | null) => setFocusedRegion(region), []);

  const setRegionDepth = useCallback((region: RegionName, depth: Depth) => {
    setRegionDepths((prev) => ({ ...prev, [region]: depth }));
  }, []);

  const cycleDepth = useCallback((region: RegionName) => {
    setRegionDepths((prev) => {
      const current = prev[region];
      const idx = DEPTHS.indexOf(current);
      const next = DEPTHS[(idx + 1) % DEPTHS.length];
      return { ...prev, [region]: next };
    });
  }, []);

  const setOverlay = useCallback((overlay: Overlay) => setActiveOverlay(overlay), []);

  const display = useMemo<TerrainDisplayValue>(
    () => ({ focusedRegion, regionDepths, activeOverlay, investigationTab }),
    [focusedRegion, regionDepths, activeOverlay, investigationTab],
  );

  const actions = useMemo<TerrainActionValue>(
    () => ({ focusRegion, setRegionDepth, cycleDepth, setOverlay, setInvestigationTab }),
    [focusRegion, setRegionDepth, cycleDepth, setOverlay],
  );

  return (
    <DisplayCtx.Provider value={display}>
      <ActionCtx.Provider value={actions}>{children}</ActionCtx.Provider>
    </DisplayCtx.Provider>
  );
}




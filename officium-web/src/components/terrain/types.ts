export type RegionName = "outlook" | "assembly" | "cadence" | "chronicle" | "foundation";
export type Depth = "surface" | "stratum" | "core";
export type StimmungStance = "nominal" | "cautious" | "degraded" | "critical";
export type Overlay = "investigation" | null;
export type InvestigationTab = "chat" | "query" | "prep" | "output";

export const REGIONS: RegionName[] = ["outlook", "assembly", "cadence", "chronicle", "foundation"];
export const DEPTHS: Depth[] = ["surface", "stratum", "core"];
export const INVESTIGATION_TABS: InvestigationTab[] = ["chat", "query", "prep", "output"];

export const REGION_KEYS: Record<string, RegionName> = {
  o: "outlook",
  a: "assembly",
  c: "cadence",
  h: "chronicle",
  f: "foundation",
};

import { useCallback, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useTerrain } from "../../contexts/TerrainContext";
import type { Depth, RegionName, StimmungStance } from "./types";
import { DEPTHS } from "./types";

interface RegionProps {
  name: RegionName;
  children: (depth: Depth) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stimmungStance?: StimmungStance;
}

const STANCE_BORDER: Record<StimmungStance, string> = {
  nominal: "transparent",
  cautious: "rgba(250, 189, 47, 0.15)",
  degraded: "rgba(254, 128, 25, 0.25)",
  critical: "rgba(251, 73, 52, 0.35)",
};

const STANCE_SHADOW: Record<StimmungStance, string | undefined> = {
  nominal: undefined,
  cautious: undefined,
  degraded: "inset 0 0 8px rgba(254, 128, 25, 0.06)",
  critical: "inset 0 0 12px rgba(251, 73, 52, 0.08)",
};

const STANCE_ANIMATION: Record<StimmungStance, string | undefined> = {
  nominal: undefined,
  cautious: undefined,
  degraded: "stimmung-breathe-degraded 6s ease-in-out infinite",
  critical: "stimmung-breathe-critical 2s ease-in-out infinite",
};

const DEPTH_BORDER: Record<Depth, string> = {
  surface: "transparent",
  stratum: "rgba(180, 160, 120, 0.08)",
  core: "rgba(180, 160, 120, 0.15)",
};

const DEPTH_GLOW: Record<Depth, string> = {
  surface: "none",
  stratum: "inset 0 0 20px rgba(180, 160, 120, 0.03)",
  core: "inset 0 0 30px rgba(180, 160, 120, 0.06)",
};

export function Region({ name, children, className = "", style, stimmungStance }: RegionProps) {
  const { regionDepths, focusedRegion, cycleDepth, focusRegion, setRegionDepth } = useTerrain();
  const depth = regionDepths[name];
  const isFocused = focusedRegion === name;
  const [isHovered, setIsHovered] = useState(false);
  const stance = stimmungStance ?? "nominal";

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (depth !== "surface") {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, textarea, select, [role=button]")) return;
      }
      if (depth === "surface") {
        cycleDepth(name);
        focusRegion(name);
      } else if (depth === "stratum") {
        cycleDepth(name);
      } else {
        cycleDepth(name);
        focusRegion(null);
      }
    },
    [depth, name, cycleDepth, focusRegion],
  );

  const borderColor =
    stance !== "nominal"
      ? STANCE_BORDER[stance]
      : isFocused
        ? "rgba(184, 187, 38, 0.12)"
        : isHovered && depth === "surface"
          ? "rgba(180, 160, 120, 0.12)"
          : DEPTH_BORDER[depth];

  return (
    <div
      data-region={name}
      data-depth={depth}
      className={`relative overflow-hidden ${className}`}
      style={{
        borderColor,
        borderWidth: "1px",
        borderStyle: "solid",
        boxShadow:
          STANCE_SHADOW[stance] ??
          (isFocused ? "inset 0 0 24px rgba(184, 187, 38, 0.04)" : DEPTH_GLOW[depth]),
        animation: STANCE_ANIMATION[stance],
        transition: "border-color 300ms ease, box-shadow 300ms ease",
        cursor: depth === "core" ? "default" : "pointer",
        ...style,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Depth dots nav */}
      <DepthDots name={name} depth={depth} />

      {/* Content */}
      <div className="w-full h-full" style={{ transition: "opacity 150ms ease" }}>
        {children(depth)}
      </div>
    </div>
  );
}

function DepthDots({ name, depth }: { name: RegionName; depth: Depth }) {
  const { setRegionDepth, focusRegion } = useTerrain();
  const currentIdx = DEPTHS.indexOf(depth);

  const jump = useCallback(
    (e: ReactMouseEvent, target: Depth) => {
      e.stopPropagation();
      if (target === depth) return;
      setRegionDepth(name, target);
      if (target === "surface") {
        focusRegion(null);
      } else {
        focusRegion(name);
      }
    },
    [name, depth, setRegionDepth, focusRegion],
  );

  return (
    <div
      className="absolute top-1.5 right-1.5 flex gap-1 items-center"
      style={{ zIndex: 2, opacity: depth === "surface" ? 0 : 1, transition: "opacity 150ms ease" }}
      role="navigation"
      aria-label={`${name} depth: ${depth}`}
    >
      {DEPTHS.map((d, i) => (
        <button
          key={d}
          onClick={(e) => jump(e, d)}
          aria-label={d}
          aria-current={i === currentIdx ? "step" : undefined}
          className="block rounded-full"
          style={{
            width: 6,
            height: 6,
            background:
              i === currentIdx ? "rgba(184, 187, 38, 0.5)" : "rgba(180, 160, 120, 0.2)",
            transition: "background 150ms ease",
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

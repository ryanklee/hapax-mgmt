import { useCallback, useEffect, useState } from "react";

const HINT_STORAGE_KEY = "terrain-hints-dismissed";

export function KeyboardHintBar() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(HINT_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = () => dismiss();
    window.addEventListener("keydown", handler, { once: true });
    return () => window.removeEventListener("keydown", handler);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4 items-center px-4 py-1.5 rounded"
      style={{
        zIndex: 10,
        background: "rgba(29, 32, 33, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(180, 160, 120, 0.12)",
        fontSize: 11,
        color: "rgba(180, 160, 120, 0.5)",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.04em",
      }}
    >
      <span>
        <kbd>O</kbd> <kbd>A</kbd> <kbd>C</kbd> <kbd>H</kbd> <kbd>F</kbd> regions
      </span>
      <span>
        <kbd>/</kbd> investigate
      </span>
      <span>
        <kbd>Ctrl+P</kbd> palette
      </span>
      <button
        onClick={dismiss}
        style={{
          color: "rgba(180, 160, 120, 0.3)",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: "0 0 0 4px",
          fontSize: 11,
        }}
        aria-label="Dismiss hints"
      >
        ×
      </button>
    </div>
  );
}

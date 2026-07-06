"use client";
// Bottom tab bar for the phone layout — Taste | Board | Ideas. Hidden on desktop
// and in print via the .mobile-tabs rules in globals.css; visibility of the three
// zones is driven by data-mtab on the workspace root (pure CSS, zones stay mounted).

export type MobileTab = "taste" | "board" | "ideas";

const TABS: { id: MobileTab; label: string }[] = [
  { id: "taste", label: "Taste" },
  { id: "board", label: "Board" },
  { id: "ideas", label: "Ideas" },
];

export function MobileTabs({ tab, onTab }: { tab: MobileTab; onTab: (t: MobileTab) => void }) {
  return (
    <nav
      className="mobile-tabs"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              borderTop: active ? "2px solid var(--accent)" : "2px solid transparent",
              padding: "13px 0 14px",
              cursor: "pointer",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: active ? "var(--accent)" : "var(--muted-2)",
              fontWeight: active ? 500 : 400,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

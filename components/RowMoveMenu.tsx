"use client";
// Touch alternative to drag-and-drop (mobile-only via CSS): a ⋯ menu per board row
// with Move up / Move down / Move to <component>. Uses the existing hook actions —
// reorderIng for within-component moves, appendIngToComp for cross-component.
import { useState } from "react";
import type { CommittedRow } from "@/lib/types";
import type { Mise } from "./useMise";

export function RowMoveMenu({ m, c }: { m: Mise; c: CommittedRow }) {
  const [open, setOpen] = useState(false);
  const { state } = m;
  const siblings = state.committed.filter((r) => r.componentId === c.componentId);
  const idx = siblings.findIndex((r) => r.uid === c.uid);
  const others = state.components.filter((cp) => cp.id !== c.componentId);

  const item: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    padding: "10px 14px",
    fontSize: 13.5,
    color: "var(--ink)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  function moveUp() {
    if (idx > 0) m.reorderIng(c.uid, siblings[idx - 1].uid, c.componentId, "before");
    setOpen(false);
  }
  function moveDown() {
    if (idx < siblings.length - 1) m.reorderIng(c.uid, siblings[idx + 1].uid, c.componentId, "after");
    setOpen(false);
  }
  function moveTo(compId: string) {
    m.appendIngToComp(c.uid, compId);
    setOpen(false);
  }

  return (
    <span className="mobile-only" style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Move this ingredient"
        className="swapbtn iconbtn"
        style={{
          width: 28,
          height: 28,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--line)",
          background: "#f6efe2",
          borderRadius: 7,
          color: "#8a7d6a",
          fontSize: 15,
          lineHeight: 1,
          cursor: "pointer",
          flex: "0 0 auto",
        }}
      >
        &#8943;
      </button>
      {open && (
        <>
          {/* transparent backdrop to close on any outside tap */}
          <span onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
          <span
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 71,
              display: "block",
              minWidth: 170,
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              boxShadow: "0 10px 30px rgba(46,42,36,.2)",
              overflow: "hidden",
              padding: "4px 0",
            }}
          >
            <button onClick={moveUp} disabled={idx <= 0} style={{ ...item, opacity: idx <= 0 ? 0.4 : 1 }}>
              Move up
            </button>
            <button onClick={moveDown} disabled={idx >= siblings.length - 1} style={{ ...item, opacity: idx >= siblings.length - 1 ? 0.4 : 1 }}>
              Move down
            </button>
            {others.map((cp, i) => (
              <button key={cp.id} onClick={() => moveTo(cp.id)} style={item}>
                Move to &ldquo;{(cp.name || "").trim() || `Part ${i + 2}`}&rdquo;
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

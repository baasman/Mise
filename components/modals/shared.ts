// Shared modal style tokens.
import type { CSSProperties } from "react";

export const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(46,42,36,0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
  padding: 24,
};

export const panel: CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  borderRadius: 14,
  border: "1px solid var(--line)",
  boxShadow: "0 24px 60px rgba(46,42,36,.28)",
  overflow: "hidden",
};

export const closeX: CSSProperties = {
  flex: "0 0 auto",
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid var(--line)",
  background: "var(--card)",
  borderRadius: 8,
  color: "#8a7d6a",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
};

export const modalTitle: CSSProperties = { fontFamily: "var(--serif)", fontSize: 21, color: "var(--ink)" };
export const modalSub: CSSProperties = { fontSize: 12.5, color: "var(--muted-2)", marginTop: 3, lineHeight: 1.4 };

export function cardStyle(active: boolean): CSSProperties {
  return {
    border: active ? "1.5px solid #b5481f" : "1px solid var(--line)",
    background: active ? "#fbf1ea" : "var(--card)",
    borderRadius: 11,
    padding: 16,
    cursor: "pointer",
    width: "100%",
  };
}

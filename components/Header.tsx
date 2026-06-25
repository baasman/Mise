"use client";
import type { Mise } from "./useMise";

export function Header({ m }: { m: Mise }) {
  const { state } = m;
  const intentLabel = m.intent().label;
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 62,
        padding: "0 26px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        flex: "0 0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 13 }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 25, fontWeight: 600, letterSpacing: ".5px", color: "var(--ink)" }}>
          Mise
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase", color: "#a99a85" }}>
          a sous-chef, not a vending machine
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={m.saveCurrent}
          title="Save this combination"
          className="hb"
          style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "7px 14px", cursor: "pointer" }}
        >
          <span style={{ fontSize: 12, lineHeight: 1, color: state.justSaved ? "#1f8a5b" : "var(--accent)" }}>&#9733;</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase", color: "#5c5246" }}>
            {state.justSaved ? "Saved" : "Save"}
          </span>
        </button>
        <button
          onClick={m.openLibrary}
          title="Your saved dishes"
          className="hb"
          style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "7px 14px", cursor: "pointer" }}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase", color: "#5c5246" }}>Saved</span>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "#f0e8da", fontFamily: "var(--mono)", fontSize: 10, color: "#8a7d6a" }}>
            {state.saved.length}
          </span>
        </button>
        <span style={{ width: 1, height: 24, background: "var(--line)" }} />
        <button
          onClick={m.openIntentModal}
          className="hb"
          style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 7px 6px 16px", cursor: "pointer" }}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "1.6px", color: "#a99a85", textTransform: "uppercase" }}>Intent</span>
          <span style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink)" }}>{intentLabel}</span>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: "#f0e8da", fontSize: 12, color: "#8a7d6a" }}>&#8644;</span>
        </button>
      </div>
    </header>
  );
}

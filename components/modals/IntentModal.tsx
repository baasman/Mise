"use client";
import { AXIS_SHORT, INTENTS, RADAR_ORDER } from "@/lib/domain";
import { desiredVec } from "@/lib/engine";
import type { Mise } from "../useMise";
import { overlay, panel, closeX, cardStyle } from "./shared";

export function IntentModal({ m }: { m: Mise }) {
  const { state } = m;
  if (!state.intentModalOpen) return null;

  const isCustom = state.intentId === "custom";
  // The slider values: the current aim, full across all 7 axes (custom values, or
  // the selected preset's targets filled out). Moving any slider switches to custom.
  const aim = desiredVec(m.intent());

  return (
    <div onClick={m.closeIntentModal} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 640, maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 8px" }}>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 23, color: "var(--ink)" }}>What are you going for?</div>
            <div style={{ fontSize: 13, color: "var(--muted-2)", marginTop: 4, lineHeight: 1.45, maxWidth: 440 }}>
              A starting point, or tune your own. Flags and suggestions are checked against this aim.
            </div>
          </div>
          <button onClick={m.closeIntentModal} className="swapbtn" style={closeX}>&times;</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "8px 22px 14px" }}>
          {INTENTS.map((ic) => {
            const activeCard = !isCustom && ic.id === state.intentId;
            return (
              <button key={ic.id} onClick={() => m.pickIntent(ic.id)} style={cardStyle(activeCard)}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink)" }}>{ic.label}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", whiteSpace: "nowrap" }}>{activeCard ? "● in play" : ""}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "#6f655a" }}>{ic.blurb}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".5px", color: "var(--muted-2)", textTransform: "uppercase", marginTop: 2 }}>leans &middot; {ic.emphasis}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom aim — tune the target on each taste axis directly. */}
        <div style={{ padding: "4px 22px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--faint)" }}>
              Or tune your own aim
            </span>
            {isCustom && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)" }}>&#9679; custom in play</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 26px", marginTop: 12 }}>
            {RADAR_ORDER.map((k) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "50px 1fr 26px", gap: 9, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".8px", color: "var(--muted)" }}>{AXIS_SHORT[k]}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={aim[k] ?? 0}
                  onChange={(e) => m.setCustomAxis(k, parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#b5481f", cursor: "pointer", height: 14 }}
                />
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "#a99a85", textAlign: "right" }}>{Math.round((aim[k] ?? 0) * 100)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

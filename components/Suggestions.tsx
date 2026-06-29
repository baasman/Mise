"use client";
// RIGHT zone — suggestions. Flavor-driven, explained, risk-rated. Ranking is
// deterministic (engine); the one-line "why" may be replaced by a Claude-written
// version passed in via whyOverrides, falling back to the local buildWhy string.
import { getSuggestions, riskDialLabel } from "@/lib/engine";
import { REACHES } from "@/lib/domain";
import type { Mise } from "./useMise";

export function Suggestions({ m, whyOverrides }: { m: Mise; whyOverrides?: Record<string, string> }) {
  const { state, byId, pantry } = m;
  const activeReach = m.reach();
  const suggestions = getSuggestions({
    committed: state.committed,
    byId,
    pool: pantry,
    intent: m.intent(),
    risk: state.risk,
    suggestionCount: state.suggestionCount,
    activeCompName: m.activeCompName(),
    form: m.form(),
    reach: activeReach,
  });

  return (
    <aside style={{ borderLeft: "1px solid var(--line)", background: "var(--rail)", padding: "22px 22px 32px", overflow: "auto" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--faint)" }}>
        Suggestions
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--muted)", marginTop: 6 }}>
        {activeReach
          ? `Steering toward ${activeReach.label.toLowerCase()} — tap the chip again to release.`
          : "Ideas for what the board’s low on — each with a reason."}
      </div>

      {/* "Reaching for…" — point the suggestions at a move you have in mind. */}
      <div style={{ margin: "14px 0 0" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1.6px", textTransform: "uppercase", color: "var(--faint)", marginBottom: 8 }}>
          Reaching for
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {REACHES.map((r) => {
            const active = state.reachId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => m.setReach(r.id)}
                className="swapbtn"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  letterSpacing: ".4px",
                  padding: "5px 11px",
                  borderRadius: 999,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  border: active ? "1px solid var(--accent)" : "1px solid var(--line)",
                  background: active ? "var(--accent)" : "var(--card)",
                  color: active ? "#fff" : "var(--muted)",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--line-soft)", borderRadius: 10, padding: "14px 16px", margin: "16px 0 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "1.6px", textTransform: "uppercase", color: "var(--faint)" }}>Risk</span>
          <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 16, color: "var(--accent)" }}>{riskDialLabel(state.risk)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.risk}
          onChange={(e) => m.setRisk(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#b5481f", cursor: "pointer", margin: "2px 0" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".5px", color: "#a99a85", marginTop: 2 }}>
          <span>play it safe</span>
          <span>push it</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {suggestions.map((s) => (
          <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--line-soft)", borderRadius: 10, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 16.5, color: "var(--ink)", lineHeight: 1.15 }}>{s.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".5px", textTransform: "uppercase", color: s.riskColor, whiteSpace: "nowrap" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: s.riskColor }} />
                {s.riskText}
              </span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".5px", color: "var(--muted-2)", textTransform: "uppercase" }}>
              would play &middot; {s.roleFill}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#6f655a" }}>{whyOverrides?.[s.id] ?? s.why}</div>
            <button
              onClick={() => m.addIngredient(s.id, "supporting")}
              className="applybtn"
              style={{ marginTop: 3, alignSelf: "flex-start", background: "var(--ink)", color: "#f3ece1", border: "none", borderRadius: 7, padding: "7px 15px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
            >
              Add to {s.targetLabel}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 16, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", color: "#a99a85" }}>
        <button
          onClick={() => m.setSuggestionCount(Math.max(3, state.suggestionCount - 4))}
          disabled={state.suggestionCount <= 3}
          className="ht"
          style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit", textTransform: "inherit", color: "var(--muted-2)", cursor: state.suggestionCount <= 3 ? "default" : "pointer", padding: 0, opacity: state.suggestionCount <= 3 ? 0.4 : 1 }}
        >
          &minus; fewer
        </button>
        <span>{suggestions.length} shown</span>
        <button
          onClick={() => m.setSuggestionCount(Math.min(24, state.suggestionCount + 4))}
          disabled={state.suggestionCount >= 24}
          className="ht"
          style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit", textTransform: "inherit", color: "var(--muted-2)", cursor: state.suggestionCount >= 24 ? "default" : "pointer", padding: 0, opacity: state.suggestionCount >= 24 ? 0.4 : 1 }}
        >
          more +
        </button>
      </div>
    </aside>
  );
}

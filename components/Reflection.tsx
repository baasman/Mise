"use client";
// LEFT zone — "the reflection": radar, axis legend, pooled aroma summary.
import { RADAR_ORDER, AXIS_SHORT } from "@/lib/domain";
import { axisDisplay, boardAromaWeights, contrastCues } from "@/lib/engine";
import { Radar } from "./Radar";
import type { Mise } from "./useMise";

export function Reflection({ m }: { m: Mise }) {
  const { state, byId } = m;
  const disp = axisDisplay(state.committed, byId);
  const intent = m.intent();
  const legend = RADAR_ORDER.map((k) => ({
    label: AXIS_SHORT[k],
    pct: Math.round(disp[k] * 100),
  }));

  const tally = boardAromaWeights(state.committed, byId);
  const aromaSummary = Array.from(tally.keys())
    .sort((a, b) => (tally.get(b) ?? 0) - (tally.get(a) ?? 0))
    .slice(0, 7);
  const hasAroma = state.committed.length > 0;

  // Texture & contrast (P1) — pooled from the board, a reflection not a rule.
  const hasBoard = state.committed.length > 0;
  const texturesPresent = Array.from(
    new Set(state.committed.map((c) => m.rowTextureOf(c)).filter((t) => t !== "neutral")),
  );
  const tempsPresent = Array.from(new Set(state.committed.map((c) => m.rowTemperatureOf(c))));
  const cues = contrastCues(state.committed, byId);

  const labelKicker = { fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--faint)" };

  return (
    <aside style={{ borderRight: "1px solid var(--line)", background: "var(--rail)", padding: "22px 22px 32px", overflow: "auto" }}>
      <div style={labelKicker}>The reflection</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--muted)", marginTop: 6 }}>
        The shape of what&rsquo;s on the board, read against your intent.
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 8px" }}>
        <Radar disp={disp} intent={intent} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 18, fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".5px", color: "#a99a85" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 15, borderTop: "2px solid var(--accent)" }} />
          the dish
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 15, borderTop: "2px dashed var(--gold)" }} />
          your intent
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {legend.map((ax) => (
          <div key={ax.label} style={{ display: "grid", gridTemplateColumns: "52px 1fr 26px", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "1px", color: "var(--muted)" }}>{ax.label}</span>
            <div style={{ height: 5, background: "#e6dcc9", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: "var(--accent)", width: `${ax.pct}%` }} />
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "#a99a85", textAlign: "right" }}>{ax.pct}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--line)", margin: "20px 0 16px" }} />
      <div style={labelKicker}>On the nose</div>
      <div style={{ fontSize: 12, lineHeight: 1.45, color: "#9a8c77", marginTop: 5 }}>
        Aroma notes from each ingredient, pooled.
      </div>
      {hasAroma ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {aromaSummary.map((tag) => (
            <span key={tag} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#7c6f5c", background: "#f0e8da", border: "1px solid var(--line)", borderRadius: 5, padding: "3px 8px" }}>
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--muted-2)", marginTop: 10 }}>No notes yet.</div>
      )}

      <div style={{ height: 1, background: "var(--line)", margin: "20px 0 16px" }} />
      <div style={labelKicker}>Texture &amp; contrast</div>
      <div style={{ fontSize: 12, lineHeight: 1.45, color: "#9a8c77", marginTop: 5 }}>
        The other half of a dish &mdash; crunch, softness, something cool.
      </div>
      {hasBoard ? (
        <>
          {texturesPresent.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {texturesPresent.map((t) => (
                <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#7c6f5c", background: "#f0e8da", border: "1px solid var(--line)", borderRadius: 5, padding: "3px 8px" }}>
                  {t}
                </span>
              ))}
            </div>
          )}
          <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".5px", color: "#a99a85", marginTop: 9 }}>
            served &middot; {tempsPresent.join(" · ")}
          </div>
          {cues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
              {cues.map((cue) => (
                <div key={cue} style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--muted-2)" }}>
                  {cue}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--muted-2)", marginTop: 10 }}>Nothing on the board yet.</div>
      )}
    </aside>
  );
}

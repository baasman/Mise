"use client";
// CENTER zone — "the board": the dish is the hero. Form kicker, editable title,
// dismissible intent flags, grouped components, form ghost-scaffolds, and the
// overall method. The empty board states the anti-slop manifesto.
import { axisDisplay, buildFlags, buildIntrinsicFlags } from "@/lib/engine";
import { ComponentCard } from "./ComponentCard";
import type { Mise } from "./useMise";

export function Board({ m }: { m: Mise }) {
  const { state, byId } = m;
  const form = m.form();
  const intent = m.intent();
  const disp = axisDisplay(state.committed, byId);
  const n = state.committed.length;
  const boardEmpty = n === 0;
  // Intent observations (vs. your aim) + intrinsic-balance observations (tensions
  // a cook would notice regardless of aim). Both dismissible; capped together.
  const flags = [
    ...buildFlags(disp, intent, state.dismissed),
    ...buildIntrinsicFlags(disp, state.dismissed, n),
  ].slice(0, 3);

  const ghosts = form
    ? form.typicalComponents.filter(
        (tc) => !state.components.some((c) => (c.name || "").trim().toLowerCase() === tc.toLowerCase()),
      )
    : [];

  return (
    <section style={{ padding: "26px 32px 64px", overflow: "auto", background: "var(--canvas)" }}>
      <button onClick={m.openFormModal} className="hd" style={{ display: "flex", width: "fit-content", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, marginBottom: 4, cursor: "pointer" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--accent)" }}>
          {form ? form.kicker : "CHOOSE A DIRECTION"}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "#bcae98" }}>
          {form ? "· change" : "· set"}
        </span>
      </button>

      <input
        value={state.dishName}
        onChange={(e) => m.setDishName(e.target.value)}
        placeholder="Name your dish"
        style={{ border: "none", background: "transparent", fontFamily: "var(--serif)", fontSize: 31, fontWeight: 600, color: "var(--ink)", width: "100%", padding: 0 }}
      />
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".5px", color: "var(--muted-2)", marginTop: 5 }}>
        {n} ingredient{n === 1 ? "" : "s"} &middot; reflecting live
      </div>

      {boardEmpty && (
        <div style={{ marginTop: 20, border: "1px solid #e7ddca", background: "#faf4ea", borderRadius: 12, padding: "20px 22px", maxWidth: 560 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 21, fontWeight: 500, lineHeight: 1.32, color: "var(--ink)" }}>
            There&rsquo;s no &ldquo;generate&rdquo; button here &mdash; and there never will be.
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#7c6f5c", marginTop: 9, maxWidth: 500 }}>
            Add one ingredient to begin. The board reflects what you build, and offers ideas you&rsquo;re always free to ignore. You make every call &mdash; this just keeps you company.
          </div>
        </div>
      )}

      {flags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "22px 0 4px" }}>
          {flags.map((flag) => {
            const intrinsic = flag.kind === "intrinsic";
            const accent = intrinsic ? "var(--accent)" : "var(--gold)";
            return (
              <div key={flag.id} style={{ background: "#f8eede", border: "1px solid #ecd6b8", borderLeft: `3px solid ${accent}`, borderRadius: 8, padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: "1.6px", textTransform: "uppercase", color: accent }}>
                    {intrinsic ? "Balance" : "Intent"}
                  </span>
                  <button onClick={() => m.dismissFlag(flag.id)} className="ht" style={{ background: "transparent", border: "none", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", cursor: "pointer", padding: 0 }}>
                    dismiss
                  </button>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "#5c5246" }}>{flag.text}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 4 }}>
        {state.components.map((cp) => (
          <ComponentCard key={cp.id} m={m} cp={cp} />
        ))}

        <div style={{ marginTop: 18, padding: "0 14px" }}>
          {ghosts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--faint)" }}>
                {form ? form.label + " usually has" : ""}
              </span>
              {ghosts.map((g) => (
                <button key={g} onClick={() => m.addComponentNamed(g)} className="ghost" style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px dashed #cdbfa6", borderRadius: 999, padding: "5px 13px", cursor: "pointer", color: "#9a8c77", fontSize: 12.5 }}>
                  <span>{g}</span>
                  <span style={{ color: "var(--accent)", fontSize: 14, lineHeight: 1 }}>+</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={m.addComponent} className="ht" style={{ display: "flex", alignItems: "center", gap: 8, width: "fit-content", background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 0" }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> add a component
          </button>
        </div>

        {state.components.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5, border: "1px dashed #d6c9b0", borderRadius: 12 }}>
            No components yet.
            <br />
            Add one to start building the dish.
          </div>
        )}

        <div style={{ marginTop: 28, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--faint)", marginBottom: 3 }}>How it comes together</div>
          <div style={{ fontSize: 12.5, color: "var(--muted-2)", marginBottom: 10 }}>The order of operations, the timing, the plating.</div>
          <textarea
            value={state.method}
            onChange={(e) => m.setMethod(e.target.value)}
            placeholder="Bloom the aromatics, build the sauce, finish off the heat… write it however you think."
            rows={3}
            className="method"
            style={{ width: "100%", fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.6, color: "#3f382f", background: "var(--card)", border: "1px solid var(--line-soft)", borderRadius: 10, padding: "14px 16px", resize: "vertical", minHeight: 84 }}
          />
          {!boardEmpty && (
            <button
              onClick={m.openRecipe}
              className="applybtn"
              style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, background: "var(--ink)", color: "#f3ece1", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              Write the recipe <span style={{ fontSize: 14, lineHeight: 1 }}>&rarr;</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";
// Scaffold-only recipe view. Two modes:
//  - Write: project the board into a recipe skeleton you author (amounts + step
//    verbs), editing the same notes/method as the board (one source of truth).
//  - Card: a clean, read-only recipe you can Print (scoped print stylesheet) or
//    Copy (markdown to clipboard). Nothing is invented — it formats your work.
import { useState } from "react";
import { ROLE_LABEL } from "@/lib/domain";
import type { Mise } from "../useMise";
import { overlay, panel, closeX } from "./shared";

export function RecipeModal({ m }: { m: Mise }) {
  const [mode, setMode] = useState<"write" | "card">("write");
  const [copied, setCopied] = useState(false);
  const { state, byId } = m;
  if (!state.recipeOpen) return null;

  const form = m.form();
  const intent = m.intent();
  const comps = state.components;
  const title = (state.dishName || "").trim() || "Untitled dish";
  const subtitle = `Serves ${state.servings} · ${form ? form.label : "No direction"} · ${intent.label}`;

  const compRows = (compId: string) => state.committed.filter((r) => r.componentId === compId);

  const steps = comps.map((c, i) => ({
    n: i + 1,
    label: (c.name || "").trim() || `Part ${i + 1}`,
    value: c.notes || "",
    onChange: (v: string) => m.setCompNote(c.id, v),
    placeholder: "What you do for this part — prep, technique, timing…",
  }));
  steps.push({
    n: comps.length + 1,
    label: "To bring it together",
    value: state.method,
    onChange: (v: string) => m.setMethod(v),
    placeholder: "The order of operations, the timing, the plating…",
  });

  const buildMarkdown = () => {
    const out: string[] = [`# ${title}`, subtitle, "", "## Ingredients"];
    comps.forEach((c) => {
      const rows = compRows(c.id);
      if (!rows.length) return;
      if ((c.name || "").trim() && comps.length > 1) out.push(`\n*${c.name}*`);
      rows.forEach((r) => {
        const ing = byId(r.ingredientId);
        const amt = (r.amount || "").trim();
        out.push(`- ${amt ? amt + " " : ""}${ing ? ing.name : "—"}`);
      });
    });
    out.push("", "## Method");
    let n = 1;
    steps.forEach((s) => {
      if ((s.value || "").trim()) out.push(`${n++}. **${s.label}** — ${s.value.trim()}`);
    });
    return out.join("\n");
  };

  const copyText = (text: string): Promise<void> => {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    // Fallback for contexts where the async Clipboard API is unavailable.
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  };

  const onCopy = () => {
    copyText(buildMarkdown())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };

  const sectionLabel: React.CSSProperties = { fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--faint)", margin: "22px 0 10px" };
  const stepArea: React.CSSProperties = { width: "100%", fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.6, color: "#3f382f", background: "var(--card)", border: "1px solid var(--line-soft)", borderRadius: 10, padding: "11px 14px", resize: "vertical", minHeight: 56, marginTop: 6 };

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: "1px solid var(--line)",
    background: active ? "var(--accent)" : "transparent", color: active ? "#fff" : "var(--muted)", fontWeight: active ? 500 : 400,
  });

  const cardSteps = steps.filter((s) => (s.value || "").trim());

  return (
    <div onClick={m.closeRecipe} style={overlay} className="recipe-overlay">
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 700, maxHeight: "90vh", overflow: "auto" }} className="recipe-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 26px 10px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMode("write")} style={toggleBtn(mode === "write")}>Write</button>
            <button onClick={() => setMode("card")} style={toggleBtn(mode === "card")}>Card</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mode === "card" && (
              <>
                <button onClick={onCopy} className="swapbtn" style={actionBtn}>{copied ? "Copied ✓" : "Copy"}</button>
                <button onClick={() => window.print()} className="swapbtn" style={actionBtn}>Print</button>
              </>
            )}
            <button onClick={m.closeRecipe} className="swapbtn" style={closeX}>&times;</button>
          </div>
        </div>

        {mode === "write" ? (
          <div style={{ padding: "0 26px 26px" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 27, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)" }}>Serves</span>
              <button onClick={() => m.setServings(state.servings - 1)} className="swapbtn" style={stepBtn}>&minus;</button>
              <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)", minWidth: 18, textAlign: "center" }}>{state.servings}</span>
              <button onClick={() => m.setServings(state.servings + 1)} className="swapbtn" style={stepBtn}>+</button>
              <span style={{ fontSize: 12, color: "var(--muted-2)" }}>— amounts are yours to write, for this many.</span>
            </div>

            <div style={sectionLabel}>Ingredients</div>
            {comps.map((c) => {
              const rows = compRows(c.id);
              if (!rows.length) return null;
              return (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  {(c.name || "").trim() && comps.length > 1 && (
                    <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontStyle: "italic", color: "#6f655a", margin: "8px 0 6px" }}>{c.name}</div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {rows.map((r) => {
                      const ing = byId(r.ingredientId);
                      return (
                        <div key={r.uid} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 12, alignItems: "center" }}>
                          <input value={r.amount || ""} onChange={(e) => m.setAmount(r.uid, e.target.value)} placeholder="amount" style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "#5c5246", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 7, padding: "7px 10px" }} />
                          <span style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)" }}>{ing ? ing.name : "—"}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--faint)", whiteSpace: "nowrap" }}>{ROLE_LABEL[r.role] || r.role} &middot; {r.magnitude}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {state.committed.length === 0 && <div style={{ fontSize: 13, color: "var(--muted-2)" }}>Nothing on the board yet — build a dish first.</div>}

            <div style={sectionLabel}>Method</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {steps.map((s) => (
                <div key={s.n} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 12 }}>
                  <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--accent)", lineHeight: 1.4 }}>{s.n}</span>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)" }}>{s.label}</div>
                    <textarea value={s.value} onChange={(e) => s.onChange(e.target.value)} placeholder={s.placeholder} rows={2} className="method" style={stepArea} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ---- Card (read-only, printable) ---- */
          <div id="recipe-print" style={{ padding: "0 30px 30px" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 600, color: "var(--ink)", lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--muted-2)", marginTop: 8 }}>{subtitle}</div>

            <div style={sectionLabel}>Ingredients</div>
            {comps.map((c) => {
              const rows = compRows(c.id);
              if (!rows.length) return null;
              return (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  {(c.name || "").trim() && comps.length > 1 && (
                    <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontStyle: "italic", color: "#6f655a", margin: "8px 0 4px" }}>{c.name}</div>
                  )}
                  {rows.map((r) => {
                    const ing = byId(r.ingredientId);
                    const amt = (r.amount || "").trim();
                    return (
                      <div key={r.uid} style={{ display: "flex", gap: 10, fontSize: 15, lineHeight: 1.7, color: "var(--ink)" }}>
                        {amt && <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "#7c6f5c", minWidth: 86 }}>{amt}</span>}
                        <span style={{ fontFamily: "var(--serif)" }}>{ing ? ing.name : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div style={sectionLabel}>Method</div>
            {cardSteps.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted-2)" }}>No method written yet — switch to Write to add the steps.</div>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {cardSteps.map((s, i) => (
                  <li key={s.n} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 12 }}>
                    <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--accent)" }}>{i + 1}</span>
                    <div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)" }}>{s.label}</span>
                      <div style={{ fontSize: 15, lineHeight: 1.6, color: "#3f382f", marginTop: 2, whiteSpace: "pre-wrap" }}>{s.value.trim()}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const stepBtn: React.CSSProperties = { width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", background: "#f6efe2", borderRadius: 7, color: "#8a7d6a", fontSize: 15, lineHeight: 1, cursor: "pointer" };
const actionBtn: React.CSSProperties = { fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#5c5246", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" };

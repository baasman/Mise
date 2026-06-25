"use client";
import { FORMS, ROLE_LABEL } from "@/lib/domain";
import type { Mise } from "../useMise";
import { overlay, panel, closeX, cardStyle } from "./shared";

export function FormModal({ m }: { m: Mise }) {
  const { state } = m;
  if (!state.formModalOpen) return null;
  const form = m.form();
  return (
    <div onClick={m.closeFormModal} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 660, maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 8px" }}>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 23, color: "var(--ink)" }}>What are you making?</div>
            <div style={{ fontSize: 13, color: "var(--muted-2)", marginTop: 4, lineHeight: 1.45, maxWidth: 470 }}>
              The shape of the dish — it only frames which roles a thing like this usually leans on. Nothing&rsquo;s required; ignore it whenever it&rsquo;s wrong.
            </div>
          </div>
          <button onClick={m.closeFormModal} className="swapbtn" style={closeX}>&times;</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "8px 22px 14px" }}>
          {FORMS.map((fc) => {
            const activeCard = !!(form && fc.id === form.id);
            return (
              <button key={fc.id} onClick={() => m.pickForm(fc.id)} style={cardStyle(activeCard)}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink)" }}>{fc.label}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", whiteSpace: "nowrap" }}>{activeCard ? "● in play" : ""}</span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "#6f655a" }}>{fc.blurb}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 1 }}>
                    {fc.leanRoles.map((r) => (
                      <span key={r} style={{ fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: ".6px", color: "#9a8c77", background: "#f0e8da", border: "1px solid var(--line)", borderRadius: 4, padding: "2px 6px" }}>
                        {(ROLE_LABEL[r] || r).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "4px 22px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input
              value={state.customFormDraft}
              onChange={(e) => m.setCustomFormDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") m.setCustomForm();
              }}
              placeholder="…or describe your own direction"
              className="hb"
              style={{ flex: 1, fontSize: 14, padding: "10px 13px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--card)", color: "var(--ink)" }}
            />
            <button onClick={m.setCustomForm} className="applybtn" style={{ flex: "0 0 auto", background: "var(--ink)", color: "#f3ece1", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Set
            </button>
          </div>
          <button onClick={m.clearForm} className="ht" style={{ background: "transparent", border: "none", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", cursor: "pointer", padding: "6px 0" }}>
            Keep it open &middot; no particular direction
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { FORMS, INTENTS } from "@/lib/domain";
import type { Mise } from "../useMise";
import { overlay, panel, closeX } from "./shared";

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mn = Math.floor(diff / 60000);
  if (mn < 1) return "just now";
  if (mn < 60) return mn + "m ago";
  const h = Math.floor(mn / 60);
  if (h < 24) return h + "h ago";
  const dy = Math.floor(h / 24);
  if (dy < 7) return dy + "d ago";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LibraryModal({ m }: { m: Mise }) {
  const { state } = m;
  if (!state.libraryOpen) return null;

  return (
    <div onClick={m.closeLibrary} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 560, maxHeight: "84vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 12px" }}>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 23, color: "var(--ink)" }}>Saved dishes</div>
            <div style={{ fontSize: 13, color: "var(--muted-2)", marginTop: 4, lineHeight: 1.45 }}>Snapshots of combinations you&rsquo;ve built. Open one to pick up where you left off.</div>
          </div>
          <button onClick={m.closeLibrary} className="swapbtn" style={closeX}>&times;</button>
        </div>
        <div style={{ overflow: "auto", padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {state.saved.map((d) => {
            const ni = (d.committed || []).length;
            const intentLbl =
              d.intentId === "custom" ? "Custom" : INTENTS.find((i) => i.id === d.intentId)?.label || "No intent";
            const formLbl =
              d.formId === "custom"
                ? d.customForm?.label || "Custom"
                : FORMS.find((f) => f.id === d.formId)?.label || "Open";
            const meta = `${ni}${ni === 1 ? " ingredient" : " ingredients"}  ·  ${intentLbl}  ·  ${formLbl}  ·  ${relTime(d.savedAt)}`;
            return (
              <div key={d.id} className="rowcard" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--card)", border: "1px solid var(--line-soft)", borderRadius: 10, padding: "13px 15px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink)", lineHeight: 1.2 }}>{d.name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".4px", color: "#9a8c77", marginTop: 4 }}>{meta}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flex: "0 0 auto" }}>
                  <button onClick={() => m.loadSaved(d.id)} className="applybtn" style={{ background: "var(--ink)", color: "#f3ece1", border: "none", borderRadius: 7, padding: "7px 15px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                    Open
                  </button>
                  <button onClick={() => m.deleteSaved(d.id)} title="Delete" className="swapbtn" style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", background: "#f6efe2", borderRadius: 7, color: "#8a7d6a", fontSize: 16, lineHeight: 1, cursor: "pointer" }}>
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
          {state.saved.length === 0 && (
            <div style={{ textAlign: "center", padding: "34px 20px", color: "var(--muted-2)", fontSize: 13.5, lineHeight: 1.5 }}>
              No saved dishes yet.
              <br />
              Build something, then hit <span style={{ color: "var(--accent)" }}>&#9733; Save</span> up top.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";
import type { Mise } from "../useMise";
import { overlay, panel, closeX, modalTitle, modalSub } from "./shared";

export function Picker({ m, onAddCustom }: { m: Mise; onAddCustom: (name: string) => void }) {
  const { state, pantry } = m;
  // Focus the search box as soon as the picker opens, so you can type immediately.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.pickerOpen) inputRef.current?.focus();
  }, [state.pickerOpen]);
  if (!state.pickerOpen) return null;

  const isSwap = state.pickerMode === "swap";
  const committedIds = state.committed.map((c) => c.ingredientId);
  const swapRow = isSwap ? state.committed.find((c) => c.uid === state.swapUid) : null;
  const swapCurrent = swapRow ? swapRow.ingredientId : null;
  const q = state.search.trim().toLowerCase();

  const items = pantry
    .filter((p) => {
      if (p.id === swapCurrent) return false;
      if (!isSwap && committedIds.includes(p.id)) return false;
      if (q && !(p.name.toLowerCase().includes(q) || p.aromas.join(" ").includes(q) || p.roles.join(" ").includes(q))) return false;
      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      meta: p.roles.join(" / ") + "   ·   " + p.aromas.join(", "),
      action: isSwap ? "swap in" : "+ add",
    }));

  const showCustom = q.length > 0 && !isSwap;
  const noResults = items.length === 0 && !showCustom;

  return (
    <div onClick={m.closePicker} style={{ ...overlay }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...panel, maxWidth: 540, maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 20px 12px" }}>
          <div>
            <div style={modalTitle}>{isSwap ? "Swap in…" : "Add an ingredient"}</div>
            <div style={modalSub}>{isSwap ? "Replace this ingredient, keeping its amount." : `Adding to “${m.activeCompName()}”. You choose — nothing is automatic.`}</div>
          </div>
          <button onClick={m.closePicker} className="swapbtn" style={closeX}>&times;</button>
        </div>
        <div style={{ padding: "0 20px 12px" }}>
          <input
            ref={inputRef}
            autoFocus
            value={state.search}
            onChange={(e) => m.setSearch(e.target.value)}
            placeholder="Search the pantry by name, role or aroma…"
            style={{ width: "100%", fontSize: 14, padding: "10px 13px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--card)", color: "var(--ink)" }}
          />
        </div>
        <div style={{ overflow: "auto", padding: "0 12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it) => (
            <button key={it.id} onClick={() => m.pick(it.id)} className="hb" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", background: "var(--card)", border: "1px solid var(--line-soft)", borderRadius: 9, padding: "11px 14px", cursor: "pointer" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)" }}>{it.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "#9a8c77", marginTop: 3, letterSpacing: ".4px" }}>{it.meta}</div>
              </div>
              <span style={{ flex: "0 0 auto", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--accent)", fontWeight: 500 }}>{it.action}</span>
            </button>
          ))}
          {showCustom && (
            <button onClick={() => onAddCustom(state.search.trim())} className="hb" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", background: "#fbf1ea", border: "1px dashed #d8a98c", borderRadius: 9, padding: "11px 14px", cursor: "pointer", marginTop: 2 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)" }}>Add your own — &ldquo;{state.search.trim()}&rdquo;</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--muted-2)", marginTop: 3, letterSpacing: ".4px" }}>not in the pantry &middot; we&rsquo;ll estimate a profile you can correct</div>
              </div>
              <span style={{ flex: "0 0 auto", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--accent)", fontWeight: 500 }}>+ add</span>
            </button>
          )}
          {noResults && <div style={{ textAlign: "center", padding: 28, color: "var(--muted-2)", fontSize: 13.5 }}>Type any ingredient above to add your own.</div>}
        </div>
      </div>
    </div>
  );
}

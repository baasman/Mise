"use client";
import { useRef } from "react";
import type { Component } from "@/lib/types";
import { IngredientRow } from "./IngredientRow";
import type { Mise } from "./useMise";

function dragSide(e: React.DragEvent): "before" | "after" {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientY - r.top < r.height / 2 ? "before" : "after";
}

export function ComponentCard({ m, cp }: { m: Mise; cp: Component }) {
  const { state } = m;
  const rows = state.committed.filter((c) => c.componentId === cp.id);
  const multi = state.components.length > 1;
  const active = cp.id === state.activeComp && multi;
  const compEl = useRef<HTMLDivElement>(null);

  const compBefore = state.overKey === "comp:" + cp.id + ":before";
  const compAfter = state.overKey === "comp:" + cp.id + ":after";
  const compBody = state.overKey === "compbody:" + cp.id;
  const dragging = state.dragKind === "comp" && state.dragId === cp.id;

  const ws: React.CSSProperties = {
    borderRadius: 12,
    padding: "2px 14px 14px",
    background: active ? "#f3ebdb" : "transparent",
    border: active ? "1px solid #e7ddca" : "1px solid transparent",
    transition: "box-shadow .08s, opacity .12s",
  };
  if (compBody) {
    ws.border = "1px dashed #b5481f";
    ws.background = "#fbf1ea";
  }
  if (compBefore) ws.boxShadow = "0 -4px 0 -1px #b5481f";
  if (compAfter) ws.boxShadow = "0 4px 0 -1px #b5481f";
  if (dragging) ws.opacity = 0.4;

  return (
    <div
      ref={compEl}
      onDragOver={(e) => {
        if (!state.dragKind) return;
        e.preventDefault();
        const key = state.dragKind === "comp" ? "comp:" + cp.id + ":" + dragSide(e) : "compbody:" + cp.id;
        if (state.overKey !== key) m.setOverKey(key);
      }}
      onDrop={(e) => {
        if (state.dragKind === "comp") {
          e.preventDefault();
          m.reorderComp(state.dragId as string, cp.id, dragSide(e));
          m.endDrag();
        } else if (state.dragKind === "ing") {
          e.preventDefault();
          m.appendIngToComp(state.dragId as number, cp.id);
          m.endDrag();
        }
      }}
      style={ws}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "12px 0 11px" }}>
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            try {
              e.dataTransfer.setData("text/plain", cp.id);
            } catch {}
            if (compEl.current) {
              try {
                e.dataTransfer.setDragImage(compEl.current, 28, 20);
              } catch {}
            }
            m.beginDrag("comp", cp.id, null);
          }}
          onDragEnd={m.endDrag}
          title="Drag to reorder this component"
          className="grip"
          style={{ color: "#c3b59c", fontSize: 15, lineHeight: 1, letterSpacing: "-2px", padding: "2px 1px" }}
        >
          &#10303;&#10303;
        </span>
        <label className="hb" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderBottom: "1px dashed #d8ccb6", paddingBottom: 2 }}>
          <input
            value={cp.name}
            size={Math.max(8, (cp.name || "").length + 1)}
            autoFocus={!(cp.name || "").trim()}
            onChange={(e) => m.renameComponent(cp.id, e.target.value)}
            placeholder="Name this part…"
            style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink)", border: "none", background: "transparent", padding: 0 }}
          />
          <span style={{ fontSize: 11, color: "#c3b59c", lineHeight: 1 }}>&#9998;</span>
        </label>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".5px", color: "var(--faint)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {rows.length === 0 ? "empty" : rows.length + (rows.length === 1 ? " ingredient" : " ingredients")}
        </span>
        <span style={{ flex: 1, height: 1, background: "#e0d6c4" }} />
        {active && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", whiteSpace: "nowrap" }}>
            &#9679; suggestions land here
          </span>
        )}
        {multi && cp.id !== state.activeComp && (
          <button onClick={() => m.setActive(cp.id)} className="swapbtn" style={{ background: "transparent", border: "1px solid #e0d6c4", borderRadius: 999, fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", cursor: "pointer", padding: "3px 9px", whiteSpace: "nowrap" }}>
            aim here
          </button>
        )}
        <button onClick={() => m.removeComponent(cp.id)} title="Remove component" className="ht" style={{ background: "transparent", border: "none", fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase", color: "#bcae98", cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
          remove
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {rows.map((c) => (
          <IngredientRow key={c.uid} m={m} c={c} />
        ))}
      </div>

      {rows.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--muted-2)", padding: "8px 2px 2px" }}>Nothing here yet — add one, or drag an ingredient in.</div>
      )}

      <button onClick={() => m.openAdd(cp.id)} className="addbtn" style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, width: "fit-content", background: "transparent", border: "1px dashed #d3c6ad", borderRadius: 8, padding: "8px 13px", cursor: "pointer", color: "#9a7a44", fontSize: 13 }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> add an ingredient
      </button>

      <div style={{ marginTop: 11, display: "flex", alignItems: "flex-start", gap: 9, borderTop: "1px dashed #e0d6c4", paddingTop: 11 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: "1.4px", textTransform: "uppercase", color: "#bcae98", paddingTop: 5, whiteSpace: "nowrap" }}>Note</span>
        <textarea
          value={cp.notes || ""}
          onChange={(e) => m.setCompNote(cp.id, e.target.value)}
          placeholder="prep, technique, timing for this part…"
          rows={1}
          style={{ flex: 1, fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.5, color: "#5c5246", background: "transparent", border: "none", resize: "vertical", minHeight: 22, padding: "2px 0" }}
        />
      </div>
    </div>
  );
}

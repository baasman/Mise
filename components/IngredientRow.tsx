"use client";
import { useRef } from "react";
import {
  RADAR_ORDER,
  ROLES,
  ROLE_LABEL,
  AXIS_SHORT,
  TEMPERATURES,
  TEXTURES,
  type Magnitude,
  type Role,
  type Temperature,
  type Texture,
} from "@/lib/domain";
import { rowReflected } from "@/lib/engine";
import type { CommittedRow } from "@/lib/types";
import type { Mise } from "./useMise";

const MAGS: Magnitude[] = ["trace", "supporting", "dominant"];

function provenanceOf(m: Mise, c: CommittedRow): "your read" | "estimating" | "unprofiled" | "estimate" {
  if (c.axes != null) return "your read";
  const ing = m.byId(c.ingredientId);
  if (ing?.estimating) return "estimating";
  if (ing?.custom && ing.unprofiled) return "unprofiled";
  return "estimate";
}
function provColor(p: string) {
  if (p === "your read") return "#1f8a5b";
  if (p === "estimating") return "#9a7a44";
  if (p === "unprofiled") return "#b5481f";
  return "#a9925f";
}
function provNote(p: string) {
  if (p === "your read") return "You’ve tuned this from the starting estimate — the radar reflects your read now.";
  if (p === "estimating") return "Reading this ingredient’s flavor with Claude — its profile and aromas will fill in here in a moment, and it’ll join the radar.";
  if (p === "unprofiled") return "No flavor data for your own ingredient, so it’s not on the radar yet. Give it a read below and it will be.";
  return "A hand-made estimate for this prototype, not a measurement — a real version would draw these from a tasting panel or aroma-compound data. Nudge anything to match your own palate.";
}

function magStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    border: "none",
    borderRadius: 6,
    padding: "6px 3px",
    fontFamily: "var(--mono)",
    fontSize: 9,
    letterSpacing: ".1px",
    textTransform: "uppercase",
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "#9a8c77",
    fontWeight: active ? 500 : 400,
  };
}

function dragSide(e: React.DragEvent): "before" | "after" {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientY - r.top < r.height / 2 ? "before" : "after";
}

export function IngredientRow({ m, c }: { m: Mise; c: CommittedRow }) {
  const { state } = m;
  const ing = m.byId(c.ingredientId);
  const ax = m.rowAxesOf(c);
  const prov = provenanceOf(m, c);
  const aromas = m.rowAromasOf(c);
  const tex = m.rowTextureOf(c);
  const temp = m.rowTemperatureOf(c);
  const expanded = state.expandedRow === c.uid;
  const overridden = c.axes != null;
  const reflected = rowReflected(c, m.byId);
  const rowEl = useRef<HTMLDivElement>(null);

  const rowBefore = state.overKey === "ing:" + c.uid + ":before";
  const rowAfter = state.overKey === "ing:" + c.uid + ":after";
  const dragging = state.dragKind === "ing" && state.dragId === c.uid;

  const dropStyle: React.CSSProperties = {
    borderRadius: 10,
    boxShadow: rowBefore ? "0 -3px 0 -1px #b5481f" : rowAfter ? "0 3px 0 -1px #b5481f" : "none",
    opacity: dragging ? 0.4 : 1,
    transition: "box-shadow .08s, opacity .12s",
  };

  return (
    <div
      ref={rowEl}
      onDragOver={(e) => {
        if (state.dragKind !== "ing") return;
        e.preventDefault();
        e.stopPropagation();
        const key = "ing:" + c.uid + ":" + dragSide(e);
        if (state.overKey !== key) m.setOverKey(key);
      }}
      onDrop={(e) => {
        if (state.dragKind !== "ing") return;
        e.preventDefault();
        e.stopPropagation();
        m.reorderIng(state.dragId as number, c.uid, c.componentId, dragSide(e));
        m.endDrag();
      }}
      style={dropStyle}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "24px minmax(0,1fr) 92px 168px 60px",
          gap: 11,
          alignItems: "center",
          background: "var(--card)",
          border: "1px solid var(--line-soft)",
          borderRadius: 10,
          padding: "13px 14px",
        }}
        className="rowcard"
      >
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            try {
              e.dataTransfer.setData("text/plain", "ing-" + c.uid);
            } catch {}
            if (rowEl.current) {
              try {
                e.dataTransfer.setDragImage(rowEl.current, 28, 20);
              } catch {}
            }
            m.beginDrag("ing", c.uid, c.componentId);
          }}
          onDragEnd={m.endDrag}
          title="Drag to reorder or move between components"
          className="grip"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#cbbda4", fontSize: 13, letterSpacing: "-2px", height: "100%" }}
        >
          &#10303;&#10303;
        </span>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 17.5, color: "var(--ink)", lineHeight: 1.2 }}>{ing ? ing.name : "—"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, alignItems: "center" }}>
            <span
              onClick={() => m.toggleProfile(c.uid)}
              title="Flavor profile — where these values come from, and yours to adjust"
              className="hb"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".3px", color: provColor(prov), background: "#faf4ea", border: "1px solid var(--line-soft)", borderRadius: 4, padding: "2px 6px" }}
            >
              {prov === "estimating" && (
                <span className="mise-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: provColor(prov), display: "inline-block" }} />
              )}
              {prov === "estimating" ? "estimating…" : prov}
              {prov !== "estimating" && <span style={{ fontSize: 8, opacity: 0.7 }}>&#9662;</span>}
            </span>
            {tex !== "neutral" && (
              <span
                onClick={() => m.toggleProfile(c.uid)}
                title="Texture — yours to adjust in the profile"
                style={{ cursor: "pointer", fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".3px", color: "#9a8c77", background: "#f3ebdb", borderRadius: 4, padding: "2px 6px" }}
              >
                {tex}
              </span>
            )}
            {!reflected && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".3px", color: "#b5a48d" }}>&middot; not reflected</span>
            )}
            {aromas.map((tag, i) => (
              <span key={tag + i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".3px", color: "#9a8c77", background: "#f3ebdb", borderRadius: 4, padding: "2px 4px 2px 6px" }}>
                {tag}
                <span onClick={() => m.removeAroma(c.uid, i)} title="Remove this note" className="ht" style={{ cursor: "pointer", color: "#c3b59c", fontSize: 12, lineHeight: 1 }}>
                  &times;
                </span>
              </span>
            ))}
            <input
              value={state.aromaDrafts[c.uid] || ""}
              onChange={(e) => m.setAromaDraft(c.uid, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  m.addAroma(c.uid);
                }
              }}
              placeholder="+ note"
              title="Your own aroma note — type and press Enter"
              className="aroma-input"
              style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".3px", color: "#7c6f5c", background: "transparent", border: "1px dashed #d8ccb6", borderRadius: 4, padding: "2px 6px", width: 58 }}
            />
          </div>
        </div>

        <div>
          <select
            value={c.role}
            onChange={(e) => m.setRole(c.uid, e.target.value as Role)}
            style={{ width: "100%", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".5px", textTransform: "uppercase", color: "#5c5246", background: "#f6efe2", border: "1px solid var(--line)", borderRadius: 7, padding: "7px 6px", cursor: "pointer" }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", background: "#f1e9da", border: "1px solid var(--line)", borderRadius: 8, padding: 3, gap: 2 }}>
          {MAGS.map((mm) => (
            <button key={mm} onClick={() => m.setMag(c.uid, mm)} style={magStyle(mm === c.magnitude)}>
              {mm}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", alignItems: "center" }}>
          <button onClick={() => m.openSwap(c.uid)} title="Swap" className="swapbtn" style={iconBtn}>&#8644;</button>
          <button onClick={() => m.removeRow(c.uid)} title="Remove" className="swapbtn" style={{ ...iconBtn, fontSize: 16 }}>&times;</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 7, background: "#faf4ea", border: "1px solid var(--line-soft)", borderRadius: 10, padding: "13px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1.6px", textTransform: "uppercase", color: "var(--faint)" }}>Flavor profile</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".6px", textTransform: "uppercase", color: provColor(prov) }}>{prov}</span>
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "var(--muted-2)", margin: "5px 0 12px", maxWidth: 520 }}>{provNote(prov)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 26px" }}>
            {RADAR_ORDER.map((k) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "50px 1fr 26px", gap: 9, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".8px", color: "var(--muted)" }}>{AXIS_SHORT[k]}</span>
                <input type="range" min={0} max={1} step={0.05} value={ax[k] || 0} onChange={(e) => m.setAxis(c.uid, k, parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#b5481f", cursor: "pointer", height: 14 }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "#a99a85", textAlign: "right" }}>{Math.round((ax[k] || 0) * 100)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "1.6px", textTransform: "uppercase", color: "var(--faint)", whiteSpace: "nowrap" }}>Texture &amp; temp</span>
            <select value={tex} onChange={(e) => m.setTexture(c.uid, e.target.value as Texture)} style={profileSelect}>
              {TEXTURES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={temp} onChange={(e) => m.setTemperature(c.uid, e.target.value as Temperature)} style={profileSelect}>
              {TEMPERATURES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {overridden && (
            <button onClick={() => m.resetProfile(c.uid)} className="ht" style={{ marginTop: 12, background: "transparent", border: "none", fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", cursor: "pointer", padding: 0 }}>
              &#8634; reset to estimate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid var(--line)",
  background: "#f6efe2",
  borderRadius: 7,
  color: "#8a7d6a",
  fontSize: 14,
  lineHeight: 1,
  cursor: "pointer",
  flex: "0 0 auto",
};

const profileSelect: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 10,
  letterSpacing: ".5px",
  textTransform: "uppercase",
  color: "#5c5246",
  background: "#f6efe2",
  border: "1px solid var(--line)",
  borderRadius: 7,
  padding: "6px 8px",
  cursor: "pointer",
};

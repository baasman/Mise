"use client";
// Crisp thin-line 7-axis radar — port of renderRadar(). Reflects the dish's
// shape (the terracotta polygon) against a dashed "your intent" overlay (gold).
import { RADAR_ORDER, AXIS_SHORT, type AxisMap, type Intent } from "@/lib/domain";

const CX = 132;
const CY = 126;
const R = 86;
const N = RADAR_ORDER.length;

const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
const pt = (i: number, r: number): [number, number] => [
  CX + Math.cos(ang(i)) * r,
  CY + Math.sin(ang(i)) * r,
];
const poly = (vals: AxisMap, scale: number) =>
  RADAR_ORDER.map((k, i) => {
    const p = pt(i, scale * (vals[k] || 0));
    return p[0].toFixed(1) + "," + p[1].toFixed(1);
  }).join(" ");

export function Radar({ disp, intent }: { disp: AxisMap; intent: Intent }) {
  const overlay = {} as AxisMap;
  (Object.keys(disp) as (keyof AxisMap)[]).forEach((k) => {
    overlay[k] = intent.targets[k] != null ? (intent.targets[k] as number) : 0.16;
  });

  return (
    <svg viewBox="0 0 264 250" width={240} height={228} style={{ display: "block", overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map((rv, idx) => {
        const points = RADAR_ORDER.map((_, i) => {
          const p = pt(i, R * rv);
          return p[0].toFixed(1) + "," + p[1].toFixed(1);
        }).join(" ");
        return (
          <polygon
            key={"ring" + idx}
            points={points}
            fill={idx === 0 ? "#fbf6ec" : "none"}
            stroke={rv === 1 ? "#d7cab3" : "#e7ddca"}
            strokeWidth={rv === 1 ? 1 : 0.8}
          />
        );
      })}
      {RADAR_ORDER.map((_, i) => {
        const p = pt(i, R);
        return <line key={"sp" + i} x1={CX} y1={CY} x2={p[0]} y2={p[1]} stroke="#e7ddca" strokeWidth={0.8} />;
      })}
      <polygon points={poly(overlay, R)} fill="none" stroke="#b58a3b" strokeWidth={1.2} strokeDasharray="3 3" />
      <polygon
        points={poly(disp, R)}
        fill="rgba(181,72,31,0.14)"
        stroke="#b5481f"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {RADAR_ORDER.map((k, i) => {
        const p = pt(i, R * (disp[k] || 0));
        return <circle key={"dot" + i} cx={p[0]} cy={p[1]} r={2.6} fill="#b5481f" />;
      })}
      {RADAR_ORDER.map((k, i) => {
        const p = pt(i, R + 17);
        let anchor: "start" | "middle" | "end" = "middle";
        if (p[0] < CX - 4) anchor = "end";
        else if (p[0] > CX + 4) anchor = "start";
        return (
          <text
            key={"lab" + i}
            x={p[0]}
            y={p[1] + 3}
            textAnchor={anchor}
            fontSize={9}
            fontFamily="IBM Plex Mono, monospace"
            fill="#8a7d6a"
            letterSpacing={0.5}
          >
            {AXIS_SHORT[k]}
          </text>
        );
      })}
    </svg>
  );
}

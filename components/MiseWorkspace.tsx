"use client";
import { useEffect, useRef, useState } from "react";
import { AXES, ZERO_AXES, type AxisMap } from "@/lib/domain";
import { axisDisplay, boardAromaWeights, desiredVec, getSuggestions } from "@/lib/engine";
import { estimateFlavor, fetchWhy } from "@/lib/api-client";
import { useMise } from "./useMise";
import { Header } from "./Header";
import { Reflection } from "./Reflection";
import { Board } from "./Board";
import { Suggestions } from "./Suggestions";
import { Picker } from "./modals/Picker";
import { IntentModal } from "./modals/IntentModal";
import { FormModal } from "./modals/FormModal";
import { LibraryModal } from "./modals/LibraryModal";
import { RecipeModal } from "./modals/RecipeModal";

export function MiseWorkspace() {
  const m = useMise();
  const { state, byId, pantry } = m;
  const [whyOverrides, setWhyOverrides] = useState<Record<string, string>>({});
  const whyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Off-pantry add: drop it on the board immediately (as "estimating"), then
  // ground it with a Claude estimate that fills the profile in place. Falls back
  // to unprofiled if the estimate fails — the row stays, just stops spinning.
  function addCustomWithEstimate(name: string) {
    const id = m.addCustomIngredient(name);
    if (!id) {
      m.closePicker();
      return;
    }
    estimateFlavor(name)
      .then((r) => m.resolveCustomIngredient(id, r))
      .catch(() => m.failCustomIngredient(id));
  }

  // Ask Claude (Haiku) to phrase the "why" for the current suggestion set.
  // Deterministic ranking already ran client-side; this only replaces the text,
  // and silently keeps the local buildWhy string when the endpoint is absent.
  useEffect(() => {
    const intent = m.intent();
    const suggestions = getSuggestions({
      committed: state.committed,
      byId,
      pool: pantry,
      intent,
      risk: state.risk,
      suggestionCount: state.suggestionCount,
      activeCompName: m.activeCompName(),
      form: m.form(),
    });
    const disp = axisDisplay(state.committed, byId);
    const desired = desiredVec(intent);
    const low = { ...ZERO_AXES } as AxisMap;
    AXES.forEach((k) => {
      low[k] = Math.max(0, desired[k] - disp[k]);
    });
    const candidates = suggestions.map((s) => {
      const ing = byId(s.id);
      return { id: s.id, name: s.name, roles: ing?.roles ?? [], shared: s.shared, contrast: s.contrast, structure: s.structure };
    });
    if (!candidates.length) {
      setWhyOverrides({});
      return;
    }
    const boardAromas = Array.from(boardAromaWeights(state.committed, byId).keys());
    if (whyTimer.current) clearTimeout(whyTimer.current);
    whyTimer.current = setTimeout(() => {
      fetchWhy({ intentLabel: intent.label, dishName: state.dishName, low, aromas: boardAromas }, candidates)
        .then(setWhyOverrides)
        .catch(() => setWhyOverrides({}));
    }, 450);
    return () => {
      if (whyTimer.current) clearTimeout(whyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.committed, state.intentId, state.risk, state.suggestionCount, state.dishName]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--sans)", color: "var(--ink)", background: "var(--canvas)" }}>
      <Header m={m} />
      <main
        style={{
          flex: "1 1 auto",
          display: "grid",
          gridTemplateColumns: "minmax(292px,318px) minmax(0,1fr) minmax(320px,354px)",
          minHeight: 0,
        }}
      >
        <Reflection m={m} />
        <Board m={m} />
        <Suggestions m={m} whyOverrides={whyOverrides} />
      </main>

      <Picker m={m} onAddCustom={addCustomWithEstimate} />
      <IntentModal m={m} />
      <FormModal m={m} />
      <LibraryModal m={m} />
      <RecipeModal m={m} />

      {state.toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "var(--ink)",
            color: "#f3ece1",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: ".4px",
            padding: "10px 18px",
            borderRadius: 999,
            boxShadow: "0 6px 22px rgba(46,42,36,.28)",
            pointerEvents: "none",
            animation: "miseToastIn .18s ease-out",
          }}
        >
          {state.toast}
        </div>
      )}
    </div>
  );
}

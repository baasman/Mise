"use client";
import { useEffect, useMemo, useState } from "react";
import { getSuggestions, intentGap } from "@/lib/engine";
import { getPairings } from "@/lib/pairings";
import { estimateFlavor, fetchWhy } from "@/lib/api-client";
import { buildWhyRequest, type WhyRequest } from "@/lib/why-request";
import { useMise } from "./useMise";
import { Header } from "./Header";
import { Reflection } from "./Reflection";
import { Board } from "./Board";
import { Suggestions } from "./Suggestions";
import { MobileTabs, type MobileTab } from "./MobileTabs";
import { Picker } from "./modals/Picker";
import { IntentModal } from "./modals/IntentModal";
import { FormModal } from "./modals/FormModal";
import { LibraryModal } from "./modals/LibraryModal";
import { RecipeModal } from "./modals/RecipeModal";

export function MiseWorkspace() {
  const m = useMise();
  const { state, byId, pantry } = m;
  const [whyOverrides, setWhyOverrides] = useState<Record<string, string>>({});
  // Phone layout: which zone the bottom tab bar shows (≤1023px; CSS-driven, so
  // this is SSR-deterministic and desktop never sees it).
  const [mtab, setMtab] = useState<MobileTab>("board");

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

  // Rank once per relevant change and share the result with the Suggestions
  // rail. byId reads custom ingredients through a ref, so they're listed as a
  // dep explicitly (an estimate resolving changes them without touching rows).
  const reach = m.reach();
  const suggestions = useMemo(
    () =>
      getSuggestions({
        committed: state.committed,
        byId,
        pool: pantry,
        intent: m.intent(),
        risk: state.risk,
        suggestionCount: state.suggestionCount,
        activeCompName: m.activeCompName(),
        form: m.form(),
        reach,
        pairings: getPairings(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.committed, state.customIngredients, byId, pantry, state.intentId, state.customIntent, state.risk,
     state.suggestionCount, state.components, state.activeComp, state.formId, state.customForm, reach],
  );

  // Ask Claude (Haiku) to phrase the "why" for the current suggestion set.
  // Deterministic ranking already ran; this only replaces the text, and silently
  // keeps the local buildWhy string when the endpoint is absent or limited.
  // When the cook is steering a "reaching for…" lens, the engine's reach-led
  // "why" is the responsive answer, so there's no request at all.
  const whyKey = useMemo(() => {
    if (reach) return "";
    const intent = m.intent();
    const req = buildWhyRequest(suggestions, state.committed, byId, intent, intentGap(state.committed, byId, intent));
    return req ? JSON.stringify(req) : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions, reach]);

  // Fetch only when the payload itself changes (not on amount/notes/name edits).
  // Each change aborts the previous request, so a slow stale reply can't land.
  useEffect(() => {
    if (!whyKey) {
      setWhyOverrides({});
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetchWhy(JSON.parse(whyKey) as WhyRequest, ctrl.signal)
        .then((w) => {
          if (!ctrl.signal.aborted) setWhyOverrides(w);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setWhyOverrides({});
        });
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [whyKey]);

  return (
    <div className="workspace" data-mtab={mtab} style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--sans)", color: "var(--ink)", background: "var(--canvas)" }}>
      <Header m={m} />
      <main
        className="workspace-main"
        style={{
          flex: "1 1 auto",
          display: "grid",
          gridTemplateColumns: "minmax(292px,318px) minmax(0,1fr) minmax(320px,354px)",
          minHeight: 0,
        }}
      >
        <Reflection m={m} />
        <Board m={m} />
        <Suggestions m={m} suggestions={suggestions} whyOverrides={whyOverrides} />
      </main>

      <MobileTabs tab={mtab} onTab={setMtab} />

      <Picker m={m} onAddCustom={addCustomWithEstimate} />
      <IntentModal m={m} />
      <FormModal m={m} />
      <LibraryModal m={m} />
      <RecipeModal m={m} />

      {state.toast && (
        <div
          role="status"
          aria-live="polite"
          className="toast"
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

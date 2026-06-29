"use client";
// Mise — the workspace state hook. A faithful port of the prototype's DCLogic
// class: same `state` shape, same actions, same drag-and-drop semantics. The
// radar / flags / suggestions are derived from this state via lib/engine.ts.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FORMS,
  INTENTS,
  PANTRY,
  ZERO_AXES,
  type AxisMap,
  type Axis,
  type Form,
  type Intent,
  type Magnitude,
  type Role,
  type Temperature,
  type Texture,
} from "@/lib/domain";
import { desiredVec, rowTemperature, rowTexture } from "@/lib/engine";
import type { Component, CommittedRow, DishSnapshot, Ingredient } from "@/lib/types";
import {
  deleteDish as apiDeleteDish,
  fetchDishes,
  fetchPantry,
  saveDish as apiSaveDish,
  type SavedDish,
} from "@/lib/api-client";

export interface MiseState {
  dishName: string;
  intentId: string;
  customIntent: AxisMap | null;
  formId: string | null;
  customForm: Form | null;
  components: Component[];
  cid: number;
  activeComp: string | null;
  committed: CommittedRow[];
  uid: number;
  risk: number;
  dismissed: string[];
  pickerOpen: boolean;
  pickerMode: "add" | "swap";
  swapUid: number | null;
  addTargetComp: string | null;
  search: string;
  intentModalOpen: boolean;
  formModalOpen: boolean;
  libraryOpen: boolean;
  customIngredients: Ingredient[];
  custId: number;
  customFormDraft: string;
  dragKind: "comp" | "ing" | null;
  dragId: number | string | null;
  dragFromComp: string | null;
  overKey: string | null;
  method: string;
  servings: number;
  recipeOpen: boolean;
  saved: SavedDish[];
  justSaved: boolean;
  aromaDrafts: Record<number, string>;
  expandedRow: number | null;
  suggestionCount: number;
  pantryLoaded: boolean;
  toast: string | null;
}

const initialState: MiseState = {
  // Blank canvas by default: empty board so the manifesto leads, one unnamed
  // component to drop the first ingredient into, no preset dish name/direction.
  dishName: "",
  intentId: "bright_sharp",
  customIntent: null,
  formId: null,
  customForm: null,
  components: [{ id: "c1", name: "", notes: "" }],
  cid: 2,
  activeComp: "c1",
  committed: [],
  uid: 1,
  risk: 0.3,
  dismissed: [],
  pickerOpen: false,
  pickerMode: "add",
  swapUid: null,
  addTargetComp: "c1",
  search: "",
  intentModalOpen: false,
  formModalOpen: false,
  libraryOpen: false,
  customIngredients: [],
  custId: 1,
  customFormDraft: "",
  dragKind: null,
  dragId: null,
  dragFromComp: null,
  overKey: null,
  method: "",
  servings: 2,
  recipeOpen: false,
  saved: [],
  justSaved: false,
  aromaDrafts: {},
  expandedRow: null,
  suggestionCount: 12,
  pantryLoaded: false,
  toast: null,
};

type Updater = Partial<MiseState> | ((s: MiseState) => Partial<MiseState>);

// Auto-saved working draft (device-local) so an in-progress dish survives a page
// refresh. Only these fields are persisted — transient UI (modals, drag, search,
// toast) is not. Bump the key if the shape changes incompatibly.
const DRAFT_KEY = "mise_draft_v1";
const DRAFT_FIELDS: (keyof MiseState)[] = [
  "dishName", "intentId", "customIntent", "formId", "customForm", "components",
  "committed", "customIngredients", "activeComp", "risk", "method", "servings",
  "cid", "uid", "custId", "dismissed", "suggestionCount",
];

function readDraft(): Partial<MiseState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const picked: Record<string, unknown> = {};
    DRAFT_FIELDS.forEach((k) => {
      if (k in parsed) picked[k] = parsed[k];
    });
    return picked as Partial<MiseState>;
  } catch {
    return null;
  }
}

export function useMise() {
  const [state, setState] = useState<MiseState>(initialState);
  const [pantry, setPantry] = useState<Ingredient[]>(PANTRY as Ingredient[]);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDraft = useRef<string>("");

  const set = useCallback((u: Updater) => {
    setState((s) => ({ ...s, ...(typeof u === "function" ? u(s) : u) }));
  }, []);

  // A quiet, self-dismissing confirmation line (e.g. after adding an ingredient).
  const flashToast = useCallback(
    (msg: string) => {
      set({ toast: msg });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => set({ toast: null }), 1800);
    },
    [set],
  );

  // Hydrate pantry + saved dishes from the backend (graceful if offline).
  useEffect(() => {
    fetchPantry()
      .then((r) => {
        if (r.pantry?.length) setPantry(r.pantry);
        if (r.custom?.length) set((s) => ({ customIngredients: [...s.customIngredients, ...r.custom] }));
        set({ pantryLoaded: true });
      })
      .catch(() => set({ pantryLoaded: true }));
    fetchDishes()
      .then((d) => set({ saved: d }))
      .catch(() => {});
  }, [set]);

  // Restore the auto-saved working draft (once, on mount) so a refresh doesn't
  // lose an in-progress dish. `hydrated` gates the persist effect below so the
  // initial blank render can't clobber the stored draft before this runs.
  useEffect(() => {
    const d = readDraft();
    if (d) {
      if (Array.isArray(d.customIngredients)) {
        d.customIngredients = d.customIngredients.map((ci) => ({ ...ci, estimating: false }));
      }
      const meaningful = (d.committed && d.committed.length) || d.dishName || d.method;
      if (meaningful) set(d);
    }
    setHydrated(true);
  }, [set]);

  // Auto-save the working draft (debounced) whenever the persisted fields change.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const draft: Record<string, unknown> = {};
    DRAFT_FIELDS.forEach((k) => (draft[k] = state[k]));
    const ser = JSON.stringify(draft);
    if (ser === lastDraft.current) return; // a transient (modal/drag/toast) change — skip
    lastDraft.current = ser;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, ser);
      } catch {
        /* quota / private mode — drafts are best-effort */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [hydrated, state]);

  const byId = useCallback(
    (id: string): Ingredient | undefined =>
      pantry.find((p) => p.id === id) || stateRef.current.customIngredients.find((p) => p.id === id),
    [pantry],
  );

  const intent = useCallback((): Intent => {
    if (state.intentId === "custom" && state.customIntent) {
      return { id: "custom", label: "Custom", blurb: "Your own aim.", emphasis: "your aim", targets: state.customIntent };
    }
    return INTENTS.find((i) => i.id === state.intentId) || INTENTS[0];
  }, [state.intentId, state.customIntent]);
  const form = useCallback((): Form | null => {
    if (state.formId === "custom") return state.customForm;
    return FORMS.find((f) => f.id === state.formId) || null;
  }, [state.formId, state.customForm]);

  const activeCompName = useCallback(() => {
    const c = state.components.find((x) => x.id === state.activeComp);
    return c ? c.name : "the dish";
  }, [state.components, state.activeComp]);

  // ---- ingredient / component mutations ----
  const addIngredient = useCallback(
    (id: string, mag: Magnitude, componentId?: string) => {
      const ing = byId(id);
      if (!ing) return;
      set((s) => {
        let components = s.components;
        let cid = s.cid;
        let target = componentId || s.activeComp || "";
        if (!components.some((c) => c.id === target)) {
          if (components.length) target = components[0].id;
          else {
            target = "c" + cid;
            components = [...components, { id: target, name: "The dish" }];
            cid = cid + 1;
          }
        }
        return {
          components,
          cid,
          committed: [
            ...s.committed,
            { uid: s.uid, ingredientId: id, magnitude: mag, role: ing.roles[0], componentId: target },
          ],
          uid: s.uid + 1,
          activeComp: target,
        };
      });
      flashToast(`Added ${ing.name}`);
    },
    [byId, set, flashToast],
  );

  const addComponentNamed = useCallback(
    (name: string) =>
      set((s) => {
        const id = "c" + s.cid;
        return { components: [...s.components, { id, name }], cid: s.cid + 1, activeComp: id };
      }),
    [set],
  );
  const addComponent = useCallback(() => addComponentNamed(""), [addComponentNamed]);
  const renameComponent = useCallback(
    (id: string, name: string) =>
      set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, name } : c)) })),
    [set],
  );
  const removeComponent = useCallback(
    (id: string) =>
      set((s) => {
        const components = s.components.filter((c) => c.id !== id);
        const committed = s.committed.filter((c) => c.componentId !== id);
        const activeComp = s.activeComp === id ? components[0]?.id ?? null : s.activeComp;
        return { components, committed, activeComp };
      }),
    [set],
  );

  // ---- drag & drop ----
  const beginDrag = useCallback(
    (kind: "comp" | "ing", id: number | string, fromComp: string | null) =>
      set({ dragKind: kind, dragId: id, dragFromComp: fromComp, overKey: null }),
    [set],
  );
  const endDrag = useCallback(() => set({ dragKind: null, dragId: null, dragFromComp: null, overKey: null }), [set]);
  const setOverKey = useCallback((key: string | null) => set({ overKey: key }), [set]);

  const reorderComp = useCallback(
    (dragId: string, targetId: string, side: "before" | "after") =>
      set((s) => {
        if (dragId === targetId) return {};
        const arr = [...s.components];
        const from = arr.findIndex((c) => c.id === dragId);
        if (from < 0) return {};
        const item = arr.splice(from, 1)[0];
        let to = arr.findIndex((c) => c.id === targetId);
        if (to < 0) arr.push(item);
        else {
          if (side === "after") to += 1;
          arr.splice(to, 0, item);
        }
        return { components: arr };
      }),
    [set],
  );
  const reorderIng = useCallback(
    (dragUid: number, targetUid: number, targetComp: string, side: "before" | "after") =>
      set((s) => {
        if (dragUid === targetUid) return {};
        const arr = s.committed.map((c) => (c.uid === dragUid ? { ...c, componentId: targetComp } : c));
        const from = arr.findIndex((c) => c.uid === dragUid);
        const item = arr.splice(from, 1)[0];
        let to = arr.findIndex((c) => c.uid === targetUid);
        if (to < 0) arr.push(item);
        else {
          if (side === "after") to += 1;
          arr.splice(to, 0, item);
        }
        return { committed: arr, activeComp: targetComp };
      }),
    [set],
  );
  const appendIngToComp = useCallback(
    (dragUid: number, compId: string) =>
      set((s) => {
        const arr = s.committed.map((c) => (c.uid === dragUid ? { ...c, componentId: compId } : c));
        const from = arr.findIndex((c) => c.uid === dragUid);
        const item = arr.splice(from, 1)[0];
        let lastIdx = -1;
        arr.forEach((c, i) => {
          if (c.componentId === compId) lastIdx = i;
        });
        arr.splice(lastIdx + 1, 0, item);
        return { committed: arr, activeComp: compId };
      }),
    [set],
  );

  // ---- picker / swap ----
  const setActive = useCallback((id: string) => set({ activeComp: id }), [set]);
  const openAdd = useCallback(
    (componentId?: string) =>
      set((s) => {
        const t = componentId || s.activeComp;
        return { pickerOpen: true, pickerMode: "add", swapUid: null, search: "", addTargetComp: t, activeComp: t };
      }),
    [set],
  );
  const openSwap = useCallback(
    (uid: number) => set({ pickerOpen: true, pickerMode: "swap", swapUid: uid, search: "" }),
    [set],
  );
  const closePicker = useCallback(() => set({ pickerOpen: false }), [set]);
  const pick = useCallback(
    (id: string) => {
      const s = stateRef.current;
      if (s.pickerMode === "swap") {
        const ing = byId(id);
        set((st) => ({
          committed: st.committed.map((c) =>
            c.uid === st.swapUid ? { ...c, ingredientId: id, role: (ing?.roles[0] || c.role) as Role } : c,
          ),
          pickerOpen: false,
        }));
      } else {
        addIngredient(id, "supporting", s.addTargetComp || undefined);
      }
    },
    [byId, addIngredient, set],
  );

  const setRole = useCallback(
    (uid: number, role: Role) =>
      set((s) => ({ committed: s.committed.map((c) => (c.uid === uid ? { ...c, role } : c)) })),
    [set],
  );
  const setMag = useCallback(
    (uid: number, m: Magnitude) =>
      set((s) => ({ committed: s.committed.map((c) => (c.uid === uid ? { ...c, magnitude: m } : c)) })),
    [set],
  );
  const removeRow = useCallback(
    (uid: number) => set((s) => ({ committed: s.committed.filter((c) => c.uid !== uid) })),
    [set],
  );

  // ---- flavor profile ----
  const toggleProfile = useCallback(
    (uid: number) => set((s) => ({ expandedRow: s.expandedRow === uid ? null : uid })),
    [set],
  );
  const rowAxesOf = useCallback(
    (c: CommittedRow) => (c.axes != null ? c.axes : { ...(byId(c.ingredientId)?.axes ?? ZERO_AXES) }),
    [byId],
  );
  const setAxis = useCallback(
    (uid: number, axis: keyof typeof ZERO_AXES, val: number) =>
      set((s) => ({
        committed: s.committed.map((c) => {
          if (c.uid !== uid) return c;
          const base = c.axes != null ? c.axes : { ...rowAxesOf(c) };
          return { ...c, axes: { ...base, [axis]: val } };
        }),
      })),
    [set, rowAxesOf],
  );
  const resetProfile = useCallback(
    (uid: number) =>
      set((s) => ({
        committed: s.committed.map((c) => {
          if (c.uid !== uid) return c;
          const cc = { ...c };
          delete cc.axes;
          return cc;
        }),
      })),
    [set],
  );

  // ---- texture / temperature (P1) ----
  const rowTextureOf = useCallback((c: CommittedRow) => rowTexture(c, byId), [byId]);
  const rowTemperatureOf = useCallback((c: CommittedRow) => rowTemperature(c, byId), [byId]);
  const setTexture = useCallback(
    (uid: number, t: Texture) =>
      set((s) => ({ committed: s.committed.map((c) => (c.uid === uid ? { ...c, texture: t } : c)) })),
    [set],
  );
  const setTemperature = useCallback(
    (uid: number, t: Temperature) =>
      set((s) => ({ committed: s.committed.map((c) => (c.uid === uid ? { ...c, temperature: t } : c)) })),
    [set],
  );

  // ---- aromas ----
  const setAromaDraft = useCallback(
    (uid: number, v: string) => set((s) => ({ aromaDrafts: { ...s.aromaDrafts, [uid]: v } })),
    [set],
  );
  const rowAromasOf = useCallback(
    (c: CommittedRow) => (c.aromas != null ? c.aromas : byId(c.ingredientId)?.aromas ?? []),
    [byId],
  );
  const addAroma = useCallback(
    (uid: number) => {
      const draft = (stateRef.current.aromaDrafts[uid] || "").trim().toLowerCase();
      if (!draft) return;
      set((s) => ({
        committed: s.committed.map((c) => {
          if (c.uid !== uid) return c;
          const cur = rowAromasOf(c);
          if (cur.includes(draft)) return c;
          return { ...c, aromas: [...cur, draft] };
        }),
        aromaDrafts: { ...s.aromaDrafts, [uid]: "" },
      }));
    },
    [set, rowAromasOf],
  );
  const removeAroma = useCallback(
    (uid: number, idx: number) =>
      set((s) => ({
        committed: s.committed.map((c) => {
          if (c.uid !== uid) return c;
          const cur = rowAromasOf(c);
          return { ...c, aromas: cur.filter((_, i) => i !== idx) };
        }),
      })),
    [set, rowAromasOf],
  );

  // ---- intent / form / risk / flags ----
  const setRisk = useCallback((v: number) => set({ risk: v }), [set]);
  const dismissFlag = useCallback((id: string) => set((s) => ({ dismissed: [...s.dismissed, id] })), [set]);
  const pickIntent = useCallback((id: string) => set({ intentId: id, intentModalOpen: false }), [set]);
  // Tuning any axis switches to a custom aim, seeded from the current preset's
  // full target so the sliders start where you already are. Keeps the modal open.
  const setCustomAxis = useCallback(
    (axis: Axis, val: number) =>
      set((s) => {
        const base =
          s.intentId === "custom" && s.customIntent
            ? s.customIntent
            : desiredVec(INTENTS.find((i) => i.id === s.intentId) || INTENTS[0]);
        return { intentId: "custom", customIntent: { ...base, [axis]: val } };
      }),
    [set],
  );
  const pickForm = useCallback((id: string) => set({ formId: id, customForm: null, formModalOpen: false }), [set]);
  const clearForm = useCallback(() => set({ formId: null, customForm: null, formModalOpen: false }), [set]);
  const setCustomFormDraft = useCallback((v: string) => set({ customFormDraft: v }), [set]);
  const setCustomForm = useCallback(() => {
    const nm = (stateRef.current.customFormDraft || "").trim();
    if (!nm) return;
    set({
      customForm: { id: "custom", label: nm, kicker: nm.toUpperCase(), blurb: "", leanRoles: [], typicalComponents: [] },
      formId: "custom",
      formModalOpen: false,
      customFormDraft: "",
    });
  }, [set]);

  // ---- custom ingredient (off-pantry) ----
  // Optimistic: the ingredient lands on the board immediately as `estimating`,
  // so there's instant feedback. The Claude estimate fills its profile in place
  // via resolveCustomIngredient (or failCustomIngredient leaves it unprofiled).
  // Returns the new ingredient id so the caller can resolve it. componentId is
  // optional; defaults to the active component.
  const addCustomIngredient = useCallback(
    (name: string, componentId?: string): string | null => {
      const nm = (name || "").trim();
      if (!nm) return null;
      const id = "cust_" + stateRef.current.custId;
      set((s) => {
        const ing: Ingredient = {
          id,
          name: nm,
          roles: [],
          aromas: [],
          novelty: 0,
          custom: true,
          unprofiled: true,
          estimating: true,
          axes: { ...ZERO_AXES },
          texture: "neutral",
          temperature: "room",
        };
        let components = s.components;
        let cid = s.cid;
        let target = componentId || s.activeComp || "";
        if (!components.some((c) => c.id === target)) {
          if (components.length) target = components[0].id;
          else {
            target = "c" + cid;
            components = [...components, { id: target, name: "" }];
            cid = cid + 1;
          }
        }
        return {
          customIngredients: [...s.customIngredients, ing],
          custId: s.custId + 1,
          components,
          cid,
          committed: [
            ...s.committed,
            {
              uid: s.uid,
              ingredientId: id,
              magnitude: "supporting" as Magnitude,
              role: "finish" as Role,
              componentId: target,
            },
          ],
          uid: s.uid + 1,
          activeComp: target,
          pickerOpen: false,
          search: "",
        };
      });
      flashToast(`Added ${nm} — reading its profile…`);
      return id;
    },
    [set, flashToast],
  );

  // Estimate came back: fill the custom ingredient's profile in place and clear
  // the estimating flag. Also adopt the estimated primary role on its board rows
  // that still carry the placeholder role.
  const resolveCustomIngredient = useCallback(
    (
      id: string,
      p: { axes: AxisMap; aromas: string[]; texture: Texture; temperature: Temperature; roles: Role[]; novelty: number },
    ) =>
      set((s) => ({
        customIngredients: s.customIngredients.map((ci) =>
          ci.id === id
            ? {
                ...ci,
                axes: p.axes,
                aromas: p.aromas,
                texture: p.texture,
                temperature: p.temperature,
                roles: p.roles,
                novelty: p.novelty,
                unprofiled: false,
                estimating: false,
              }
            : ci,
        ),
        committed: s.committed.map((c) =>
          c.ingredientId === id && c.role === "finish" && p.roles[0] ? { ...c, role: p.roles[0] } : c,
        ),
      })),
    [set],
  );

  // Estimate failed (offline / no key): keep the ingredient, just stop the
  // spinner — it stays `unprofiled` for the cook to read in by hand.
  const failCustomIngredient = useCallback(
    (id: string) =>
      set((s) => ({
        customIngredients: s.customIngredients.map((ci) =>
          ci.id === id ? { ...ci, estimating: false } : ci,
        ),
      })),
    [set],
  );

  // ---- text fields ----
  const setDishName = useCallback((v: string) => set({ dishName: v }), [set]);
  const setMethod = useCallback((v: string) => set({ method: v }), [set]);
  const setServings = useCallback((n: number) => set({ servings: Math.max(1, n) }), [set]);
  const setAmount = useCallback(
    (uid: number, v: string) =>
      set((s) => ({ committed: s.committed.map((c) => (c.uid === uid ? { ...c, amount: v } : c)) })),
    [set],
  );
  const openRecipe = useCallback(() => set({ recipeOpen: true }), [set]);
  const closeRecipe = useCallback(() => set({ recipeOpen: false }), [set]);
  const setCompNote = useCallback(
    (id: string, v: string) =>
      set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, notes: v } : c)) })),
    [set],
  );
  const setSearch = useCallback((v: string) => set({ search: v }), [set]);
  const setSuggestionCount = useCallback((n: number) => set({ suggestionCount: n }), [set]);

  // ---- modals ----
  const openIntentModal = useCallback(() => set({ intentModalOpen: true }), [set]);
  const closeIntentModal = useCallback(() => set({ intentModalOpen: false }), [set]);
  const openFormModal = useCallback(() => set({ formModalOpen: true }), [set]);
  const closeFormModal = useCallback(() => set({ formModalOpen: false }), [set]);
  const openLibrary = useCallback(() => set({ libraryOpen: true }), [set]);
  const closeLibrary = useCallback(() => set({ libraryOpen: false }), [set]);

  // ---- saved library (server-backed) ----
  const snapshot = useCallback((): DishSnapshot => {
    const s = stateRef.current;
    return {
      name: (s.dishName || "").trim() || "Untitled dish",
      intentId: s.intentId,
      customIntent: s.customIntent ? { ...s.customIntent } : null,
      formId: s.formId,
      customForm: s.customForm ? JSON.parse(JSON.stringify(s.customForm)) : null,
      components: JSON.parse(JSON.stringify(s.components)),
      committed: JSON.parse(JSON.stringify(s.committed)),
      customIngredients: JSON.parse(JSON.stringify(s.customIngredients)),
      activeComp: s.activeComp,
      risk: s.risk,
      method: s.method,
      servings: s.servings,
      cid: s.cid,
      uid: s.uid,
      custId: s.custId,
    };
  }, []);

  const saveCurrent = useCallback(() => {
    const snap = snapshot();
    apiSaveDish(snap)
      .then((entry) => {
        set((s) => {
          const arr = s.saved.filter((d) => d.id !== entry.id);
          arr.unshift(entry);
          arr.sort((a, b) => b.savedAt - a.savedAt);
          return { saved: arr, justSaved: true };
        });
      })
      .catch(() => set({ justSaved: true }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => set({ justSaved: false }), 1600);
  }, [snapshot, set]);

  const loadSaved = useCallback((id: string) => {
    const d = stateRef.current.saved.find((x) => x.id === id);
    if (!d) return;
    set({
      dishName: d.name,
      intentId: d.intentId ?? "bright_sharp",
      customIntent: d.customIntent ? { ...d.customIntent } : null,
      formId: d.formId,
      customForm: d.customForm ? JSON.parse(JSON.stringify(d.customForm)) : null,
      components: JSON.parse(JSON.stringify(d.components)),
      committed: JSON.parse(JSON.stringify(d.committed)),
      customIngredients: (JSON.parse(JSON.stringify(d.customIngredients || [])) as Ingredient[]).map((ci) => ({
        ...ci,
        estimating: false,
      })),
      activeComp: d.activeComp,
      risk: d.risk != null ? d.risk : 0.3,
      method: d.method || "",
      servings: d.servings || 2,
      cid: d.cid || 99,
      uid: d.uid || 999,
      custId: d.custId || 99,
      libraryOpen: false,
      dismissed: [],
    });
  }, [set]);

  const deleteSaved = useCallback((id: string) => {
    set((s) => ({ saved: s.saved.filter((x) => x.id !== id) }));
    apiDeleteDish(id).catch(() => {});
  }, [set]);

  return {
    state,
    pantry,
    set,
    byId,
    intent,
    form,
    activeCompName,
    rowAxesOf,
    rowAromasOf,
    rowTextureOf,
    rowTemperatureOf,
    // actions
    addIngredient,
    addComponent,
    addComponentNamed,
    renameComponent,
    removeComponent,
    beginDrag,
    endDrag,
    setOverKey,
    reorderComp,
    reorderIng,
    appendIngToComp,
    setActive,
    openAdd,
    openSwap,
    closePicker,
    pick,
    setRole,
    setMag,
    removeRow,
    toggleProfile,
    setAxis,
    resetProfile,
    setTexture,
    setTemperature,
    setAromaDraft,
    addAroma,
    removeAroma,
    setRisk,
    dismissFlag,
    pickIntent,
    setCustomAxis,
    pickForm,
    clearForm,
    setCustomFormDraft,
    setCustomForm,
    addCustomIngredient,
    resolveCustomIngredient,
    failCustomIngredient,
    flashToast,
    setDishName,
    setMethod,
    setServings,
    setAmount,
    openRecipe,
    closeRecipe,
    setCompNote,
    setSearch,
    setSuggestionCount,
    openIntentModal,
    closeIntentModal,
    openFormModal,
    closeFormModal,
    openLibrary,
    closeLibrary,
    saveCurrent,
    loadSaved,
    deleteSaved,
  };
}

export type Mise = ReturnType<typeof useMise>;

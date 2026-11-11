"use client";

import {
  createContext,
  useEffect,
  useState,
  use,
  useMemo,
  useReducer,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { CatLiveState } from "@/components/oneko";
import { parseShareFragment } from "@/lib/oneko/configuration";
import { loadRemoteSprite, spriteNameFromURL } from "@/lib/oneko/custom-assets";
import {
  DEFAULT_ONEKO_PLAYGROUND_STATE,
  PLAYGROUND_STORAGE_KEY,
  restorePlaygroundState,
  type OnekoPlaygroundState,
} from "@/lib/oneko/playground-defaults";

const DEFAULT_LIVE_STATE: CatLiveState = {
  state: "idle",
  posX: 0,
  posY: 0,
  velMag: 0,
  idleTime: 0,
  distToMouse: 0,
  frameCount: 0,
  freerunActive: false,
  freerunTimer: 0,
  bubbleVisible: false,
  pathLength: 0,
  obstacleCount: 0,
};

export type OnekoPlaygroundActions = {
  update: (changes: Partial<OnekoPlaygroundState>) => void;
  replace: (state: OnekoPlaygroundState) => void;
  reset: () => void;
};

export type OnekoPlaygroundContextValue = {
  state: OnekoPlaygroundState;
  actions: OnekoPlaygroundActions;
  liveStateRef: MutableRefObject<CatLiveState>;
  configurationStatus: string;
  /** The visitor's own cat, kept for this visit after a share link replaces it. */
  previousCat: OnekoPlaygroundState | null;
};

type PlaygroundAction =
  | { type: "update"; changes: Partial<OnekoPlaygroundState> }
  | { type: "replace"; state: OnekoPlaygroundState };

/** Session storage, so "Back to my cat" survives a reload after a share link replaced the cat. */
const PREVIOUS_CAT_KEY = `${PLAYGROUND_STORAGE_KEY}:previous`;

function storePreviousCat(cat: OnekoPlaygroundState | null) {
  try {
    if (cat) sessionStorage.setItem(PREVIOUS_CAT_KEY, JSON.stringify(cat));
    else sessionStorage.removeItem(PREVIOUS_CAT_KEY);
  } catch {
    /* Without session storage, the way back lasts until the page reloads. */
  }
}

const OnekoPlaygroundContext = createContext<OnekoPlaygroundContextValue | null>(null);

export function OnekoPlaygroundProvider({ children }: { children: ReactNode }) {
  const liveStateRef = useRef<CatLiveState>({ ...DEFAULT_LIVE_STATE });

  const [state, dispatch] = useReducer(
    (prev: OnekoPlaygroundState, action: PlaygroundAction) =>
      action.type === "replace" ? action.state : { ...prev, ...action.changes },
    { ...DEFAULT_ONEKO_PLAYGROUND_STATE },
  );

  const [restored, setRestored] = useState(false);
  const [configurationStatus, setConfigurationStatus] = useState("");
  const [previousCat, setPreviousCatState] = useState<OnekoPlaygroundState | null>(null);
  const setPreviousCat = (cat: OnekoPlaygroundState | null) => {
    setPreviousCatState(cat);
    storePreviousCat(cat);
  };
  const latestState = useRef(state);
  /** Bumped by every edit or loaded shared cat, so late async results can tell they are stale. */
  const changes = useRef(0);
  const pendingSave = useRef<(() => void) | null>(null);
  useEffect(() => {
    let initial = { ...DEFAULT_ONEKO_PLAYGROUND_STATE };
    try {
      initial = restorePlaygroundState(localStorage.getItem(PLAYGROUND_STORAGE_KEY));
    } catch {
      /* Storage can be unavailable; start from the defaults. */
    }
    dispatch({ type: "replace", state: initial });
    latestState.current = initial;
    try {
      const previous = sessionStorage.getItem(PREVIOUS_CAT_KEY);
      if (previous) setPreviousCatState(restorePlaygroundState(previous));
    } catch {
      /* Storage can be unavailable; there is no earlier cat to offer. */
    }
    let request = 0;
    const applySharedConfiguration = async () => {
      const current = ++request;
      const shared = await parseShareFragment(window.location.hash);
      if (current !== request) return;
      if (!shared.ok) {
        setConfigurationStatus(`${shared.error} Your settings are unchanged.`);
      } else if (shared.value) {
        changes.current++;
        setPreviousCat(latestState.current);
        dispatch({ type: "replace", state: shared.value.settings });
        setConfigurationStatus("Shared cat loaded. Changes are saved in this browser.");
        // Reloading should keep the visitor's edits, not apply the link again.
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } else {
        setConfigurationStatus("");
      }
    };
    void applySharedConfiguration();
    window.addEventListener("hashchange", applySharedConfiguration);
    // /studio?sprite=https://… wears a hosted coat, after checking it is a valid sheet.
    // It applies once: the parameter is dropped so a reload keeps the visitor's later edits.
    const sprite = new URLSearchParams(window.location.search).get("sprite");
    let active = true;
    if (sprite) {
      const changesAtStart = changes.current;
      const settle = (apply: () => void) => {
        if (!active) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("sprite");
        const query = params.toString();
        history.replaceState(
          null,
          "",
          window.location.pathname + (query ? `?${query}` : "") + window.location.hash,
        );
        // A choice made while the coat loads, or a shared cat, wins over the late result.
        if (changes.current === changesAtStart) apply();
      };
      loadRemoteSprite(sprite).then(
        (spriteSrc) =>
          settle(() => {
            dispatch({
              type: "update",
              changes: { spriteSrc, spriteName: spriteNameFromURL(spriteSrc), hueRotate: 0 },
            });
            setConfigurationStatus(`Wearing a coat from ${new URL(spriteSrc).hostname}.`);
          }),
        (error: Error) =>
          settle(() => setConfigurationStatus(`${error.message} Your settings are unchanged.`)),
      );
    }
    setRestored(true);
    return () => {
      request++;
      active = false;
      window.removeEventListener("hashchange", applySharedConfiguration);
    };
  }, []);

  useEffect(() => {
    if (!restored) return;
    latestState.current = state;
    // A slider drag dispatches on every input; write the settings once it settles.
    const save = () => {
      pendingSave.current = null;
      try {
        localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* Storage can be unavailable or full; settings still apply to this visit. */
      }
    };
    pendingSave.current = save;
    const timer = setTimeout(save, 300);
    return () => clearTimeout(timer);
  }, [state, restored]);

  useEffect(() => {
    const flush = () => pendingSave.current?.();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const actions = useMemo<OnekoPlaygroundActions>(
    () => ({
      update: (edits) => {
        changes.current++;
        dispatch({ type: "update", changes: edits });
      },
      replace: (state) => {
        changes.current++;
        dispatch({ type: "replace", state });
        setConfigurationStatus("");
        setPreviousCat(null);
      },
      reset: () => {
        changes.current++;
        dispatch({ type: "replace", state: { ...DEFAULT_ONEKO_PLAYGROUND_STATE } });
        setConfigurationStatus("");
        setPreviousCat(null);
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, actions, liveStateRef, configurationStatus, previousCat }),
    [state, actions, liveStateRef, configurationStatus, previousCat],
  );

  return (
    <OnekoPlaygroundContext.Provider value={value}>{children}</OnekoPlaygroundContext.Provider>
  );
}

export function useOnekoPlayground(): OnekoPlaygroundContextValue {
  const ctx = use(OnekoPlaygroundContext);
  if (!ctx) {
    throw new Error("useOnekoPlayground must be used within OnekoPlaygroundProvider");
  }
  return ctx;
}

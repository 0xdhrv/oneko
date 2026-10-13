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

export type OnekoPlaygroundState = typeof DEFAULT_ONEKO_PLAYGROUND_STATE;

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
};

type PlaygroundAction =
  | { type: "update"; changes: Partial<OnekoPlaygroundState> }
  | { type: "replace"; state: OnekoPlaygroundState };

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
  useEffect(() => {
    let initial = { ...DEFAULT_ONEKO_PLAYGROUND_STATE };
    try {
      initial = restorePlaygroundState(localStorage.getItem(PLAYGROUND_STORAGE_KEY));
    } catch {}
    dispatch({ type: "replace", state: initial });
    const applySharedConfiguration = () => {
      const shared = parseShareFragment(window.location.hash);
      if (!shared.ok) {
        setConfigurationStatus(`${shared.error} Your settings are unchanged.`);
      } else if (shared.value) {
        dispatch({ type: "replace", state: shared.value.settings });
        setConfigurationStatus("Shared cat loaded. Changes are saved in this browser.");
      } else {
        setConfigurationStatus("");
      }
    };
    applySharedConfiguration();
    window.addEventListener("hashchange", applySharedConfiguration);
    // /studio?sprite=https://… wears a hosted coat, after checking it is a valid sheet.
    const sprite = new URLSearchParams(window.location.search).get("sprite");
    if (sprite) {
      loadRemoteSprite(sprite).then(
        (spriteSrc) => {
          dispatch({
            type: "update",
            changes: { spriteSrc, spriteName: spriteNameFromURL(spriteSrc), hueRotate: 0 },
          });
          setConfigurationStatus(`Wearing a coat from ${new URL(spriteSrc).hostname}.`);
        },
        (error: Error) => setConfigurationStatus(`${error.message} Your settings are unchanged.`),
      );
    }
    setRestored(true);
    return () => window.removeEventListener("hashchange", applySharedConfiguration);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, restored]);

  const actions = useMemo<OnekoPlaygroundActions>(
    () => ({
      update: (changes) => dispatch({ type: "update", changes }),
      replace: (state) => {
        dispatch({ type: "replace", state });
        setConfigurationStatus("");
      },
      reset: () => {
        dispatch({ type: "replace", state: { ...DEFAULT_ONEKO_PLAYGROUND_STATE } });
        setConfigurationStatus("");
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, actions, liveStateRef, configurationStatus }),
    [state, actions, liveStateRef, configurationStatus],
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

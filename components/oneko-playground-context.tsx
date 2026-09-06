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
  reset: () => void;
};

export type OnekoPlaygroundContextValue = {
  state: OnekoPlaygroundState;
  actions: OnekoPlaygroundActions;
  liveStateRef: MutableRefObject<CatLiveState>;
};

const OnekoPlaygroundContext = createContext<OnekoPlaygroundContextValue | null>(null);

export function OnekoPlaygroundProvider({ children }: { children: ReactNode }) {
  const liveStateRef = useRef<CatLiveState>({ ...DEFAULT_LIVE_STATE });

  const [state, dispatch] = useReducer(
    (prev: OnekoPlaygroundState, partial: Partial<OnekoPlaygroundState>) => ({
      ...prev,
      ...partial,
    }),
    { ...DEFAULT_ONEKO_PLAYGROUND_STATE },
  );

  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      dispatch(restorePlaygroundState(localStorage.getItem(PLAYGROUND_STORAGE_KEY)));
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, restored]);

  const actions = useMemo<OnekoPlaygroundActions>(
    () => ({
      update: dispatch,
      reset: () => dispatch({ ...DEFAULT_ONEKO_PLAYGROUND_STATE }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, actions, liveStateRef }), [state, actions, liveStateRef]);

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

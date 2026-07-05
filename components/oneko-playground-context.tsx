"use client";

import {
  createContext,
  use,
  useMemo,
  useReducer,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { CatLiveState } from "@/components/oneko";
import { DEFAULT_ONEKO_PLAYGROUND_STATE } from "@/lib/oneko/playground-defaults";

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

export type OnekoPlaygroundState = {
  speed: number;
  persistPosition: boolean;
  showCat: boolean;
  scale: number;
  opacity: number;
  rotationAmount: number;
  idleThreshold: number;
  meow: boolean;
  volume: number;
  laserPointer: boolean;
  bubbleChance: number;
  followDistance: number;
  animationSpeed: number;
  bubbleText: string;
  freerunChance: number;
  freerunDuration: number;
  bubbleEnabled: boolean;
  bubbleDisplayFrames: number;
  bubbleCooldown: number;
  hueRotate: number;
};

export type OnekoPlaygroundActions = {
  setSpeed: (value: number) => void;
  setPersistPosition: (value: boolean) => void;
  setShowCat: (value: boolean) => void;
  setScale: (value: number) => void;
  setOpacity: (value: number) => void;
  setRotationAmount: (value: number) => void;
  setIdleThreshold: (value: number) => void;
  setMeow: (value: boolean) => void;
  setVolume: (value: number) => void;
  setLaserPointer: (value: boolean) => void;
  setBubbleChance: (value: number) => void;
  setFollowDistance: (value: number) => void;
  setAnimationSpeed: (value: number) => void;
  setBubbleText: (value: string) => void;
  setFreerunChance: (value: number) => void;
  setFreerunDuration: (value: number) => void;
  setBubbleEnabled: (value: boolean) => void;
  setBubbleDisplayFrames: (value: number) => void;
  setBubbleCooldown: (value: number) => void;
  setHueRotate: (value: number) => void;
};

export type OnekoPlaygroundContextValue = {
  state: OnekoPlaygroundState;
  actions: OnekoPlaygroundActions;
  liveStateRef: MutableRefObject<CatLiveState>;
};

const OnekoPlaygroundContext = createContext<OnekoPlaygroundContextValue | null>(null);

export function OnekoPlaygroundProvider({ children }: { children: ReactNode }) {
  const liveStateRef = useRef<CatLiveState>({ ...DEFAULT_LIVE_STATE });

  // Use a reducer to group the 20 config fields (addresses prefer-useReducer diagnostic).
  const [state, dispatch] = useReducer(
    (prev: OnekoPlaygroundState, partial: Partial<OnekoPlaygroundState>) => ({
      ...prev,
      ...partial,
    }),
    { ...DEFAULT_ONEKO_PLAYGROUND_STATE },
  );

  // Stabilize actions object (and its functions) with useMemo so consumers
  // can safely depend on it. dispatch from useReducer is stable.
  const actions = useMemo(
    () =>
      ({
        setSpeed: (v: number) => dispatch({ speed: v }),
        setPersistPosition: (v: boolean) => dispatch({ persistPosition: v }),
        setShowCat: (v: boolean) => dispatch({ showCat: v }),
        setScale: (v: number) => dispatch({ scale: v }),
        setOpacity: (v: number) => dispatch({ opacity: v }),
        setRotationAmount: (v: number) => dispatch({ rotationAmount: v }),
        setIdleThreshold: (v: number) => dispatch({ idleThreshold: v }),
        setMeow: (v: boolean) => dispatch({ meow: v }),
        setVolume: (v: number) => dispatch({ volume: v }),
        setLaserPointer: (v: boolean) => dispatch({ laserPointer: v }),
        setBubbleChance: (v: number) => dispatch({ bubbleChance: v }),
        setFollowDistance: (v: number) => dispatch({ followDistance: v }),
        setAnimationSpeed: (v: number) => dispatch({ animationSpeed: v }),
        setBubbleText: (v: string) => dispatch({ bubbleText: v }),
        setFreerunChance: (v: number) => dispatch({ freerunChance: v }),
        setFreerunDuration: (v: number) => dispatch({ freerunDuration: v }),
        setBubbleEnabled: (v: boolean) => dispatch({ bubbleEnabled: v }),
        setBubbleDisplayFrames: (v: number) => dispatch({ bubbleDisplayFrames: v }),
        setBubbleCooldown: (v: number) => dispatch({ bubbleCooldown: v }),
        setHueRotate: (v: number) => dispatch({ hueRotate: v }),
      }) as const,
    [dispatch],
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

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { CatLiveState } from "@/components/oneko";

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

  const [speed, setSpeed] = useState(10);
  const [persistPosition, setPersistPosition] = useState(true);
  const [showCat, setShowCat] = useState(true);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [rotationAmount, setRotationAmount] = useState(15);
  const [idleThreshold, setIdleThreshold] = useState(1000);
  const [meow, setMeow] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [laserPointer, setLaserPointer] = useState(false);
  const [bubbleChance, setBubbleChance] = useState(0.5);
  const [followDistance, setFollowDistance] = useState(20);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [bubbleText, setBubbleText] = useState("Meow!");
  const [freerunChance, setFreerunChance] = useState(0.06);
  const [freerunDuration, setFreerunDuration] = useState(40);
  const [bubbleEnabled, setBubbleEnabled] = useState(true);
  const [bubbleDisplayFrames, setBubbleDisplayFrames] = useState(180);
  const [bubbleCooldown, setBubbleCooldown] = useState(120);
  const [hueRotate, setHueRotate] = useState(0);

  const actions = useMemo(
    () => ({
      setSpeed,
      setPersistPosition,
      setShowCat,
      setScale,
      setOpacity,
      setRotationAmount,
      setIdleThreshold,
      setMeow,
      setVolume,
      setLaserPointer,
      setBubbleChance,
      setFollowDistance,
      setAnimationSpeed,
      setBubbleText,
      setFreerunChance,
      setFreerunDuration,
      setBubbleEnabled,
      setBubbleDisplayFrames,
      setBubbleCooldown,
      setHueRotate,
    }),
    [],
  );

  const state = useMemo(
    (): OnekoPlaygroundState => ({
      speed,
      persistPosition,
      showCat,
      scale,
      opacity,
      rotationAmount,
      idleThreshold,
      meow,
      volume,
      laserPointer,
      bubbleChance,
      followDistance,
      animationSpeed,
      bubbleText,
      freerunChance,
      freerunDuration,
      bubbleEnabled,
      bubbleDisplayFrames,
      bubbleCooldown,
      hueRotate,
    }),
    [
      speed,
      persistPosition,
      showCat,
      scale,
      opacity,
      rotationAmount,
      idleThreshold,
      meow,
      volume,
      laserPointer,
      bubbleChance,
      followDistance,
      animationSpeed,
      bubbleText,
      freerunChance,
      freerunDuration,
      bubbleEnabled,
      bubbleDisplayFrames,
      bubbleCooldown,
      hueRotate,
    ],
  );

  const value = useMemo(() => ({ state, actions, liveStateRef }), [state, actions, liveStateRef]);

  return (
    <OnekoPlaygroundContext.Provider value={value}>{children}</OnekoPlaygroundContext.Provider>
  );
}

export function useOnekoPlayground(): OnekoPlaygroundContextValue {
  const ctx = useContext(OnekoPlaygroundContext);
  if (!ctx) {
    throw new Error("useOnekoPlayground must be used within OnekoPlaygroundProvider");
  }
  return ctx;
}

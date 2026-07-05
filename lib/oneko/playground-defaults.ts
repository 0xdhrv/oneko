import type { OnekoPlaygroundState } from "@/components/oneko-playground-context";

export const DEFAULT_ONEKO_PLAYGROUND_STATE: OnekoPlaygroundState = {
  speed: 10,
  persistPosition: true,
  showCat: true,
  scale: 1,
  opacity: 1,
  rotationAmount: 15,
  idleThreshold: 1000,
  meow: true,
  volume: 0.5,
  laserPointer: false,
  bubbleChance: 0.5,
  followDistance: 20,
  animationSpeed: 1,
  bubbleText: "purr patrol",
  freerunChance: 0.06,
  freerunDuration: 40,
  bubbleEnabled: true,
  bubbleDisplayFrames: 180,
  bubbleCooldown: 120,
  hueRotate: 0,
};

export function copyPlaygroundState(
  target: OnekoPlaygroundState,
  source: OnekoPlaygroundState,
): void {
  Object.assign(target, source);
}

import type { Mood } from "./animation/play-types";

export const NEUTRAL_MOOD: Mood = { speed: 1, freerun: 1, idle: 1 };

/**
 * How a cat feels at a local hour. Cats are crepuscular: most playful at dawn and dusk, drowsy
 * in the early afternoon, and asleep in the small hours. idle scales the rest time before naps.
 */
export function moodForHour(hour: number): Mood {
  if (hour >= 5 && hour < 8) return { speed: 1.25, freerun: 2.5, idle: 1.5 };
  if (hour >= 8 && hour < 12) return { speed: 1.1, freerun: 1.4, idle: 1 };
  if (hour >= 12 && hour < 17) return { speed: 0.9, freerun: 0.7, idle: 0.6 };
  if (hour >= 17 && hour < 21) return { speed: 1.25, freerun: 2.5, idle: 1.5 };
  if (hour >= 21 && hour < 23) return { speed: 1, freerun: 0.8, idle: 0.8 };
  return { speed: 0.7, freerun: 0.25, idle: 0.35 };
}

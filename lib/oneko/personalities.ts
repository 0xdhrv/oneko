import type { OnekoPlaygroundState } from "./playground-defaults";

type PersonalitySettings = Pick<
  OnekoPlaygroundState,
  | "speed"
  | "followDistance"
  | "idleThreshold"
  | "animationSpeed"
  | "freerunChance"
  | "freerunDuration"
>;

export const ONEKO_PERSONALITIES = [
  {
    id: "sleepy",
    name: "Sleepy",
    description: "Slow paws, short adventures.",
    settings: {
      speed: 5,
      followDistance: 60,
      idleThreshold: 500,
      animationSpeed: 0.7,
      freerunChance: 0.01,
      freerunDuration: 20,
    },
  },
  {
    id: "curious",
    name: "Curious",
    description: "A companion for every click.",
    settings: {
      speed: 10,
      followDistance: 20,
      idleThreshold: 1000,
      animationSpeed: 1,
      freerunChance: 0.06,
      freerunDuration: 40,
    },
  },
  {
    id: "playful",
    name: "Playful",
    description: "Quick steps and longer zoomies.",
    settings: {
      speed: 18,
      followDistance: 15,
      idleThreshold: 2500,
      animationSpeed: 1.4,
      freerunChance: 0.15,
      freerunDuration: 80,
    },
  },
] as const satisfies readonly {
  id: string;
  name: string;
  description: string;
  settings: PersonalitySettings;
}[];

export function selectedPersonality(state: OnekoPlaygroundState) {
  return ONEKO_PERSONALITIES.find((personality) =>
    (Object.keys(personality.settings) as (keyof PersonalitySettings)[]).every(
      (key) => state[key] === personality.settings[key],
    ),
  );
}

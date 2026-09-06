import { KONAMI_SEQUENCE } from "./oneko/constants";

export type KonamiProgress = { progress: number; matched: boolean };

export const CATNIP_DIALOGUES = [
  "You found my secret catnip stash!",
  "A catnip shower? You really know how to spoil a cat.",
  "These tiny paws were made for zoomies.",
  "I’m saving one leaf for my next nap.",
] as const;

/** Advance one key at a time while preserving a possible new sequence start. */
export function advanceKonamiProgress(progress: number, code: string): KonamiProgress {
  const nextProgress =
    code === KONAMI_SEQUENCE[progress] ? progress + 1 : code === KONAMI_SEQUENCE[0] ? 1 : 0;

  if (nextProgress === KONAMI_SEQUENCE.length) {
    return { progress: 0, matched: true };
  }

  return { progress: nextProgress, matched: false };
}

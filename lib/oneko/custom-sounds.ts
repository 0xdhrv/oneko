import type { OnekoSoundEvent, OnekoSounds } from "./types";

/** Studio clips are short 8-bit mono WAV files: they play everywhere and fit in a share link. */
export const CLIP_SAMPLE_RATE = 11025;
export const MAX_CLIP_SECONDS = 2;
const WAV_HEADER_BYTES = 44;
const MAX_CLIP_BYTES = WAV_HEADER_BYTES + MAX_CLIP_SECONDS * CLIP_SAMPLE_RATE;
const CLIP_PREFIX = "data:audio/wav;base64,";

export const SOUND_MOMENTS: readonly {
  id: OnekoSoundEvent;
  name: string;
  hint: string;
}[] = [
  { id: "pet", name: "Pets", hint: "When someone pets your cat" },
  { id: "idle", name: "Resting", hint: "Now and then while sitting" },
  { id: "moving", name: "Chasing", hint: "Now and then on the run" },
  { id: "alert", name: "Ears up", hint: "When the cursor moves nearby" },
  { id: "sleeping", name: "Napping", hint: "Through a nap" },
  { id: "tired", name: "Sleepy", hint: "Just before a nap" },
  { id: "scratchSelf", name: "Grooming", hint: "During a little scratch" },
  { id: "scratchWall", name: "Scratching", hint: "Claws on the screen edge" },
  { id: "freerun", name: "Zoomies", hint: "When the zoomies start" },
  { id: "eat", name: "Treats", hint: "Catching the laser or a treat" },
  { id: "hiss", name: "Hiss", hint: "After a hard toss" },
];

/** A chosen clip for one moment. An empty src keeps that moment silent. */
export type CustomSound = { src: string; name: string };
export type CustomSounds = Partial<Record<OnekoSoundEvent, CustomSound>>;

export function isSoundClip(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith(CLIP_PREFIX)) return false;
  const encoded = value.slice(CLIP_PREFIX.length);
  if (encoded.length > Math.ceil(MAX_CLIP_BYTES / 3) * 4) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
  try {
    const bytes = atob(encoded.slice(0, 16));
    return bytes.slice(0, 4) === "RIFF" && bytes.slice(8, 12) === "WAVE";
  } catch {
    return false;
  }
}

/** The clips in a saved or shared cat, or null when any of them is not one the studio made. */
export function parseCustomSounds(value: unknown): CustomSounds | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const sounds: CustomSounds = {};
  for (const [id, sound] of Object.entries(value)) {
    if (!SOUND_MOMENTS.some((moment) => moment.id === id)) return null;
    if (sound === null || typeof sound !== "object") return null;
    const { src, name } = sound as Record<string, unknown>;
    if (src !== "" && !isSoundClip(src)) return null;
    if (typeof name !== "string" || name.length > 255 || name.includes("\0")) return null;
    sounds[id as OnekoSoundEvent] = { src: src as string, name };
  }
  return sounds;
}

export function soundsForProp(sounds: CustomSounds): OnekoSounds {
  return Object.fromEntries(
    Object.entries(sounds).map(([id, sound]) => [id, sound.src || []]),
  ) as OnekoSounds;
}

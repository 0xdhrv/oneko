export type SavedAffection = { version: 1; affection: number; lastVisit: number };

/** A visit this long after the last one earns a greeting. */
const GREETING_GAP_MS = 30 * 60 * 1000;
export const MAX_AFFECTION = 999;

export function parseAffection(value: unknown): SavedAffection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { version, affection, lastVisit } = value as Record<string, unknown>;
  if (version !== 1) return null;
  if (typeof affection !== "number" || !Number.isFinite(affection)) return null;
  if (typeof lastVisit !== "number" || !Number.isFinite(lastVisit)) return null;
  return {
    version: 1,
    affection: Math.max(0, Math.min(MAX_AFFECTION, Math.floor(affection))),
    lastVisit,
  };
}

export function readAffection(key: string): SavedAffection | null {
  try {
    return parseAffection(JSON.parse(window.localStorage.getItem(key) ?? "null"));
  } catch {
    return null;
  }
}

export function writeAffection(key: string, affection: number, lastVisit = Date.now()): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: 1, affection, lastVisit }));
  } catch {
    // Affection is a nicety; the cat still works without storage.
  }
}

/** 0 stranger, 1 acquaintance, 2 friend, 3 best friend. */
export function affectionTier(affection: number): 0 | 1 | 2 | 3 {
  if (affection >= 15) return 3;
  if (affection >= 5) return 2;
  if (affection >= 1) return 1;
  return 0;
}

export const GREETINGS: Record<ReturnType<typeof affectionTier>, readonly string[]> = {
  0: ["oh. a new hooman", "who are you. do you have snacks", "hello, stranger"],
  1: ["you again. acceptable", "I remember you. vaguely", "back so soon?"],
  2: ["my hooman is back!", "I saved you a warm pixel", "there you are. I waited"],
  3: [
    "I missed you. don't tell anyone",
    "best hooman has returned",
    "finally. I have so much to tell you",
  ],
};

/** A greeting for a visitor, or null when they were here a moment ago. */
export function greetingFor(saved: SavedAffection | null, now = Date.now()): string | null {
  if (saved && now - saved.lastVisit < GREETING_GAP_MS) return null;
  const pool = GREETINGS[affectionTier(saved?.affection ?? 0)];
  return pool[Math.floor(Math.random() * pool.length)];
}

import classicSheet from "./skin-classic.json";
import skinIds from "./skin-ids.json";
import { SKIN_CATALOG } from "./skin-catalog";

/** Type-only: the sheets themselves load on demand in `loadSkinSource`. */
export type OnekoSkin = keyof typeof import("./skin-sheets.json");

type AvailableSkin = Extract<(typeof SKIN_CATALOG)[number], { id: OnekoSkin }>;

const installed = new Set<string>(skinIds);

/** Only expose coats included in this installation. See docs/oneko-skins.md for credits. */
export const ONEKO_SKINS = SKIN_CATALOG.filter((entry): entry is AvailableSkin =>
  isOnekoSkin(entry.id),
);

export function isOnekoSkin(value: unknown): value is OnekoSkin {
  return typeof value === "string" && installed.has(value);
}

// The classic coat ships inline; every other sheet waits for the first non-classic skin.
const loaded = new Map<string, string>([["classic", classicSheet.classic]]);
let pending: Promise<void> | undefined;

/** Sprite sheet for a skin if it is ready, otherwise undefined. Unknown IDs use classic. */
export function getSkinSource(skin: OnekoSkin = "classic"): string | undefined {
  return loaded.get(isOnekoSkin(skin) ? skin : "classic");
}

/** Resolve a skin's sprite sheet, loading the bundled sheets once when needed. */
export async function loadSkinSource(skin: OnekoSkin = "classic"): Promise<string> {
  const id = isOnekoSkin(skin) ? skin : "classic";
  if (!loaded.has(id)) {
    pending ??= import("./skin-sheets.json").then(({ default: sheets }) => {
      for (const [key, source] of Object.entries(sheets)) loaded.set(key, source);
    });
    await pending;
  }
  return loaded.get(id) ?? loaded.get("classic")!;
}

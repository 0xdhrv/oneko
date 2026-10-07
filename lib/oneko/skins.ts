import sheets from "./skin-sheets.json";
import { SKIN_CATALOG } from "./skin-catalog";

export type OnekoSkin = keyof typeof sheets;

type AvailableSkin = Extract<(typeof SKIN_CATALOG)[number], { id: OnekoSkin }>;

/** Only expose coats included in this installation. See docs/oneko-skins.md for credits. */
export const ONEKO_SKINS = SKIN_CATALOG.filter((entry): entry is AvailableSkin =>
  isOnekoSkin(entry.id),
);

export function isOnekoSkin(value: unknown): value is OnekoSkin {
  return typeof value === "string" && Object.hasOwn(sheets, value);
}

export function getSkinSource(skin: OnekoSkin = "classic"): string {
  return sheets[isOnekoSkin(skin) ? skin : "classic"];
}

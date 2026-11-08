import sheets from "./oneko/skin-sheets.json";
import { isOnekoSkin, type OnekoSkin } from "./oneko/skins";

/** Every sheet as a data URL, for tests. Pages use skinImageURL so they don't bundle the sheets. */
export function getBundledSkinSource(skin: OnekoSkin = "classic"): string {
  return sheets[isOnekoSkin(skin) ? skin : "classic"];
}

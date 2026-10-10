import sheets from "./oneko/skin-sheets.json";
import { isOnekoSkin, type OnekoSkin } from "./oneko/skins";

/** Site-only synchronous access to every sheet, for previews and tests. Not shipped in the registry. */
export function getBundledSkinSource(skin: OnekoSkin = "classic"): string {
  return sheets[isOnekoSkin(skin) ? skin : "classic"];
}

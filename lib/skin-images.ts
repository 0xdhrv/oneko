import { isOnekoSkin, type OnekoSkin } from "./oneko/skins";

/** A built-in coat as a static image in public/skins, written by scripts/build-skin-images.mjs. */
export function skinImageURL(skin: OnekoSkin = "classic"): string {
  return `/skins/${isOnekoSkin(skin) ? skin : "classic"}.png`;
}

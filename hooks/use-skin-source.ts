import { useEffect, useState } from "react";
import { getSkinSource, loadSkinSource, type OnekoSkin } from "@/lib/oneko/skins";

/** Sprite sheet to draw: a custom sprite, a ready skin, or undefined while a skin loads. */
export function useSkinSource(skin: OnekoSkin, spriteSrc?: string): string | undefined {
  const ready = spriteSrc || getSkinSource(skin);
  const [, setLoadedSkin] = useState<OnekoSkin>();

  useEffect(() => {
    if (ready) return;
    let current = true;
    loadSkinSource(skin).then(
      () => current && setLoadedSkin(skin),
      () => {},
    );
    return () => {
      current = false;
    };
  }, [ready, skin]);

  return ready;
}

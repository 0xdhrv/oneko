import { useEffect } from "react";
import { useSpriteAppearance } from "@/hooks/use-sprite-appearance";
import { applyRuntimeConfig, type CatRuntimeConfig } from "@/lib/oneko/runtime-config";
import { getSkinSource, type OnekoSkin } from "@/lib/oneko/skins";
import type { CatRuntimeState } from "@/lib/oneko/types";

type SyncableProps = CatRuntimeConfig & { hueRotate: number; skin: OnekoSkin; spriteSrc?: string };

export function useOnekoPropsSync(
  stateRef: { current: CatRuntimeState },
  elRef: { current: HTMLDivElement | null },
  props: SyncableProps,
) {
  useSpriteAppearance(elRef, props.spriteSrc || getSkinSource(props.skin), props.hueRotate);

  // Reapply after a render, including when the animation DOM is remounted.
  useEffect(() => {
    const state = stateRef.current;
    applyRuntimeConfig(state, props);
    const el = elRef.current;
    if (!el) return;
    el.style.transform = `scale(${props.scale}) rotate(${state.currentRotation}deg)`;
    el.style.opacity = String(props.opacity);
  });
}

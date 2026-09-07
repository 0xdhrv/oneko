import { useEffect, useRef } from "react";

/** Soften sprite changes without affecting movement, scale, or the selected tint. */
export function useSpriteAppearance(
  elRef: { current: HTMLElement | null },
  source: string,
  hueRotate = 0,
) {
  const previous = useRef<{ el: HTMLElement; source: string; filter: string } | null>(null);
  const transition = useRef<Animation | null>(null);

  // Check the element too: the animation engine can remount its DOM independently.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const filter = hueRotate ? `hue-rotate(${hueRotate}deg)` : "blur(0px)";
    const last = previous.current;
    if (last?.el === el && last.source === source && last.filter === filter) return;

    transition.current?.cancel();
    transition.current = null;
    el.style.backgroundImage = `url(${JSON.stringify(source)})`;
    el.style.filter = filter;
    previous.current = { el, source, filter };

    if (
      last?.el === el &&
      last.source !== source &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      typeof el.animate === "function"
    ) {
      transition.current = el.animate(
        [{ filter: `${filter} blur(2px)` }, { filter: `${filter} blur(0px)` }],
        { duration: 220, easing: "ease-out" },
      );
    }
  });

  useEffect(() => () => transition.current?.cancel(), []);
}

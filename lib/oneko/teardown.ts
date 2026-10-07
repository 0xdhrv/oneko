type CatAnimationElements = {
  el: HTMLDivElement;
  debugSVG: SVGSVGElement;
  debugWrapper: HTMLDivElement;
  bubbleEl: HTMLDivElement;
};

type CatAnimationListeners = {
  onMouseMove: (ev: MouseEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  invalidateObstacles: () => void;
  persist: (() => void) | null;
  onVisibilityChange: () => void;
  stopAnimationLoop: () => void;
};

export function teardownCatAnimation(
  { el, debugSVG, debugWrapper, bubbleEl }: CatAnimationElements,
  {
    onMouseMove,
    onPointerDown,
    onKeyDown,
    invalidateObstacles,
    persist,
    onVisibilityChange,
    stopAnimationLoop,
  }: CatAnimationListeners,
) {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("scroll", invalidateObstacles);
  window.removeEventListener("resize", invalidateObstacles);
  if (persist) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", persist);
  }
  stopAnimationLoop();

  for (const node of [el, debugSVG, debugWrapper, bubbleEl]) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
}

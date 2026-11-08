import { TILE } from "./constants";

/**
 * Style for the still, sleeping cat shown with reduced motion: at its saved spot, or in the
 * bottom-right corner. Shared by the React component and the plain-script cat.
 */
export function restingCatStyle({
  position,
  scale,
  zIndex,
}: {
  position?: { x: number; y: number } | null;
  scale: number;
  zIndex: number;
}) {
  const inset = (TILE * scale) / 2 + 16 - TILE / 2;
  return {
    position: "fixed",
    left: position ? `${position.x - TILE / 2}px` : "",
    top: position ? `${position.y - TILE / 2}px` : "",
    right: position ? "" : `${inset}px`,
    bottom: position ? "" : `${inset}px`,
    width: `${TILE}px`,
    height: `${TILE}px`,
    pointerEvents: "none",
    imageRendering: "pixelated",
    backgroundRepeat: "no-repeat",
    backgroundSize: "256px 128px",
    // Sleeping frame, matching defaultSpriteSets.sleeping[0].
    backgroundPosition: `-${2 * TILE}px 0`,
    zIndex: String(zIndex),
  } as const;
}

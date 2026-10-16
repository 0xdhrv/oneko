import { refreshZones, updateZoneTarget } from "../zone-runtime";
import { tickAttention } from "./attention";
import { createDebugRenderer } from "./debug-render";
import type { CatAnimationDeps } from "./deps";
import type { CatPlay } from "./play";
import { updateBubble } from "./bubbles";
import { tickLiveState } from "./frame/tick-live-state";
import { tickMovement } from "./frame/tick-movement";
import { tickPrelude } from "./frame/tick-prelude";
import { tickSounds } from "./frame/tick-sounds";

export function createFrameLoop(deps: CatAnimationDeps, play?: CatPlay) {
  const { maybeRenderDebug } = createDebugRenderer(deps);

  const frame = () => {
    const s = deps.stateRef.current;
    if (s.pausedCfg) return;
    if (!refreshZones(deps)) return;
    tickPrelude(s);
    play?.upkeep();
    tickAttention(deps);
    updateZoneTarget(s, window.innerWidth, window.innerHeight);
    const dist = Math.hypot(s.mousePosX - s.nekoPosX, s.mousePosY - s.nekoPosY);
    if (play?.tickGrab()) {
      updateBubble(deps);
    } else {
      tickMovement(deps, dist);
      play?.tickErrand();
    }
    maybeRenderDebug();
    const currentState = tickSounds(deps);
    tickLiveState(deps, dist, currentState);
  };

  return frame;
}

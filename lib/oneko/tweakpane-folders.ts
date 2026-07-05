import type { Pane } from "tweakpane";
import type {
  OnekoPlaygroundActions,
  OnekoPlaygroundState,
} from "@/components/oneko-playground-context";
import type { CatLiveState } from "@/components/oneko";

export type TweakFolder = {
  addBinding: <TTarget extends object, TKey extends keyof TTarget>(
    target: TTarget,
    key: TKey,
    options?: unknown,
  ) => {
    on: (eventName: "change", handler: (event: { value: TTarget[TKey] }) => void) => void;
  };
};

export type PaneCompat = Pane & {
  addFolder: (options: { title: string; expanded?: boolean }) => TweakFolder;
  refresh: () => void;
};

function bindChange<T extends keyof OnekoPlaygroundState>(
  folder: TweakFolder,
  params: OnekoPlaygroundState,
  key: T,
  options: unknown,
  onChange: (value: OnekoPlaygroundState[T]) => void,
) {
  folder.addBinding(params, key, options).on("change", (e) => onChange(e.value));
}

function addLiveStateFolder(pane: PaneCompat, liveState: CatLiveState) {
  const folder = pane.addFolder({ title: "Live State", expanded: true });

  folder.addBinding(liveState, "state", { readonly: true, label: "state", interval: 100 });
  folder.addBinding(liveState, "posX", {
    readonly: true,
    label: "pos x",
    format: (v: number) => Math.round(v).toString(),
    interval: 100,
  });
  folder.addBinding(liveState, "posY", {
    readonly: true,
    label: "pos y",
    format: (v: number) => Math.round(v).toString(),
    interval: 100,
  });
  folder.addBinding(liveState, "velMag", {
    readonly: true,
    label: "velocity",
    view: "graph",
    min: 0,
    max: 20,
    interval: 100,
  });
  folder.addBinding(liveState, "distToMouse", {
    readonly: true,
    label: "dist to cursor",
    format: (v: number) => `${Math.round(v)}px`,
    interval: 100,
  });
  folder.addBinding(liveState, "idleTime", {
    readonly: true,
    label: "idle frames",
    view: "graph",
    min: 0,
    max: 200,
    interval: 100,
  });
  folder.addBinding(liveState, "freerunActive", {
    readonly: true,
    label: "freerun",
    interval: 100,
  });
  folder.addBinding(liveState, "freerunTimer", {
    readonly: true,
    label: "freerun timer",
    interval: 100,
  });
  folder.addBinding(liveState, "bubbleVisible", { readonly: true, label: "bubble", interval: 100 });
  folder.addBinding(liveState, "pathLength", { readonly: true, label: "trail pts", interval: 100 });
  folder.addBinding(liveState, "obstacleCount", {
    readonly: true,
    label: "obstacles",
    interval: 100,
  });
  folder.addBinding(liveState, "frameCount", { readonly: true, label: "frame", interval: 100 });
}

function addBehaviorFolder(
  pane: PaneCompat,
  params: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
) {
  const folder = pane.addFolder({ title: "Behavior", expanded: true });
  bindChange(
    folder,
    params,
    "speed",
    { min: 1, max: 30, step: 1, label: "movement speed" },
    actions.setSpeed,
  );
  bindChange(
    folder,
    params,
    "idleThreshold",
    { min: 100, max: 5000, step: 100, label: "idle timeout (ms)" },
    actions.setIdleThreshold,
  );
  bindChange(folder, params, "meow", { label: "enable meowing" }, actions.setMeow);
  bindChange(
    folder,
    params,
    "volume",
    { min: 0, max: 1, step: 0.05, label: "sound volume" },
    actions.setVolume,
  );
  bindChange(
    folder,
    params,
    "freerunChance",
    { min: 0, max: 0.3, step: 0.005, label: "freerun chance" },
    actions.setFreerunChance,
  );
  bindChange(
    folder,
    params,
    "freerunDuration",
    { min: 10, max: 200, step: 5, label: "freerun duration (f)" },
    actions.setFreerunDuration,
  );
}

function addAppearanceFolder(
  pane: PaneCompat,
  params: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
) {
  const folder = pane.addFolder({ title: "Appearance", expanded: true });
  bindChange(
    folder,
    params,
    "scale",
    { min: 0.5, max: 3, step: 0.1, label: "scale" },
    actions.setScale,
  );
  bindChange(
    folder,
    params,
    "opacity",
    { min: 0, max: 1, step: 0.05, label: "opacity" },
    actions.setOpacity,
  );
  bindChange(
    folder,
    params,
    "rotationAmount",
    { min: 0, max: 45, step: 1, label: "max rotation (deg)" },
    actions.setRotationAmount,
  );
  bindChange(
    folder,
    params,
    "hueRotate",
    { min: 0, max: 360, step: 1, label: "hue rotate (deg)" },
    actions.setHueRotate,
  );
}

function addBubbleFolder(
  pane: PaneCompat,
  params: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
) {
  const folder = pane.addFolder({ title: "Bubbles", expanded: false });
  bindChange(folder, params, "bubbleEnabled", { label: "enabled" }, actions.setBubbleEnabled);
  bindChange(
    folder,
    params,
    "bubbleChance",
    { min: 0, max: 1, step: 0.05, label: "chance" },
    actions.setBubbleChance,
  );
  bindChange(
    folder,
    params,
    "bubbleDisplayFrames",
    { min: 30, max: 600, step: 10, label: "display frames" },
    actions.setBubbleDisplayFrames,
  );
  bindChange(
    folder,
    params,
    "bubbleCooldown",
    { min: 0, max: 500, step: 10, label: "cooldown frames" },
    actions.setBubbleCooldown,
  );
  bindChange(folder, params, "bubbleText", { label: "custom text" }, actions.setBubbleText);
}

function addVisibilityFolder(
  pane: PaneCompat,
  params: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
) {
  const folder = pane.addFolder({ title: "Visibility", expanded: false });
  bindChange(folder, params, "showCat", { label: "show cat" }, actions.setShowCat);
  bindChange(
    folder,
    params,
    "laserPointer",
    { label: "laser pointer cursor" },
    actions.setLaserPointer,
  );
}

function addAdvancedFolder(
  pane: PaneCompat,
  params: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
) {
  const folder = pane.addFolder({ title: "Advanced", expanded: false });
  bindChange(
    folder,
    params,
    "followDistance",
    { min: 10, max: 200, step: 5, label: "follow distance" },
    actions.setFollowDistance,
  );
  bindChange(
    folder,
    params,
    "animationSpeed",
    { min: 0.5, max: 2, step: 0.1, label: "animation speed" },
    actions.setAnimationSpeed,
  );
  bindChange(
    folder,
    params,
    "persistPosition",
    { label: "persist position" },
    actions.setPersistPosition,
  );
}

export function mountTweakpaneFolders(
  pane: PaneCompat,
  params: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
  liveState: CatLiveState,
) {
  addLiveStateFolder(pane, liveState);
  addBehaviorFolder(pane, params, actions);
  addAppearanceFolder(pane, params, actions);
  addBubbleFolder(pane, params, actions);
  addVisibilityFolder(pane, params, actions);
  addAdvancedFolder(pane, params, actions);
}

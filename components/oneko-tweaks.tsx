"use client";

import { useEffect, useRef } from "react";
import { Pane } from "tweakpane";
import { useOnekoPlayground } from "@/components/oneko-playground-context";

type PaneCompat = Pane & {
  addFolder: (options: { title: string; expanded?: boolean }) => {
    addBinding: <TTarget extends object, TKey extends keyof TTarget>(
      target: TTarget,
      key: TKey,
      options?: unknown,
    ) => { on: (eventName: "change", handler: (event: { value: TTarget[TKey] }) => void) => void };
  };
  refresh: () => void;
};

export function OnekoTweaks() {
  const { state, actions, liveStateRef } = useOnekoPlayground();
  const {
    speed,
    persistPosition,
    showCat,
    scale,
    opacity,
    rotationAmount,
    idleThreshold,
    meow,
    volume,
    bubbleChance,
    followDistance,
    animationSpeed,
    bubbleText,
    freerunChance,
    freerunDuration,
    bubbleEnabled,
    bubbleDisplayFrames,
    bubbleCooldown,
    hueRotate,
    laserPointer,
  } = state;
  const paneRef = useRef<HTMLDivElement>(null);
  const paneInstanceRef = useRef<PaneCompat | null>(null);
  const paramsRef = useRef({
    speed,
    idleThreshold,
    meow,
    volume,
    scale,
    opacity,
    rotationAmount,
    showCat,
    persistPosition,
    bubbleChance,
    followDistance,
    animationSpeed,
    bubbleText,
    freerunChance,
    freerunDuration,
    bubbleEnabled,
    bubbleDisplayFrames,
    bubbleCooldown,
    hueRotate,
    laserPointer,
  });

  useEffect(() => {
    if (!paneRef.current) return;

    const pane = new Pane({
      container: paneRef.current,
      title: "Oneko",
      expanded: true,
    }) as PaneCompat;

    paneInstanceRef.current = pane;

    // ── Live State ──────────────────────────────────────────────
    const stateFolder = pane.addFolder({ title: "Live State", expanded: true });

    stateFolder.addBinding(liveStateRef.current, "state", {
      readonly: true,
      label: "state",
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "posX", {
      readonly: true,
      label: "pos x",
      format: (v: number) => Math.round(v).toString(),
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "posY", {
      readonly: true,
      label: "pos y",
      format: (v: number) => Math.round(v).toString(),
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "velMag", {
      readonly: true,
      label: "velocity",
      view: "graph",
      min: 0,
      max: 20,
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "distToMouse", {
      readonly: true,
      label: "dist to cursor",
      format: (v: number) => `${Math.round(v)}px`,
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "idleTime", {
      readonly: true,
      label: "idle frames",
      view: "graph",
      min: 0,
      max: 200,
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "freerunActive", {
      readonly: true,
      label: "freerun",
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "freerunTimer", {
      readonly: true,
      label: "freerun timer",
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "bubbleVisible", {
      readonly: true,
      label: "bubble",
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "pathLength", {
      readonly: true,
      label: "trail pts",
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "obstacleCount", {
      readonly: true,
      label: "obstacles",
      interval: 100,
    });
    stateFolder.addBinding(liveStateRef.current, "frameCount", {
      readonly: true,
      label: "frame",
      interval: 100,
    });

    // ── Behavior ─────────────────────────────────────────────────
    const behaviorFolder = pane.addFolder({
      title: "Behavior",
      expanded: true,
    });

    behaviorFolder
      .addBinding(paramsRef.current, "speed", {
        min: 1,
        max: 30,
        step: 1,
        label: "movement speed",
      })
      .on("change", (e) => actions.setSpeed(e.value));

    behaviorFolder
      .addBinding(paramsRef.current, "idleThreshold", {
        min: 100,
        max: 5000,
        step: 100,
        label: "idle timeout (ms)",
      })
      .on("change", (e) => actions.setIdleThreshold(e.value));

    behaviorFolder
      .addBinding(paramsRef.current, "meow", {
        label: "enable meowing",
      })
      .on("change", (e) => actions.setMeow(e.value));

    behaviorFolder
      .addBinding(paramsRef.current, "volume", {
        min: 0,
        max: 1,
        step: 0.05,
        label: "sound volume",
      })
      .on("change", (e) => actions.setVolume(e.value));

    behaviorFolder
      .addBinding(paramsRef.current, "freerunChance", {
        min: 0,
        max: 0.3,
        step: 0.005,
        label: "freerun chance",
      })
      .on("change", (e) => actions.setFreerunChance(e.value));

    behaviorFolder
      .addBinding(paramsRef.current, "freerunDuration", {
        min: 10,
        max: 200,
        step: 5,
        label: "freerun duration (f)",
      })
      .on("change", (e) => actions.setFreerunDuration(e.value));

    // ── Appearance ───────────────────────────────────────────────
    const appearanceFolder = pane.addFolder({
      title: "Appearance",
      expanded: true,
    });

    appearanceFolder
      .addBinding(paramsRef.current, "scale", {
        min: 0.5,
        max: 3,
        step: 0.1,
        label: "scale",
      })
      .on("change", (e) => actions.setScale(e.value));

    appearanceFolder
      .addBinding(paramsRef.current, "opacity", {
        min: 0,
        max: 1,
        step: 0.05,
        label: "opacity",
      })
      .on("change", (e) => actions.setOpacity(e.value));

    appearanceFolder
      .addBinding(paramsRef.current, "rotationAmount", {
        min: 0,
        max: 45,
        step: 1,
        label: "max rotation (deg)",
      })
      .on("change", (e) => actions.setRotationAmount(e.value));

    appearanceFolder
      .addBinding(paramsRef.current, "hueRotate", {
        min: 0,
        max: 360,
        step: 1,
        label: "hue rotate (deg)",
      })
      .on("change", (e) => actions.setHueRotate(e.value));

    // ── Bubbles ──────────────────────────────────────────────────
    const bubbleFolder = pane.addFolder({ title: "Bubbles", expanded: false });

    bubbleFolder
      .addBinding(paramsRef.current, "bubbleEnabled", {
        label: "enabled",
      })
      .on("change", (e) => actions.setBubbleEnabled(e.value));

    bubbleFolder
      .addBinding(paramsRef.current, "bubbleChance", {
        min: 0,
        max: 1,
        step: 0.05,
        label: "chance",
      })
      .on("change", (e) => actions.setBubbleChance(e.value));

    bubbleFolder
      .addBinding(paramsRef.current, "bubbleDisplayFrames", {
        min: 30,
        max: 600,
        step: 10,
        label: "display frames",
      })
      .on("change", (e) => actions.setBubbleDisplayFrames(e.value));

    bubbleFolder
      .addBinding(paramsRef.current, "bubbleCooldown", {
        min: 0,
        max: 500,
        step: 10,
        label: "cooldown frames",
      })
      .on("change", (e) => actions.setBubbleCooldown(e.value));

    bubbleFolder
      .addBinding(paramsRef.current, "bubbleText", {
        label: "custom text",
      })
      .on("change", (e) => actions.setBubbleText(e.value));

    // ── Visibility ───────────────────────────────────────────────
    const visibilityFolder = pane.addFolder({
      title: "Visibility",
      expanded: false,
    });

    visibilityFolder
      .addBinding(paramsRef.current, "showCat", {
        label: "show cat",
      })
      .on("change", (e) => actions.setShowCat(e.value));

    visibilityFolder
      .addBinding(paramsRef.current, "laserPointer", {
        label: "laser pointer cursor",
      })
      .on("change", (e) => actions.setLaserPointer(e.value));

    // ── Advanced ─────────────────────────────────────────────────
    const advancedFolder = pane.addFolder({
      title: "Advanced",
      expanded: false,
    });

    advancedFolder
      .addBinding(paramsRef.current, "followDistance", {
        min: 10,
        max: 200,
        step: 5,
        label: "follow distance",
      })
      .on("change", (e) => actions.setFollowDistance(e.value));

    advancedFolder
      .addBinding(paramsRef.current, "animationSpeed", {
        min: 0.5,
        max: 2,
        step: 0.1,
        label: "animation speed",
      })
      .on("change", (e) => actions.setAnimationSpeed(e.value));

    advancedFolder
      .addBinding(paramsRef.current, "persistPosition", {
        label: "persist position",
      })
      .on("change", (e) => actions.setPersistPosition(e.value));

    return () => {
      pane.dispose();
      paneInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    paramsRef.current.speed = state.speed;
    paramsRef.current.idleThreshold = state.idleThreshold;
    paramsRef.current.meow = state.meow;
    paramsRef.current.volume = state.volume;
    paramsRef.current.scale = state.scale;
    paramsRef.current.opacity = state.opacity;
    paramsRef.current.rotationAmount = state.rotationAmount;
    paramsRef.current.showCat = state.showCat;
    paramsRef.current.persistPosition = state.persistPosition;
    paramsRef.current.bubbleChance = state.bubbleChance;
    paramsRef.current.followDistance = state.followDistance;
    paramsRef.current.animationSpeed = state.animationSpeed;
    paramsRef.current.bubbleText = state.bubbleText;
    paramsRef.current.freerunChance = state.freerunChance;
    paramsRef.current.freerunDuration = state.freerunDuration;
    paramsRef.current.bubbleEnabled = state.bubbleEnabled;
    paramsRef.current.bubbleDisplayFrames = state.bubbleDisplayFrames;
    paramsRef.current.bubbleCooldown = state.bubbleCooldown;
    paramsRef.current.hueRotate = state.hueRotate;
    paramsRef.current.laserPointer = state.laserPointer;
    paneInstanceRef.current?.refresh();
  }, [state]);

  return (
    <div className="fixed bottom-4 right-4 z-50 tabular-nums max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <div ref={paneRef} />
    </div>
  );
}

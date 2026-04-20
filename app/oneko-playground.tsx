"use client";

import dynamic from "next/dynamic";
import { OnekoPlaygroundProvider, useOnekoPlayground } from "@/components/oneko-playground-context";
import { ThemeToggle } from "@/components/theme-toggle";

const Oneko = dynamic(() => import("@/components/oneko"), { ssr: false });

const OnekoTweaks = dynamic(
  () => import("@/components/oneko-tweaks").then((mod) => mod.OnekoTweaks),
  { ssr: false },
);

function PlaygroundOneko() {
  const { state, liveStateRef } = useOnekoPlayground();
  if (!state.showCat) {
    return null;
  }
  return (
    <Oneko
      speed={state.speed}
      persistPosition={state.persistPosition}
      scale={state.scale}
      opacity={state.opacity}
      rotationAmount={state.rotationAmount}
      idleThreshold={state.idleThreshold}
      meow={state.meow}
      volume={state.volume}
      laserPointer={state.laserPointer}
      freerunChance={state.freerunChance}
      freerunDuration={state.freerunDuration}
      bubbleEnabled={state.bubbleEnabled}
      bubbleDisplayFrames={state.bubbleDisplayFrames}
      bubbleCooldown={state.bubbleCooldown}
      hueRotate={state.hueRotate}
      bubbleChance={state.bubbleChance}
      followDistance={state.followDistance}
      animationSpeed={state.animationSpeed}
      bubbleText={state.bubbleText}
      liveStateRef={liveStateRef}
    />
  );
}

function PlaygroundChrome() {
  return (
    <>
      <div className="pointer-events-none fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <PlaygroundOneko />
      <OnekoTweaks />
    </>
  );
}

export default function OnekoPlayground() {
  return (
    <OnekoPlaygroundProvider>
      <PlaygroundChrome />
    </OnekoPlaygroundProvider>
  );
}

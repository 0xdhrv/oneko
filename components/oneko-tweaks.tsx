"use client";

import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { useOnekoTweakpane } from "@/hooks/use-oneko-tweakpane";

export function OnekoTweaks() {
  const { state, actions, liveStateRef } = useOnekoPlayground();
  const paneRef = useOnekoTweakpane(state, actions, liveStateRef);

  return (
    <div className="fixed bottom-4 right-4 z-50 tabular-nums max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <div ref={paneRef} />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { thoughtsForProp } from "@/lib/oneko/custom-assets";
import { OnekoPlaygroundProvider, useOnekoPlayground } from "@/components/oneko-playground-context";
import { GlobalClickSound } from "@/components/global-click-sound";
import { OnekoLanding } from "@/components/oneko-landing";
import { ThemeToggle } from "@/components/theme-toggle";

const Oneko = dynamic(() => import("@/components/oneko"), { ssr: false });

function PlaygroundOneko() {
  const { state, liveStateRef } = useOnekoPlayground();
  if (!state.showCat) {
    return null;
  }
  const { showCat: _, spriteName: _name, ...config } = state;
  return (
    <Oneko {...config} bubbleText={thoughtsForProp(state.bubbleText)} liveStateRef={liveStateRef} />
  );
}

function PlaygroundChrome({ children }: { children: ReactNode }) {
  const { state } = useOnekoPlayground();
  return (
    <>
      <div className="pointer-events-none fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <GlobalClickSound enabled={state.meow} volume={state.volume} />
      <PlaygroundOneko />
      {children}
    </>
  );
}

export default function OnekoPlayground({ children }: { children?: ReactNode }) {
  return (
    <OnekoPlaygroundProvider>
      <PlaygroundChrome>{children ?? <OnekoLanding />}</PlaygroundChrome>
    </OnekoPlaygroundProvider>
  );
}

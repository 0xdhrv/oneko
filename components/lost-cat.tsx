"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import type { OnekoControls } from "@/components/oneko";

const Oneko = dynamic(() => import("@/components/oneko"), { ssr: false });

/** The 404 page has no cat, so one wanders in and waits by the way home. */
export function LostCat({ home }: { home: string }) {
  const walkHome = useCallback(
    (controls: OnekoControls | null) => {
      if (!controls) return;
      let active = true;
      void controls.goTo(home).then((arrived) => {
        if (arrived && active) controls.say("this way home");
      });
      return () => {
        active = false;
      };
    },
    [home],
  );

  return (
    <Oneko
      ref={walkHome}
      initialPos={{ x: 16, y: 16 }}
      persistPosition={false}
      bubbleEnabled={false}
    />
  );
}

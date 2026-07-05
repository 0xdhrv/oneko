import { useEffect, useRef, type MutableRefObject } from "react";
import { Pane } from "tweakpane";
import type {
  OnekoPlaygroundActions,
  OnekoPlaygroundState,
} from "@/components/oneko-playground-context";
import type { CatLiveState } from "@/components/oneko";
import { copyPlaygroundState } from "@/lib/oneko/playground-defaults";
import { mountTweakpaneFolders, type PaneCompat } from "@/lib/oneko/tweakpane-folders";

export function useOnekoTweakpane(
  state: OnekoPlaygroundState,
  actions: OnekoPlaygroundActions,
  liveStateRef: MutableRefObject<CatLiveState>,
) {
  const paneRef = useRef<HTMLDivElement>(null);
  const paneInstanceRef = useRef<PaneCompat | null>(null);
  const paramsRef = useRef<OnekoPlaygroundState>({ ...state });

  useEffect(() => {
    if (!paneRef.current) {
      return () => {};
    }

    const pane = new Pane({
      container: paneRef.current,
      title: "Oneko",
      expanded: true,
    }) as PaneCompat;
    paneInstanceRef.current = pane;
    mountTweakpaneFolders(pane, paramsRef.current, actions, liveStateRef.current);

    return () => {
      pane.dispose();
      paneInstanceRef.current = null;
    };
  }, [actions, liveStateRef]);

  useEffect(() => {
    copyPlaygroundState(paramsRef.current, state);
    paneInstanceRef.current?.refresh();
  }, [state]);

  return paneRef;
}

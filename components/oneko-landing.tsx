"use client";

import dynamic from "next/dynamic";
import { ArrowRight, Minus, Plus } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { OnekoWorld } from "@/components/oneko-world";
import { OnekoInstall } from "@/components/oneko-install";
import { advanceKonamiProgress, CATNIP_DIALOGUES } from "@/lib/landing-konami";

const OnekoTweaks = dynamic(() => import("./oneko-tweaks").then((mod) => mod.OnekoTweaks), {
  loading: () => (
    <p className="oneko-note" role="status">
      Gathering your cat’s comforts…
    </p>
  ),
});

type Panel = "customize" | "install";
const CATNIP_LEAVES = Array.from({ length: 18 }, (_, index) => index);

export function OnekoLanding() {
  const { state, actions } = useOnekoPlayground();
  // Disclosure state is deliberately not persisted: every visit starts quietly.
  const [panel, setPanel] = useState<Panel | null>(null);
  const [catnipParty, setCatnipParty] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const customizeRef = useRef<HTMLButtonElement>(null);
  const installRef = useRef<HTMLButtonElement>(null);
  const partyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let progress = 0;
    const listenForSecret = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))
      ) {
        progress = 0;
        return;
      }

      const next = advanceKonamiProgress(progress, event.code);
      progress = next.progress;
      if (!next.matched) return;

      // Keep the installable cat's developer shortcut independent from this page-only surprise.
      event.stopImmediatePropagation();
      setCatnipParty(true);
      setDialogueIndex(0);
      if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
      if (dialogueTimerRef.current) clearInterval(dialogueTimerRef.current);
      dialogueTimerRef.current = setInterval(
        () => setDialogueIndex((index) => (index + 1) % CATNIP_DIALOGUES.length),
        1650,
      );
      partyTimerRef.current = setTimeout(() => {
        setCatnipParty(false);
        if (dialogueTimerRef.current) clearInterval(dialogueTimerRef.current);
      }, 7000);
    };

    document.addEventListener("keydown", listenForSecret, { capture: true });
    return () => {
      document.removeEventListener("keydown", listenForSecret, { capture: true });
      if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
      if (dialogueTimerRef.current) clearInterval(dialogueTimerRef.current);
    };
  }, []);

  function closePanel() {
    (panel === "customize" ? customizeRef : installRef).current?.focus();
    setPanel(null);
  }

  return (
    <main
      className="oneko-playground"
      data-catnip-party={catnipParty || undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && panel) {
          event.preventDefault();
          closePanel();
        }
      }}
    >
      <header className="oneko-intro">
        <h1>
          oneko<span aria-hidden="true">.</span>
        </h1>
        <p>A tiny cat for your website.</p>
        {state.showCat && !state.paused && state.followCursor && (
          <>
            <p className="oneko-pointer-hint">Move your cursor. Your new friend will follow.</p>
            <p className="oneko-touch-hint">Tap an empty spot. Your new friend will follow.</p>
          </>
        )}
        <p className="oneko-reduced-hint">Your cat is resting while reduced motion is on.</p>
      </header>
      <div className="oneko-landing-actions">
        <button
          ref={customizeRef}
          type="button"
          aria-expanded={panel === "customize"}
          aria-controls="cat-customize"
          data-open={panel === "customize" || undefined}
          onClick={() => setPanel(panel === "customize" ? null : "customize")}
        >
          Customize cat
          <span className="oneko-action-mark" aria-hidden="true">
            {panel === "customize" ? <Minus size={14} /> : <Plus size={14} />}
          </span>
        </button>
        <button
          ref={installRef}
          type="button"
          aria-expanded={panel === "install"}
          aria-controls="cat-install"
          data-open={panel === "install" || undefined}
          onClick={() => setPanel(panel === "install" ? null : "install")}
        >
          Add a cat to your site
          <span className="oneko-action-arrow" aria-hidden="true">
            <ArrowRight size={14} />
          </span>
        </button>
      </div>
      {state.showCat && (state.paused || !state.followCursor) && panel !== "customize" && (
        <p className="oneko-away-note" role="status">
          {state.paused ? "Your cat is holding still." : "Your cat is staying cozy in one spot."}{" "}
          <button
            type="button"
            onClick={() =>
              actions.update(state.paused ? { paused: false } : { followCursor: true })
            }
          >
            {state.paused ? "Resume cat" : "Let your cat follow"}
          </button>
        </p>
      )}
      {catnipParty && (
        <>
          <div className="oneko-catnip-shower" aria-hidden="true">
            {CATNIP_LEAVES.map((leaf) => (
              <i key={leaf} />
            ))}
          </div>
          <p className="oneko-secret-note" role="status" data-oneko-zone="avoid">
            <span className="oneko-secret-speaker" aria-hidden="true">
              oneko
            </span>
            <span className="oneko-secret-dialogue" key={dialogueIndex}>
              {CATNIP_DIALOGUES[dialogueIndex]}
            </span>
          </p>
        </>
      )}
      {!state.showCat && panel !== "customize" && (
        <p className="oneko-away-note">
          Your cat is taking a break.{" "}
          <button type="button" onClick={() => actions.update({ showCat: true })}>
            Show cat
          </button>
        </p>
      )}
      <div
        id="cat-customize"
        className="oneko-reveal"
        data-oneko-zone={panel === "customize" ? "avoid" : undefined}
        hidden={panel !== "customize"}
      >
        {panel === "customize" && <OnekoTweaks onClose={closePanel} />}
      </div>
      <div
        id="cat-install"
        className="oneko-reveal oneko-install oneko-controls"
        data-oneko-zone={panel === "install" ? "avoid" : undefined}
        hidden={panel !== "install"}
      >
        {panel === "install" && <OnekoInstall />}
      </div>
      <div id="cat-zone-playground" />
      <OnekoWorld celebrating={catnipParty} />
    </main>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { OnekoWorld } from "@/components/oneko-world";
import { OnekoInstall } from "@/components/oneko-install";
import { advanceKonamiProgress, CATNIP_DIALOGUES } from "@/lib/landing-konami";
import {
  landingGroup,
  landingPage,
  landingRise,
  landingWorld,
  wordmark,
  wordmarkLetter,
} from "@/components/landing-motion";

type Panel = "install";
const CATNIP_LEAVES = Array.from({ length: 18 }, (_, index) => index);
const WORDMARK = ["o", "n", "e", "k", "o"];

export function OnekoLanding() {
  const { state, actions } = useOnekoPlayground();
  // Disclosure state is deliberately not persisted: every visit starts quietly.
  const [panel, setPanel] = useState<Panel | null>(null);
  const [catnipParty, setCatnipParty] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
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
    installRef.current?.focus();
    setPanel(null);
  }

  return (
    // "user" keeps the fades but drops movement for visitors who prefer reduced motion.
    <MotionConfig reducedMotion="user">
      <motion.main
        initial="hidden"
        animate="show"
        variants={landingPage}
        className="oneko-playground"
        data-catnip-party={catnipParty || undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented && panel) {
            event.preventDefault();
            closePanel();
          }
        }}
      >
        <motion.header className="oneko-intro" variants={landingGroup}>
          <motion.h1 aria-label="oneko" variants={wordmark}>
            {WORDMARK.map((letter, index) => (
              <motion.span
                key={index}
                className="oneko-wordmark-letter"
                aria-hidden="true"
                variants={wordmarkLetter}
              >
                {letter}
              </motion.span>
            ))}
            <motion.span aria-hidden="true" variants={wordmarkLetter}>
              .
            </motion.span>
          </motion.h1>
          <motion.p variants={landingRise}>A tiny pixel cat for your website.</motion.p>
          {state.showCat && !state.paused && state.followCursor && (
            <>
              <motion.p className="oneko-pointer-hint" variants={landingRise}>
                Move your cursor. Your new friend will follow.
              </motion.p>
              <motion.p className="oneko-touch-hint" variants={landingRise}>
                Tap an empty spot. Your new friend will follow.
              </motion.p>
            </>
          )}
          <motion.p className="oneko-reduced-hint" variants={landingRise}>
            Your cat is resting while reduced motion is on.
          </motion.p>
        </motion.header>
        <motion.div className="oneko-landing-actions" variants={landingRise}>
          <Link href="/studio">
            Customize cat
            <span className="oneko-action-arrow" aria-hidden="true">
              <ArrowRight size={14} />
            </span>
          </Link>
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
        </motion.div>
        {state.showCat && (state.paused || !state.followCursor) && (
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
        {!state.showCat && (
          <p className="oneko-away-note">
            Your cat is taking a break.{" "}
            <button type="button" onClick={() => actions.update({ showCat: true })}>
              Show cat
            </button>
          </p>
        )}
        <div
          id="cat-install"
          className="oneko-reveal oneko-install oneko-controls"
          data-oneko-zone={panel === "install" ? "avoid" : undefined}
          hidden={panel !== "install"}
        >
          {panel === "install" && <OnekoInstall />}
        </div>
        <div id="cat-zone-playground" />
        <motion.div className="oneko-landing-world" variants={landingWorld}>
          <OnekoWorld celebrating={catnipParty} />
        </motion.div>
      </motion.main>
    </MotionConfig>
  );
}

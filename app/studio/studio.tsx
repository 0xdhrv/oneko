"use client";

import Link from "next/link";
import { useRef } from "react";
import { useSpriteAppearance } from "@/hooks/use-sprite-appearance";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import OnekoPlayground from "../oneko-playground";
import { OnekoTweaks } from "@/components/oneko-tweaks";
import { OnekoWorld } from "@/components/oneko-world";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { getSkinSource, ONEKO_SKINS } from "@/lib/oneko/skins";

function Companion() {
  const { state, actions } = useOnekoPlayground();
  const portraitRef = useRef<HTMLSpanElement>(null);
  useSpriteAppearance(portraitRef, state.spriteSrc || getSkinSource(state.skin), state.hueRotate);
  const name = state.spriteSrc
    ? "Your custom companion"
    : (ONEKO_SKINS.find((skin) => skin.id === state.skin)?.name ?? "Classic");
  return (
    <aside className="studio-companion" aria-label="Your companion">
      <div className="studio-portrait" data-oneko-zone="avoid">
        <span className="studio-eyebrow">YOUR COMPANION</span>
        <div className="studio-portrait-stage" aria-hidden="true">
          <span
            ref={portraitRef}
            className="oneko-skin-preview"
            style={{
              opacity: state.opacity,
            }}
          />
          <span className="studio-portrait-shadow" />
        </div>
        <h2>{name}</h2>
        <p>
          {state.showCat
            ? state.paused
              ? "Taking a little pause"
              : state.followCursor
                ? "A little shadow for your cursor"
                : "Cozy right where they are"
            : "Your cat is taking a break"}
        </p>
        <div className="studio-preview-actions">
          <button
            type="button"
            onClick={() => actions.update({ paused: !state.paused })}
            disabled={!state.showCat}
          >
            {state.paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={() => actions.update({ showCat: !state.showCat })}>
            {state.showCat ? "Hide cat" : "Show cat"}
          </button>
        </div>
      </div>
      <p className="studio-play-hint">
        <span className="oneko-pointer-hint">
          Move your cursor to play. Your changes appear live.
        </span>
        <span className="oneko-touch-hint">
          Tap an empty spot to play. Your changes appear live.
        </span>
        <span className="oneko-reduced-hint">Your cat rests while reduced motion is on.</span>
      </p>
      <div id="cat-zone-playground" />
      <OnekoWorld />
    </aside>
  );
}

export default function OnekoStudio() {
  return (
    <OnekoPlayground>
      <main className="oneko-studio">
        <nav className="oneko-studio-nav" aria-label="Studio navigation">
          <Link href="/">
            <ArrowLeft size={14} aria-hidden="true" /> Playground
          </Link>
          <Link href="/docs">
            Cat docs <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <a href="https://dhrv.pw">Made by dhrv</a>
        </nav>
        <header className="studio-heading">
          <h1>
            oneko studio<span aria-hidden="true">.</span>
          </h1>
          <p>Make a little companion that feels like you.</p>
        </header>
        <div className="studio-workspace">
          <Companion />
          <OnekoTweaks />
        </div>
      </main>
    </OnekoPlayground>
  );
}

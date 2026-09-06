"use client";

import { useState } from "react";

function Cloud({ className }: { className: string }) {
  return (
    <svg className={className} width="48" height="16" viewBox="0 0 48 16">
      <path fill="var(--world-cloud)" d="M2 10h6V6h6V2h12v4h8v4h10v4H2z" />
      <path fill="var(--world-cloud-shade)" d="M2 14h42v2H2z" />
    </svg>
  );
}

function FishBowl() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32">
      <path fill="var(--world-outline)" d="M8 2h24v2h-2v4h4v4h2v12h-4v4H8v-4H4V12h2V8h4V4H8z" />
      <path fill="var(--world-glass)" d="M12 4h16v6h4v4h2v8h-4v4H10v-4H6v-8h2v-4h4z" />
      <path fill="var(--world-water)" d="M8 14h24v2h2v6h-4v4H10v-4H6v-6h2z" />
      <path fill="var(--world-highlight)" d="M10 10h2v4h-2zm-2 6h2v4H8zM12 4h16v2H12z" />
      <g className="oneko-world-fish">
        <path fill="var(--primary)" d="M16 16h8v2h2v2h-2v2h-8v-2h-2v2h-2v-6h2v2h2z" />
        <path fill="var(--world-ink)" d="M22 18h2v2h-2z" />
      </g>
      <path
        className="oneko-world-bubble"
        fill="var(--world-highlight)"
        d="M26 10h2v2h-2zM22 6h2v2h-2z"
      />
      <path fill="var(--world-outline)" d="M8 28h24v2H8z" />
    </svg>
  );
}

function CatPlayground() {
  return (
    <svg width="72" height="80" viewBox="0 0 72 80">
      <path fill="var(--world-outline)" d="M10 74h54v4H10zM18 26h10v48H18zM48 8h10v66H48z" />
      <path fill="var(--world-rope)" d="M20 28h6v44h-6zM50 10h6v62h-6z" />
      <path
        fill="var(--world-cardboard-shade)"
        d="M20 32h6v2h-6zm0 8h6v2h-6zm0 8h6v2h-6zm0 8h6v2h-6zm0 8h6v2h-6zM50 16h6v2h-6zm0 8h6v2h-6zm0 8h6v2h-6zm0 8h6v2h-6z"
      />
      <path fill="var(--world-outline)" d="M36 4h34v6H36zM2 22h34v6H2zM36 46h28v28H36z" />
      <path fill="var(--ring)" d="M36 2h34v4H36zM2 20h34v4H2zM38 48h24v24H38zM10 72h54v4H10z" />
      <path fill="var(--world-leaf-shade)" d="M38 68h24v4H38zM10 76h54v2H10z" />
      <path fill="var(--world-ink)" d="M44 54h12v2h2v16H42V56h2z" />
      <path fill="var(--world-rope)" d="M8 28h2v10H8z" />
      <g className="oneko-world-toy">
        <path fill="var(--world-outline)" d="M6 38h6v2h2v6h-2v2H6v-2H4v-6h2z" />
        <path fill="var(--accent)" d="M6 40h6v6H6z" />
        <path fill="var(--world-highlight)" d="M6 40h2v2H6z" />
      </g>
    </svg>
  );
}

function CardboardBox() {
  return (
    <svg width="56" height="44" viewBox="0 0 56 44">
      <path fill="var(--world-outline)" d="M10 12h36v28H10zM4 8h20v10H4zM32 8h20v10H32z" />
      <path fill="var(--world-cardboard-shade)" d="M12 14h32v24H12z" />
      <path fill="var(--world-ink)" d="M16 14h24v10H16z" />
      <path
        fill="var(--world-cardboard)"
        d="M12 22h32v16H12zM2 6h18v2h2v2h2v8H8v-2H6v-4H4V8H2zM36 6h18v2h-2v4h-2v4h-2v2H32v-8h2V8h2z"
      />
      <path fill="var(--world-rope)" d="M26 22h6v16h-6zM4 6h16v2H4zM36 6h16v2H36z" />
      <path fill="var(--world-cardboard-shade)" d="M14 34h8v2h-8zM36 26h4v2h-4z" />
      <path fill="var(--world-outline)" d="M10 40h36v2H10z" />
    </svg>
  );
}

function Catnip() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20">
      <path
        fill="var(--world-leaf-shade)"
        d="M7 4h2v10H7zM3 2h4v4H3zM9 0h4v4H9zM1 7h6v3H1zM9 6h6v4H9z"
      />
      <path fill="var(--ring)" d="M3 2h2v2H3zM9 0h2v2H9zM1 7h4v1H1zM9 6h4v2H9z" />
      <path fill="var(--world-outline)" d="M2 12h12v3h-1v4H3v-4H2z" />
      <path fill="var(--accent)" d="M3 13h10v2H3zM4 15h8v3H4z" />
    </svg>
  );
}

/** Landing-page scenery only; the installable cat stays independent of the garden. */
export function OnekoWorld({ celebrating = false }: { celebrating?: boolean }) {
  const [paused, setPaused] = useState(false);

  return (
    <figure
      className="oneko-world"
      data-paused={paused}
      data-celebrating={celebrating || undefined}
    >
      <div
        className="oneko-world-scene"
        role="img"
        aria-label="A little pixel garden with a swimming goldfish, a scratching playground with a dangling toy, a catnip plant, and an open cardboard box."
      >
        <div className="oneko-world-art" aria-hidden="true">
          <div className="oneko-world-sky">
            <Cloud className="oneko-world-cloud oneko-world-cloud-one" />
            <Cloud className="oneko-world-cloud oneko-world-cloud-two" />
            <svg className="oneko-world-sun" width="20" height="20" viewBox="0 0 20 20">
              <path fill="var(--primary)" d="M6 2h8v2h2v2h2v8h-2v2h-2v2H6v-2H4v-2H2V6h2V4h2z" />
              <path fill="var(--world-rope)" d="M6 4h8v2H6zM4 6h2v6H4z" />
            </svg>
            <svg className="oneko-world-moon" width="18" height="20" viewBox="0 0 18 20">
              <path fill="var(--world-rope)" d="M8 2h6v2h-4v4h2v4h4v2h-2v2H6v-2H4v-2H2V6h2V4h4z" />
            </svg>
            <span className="oneko-world-star oneko-world-star-one" />
            <span className="oneko-world-star oneko-world-star-two" />
            <span className="oneko-world-star oneko-world-star-three" />
          </div>
          <div className="oneko-world-fence" />
          <div className="oneko-world-ground" />
          <div className="oneko-world-props">
            <div className="oneko-world-prop oneko-world-bowl">
              <FishBowl />
            </div>
            <div className="oneko-world-prop oneko-world-perch">
              <CatPlayground />
            </div>
            <div className="oneko-world-prop oneko-world-box">
              <CardboardBox />
              <span className="oneko-world-cozy-spot" data-oneko-zone="attract" />
            </div>
          </div>
          <div className="oneko-world-catnip">
            <Catnip />
          </div>
          <span className="oneko-world-grass oneko-world-grass-one" />
          <span className="oneko-world-grass oneko-world-grass-two" />
          <span className="oneko-world-grass oneko-world-grass-three" />
        </div>
      </div>
      <figcaption className="oneko-world-caption">
        <span>A little room for little paws.</span>
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Wake the garden" : "Let the garden rest"}
        </button>
      </figcaption>
    </figure>
  );
}

"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShikiCode } from "./shiki-code";
import { useOnekoPlayground } from "./oneko-playground-context";

export function OnekoZones() {
  const { state, actions } = useOnekoPlayground();
  const [avoid, setAvoid] = useState(true);
  const [favorite, setFavorite] = useState(true);
  const [sampleHost, setSampleHost] = useState<HTMLElement | null>(null);
  useEffect(() => setSampleHost(document.getElementById("cat-zone-playground")), []);
  return (
    <div className="oneko-zone-demo">
      <p className="oneko-note">
        The play spots beside your companion are active while this section is open. Your cat keeps
        its paws outside the settings themselves.
      </p>
      <div className="oneko-zone-samples">
        <div>
          <label className="oneko-checkbox">
            <input
              type="checkbox"
              checked={avoid}
              onChange={(event) => setAvoid(event.target.checked)}
            />
            Keep paws out
          </label>
        </div>
        <div>
          <label className="oneko-checkbox">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(event) => setFavorite(event.target.checked)}
            />
            A favorite spot
          </label>
        </div>
      </div>
      {sampleHost &&
        createPortal(
          <section className="oneko-zone-demo" aria-label="Cat play spots">
            <p className="oneko-note">A spot for little paws, and a spot to leave alone.</p>
            <div className="oneko-zone-samples">
              <div
                className="oneko-zone-sample"
                data-oneko-zone={avoid ? "avoid" : undefined}
                data-zone-kind="avoid"
                data-active={avoid}
              >
                <span aria-hidden="true">×</span>
                <span>No paws here</span>
              </div>
              <div
                className="oneko-zone-sample"
                data-oneko-zone={favorite ? "attract" : undefined}
                data-zone-kind="attract"
                data-active={favorite}
              >
                <span aria-hidden="true">♡</span>
                <span>A cozy nap spot</span>
              </div>
            </div>
          </section>,
          sampleHost,
        )}
      <p className="oneko-note">
        Hover over the keep-out area: your cat stays outside, even with zoomies. Every few seconds,
        it may wander to its cozy spot. The laser toy keeps its attention while switched on.
      </p>
      <div className="oneko-setting-group">
        <label className="oneko-range" htmlFor="cat-zone-chance">
          <span>
            Chance of a cozy visit<output>{Math.round(state.zoneAttractionChance * 100)}%</output>
          </span>
          <input
            id="cat-zone-chance"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.zoneAttractionChance}
            onChange={(event) =>
              actions.update({ zoneAttractionChance: Number(event.target.value) })
            }
          />
        </label>
        <label className="oneko-range" htmlFor="cat-zone-duration">
          <span>
            Time for a visit<output>{state.zoneAttractionDuration / 1000}s</output>
          </span>
          <input
            id="cat-zone-duration"
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={state.zoneAttractionDuration}
            onChange={(event) =>
              actions.update({ zoneAttractionDuration: Number(event.target.value) })
            }
          />
        </label>
      </div>
      <details className="oneko-diary-disclosure">
        <summary>
          Give your cat its own spots
          <CaretDown className="oneko-disclosure-icon" size={14} aria-hidden="true" />
        </summary>
        <ShikiCode
          className="oneko-zone-code"
          code={
            '<div data-oneko-zone="avoid">No paws here</div>\n<div data-oneko-zone="attract">A cozy spot</div>'
          }
          language="html"
          label="Cat zone HTML"
        />
      </details>
    </div>
  );
}

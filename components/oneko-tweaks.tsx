"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import { useState } from "react";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { OnekoZones } from "@/components/oneko-zones";
import { OnekoSettings } from "@/components/oneko-settings";
import { getSkinSource, ONEKO_SKINS } from "@/lib/oneko/skins";

export function OnekoTweaks({ onClose }: { onClose: () => void }) {
  const { state, actions } = useOnekoPlayground();
  const [customize, setCustomize] = useState(false);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const selected = ONEKO_SKINS.find((skin) => skin.id === state.skin) ?? ONEKO_SKINS[0];

  return (
    <section className="oneko-controls" aria-label="Your cat">
      <div className="oneko-section-heading">
        <h2>Choose your cat</h2>
        <span aria-live="polite">{selected.name}</span>
      </div>
      <div className="oneko-skins" role="group" aria-label="Cat coat">
        {ONEKO_SKINS.map((skin) => (
          <button
            key={skin.id}
            type="button"
            className="oneko-skin"
            aria-pressed={state.skin === skin.id}
            title={skin.description}
            onClick={() => {
              actions.update({ skin: skin.id, hueRotate: 0 });
              setNotice("");
            }}
          >
            <span
              className="oneko-skin-preview"
              aria-hidden="true"
              style={{ backgroundImage: `url("${getSkinSource(skin.id)}")` }}
            />
            <span>{skin.name}</span>
            <span className="oneko-skin-mark" aria-hidden="true">
              {state.skin === skin.id && <Check size={10} weight="bold" />}
            </span>
          </button>
        ))}
      </div>

      <div className="oneko-toolbar" role="group" aria-label="Cat comforts">
        {(
          [
            ["meow", "Sound"],
            ["bubbleEnabled", "Bubbles"],
            ["laserPointer", "Laser toy"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="switch"
            data-sound-toggle={key === "meow" || undefined}
            aria-checked={state[key]}
            aria-label={label}
            onClick={() => actions.update({ [key]: !state[key] })}
          >
            <span className="oneko-switch" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
        <button
          className="oneko-visibility"
          type="button"
          onClick={() => actions.update({ showCat: !state.showCat })}
        >
          {state.showCat ? "Hide cat" : "Show cat"}
        </button>
      </div>
      {!state.showCat && (
        <p className="oneko-note" role="status">
          Your cat is taking a break. Choose Show cat to bring it back.
        </p>
      )}

      <details
        className="oneko-disclosure"
        onToggle={(event) => setZonesOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Cat zones</span>
          <span className="oneko-disclosure-hint">Keep-out areas & favorite spots</span>
          <CaretDown className="oneko-disclosure-icon" size={14} aria-hidden="true" />
        </summary>
        {zonesOpen && <OnekoZones />}
      </details>

      <details
        className="oneko-disclosure"
        onToggle={(event) => setCustomize(event.currentTarget.open)}
      >
        <summary>
          <span>More cat settings</span>
          <span className="oneko-disclosure-hint">Size, pace & personality</span>
          <CaretDown className="oneko-disclosure-icon" size={14} aria-hidden="true" />
        </summary>
        {customize && <OnekoSettings />}
      </details>

      <div className="oneko-settings-footer">
        <p role="status">{notice || "Your cat’s preferences are saved here."}</p>
        <button
          type="button"
          onClick={() => {
            actions.reset();
            setNotice("Your cat is back to its defaults.");
          }}
        >
          Reset cat
        </button>
        <button type="button" onClick={onClose}>
          Done
        </button>
      </div>
    </section>
  );
}

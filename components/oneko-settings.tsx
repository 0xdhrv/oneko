"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { SETTING_RANGES } from "@/lib/oneko/playground-defaults";
import type { CatActivityState, CatLiveState } from "@/lib/oneko/types";

type NumericSetting = keyof typeof SETTING_RANGES;
const percent = (value: number) => `${Math.round(value * 100)}%`;
const seconds = (value: number) => `${Number(value.toFixed(1))}s`;
const GROUPS: {
  title: string;
  fields: { key: NumericSetting; label: string; format?: (value: number) => string }[];
}[] = [
  {
    title: "Coat",
    fields: [
      { key: "scale", label: "Cat size", format: (v) => `${v}×` },
      { key: "opacity", label: "Coat opacity", format: percent },
      { key: "hueRotate", label: "Coat tint", format: (v) => `${v}°` },
      { key: "rotationAmount", label: "Wiggle", format: (v) => `${v}°` },
    ],
  },
  {
    title: "Paws & play",
    fields: [
      { key: "speed", label: "Chase speed" },
      { key: "followDistance", label: "Room for paws", format: (v) => `${v}px` },
      { key: "idleThreshold", label: "Rest after", format: (v) => seconds(v / 1000) },
      { key: "animationSpeed", label: "Grooming pace", format: (v) => `${v}×` },
      {
        key: "freerunChance",
        label: "Zoomies chance",
        format: (v) => `${Number((v * 100).toFixed(1))}%`,
      },
      { key: "freerunDuration", label: "Zoomies duration", format: (v) => seconds(v / 10) },
    ],
  },
  {
    title: "Bubbles & purrs",
    fields: [
      { key: "bubbleScale", label: "Bubble size", format: (v) => `${v}×` },
      { key: "volume", label: "Purr volume", format: percent },
      { key: "bubbleChance", label: "Chattiness", format: percent },
      { key: "bubbleDisplayFrames", label: "Bubble duration", format: (v) => seconds(v / 10) },
      { key: "bubbleCooldown", label: "Quiet between bubbles", format: (v) => seconds(v / 10) },
    ],
  },
];

const ACTIVITY_LABELS: Record<CatActivityState, string> = {
  idle: "Relaxing",
  moving: "Chasing",
  sleeping: "Napping",
  scratchSelf: "Grooming",
  tired: "Sleepy",
  alert: "Ears up",
  scratchWallN: "Scratching",
  scratchWallS: "Scratching",
  scratchWallE: "Scratching",
  scratchWallW: "Scratching",
  freerun: "Zoomies",
};

const DIARY_LABELS: Record<keyof CatLiveState, string> = {
  state: "Activity",
  posX: "Across the room",
  posY: "Down the room",
  velMag: "Paw speed",
  idleTime: "Resting ticks",
  distToMouse: "Distance to cursor",
  frameCount: "Cat ticks",
  freerunActive: "Having zoomies",
  freerunTimer: "Zoomies left",
  bubbleVisible: "Chatting",
  pathLength: "Paw steps ahead",
  obstacleCount: "Nearby furniture",
};

function CatDiary() {
  const { liveStateRef, state } = useOnekoPlayground();
  const [live, setLive] = useState({ ...liveStateRef.current });
  useEffect(() => {
    const timer = setInterval(() => setLive({ ...liveStateRef.current }), 500);
    return () => clearInterval(timer);
  }, [liveStateRef]);
  if (!state.showCat)
    return (
      <p className="oneko-note">Your cat is away. Show your cat to follow its little adventures.</p>
    );
  return (
    <dl className="oneko-diary">
      {(Object.keys(DIARY_LABELS) as (keyof CatLiveState)[]).map((key) => (
        <div key={key}>
          <dt>{DIARY_LABELS[key]}</dt>
          <dd>
            {typeof live[key] === "number"
              ? Math.round(live[key] as number)
              : typeof live[key] === "boolean"
                ? live[key]
                  ? "Yes"
                  : "No"
                : ACTIVITY_LABELS[live[key] as CatActivityState]}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function OnekoSettings({
  group: selectedGroup,
  showDiary = false,
}: {
  group?: "Coat" | "Paws & play" | "Bubbles & purrs";
  showDiary?: boolean;
}) {
  const { state, actions } = useOnekoPlayground();
  const [diary, setDiary] = useState(false);
  return (
    <div className="oneko-settings-body">
      {GROUPS.filter((group) => !selectedGroup || group.title === selectedGroup).map((group) => (
        <fieldset className="oneko-setting-group" key={group.title}>
          <legend>{group.title}</legend>
          {group.fields.map(({ key, label, format = String }) => {
            const [min, max, step] = SETTING_RANGES[key];
            const disabled =
              key === "volume"
                ? !state.meow
                : key.startsWith("bubble")
                  ? !state.bubbleEnabled
                  : false;
            return (
              <label className="oneko-range" key={key} htmlFor={`cat-${key}`}>
                <span>
                  {label}
                  <output htmlFor={`cat-${key}`}>{format(state[key])}</output>
                </span>
                <input
                  id={`cat-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={state[key]}
                  aria-valuetext={format(state[key])}
                  disabled={disabled}
                  onChange={(event) => actions.update({ [key]: Number(event.target.value) })}
                />
              </label>
            );
          })}
          {group.title === "Paws & play" && (
            <>
              {(
                [
                  ["paused", "Pause your cat"],
                  ["followCursor", "Let your cat follow the cursor"],
                  ["sleepEnabled", "Let your cat nap"],
                ] as const
              ).map(([key, label]) => (
                <label className="oneko-checkbox" key={key}>
                  <input
                    type="checkbox"
                    checked={state[key]}
                    onChange={(event) => actions.update({ [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
              {state.paused && (
                <p className="oneko-note">Your cat is holding still. Unpause to keep playing.</p>
              )}
              {!state.followCursor && (
                <p className="oneko-note">Your cat stays cozy in one spot.</p>
              )}
              <label className="oneko-checkbox">
                <input
                  type="checkbox"
                  checked={state.persistPosition}
                  onChange={(event) => actions.update({ persistPosition: event.target.checked })}
                />
                Remember the cat’s nap spot
              </label>
            </>
          )}
          {group.title === "Bubbles & purrs" && (
            <>
              <label className="oneko-text-field" htmlFor="cat-bubblePlacement">
                Where cat thoughts float
                <select
                  id="cat-bubblePlacement"
                  value={state.bubblePlacement}
                  disabled={!state.bubbleEnabled}
                  onChange={(event) =>
                    actions.update({
                      bubblePlacement: event.target.value as typeof state.bubblePlacement,
                    })
                  }
                >
                  <option value="auto">Where there’s room</option>
                  <option value="above">Above the ears</option>
                  <option value="below">Below the paws</option>
                </select>
              </label>
              {!state.meow && <p className="oneko-note">Turn on Sound above to hear your cat.</p>}
              {!state.bubbleEnabled && (
                <p className="oneko-note">Turn on Bubbles above to let your cat chat.</p>
              )}
            </>
          )}
        </fieldset>
      ))}
      {showDiary && (
        <details
          className="oneko-diary-disclosure"
          onToggle={(event) => setDiary(event.currentTarget.open)}
        >
          <summary>
            Cat diary <span>Live activity</span>
            <CaretDown className="oneko-disclosure-icon" size={14} aria-hidden="true" />
          </summary>
          {diary && <CatDiary />}
        </details>
      )}
    </div>
  );
}

"use client";

import {
  ArrowCounterClockwise,
  Microphone,
  Play,
  SpeakerSlash,
  Stop,
  UploadSimple,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { SOUND_POOLS } from "@/lib/oneko/constants";
import { MAX_CLIP_SECONDS, SOUND_MOMENTS, type CustomSound } from "@/lib/oneko/custom-sounds";
import {
  audioPeaks,
  clipSeconds,
  decodeAudio,
  MAX_SOURCE_BYTES,
  recordAudio,
  renderClip,
} from "@/lib/oneko/sound-clip";
import type { OnekoSoundEvent } from "@/lib/oneko/types";

const WAVEFORM_BARS = 120;
const MIN_SELECTION_SECONDS = 0.05;

type Draft = {
  moment: OnekoSoundEvent;
  name: string;
  buffer: AudioBuffer;
  peaks: number[];
  start: number;
  end: number;
  pitch: number;
};

function Waveform({ draft }: { draft: Draft }) {
  const { peaks, start, end, buffer } = draft;
  const path = peaks
    .map((peak, index) => `M${index + 0.5} ${20 - peak * 18}V${20 + peak * 18}`)
    .join("");
  return (
    <div className="sound-waveform" aria-hidden="true">
      <svg viewBox={`0 0 ${WAVEFORM_BARS} 40`} preserveAspectRatio="none">
        <path d={path} />
      </svg>
      <span
        style={{
          insetInlineStart: `${(start / buffer.duration) * 100}%`,
          insetInlineEnd: `${100 - (end / buffer.duration) * 100}%`,
        }}
      />
    </div>
  );
}

function ClipEditor({
  draft,
  onChange,
  onPreview,
  onSave,
  onCancel,
}: {
  draft: Draft;
  onChange: (changes: Partial<Draft>) => void;
  onPreview: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { start, end, pitch, buffer } = draft;
  const seconds = clipSeconds(start, end, pitch);
  return (
    <div className="sound-clip-editor">
      <Waveform draft={draft} />
      <label className="oneko-range" htmlFor="clip-start">
        <span>
          Start
          <output htmlFor="clip-start">{start.toFixed(2)}s</output>
        </span>
        <input
          id="clip-start"
          type="range"
          min={0}
          max={buffer.duration}
          step={0.01}
          value={start}
          onChange={(event) =>
            onChange({
              start: Math.min(Number(event.target.value), end - MIN_SELECTION_SECONDS),
            })
          }
        />
      </label>
      <label className="oneko-range" htmlFor="clip-end">
        <span>
          End
          <output htmlFor="clip-end">{end.toFixed(2)}s</output>
        </span>
        <input
          id="clip-end"
          type="range"
          min={0}
          max={buffer.duration}
          step={0.01}
          value={end}
          onChange={(event) =>
            onChange({
              end: Math.max(Number(event.target.value), start + MIN_SELECTION_SECONDS),
            })
          }
        />
      </label>
      <label className="oneko-range" htmlFor="clip-pitch">
        <span>
          Pitch
          <output htmlFor="clip-pitch">{pitch.toFixed(2)}×</output>
        </span>
        <input
          id="clip-pitch"
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={pitch}
          onChange={(event) => onChange({ pitch: Number(event.target.value) })}
        />
      </label>
      <p className="oneko-note">
        {(end - start) / pitch > MAX_CLIP_SECONDS
          ? `Your clip stops after ${MAX_CLIP_SECONDS} seconds.`
          : `Your clip runs ${seconds.toFixed(2)} seconds.`}{" "}
        Saved as small 8-bit audio, so it fits in a share link.
      </p>
      <div className="oneko-configuration-actions">
        <button type="button" onClick={onPreview}>
          Listen
        </button>
        <button type="button" onClick={onSave}>
          Use this clip
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SoundEditor() {
  const { state, actions } = useOnekoPlayground();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [recording, setRecording] = useState<OnekoSoundEvent | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const playing = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<AbortController | null>(null);
  const opening = useRef(0);

  useEffect(
    () => () => {
      playing.current?.pause();
      recorder.current?.abort();
      opening.current++;
    },
    [],
  );

  const play = (url: string) => {
    playing.current?.pause();
    const audio = new Audio(url);
    audio.volume = state.volume;
    playing.current = audio;
    audio.play().catch(() => setError("That sound couldn’t be played."));
  };

  const open = async (moment: OnekoSoundEvent, name: string, load: () => Promise<ArrayBuffer>) => {
    const request = ++opening.current;
    setError("");
    setNotice("");
    try {
      const buffer = await decodeAudio(await load());
      if (request !== opening.current) return;
      setDraft({
        moment,
        name: name.slice(0, 255),
        buffer,
        peaks: audioPeaks(buffer, WAVEFORM_BARS),
        start: 0,
        end: Math.min(buffer.duration, MAX_CLIP_SECONDS),
        pitch: 1,
      });
    } catch (failure) {
      if (request === opening.current) setError((failure as Error).message);
    }
  };

  const record = async (moment: OnekoSoundEvent) => {
    if (recording) {
      recorder.current?.abort();
      return;
    }
    const controller = new AbortController();
    recorder.current = controller;
    setRecording(moment);
    await open(moment, "Recording", () => recordAudio(controller.signal));
    if (recorder.current === controller) recorder.current = null;
    setRecording(null);
  };

  const setSound = (moment: OnekoSoundEvent, sound: CustomSound | null) => {
    const { [moment]: _, ...others } = state.soundClips;
    actions.update({ soundClips: sound ? { ...others, [moment]: sound } : others });
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSound(draft.moment, {
      src: await renderClip(draft.buffer, draft),
      name: draft.name,
    });
    actions.update({ meow: true });
    setNotice("Clip saved. Sound is on.");
    setDraft(null);
  };

  return (
    <div className="sound-editor">
      {error && (
        <p className="oneko-asset-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="oneko-note" role="status">
          {notice}
        </p>
      )}
      <ul className="sound-moments">
        {SOUND_MOMENTS.map(({ id, name, hint }) => {
          const custom = state.soundClips[id];
          const silent = custom?.src === "";
          const builtIn = `/cat-sounds/${SOUND_POOLS[id][0].split("/").pop()}`;
          return (
            <li key={id}>
              <div className="sound-moment">
                <div>
                  <span>{name}</span>
                  <span>{silent ? "Silent" : custom ? custom.name : hint}</span>
                </div>
                <div className="sound-moment-actions" role="group" aria-label={`${name} sound`}>
                  <button
                    type="button"
                    aria-label={`Play ${name}`}
                    title="Play"
                    disabled={silent}
                    onClick={() => play(custom?.src || builtIn)}
                  >
                    <Play size={16} aria-hidden="true" />
                  </button>
                  <label title="Upload a sound">
                    <input
                      type="file"
                      accept="audio/*"
                      aria-label={`Upload a sound for ${name}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        if (file.size > MAX_SOURCE_BYTES) {
                          setError("Choose a sound smaller than 8 MB.");
                          return;
                        }
                        void open(id, file.name, () => file.arrayBuffer());
                      }}
                    />
                    <UploadSimple size={16} aria-hidden="true" />
                  </label>
                  <button
                    type="button"
                    aria-label={recording === id ? "Stop recording" : `Record ${name}`}
                    title={recording === id ? "Stop recording" : "Record"}
                    aria-pressed={recording === id}
                    disabled={recording !== null && recording !== id}
                    onClick={() => record(id)}
                  >
                    {recording === id ? (
                      <Stop size={16} aria-hidden="true" />
                    ) : (
                      <Microphone size={16} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Silence ${name}`}
                    title="Silence"
                    aria-pressed={silent}
                    onClick={() => setSound(id, silent ? null : { src: "", name: "" })}
                  >
                    <SpeakerSlash size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Use the built-in ${name} sound`}
                    title="Back to the built-in sound"
                    disabled={!custom}
                    onClick={() => setSound(id, null)}
                  >
                    <ArrowCounterClockwise size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {draft?.moment === id && (
                <ClipEditor
                  draft={draft}
                  onChange={(changes) => setDraft({ ...draft, ...changes })}
                  onPreview={async () => play(await renderClip(draft.buffer, draft))}
                  onSave={saveDraft}
                  onCancel={() => setDraft(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
      <p className="oneko-note">
        Upload any audio file or record up to 4 seconds, then trim it down to a clip. Your sounds
        stay in this browser until you share them.
      </p>
    </div>
  );
}

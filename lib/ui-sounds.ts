import { defineSound, ensureReady } from "@web-kits/audio";

export type UiSound = "tap" | "toggle" | "tick";

// Short, quiet sounds for controls; the cat retains its own recorded purrs.
const sounds = {
  tap: defineSound({
    source: { type: "sine", frequency: { start: 650, end: 280 } },
    envelope: { attack: 0.002, decay: 0.045 },
    gain: 0.12,
  }),
  toggle: defineSound({
    source: { type: "sine", frequency: { start: 380, end: 620 } },
    envelope: { attack: 0.003, decay: 0.065 },
    gain: 0.12,
  }),
  tick: defineSound({
    source: { type: "sine", frequency: 800 },
    envelope: { attack: 0.001, decay: 0.025 },
    gain: 0.07,
  }),
};

export function createUiSoundPlayer() {
  let voice: ReturnType<(typeof sounds)[UiSound]> | undefined;
  let request = 0;

  return {
    async play(kind: UiSound, volume: number) {
      const currentRequest = ++request;
      await ensureReady();
      if (currentRequest !== request) return;

      voice?.stop();
      voice = sounds[kind]({ volume: Math.max(0, Math.min(1, volume)) });
    },
    stop() {
      request += 1;
      voice?.stop();
      voice = undefined;
    },
  };
}

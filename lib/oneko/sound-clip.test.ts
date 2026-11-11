import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIP_SAMPLE_RATE, isSoundClip, parseCustomSounds, soundsForProp } from "./custom-sounds";
import { downsample, encodeWav, recordAudio, shapeClip } from "./sound-clip";

const wavBytes = (clip: string) => Buffer.from(clip.split(",")[1], "base64");

describe("sound clips", () => {
  it("writes an 8-bit mono WAV header", () => {
    const bytes = wavBytes(encodeWav(new Float32Array(100)));
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WAVE");
    expect(bytes.readUInt16LE(22)).toBe(1);
    expect(bytes.readUInt32LE(24)).toBe(CLIP_SAMPLE_RATE);
    expect(bytes.readUInt16LE(34)).toBe(8);
    expect(bytes.readUInt32LE(40)).toBe(100);
    expect(bytes.length).toBe(144);
  });

  it("maps samples to unsigned bytes and clamps overshoot", () => {
    const bytes = wavBytes(encodeWav(Float32Array.of(0, 1, -1, 3)));
    expect([...bytes.subarray(44)]).toEqual([128, 255, 1, 255]);
  });

  it("averages down to the clip rate", () => {
    expect([...downsample(Float32Array.of(0, 1, 0, 1, 1, 1, 1, 1, 9))]).toEqual([0.5, 1]);
  });

  it("levels the peak and starts and ends at silence", () => {
    const shaped = shapeClip(new Float32Array(1000).fill(0.1));
    expect(Math.max(...shaped)).toBeCloseTo(0.95, 5);
    expect(shaped[0]).toBe(0);
    expect(shaped[999]).toBe(0);
  });

  it("leaves silence alone rather than dividing by nothing", () => {
    expect(shapeClip(new Float32Array(100)).every((sample) => sample === 0)).toBe(true);
  });

  it("accepts its own clips and refuses anything longer or otherwise", () => {
    expect(isSoundClip(encodeWav(new Float32Array(CLIP_SAMPLE_RATE * 2)))).toBe(true);
    expect(isSoundClip(encodeWav(new Float32Array(CLIP_SAMPLE_RATE * 3)))).toBe(false);
    expect(isSoundClip("data:audio/wav;base64,AAAAAAAAAAAAAAAA")).toBe(false);
    expect(isSoundClip("https://cats.example/a.wav")).toBe(false);
  });

  it("turns silent moments into empty pools for the runtime", () => {
    const clip = encodeWav(new Float32Array(10));
    const sounds = parseCustomSounds({
      pet: { src: clip, name: "chirp" },
      hiss: { src: "", name: "" },
    });
    expect(soundsForProp(sounds!)).toEqual({ pet: clip, hiss: [] });
  });
});

describe("recording", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stopTrack = vi.fn();
  const microphone = () =>
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: stopTrack }] }) },
    });

  it("says so when the browser cannot record", async () => {
    microphone();
    await expect(recordAudio(new AbortController().signal)).rejects.toThrow(
      "This browser can’t record sound.",
    );
  });

  it("explains a recording stopped before any sound arrived", async () => {
    microphone();
    vi.stubGlobal(
      "MediaRecorder",
      class {
        state = "inactive";
        mimeType = "audio/webm";
        ondataavailable: ((event: { data: Blob }) => void) | null = null;
        onstop: (() => void) | null = null;
        start() {
          this.state = "recording";
          // Stop pressed at once: the only chunk is empty.
          queueMicrotask(() => this.stop());
        }
        stop() {
          this.state = "inactive";
          this.ondataavailable?.({ data: new Blob([]) });
          this.onstop?.();
        }
      },
    );
    await expect(recordAudio(new AbortController().signal)).rejects.toThrow(
      "Nothing was recorded.",
    );
    expect(stopTrack).toHaveBeenCalled();
  });
});

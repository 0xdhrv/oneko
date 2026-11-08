import { CLIP_SAMPLE_RATE, MAX_CLIP_SECONDS } from "./custom-sounds";

/** Longest file or recording to open; trimming brings it down to a clip. */
export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_RECORDING_MS = 4000;
const RENDER_RATE = CLIP_SAMPLE_RATE * 4;
const FADE_SECONDS = 0.004;

/** Longest source to decode. A small, low-bitrate file can still decode to hundreds of MB. */
export const MAX_SOURCE_SECONDS = 60;

/** Reject long files from their metadata, before decoding them. Unreadable files pass to the decoder. */
export async function checkSourceDuration(file: Blob): Promise<void> {
  const url = URL.createObjectURL(file);
  try {
    const audio = new Audio();
    audio.preload = "metadata";
    const duration = await new Promise<number>((resolve) => {
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(Number.NaN);
      audio.src = url;
    });
    // Some recordings report Infinity until played; those are left to the byte limit.
    if (Number.isFinite(duration) && duration > MAX_SOURCE_SECONDS)
      throw new Error(
        `Choose a sound shorter than ${MAX_SOURCE_SECONDS} seconds, or trim it first.`,
      );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function decodeAudio(data: ArrayBuffer): Promise<AudioBuffer> {
  try {
    return await new OfflineAudioContext(1, 1, RENDER_RATE).decodeAudioData(data);
  } catch {
    throw new Error("That sound couldn’t be opened. Try an MP3, WAV, or OGG file.");
  }
}

/** Loudest sample in each of `count` slices, for drawing a waveform. */
export function audioPeaks(buffer: AudioBuffer, count: number): number[] {
  const samples = buffer.getChannelData(0);
  const size = Math.max(1, Math.floor(samples.length / count));
  return Array.from({ length: count }, (_, slice) => {
    let peak = 0;
    for (let index = slice * size; index < Math.min(samples.length, (slice + 1) * size); index++)
      peak = Math.max(peak, Math.abs(samples[index]));
    return peak;
  });
}

/** Averaging four samples doubles as the low-pass filter the lower rate needs. */
export function downsample(samples: Float32Array): Float32Array {
  const output = new Float32Array(Math.floor(samples.length / 4));
  for (let index = 0; index < output.length; index++)
    output[index] =
      (samples[index * 4] +
        samples[index * 4 + 1] +
        samples[index * 4 + 2] +
        samples[index * 4 + 3]) /
      4;
  return output;
}

/** Bring the peak up to full level and soften the edges so a trim doesn't click. */
export function shapeClip(samples: Float32Array): Float32Array {
  const peak = samples.reduce((loudest, sample) => Math.max(loudest, Math.abs(sample)), 0);
  const gain = peak > 0 ? 0.95 / peak : 0;
  const fade = Math.min(Math.round(FADE_SECONDS * CLIP_SAMPLE_RATE), samples.length / 2);
  return samples.map((sample, index) => {
    const edge = Math.min(index, samples.length - 1 - index);
    return sample * gain * (edge < fade ? edge / fade : 1);
  });
}

export function encodeWav(samples: Float32Array): string {
  const bytes = new Uint8Array(44 + samples.length);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++)
      bytes[offset + index] = value.charCodeAt(index);
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, CLIP_SAMPLE_RATE, true);
  view.setUint32(28, CLIP_SAMPLE_RATE, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples.length, true);
  samples.forEach((sample, index) => {
    bytes[44 + index] = Math.round(128 + 127 * Math.max(-1, Math.min(1, sample)));
  });
  return `data:audio/wav;base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`;
}

export function clipSeconds(start: number, end: number, pitch: number): number {
  return Math.min(MAX_CLIP_SECONDS, (end - start) / pitch);
}

/** Render the trimmed, pitched selection to a clip the cat can carry. */
export async function renderClip(
  buffer: AudioBuffer,
  { start, end, pitch }: { start: number; end: number; pitch: number },
): Promise<string> {
  const context = new OfflineAudioContext(
    1,
    Math.max(4, Math.ceil(clipSeconds(start, end, pitch) * RENDER_RATE)),
    RENDER_RATE,
  );
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = pitch;
  source.connect(context.destination);
  source.start(0, start, end - start);
  const rendered = await context.startRendering();
  return encodeWav(shapeClip(downsample(rendered.getChannelData(0))));
}

/** Record from the microphone until stopped or the limit passes. */
export async function recordAudio(signal: AbortSignal): Promise<ArrayBuffer> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error("The microphone isn’t available. Check this site’s permission and try again.");
  }
  try {
    // Stopped, or the editor closed, while the permission prompt was open.
    if (signal.aborted) throw new Error("Recording stopped before it started.");
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));
    const stop = () => recorder.state === "recording" && recorder.stop();
    recorder.start();
    const limit = setTimeout(stop, MAX_RECORDING_MS);
    signal.addEventListener("abort", stop, { once: true });
    await stopped;
    clearTimeout(limit);
    return await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer();
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

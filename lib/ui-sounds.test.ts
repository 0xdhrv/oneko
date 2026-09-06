import { beforeEach, describe, expect, it, vi } from "vitest";

const audioKit = vi.hoisted(() => ({
  ensureReady: vi.fn<() => Promise<void>>(),
  play: vi.fn(() => ({ stop: vi.fn() })),
}));

vi.mock("@web-kits/audio", () => ({
  defineSound: () => audioKit.play,
  ensureReady: audioKit.ensureReady,
}));

import { createUiSoundPlayer } from "./ui-sounds";

describe("createUiSoundPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioKit.ensureReady.mockResolvedValue();
  });

  it("waits for Audio Kit to be ready before starting a sound", async () => {
    let unlock = () => {};
    audioKit.ensureReady.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          unlock = resolve;
        }),
    );
    const player = createUiSoundPlayer();
    const playback = player.play("toggle", 0.5);

    expect(audioKit.ensureReady).toHaveBeenCalledOnce();
    expect(audioKit.play).not.toHaveBeenCalled();

    unlock();
    await playback;
    expect(audioKit.play).toHaveBeenCalledWith({ volume: 0.5 });
  });

  it("clamps volume and cancels pending playback when stopped", async () => {
    let unlock = () => {};
    audioKit.ensureReady.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          unlock = resolve;
        }),
    );
    const player = createUiSoundPlayer();
    const playback = player.play("tap", 2);
    player.stop();
    unlock();
    await playback;

    expect(audioKit.play).not.toHaveBeenCalled();

    audioKit.ensureReady.mockResolvedValue();
    await player.play("tap", 2);
    expect(audioKit.play).toHaveBeenCalledWith({ volume: 1 });
  });
});

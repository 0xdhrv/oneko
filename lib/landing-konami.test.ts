import { describe, expect, it } from "vitest";
import { KONAMI_SEQUENCE } from "./oneko/constants";
import { advanceKonamiProgress, CATNIP_DIALOGUES } from "./landing-konami";

describe("advanceKonamiProgress", () => {
  it("matches the complete sequence", () => {
    let progress = 0;
    let matched = false;

    for (const code of KONAMI_SEQUENCE) {
      ({ progress, matched } = advanceKonamiProgress(progress, code));
    }

    expect({ progress, matched }).toEqual({ progress: 0, matched: true });
  });

  it("resets after an unrelated key", () => {
    expect(advanceKonamiProgress(3, "KeyX")).toEqual({ progress: 0, matched: false });
  });

  it("keeps an overlapping first key", () => {
    expect(advanceKonamiProgress(1, "ArrowUp")).toEqual({ progress: 2, matched: false });
    expect(advanceKonamiProgress(4, "ArrowUp")).toEqual({ progress: 1, matched: false });
  });
});

describe("CATNIP_DIALOGUES", () => {
  it("keeps every surprise line cat-themed", () => {
    expect(CATNIP_DIALOGUES).toHaveLength(4);
    for (const dialogue of CATNIP_DIALOGUES) {
      expect(dialogue.toLowerCase()).toMatch(/catnip|cat|paws|zoomies|leaf|nap/);
    }
  });
});

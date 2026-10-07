import { expect, it } from "vitest";
import { ONEKO_DEFAULTS } from "./defaults";
import { createInitialCatState } from "./initial-state";
import { DEFAULT_ONEKO_PLAYGROUND_STATE } from "./playground-defaults";
import { createOnekoUsage } from "./usage";

it("keeps studio/component defaults aligned except the studio's initial thought", () => {
  for (const [key, value] of Object.entries(DEFAULT_ONEKO_PLAYGROUND_STATE)) {
    if (key === "bubbleText" || !(key in ONEKO_DEFAULTS)) continue;
    expect(value).toEqual(ONEKO_DEFAULTS[key as keyof typeof ONEKO_DEFAULTS]);
  }
  expect(createInitialCatState(ONEKO_DEFAULTS).enableMeow).toBe(false);
});

it("exports a minimal quiet component and explicitly exports opted-in sound and custom artwork", () => {
  const quiet = { ...DEFAULT_ONEKO_PLAYGROUND_STATE, bubbleText: "" };
  expect(createOnekoUsage(quiet)).toContain("<Oneko />");
  const enabled = createOnekoUsage({
    ...quiet,
    meow: true,
    spriteSrc: "/cat.png",
    spriteName: "My cat",
  });
  expect(enabled).toContain("  meow\n");
  expect(enabled).toContain('spriteSrc={"/cat.png"}');
  expect(enabled).not.toContain("spriteName");
});

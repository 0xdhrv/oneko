import { expect, test } from "@playwright/test";

// Launch flags force a separate worker, so this can't share a file with the other studio tests.
test.use({
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
  permissions: ["microphone"],
});

test("a recording opens in the trimmer and becomes a clip", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByRole("button", { name: "Record Hiss" }).click();
  const stop = page.getByRole("button", { name: "Stop recording" });
  await expect(stop).toBeVisible();
  await page.waitForTimeout(600);
  await stop.click();
  await page.getByRole("button", { name: "Use this clip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Clip saved" })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!));
  expect(saved.soundClips.hiss.name).toBe("Recording");
  expect(saved.soundClips.hiss.src).toMatch(/^data:audio\/wav;base64,/);
});

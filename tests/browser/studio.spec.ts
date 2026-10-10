import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { DEFAULT_ONEKO_PLAYGROUND_STATE } from "../../lib/oneko/playground-defaults";
import { getBundledSkinSource } from "../../lib/bundled-skins";

test("presets preserve artwork and user controls, and manual settings update selection", async ({
  page,
}) => {
  const initial = {
    ...DEFAULT_ONEKO_PLAYGROUND_STATE,
    skin: "calico",
    spriteSrc: getBundledSkinSource("calico"),
    spriteName: "my-cat.png",
    bubbleText: "my own thoughts",
    paused: true,
    followCursor: false,
    showCat: false,
  };
  await page.addInitScript(
    (settings) => localStorage.setItem("oneko:playground:v1", JSON.stringify(settings)),
    initial,
  );
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Behavior" }).click();
  const playful = page.getByRole("button", { name: /Playful/ });
  await playful.click();
  await expect(playful).toHaveAttribute("aria-pressed", "true");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!));
  expect(saved).toMatchObject({
    skin: initial.skin,
    spriteSrc: initial.spriteSrc,
    spriteName: initial.spriteName,
    bubbleText: initial.bubbleText,
    meow: false,
    paused: true,
    followCursor: false,
    showCat: false,
    speed: 18,
  });
  await page.getByRole("slider", { name: /Chase speed/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(playful).toHaveAttribute("aria-pressed", "false");
});

test("share links restore Unicode thoughts and built-in settings ahead of saved preferences", async ({
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: baseURL!,
  });
  const settings = {
    ...DEFAULT_ONEKO_PLAYGROUND_STATE,
    skin: "calico",
    speed: 18,
    bubbleText: "नमस्ते 🐈\nTreat time",
  };
  await page.addInitScript(
    (value) => localStorage.setItem("oneko:playground:v1", JSON.stringify(value)),
    settings,
  );
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Export" }).click();
  await page.getByRole("button", { name: "Copy share link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Share link copied" })).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(url).pathname).toBe("/studio");
  expect(new URL(url).hash).toMatch(/^#oneko=/);
  const recipient = await context.newPage();
  await recipient.addInitScript(
    (value) =>
      localStorage.setItem(
        "oneko:playground:v1",
        JSON.stringify({ ...value, skin: "ginger", speed: 1 }),
      ),
    settings,
  );
  await recipient.goto(url);
  await expect(
    recipient.getByRole("status").filter({ hasText: "Shared cat loaded" }),
  ).toBeVisible();
  await expect
    .poll(() => recipient.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!)))
    .toEqual(settings);
  await recipient.getByRole("tab", { name: "Thoughts" }).click();
  await expect(recipient.getByLabel("Your cat’s thoughts")).toHaveValue(settings.bubbleText);
  const second = { ...settings, skin: "black", speed: 6 };
  const secondURL = new URL(url);
  secondURL.hash = `oneko=${Buffer.from(JSON.stringify({ version: 1, settings: second })).toString("base64url")}`;
  await recipient.goto(secondURL.href);
  await expect
    .poll(() => recipient.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!)))
    .toEqual(second);
  secondURL.hash = "oneko=broken";
  await recipient.goto(secondURL.href);
  await expect(recipient.getByRole("status").filter({ hasText: "unchanged" })).toBeVisible();
  expect(
    await recipient.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!)),
  ).toEqual(second);
});

test("custom artwork round-trips through files and malformed imports leave the cat unchanged", async ({
  page,
}) => {
  const settings = {
    ...DEFAULT_ONEKO_PLAYGROUND_STATE,
    spriteSrc: getBundledSkinSource("calico"),
    spriteName: "my-cat.png",
    bubbleText: "Keep my artwork",
  };
  await page.addInitScript(
    (value) => localStorage.setItem("oneko:playground:v1", JSON.stringify(value)),
    settings,
  );
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Export" }).click();
  await page.getByRole("button", { name: "Copy share link" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Custom artwork travels in a configuration file" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download configuration" }).click();
  const download = await downloadPromise;
  const downloaded = await readFile((await download.path())!, "utf8");
  expect(JSON.parse(downloaded)).toEqual({ version: 1, settings });
  await page.getByRole("button", { name: "Reset cat", exact: true }).click();
  await page.getByLabel("Import configuration", { exact: true }).setInputFiles({
    name: "cat.json",
    mimeType: "application/json",
    buffer: Buffer.from(downloaded),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Configuration imported" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!)))
    .toEqual(settings);
  await page.getByLabel("Import configuration", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ version: 2, settings })),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Your cat has not changed" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!)),
  ).toEqual(settings);
});

test("invalid share links retain existing preferences on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const settings = {
    ...DEFAULT_ONEKO_PLAYGROUND_STATE,
    skin: "ginger",
    speed: 12,
  };
  await page.addInitScript(
    (value) => localStorage.setItem("oneko:playground:v1", JSON.stringify(value)),
    settings,
  );
  await page.goto("/studio#oneko=broken");
  await expect(
    page.getByRole("status").filter({ hasText: "Your settings are unchanged" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Behavior" }).click();
  await page.getByRole("button", { name: /Sleepy/ }).click();
  await expect(page.getByRole("button", { name: /Sleepy/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1")!).skin),
  ).toBe("ginger");
});

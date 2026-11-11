import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
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
  // Settings are written once edits settle.
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}")),
    )
    .toMatchObject({
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
  await page.getByRole("tab", { name: "Share" }).click();
  await page.getByRole("button", { name: "Copy share link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Share link copied" })).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(url).pathname).toBe("/studio");
  expect(new URL(url).hash).toMatch(/^#oneko2=/);
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
    .poll(() =>
      recipient.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}")),
    )
    .toEqual(settings);
  await recipient.getByRole("tab", { name: "Thoughts" }).click();
  await expect(recipient.getByLabel("Your cat’s thoughts")).toHaveValue(settings.bubbleText);
  const second = { ...settings, skin: "black", speed: 6 };
  const secondURL = new URL(url);
  secondURL.hash = `oneko=${Buffer.from(JSON.stringify({ version: 1, settings: second })).toString("base64url")}`;
  await recipient.goto(secondURL.href);
  await expect
    .poll(() =>
      recipient.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}")),
    )
    .toEqual(second);
  secondURL.hash = "oneko=broken";
  await recipient.goto(secondURL.href);
  await expect(recipient.getByRole("status").filter({ hasText: "unchanged" })).toBeVisible();
  expect(
    await recipient.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}")),
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
  await page.getByRole("tab", { name: "Share" }).click();
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
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}")),
    )
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
    await page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}")),
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
    await page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}").skin),
  ).toBe("ginger");
});

test("a ?sprite= link dresses the cat in a hosted coat after checking its size", async ({
  page,
}) => {
  const png = (skin: "ginger" | "classic") =>
    Buffer.from(getBundledSkinSource(skin).split(",")[1], "base64");
  await page.route("https://cats.oneko.test/**", (route) =>
    route.request().url().endsWith("ginger.png")
      ? route.fulfill({ body: png("ginger"), contentType: "image/png" })
      : // A 32 × 32 favicon is not a sprite sheet.
        readFile("public/icon-dark-32x32.png").then((body) =>
          route.fulfill({ body, contentType: "image/png" }),
        ),
  );
  await page.goto("/studio?sprite=https://cats.oneko.test/ginger.png");
  await expect(page.getByText("Wearing a coat from cats.oneko.test.")).toBeVisible();
  await expect
    .poll(() => page.locator("#oneko-react").evaluate((el) => el.style.backgroundImage))
    .toContain("https://cats.oneko.test/ginger.png");
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}").spriteSrc,
      ),
    )
    .toBe("https://cats.oneko.test/ginger.png");
  // The coat applies once; the link no longer carries it.
  expect(new URL(page.url()).searchParams.has("sprite")).toBe(false);

  await page.goto("/studio?sprite=https://cats.oneko.test/tiny.png");
  await expect(page.getByText(/Use a 256 × 128 sprite sheet/)).toBeVisible();
  await expect
    .poll(() => page.locator("#oneko-react").evaluate((el) => el.style.backgroundImage))
    .toContain("https://cats.oneko.test/ginger.png");
});

/** A half-second, two-tone WAV, standing in for a file someone picked. */
function toneFile() {
  const rate = 44100;
  const samples = Math.floor(rate / 2);
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + samples * 2, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const hertz = index < samples / 2 ? 440 : 880;
    wav.writeInt16LE(
      Math.round(Math.sin((index / rate) * hertz * 2 * Math.PI) * 16000),
      44 + index * 2,
    );
  }
  return { name: "chirp.wav", mimeType: "audio/wav", buffer: wav };
}

const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("oneko:playground:v1") ?? "{}"));

async function drawDot(page: Page, x: number, y: number) {
  await page.getByRole("application").scrollIntoViewIfNeeded();
  const box = (await page.getByRole("application").boundingBox())!;
  await page.mouse.click(box.x + (box.width * x) / 32, box.y + (box.height * y) / 32);
}

test("drawing dresses the cat live, undoes, and survives a trip through a coat", async ({
  page,
}) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  const before = await page.locator("#oneko-react").evaluate((el) => el.style.backgroundImage);

  const box = (await page.getByRole("application").boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 8, box.y + 8, { steps: 4 });
  await page.mouse.up();

  await expect.poll(async () => (await saved(page)).spriteName).toBe("Hand-drawn coat");
  const drawn = (await saved(page)).spriteSrc;
  expect(drawn).toMatch(/^data:image\/png;base64,/);
  await expect
    .poll(() => page.locator("#oneko-react").evaluate((el) => el.style.backgroundImage))
    .toContain(drawn.slice(0, 80));

  // A fast drag still paints every cell between pointer events.
  const topRow = await page.getByRole("application").evaluate((el) => {
    const context = el
      .querySelector<HTMLCanvasElement>("canvas:not(.sprite-onion)")!
      .getContext("2d")!;
    return Array.from({ length: 32 }, (_, x) => context.getImageData(x, 0, 1, 1).data[3]);
  });
  expect(topRow.every((alpha) => alpha === 255)).toBe(true);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(async () => (await saved(page)).spriteSrc).not.toBe(drawn);
  await expect(page.getByRole("button", { name: "Redo" })).toBeEnabled();
  await page.getByRole("button", { name: "Redo" }).click();
  await expect.poll(async () => (await saved(page)).spriteSrc).toBe(drawn);

  await page.getByRole("tab", { name: "Appearance" }).click();
  await page.getByRole("button", { name: "Calico" }).click();
  await expect.poll(async () => (await saved(page)).spriteSrc).toBe("");
  await page.getByRole("tab", { name: "Draw" }).click();
  await page.getByRole("button", { name: "Bring back your drawing" }).click();
  await expect.poll(async () => (await saved(page)).spriteSrc).toBe(drawn);
  expect(before).not.toContain(drawn.slice(0, 80));

  // A new drawing on another coat keeps the first one within reach.
  await page.getByRole("tab", { name: "Appearance" }).click();
  await page.getByRole("button", { name: "Calico" }).click();
  await expect.poll(async () => (await saved(page)).spriteSrc).toBe("");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  await drawDot(page, 16, 16);
  await expect.poll(async () => (await saved(page)).spriteSrc).not.toBe("");
  const second = (await saved(page)).spriteSrc;
  expect(second).not.toBe(drawn);
  // The newest drawing is the one being worn, so only the earlier one is offered.
  await expect(page.getByRole("button", { name: "Bring back your drawing" })).toHaveCount(0);
  await page.getByRole("button", { name: "Bring back the one before" }).click();
  // Settings save on a 300 ms timer, which runs late while parallel workers keep the CPU busy.
  await expect.poll(async () => (await saved(page)).spriteSrc, { timeout: 15_000 }).toBe(drawn);
});

test("a right click leaves the coat alone", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  const box = (await page.getByRole("application").boundingBox())!;
  await page.mouse.click(box.x + 8, box.y + 8, { button: "right" });
  await page.keyboard.press("Escape");
  const corner = await page.getByRole("application").evaluate((el) => {
    const canvas = el.querySelector<HTMLCanvasElement>("canvas:not(.sprite-onion)")!;
    return canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data[3];
  });
  expect(corner).toBe(0);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
});

test("a drawing saved before recent drawings were kept still comes back", async ({ page }) => {
  const legacy = getBundledSkinSource("ginger");
  await page.addInitScript((drawing) => {
    if (!localStorage.getItem("oneko:studio:drawings"))
      localStorage.setItem("oneko:studio:drawing", drawing);
  }, legacy);
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await page.getByRole("button", { name: "Bring back your drawing" }).click();
  await expect.poll(async () => (await saved(page)).spriteSrc).toBe(legacy);
});

test("mirroring and frame tools write to the right frames", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "Run right", exact: true }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "1 of 32 frames is empty" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mirror to “Run left”" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "2 of 32 frames are empty" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "of 32 frames" })).toHaveCount(0);
});

test("a recolor swaps one color across the whole coat", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  const swap = page.getByLabel("Swap this color everywhere");
  await expect(swap).toBeEnabled();
  // Two quick picks, as while dragging in the picker: the picker stays live in between.
  const disabledMidDrag = await swap.evaluate(async (input: HTMLInputElement) => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    const pick = (value: string) => {
      setValue.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    pick("#ff0000");
    await new Promise((resolve) => setTimeout(resolve, 50));
    const disabled = input.disabled;
    pick("#00ff00");
    return disabled;
  });
  expect(disabledMidDrag).toBe(false);
  await expect.poll(async () => (await saved(page)).spriteName).toBe("Hand-drawn coat");
  await expect(page.getByRole("button", { name: "#00ff00" })).toBeVisible();
  await expect(page.getByRole("button", { name: "#ff0000" })).toHaveCount(0);
});

test("a sound is trimmed, plays in the browser, and appears in exported code", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByLabel("Upload a sound for Pets").setInputFiles(toneFile());
  await expect(page.getByRole("button", { name: "Use this clip" })).toBeVisible();
  await page.getByRole("slider", { name: /^End/ }).fill("0.25");
  await page.getByRole("button", { name: "Use this clip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Clip saved" })).toBeVisible();
  await expect(page.getByText("chirp.wav")).toBeVisible();

  await expect.poll(async () => (await saved(page)).soundClips?.pet).toBeTruthy();
  const settings = await saved(page);
  expect(settings.meow).toBe(true);
  const { src } = settings.soundClips.pet;
  const seconds = await page.evaluate(
    (url) =>
      new Promise<number>((resolve, reject) => {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => reject(new Error("clip did not load"));
      }),
    src,
  );
  expect(seconds).toBeGreaterThan(0.2);
  expect(seconds).toBeLessThan(0.3);

  await page.getByRole("button", { name: "Silence Chasing" }).click();
  await expect
    .poll(async () => (await saved(page)).soundClips?.moving)
    .toEqual({ src: "", name: "" });
  await page.getByRole("tab", { name: "Share" }).click();
  await expect(page.locator(".oneko-install-section")).toContainText("sounds=");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByRole("button", { name: "Use the built-in Pets sound" }).click();
  await expect.poll(async () => (await saved(page)).soundClips?.pet).toBeUndefined();
});

test("the cat plays your clip instead of the built-in sound", async ({ page }) => {
  await page.addInitScript(() => {
    const played: string[] = [];
    Object.assign(window, { played });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      played.push(this.src);
      return play.call(this);
    };
  });
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByLabel("Upload a sound for Pets").setInputFiles(toneFile());
  await page.getByRole("button", { name: "Use this clip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Clip saved" })).toBeVisible();
  await page.getByRole("tab", { name: "Behavior" }).click();
  await page.getByRole("checkbox", { name: "Let keyboard users pet your cat" }).check();
  const cat = page.locator("#oneko-react");
  // Keep petting: an ambient sound can leave the cat briefly on cooldown.
  await expect(async () => {
    await cat.focus();
    await page.keyboard.press("Enter");
    const played = await page.evaluate(() => (window as unknown as { played: string[] }).played);
    expect(played.some((url) => url.startsWith("data:audio/wav"))).toBe(true);
  }).toPass({ timeout: 15_000 });
});

test("a link carries a drawn coat and sounds, and the recipient can go back to their cat", async ({
  browser,
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: baseURL!,
  });
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  await drawDot(page, 4, 4);
  await expect.poll(async () => (await saved(page)).spriteName).toBe("Hand-drawn coat");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByLabel("Upload a sound for Pets").setInputFiles(toneFile());
  await page.getByRole("button", { name: "Use this clip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Clip saved" })).toBeVisible();
  await page.getByRole("tab", { name: "Share" }).click();
  await page.getByRole("button", { name: "Copy share link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Share link copied" })).toContainText(
    "chat apps",
  );
  const url = await page.evaluate(() => navigator.clipboard.readText());
  await expect.poll(async () => (await saved(page)).soundClips?.pet).toBeTruthy();
  const sent = await saved(page);

  const friend = await browser.newContext({ baseURL });
  const recipient = await friend.newPage();
  const own = { ...DEFAULT_ONEKO_PLAYGROUND_STATE, skin: "ginger", speed: 3 };
  await recipient.addInitScript((value) => {
    if (!localStorage.getItem("oneko:playground:v1"))
      localStorage.setItem("oneko:playground:v1", JSON.stringify(value));
  }, own);
  await recipient.goto(url);
  await expect(
    recipient.getByRole("status").filter({ hasText: "Shared cat loaded" }),
  ).toBeVisible();
  await expect.poll(() => saved(recipient)).toEqual(sent);
  await expect
    .poll(() => recipient.locator("#oneko-react").evaluate((el) => el.style.backgroundImage))
    .toContain(sent.spriteSrc.slice(0, 80));
  expect(new URL(recipient.url()).hash).toBe("");

  // Edits made to a shared cat survive a reload rather than being replaced by the link.
  await recipient.getByRole("tab", { name: "Thoughts" }).click();
  await recipient.getByLabel("Your cat’s thoughts").fill("mine now");
  await expect.poll(async () => (await saved(recipient)).bubbleText).toBe("mine now");
  await recipient.reload();
  await recipient.getByRole("tab", { name: "Thoughts" }).click();
  await expect(recipient.getByLabel("Your cat’s thoughts")).toHaveValue("mine now");
  // The way back to the visitor's own cat survives the reload too.
  await expect(recipient.getByRole("button", { name: "Back to my cat" })).toBeVisible();

  await recipient.goto(url);
  await expect(
    recipient.getByRole("status").filter({ hasText: "Shared cat loaded" }),
  ).toBeVisible();
  await recipient.getByRole("button", { name: "Back to my cat" }).click();
  await expect.poll(async () => (await saved(recipient)).bubbleText).toBe("mine now");
  await expect(recipient.getByRole("button", { name: "Back to my cat" })).toHaveCount(0);
  await friend.close();
});

test("the share tab stays inside the editor with a drawn coat", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  await drawDot(page, 4, 4);
  await expect.poll(async () => (await saved(page)).spriteName).toBe("Hand-drawn coat");
  await page.getByRole("tab", { name: "Share" }).click();
  const editor = (await page.locator(".studio-editor").boundingBox())!;
  const copy = (await page.getByRole("button", { name: "Copy", exact: true }).boundingBox())!;
  expect(copy.x + copy.width).toBeLessThanOrEqual(editor.x + editor.width);
});

test("the keyboard draws on the cell the cursor shows", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  const canvas = page.getByRole("application");
  await expect(canvas).toHaveAttribute("aria-busy", "false");
  await canvas.focus();

  const box = (await canvas.boundingBox())!;
  const cursor = (await canvas.locator(".sprite-cursor").boundingBox())!;
  const cell = {
    x: Math.round((cursor.x - box.x) / (box.width / 32)),
    y: Math.round((cursor.y - box.y) / (box.height / 32)),
  };
  const alpha = () =>
    canvas.evaluate(
      (el, { x, y }) =>
        el
          .querySelector<HTMLCanvasElement>("canvas:not(.sprite-onion)")!
          .getContext("2d")!
          .getImageData(x, y, 1, 1).data[3],
      cell,
    );
  expect(await alpha()).toBe(255);
  await page.keyboard.press("e");
  await page.keyboard.press("Space");
  expect(await alpha()).toBe(0);
  // Screen readers hear the cell and what it now holds.
  const spoken = page.locator('.sprite-editor [aria-live="polite"]');
  await expect(spoken).toHaveText(`Column ${cell.x + 1}, row ${cell.y + 1}, empty`);
  await page.keyboard.press("ArrowRight");
  await expect(spoken).toHaveText(new RegExp(`^Column ${cell.x + 2}, row ${cell.y + 1}, `));
});

test("an unsaved clip waits while you visit another tab", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByLabel("Upload a sound for Pets").setInputFiles(toneFile());
  await expect(page.getByRole("button", { name: "Use this clip" })).toBeVisible();
  await page.getByRole("tab", { name: "Thoughts" }).click();
  await page.getByRole("tab", { name: "Sounds" }).click();
  await page.getByRole("button", { name: "Use this clip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Clip saved" })).toBeVisible();
});

test("the clip editor takes focus and hands it back to what opened it", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Sounds" }).click();
  const upload = page.getByLabel("Upload a sound for Pets");
  await upload.setInputFiles(toneFile());
  await expect(page.getByRole("slider", { name: /^Start/ })).toBeFocused();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(upload).toBeFocused();

  await upload.setInputFiles(toneFile());
  await page.getByRole("button", { name: "Use this clip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Clip saved" })).toBeVisible();
  await expect(upload).toBeFocused();
});

test.describe("on a touch screen", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });

  test("colors are tappable and text fields don't zoom the page", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("tab", { name: "Draw" }).click();
    await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
    const targets = page.locator(".sprite-swatches button, .sprite-side input[type='color']");
    const sizes = await targets.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect()),
    );
    expect(sizes.length).toBeGreaterThan(2);
    for (const { width, height } of sizes) {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator("#sprite-start")).toHaveCSS("font-size", "16px");
    await page.getByRole("tab", { name: "Thoughts" }).click();
    await expect(page.getByLabel("Your cat’s thoughts")).toHaveCSS("font-size", "16px");
  });
});

test("the editors fit a phone and draw by touch-sized canvas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(page.getByRole("application")).toHaveAttribute("aria-busy", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await drawDot(page, 16, 16);
  await expect.poll(async () => (await saved(page)).spriteName).toBe("Hand-drawn coat");
  await page.getByRole("tab", { name: "Sounds" }).click();
  await expect(page.getByLabel("Upload a sound for Pets")).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

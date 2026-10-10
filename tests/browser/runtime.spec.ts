import { expect, test } from "@playwright/test";
import { getBundledSkinSource } from "../../lib/bundled-skins";

const fixture = "http://127.0.0.1:3102";

test("motion preferences control both engines live and preserve appearance and cursor", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${fixture}/?laser&calico&no-persistence`);
  await expect(page.getByRole("button", { name: "Hide cat" })).toBeVisible();
  await expect(page.locator("#oneko-react")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("cursor", "crosshair");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#oneko-react")).toHaveCount(1);
  await expect(page.locator("#oneko-react")).toHaveCSS("opacity", "0.5");
  // Named skins load on demand; the calico sheet must replace the empty placeholder.
  await expect
    .poll(() => page.locator("#oneko-react").evaluate((el) => el.style.backgroundImage))
    .toContain(getBundledSkinSource("calico").slice(-64));
  const sprite = await page.locator("#oneko-react").evaluate((el) => el.style.backgroundImage);
  await expect(page.locator("body")).toHaveCSS("cursor", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#oneko-react")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("cursor", "crosshair");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#oneko-react")).toHaveCount(1);
  await expect(page.locator("#oneko-react")).toHaveCSS("background-image", sprite);
  await page.getByRole("button", { name: "Hide cat" }).click();
  await expect(page.locator("#oneko-react")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("cursor", "crosshair");
});

test("validates old position data, clamps it, and saves on unmount under the original key", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "oneko",
      JSON.stringify({
        nekoPosX: 200,
        nekoPosY: 220,
        idleAnimation: "invalid",
      }),
    );
    localStorage.setItem("second-cat", JSON.stringify({ version: 1, x: 1_000_000, y: -100 }));
  });
  await page.goto(`${fixture}/?paused`);
  const cat = page.locator("#oneko-react");
  await expect(cat).toHaveCSS("left", "184px");
  await expect(cat).toHaveCSS("top", "204px");
  await page.getByRole("button", { name: "Change storage key" }).click();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("oneko")!)))
    .toEqual({ version: 1, x: 200, y: 220 });
  const position = await cat.evaluate((el) => ({
    x: Number.parseFloat(el.style.left) + 16,
    y: Number.parseFloat(el.style.top) + 16,
  }));
  expect(position.x).toBeLessThanOrEqual(1280);
  expect(position.y).toBeGreaterThanOrEqual(0);
  await page.getByRole("button", { name: "Hide cat" }).click();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("second-cat")!)))
    .toEqual({ version: 1, ...position });
});

test("a fresh install stays silent and disabling persistence leaves storage alone", async ({
  page,
}) => {
  const sounds: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/cat-sounds/")) sounds.push(request.url());
  });
  await page.addInitScript(() => localStorage.setItem("oneko", "invalid saved data"));
  await page.goto(`${fixture}/?no-persistence`);
  const cat = page.locator("#oneko-react");
  await expect(cat).toBeVisible();
  const start = await cat.evaluate((el) => el.style.left);
  await page.mouse.move(1000, 200);
  await expect.poll(() => cat.evaluate((el) => el.style.left)).not.toBe(start);
  await page.getByRole("button", { name: "Hide cat" }).click();
  expect(sounds).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("oneko"))).toBe("invalid saved data");
});

test("reduced motion can leave a still, sleeping cat in place of the animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${fixture}/?rest&calico&no-persistence`);
  const resting = page.locator('div[aria-hidden="true"][style*="background-position"]');
  await expect(resting).toHaveCount(1);
  await expect(page.locator("#oneko-react")).toHaveCount(0);
  await expect(resting).toHaveCSS("pointer-events", "none");
  await expect(resting).toHaveCSS("background-position", "-64px 0px");
  expect(await resting.evaluate((el) => el.style.backgroundImage)).toContain(
    getBundledSkinSource("calico").slice(-64),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(resting).toHaveCount(0);
  await expect(page.locator("#oneko-react")).toHaveCount(1);
});

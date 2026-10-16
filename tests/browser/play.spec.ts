import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Same setup as reactions.spec.ts: the built public/oneko.js served from another origin.
const CDN = "https://cdn.oneko.test";
const SITE = "https://site.oneko.test/";
const QUIET = 'persist-position="false" freerun-chance="0" seasonal="false"';

async function open(page: Page, body: string) {
  await page.route(`${CDN}/**`, (route) =>
    route.fulfill({
      body: readFileSync(resolve("public", `.${new URL(route.request().url()).pathname}`)),
      contentType: "text/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
    }),
  );
  await page.route(SITE, (route) =>
    route.fulfill({
      body: `<!doctype html><body style="margin:0;min-height:100vh">${body}
        <script type="module" src="${CDN}/oneko.js"></script></body>`,
      contentType: "text/html",
    }),
  );
  await page.goto(SITE);
  await page.waitForFunction(() => customElements.get("oneko-cat"));
}

const cat = (page: Page) => page.locator("[data-oneko-cat]").first();
const centre = (page: Page) =>
  cat(page).evaluate((el: HTMLElement) => ({
    x: el.offsetLeft + 16,
    y: el.offsetTop + 16,
  }));
const bubbleText = (page: Page) =>
  page.evaluate(() => {
    const cat = document.querySelector("[data-oneko-cat]")!;
    const bubble = cat.nextElementSibling as HTMLElement;
    return bubble.style.opacity === "1" ? bubble.textContent : "";
  });
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
/** Record the element's events on window.events. */
const record = (page: Page, ...types: string[]) =>
  page.evaluate((list) => {
    (window as unknown as { events: string[] }).events = [];
    const el = document.querySelector("oneko-cat")!;
    for (const type of list)
      el.addEventListener(type, () =>
        (window as unknown as { events: string[] }).events.push(type),
      );
  }, types);
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { events: string[] }).events);

test("a seasonal cat wears a hat that follows its head, and can opt out", async ({ page }) => {
  await open(page, `<oneko-cat seasonal="halloween" persist-position="false"></oneko-cat>`);
  const hat = page.locator('[data-oneko-cat] [data-oneko-hat="halloween"]');
  await expect(hat).toHaveCount(1);
  await expect(hat).toBeVisible();
  await page.mouse.move(1100, 700, { steps: 4 });
  // The hat moves within the frame as the sprite changes.
  const offsets = new Set<string>();
  await expect
    .poll(
      async () => {
        offsets.add(await hat.evaluate((el: HTMLElement) => el.style.transform));
        return offsets.size;
      },
      { timeout: 10_000 },
    )
    .toBeGreaterThan(1);
  await page.locator("oneko-cat").evaluate((el) => el.setAttribute("seasonal", "false"));
  await expect(hat).toHaveCount(0);
});

test("a grabbable cat can be tossed, and a click pets it", async ({ page }) => {
  await open(page, `<oneko-cat grabbable ${QUIET}></oneko-cat>`);
  await record(page, "toss", "pet");
  await page.mouse.move(640, 450);
  await expect.poll(async () => distance(await centre(page), { x: 640, y: 450 })).toBeLessThan(40);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 60, start.y - 20, { steps: 2 });
  await page.mouse.move(start.x + 200, start.y - 60, { steps: 2 });
  await page.mouse.up();
  await expect.poll(() => events(page)).toContain("toss");
  await expect
    .poll(async () => (await centre(page)).x - start.x, { timeout: 5_000 })
    .toBeGreaterThan(260);

  // Call the cat over to a known spot, then click it without dragging.
  await page.mouse.move(300, 300, { steps: 3 });
  await expect
    .poll(async () => distance(await centre(page), { x: 300, y: 300 }), { timeout: 15_000 })
    .toBeLessThan(24);
  await page.waitForTimeout(500);
  const here = await centre(page);
  await page.mouse.move(here.x, here.y);
  await page.mouse.click(here.x, here.y);
  await expect.poll(() => events(page)).toContain("pet");
});

test("double-clicking empty space drops a treat the cat eats", async ({ page }) => {
  await open(
    page,
    `<p style="margin:40px"><span>Some words to double-click.</span></p><oneko-cat treats ${QUIET}></oneko-cat>`,
  );
  await record(page, "treat");
  // Double-clicking a word selects it; no treat.
  await page.getByText("Some words").dblclick();
  await expect(page.locator("[data-oneko-treat]")).toHaveCount(0);
  await page.mouse.dblclick(1000, 700);
  await expect(page.locator("[data-oneko-treat]")).toHaveCount(1);
  await expect(page.locator("[data-oneko-treat]")).toHaveCount(0, {
    timeout: 15_000,
  });
  expect(await events(page)).toEqual(["treat"]);
  expect(distance(await centre(page), { x: 1000, y: 700 })).toBeLessThan(40);
});

test("goTo walks to an element and say speaks there", async ({ page }) => {
  await open(
    page,
    `<button id="pricing" style="position:fixed;left:200px;top:120px">Pricing</button>
     <oneko-cat ${QUIET} bubble-enabled="false"></oneko-cat>`,
  );
  const arrived = await page.evaluate(async () => {
    const el = document.querySelector("oneko-cat") as HTMLElement & {
      goTo(target: string): Promise<boolean>;
      say(text: string): void;
    };
    const result = await el.goTo("#pricing");
    el.say("the plans live here");
    return result;
  });
  expect(arrived).toBe(true);
  const button = await page.locator("#pricing").boundingBox();
  expect(
    distance(await centre(page), {
      x: button!.x + button!.width / 2,
      y: button!.y + 40,
    }),
  ).toBeLessThan(40);
  // Bubbles are off, but say() still speaks.
  await expect.poll(() => bubbleText(page)).toBe("the plans live here");
  // The cat stays put until follow().
  await page.mouse.move(1100, 800, { steps: 3 });
  await page.waitForTimeout(800);
  expect(
    distance(await centre(page), {
      x: button!.x + button!.width / 2,
      y: button!.y + 40,
    }),
  ).toBeLessThan(40);
});

test("data-oneko-say makes the cat comment on what the pointer rests on", async ({ page }) => {
  await open(
    page,
    `<span data-oneko-say="ooh, shiny" style="position:fixed;left:300px;top:300px">Hover me</span>
     <oneko-cat ${QUIET} bubble-chance="0"></oneko-cat>`,
  );
  await page.getByText("Hover me").hover();
  await expect.poll(() => bubbleText(page)).toBe("ooh, shiny");
});

test("a resting cat knocks a knockable off its shelf, and it comes back", async ({ page }) => {
  // Make every random check pass, so the cat sets off at its first look around.
  await page.addInitScript(() => (Math.random = () => 0.1));
  await open(
    page,
    `<div id="mug" data-oneko-knockable style="position:fixed;left:400px;top:300px;width:40px;height:40px;background:tan"></div>
     <oneko-cat ${QUIET}></oneko-cat>`,
  );
  await page.mouse.move(250, 320);
  const animations = () => page.locator("#mug").evaluate((el) => el.getAnimations().length);
  await expect.poll(animations, { timeout: 20_000 }).toBe(1);
  await expect.poll(animations, { timeout: 10_000 }).toBe(0);
});

test("if it fits, it sits: a resting cat naps in a box", async ({ page }) => {
  await page.addInitScript(() => (Math.random = () => 0.1));
  await open(
    page,
    `<div data-oneko-box style="position:fixed;left:400px;top:300px;width:40px;height:40px;outline:1px solid"></div>
     <oneko-cat ${QUIET}></oneko-cat>`,
  );
  await page.evaluate(() => {
    const states: string[] = ((window as unknown as { states: string[] }).states = []);
    document
      .querySelector("oneko-cat")!
      .addEventListener("statechange", (event) => states.push((event as CustomEvent).detail.state));
  });
  await page.mouse.move(250, 320);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { states: string[] }).states), {
      timeout: 20_000,
    })
    .toContain("sleeping");
  expect(distance(await centre(page), { x: 420, y: 322 })).toBeLessThan(30);
});

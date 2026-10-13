import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Same setup as vanilla.spec.ts: the built public/oneko.js served from another origin.
const CDN = "https://cdn.oneko.test";
const SITE = "https://site.oneko.test/";

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
}

const cats = (page: Page) => page.locator("[data-oneko-cat]");
const centre = (page: Page, index = 0) =>
  cats(page)
    .nth(index)
    .evaluate((el: HTMLElement) => ({ x: el.offsetLeft + 16, y: el.offsetTop + 16 }));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

test("a second cat with chase=cat follows the first, not the cursor", async ({ page }) => {
  test.setTimeout(45_000);
  await open(
    page,
    `<oneko-cat persist-position="false" bubble-enabled="false" freerun-chance="0"></oneko-cat>
     <oneko-cat chase="cat" persist-position="false" bubble-enabled="false" freerun-chance="0" skin="calico"></oneko-cat>`,
  );
  await expect(cats(page)).toHaveCount(2);
  await expect(page.locator("#oneko-react")).toHaveCount(1);
  await page.mouse.move(1100, 120, { steps: 5 });
  // The leader heads for the cursor; the follower trails the leader instead of the cursor.
  await expect
    .poll(async () => distance(await centre(page, 0), { x: 1100, y: 120 }), { timeout: 20_000 })
    .toBeLessThan(60);
  await expect
    .poll(async () => distance(await centre(page, 1), await centre(page, 0)), { timeout: 10_000 })
    .toBeLessThan(60);
});

test("napWhileTyping puts the cat to sleep until the pointer moves", async ({ page }) => {
  await open(
    page,
    `<input aria-label="Message" style="position:fixed;top:20px;left:20px">
     <oneko-cat nap-while-typing persist-position="false" freerun-chance="0"></oneko-cat>
     <script type="module">
       window.states = [];
       document.querySelector("oneko-cat")
         .addEventListener("statechange", (event) => window.states.push(event.detail.state));
     </script>`,
  );
  await page.mouse.move(700, 500);
  await page.getByLabel("Message").click();
  await page.keyboard.type("hello cat");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { states: string[] }).states.at(-1)))
    .toBe("sleeping");
  await page.mouse.move(1200, 850, { steps: 5 });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { states: string[] }).states.at(-1)))
    .not.toBe("sleeping");
});

test("followFocus walks to the element that Tab reaches", async ({ page }) => {
  await open(
    page,
    `<button style="position:fixed;top:600px;left:1000px">Far button</button>
     <oneko-cat follow-focus persist-position="false" freerun-chance="0"></oneko-cat>`,
  );
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Far button" })).toBeFocused();
  await expect
    .poll(async () => distance(await centre(page), { x: 1040, y: 640 }), { timeout: 10_000 })
    .toBeLessThan(70);
});

test("perchOnHover climbs on a link the pointer rests on", async ({ page }) => {
  await open(
    page,
    `<a href="#treats" style="position:fixed;top:400px;left:600px;display:block;width:200px;height:40px">Treats</a>
     <oneko-cat perch-on-hover persist-position="false" freerun-chance="0"></oneko-cat>`,
  );
  await page.mouse.move(610, 435, { steps: 3 });
  // Sits on the top edge, centred on the link, rather than next to the pointer.
  await expect
    .poll(async () => distance(await centre(page), { x: 700, y: 388 }), { timeout: 10_000 })
    .toBeLessThan(30);
});

test("a pettable cat is reachable by keyboard, holds still, and purrs", async ({ page }) => {
  await open(page, `<oneko-cat pettable persist-position="false" freerun-chance="0"></oneko-cat>`);
  const petButton = page.getByRole("button", { name: "Pet the cat" });
  await expect(petButton).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(petButton).toBeFocused();
  const before = await centre(page);
  await page.mouse.move(1200, 800, { steps: 5 });
  await page.keyboard.press("Enter");
  await expect(petButton).toContainText("The cat purrs.");
  await page.waitForTimeout(500);
  expect(distance(await centre(page), before)).toBeLessThan(4);
});

test("data-oneko-toggle hides every cat and remembers it", async ({ page }) => {
  await open(
    page,
    `<button type="button" data-oneko-toggle>Hide the cat</button>
     <oneko-cat persist-position="false"></oneko-cat>`,
  );
  const toggle = page.getByRole("button", { name: "Hide the cat" });
  await expect(cats(page)).toHaveCount(1);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(cats(page)).toHaveCount(0);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Hide the cat" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(cats(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Hide the cat" }).click();
  await expect(cats(page)).toHaveCount(1);
});

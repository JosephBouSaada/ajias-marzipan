import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
const { chromium } = pw;
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:8811";
const OUT = ".impeccable/review/crops";
mkdirSync(OUT, { recursive: true });

/* page, selector, label */
const shots = [
  ["index", ".hero", "d-hero"],
  ["index", ".band.paste", "d-scale"],
  ["index", ".band.walnut:nth-of-type(3)", "d-occ"],
  ["index", ".close", "d-close"],
  ["catalogue", ".cat", "d-cat"],
  ["gallery", "#trays", "d-trays"],
  ["gallery", "#baptism", "d-bap"],
  ["gallery", ".grid-gal", "d-gal"],
  ["about", ".band.paste", "d-about"],
  ["order", "#sheet-wrap", "d-sheet"],
];

const browser = await chromium.launch();

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
for (const [p, sel, label] of shots) {
  await page.goto(`${BASE}/${p}.html`, { waitUntil: "networkidle" });
  if (p === "order") {
    await page.evaluate(() => {
      localStorage.setItem(
        "ajia.sheet.v2",
        JSON.stringify({
          items: { "rose-single": 120, "baby-favor": 60, "baby-tray": 2, "choc-dark": 3 },
          occasion: "Baptism or christening",
          date: "",
        })
      );
    });
    await page.reload({ waitUntil: "networkidle" });
  }
  await page.evaluate(() => document.querySelectorAll(".cell").forEach((c) => c.classList.add("is-struck")));
  await page.waitForTimeout(1000);
  const el = await page.$(sel);
  if (!el) {
    console.log("MISSING " + label + " " + sel);
    continue;
  }
  await el.screenshot({ path: `${OUT}/${label}.png` });
}
await ctx.close();

/* mobile first viewports */
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const mp = await mctx.newPage();
for (const p of ["index", "catalogue", "order"]) {
  await mp.goto(`${BASE}/${p}.html`, { waitUntil: "networkidle" });
  if (p === "order") {
    await mp.evaluate(() => {
      localStorage.setItem(
        "ajia.sheet.v2",
        JSON.stringify({ items: { "rose-single": 120, "baby-tray": 2 }, occasion: "", date: "" })
      );
    });
    await mp.reload({ waitUntil: "networkidle" });
  }
  await mp.evaluate(() => document.querySelectorAll(".cell").forEach((c) => c.classList.add("is-struck")));
  await mp.waitForTimeout(900);
  await mp.screenshot({ path: `${OUT}/m-${p}-top.png` });
  await mp.evaluate(() => window.scrollBy(0, 844));
  await mp.waitForTimeout(600);
  await mp.screenshot({ path: `${OUT}/m-${p}-2.png` });
}
await mctx.close();
await browser.close();
console.log("crops written");

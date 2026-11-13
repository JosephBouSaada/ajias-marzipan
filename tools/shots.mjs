import pw from "/opt/homebrew/lib/node_modules/playwright/index.js";
const { chromium } = pw;
import { mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://127.0.0.1:8811";
const OUT = ".impeccable/review";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const pages = ["index", "catalogue", "gallery", "about", "order"];
/* `slice` is the CSS-pixel height of one review panel; `out` is the pixel width the
   panel is delivered at. Both are chosen so a panel stays legible when it is read,
   which a downscaled full-page capture never is. `maxPanels` keeps a very long page
   from producing twenty files: past that the panels are spaced evenly and the
   filename carries the scroll offset so sampled coverage is obvious. */
const targets = [
  { name: "desktop", width: 1440, height: 900, dsf: 2, slice: 1250, out: 1250, maxPanels: 6 },
  { name: "mobile", width: 390, height: 844, dsf: 3, mobile: true, slice: 1150, out: 620, maxPanels: 6 },
];

const browser = await chromium.launch();
const problems = [];

for (const t of targets) {
  const ctx = await browser.newContext({
    viewport: { width: t.width, height: t.height },
    deviceScaleFactor: t.dsf,
    isMobile: !!t.mobile,
    hasTouch: !!t.mobile,
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && problems.push(`[${t.name}] ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`[${t.name}] PAGEERROR ${e.message}`));

  for (const p of pages) {
    await page.goto(`${BASE}/${p}.html`, { waitUntil: "networkidle" });
    // settle entrance motion so nothing reads as a missing element
    await page.evaluate(() =>
      document.querySelectorAll(".cell").forEach((c) => c.classList.add("is-struck"))
    );
    await page.evaluate(async () => {
      // force every lazy image to decode before we capture
      document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 900));
      window.scrollTo(0, 0);
      await Promise.all(
        [...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {}))
      );
    });
    await page.waitForTimeout(1000);

    // A full page downscaled to fit a thumbnail is not evidence. Capture the whole
    // page once for topology, then cut it into panels that stay legible.
    const full = `${OUT}/${t.name}-${p}.png`;
    await page.screenshot({ path: full, fullPage: true });
    execFileSync("sips", ["--resampleWidth", String(t.width), full, "--out", full], {
      stdio: "ignore",
    });

    const cssH = await page.evaluate(() => document.documentElement.scrollHeight);
    if (cssH > t.slice) {
      const wanted = Math.ceil(cssH / t.slice);
      const n = Math.min(wanted, t.maxPanels);
      const step = n > 1 ? (cssH - t.slice) / (n - 1) : 0;
      for (let i = 0; i < n; i++) {
        const y = Math.round(i * step);
        const h = Math.min(t.slice, cssH - y);
        if (h < 40) continue;
        const tag = wanted > t.maxPanels ? `-at${y}` : "";
        const f = `${OUT}/${t.name}-${p}-p${i + 1}${tag}.png`;
        await page.screenshot({ path: f, fullPage: true, clip: { x: 0, y, width: t.width, height: h } });
        execFileSync("sips", ["--resampleWidth", String(t.out), f, "--out", f], { stdio: "ignore" });
      }
    }
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? "PROBLEMS:\n" + [...new Set(problems)].join("\n") : "no console/page errors");
console.log("shots written to " + OUT);

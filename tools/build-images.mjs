#!/usr/bin/env node
/**
 * Ajia's Marzipan: image pipeline.
 *
 * Takes the owner's raw archive in assets/ and produces web-ready, semantically
 * named derivatives in img/. Run again after adding photos:  node tools/build-images.mjs
 *
 * Sources are never modified. HEIC is converted. Gallery-app screenshots are
 * excluded by name. Three sizes are emitted so the page never ships a 4MB photo
 * into a 400px slot.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "assets");
const OUT = join(ROOT, "img");

const SIZES = [
  { dir: "full", max: 1800, q: "72" },
  { dir: "card", max: 900, q: "70" },
  { dir: "thumb", max: 420, q: "66" },
];

/** source filename -> web slug. Anything not listed here is not published. */
const MAP = {
  // ── roses, natural almond ────────────────────────────────────────────────
  "IMG20260428174006.heic": "rose-trays-pair",
  "IMG20260428174035.heic": "rose-trays-angled",
  "IMG20260428174027.heic": "rose-trays-close",
  "IMG20260428173953.heic": "rose-tray-long",
  "IMG20260428173944.heic": "rose-trays-gold-pair",
  "IMG20260428173825.jpg": "cream-blossom-tray",
  "IMG20260428144530.jpg": "cream-blossom-work",
  "PXL_20230608_002046618.jpg": "baby-blue-parchment",
  "IMG_20200714_141007603.jpg": "rose-single-macro",
  "IMG_20200714_141032192.jpg": "rose-heart-cream",
  "IMG_20200818_212230955.jpg": "rose-tray-round",
  "IMG_20200818_212944849.jpg": "rose-tray-pearl",
  "IMG_20200818_212312179.jpg": "rose-tray-gold",
  "IMG_20200818_212140268.jpg": "rose-tray-wide",
  "Screenshot_2025-11-14-13-34-50-52_a23b203fd3aafc6dcb84e438dda678b6.jpg": "rose-box-six",
  "20191126_221801.jpg": "rose-favor-wrapped",
  "IMG_20210504_154954923.jpg": "rose-rows-dark",

  // ── baptism & christening ────────────────────────────────────────────────
  "DSC_0334.JPG": "baby-pink-macro",
  "DSC_0350.JPG": "baby-pink-single",
  "DSC_0345.JPG": "baby-grey-single",
  "DSC_0338.JPG": "baby-pink-pair",
  "DSC_0341.JPG": "baby-pink-two",
  "DSC_0330.JPG": "baby-tray-full",
  "DSC_0324.JPG": "baby-tray-round",
  "DSC_0319.JPG": "baby-tray-close",
  "DSC_0321.JPG": "baby-tray-massed",
  "DSC_0327.JPG": "baby-tray-rings",
  "IMG_20200819_171854817.jpg": "heart-sugared",
  "PXL_20230608_002058155.jpg": "baby-blue-rows",

  // ── weddings ─────────────────────────────────────────────────────────────
  "IMG_20210407_095341655.jpg": "wedding-couple-pair",
  "IMG_20210407_095413425.jpg": "wedding-couple-single",
  "IMG_20210218_192007720.jpg": "wedding-plaque",
  "IMG_20210410_115806749.jpg": "wedding-couple-favor",

  // ── first communion ──────────────────────────────────────────────────────
  "Screenshot_20200129-224038_Chrome.jpg": "communion-chalice",

  // ── flowers & long trays ─────────────────────────────────────────────────
  "IMG20251128233156.jpg": "dahlia-tray-long",
  "IMG_20251128_233505.jpg": "dahlia-tray-angled",
  "IMG_20251128_233342.jpg": "dahlia-tray-top",
  "IMG20251128233151.jpg": "dahlia-tray-alt",

  // ── fruit ────────────────────────────────────────────────────────────────
  "IMG_20210426_145700524.jpg": "grapes-colored-plate",
  "IMG_20210426_145710893.jpg": "grapes-colored-wide",
  "IMG_20210428_091258226.jpg": "grapes-wrapped-three",
  "IMG_20210428_213357381~2.jpg": "roses-colored-glass",
  "20200304_210556.jpg": "grapes-white-leaf",
  "IMG_20210430_155742540.jpg": "fruit-box-mixed",
  "IMG_20210430_155640404.jpg": "grapes-purple-tray",

  // ── christmas ────────────────────────────────────────────────────────────
  "IMG20251123094148.jpg": "christmas-tray-round",
  "IMG20251123180045.jpg": "christmas-plate-gold",
  "IMG20251123102450~2.jpg": "christmas-box-assorted",
  "IMG_20201217_114415932.jpg": "christmas-box-open",
  "IMG_20201217_114436653.jpg": "christmas-box-grid",
  "IMG_20201217_114759344.jpg": "christmas-box-ornament",
  "IMG_20201217_114826511.jpg": "christmas-box-snowman",
  "IMG_20201217_114606184.jpg": "christmas-hearts-plate",
  "IMG_20201217_114645208.jpg": "christmas-hearts-tree",
  "20191220_214754.jpg": "christmas-tray-coral",
  "20191220_212636.jpg": "christmas-boxes-six",

  // ── easter ───────────────────────────────────────────────────────────────
  "IMG_20260401_164229.jpg": "easter-bag-pastel",

  // ── chocolate-dipped ─────────────────────────────────────────────────────
  "IMG20251128235537.jpg": "chocolate-jar-dark",
  "IMG20251128235355.jpg": "chocolate-jar-open",
  "IMG20251128235520.jpg": "chocolate-jar-milk",
  "IMG20251123175923.jpg": "flower-jar-glass",

  // ── assorted gift boxes ──────────────────────────────────────────────────
  "IMG_20200624_193334549_MP.jpg": "box-pastel-cups",
  "IMG_20200624_193547511_MP.jpg": "box-pink-open",
  "IMG_20200624_193400790_MP.jpg": "box-three-assorted",
  "IMG_20201216_172420154.jpg": "holiday-wrapped-plate",

  // ── party & custom ───────────────────────────────────────────────────────
  "20200304_225008.jpg": "party-teal-tray",

  // ── process ──────────────────────────────────────────────────────────────
  "IMG_20210410_073544036.jpg": "process-tray-plain",
};

/** Present in assets/ but deliberately never published. */
const EXCLUDED = new Set([
  "Screenshot_20200211-115813_Gallery.jpg", // phone gallery app UI
  "Screenshot_20200211-115821_Gallery.jpg", // phone gallery app UI
  "Screenshot_2026-05-15-14-58-11-53_965bbf4d18d205f782c6b8409c5773a4.jpg", // photos app chrome
  "Screenshot_2026-05-15-14-58-17-32_965bbf4d18d205f782c6b8409c5773a4.jpg", // photos app chrome
  ".DS_Store",
]);

for (const s of SIZES) mkdirSync(join(OUT, s.dir), { recursive: true });

const present = readdirSync(SRC).filter((f) => !f.startsWith("."));
let written = 0;
const missing = [];

for (const [file, slug] of Object.entries(MAP)) {
  const src = join(SRC, file);
  if (!existsSync(src)) {
    missing.push(file);
    continue;
  }
  for (const s of SIZES) {
    const dest = join(OUT, s.dir, `${slug}.jpg`);
    if (existsSync(dest) && statSync(dest).mtimeMs > statSync(src).mtimeMs) continue;
    execFileSync("sips", [
      "-s", "format", "jpeg",
      "-s", "formatOptions", s.q,
      "-Z", String(s.max),
      src, "--out", dest,
    ], { stdio: "ignore" });
    written += 1;
  }
}

const unmapped = present.filter((f) => !MAP[f] && !EXCLUDED.has(f));

console.log(`wrote ${written} derivatives for ${Object.keys(MAP).length} photographs`);
if (missing.length) console.log(`missing sources: ${missing.join(", ")}`);
if (unmapped.length) console.log(`unmapped (near-duplicates, not published): ${unmapped.length}`);

/**
 * Export promo HTML → PNG via Playwright.
 * Run: node docs/promos/export-png.mjs
 */
import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "../..");
const outPromo = resolve(__dir, "../promo");
const outRoot = root;

mkdirSync(outPromo, { recursive: true });
mkdirSync(resolve(outPromo, "xhs"), { recursive: true });

const jobs = [
  { html: resolve(__dir, "v2/github-banner.html"), out: resolve(outRoot, "github-banner.png"), width: 1600, height: 640 },
  { html: resolve(__dir, "v2/github-banner.html"), out: resolve(outPromo, "github-banner.png"), width: 1600, height: 640 },
  { html: resolve(__dir, "v2/banner-install-cta.html"), out: resolve(outPromo, "banner-install-cta.png"), width: 1200, height: 630 },
  { html: resolve(__dir, "v2/banner-pain-compare.html"), out: resolve(outPromo, "banner-pain-compare.png"), width: 1600, height: 640 },
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => {
    const names = ["cover", "pain", "what", "features", "who", "how", "cta"];
    return {
      html: resolve(__dir, `xhs/slide-0${n}-${names[n - 1]}.html`),
      out: resolve(outPromo, "xhs", `slide-0${n}.png`),
      width: 1080,
      height: 1440,
    };
  }),
];

const browser = await chromium.launch({ headless: true });

for (const job of jobs) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: job.width, height: job.height });
  await page.goto(`file://${job.html}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  const frame = page.locator(".frame").first();
  await frame.screenshot({ path: job.out, type: "png" });
  await page.close();
  console.log("Wrote", job.out);
}

await browser.close();
console.log("Done.");

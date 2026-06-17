/**
 * One-off: record a short walkthrough of docs/demo-showcase.html → demo-walkthrough.webm
 * Run: npx playwright@1.49.1 install chromium && node docs/record-demo-video.mjs
 */
import { chromium } from "playwright";
import { renameSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const showcase = resolve(__dir, "demo-showcase.html");
const outWebm = resolve(__dir, "demo-walkthrough.webm");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: __dir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
await page.goto(`file://${showcase}`);
await page.waitForTimeout(1200);
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.55));
  await page.waitForTimeout(900);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await context.close();
await browser.close();

const vids = readdirSync(__dir).filter((f) => f.endsWith(".webm"));
const latest = vids.sort().at(-1);
if (latest) {
  renameSync(resolve(__dir, latest), outWebm);
  console.log("Wrote", outWebm);
} else {
  console.error("No video file produced");
  process.exit(1);
}

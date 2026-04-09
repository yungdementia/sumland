import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "temporary screenshots");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";

// Find next screenshot number
const existing = fs.readdirSync(dir).filter((f) => f.startsWith("screenshot-"));
let num = 1;
for (const f of existing) {
  const m = f.match(/^screenshot-(\d+)/);
  if (m) num = Math.max(num, parseInt(m[1]) + 1);
}

const suffix = label ? `-${label}` : "";
const filename = `screenshot-${num}${suffix}.png`;

// Try Brave, then Edge
const browsers = [
  "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];

let execPath;
for (const p of browsers) {
  if (fs.existsSync(p)) { execPath = p; break; }
}
if (!execPath) { console.error("No Chromium browser found"); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: execPath,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

// Scroll full page to trigger lazy loads / animations
await page.evaluate(async () => {
  await new Promise((resolve) => {
    let totalHeight = 0;
    const distance = 400;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      totalHeight += distance;
      if (totalHeight >= document.body.scrollHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 100);
  });
});

await new Promise((r) => setTimeout(r, 1000));

const filePath = path.join(dir, filename);
await page.screenshot({ path: filePath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${filePath}`);

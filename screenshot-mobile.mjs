import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "temporary screenshots");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url = process.argv[2] || "http://localhost:3000";
const width = parseInt(process.argv[3]) || 375;
const label = process.argv[4] || `mobile-${width}`;

const existing = fs.readdirSync(dir).filter((f) => f.startsWith("screenshot-"));
let num = 1;
for (const f of existing) {
  const m = f.match(/^screenshot-(\d+)/);
  if (m) num = Math.max(num, parseInt(m[1]) + 1);
}

const filename = `screenshot-${num}-${label}.png`;

const browsers = [
  "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];

console.log("Searching for browsers...");
for (const p of browsers) {
  console.log(`  ${p} → ${fs.existsSync(p) ? "FOUND" : "not found"}`);
}

let execPath;
for (const p of browsers) {
  if (fs.existsSync(p)) { execPath = p; break; }
}
if (!execPath) { console.error("No Chromium browser found"); process.exit(1); }

const tmpDir = path.join(dir, ".tmp-profile-" + Date.now());
const browser = await puppeteer.launch({
  executablePath: execPath,
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--headless=new",
    "--user-data-dir=" + tmpDir,
  ],
});

const page = await browser.newPage();
await page.setViewport({ width, height: 812 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

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

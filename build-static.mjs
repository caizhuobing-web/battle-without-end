import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist");
const files = [
  "index.html",
  "game.css",
  "game-core.js",
  "game-features.js",
  "alpha-039-systems.js",
  "alpha-041-systems.js",
  "alpha-043-systems.js",
  "alpha-044-systems.js",
  "alpha-045-systems.js",
  "background-progress.js",
  "sw.js",
  "manifest.webmanifest",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await Promise.all(files.map((file) => cp(path.join(root, file), path.join(out, file))));

// 独立小游戏《万变之种》随主站一并发布到 /evo/，不含内部评审文档。
const evoFiles = ["index.html", "style.css", "data.js", "sim.js", "audio.js", "pixel.js", "ui.js", "font.woff2", "FONT-LICENSE.txt"];
await mkdir(path.join(out, "evo"), { recursive: true });
await Promise.all(evoFiles.map((file) => cp(path.join(root, "evo", file), path.join(out, "evo", file))));

const html = await readFile(path.join(out, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(path.join(out, "manifest.webmanifest"), "utf8"));
const referenced = [
  ...[...html.matchAll(/(?:src|href)="\.\/([^"?]+)/g)].map((match) => match[1]),
  ...manifest.icons.map((icon) => icon.src.replace(/^\.\//, "")),
];
for (const file of new Set(referenced)) await stat(path.join(out, file));
if (!html.includes("Alpha 0.45.5") || !html.includes("alpha-045-systems.js"))
  throw new Error("Alpha 0.45.5 runtime is missing from the production artifact");

console.log(`Static production build ready: ${files.length} files`);

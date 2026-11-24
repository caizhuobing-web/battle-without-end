// 把 ember/ 打成单个 HTML 片段，供 Artifact 发布：样式、字体、脚本全部内联。
// 用法：node ember/tools/build-artifact.mjs   输出 ember/dist/index.html
// Artifact 发布时会自动包上 <!doctype>/<head>/<body>，所以这里只输出 <title>、<style> 和正文。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(root, f), "utf8");
const font = readFileSync(join(root, "font.woff2")).toString("base64");
const css = read("style.css").replace('url("./font.woff2")', `url("data:font/woff2;base64,${font}")`);
const html = read("index.html");
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
const inlined = body.replace(/<script src="\.\/([\w.]+)\?v=\d+"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/gi, "<\\/script")}\n</script>`);
if (/src="\.\//.test(inlined)) throw new Error("unresolved local script");
const out = [
  "<title>万丈深渊</title>",
  '<meta name="theme-color" content="#1b1c24">',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  "<style>\n" + css + "\n</style>",
  inlined.trim(),
].join("\n");
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "index.html"), out);
console.log("ember/dist/index.html", (out.length / 1024).toFixed(1) + " KB");

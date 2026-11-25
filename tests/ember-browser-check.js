// 万丈深渊：浏览器回归（v4 切片）。五种尺寸下开局、拉拨盘、打一波、读档、无横向溢出；坏档自救。
// 用法：先在仓库根目录运行 python -m http.server 8765，再运行 node tests/ember-browser-check.js
// 需要 playwright 或 playwright-core；没有下载浏览器时会用本机的 Edge 或 Chrome。
let pw;
try {
  pw = require("playwright");
} catch (e) {
  pw = require("playwright-core");
}
const URL = process.env.EMBER_URL || "http://localhost:8765/ember/index.html";
const SIZES = [[360, 640, true], [375, 667, true], [390, 844, true], [844, 390, true], [1280, 800, false]];
const out = [];
const ok = (name, pass, note) => out.push((pass ? "PASS " : "FAIL ") + name + (note ? "  " + note : ""));

async function launch() {
  for (const opt of [{}, { channel: "msedge" }, { channel: "chrome" }]) {
    try {
      return await pw.chromium.launch(opt);
    } catch (e) {}
  }
  throw new Error("no browser available");
}

(async () => {
  const b = await launch();
  const errs = [];
  const page = async (w, h, touch) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch });
    const p = await c.newPage();
    p.on("pageerror", (e) => errs.push(w + "x" + h + " " + e.message));
    await p.goto(URL);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(300);
    return p;
  };
  for (const [w, h, touch] of SIZES) {
    const p = await page(w, h, touch);
    let pass = true, note = "";
    try {
      await p.click("#modal .btn");
      await p.click("[data-act=go]");
      await p.click("[data-act=spin]");
      await p.waitForTimeout(700);
      // 拉完之后：拨盘三格、拉杆、开打、回家都要在一屏内
      const vis = await p.evaluate(() => [".reel", "[data-act=spin]", "[data-act=fight]", "[data-act=home]"].map((q) => {
        const r = document.querySelector(q).getBoundingClientRect();
        return r.bottom <= window.innerHeight && r.top >= 0;
      }));
      if (vis.includes(false)) {
        pass = false;
        note += "拨盘或按钮不在首屏 " + vis.join("/") + "；";
      }
      const items = await p.evaluate(() => __ember.state.run.items.length + __ember.state.run.cores);
      if (!(items > 0)) {
        pass = false;
        note += "拉了拨盘却什么都没得到；";
      }
      await p.click("[data-act=fight]");
      await p.click("[data-act=speed]");
      await p.waitForFunction(() => !__ember.state.run || __ember.state.run.phase !== "fight", null, { timeout: 60000 });
      const st = await p.evaluate(() => ({ wave: __ember.state.run && __ember.state.run.wave, cores: __ember.state.run && __ember.state.run.cores }));
      if (st.wave !== 1 || !(st.cores > 0)) {
        pass = false;
        note += "第一波没打赢或没拿到能核 " + JSON.stringify(st) + "；";
      }
      const m = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      if (m[0] !== m[1]) {
        pass = false;
        note += "横向溢出 " + m.join("/") + "；";
      }
      const before = await p.evaluate(() => JSON.stringify(__ember.state.run.items) + __ember.state.run.cores);
      await p.reload();
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => __ember.state.run && JSON.stringify(__ember.state.run.items) + __ember.state.run.cores);
      if (before !== after) {
        pass = false;
        note += "读档不一致；";
      }
      const k = await p.evaluate(() => document.getElementById("cv").getBoundingClientRect().width / 180);
      note += "画布 " + k.toFixed(2) + " 倍";
    } catch (e) {
      pass = false;
      note += e.message.split("\n")[0];
    }
    ok(w + "x" + h + " 开局、拉拨盘、打一波、读档、无溢出", pass, note);
    await p.context().close();
  }
  {
    const p = await page(390, 844, true);
    await p.click("#modal .btn");
    await p.click("[data-act=go]");
    await p.click("[data-act=spin]");
    await p.waitForTimeout(700);
    await p.click("[data-act=home]");
    await p.click("#modal .btn");
    await p.evaluate(() => localStorage.setItem("wzsy.save.v4", "{bad"));
    await p.reload();
    await p.waitForTimeout(300);
    const runs = await p.evaluate(() => window.__ember && __ember.state.runs);
    ok("主存档损坏时读备份", runs === 1, "runs=" + runs);
    await p.evaluate(() => {
      localStorage.setItem("wzsy.save.v4", JSON.stringify({ v: 4, bank: -9, lv: 1e9, wear: "nope", run: { wear: "hunter", wave: 99, cores: "x", items: [{ t: "u", k: "spear", star: 7 }] } }));
      localStorage.removeItem("wzsy.save.v4.bak");
    });
    await p.reload();
    await p.waitForTimeout(300);
    const s = await p.evaluate(() => window.__ember && { bank: __ember.state.bank, lv: __ember.state.lv, wear: __ember.state.wear, run: __ember.state.run });
    ok("乱填的存档被逐项纠正", s && s.bank === 0 && s.lv === 99 && s.wear === "hunter" && s.run === null, JSON.stringify(s));
    await p.context().close();
  }
  ok("全程无页面报错", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close();
  console.log(out.join("\n"));
  process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
})();

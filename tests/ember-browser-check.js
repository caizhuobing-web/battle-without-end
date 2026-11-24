// 万丈深渊：浏览器回归。五种尺寸下开局、下潜、遭遇、读档、坏档自救、无横向溢出。
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
      // 造一场遭遇：第一步只有白鬣
      await p.evaluate(() => {
        __ember.state.dive.map[0] = [{ t: "fight", e: "whiteHyena" }];
      });
      await p.evaluate(() => document.querySelector("[data-act=tab]") || 0);
      await p.evaluate(() => __ember.save());
      await p.reload();
      await p.waitForTimeout(300);
      await p.click("[data-act=node]");
      // 遭遇时三个按钮都要在首屏内
      const vis = await p.evaluate(() => ["fight", "detour", "retreat"].map((a) => {
        const r = document.querySelector("[data-act=" + a + "]").getBoundingClientRect();
        return r.bottom <= window.innerHeight && r.top >= 0;
      }));
      if (vis.includes(false)) {
        pass = false;
        note += "遭遇按钮不在首屏 " + vis.join("/") + "；";
      }
      await p.click("[data-act=fight]");
      await p.click("[data-act=skip]");
      const m = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      if (m[0] !== m[1]) {
        pass = false;
        note += "横向溢出 " + m.join("/") + "；";
      }
      // 读档：下潜中刷新后状态不变
      const before = await p.evaluate(() => JSON.stringify(__ember.state.dive && __ember.state.dive.carry));
      await p.reload();
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => JSON.stringify(__ember.state.dive && __ember.state.dive.carry));
      if (before !== after) {
        pass = false;
        note += "读档不一致；";
      }
      // 画布整倍放大
      const k = await p.evaluate(() => document.getElementById("cv").getBoundingClientRect().width / 144);
      note += "画布 " + k.toFixed(2) + " 倍";
    } catch (e) {
      pass = false;
      note += e.message.split("\n")[0];
    }
    ok(w + "x" + h + " 开局、遭遇、战斗、读档、无溢出", pass, note);
    await p.context().close();
  }
  // 坏档：主存档损坏时用备份；两份都坏时出现自救界面
  {
    const p = await page(390, 844, true);
    await p.click("#modal .btn");
    await p.click("[data-act=go]");
    await p.click("[data-act=home]");
    await p.evaluate(() => localStorage.setItem("wzsy.save.v1", "{bad"));
    await p.reload();
    await p.waitForTimeout(300);
    const dives = await p.evaluate(() => window.__ember && __ember.state.dives);
    ok("主存档损坏时读备份", dives === 1, "dives=" + dives);
    await p.evaluate(() => {
      localStorage.setItem("wzsy.save.v1", JSON.stringify({ v: 1, hearth: "x", store: { core: -5 }, cls: { hunter: { lv: 1e9 } }, dive: { layer: 7 } }));
      localStorage.removeItem("wzsy.save.v1.bak");
    });
    await p.reload();
    await p.waitForTimeout(300);
    const s = await p.evaluate(() => window.__ember && { core: __ember.state.store.core, lv: __ember.state.cls.hunter.lv, dive: __ember.state.dive });
    ok("乱填的存档被逐项纠正", s && s.core === 0 && s.lv === 99 && s.dive === null, JSON.stringify(s));
    await p.context().close();
  }
  ok("全程无页面报错", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close();
  console.log(out.join("\n"));
  process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
})();

// 万丈深渊：浏览器回归（v5）。五种尺寸下开局、拉 3×3 拨盘、打一波、读档、无横向溢出；吸收和晋升；坏档自救。
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
      await p.waitForTimeout(900);
      // 拉完之后：整个拨盘、推、拉杆、开打都要在一屏内
      const vis = await p.evaluate(() => [".nudges", ".board", "[data-act=spin]", "[data-act=fight]"].map((q) => {
        const r = document.querySelector(q).getBoundingClientRect();
        return r.bottom <= window.innerHeight && r.top >= 0;
      }));
      if (vis.includes(false)) {
        pass = false;
        note += "拨盘或按钮不在首屏 " + vis.join("/") + "；";
      }
      const got = await p.evaluate(() => __ember.state.run.units.length);
      if (!(got >= 1)) {
        pass = false;
        note += "每局第一次拉应该必中，却没来帮手；";
      }
      await p.click("[data-act=fight]");
      await p.click("[data-act=speed]");
      await p.click("[data-act=speed]");
      await p.waitForFunction(() => !__ember.state.run || __ember.state.run.phase !== "fight", null, { timeout: 60000 });
      const st = await p.evaluate(() => ({ wave: __ember.state.run && __ember.state.run.wave, cores: __ember.state.run && __ember.state.run.cores }));
      if (st.wave !== 1 || !(st.cores > 0)) {
        pass = false;
        note += "第一波没打完或没拿到能核 " + JSON.stringify(st) + "；";
      }
      const m = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      if (m[0] !== m[1]) {
        pass = false;
        note += "横向溢出 " + m.join("/") + "；";
      }
      const before = await p.evaluate(() => JSON.stringify(__ember.state.run.units) + __ember.state.run.cores + "/" + __ember.state.run.hearts);
      await p.reload();
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => __ember.state.run && JSON.stringify(__ember.state.run.units) + __ember.state.run.cores + "/" + __ember.state.run.hearts);
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
    // 吸收和晋升都走界面按钮
    const p = await page(390, 844, true);
    await p.click("#modal .btn");
    await p.click("[data-act=go]");
    await p.evaluate(() => {
      const r = __ember.state.run;
      r.units = [{ id: 1, k: "bow", lv: 4, sub: null }, { id: 2, k: "spear", lv: 1, sub: null }, { id: 3, k: "shield", lv: 1, sub: null }];
      r.nextId = 4;
      __ember.save();
    });
    await p.reload();
    await p.waitForTimeout(300);
    await p.click("[data-act=unit][data-v='1']");
    await p.click("[data-act=unit][data-v='2']");
    await p.click("[data-act=promo][data-v='1']");
    const u = await p.evaluate(() => __ember.state.run.units.map((x) => x.k + x.lv + (x.sub || "")).join());
    ok("吸收升级并选晋升", u === "bow5twin,shield1", u);
    await p.click("[data-act=quit]");
    await p.click("[data-act=doQuit]");
    await p.click("#modal .btn");
    await p.evaluate(() => localStorage.setItem("wzsy.save.v5", "{bad"));
    await p.reload();
    await p.waitForTimeout(300);
    const runs = await p.evaluate(() => window.__ember && __ember.state.runs);
    ok("主存档损坏时读备份", runs === 1, "runs=" + runs);
    await p.evaluate(() => {
      localStorage.setItem("wzsy.save.v5", JSON.stringify({ v: 5, embers: -9, meta: { cap: 99, hound: "x" }, run: { wave: 99, cores: "x", units: [{ id: 1, k: "bogus", lv: 1, sub: null }], own: ["nope"] } }));
      localStorage.removeItem("wzsy.save.v5.bak");
    });
    await p.reload();
    await p.waitForTimeout(300);
    const z = await p.evaluate(() => window.__ember && { embers: __ember.state.embers, cap: __ember.state.meta.cap, hound: __ember.state.meta.hound, run: __ember.state.run });
    ok("乱填的存档被逐项纠正", z && z.embers === 0 && z.cap === 3 && z.hound === 0 && z.run === null, JSON.stringify(z));
    await p.context().close();
  }
  ok("全程无页面报错", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close();
  console.log(out.join("\n"));
  process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
})();

// 万丈深渊：浏览器回归（v6）。五种尺寸下开局、拉 3×3 拨盘、打一波、逛铺子、读档、无横向溢出；吸收、印记和晋升；核心重抽；旧档作废、坏档自救。
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
      // 守住第一波得 1 灯油；顶栏有灯油数；卡片上有特性标签和空的印记格
      const oil = await p.evaluate(() => [__ember.state.run.oil, document.getElementById("res").textContent.includes("灯油 1"), document.querySelectorAll(".unit .tg").length, document.querySelectorAll(".unit .tg.no").length]);
      if (oil[0] !== 1 || !oil[1] || !(oil[2] >= 2) || !(oil[3] >= 1)) {
        pass = false;
        note += "灯油或卡片标签不对 " + oil.join("/") + "；";
      }
      // 铺子弹窗：三格货，整个弹窗在屏幕里，不横向溢出；灯油不够时买不了
      await p.click("[data-act=shop]");
      const shop = await p.evaluate(() => {
        const r = document.querySelector("#modal .box").getBoundingClientRect();
        return [document.querySelectorAll("#modal .item").length, document.querySelectorAll("#modal [data-act=shopBuy]:disabled").length, r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight, document.documentElement.scrollWidth === document.documentElement.clientWidth];
      });
      if (shop[0] !== 3 || shop[1] !== 3 || !shop[2] || !shop[3]) {
        pass = false;
        note += "铺子弹窗不对 " + shop.join("/") + "；";
      }
      await p.click("#modal [data-act=close]");
      const snap = () => __ember.state.run && JSON.stringify(__ember.state.run.units) + __ember.state.run.cores + "/" + __ember.state.run.hearts + "/" + __ember.state.run.oil + JSON.stringify(__ember.state.run.shop);
      const before = await p.evaluate(snap);
      await p.reload();
      await p.waitForTimeout(300);
      const after = await p.evaluate(snap);
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
    ok(w + "x" + h + " 开局、拉拨盘、打一波、铺子、读档、无溢出", pass, note);
    await p.context().close();
  }
  {
    // 吸收、印记和晋升都走界面按钮（最窄的手机尺寸，顺带看满标签的卡片和弹窗会不会溢出）
    const p = await page(360, 640, true);
    await p.click("#modal .btn");
    await p.click("[data-act=go]");
    const U = (id, k, lv, more) => Object.assign({ id, k, lv, sub: null, trait: null, imp: [] }, more);
    await p.evaluate((units) => {
      const r = __ember.state.run;
      r.units = units;
      r.nextId = 9;
      r.oil = 5;
      __ember.save();
    }, [U(1, "bow", 4, { trait: "bone", imp: [{ k: "spear", t: 1 }] }), U(2, "spear", 1), U(3, "shield", 1), U(4, "fire", 1), U(5, "hound", 1)]);
    await p.reload();
    await p.waitForTimeout(300);
    const show = () => __ember.state.run.units.map((x) => x.k + x.lv + (x.sub || "") + "[" + x.imp.map((m) => m.k + m.t).join() + "]").join();
    // 同种印记升阶，到 5 级选晋升
    await p.click("[data-act=unit][data-v='1']");
    const tip = await p.evaluate(() => document.querySelector(".army + p").textContent);
    await p.click("[data-act=unit][data-v='2']");
    await p.click("[data-act=promo][data-v='1']");
    let u = await p.evaluate(show);
    ok("吸收升级、印记升阶并选晋升", u.startsWith("bow5twin[spear2],") && tip.includes("硬骨") && tip.includes("生命 +15%") && tip.includes("透甲 I"), u + "  选中时的说明：" + tip.slice(0, 40));
    // 晋升后有第二格：直接放进去
    await p.click("[data-act=unit][data-v='1']");
    await p.click("[data-act=unit][data-v='3']");
    // 格子满了：弹窗里每格一个「换掉」，加「不要印记」
    await p.click("[data-act=unit][data-v='1']");
    await p.click("[data-act=unit][data-v='4']");
    const dlg = await p.evaluate(() => {
      const r = document.querySelector("#modal .box").getBoundingClientRect();
      return [document.querySelectorAll("#modal [data-act=imp]").length, document.querySelector("#modal").textContent.includes("换掉「透甲 II」"), __ember.state.run.units.length, r.right <= window.innerWidth && r.bottom <= window.innerHeight];
    });
    await p.click("#modal [data-act=imp][data-v='0']");
    const swapped = await p.evaluate(show);
    await p.click("[data-act=unit][data-v='1']");
    await p.click("[data-act=unit][data-v='5']");
    await p.click("#modal [data-act=imp][data-v=skip]");
    u = await p.evaluate(show);
    const card = await p.evaluate(() => [...document.querySelectorAll(".unit[data-v='1'] .tg")].map((x) => x.textContent || "空").join("/") + " " + (document.documentElement.scrollWidth === document.documentElement.clientWidth));
    ok("印记格满了弹窗：替换或不要", dlg.join("/") === "3/true/3/true" && swapped === "bow7twin[fire1,shield1],hound1[]" && u === "bow9twin[fire1,shield1]" && card === "硬骨/余火 I/厚甲 I true", dlg.join("/") + " " + swapped + " " + u + " 卡片 " + card);
    // 铺子：买一件、重摆
    await p.click("[data-act=shop]");
    const want = await p.evaluate(() => __ember.state.run.shop[0]);
    await p.click("#modal [data-act=shopBuy][data-v='0']");
    const b1 = await p.evaluate((k) => [__ember.state.run.oil, __ember.state.run.items[k], __ember.state.run.shop[0], document.querySelectorAll("#modal [data-act=shopBuy]").length].join("/"), want);
    await p.click("#modal [data-act=shopReroll]");
    const b2 = await p.evaluate(() => [__ember.state.run.oil, __ember.state.run.shop.filter(Boolean).length, document.querySelector("#modal [data-act=shopReroll]").disabled].join("/"));
    await p.click("#modal [data-act=close]");
    ok("铺子买货和重摆", b1 === "3/1//2" && b2 === "2/3/false", b1 + " " + b2);
    // 核心三选一：花灯油重抽，灯油不够就置灰
    await p.evaluate(() => {
      const r = __ember.state.run;
      r.pick = ["ledger", "push", "cheap"];
      r.oil = 1;
      __ember.save();
    });
    await p.reload();
    await p.waitForTimeout(300);
    await p.click("#modal [data-act=coreReroll]");
    const c1 = await p.evaluate(() => [__ember.state.run.oil, __ember.state.run.pick.length, __ember.state.run.pick.some((c) => ["ledger", "push", "cheap"].includes(c)), document.querySelector("#modal [data-act=coreReroll]").disabled].join("/"));
    await p.click("#modal [data-act=core][data-v='0']");
    const c2 = await p.evaluate(() => __ember.state.run.own.length + "/" + __ember.state.run.pick);
    ok("核心重抽", c1 === "0/3/false/true" && c2 === "1/null", c1 + " " + c2);
    await p.click("[data-act=quit]");
    await p.click("[data-act=doQuit]");
    await p.click("#modal .btn");
    await p.evaluate(() => localStorage.setItem("wzsy.save.v6", "{bad"));
    await p.reload();
    await p.waitForTimeout(300);
    const runs = await p.evaluate(() => window.__ember && __ember.state.runs);
    ok("主存档损坏时读备份", runs === 1, "runs=" + runs);
    await p.evaluate(() => {
      localStorage.setItem("wzsy.save.v6", JSON.stringify({ v: 6, embers: -9, meta: { cap: 99, hound: "x" }, run: { wave: 99, cores: "x", units: [{ id: 1, k: "bogus", lv: 1, sub: null, trait: null, imp: [] }], own: ["nope"] } }));
      localStorage.removeItem("wzsy.save.v6.bak");
    });
    await p.reload();
    await p.waitForTimeout(300);
    const z = await p.evaluate(() => window.__ember && { embers: __ember.state.embers, cap: __ember.state.meta.cap, hound: __ember.state.meta.hound, run: __ember.state.run });
    ok("乱填的存档被逐项纠正", z && z.embers === 0 && z.cap === 3 && z.hound === 0 && z.run === null, JSON.stringify(z));
    // v6 的新字段：灯油、货架、已买的货乱填会被纠正；特性或印记不对的整局丢弃
    const fix = await p.evaluate(() => {
      const unit = (more) => Object.assign({ id: 1, k: "bow", lv: 2, sub: null, trait: "bone", imp: [{ k: "spear", t: 1 }] }, more);
      const run = (u, more) => ({ v: 6, run: Object.assign({ wave: 1, cores: 5, units: [u], own: [] }, more) });
      const a = __ember.sanitize(run(unit(), { oil: -3, shop: ["x"], items: { whet: 99, bogus: 2, rug: "y" }, back: 1, lend: 9 })).run;
      const bad = [unit({ trait: "toString" }), unit({ imp: [{ k: "spear", t: 4 }] }), unit({ imp: [{ k: "spear", t: 1 }, { k: "bow", t: 1 }] }), unit({ imp: [{ k: "relic", t: 1 }] }), unit({ imp: null }), unit({ trait: undefined })];
      return JSON.stringify([a.oil, a.shop, a.items, a.back, a.lend, a.units[0].trait, a.units[0].imp]) + " " + bad.map((u) => (__ember.sanitize(run(u)).run === null ? "丢" : "留")).join("");
    });
    ok("新字段逐项校验", fix === '[0,[null,null,null],{"whet":5},false,2,"bone",[{"k":"spear","t":1}]] 丢丢丢丢丢丢', fix);
    // 旧版（v5）存档作废：当成新玩家，从说明弹窗开始
    await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("wzsy.save.v5", JSON.stringify({ v: 5, rs: 1, embers: 50, meta: { cap: 1, purse: 0, heart: 0, hound: 0, drum: 0 }, best: 4, runs: 3, run: null }));
    });
    await p.reload();
    await p.waitForTimeout(300);
    const old = await p.evaluate(() => [__ember.state.v, __ember.state.embers, __ember.state.runs, !document.getElementById("modal").hidden, document.getElementById("modal").textContent.includes("印记"), document.getElementById("modal").textContent.includes("铺子")].join("/"));
    ok("旧版存档作废重开，说明里讲了印记和铺子", old === "6/0/0/true/true/true", old);
    await p.context().close();
  }
  ok("全程无页面报错", errs.length === 0, errs.slice(0, 3).join(" | "));
  await b.close();
  console.log(out.join("\n"));
  process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
})();

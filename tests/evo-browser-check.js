// 浏览器回归：逐条复现 PM 第一轮的 bug，确认已修。
// 用法：先在仓库根目录运行 python3 -m http.server 8765，再运行 node tests/evo-browser-check.js
const { chromium } = require("playwright");
const SP = require("os").tmpdir(), URL = process.env.EVO_URL || "http://localhost:8765/evo/index.html";
const out = [];
const ok = (name, pass, note) => out.push((pass ? "PASS " : "FAIL ") + name + (note ? "  " + note : ""));
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const mk = async (vp, touch) => {
    const c = await b.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: !!touch, isMobile: !!touch });
    const p = await c.newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(URL);
    await p.waitForTimeout(400);
    return p;
  };
  // B1 横屏
  for (const [w, h] of [[844, 390], [667, 375]]) {
    const p = await mk({ width: w, height: h }, true);
    let good = true, note = "";
    try {
      await p.tap("[data-act=new]", { timeout: 4000 });
      await p.tap('[data-pick="0"]', { timeout: 4000 });
      for (const t of ["tree", "gene", "opt", "build"]) await p.tap(`[data-tab=${t}]`, { timeout: 4000 });
      const m = await p.evaluate(() => ({ cv: document.getElementById("cv").getBoundingClientRect().width, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      note = `画布 ${Math.round(m.cv)}px，占短边 ${Math.round((m.cv / h) * 100)}%`;
      good = m.cv >= h * 0.55 && m.sw === m.cw;
    } catch (e) {
      good = false;
      note = e.message.split("\n")[0];
    }
    await p.screenshot({ path: `${SP}/v-land-${w}.png` });
    ok(`B1 横屏 ${w}x${h} 可开局、选卡、切标签`, good, note);
    await p.context().close();
  }
  // G5 窄屏
  {
    const p = await mk({ width: 320, height: 568 }, true);
    const m = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    await p.tap("[data-act=new]");
    await p.tap('[data-pick="0"]');
    await p.screenshot({ path: `${SP}/v-320.png` });
    ok("G5 320 宽无横向溢出", m[0] === m[1], m.join("/"));
    await p.context().close();
  }
  // S5 G1 存档
  {
    const p = await mk({ width: 390, height: 844 }, true);
    const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64");
    const imp = async (o) => {
      await p.tap("[data-tab=opt]");
      await p.fill("#io", enc(o));
      await p.tap("[data-act=import]");
      await p.waitForTimeout(150);
    };
    let good = true;
    for (const bad of [null, "x", [], 1e99]) {
      for (const k of ["meta", "opt", "hist", "best", "codex", "snap"]) {
        await imp({ v: 1, dna: 5, [k]: bad });
        await p.reload();
        await p.waitForTimeout(250);
        if (!(await p.evaluate(() => !!window.__evo && !!document.querySelector("[data-act=new],[data-act=resume]")))) good = false;
      }
    }
    ok("S5 畸形存档导入并刷新后仍能进入开始界面", good);
    await imp({ v: 1, dna: 1e12, diffMax: 99, diff: 50, meta: { vit: 999, fourth: 5, heir: 50, bogus: 3 } });
    const s = await p.evaluate(() => window.__evo.save);
    ok("G1 导入数值被夹回上限", s.meta.vit === 10 && s.meta.fourth === 1 && s.meta.heir === 3 && !s.meta.bogus && s.dna === 1e9, JSON.stringify(s.meta));
    // S4 离线
    await p.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("evoSeed.save.v1"));
      s.dna = 0;
      s.opt.auto = true;
      s.hist = [{ dna: 40, wall: 400 }, { dna: 60, wall: 600 }];
      s.last = Date.now() - 2 * 3600 * 1000;
      window.__blockSave = true;
      localStorage.setItem("evoSeed.save.v1", JSON.stringify(s));
      window.removeEventListener("pagehide", () => {});
    });
    // 直接在新页面里读，避免 pagehide 覆盖
    const raw = await p.evaluate(() => localStorage.getItem("evoSeed.save.v1"));
    const p2 = await p.context().newPage();
    await p2.addInitScript((r) => localStorage.setItem("evoSeed.save.v1", r), raw);
    await p2.goto(URL);
    await p2.waitForTimeout(400);
    const g = await p2.evaluate(() => ({ dna: window.__evo.save.dna, cap: EvoSim.offlineHourCap(), txt: (document.querySelector("#modal .dna-gain") || {}).textContent }));
    const expect = Math.min(Math.floor(0.1 * 7200 * 0.5), g.cap * 2);
    ok("S4 离线 2 小时结算等于公式值", g.dna === expect, `得到 ${g.dna}，公式 ${expect}，弹窗 ${g.txt}`);
    await p2.screenshot({ path: `${SP}/v-offline.png` });
    // G2 挂机自动开局
    console.log("offline diag", JSON.stringify(await p2.evaluate(() => ({ modal: document.getElementById("modal").hidden, html: document.getElementById("modal").innerHTML.slice(0, 80), s: window.__evo && { h: window.__evo.save.hist, a: window.__evo.save.opt.auto, run: !!window.__evo.run } }))));
    const cl = await p2.$("[data-act=close]");
    if (cl) await cl.tap();
    await p2.waitForTimeout(4500);
    ok("G2 挂机开着时无操作自动开局", await p2.evaluate(() => !!window.__evo.run));
    await p.context().close();
  }
  // G3 G4 键盘与顶栏
  {
    const p = await mk({ width: 1280, height: 800 });
    await p.keyboard.press("Tab");
    await p.click("[data-act=new]");
    await p.waitForTimeout(300);
    let good = true, note = "";
    try {
      await p.click("#bSpd", { timeout: 3000 });
      await p.click("#bSpd", { timeout: 3000 });
    } catch (e) {
      good = false;
      note = "顶栏被挡";
    }
    ok("G3 选卡弹窗打开时顶栏可点", good, note);
    let runs0 = await p.evaluate(() => window.__evo.save.runs);
    for (let i = 0; i < 400; i++) {
      await p.keyboard.press("1");
      await p.waitForTimeout(250);
      if (await p.$("[data-act=again]")) break;
    }
    const ended = !!(await p.$("[data-act=again]"));
    await p.screenshot({ path: `${SP}/v-end-desktop.png` });
    await p.keyboard.press("Enter");
    await p.waitForTimeout(300);
    const runs1 = await p.evaluate(() => window.__evo.save.runs);
    ok("G4 只用键盘打完一局并开下一局", ended && runs1 === runs0 + 1, `局数 ${runs0} > ${runs1}`);
    // S6 续局
    await p.keyboard.press("1");
    await p.waitForTimeout(3000);
    await p.evaluate(() => {
      window.__evo.run.hp = window.__evo.run.maxHp * 0.2;
    });
    await p.waitForTimeout(5600);
    await p.reload();
    await p.waitForTimeout(400);
    await p.click("[data-act=resume]");
    await p.waitForTimeout(100);
    const hp = await p.evaluate(() => window.__evo.run.hp / window.__evo.run.maxHp);
    ok("S6 残血刷新后续局不回满", hp < 0.6, `续局生命 ${Math.round(hp * 100)}%`);
    await p.context().close();
  }
  console.log(out.join("\n"));
  console.log("页面报错", errs);
  await b.close();
})();

/* 万丈深渊：界面、存档、战斗循环。所有规则在 sim.js，这里只负责显示和输入。 */
(function () {
  const D = window.EmberData, S = window.EmberSim, P = window.EmberPixel, A = window.EmberAudio;
  const KEY = "wzsy.save.v6", BAK = "wzsy.save.v6.bak", OPT = "wzsy.opt.v1";
  const STEP = 1 / 30;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const now = () => performance.now() / 1000;

  /* ---------- 存档：逐字段校验。函数声明写法，保证调用点之前已定义。 ---------- */
  function num(v, lo, hi, def) {
    return typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  }
  function own(o, k) {
    return typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
  }
  /* 印记：每枚的兵种和阶数都要对，不重样，不超过这个帮手现在的格数。 */
  function impOk(u) {
    return Array.isArray(u.imp) && u.imp.length <= S.slotsOf(u) && u.imp.every((m) => !!m && own(D.IMPRINTS, m.k) && Number.isInteger(m.t) && m.t >= 1 && m.t <= 3) && new Set(u.imp.map((m) => m.k)).size === u.imp.length;
  }
  function unitOk(u) {
    return !!u && Number.isInteger(u.id) && u.id > 0 && own(D.UNITS, u.k) && Number.isInteger(u.lv) && u.lv >= 1 && u.lv < 1e6 && (u.sub === null || (D.SUBS[u.k] || []).some((x) => x.id === u.sub)) && (u.trait === null || own(D.TRAITS, u.trait)) && impOk(u);
  }
  function sanitize(raw) {
    if (!raw || typeof raw !== "object" || raw.v !== 6) return null; // 旧版存档作废，重开
    const s = S.newGame(num(raw.rs, -2147483648, 2147483647, 1) | 0);
    s.embers = Math.floor(num(raw.embers, 0, 1e9, 0));
    for (const k in s.meta) s.meta[k] = Math.floor(num(raw.meta && raw.meta[k], 0, D.META[k].max, 0));
    s.best = Math.floor(num(raw.best, 0, D.WAVES.length, 0));
    s.runs = Math.floor(num(raw.runs, 0, 1e9, 0));
    const r = raw.run;
    // 进行中的一局只在备战时存；结构不对就整段丢弃，回到聚落
    if (r && typeof r === "object" && Array.isArray(r.units) && r.units.length <= 40 && r.units.every(unitOk) && new Set(r.units.map((u) => u.id)).size === r.units.length && Array.isArray(r.own) && r.own.length <= D.RULES.coreMax && r.own.every((c) => own(D.CORES, c)) && new Set(r.own).size === r.own.length) {
      const max = D.RULES.hearts + s.meta.heart, items = {};
      for (const k in D.ITEMS) {
        const lv = Math.floor(num(r.items && r.items[k], 0, D.RULES.itemMax, 0));
        if (lv) items[k] = lv;
      }
      s.run = {
        wave: Math.floor(num(r.wave, 0, D.WAVES.length - 1, 0)), cores: Math.floor(num(r.cores, 0, 1e7, 0)), hearts: Math.floor(num(r.hearts, 1, max, max)), heartsMax: max,
        oil: Math.floor(num(r.oil, 0, 1e6, 0)), items,
        shop: Array.isArray(r.shop) && r.shop.length === 3 && r.shop.every((k) => k === null || own(D.ITEMS, k)) ? r.shop.slice() : [null, null, null],
        units: r.units.map((u) => ({ id: u.id, k: u.k, lv: u.lv, sub: u.sub, trait: u.trait, imp: u.imp.map((m) => ({ k: m.k, t: m.t })) })), nextId: 1 + r.units.reduce((a, u) => Math.max(a, u.id), 0),
        board: null, paid: null, jack: false, got: [], spins: Math.floor(num(r.spins, 0, D.RULES.spinsPerWave, 0)), total: Math.floor(num(r.total, 0, 1e6, 0)), nudges: Math.floor(num(r.nudges, 0, 3, 0)),
        back: r.back === true, lend: Math.floor(num(r.lend, 0, 2, 0)),
        own: r.own.slice(), pick: Array.isArray(r.pick) && r.pick.length && r.pick.every((c) => own(D.CORES, c) && !r.own.includes(c)) ? r.pick.slice(0, 3) : null,
        promo: r.units.some((u) => u.id === r.promo && !u.sub && D.SUBS[u.k]) ? r.promo : null, phase: "prep", fight: null,
      };
    }
    return s;
  }
  let keep = null; // 最近一次备战时的快照；战斗中刷新页面就回到这里
  function save() {
    try {
      const snap = JSON.parse(JSON.stringify(st));
      if (snap.run && snap.run.phase === "fight") snap.run = keep;
      else keep = snap.run ? JSON.parse(JSON.stringify(snap.run)) : null;
      if (!sanitize(snap)) return;
      const old = localStorage.getItem(KEY);
      if (old) localStorage.setItem(BAK, old);
      localStorage.setItem(KEY, JSON.stringify(snap));
    } catch (e) {}
  }
  function load() {
    for (const k of [KEY, BAK]) {
      try {
        const s = sanitize(JSON.parse(localStorage.getItem(k) || "null"));
        if (s) return s;
      } catch (e) {}
    }
    return null;
  }

  /* ---------- 状态 ---------- */
  let st = load();
  const fresh = !st;
  if (!st) st = S.newGame((Math.random() * 2147483647) | 0);
  keep = st.run ? JSON.parse(JSON.stringify(st.run)) : null;
  let opt = { snd: true };
  try {
    opt = Object.assign(opt, JSON.parse(localStorage.getItem(OPT) || "{}"));
  } catch (e) {}
  A.set(opt.snd);
  const view = { flash: {}, hitAt: {}, trauma: 0, stopT: 0, lastStop: -9, pop: 0, hold: false, fx: [], floats: [], shake: 0, speed: 1, reveal: 3, rolling: false, sel: 0, pend: null, newAt: {}, msg: "" };

  /* ---------- 画布：整倍放大 ---------- */
  const cv = $("cv"), cx = cv.getContext("2d");
  cv.width = P.W;
  cv.height = P.H;
  function fit() {
    const land = window.matchMedia("(min-aspect-ratio: 4/3) and (min-width: 640px)").matches;
    const aw = $("stage").clientWidth, ah = land ? window.innerHeight - 60 : window.innerHeight * 0.34;
    let k = Math.min(aw / P.W, ah / P.H);
    if (k >= 2) k = Math.floor(k);
    cv.style.width = Math.floor(P.W * k) + "px";
    cv.style.height = Math.floor(P.H * k) + "px";
  }
  window.addEventListener("resize", fit);
  fit();

  /* ---------- 主循环：固定步长推进战斗，再画一帧 ---------- */
  let lastMs = 0, acc = 0, sndAt = 0, dieAt = 0;
  function frame(ms) {
    const t = ms / 1000, dt = Math.min(0.1, (ms - lastMs) / 1000 || 0);
    lastMs = ms;
    view.trauma = Math.max(0, view.trauma - dt * 1.5);
    view.shake = view.trauma * view.trauma;
    if (st.run && st.run.phase === "fight") {
      if (t >= view.stopT) acc += dt * view.speed; // 顿帧：停住的这一小会儿战斗不往前走
      let guard = 0;
      while (acc >= STEP && t >= view.stopT && st.run && st.run.phase === "fight" && guard++ < 10) {
        acc -= STEP;
        S.step(st, STEP);
        if (st.run && st.run.fight) drain(st.run.fight, t);
      }
      if (!st.run || st.run.phase !== "fight") afterFight();
      else hud();
    } else acc = 0;
    P.draw(cx, st, view, t);
    requestAnimationFrame(frame);
  }
  /* 手感：创伤值（震屏用它的平方）和顿帧。顿帧隔 0.35 秒才能再来一次，免得画面一直卡。 */
  const jolt = (a) => (view.trauma = Math.min(1, view.trauma + a));
  function freeze(t, d, force) {
    if (!force && t - view.lastStop < 0.35) return;
    view.stopT = t + d;
    view.lastStop = t;
  }
  function drain(f, t) {
    for (const e of f.ev) {
      if (e.k === "hit") {
        view.flash[e.id] = t + 0.1;
        view.hitAt[e.id] = t;
        jolt(e.side ? (e.big ? 0.15 : 0.03) : 0.05);
        if (e.big) view.fx.push({ k: "spark", x: e.x, dir: e.side ? 1 : -1, big: 1, t0: t });
        if (e.big || e.v >= 25) view.floats.push({ s: String(e.v), x: e.x + (e.side ? 4 : -4), y: 70 - (view.floats.length % 3) * 6, c: e.side ? (e.big ? P.PAL.emberHi : P.PAL.snow) : P.PAL.blood, t0: t });
        if (t - sndAt > 0.08) {
          sndAt = t;
          A.play(e.side ? (e.big ? "hitBig" : "hit") : "hurt");
          if (!e.big) view.fx.push({ k: "spark", x: e.x, dir: e.side ? 1 : -1, t0: t });
        }
      } else {
        if (e.k === "leak") {
          jolt(0.8);
          freeze(t, 0.1);
          A.play("warn");
        } else if (e.k === "die") {
          if (e.boss) {
            jolt(1);
            freeze(t, 0.3, true);
          } else if (e.big) {
            jolt(0.55);
            freeze(t, 0.07);
          } else jolt(e.side ? 0.08 : 0.4);
          if (e.big || e.boss) view.fx.push({ k: "ring", x: e.x, r: e.boss ? 60 : 30, t0: t });
          if (e.big || e.boss || !e.side) A.play("dieBig");
          else if (t - dieAt > 0.12) {
            dieAt = t;
            A.play("die");
          }
        }
        e.t0 = t;
        view.fx.push(e);
      }
    }
    f.ev.length = 0;
    if (view.fx.length > 60) view.fx.splice(0, view.fx.length - 60);
    if (view.floats.length > 14) view.floats.splice(0, view.floats.length - 14);
  }
  function afterFight() {
    view.fx = [];
    view.floats = [];
    view.flash = {};
    view.hitAt = {};
    view.stopT = 0;
    if (!st.run) {
      A.play(st.last.how === "won" ? "core" : "warn");
      showResult();
    } else {
      A.play("core");
      view.msg = "守住了。能核 +" + st.run.lastWave.got + "，灯油 +" + st.run.lastWave.oil + "。";
    }
    save();
    render();
  }

  /* ---------- 动作 ---------- */
  const uname = (u) => S.nameOf(u) + " " + u.lv + " 级";
  function afterGain(res) {
    const r = st.run, t = now();
    for (const id of r.got) view.newAt[id] = t + 1.2;
    const names = r.got.map((id) => r.units.find((u) => u.id === id)).filter(Boolean).map((u) => S.nameOf(u));
    view.msg = res.n ? "中了 " + res.n + " 条线：" + names.join("、") + (r.chain ? "（连账又中 " + r.chain + " 条）" : "") + "。" : res.free ? "没中。回手：这次不收能核。" : "没中。";
    const jack = r.got.some((id) => (r.units.find((u) => u.id === id) || {}).k === "relic");
    if (res.n) {
      view.pop = t + (jack ? 0.7 : 0.4);
      jolt(jack ? 1 : 0.45 + 0.15 * Math.min(3, res.n));
    }
    A.play(jack ? "jack" : res.n ? "win" : "miss");
    if (r.pick) corePick();
  }
  const impName = (m) => D.IMPRINTS[m.k].name + " " + D.TIER[m.t];
  /* a 吸收 b。印记格满了要选的时候先弹窗，选完带着 opt 再来一次。 */
  function tryAbsorb(a, b, opt) {
    const r = st.run, ea = r.units.find((u) => u.id === a), fd = r.units.find((u) => u.id === b);
    if (!ea || !fd) return;
    const an = S.nameOf(ea), bn = S.nameOf(fd), res = S.absorb(st, a, b, opt);
    if (!res) return;
    if (res.need) return impPick(ea, fd, res);
    const I = D.IMPRINTS[res.k], m = I && ea.imp.find((x) => x.k === res.k);
    const tail = res.got === "up" ? "，印记「" + I.name + "」升到 " + D.TIER[m.t] + " 阶" : res.got === "new" ? "，得到印记「" + impName(m) + "」" : res.got === "swap" ? "，换上印记「" + impName(m) + "」" : res.got === "lv" ? (opt === "skip" ? "，没要印记，多升了 1 级" : "，「" + I.name + "」已是 III 阶，多升了 1 级") : "";
    view.msg = an + "吸收了" + bn + "，升到 " + ea.lv + " 级" + tail + "。";
    view.newAt[ea.id] = now() + 1;
    jolt(0.3);
    A.play("ok");
    if (r.promo) promoPick();
  }
  const acts = {
    go() {
      S.startRun(st);
      view.msg = "拉一次拨盘。连成一条线，才会来一个帮手。";
      A.play("step");
    },
    spin() {
      if (view.rolling) return;
      const why = S.spinBlock(st);
      if (why) return toast(why + "。");
      const res = S.spin(st);
      // 三列从左到右依次停下
      view.rolling = true;
      view.reveal = 0;
      view.msg = "";
      A.play("step");
      const stop = (n) => setTimeout(() => {
        view.reveal = n;
        A.play("step");
        if (n === 3 && res.n) {
          // 中了：第三列停下后先憋一小下，再亮线、震屏、出声
          view.hold = true;
          setTimeout(() => {
            view.hold = false;
            view.rolling = false;
            afterGain(res);
            save();
            render();
          }, 110);
        } else if (n === 3) {
          view.rolling = false;
          afterGain(res);
          save();
        }
        render();
      }, 220 * n);
      stop(1);
      stop(2);
      stop(3);
    },
    nudge(c) {
      if (view.rolling) return;
      const res = S.nudge(st, +c);
      if (!res) return toast(st.run.board ? "这一波的推已经用完。" : "先拉一次拨盘。");
      afterGain(res);
    },
    unit(id) {
      id = +id;
      const r = st.run;
      if (view.sel === id) view.sel = 0;
      else if (!view.sel) view.sel = id;
      else {
        tryAbsorb(view.sel, id);
        view.sel = 0;
      }
    },
    imp(v) {
      const pd = view.pend;
      view.pend = null;
      closeModal();
      if (pd) tryAbsorb(pd.a, pd.b, v === "skip" ? "skip" : +v);
    },
    shop() {
      shopModal();
    },
    shopBuy(i) {
      if (S.shopBuy(st, +i)) A.play("ok");
      shopModal();
    },
    shopReroll() {
      if (S.shopReroll(st)) A.play("step");
      shopModal();
    },
    coreReroll() {
      if (S.rerollCores(st)) A.play("step");
      corePick();
    },
    auto() {
      const n = S.autoAbsorb(st);
      view.msg = n ? "自动吸收了 " + n + " 次。" : "";
      if (st.run.promo) promoPick();
    },
    core(i) {
      S.pickCore(st, +i);
      closeModal();
      A.play("ok");
    },
    promo(i) {
      S.promote(st, +i);
      closeModal();
      A.play("core");
      if (st.run.units.length > S.capOf(st)) view.msg = "队伍还超员，继续吸收。";
    },
    fight() {
      const why = S.fightBlock(st);
      if (why) return toast(why + "。");
      view.sel = 0;
      if (S.beginWave(st)) A.play("step");
    },
    speed() {
      view.speed = view.speed === 1 ? 2 : view.speed === 2 ? 3 : 1;
    },
    quit() {
      modal('<h3>放弃这一局</h3><p>现在放弃，按已经守住的波数结算余烬。</p><div class="btns"><button class="btn warn" data-act="doQuit">放弃</button><button class="btn" data-act="close">继续打</button></div>');
    },
    doQuit() {
      S.giveUp(st);
      closeModal();
      showResult();
    },
    buy(k) {
      if (S.buy(st, k)) A.play("ok");
    },
    snd() {
      opt.snd = !opt.snd;
      A.set(opt.snd);
      try {
        localStorage.setItem(OPT, JSON.stringify(opt));
      } catch (e) {}
    },
    reset() {
      modal('<h3>重新开始</h3><p>清除全部进度。这一步不能撤销。</p><div class="btns"><button class="btn warn" data-act="doReset">清除进度</button><button class="btn" data-act="close">取消</button></div>');
    },
    doReset() {
      st = S.newGame((Math.random() * 2147483647) | 0);
      keep = null;
      closeModal();
      intro();
    },
    close() {
      view.pend = null;
      closeModal();
    },
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const fn = acts[b.dataset.act];
    if (!fn) return;
    try {
      fn(b.dataset.v);
    } catch (err) {
      console.error(err);
    }
    if (!view.rolling) save();
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (!$("modal").hidden) return;
    const sel = { " ": "[data-act=spin],[data-act=go]", Enter: "[data-act=fight]", 1: "[data-act=nudge][data-v='0']", 2: "[data-act=nudge][data-v='1']", 3: "[data-act=nudge][data-v='2']", a: "[data-act=auto]" }[e.key];
    const b = sel && document.querySelector(sel);
    if (b && !b.disabled) {
      e.preventDefault();
      b.click();
    }
  });

  /* ---------- 弹窗 ---------- */
  function modal(html) {
    const m = $("modal");
    m.innerHTML = '<div class="box">' + html + "</div>";
    m.hidden = false;
  }
  function closeModal() {
    $("modal").hidden = true;
    $("modal").innerHTML = "";
  }
  let toastT = 0;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (el.hidden = true), 2200);
  }
  function intro() {
    modal('<h3>灰炉屯</h3><p>兽群沿着旧补给线涌上来了。你守在门口，手里只有一只前人留下的拨盘。</p><p>拉拨盘：横、竖、斜，三格连成一线，就来一个帮手。没连上就什么都没有。</p><p>帮手可以互相吸收，吸收的升级，被吸收的消失。等级没有上限。吃掉谁，就留下谁那个兵种的一枚印记，比如吃掉矛手得「透甲」。</p><p>每守住一波得灯油，备战时去铺子换全队的加成。</p><p>敌人漏过门一个，丢一条命。第五波和第十波一个都不能漏。</p><div class="btns"><button class="btn main" data-act="close">知道了</button></div>');
  }
  function corePick() {
    const r = st.run;
    const R = D.RULES;
    modal("<h3>选一个核心</h3><p class=\"dim\">整局生效。第 " + R.coreFirst + " 次拉拨盘选第一个，之后每 " + R.coreEvery + " 次选一个，最多 " + R.coreMax + ' 个。</p><div class="btns col">' + r.pick.map((c, i) => '<button class="btn" data-act="core" data-v="' + i + '"><b>' + D.CORES[c].name + "</b><small>" + D.CORES[c].note + "</small></button>").join("") + '</div><div class="btns"><button class="btn" data-act="coreReroll"' + (r.oil < R.rerollCost ? " disabled" : "") + ">重抽（" + R.rerollCost + " 灯油）<small>现有灯油 " + r.oil + "</small></button></div>");
  }
  /* 印记格满了：换掉哪一格，或者不要印记多升 1 级。 */
  function impPick(A, B, res) {
    const I = D.IMPRINTS[res.k];
    view.pend = { a: A.id, b: B.id };
    modal("<h3>印记格满了</h3><p>" + S.nameOf(A) + "吸收" + S.nameOf(B) + "，可以得到印记「" + I.name + " I」：" + I.note + '。</p><p class="dim">' + S.nameOf(A) + '的印记格已经放满，选一样：</p><div class="btns col">' + res.slots.map((m, i) => '<button class="btn" data-act="imp" data-v="' + i + '"><b>换掉「' + impName(m) + "」</b><small>" + D.IMPRINTS[m.k].note + "</small></button>").join("") + '<button class="btn" data-act="imp" data-v="skip"><b>不要印记，多升 1 级</b></button><button class="btn" data-act="close"><b>先不吸收</b></button></div>');
  }
  const itemList = (r) => Object.keys(r.items).map((k) => D.ITEMS[k].name + " " + r.items[k] + " 级").join("、");
  function shopModal() {
    const r = st.run, R = D.RULES;
    let h = "<h3>铺子 · 灯油 " + r.oil + '</h3><p class="dim">每件 ' + R.itemCost + " 灯油，全队生效，管到这一局结束。同一件再买就升一级，最高 " + R.itemMax + " 级。每波换一排货。</p>";
    r.shop.forEach((k, i) => {
      if (!k) return void (h += '<div class="item"><span class="dim">这一格空了。</span></div>');
      const lv = r.items[k] || 0;
      h += '<div class="item"><span><b>' + D.ITEMS[k].name + ' <i class="st">' + (lv ? "已有 " + lv + " 级" : "还没有") + "</i></b><small>" + D.ITEMS[k].note + '</small></span><button class="chip" data-act="shopBuy" data-v="' + i + '"' + (r.oil < R.itemCost ? " disabled" : "") + ">灯油 " + R.itemCost + "</button></div>";
    });
    if (itemList(r)) h += '<p class="dim">已经买了：' + itemList(r) + "。</p>";
    modal(h + '<div class="btns"><button class="btn" data-act="shopReroll"' + (r.oil < R.rerollCost ? " disabled" : "") + ">重摆一排（" + R.rerollCost + ' 灯油）</button><button class="btn main" data-act="close">离开</button></div>');
  }
  function promoPick() {
    const r = st.run, u = r.units.find((x) => x.id === r.promo);
    modal("<h3>" + D.UNITS[u.k].name + "到了 " + u.lv + ' 级，可以晋升</h3><p class="dim">二选一，之后不能改。</p><div class="btns col">' + D.SUBS[u.k].map((o, i) => '<button class="btn" data-act="promo" data-v="' + i + '"><b>' + o.name + "</b><small>" + o.note + "</small></button>").join("") + "</div>");
  }
  function showResult() {
    const L = st.last;
    const head = L.how === "won" ? "守住了十波" : L.how === "quit" ? "放弃了这一局" : "门被冲破了";
    const army = L.units.length ? "这一局的队伍：" + L.units.map((u) => S.nameOf(u) + " " + u.lv + " 级").join("、") + "。" : "这一局一个帮手都没召来。";
    modal("<h3>" + head + "</h3><p>守住了 " + L.wave + " 波。得到余烬 " + L.gain + '，可以在聚落换永久的升级。</p><p class="dim">' + army + '</p><div class="btns"><button class="btn main" data-act="close">回聚落</button></div>');
  }

  /* ---------- 面板 ---------- */
  const glyph = (k, cls) => '<img class="px ' + (cls || "gl") + '" alt="" src="' + P.glyphURL(k) + '">';
  function top() {
    const r = st.run;
    $("res").innerHTML = r
      ? '<span title="命">命 ' + r.hearts + "/" + r.heartsMax + '</span><span title="能核"><img class="px ic" alt="" src="' + P.iconURL("core") + '">' + r.cores + '</span><span title="灯油">灯油 ' + r.oil + "</span>"
      : '<span title="余烬"><img class="px ic" alt="" src="' + P.iconURL("fire") + '">余烬 ' + st.embers + '</span><span class="dim">最远 ' + st.best + " 波</span>";
    $("bSnd").textContent = opt.snd ? "关闭声音" : "打开声音";
  }
  const KIND = { judge: "审判波", boss: "首领波" };
  function waveHead(r) {
    const W = D.WAVES[r.wave];
    let next = "";
    for (let i = r.wave + 1; i < D.WAVES.length && !next; i++) if (D.WAVES[i].kind) next = "，再过 " + (i - r.wave) + " 波是" + KIND[D.WAVES[i].kind];
    return '<h3>第 ' + (r.wave + 1) + "/" + D.WAVES.length + " 波" + (W.kind ? ' <span class="lack">' + KIND[W.kind] + "：漏一个就输</span>" : "") + '</h3><p class="dim">来的是：' + W.foes.map(([e, n]) => D.ENEMIES[e].name + (n > 1 ? " ×" + n : "")).join("、") + (W.kind ? "" : next) + "。</p>";
  }
  function boardHtml(r) {
    const b = r.board, canN = b && r.nudges > 0 && !view.rolling;
    let h = '<div class="nudges">' + [0, 1, 2].map((c) => '<button class="chip" data-act="nudge" data-v="' + c + '"' + (canN ? "" : " disabled") + ">推</button>").join("") + "</div>";
    const win = new Set();
    if (b && view.reveal === 3 && !view.hold) D.LINES.forEach((L, i) => r.paid[i] && L.forEach((c) => win.add(c)));
    h += '<div class="board">';
    for (let i = 0; i < 9; i++) {
      const shown = b && i % 3 < view.reveal;
      h += '<div class="cell' + (win.has(i) ? " win" + (view.pop > now() ? " pop" : "") : "") + '">' + (shown ? glyph(b[i], "sym") : view.rolling ? '<i class="roll"></i>' : "") + "</div>";
    }
    return h + "</div>";
  }
  /* 卡片上的小标签：特性、印记（名字 + 阶），空的印记格画虚线框。 */
  function tags(u) {
    let h = '<span class="tags">' + (u.trait ? '<i class="tg">' + D.TRAITS[u.trait].name + "</i>" : "");
    for (let i = 0, n = S.slotsOf(u); i < n; i++) h += u.imp[i] ? '<i class="tg imp">' + impName(u.imp[i]) + "</i>" : '<i class="tg no" title="空的印记格"></i>';
    return h + "</span>";
  }
  /* 一个帮手的全部说明：兵种或晋升、特性、印记。选中时显示在队伍下面。 */
  function unitNote(u) {
    let t = (S.subOf(u) || D.UNITS[u.k]).note + "。";
    if (u.trait) t += "特性「" + D.TRAITS[u.trait].name + "」：" + D.TRAITS[u.trait].note + "。";
    t += "印记 " + u.imp.length + "/" + S.slotsOf(u) + " 格" + (u.imp.length ? "：" + u.imp.map((m) => impName(m) + "（" + D.IMPRINTS[m.k].note + "）").join("；") : "") + "。";
    return t;
  }
  function army(r) {
    const cap = S.capOf(st), over = r.units.length > cap;
    let h = '<div class="card"><h4>队伍 ' + r.units.length + "/" + cap + (over ? ' <span class="lack">超员，要吸收到 ' + cap + " 个才能继续</span>" : "") + "</h4>";
    if (!r.units.length) h += '<p class="dim">还没有帮手。</p>';
    else {
      h += '<div class="army">' + S.lineup(r.units).reverse().map(({ u }) => '<button class="unit' + (view.sel === u.id ? " on" : "") + '" data-act="unit" data-v="' + u.id + '" title="' + esc(unitNote(u)) + '">' + glyph(u.k) + "<span>" + S.nameOf(u) + "<small>" + u.lv + " 级</small></span>" + tags(u) + "</button>").join("") + "</div>";
      const sel = r.units.find((u) => u.id === view.sel);
      h += '<p class="dim">' + (sel ? "已选中" + uname(sel) + "。" + esc(unitNote(sel)) + "<br>再点另一个帮手，让它被吸收。" : "点一个帮手看它的特性和印记；再点另一个：前一个吸收后一个，等级相加，留下后一个兵种的印记。") + "</p>";
      if (over) h += '<div class="btns"><button class="btn" data-act="auto">自动吸收到不超员</button></div>';
    }
    if (itemList(r)) h += '<p class="dim">铺子买的：' + itemList(r) + "。</p>";
    if (r.own.length) h += '<p class="dim">核心：' + r.own.map((c) => D.CORES[c].name + "（" + D.CORES[c].note + "）").join("；") + "</p>";
    return h + "</div>";
  }
  function prepPanel() {
    const r = st.run, block = S.spinBlock(st), left = D.RULES.spinsPerWave - r.spins;
    let h = '<div class="card">' + waveHead(r) + boardHtml(r);
    h += '<p class="msg">' + esc(view.msg || " ") + "</p>";
    h += '<div class="btns two"><button class="btn main" data-act="spin"' + (block || view.rolling ? " disabled" : "") + "><b>拉拨盘</b><small>能核 -" + S.spinCost(st) + "，这一波还能拉 " + left + ' 次</small></button><button class="btn" data-act="fight"' + (S.fightBlock(st) || view.rolling ? " disabled" : "") + "><b>开打</b><small>" + (r.nudges ? "还能推 " + r.nudges + " 次" : "推已用完") + '</small></button></div><div class="btns"><button class="btn shop" data-act="shop"' + (view.rolling ? " disabled" : "") + ">铺子 · 灯油 " + r.oil + "</button></div></div>";
    return h + army(r) + '<div class="btns"><button class="btn" data-act="quit">放弃这一局</button></div>';
  }
  function fightPanel() {
    const r = st.run, W = D.WAVES[r.wave];
    return '<div class="card"><h3>第 ' + (r.wave + 1) + "/" + D.WAVES.length + " 波" + (W.kind ? ' <span class="lack">' + KIND[W.kind] + "：漏一个就输</span>" : "") + '</h3><p id="left" class="dim"></p><div class="btns two"><button class="btn" data-act="speed">速度 ×' + view.speed + '</button><button class="btn" data-act="quit">放弃这一局</button></div></div>';
  }
  function hud() {
    const f = st.run.fight, el = $("left");
    if (el) el.textContent = "还有敌人 " + (f.queue.length + f.ents.filter((e) => e.side === 1 && e.hp > 0).length) + "，帮手还站着 " + f.ents.filter((e) => e.side === 0 && e.hp > 0).length + "。";
    const hp = st.run.hearts + "/" + st.run.heartsMax;
    if (hud.last !== hp) {
      hud.last = hp;
      top();
    }
  }
  function townPanel() {
    let h = '<div class="card"><h3>守门</h3><p class="dim">十波敌人。拉拨盘召帮手，让帮手互相吸收升级，守住门。每一局从头开始；输了也能带回余烬。</p><div class="btns"><button class="btn main big" data-act="go">出发守门</button></div></div>';
    h += '<div class="card"><h4>永久升级 · 余烬 ' + st.embers + "</h4>";
    for (const k in D.META) {
      const M = D.META[k], n = st.meta[k], full = n >= M.max;
      h += '<div class="item"><span><b>' + M.name + (M.max > 1 ? " " + n + "/" + M.max : full ? "（已有）" : "") + "</b><small>" + M.note + '</small></span><button class="chip" data-act="buy" data-v="' + k + '"' + (full || st.embers < M.cost ? " disabled" : "") + ">" + (full ? "已满" : "余烬 " + M.cost) + "</button></div>";
    }
    h += '</div><div class="card"><h4>拨盘上的符号</h4><div class="legend">' + S0().map((k) => "<span>" + glyph(k) + D.UNITS[k].name + "<small>" + D.UNITS[k].note + "</small></span>").join("") + "<span>" + glyph("joker") + "百搭<small>顶任何一种</small></span></div>";
    return h + '<div class="btns"><button class="btn" data-act="reset">重新开始</button></div></div>';
  }
  const S0 = () => D.SYMBOLS.filter((k) => (k !== "hound" && k !== "drum") || st.meta[k]);
  function render() {
    top();
    const r = st.run;
    $("panel").innerHTML = !r ? townPanel() : r.phase === "fight" ? fightPanel() : prepPanel();
    if (r && r.phase === "fight") hud();
  }

  /* ---------- 启动 ---------- */
  $("bSnd").addEventListener("click", () => {
    acts.snd();
    render();
  });
  render();
  if (fresh) intro();
  else if (st.run && st.run.pick) corePick();
  else if (st.run && st.run.promo) promoPick();
  requestAnimationFrame(frame);
  window.__ember = { get state() { return st; }, sanitize, save, load };
})();

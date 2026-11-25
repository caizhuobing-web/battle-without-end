/* 万丈深渊：界面、存档、战斗循环。所有规则在 sim.js，这里只负责显示和输入。 */
(function () {
  const D = window.EmberData, S = window.EmberSim, P = window.EmberPixel, A = window.EmberAudio;
  const KEY = "wzsy.save.v4", BAK = "wzsy.save.v4.bak", OPT = "wzsy.opt.v1";
  const STEP = 1 / 30;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const stars = (n) => "★".repeat(n);

  /* ---------- 存档：逐字段校验。函数声明写法，保证调用点之前已定义。 ---------- */
  function num(v, lo, hi, def) {
    return typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  }
  function itemOk(x) {
    return !!x && ((x.t === "u" && x.k in D.UNITS) || (x.t === "g" && x.k in D.GEAR) || (x.t === "s" && x.k in D.SKILLS)) && [1, 2, 3].includes(x.star);
  }
  function sanitize(raw) {
    if (!raw || typeof raw !== "object" || raw.v !== 4) return null;
    const s = S.newGame(num(raw.rs, -2147483648, 2147483647, 1) | 0);
    s.bank = Math.floor(num(raw.bank, 0, 1e9, 0));
    s.lv = Math.floor(num(raw.lv, 1, 99, 1));
    if (raw.wear in D.OUTFITS) s.wear = raw.wear;
    s.best = Math.floor(num(raw.best, 0, D.WAVES.length, 0));
    s.runs = Math.floor(num(raw.runs, 0, 1e9, 0));
    s.auto = raw.auto !== false;
    const r = raw.run;
    // 进行中的一局只在两波之间存；结构不对就整段丢弃，回到聚落
    if (r && typeof r === "object" && r.wear in D.OUTFITS && Array.isArray(r.items) && r.items.every(itemOk) && new Set(r.items.map((x) => x.t + x.k)).size === r.items.length) {
      const skills = r.items.filter((x) => x.t === "s").length;
      if (skills <= D.SKILL_SLOTS && r.items.length - skills <= D.BAG) {
        s.run = { wear: r.wear, wave: Math.floor(num(r.wave, 0, D.WAVES.length - 1, 0)), cores: Math.floor(num(r.cores, 0, 1e7, 0)), hp: 1, items: r.items.map((x) => ({ t: x.t, k: x.k, star: x.star })), reel: null, spins: Math.floor(num(r.spins, 0, 99, 0)), phase: "spin", fight: null, ultT: num(r.ultT, 0, 60, 0) };
        s.run.hp = Math.round(num(r.hp, 1, S.heroStats(s).max, S.heroStats(s).max));
      }
    }
    return s;
  }
  let keep = null; // 最近一次两波之间的快照，战斗中刷新页面就回到这里
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
  const view = { flash: {}, fx: [], floats: [], shake: 0, ultT: 0, ultWear: "", speed: 1, rolling: 0 };

  /* ---------- 画布：整倍放大 ---------- */
  const cv = $("cv"), cx = cv.getContext("2d");
  cv.width = P.W;
  cv.height = P.H;
  function fit() {
    const land = window.matchMedia("(min-aspect-ratio: 4/3) and (min-width: 640px)").matches;
    const aw = $("stage").clientWidth, ah = land ? window.innerHeight - 60 : window.innerHeight * 0.45;
    let k = Math.min(aw / P.W, ah / P.H);
    if (k >= 2) k = Math.floor(k);
    cv.style.width = Math.floor(P.W * k) + "px";
    cv.style.height = Math.floor(P.H * k) + "px";
  }
  window.addEventListener("resize", fit);
  fit();

  /* ---------- 主循环：固定步长推进战斗，再画一帧 ---------- */
  let lastMs = 0, acc = 0, sndAt = 0;
  function frame(ms) {
    const t = ms / 1000, dt = Math.min(0.1, (ms - lastMs) / 1000 || 0);
    lastMs = ms;
    view.shake = Math.max(0, view.shake - dt * 3);
    if (st.run && st.run.phase === "fight") {
      acc += dt * view.speed;
      let guard = 0;
      while (acc >= STEP && st.run && st.run.phase === "fight" && guard++ < 8) {
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
  /* 把规则层这一步发生的事变成画面效果和声音。 */
  function drain(f, t) {
    for (const e of f.ev) {
      if (e.k === "hit") {
        view.flash[e.id] = t + 0.08;
        if (e.side === 0 && e.id === 0) view.shake = Math.max(view.shake, 0.5);
        if (e.big || e.v >= 10) view.floats.push({ s: String(e.v), x: e.x + (e.side ? 4 : -4), y: 70 - (view.floats.length % 3) * 6, c: e.side ? (e.big ? P.PAL.emberHi : P.PAL.snow) : P.PAL.blood, t0: t });
        if (t - sndAt > 0.07) {
          sndAt = t;
          A.play(e.side ? "hit" : "hurt");
        }
      } else if (e.k === "ult") {
        view.ultT = t + 0.3;
        view.ultWear = e.wear;
        view.shake = 1;
        A.play("fire");
      } else {
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
    if (!st.run) {
      A.play(st.last.how === "won" ? "core" : "warn");
      showResult();
    } else A.play("core");
    save();
    render();
  }

  /* ---------- 动作 ---------- */
  const acts = {
    wear(id) {
      S.wear(st, id);
    },
    upgrade() {
      if (S.upgrade(st)) A.play("ok");
    },
    go() {
      S.startRun(st);
      A.play("step");
    },
    spin() {
      if (view.rolling) return;
      if (!S.spin(st)) return toast("能核不够再拉一次。");
      // 拨盘先滚半秒再停，停下时才显示结果
      view.rolling = 1;
      A.play("step");
      const tick = setInterval(() => {
        document.querySelectorAll(".reel .cell").forEach((el) => {
          const all = Object.keys(D.UNITS).map((k) => ({ t: "u", k })).concat(Object.keys(D.GEAR).map((k) => ({ t: "g", k })));
          el.innerHTML = '<img class="px" alt="" src="' + P.glyphURL(all[Math.floor(Math.random() * all.length)]) + '">';
        });
      }, 60);
      setTimeout(() => {
        clearInterval(tick);
        view.rolling = 0;
        A.play(st.run.reel.some((x) => x.got === "up") ? "core" : "ok");
        save();
        render();
      }, 480);
    },
    fight() {
      if (S.beginWave(st)) A.play("step");
    },
    home() {
      if (S.goHome(st)) {
        A.play("ok");
        showResult();
      }
    },
    ult() {
      S.ult(st);
    },
    speed() {
      view.speed = view.speed === 1 ? 2 : 1;
    },
    auto() {
      st.auto = !st.auto;
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
    if (b.dataset.act !== "spin") {
      save();
      render();
    } else render();
  });
  document.addEventListener("keydown", (e) => {
    if (!$("modal").hidden) {
      if (e.key === "Escape" || e.key === "Enter") closeModal();
      return;
    }
    const sel = { " ": "[data-act=spin],[data-act=ult],[data-act=go]", Enter: "[data-act=fight]", h: "[data-act=home]" }[e.key];
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
    const f = m.querySelector(".btn.main") || m.querySelector(".btn");
    if (f) f.focus();
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
    modal('<h3>灰炉屯</h3><p>炉火只够再烧几天。你带着一只前人留下的旧拨盘，下到渊隙里去。</p><p>每一波开打前拉一次拨盘。拉出来的帮手、装备、技艺都归你，同名的会自动合并升星。</p><p>能核可以带回家，也可以花掉多拉几次。倒下只能带回一半。</p><div class="btns"><button class="btn main" data-act="close">知道了</button></div>');
  }
  function showResult() {
    const L = st.last;
    const head = L.how === "won" ? "打穿了霜根廊" : L.how === "home" ? "回到灰炉屯" : "倒在了第 " + (L.wave + 1) + " 波";
    const body = L.how === "dead" ? "背着能核 " + L.cores + "，只带回一半：" + L.keep + "。" : L.how === "won" ? "带回能核 " + L.cores + "，另加打穿的 20，共 " + L.keep + "。" : "打过了 " + L.wave + " 波，带回能核 " + L.keep + "。";
    modal("<h3>" + head + "</h3><p>" + body + '</p><p class="dim">' + rosterText(L.items) + '</p><div class="btns"><button class="btn main" data-act="close">好</button></div>');
  }
  const rosterText = (items) => (items.length ? "这一局的队伍：" + items.map((x) => S.info(x).name + stars(x.star)).join("、") + "。" : "这一局没拉到东西。");

  /* ---------- 面板 ---------- */
  const glyph = (it) => '<img class="px gl" alt="" src="' + P.glyphURL(it) + '">';
  function top() {
    $("res").innerHTML = '<span title="带回家的能核"><img class="px ic" alt="" src="' + P.iconURL("core") + '">' + st.bank + "</span>" + (st.run ? '<span class="dim">背着 ' + st.run.cores + "</span>" : '<span class="dim">最远第 ' + st.best + " 波</span>");
    $("bSnd").textContent = opt.snd ? "关闭声音" : "打开声音";
  }
  function waveText(i) {
    return D.WAVES[i].map(([e, n]) => D.ENEMIES[e].name + (n > 1 ? " ×" + n : "")).join("、");
  }
  function roster(r) {
    if (!r.items.length) return '<p class="dim">还没有队伍。拉一次拨盘。</p>';
    const skills = r.items.filter((x) => x.t === "s").length;
    return (
      '<div class="roster">' +
      r.items.map((x) => '<div class="it" title="' + esc(S.info(x).note) + '">' + glyph(x) + "<span><b>" + S.info(x).name + ' <i class="st">' + stars(x.star) + "</i></b><small>" + S.info(x).note + "</small></span></div>").join("") +
      '</div><p class="dim">背包 ' + (r.items.length - skills) + "/" + D.BAG + "，技艺 " + skills + "/" + D.SKILL_SLOTS + "。放不下的换成 3 个能核。</p>"
    );
  }
  const GOT = { new: "新来的", up: "合并升星", core: "换成能核 3" };
  function spinPanel() {
    const r = st.run, cost = S.spinCost(st), hs = S.heroStats(st);
    let h = '<div class="card"><h3>第 ' + (r.wave + 1) + "/" + D.WAVES.length + ' 波 <span class="dim">' + waveText(r.wave) + '</span></h3><div class="row"><span class="lbl c-' + r.wear + '">' + D.OUTFITS[r.wear].name + "</span>" + bar("hp", r.hp, hs.max) + '<span class="lbl">' + r.hp + "/" + hs.max + "</span></div>";
    h += '<div class="reel">' + [0, 1, 2].map((i) => {
      const x = r.reel && r.reel[i];
      return '<div class="cell' + (x ? " got-" + x.got : "") + '">' + (x ? glyph(x) + "<b>" + S.info(x).name + "</b><small>" + GOT[x.got] + "</small>" : "<small>？</small>") + "</div>";
    }).join("") + "</div>";
    h += '<div class="btns col"><button class="btn main big" data-act="spin"' + (r.cores < cost ? " disabled" : "") + ">拉拨盘" + (cost ? "（能核 -" + cost + "）" : "（这一波免费）") + "</button>";
    h += '<div class="btns two"><button class="btn" data-act="fight"' + (r.spins ? "" : " disabled") + '>开打</button><button class="btn" data-act="home">回家（带走 ' + r.cores + "）</button></div></div></div>";
    return h + '<div class="card"><h4>队伍</h4>' + roster(r) + "</div>";
  }
  function bar(cls, v, max) {
    return '<div class="bar ' + cls + '"><i style="width:' + Math.round(Math.max(0, Math.min(1, v / max)) * 100) + '%"></i></div>';
  }
  function fightPanel() {
    const r = st.run;
    return (
      '<div class="card"><h3>第 ' + (r.wave + 1) + "/" + D.WAVES.length + ' 波</h3><div class="row"><span class="lbl c-' + r.wear + '">' + D.OUTFITS[r.wear].name + '</span><div class="bar hp"><i id="hpI"></i></div><span class="lbl" id="hpT"></span></div>' +
      '<div class="btns two"><button class="btn main" data-act="ult" id="bUlt"></button><button class="btn" data-act="speed">' + (view.speed === 1 ? "加速 ×2" : "正常速度") + "</button></div>" +
      '<div class="row"><button class="chip' + (st.auto ? " on" : "") + '" data-act="auto">大招自动放：' + (st.auto ? "开" : "关") + '</button><span class="dim" id="left"></span></div></div>'
    );
  }
  /* 战斗中每帧只更新几个数字，不重画整个面板。 */
  function hud() {
    const r = st.run, f = r.fight, hero = f.ents[0];
    const i = $("hpI");
    if (!i) return;
    i.style.width = Math.round(Math.max(0, hero.hp / hero.max) * 100) + "%";
    $("hpT").textContent = Math.max(0, Math.round(hero.hp)) + "/" + hero.max;
    const b = $("bUlt"), O = D.OUTFITS[r.wear];
    b.textContent = f.ult > 0 ? O.ult + "（" + Math.ceil(f.ult) + " 秒）" : "放大招：" + O.ult;
    b.disabled = f.ult > 0;
    $("left").textContent = "还有敌人 " + (f.queue.length + f.ents.filter((e) => e.side === 1 && e.hp > 0).length);
  }
  function townPanel() {
    const O = D.OUTFITS[st.wear], cost = S.upgradeCost(st), hs = S.heroStats(st);
    let h = '<div class="card"><h3>选一套行装</h3><div class="seg">' + Object.keys(D.OUTFITS).map((id) => '<button class="chip' + (st.wear === id ? " on" : "") + '" data-act="wear" data-v="' + id + '">' + D.OUTFITS[id].name + "</button>").join("") + "</div>";
    h += '<p class="c-' + st.wear + '">' + O.note + '。</p><p class="dim">大招「' + O.ult + "」：" + O.ultNote + "。拨盘里更常出：" + O.bias.map((k) => (D.UNITS[k] || D.GEAR[k]).name).join("、") + "。</p>";
    h += '<p class="dim">行装 ' + st.lv + " 级，生命 " + hs.max + "，攻击 " + Math.round(hs.atk * 10) / 10 + '。</p><div class="btns col"><button class="btn main big" data-act="go">出发</button><button class="btn" data-act="upgrade"' + (st.bank >= cost ? "" : " disabled") + ">升级行装（能核 -" + cost + "，生命和攻击 +10%）</button></div></div>";
    h += '<div class="card"><h4>怎么玩</h4><p class="dim">每一波先拉拨盘，再开打。同名的自动合并升星，最高三星。能核带回家才算数，也可以花掉多拉几次。一共十波，第十波是老鬣首。</p><div class="btns"><button class="btn" data-act="reset">重新开始</button></div></div>';
    return h;
  }
  function render() {
    top();
    const p = $("panel"), r = st.run;
    p.innerHTML = !r ? townPanel() : r.phase === "fight" ? fightPanel() : spinPanel();
    if (r && r.phase === "fight") hud();
  }

  /* ---------- 启动 ---------- */
  $("bSnd").addEventListener("click", () => {
    acts.snd();
    render();
  });
  render();
  if (fresh) intro();
  requestAnimationFrame(frame);
  window.__ember = { get state() { return st; }, sanitize, save, load };
})();

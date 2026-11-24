/* 万丈深渊：界面、存档、动画回放。所有规则在 sim.js，这里只负责显示和输入。 */
(function () {
  const D = window.EmberData, S = window.EmberSim, P = window.EmberPixel, A = window.EmberAudio;
  const KEY = "wzsy.save.v1", BAK = "wzsy.save.v1.bak", OPT = "wzsy.opt.v1";
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ic = (id, col) => '<img class="px ic" alt="" src="' + P.iconURL(id, col) + '">';

  /* ---------- 存档：逐字段校验。函数声明写法，保证调用点之前已定义。 ---------- */
  function num(v, lo, hi, def) {
    return typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  }
  function bag(o, keys) {
    const out = {};
    if (o && typeof o === "object") for (const k of keys) if (o[k] != null) out[k] = Math.floor(num(o[k], 0, 1e6, 0));
    return out;
  }
  function sanitize(raw) {
    if (!raw || typeof raw !== "object" || raw.v !== 1) return null;
    const s = S.newGame(num(raw.rs, -2147483648, 2147483647, 1) | 0, num(raw.idleAt, 0, 1e15, Date.now()));
    const MK = Object.keys(D.MATS);
    s.store.core = Math.floor(num(raw.store && raw.store.core, 0, 1e7, 0));
    s.store.mats = bag(raw.store && raw.store.mats, MK);
    s.hearth = Math.floor(num(raw.hearth, 0, D.HEARTH.max, D.HEARTH.start));
    for (const k in s.gear) s.gear[k] = Math.floor(num(raw.gear && raw.gear[k], 0, D.GEAR[k].levels.length - 1, 0));
    for (const id in s.cls) {
      const c = raw.cls && raw.cls[id];
      s.cls[id] = { lv: Math.floor(num(c && c.lv, 1, 99, 1)), adv: !!(c && c.adv) };
    }
    s.route = Math.floor(num(raw.route, 0, D.ROUTE.length, 0));
    for (const l of [1, 2, 3]) if (raw.cleared && raw.cleared[l]) s.cleared[l] = true;
    if (raw.flags && typeof raw.flags === "object") for (const k in raw.flags) if (/^[a-zA-Z_]{1,24}$/.test(k) && raw.flags[k] === true) s.flags[k] = true;
    if (raw.tactic) {
      if (raw.tactic.stance in D.STANCES) s.tactic.stance = raw.tactic.stance;
      if (raw.tactic.mode in D.MODES) s.tactic.mode = raw.tactic.mode;
      s.tactic.breach = raw.tactic.breach !== false;
    }
    s.dives = Math.floor(num(raw.dives, 0, 1e6, 0));
    s.idleBank = num(raw.idleBank, 0, 1, 0);
    if (raw.tide && typeof raw.tide === "object") s.tide = { wave: Math.floor(num(raw.tide.wave, 0, S.TIDE.length - 1, 0)) };
    if (s.route >= D.ROUTE.length && !s.tide && !raw.won) s.tide = { wave: 0 };
    s.won = !!raw.won;
    if (Array.isArray(raw.log)) s.log = raw.log.filter((x) => typeof x === "string").slice(-40);
    if (raw.dive && diveOk(raw.dive)) s.dive = raw.dive;
    return s;
  }
  /* 下潜中的存档结构复杂，校验不过就整段丢弃（相当于小队已撤回），不让坏数据进模拟层。 */
  function diveOk(d) {
    try {
      if (![1, 2, 3].includes(d.layer) || !Array.isArray(d.map) || !Array.isArray(d.team) || d.team.length !== 3) return false;
      if (!Number.isFinite(d.o2) || !Number.isFinite(d.o2Max) || !Number.isInteger(d.step) || d.step < 0 || d.step > d.map.length) return false;
      if (!d.carry || !Number.isFinite(d.carry.core)) return false;
      for (const m of d.team) if (!(m.id in D.CLASSES) || !Number.isFinite(m.hp) || !Number.isFinite(m.max)) return false;
      for (const row of d.map) for (const n of row) if (n.e && !(n.e in D.ENEMIES)) return false;
      if (d.enc && (!(d.enc.e in D.ENEMIES) || !Array.isArray(d.enc.foes))) return false;
      if (d.event && d.event !== "rescue") return false;
      return true;
    } catch (e) {
      return false;
    }
  }
  function snapOk(s) {
    try {
      return !!sanitize(JSON.parse(JSON.stringify(s)));
    } catch (e) {
      return false;
    }
  }
  function save() {
    if (!snapOk(st)) return;
    try {
      const txt = JSON.stringify(Object.assign({}, st, { fx: undefined }));
      const old = localStorage.getItem(KEY);
      if (old) localStorage.setItem(BAK, old);
      localStorage.setItem(KEY, txt);
    } catch (e) {}
  }
  function load() {
    for (const k of [KEY, BAK]) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const s = sanitize(JSON.parse(raw));
        if (s) return s;
      } catch (e) {}
    }
    return null;
  }
  function encode(s) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  }
  function decode(code) {
    return sanitize(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));
  }

  /* ---------- 状态 ---------- */
  let st = load();
  const fresh = !st;
  if (!st) st = S.newGame((Math.random() * 2147483647) | 0, Date.now());
  delete st.fx;
  let opt = { snd: true };
  try {
    opt = Object.assign(opt, JSON.parse(localStorage.getItem(OPT) || "{}"));
  } catch (e) {}
  A.set(opt.snd);
  const view = { tab: "go", fight: null, floats: [], flash: {}, shake: 0, walk: 0, reveal: 0, startLayer: 1, after: null };

  /* ---------- 画布 ---------- */
  const cv = $("cv"), cx = cv.getContext("2d");
  cv.width = P.W;
  cv.height = P.H;
  let lastT = 0;
  function frame(ms) {
    const t = ms / 1000, dt = Math.min(0.1, t - lastT || 0);
    lastT = t;
    view.shake = Math.max(0, view.shake - dt * 3);
    view.walk = Math.max(0, view.walk - dt);
    if (view.fight) stepFight(t);
    P.draw(cx, st, view, t);
    requestAnimationFrame(frame);
  }

  /* ---------- 战斗回放 ---------- */
  function startFight(after) {
    if (!st.fx) return after && after();
    view.fight = { fx: st.fx, i: 0, next: 0, after };
    delete st.fx;
    render();
  }
  function stepFight(t) {
    const f = view.fight;
    if (!f.next) f.next = t + 0.35;
    if (t < f.next) return;
    const fr = f.fx.frames;
    if (f.i >= fr.length - 1) {
      if (t < f.next + 0.4) return;
      endFight();
      return;
    }
    const a = fr[f.i], b = fr[f.i + 1];
    let hurt = false, hit = false;
    a.t.forEach((hp, i) => {
      const dmg = hp - b.t[i];
      if (dmg > 0) {
        const p = P.slot("t", i);
        view.floats.push({ s: "-" + dmg, x: p.x, y: p.y, c: P.PAL.blood, t0: t });
        view.flash["t" + i] = t + 0.12;
        hurt = true;
      }
    });
    a.f.forEach((hp, i) => {
      const dmg = hp - b.f[i];
      if (dmg > 0) {
        const p = P.slot("f", i, a.f.length, f.fx.e);
        view.floats.push({ s: String(dmg), x: p.x, y: p.y, c: P.PAL.snow, t0: t + 0.05 });
        view.flash["f" + i] = t + 0.12;
        hit = true;
      }
    });
    if (view.floats.length > 24) view.floats.splice(0, view.floats.length - 24);
    if (hit) A.play("hit");
    if (hurt) {
      A.play("hurt");
      view.shake = 0.6;
    }
    f.i++;
    f.next = t + (fr.length > 20 ? 0.2 : 0.32);
  }
  function endFight() {
    const f = view.fight;
    view.fight = null;
    view.floats = [];
    view.flash = {};
    if (f.after) f.after();
    afterAction();
  }

  /* ---------- 动作 ---------- */
  let wasDiving = !!st.dive;
  function afterAction() {
    if (view.fight) {
      save();
      render();
      return;
    }
    if (wasDiving && !st.dive && st.last && !view.fight) {
      wasDiving = false;
      showResult();
    }
    wasDiving = !!st.dive;
    save();
    render();
  }
  const acts = {
    tab(v) {
      view.tab = v;
    },
    layer(v) {
      view.startLayer = +v;
    },
    go() {
      S.startDive(st, view.startLayer);
      wasDiving = true;
      view.walk = 0.6;
      A.play("step");
    },
    node(i) {
      const n = S.moveTo(st, +i);
      view.walk = 0.5;
      A.play("step");
      if (n.hidden) A.play("warn");
      if (st.dive && st.dive.enc && D.ENEMIES[st.dive.enc.e].trait === "ambush" && !n.frozen) view.shake = 0.8;
    },
    fight() {
      S.act(st, "fight");
      startFight();
    },
    detour() {
      S.act(st, "detour");
      startFight();
    },
    retreat() {
      S.act(st, "retreat");
    },
    home() {
      S.goHome(st);
    },
    rescue(v) {
      S.rescue(st, v === "1");
      A.play(v === "1" ? "ok" : "warn");
    },
    tac(v) {
      const [k, val] = v.split(":");
      S.setTactic(st, k, k === "breach" ? val === "1" : val);
    },
    skip() {
      if (view.fight) endFight();
    },
    stoke() {
      if (S.stoke(st)) A.play("fire");
    },
    build(k) {
      if (S.build(st, k)) A.play("ok");
    },
    train(id) {
      if (S.train(st, id)) A.play("ok");
    },
    promote(id) {
      if (S.promote(st, id)) {
        A.play("core");
        story("adv_" + id);
      }
    },
    repair() {
      if (S.repair(st)) {
        A.play("core");
        if (st.route === 1) story("route1");
        if (st.route === 2) story("route2");
        if (st.tide) story("tide");
      }
    },
    tide() {
      const w = st.tide.wave;
      S.tideWave(st);
      startFight(() => {
        if (st.won) story("win");
        else if (st.tide.wave > w) toast("兽潮第 " + (w + 1) + " 波守住了。");
        else toast("第 " + (w + 1) + " 波没守住。炉温 -3。");
      });
    },
    snd() {
      opt.snd = !opt.snd;
      A.set(opt.snd);
      try {
        localStorage.setItem(OPT, JSON.stringify(opt));
      } catch (e) {}
    },
    export() {
      modal('<h3>导出存档</h3><p>复制下面这段存档码，在另一台设备的设置里导入。</p><textarea readonly id="code">' + esc(encode(st)) + '</textarea><div class="btns"><button class="btn" data-act="close">关闭</button></div>');
      const ta = $("code");
      ta.focus();
      ta.select();
    },
    import() {
      modal('<h3>导入存档</h3><p>导入会覆盖当前进度。</p><textarea id="code" placeholder="在这里粘贴存档码"></textarea><div class="btns"><button class="btn main" data-act="doImport">导入</button><button class="btn" data-act="close">取消</button></div>');
    },
    doImport() {
      let s = null;
      try {
        s = decode($("code").value);
      } catch (e) {}
      if (!s) {
        toast("存档码无法识别，存档未改动。请检查是否复制完整。");
        return;
      }
      st = s;
      wasDiving = !!st.dive;
      closeModal();
      toast("存档已导入。");
    },
    reset() {
      modal('<h3>重新开始</h3><p>清除全部进度，从第一次下潜开始。这一步不能撤销。</p><div class="btns"><button class="btn warn" data-act="doReset">清除进度并重新开始</button><button class="btn" data-act="close">取消</button></div>');
    },
    doReset() {
      st = S.newGame((Math.random() * 2147483647) | 0, Date.now());
      wasDiving = false;
      closeModal();
      story("intro");
    },
    close() {
      closeModal();
    },
  };

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const a = b.dataset.act, fn = acts[a];
    if (!fn) return;
    if (view.fight && !["skip", "snd", "tab"].includes(a)) return;
    try {
      fn(b.dataset.v);
    } catch (err) {
      console.error(err);
    }
    if (["close", "doImport", "doReset", "export", "import", "reset"].includes(a)) {
      save();
      render();
      return;
    }
    afterAction();
  });
  document.addEventListener("keydown", (e) => {
    if ($("modal").hidden === false) {
      if (e.key === "Escape" && !$("modal").querySelector("[data-act=rescue]")) closeModal();
      return;
    }
    const k = e.key.toLowerCase();
    const map = { 1: "[data-act=node][data-v='0']", 2: "[data-act=node][data-v='1']", 3: "[data-act=node][data-v='2']", f: "[data-act=fight]", d: "[data-act=detour]", r: "[data-act=retreat],[data-act=home]", " ": "[data-act=skip],[data-act=go]" };
    const sel = map[k];
    if (!sel) return;
    const b = document.querySelector(sel);
    if (b && !b.disabled) {
      e.preventDefault();
      b.click();
    }
  });

  /* ---------- 弹窗与剧情 ---------- */
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
    if (queue.length) setTimeout(() => modal(queue.shift()), 0);
  }
  const queue = [];
  function show(html) {
    if ($("modal").hidden) modal(html);
    else queue.push(html);
  }
  const STORY = {
    intro: ["灰炉屯", "灰炉屯的炉火只够再烧几天。", "镇子北边有一条废弃了三十年的补给线，从霜根廊一直通到渊隙深处。", "你带上猎核者、护卫者和御炉者，沿着它下去。能核能让炉火续燃。带回来才算数。"],
    wei: ["苇", "苇是从路的另一头走过来的。她说旧补给线没有断，只是没人维护。", "修好它，常规队伍就能沿线来回，不用每次都靠你们。补给线在聚落的「补给线」页。"],
    weiSign: ["路标", "据点后面的岩壁上刻着新鲜的路标，指向更深处。有人走过这条路，还做了记号。", "照着路标，可以开始修复补给线。补给线在聚落的「补给线」页。"],
    route1: ["石灯", "第一段补给线修好了。常规队伍开始沿线往返，就算你不在，也会带回能核。", "苇说，路的另一端是她的聚落，叫石灯。那边也在等这条路。", "现在可以直接从回声井出发。"],
    route2: ["第二段", "第二段修好了。回声井的峭壁上挂起了新绳。", "现在可以直接从沸雾窟出发。"],
    relic: ["古件", "雾窟巨兽的巢里有一盏旧灯。不亮，但每隔一会儿就发出一次脉冲，很规律。", "没人认得它。先带回去放着。"],
    tide: ["兽潮", "第三段修通的那天夜里，路的深处传来很多脚步声。", "兽群沿着新修的路涌上来了。守住三波，这条路才算真正属于灰炉屯。", "失守一波炉温 -3。可以先回去准备，再来迎击。"],
    adv_hunter: ["定向破甲", "猎核者学会了从层甲骨的纹路里找破绽。", "战斗中开启破甲：猎核者第一击只破甲不造成伤害，之后全队对该敌伤害 +30%，击杀必得完整能核。敌人多而弱时不划算。"],
    adv_guard: ["姿态切换", "韧骨板让护卫者能在两种站法之间切换。", "展开掩护：替全队承受伤害，每挡一次耐力 -2，耐力耗尽自动解除。机动反击：自身伤害 ×2.2，被打时反击，但不再替队友挡。"],
    adv_stoker: ["模式切换", "导热丝让御炉者能把炉罐接到不同的输出上。", "投射：单体高伤。压制：打全部敌人。装甲：全队护甲 +3，且不烧能核。三种不能同时满输出。"],
  };
  function story(k) {
    if (st.flags["seen_" + k]) return;
    st.flags["seen_" + k] = true;
    if (k === "win") {
      show('<h3>补给线恢复</h3><p>第三波退了。</p><p>天亮的时候，石灯方向来了第一支补给队。炉火今晚不用省着烧。</p><p class="dim">共下潜 ' + st.dives + ' 次。第一阶段完成。可以继续下潜、继续建设。</p><div class="btns"><button class="btn main" data-act="close">回到灰炉屯</button></div>');
      return;
    }
    const s = STORY[k];
    show("<h3>" + s[0] + "</h3>" + s.slice(1).map((p) => "<p>" + esc(p) + "</p>").join("") + '<div class="btns"><button class="btn main" data-act="close">继续</button></div>');
  }
  function showResult() {
    const L = st.last;
    const mats = Object.keys(L.mats).filter((k) => L.mats[k] > 0).map((k) => D.MATS[k].name + " " + L.mats[k]).join("，");
    const head = L.how === "wiped" ? "小队倒下了" : "全员归返";
    const body = L.how === "wiped" ? "背着的东西都丢在了" + D.LAYERS[L.layer - 1].name + "。炉温 -2。" : "带回能核 " + L.core + (mats ? "，" + mats : "") + "。炉温 -1。";
    show("<h3>" + head + "</h3><p>" + body + '</p><div class="btns"><button class="btn main" data-act="close">回到灰炉屯</button></div>');
    if (st.flags.wei) story("wei");
    else if (st.flags.weiSign) story("weiSign");
    if (st.flags.relic) story("relic");
  }
  let toastT = 0;
  function toast(msg) {
    if (!msg) return;
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (el.hidden = true), 2600);
  }

  /* ---------- 渲染面板 ---------- */
  function cost(need) {
    return Object.keys(need)
      .map((k) => {
        const have = k === "core" ? st.store.core : st.store.mats[k] || 0;
        const name = k === "core" ? "能核" : D.MATS[k].name;
        return '<span class="' + (have >= need[k] ? "" : "lack") + '">' + name + " " + have + "/" + need[k] + "</span>";
      })
      .join(" ");
  }
  function barH(cls, v, max, mark) {
    const k = Math.max(0, Math.min(1, v / max));
    return '<div class="bar ' + cls + '"><i style="width:' + Math.round(k * 100) + '%"></i>' + (mark != null ? '<b style="left:' + Math.round(Math.min(1, mark / max) * 100) + '%"></b>' : "") + "</div>";
  }
  function top() {
    const rate = S.idleRate(st);
    $("res").innerHTML =
      '<span title="能核">' + ic("core") + st.store.core + "</span>" +
      '<span title="炉温">' + ic("fire") + st.hearth + "/" + D.HEARTH.max + "</span>" +
      (rate ? '<span class="dim" title="常规队伍每分钟带回的能核">常规队伍 +' + rate + "/分</span>" : "");
    $("bSnd").textContent = opt.snd ? "有声" : "静音";
  }
  function render() {
    top();
    const p = $("panel");
    if (view.fight) p.innerHTML = fightPanel();
    else if (st.dive) p.innerHTML = divePanel();
    else p.innerHTML = townPanel();
    if (st.dive && st.dive.event === "rescue" && $("modal").hidden) rescueModal();
  }
  function fightPanel() {
    const fx = view.fight.fx, E = D.ENEMIES[fx.e];
    return '<div class="card"><h3>' + (fx.tide ? "兽潮 第 " + fx.tide + " 波 · " : "") + "交战 · " + E.name + '</h3><p class="dim">' + teamLine() + '</p><div class="btns"><button class="btn" data-act="skip">跳过回放</button></div></div>' + logBox();
  }
  function teamLine() {
    if (!st.dive) return "";
    return st.dive.team.map((m) => D.CLASSES[m.id].name + " " + Math.max(0, Math.round(m.hp)) + "/" + m.max).join("　");
  }
  function hudBlock() {
    const d = st.dive, rc = S.returnCost(st), w = S.weight(st), cap = S.capacity(st);
    const mats = Object.keys(d.carry.mats).filter((k) => d.carry.mats[k] > 0).map((k) => D.MATS[k].name + " " + d.carry.mats[k]).join("，");
    return (
      '<div class="hud">' +
      '<div class="row">' + ic("o2") + '<span class="lbl">氧气 ' + d.o2 + "/" + d.o2Max + "</span>" + barH("o2", d.o2, d.o2Max, rc) + '<span class="lbl ' + (d.o2 < rc ? "lack" : "dim") + '">回程 ' + rc + "</span></div>" +
      '<div class="row">' + ic("load") + '<span class="lbl ' + (w > cap ? "lack" : "") + '">负重 ' + fmt(w) + "/" + cap + "</span>" + barH("load", w, cap) + '<span class="lbl ' + (w > cap ? "lack" : "dim") + '">' + (w > cap ? "超重" : "") + "</span></div>" +
      '<div class="row">' + ic("core") + '<span class="lbl">背着能核 ' + d.carry.core + "</span>" + (mats ? '<span class="lbl dim">' + mats + "</span>" : "") + "</div>" +
      '<div class="row team">' + d.team.map((m) => '<span class="c-' + m.id + '">' + D.CLASSES[m.id].name + " " + Math.max(0, Math.round(m.hp)) + "/" + m.max + "</span>").join("") + "</div>" +
      "</div>"
    );
  }
  const fmt = (x) => (Math.round(x * 10) / 10).toString();
  function nodeText(n, L) {
    if (n.t === "fight") {
      const E = D.ENEMIES[n.e];
      return [E.name + (E.n > 1 ? " ×" + E.n : ""), n.frozen ? "冰封：绕行时不会被伏击，绕行多费 1 氧气" : TRAIT[E.trait] || "敌情", "fight"];
    }
    if (n.t === "boss") return ["据点 · " + D.ENEMIES[n.e].name, "清掉它才能修复这一段补给线。不能绕行", "boss"];
    if (n.t === "crate") return ["冰封的旧货箱", "开箱氧气 -1，能核 +4，" + D.MATS[L.mat].name + " +1", "crate"];
    if (n.t === "anchor") return ["锚点", "修好后，本层回程氧气减半", "anchor"];
    if (n.t === "spring") return ["热泉", "氧气 +6", "spring"];
    if (n.t === "cache") return ["补给", "能核 +2 到 4", "cache"];
    return ["未知", "可能有余气，也可能塌方", "unknown"];
  }
  const TRAIT = { ambush: "伏击：靠近时先手一击", track: "成群追踪：绕行有一半机会甩不掉", mimic: "伪装：靠近才现形，现形后封路", "": "成群：数量多，单个弱。御炉者的压制最有效" };
  function divePanel() {
    const d = st.dive, L = D.LAYERS[d.layer - 1];
    let h = hudBlock();
    if (d.event === "rescue") return h + '<div class="card"><p>岩缝里有人在呼救。</p></div>';
    if (d.enc) return h + encPanel() + logBox();
    const rc = S.returnCost(st);
    if (d.atEnd) {
      return h + '<div class="card"><h3>' + L.name + '据点已清</h3><p>再往下没有路标了。带着收获回去吧。</p><div class="btns"><button class="btn main" data-act="home">归返（回程氧气 ' + rc + "）</button></div></div>" + logBox();
    }
    const opts = S.options(st);
    const sc = S.stepCost(st, d.layer);
    h += '<div class="card"><h3>' + L.name + " · 第 " + (d.step + 1) + "/" + d.map.length + ' 步</h3><p class="dim">每走一步氧气 -' + sc + (L.special === "fog" ? "（雾中 +1）" : "") + (S.overweight(st) ? "（超重 +1）" : "") + (L.special === "cliff" && S.overweight(st) ? "，超重时可能在峭壁上滑落" : "") + '</p><div class="nodes">';
    opts.forEach((n, i) => {
      const [name, desc, icon] = nodeText(n, L);
      const tight = d.o2 - sc < rc + (n.t === "crate" ? 1 : 0) - (n.t === "spring" ? 6 : 0);
      h += '<button class="node" data-act="node" data-v="' + i + '">' + ic(icon) + '<span><b>' + esc(name) + "</b><small>" + esc(desc) + "</small>" + (tight ? '<small class="lack">走这一步后，回程氧气不够</small>' : "") + '</span><kbd>' + (i + 1) + "</kbd></button>";
    });
    h += '</div><div class="btns"><button class="btn" data-act="home">归返（回程氧气 ' + rc + "）</button></div></div>";
    return h + logBox();
  }
  function tactics() {
    let h = "";
    const t = st.dive ? st.dive : st.tactic;
    if (st.cls.hunter.adv) h += tacRow("猎核者 · 破甲", [["breach:1", "开", t.breach], ["breach:0", "关", !t.breach]]);
    if (st.cls.guard.adv) h += tacRow("护卫者 · 姿态", [["stance:cover", "展开掩护", t.stance === "cover"], ["stance:counter", "机动反击", t.stance === "counter"]]);
    if (st.cls.stoker.adv) h += tacRow("御炉者 · 模式", [["mode:lance", "投射", t.mode === "lance"], ["mode:blanket", "压制", t.mode === "blanket"], ["mode:plating", "装甲", t.mode === "plating"]]);
    return h ? '<div class="tac">' + h + "</div>" : "";
  }
  function tacRow(label, items) {
    return '<div class="row"><span class="lbl">' + label + '</span><span class="seg">' + items.map(([v, t, on]) => '<button class="chip' + (on ? " on" : "") + '" data-act="tac" data-v="' + v + '">' + t + "</button>").join("") + "</span></div>";
  }
  function encPanel() {
    const d = st.dive, E = D.ENEMIES[d.enc.e];
    const fc = S.forecast(st);
    const rc = S.returnCost(st);
    const canD = S.canDetour(st);
    const dCost = 1 + (d.enc.frozen ? 1 : 0);
    const word = fc.win === fc.n ? (fc.left > 0.5 ? "稳" : "能赢，伤得不轻") : fc.win === 0 ? "打不过" : "有风险";
    const why = d.enc.boss ? "据点首领不能绕行" : d.enc.hidden ? "拟岩虫封住了路，不能绕行" : "";
    let h = '<div class="card enc"><h3>' + esc(E.name) + (d.enc.foes.length > 1 ? " ×" + d.enc.foes.length : "") + "</h3>";
    h += '<p class="dim">' + esc(d.enc.boss ? "据点首领：清掉它才能修复这一段补给线" : TRAIT[E.trait] || "敌情") + "</p>";
    h += '<p>预估：' + word + "（" + fc.n + " 次推演胜 " + fc.win + " 次" + (fc.win ? "，剩余生命约 " + Math.round(fc.left * 10) * 10 + "%" : "") + "）</p>";
    h += tactics();
    h += '<div class="btns col"><button class="btn main" data-act="fight">战斗 <kbd>F</kbd></button>';
    h += '<button class="btn" data-act="detour"' + (canD ? "" : " disabled") + ">绕行（氧气 -" + dCost + (E.trait === "track" ? "，可能甩不掉" : "") + ") <kbd>D</kbd></button>" + (why ? '<small class="dim">' + why + "</small>" : "");
    h += '<button class="btn" data-act="retreat">撤退并归返（回程氧气 ' + rc + "，当前 " + d.o2 + "） <kbd>R</kbd></button></div></div>";
    return h;
  }
  function logBox() {
    const lines = st.log.slice(-6).reverse();
    return '<div class="log"><h4>行程日志</h4>' + (lines.length ? lines.map((l) => "<p>" + esc(l) + "</p>").join("") : '<p class="dim">还没有记录。出发下潜后，这里会记下沿途的事。</p>') + "</div>";
  }
  function townPanel() {
    const tabs = [["go", "出发"], ["hearth", "炉火"], ["shop", "工坊"], ["train", "训练场"], ["route", "补给线"], ["opt", "设置"]];
    let h = '<nav class="tabs">' + tabs.map(([k, t]) => '<button data-act="tab" data-v="' + k + '"' + (view.tab === k ? ' class="on"' : "") + ">" + t + "</button>").join("") + "</nav>";
    h += '<div class="tabBody">' + ({ go: goTab, hearth: hearthTab, shop: shopTab, train: trainTab, route: routeTab, opt: optTab }[view.tab] || goTab)() + "</div>";
    return h;
  }
  function goTab() {
    let h = "";
    if (st.tide && !st.won) {
      const w = S.TIDE[st.tide.wave], E = D.ENEMIES[w.e];
      h += '<div class="card tide"><h3>兽潮 · 第 ' + (st.tide.wave + 1) + "/" + S.TIDE.length + " 波</h3><p>" + E.name + " ×" + w.n + "。炉温是防线，失守一波炉温 -3。</p>" + tactics() + '<div class="btns"><button class="btn main" data-act="tide">迎击第 ' + (st.tide.wave + 1) + " 波</button></div></div>";
    }
    if (st.won) h += '<div class="card"><h3>补给线恢复</h3><p class="dim">第一阶段已完成。石灯的补给队定期往返。可以继续下潜、继续建设。</p></div>';
    const maxL = Math.min(st.route + 1, D.LAYERS.length);
    if (view.startLayer > maxL) view.startLayer = 1;
    const o2 = D.GEAR.tank.levels[st.gear.tank].o2;
    h += '<div class="card"><h3>出发下潜</h3>';
    if (maxL > 1) h += '<div class="row"><span class="lbl">起点</span><span class="seg">' + D.LAYERS.slice(0, maxL).map((L, i) => '<button class="chip' + (view.startLayer === i + 1 ? " on" : "") + '" data-act="layer" data-v="' + (i + 1) + '">' + L.name + "</button>").join("") + "</span></div>";
    h += '<p class="dim">氧气 ' + o2 + "，负重 " + fmt(S.weight(st)) + "/" + S.capacity(st) + "（装备已占）。每次下潜炉温 -1。" + (st.hearth <= 0 ? '<span class="lack">炉火已熄，出发时生命 -30%。</span>' : "") + "</p>";
    h += '<div class="btns"><button class="btn main big" data-act="go">出发下潜 <kbd>空格</kbd></button></div></div>';
    h += '<div class="card"><h4>下一步</h4><p>' + esc(hint()) + "</p></div>";
    return h + logBox();
  }
  function hint() {
    if (!st.dives) return "先下到霜根廊看看。能核随身带着，回程会耗氧气，氧气条上的竖线是回程需要的量。";
    if (!S.routeUnlocked(st)) return "霜根廊最深处是据点。清掉它，或者找到熟悉旧路的人，才知道补给线怎么修。";
    const seg = D.ROUTE[st.route];
    if (seg && !st.cleared[seg.layer]) return "修复第 " + (st.route + 1) + " 段补给线，要先清掉" + D.LAYERS[seg.layer - 1].name + "的据点。";
    if (seg) return "补给线第 " + (st.route + 1) + " 段可以修了，去「补给线」页看看还缺什么。";
    if (st.tide && !st.won) return "兽潮正在逼近。迎击前可以先在训练场和工坊做准备。";
    return "继续下潜，把聚落建得更好。";
  }
  function hearthTab() {
    return (
      '<div class="card"><h3>炉火 · 炉温 ' + st.hearth + "/" + D.HEARTH.max + "</h3>" + barH("hearth", st.hearth, D.HEARTH.max) +
      '<p class="dim">每次下潜炉温 -1，小队倒下再 -1。炉温低于 3 时训练场停工；炉火熄灭时出发生命 -30%；兽潮时炉温是防线。</p>' +
      '<div class="btns"><button class="btn main" data-act="stoke"' + (st.hearth >= D.HEARTH.max || st.store.core < D.HEARTH.fuelCost ? " disabled" : "") + ">续燃（能核 -" + D.HEARTH.fuelCost + "，炉温 +1）</button></div></div>" +
      '<div class="card"><h4>库房</h4><p>能核 ' + st.store.core + "</p>" + matsLine() + "</div>"
    );
  }
  function matsLine() {
    const ks = Object.keys(st.store.mats).filter((k) => st.store.mats[k] > 0);
    return ks.length ? "<p>" + ks.map((k) => D.MATS[k].name + " " + st.store.mats[k]).join("，") + "</p>" : '<p class="dim">库房里没有材料。下潜时打倒敌人会带回材料。</p>';
  }
  const GEARFX = { tank: (l) => "氧气 " + l.o2 + "，负重 " + l.w, armor: (l) => "护甲 +" + l.arm + "，负重 " + l.w, frame: (l) => "负重上限 " + l.cap };
  function shopTab() {
    let h = '<div class="card"><h3>工坊</h3><p class="dim">装备越好越重。负重上限由背架决定，超重时每步氧气多 -1。</p></div>';
    for (const k of ["tank", "armor", "frame"]) {
      const G0 = D.GEAR[k], lv = st.gear[k], cur = G0.levels[lv], nx = G0.levels[lv + 1];
      h += '<div class="card"><h4>' + G0.name + " · " + ["旧", "新", "精制"][lv] + '</h4><p>' + GEARFX[k](cur) + "</p>";
      if (nx) h += '<p class="dim">下一级：' + GEARFX[k](nx) + "</p><p>" + cost(nx.cost) + '</p><div class="btns"><button class="btn" data-act="build" data-v="' + k + '"' + (S.has(st, nx.cost) ? "" : " disabled") + ">打造</button></div>";
      else h += '<p class="dim">已是最好的一级。</p>';
      h += "</div>";
    }
    return h;
  }
  function trainTab() {
    let h = '<div class="card"><h3>训练场</h3><p class="dim">训练提高熟练度（生命 +15%、攻击 +12% 每级）。进阶需要在渊隙里找到的材料，能核替代不了。' + (st.hearth < 3 ? '<span class="lack">炉温低于 3，训练场停工。</span>' : "") + "</p></div>";
    for (const id of ["hunter", "guard", "stoker"]) {
      const C = D.CLASSES[id], c = st.cls[id], tc = S.trainCost(st, id);
      h += '<div class="card"><h4 class="c-' + id + '">' + C.name + " · 熟练 " + c.lv + "</h4><p class=\"dim\">" + CLSDESC[id] + '</p><div class="btns"><button class="btn" data-act="train" data-v="' + id + '"' + (st.hearth >= 3 && st.store.core >= tc ? "" : " disabled") + ">训练（能核 -" + tc + "）</button></div>";
      h += c.adv ? '<p>已进阶：' + C.adv.name + "</p>" : "<p>进阶「" + C.adv.name + "」需要 " + cost(C.adv.need) + '</p><div class="btns"><button class="btn main" data-act="promote" data-v="' + id + '"' + (S.has(st, C.adv.need) ? "" : " disabled") + ">进阶</button></div>";
      h += "</div>";
    }
    return h;
  }
  const CLSDESC = {
    hunter: "集中攻击最强的敌人。敌人多于两个时伤害降低。进阶后可破甲：取到完整能核。",
    guard: "替后排承伤，生命和护甲最高。进阶后可在展开掩护和机动反击之间切换。",
    stoker: "烧随身的能核打全体，每三轮烧 1 个。没有能核时威力很低。进阶后可选投射、压制、装甲。",
  };
  function routeTab() {
    let h = '<div class="card"><h3>补给线</h3><p class="dim">修好的路段有常规队伍往返：持续带回能核，沿途回程不耗氧，下次可以从下一层出发。</p>' + (S.routeUnlocked(st) ? "" : '<p class="lack">还不知道旧路怎么走。先去霜根廊深处找找线索。</p>') + "</div>";
    D.ROUTE.forEach((seg, i) => {
      const L = D.LAYERS[seg.layer - 1];
      h += '<div class="card"><h4>第 ' + (i + 1) + " 段 · " + L.name + "</h4>";
      if (i < st.route) h += '<p>已修复。常规队伍 +' + seg.rate + " 能核/分。</p>";
      else if (i === st.route) {
        h += "<p>" + (st.cleared[seg.layer] ? "据点已清" : '<span class="lack">据点未清</span>') + " " + cost(seg.need) + "</p>";
        h += '<div class="btns"><button class="btn main" data-act="repair"' + (S.routeUnlocked(st) && st.cleared[seg.layer] && S.has(st, seg.need) ? "" : " disabled") + ">修复（修好后常规队伍 +" + seg.rate + " 能核/分）</button></div>";
      } else h += '<p class="dim">先修好上一段。</p>';
      h += "</div>";
    });
    return h;
  }
  function optTab() {
    return (
      '<div class="card"><h3>设置</h3><div class="btns col"><button class="btn" data-act="snd">' + (opt.snd ? "关闭声音" : "打开声音") + '</button><button class="btn" data-act="export">导出存档</button><button class="btn" data-act="import">导入存档</button><button class="btn warn" data-act="reset">重新开始</button></div></div>' +
      '<div class="card"><h4>操作</h4><p class="dim">数字键 1 到 3 选节点，F 战斗，D 绕行，R 撤退或归返，空格出发或跳过回放。</p><p class="dim">像素字体 Fusion Pixel（SIL OFL 1.1）。</p></div>'
    );
  }
  function rescueModal() {
    modal('<h3>呼救</h3><p>岩缝里卡着一个外乡人，腿被冻住了。把她背出来，就得放下一半背着的能核。</p><p class="dim">现在背着能核 ' + st.dive.carry.core + "。</p>" + '<div class="btns col"><button class="btn main" data-act="rescue" data-v="1">放下一半能核，救她</button><button class="btn" data-act="rescue" data-v="0">不停下，继续走</button></div>');
  }
  // 救援按钮在弹窗里：点了要关弹窗
  const _rescue = acts.rescue;
  acts.rescue = (v) => {
    _rescue(v);
    $("modal").hidden = true;
    $("modal").innerHTML = "";
    startFight();
  };

  /* ---------- 常规队伍 ---------- */
  function idle(first) {
    const n = S.idleTick(st, Date.now());
    if (n > 0) {
      toast((first ? "离开期间，" : "") + "常规队伍带回能核 +" + n + "。");
      if (!view.fight) render();
      save();
    }
  }

  /* ---------- 启动 ---------- */
  $("bSnd").addEventListener("click", () => {
    acts.snd();
    render();
  });
  idle(true);
  render();
  if (fresh) story("intro");
  if (st.tide && !st.won) story("tide");
  setInterval(() => idle(false), 5000);
  requestAnimationFrame(frame);
  window.__ember = { get state() { return st; }, sanitize, save, load, encode, decode };
})();

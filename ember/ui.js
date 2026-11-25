/* 万丈深渊：界面、存档、动画回放。所有规则在 sim.js，这里只负责显示和输入。 */
(function () {
  const D = window.EmberData, S = window.EmberSim, P = window.EmberPixel, A = window.EmberAudio;
  const KEY = "wzsy.save.v2", BAK = "wzsy.save.v2.bak", OPT = "wzsy.opt.v1";
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
    if (!raw || typeof raw !== "object" || raw.v !== 2) return null;
    const s = S.newGame(num(raw.rs, -2147483648, 2147483647, 1) | 0, num(raw.idleAt, 0, 1e15, Date.now()));
    const MK = Object.keys(D.MATS);
    s.store.core = Math.floor(num(raw.store && raw.store.core, 0, 1e7, 0));
    s.store.mats = bag(raw.store && raw.store.mats, MK);
    s.hearth = Math.floor(num(raw.hearth, 0, D.HEARTH.max, D.HEARTH.start));
    for (const k in s.gear) s.gear[k] = Math.floor(num(raw.gear && raw.gear[k], 0, D.GEAR[k].levels.length - 1, 0));
    for (const id in s.outfits) {
      const c = raw.outfits && raw.outfits[id];
      s.outfits[id] = { lv: Math.floor(num(c && c.lv, 1, 99, 1)), adv: !!(c && c.adv) };
    }
    if (raw.wear in D.OUTFITS) s.wear = raw.wear;
    if (raw.spare in D.OUTFITS && raw.spare !== s.wear) s.spare = raw.spare;
    if (Array.isArray(raw.items)) for (const it of raw.items.slice(0, D.BAG + 8)) if (itemOk(it) && !s.items.some((x) => x.id === it.id)) s.items.push({ id: it.id, b: it.b, r: it.r, a: it.a.map((x) => [x[0], x[1]]) });
    if (Array.isArray(raw.equip)) for (const id of raw.equip) if (s.items.some((x) => x.id === id) && !s.equip.includes(id) && s.equip.length < D.EQUIP_SLOTS) s.equip.push(id);
    if (Array.isArray(raw.skills)) for (const k of raw.skills) if (k in D.SKILLS && !s.skills.includes(k)) s.skills.push(k);
    if (Array.isArray(raw.slots)) for (const k of raw.slots) if (s.skills.includes(k) && !s.slots.includes(k) && s.slots.length < D.SKILL_SLOTS) s.slots.push(k);
    s.nextId = Math.max(Math.floor(num(raw.nextId, 1, 1e9, 1)), 1 + s.items.reduce((a, x) => Math.max(a, x.id), 0));
    s.route = Math.floor(num(raw.route, 0, D.ROUTE.length, 0));
    for (const l of [1, 2, 3]) if (raw.cleared && raw.cleared[l]) s.cleared[l] = true;
    if (raw.flags && typeof raw.flags === "object") for (const k in raw.flags) if (/^[a-zA-Z_]{1,24}$/.test(k) && raw.flags[k] === true) s.flags[k] = true;
    if (raw.tactic) {
      if (raw.tactic.stance in D.STANCES) s.tactic.stance = raw.tactic.stance;
      if (raw.tactic.mode in D.MODES) s.tactic.mode = raw.tactic.mode;
      s.tactic.breach = raw.tactic.breach !== false;
    }
    s.dives = Math.floor(num(raw.dives, 0, 1e6, 0));
    s.signAt = Math.floor(num(raw.signAt, 0, 1e6, 0));
    s.idleBank = num(raw.idleBank, 0, 1, 0);
    if (raw.tide && typeof raw.tide === "object") s.tide = { wave: Math.floor(num(raw.tide.wave, 0, S.TIDE.length - 1, 0)) };
    if (s.route >= D.ROUTE.length && !s.tide && !raw.won) s.tide = { wave: 0 };
    s.won = !!raw.won;
    if (Array.isArray(raw.log)) s.log = raw.log.filter((x) => typeof x === "string").slice(-40);
    if (raw.dive && diveOk(raw.dive)) s.dive = raw.dive;
    return s;
  }
  function itemOk(it) {
    return !!it && Number.isInteger(it.id) && it.id > 0 && it.b in D.ITEMS && [0, 1, 2].includes(it.r) && Array.isArray(it.a) && it.a.length >= 1 && it.a.length <= 2 && it.a.every((x) => Array.isArray(x) && x[0] in D.STATS && Number.isFinite(x[1]) && x[1] > 0 && x[1] < 1000);
  }
  /* 下潜中的存档结构复杂，校验不过就整段丢弃（相当于已经撤回），不让坏数据进模拟层。 */
  function diveOk(d) {
    try {
      if (![1, 2, 3].includes(d.layer) || !Array.isArray(d.map) || !Array.isArray(d.team) || d.team.length !== 1) return false;
      if (!Number.isFinite(d.o2) || !Number.isFinite(d.o2Max) || !Number.isInteger(d.step) || d.step < 0 || d.step > d.map.length) return false;
      if (!d.carry || !Number.isFinite(d.carry.core) || !Array.isArray(d.carry.items) || !Array.isArray(d.carry.skills)) return false;
      if (!d.carry.items.every(itemOk) || !d.carry.skills.every((k) => k in D.SKILLS) || !Number.isFinite(d.stam)) return false;
      for (const m of d.team) if (!(m.id in D.OUTFITS) || !Number.isFinite(m.hp) || !Number.isFinite(m.max) || !Number.isFinite(m.atk) || !Number.isFinite(m.arm)) return false;
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
  const view = { tab: "go", fight: null, floats: [], flash: {}, shake: 0, walk: 0, scroll: 0, lungeT: 0, lungeF: 0, startLayer: 1, kit: "outfit", confirm: 0 };

  /* ---------- 画布 ---------- */
  const cv = $("cv"), cx = cv.getContext("2d");
  cv.width = P.W;
  cv.height = P.H;
  /* 画布整倍放大：宽高都按 144×96 的整数倍取，放不下 2 倍时才用小数倍。 */
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
  let lastT = 0;
  function frame(ms) {
    const t = ms / 1000, dt = Math.min(0.1, t - lastT || 0);
    lastT = t;
    view.shake = Math.max(0, view.shake - dt * 3);
    if (view.walk > 0) view.scroll += dt * 48;
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
    if (hit) {
      A.play("hit");
      view.lungeT = t + 0.12;
    }
    if (hurt) {
      A.play("hurt");
      view.shake = 0.6;
      view.lungeF = t + 0.2;
    }
    f.i++;
    f.next = t + (fr.length > 20 ? 0.2 : 0.32);
    $("panel").innerHTML = fightPanel();
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
    descend() {
      S.descend(st);
      view.walk = 0.6;
      A.play("step");
    },
    drop() {
      S.dropToCap(st);
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
    upgrade(id) {
      if (S.upgrade(st, id)) A.play("ok");
    },
    wear(id) {
      if (S.wear(st, id)) A.play("step");
    },
    equip(id) {
      if (S.equip(st, +id)) A.play("ok");
      else toast(S.equipClash(st, +id) ? "同名的配件只能装一件。" : "最多装 " + D.EQUIP_SLOTS + " 件配件。先卸下一件。");
    },
    unequip(id) {
      S.unequip(st, +id);
    },
    salvage(id) {
      if (view.confirm !== +id) {
        view.confirm = +id; // 第一次点只是问一下，再点才拆
        return;
      }
      view.confirm = 0;
      if (S.salvage(st, +id)) A.play("core");
    },
    spare(id) {
      S.setSpare(st, id === "none" ? null : id);
    },
    swap() {
      if (S.swapOutfit(st)) A.play("step");
    },
    kit(v) {
      view.kit = v;
    },
    skill(k) {
      if (!S.toggleSkill(st, k)) toast("最多带 " + D.SKILL_SLOTS + " 个技艺。先放下一个。");
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
        if (st.route === 1) story(st.flags.wei ? "route1" : "route1b");
        if (st.route === 2) story("route2");
        if (st.tide) story("tide");
      }
    },
    tide() {
      const w = st.tide.wave, hearthBefore = st.hearth;
      S.tideWave(st);
      startFight(() => {
        if (st.won) story("win");
        else {
          const msg = st.tide.wave > w ? "兽潮第 " + (w + 1) + " 波守住了。" : hearthBefore <= 3 ? "第 " + (w + 1) + " 波没守住，炉火被冲灭。库房的能核丢了三成，兽潮从第 1 波重来。" : "第 " + (w + 1) + " 波没守住。炉温 -3。炉温到 0 会丢三成库存能核，并从第 1 波重来。";
          st.log.push(msg);
          toast(msg);
        }
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
    const map = { 1: "[data-act=node][data-v='0']", 2: "[data-act=node][data-v='1']", 3: "[data-act=node][data-v='2']", f: "[data-act=fight]", s: "[data-act=swap]", d: "[data-act=detour]", r: "[data-act=retreat],[data-act=home]", " ": "[data-act=skip],[data-act=go]" };
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
    intro: ["灰炉屯", "灰炉屯的炉火只够再烧几天。", "镇子北边有一条废弃了三十年的补给线，从霜根廊一直通到渊隙深处。", "你一个人沿着它下去。屋里有三套旧行装：猎核装、护卫装、御炉装，穿哪套就是哪种打法。能核能让炉火续燃，带回来才算数。"],
    wei: ["苇", "苇是从路的另一头走过来的。她说旧补给线没有断，只是没人维护。", "修好它，常规队伍就能沿线来回，不用每次都靠你一个人。补给线在聚落的「补给线」页。"],
    weiSign: ["路标", "据点后面的岩壁上刻着新鲜的路标，指向更深处。有人走过这条路，还做了记号。", "照着路标，可以开始修复补给线。补给线在聚落的「补给线」页。"],
    route1: ["石灯", "第一段补给线修好了。常规队伍开始沿线往返，就算你不在，也会带回能核。", "苇说，路的另一端是她的聚落，叫石灯。那边也在等这条路。", "现在可以直接从回声井出发。"],
    route1b: ["石灯", "第一段补给线修好了。常规队伍开始沿线往返，就算你不在，也会带回能核。", "路标的尽头刻着两个字：石灯。路的另一端还有人。", "现在可以直接从回声井出发。"],
    route2: ["第二段", "第二段修好了。回声井的峭壁上挂起了新绳。", "现在可以直接从沸雾窟出发。"],
    relic: ["古件", "雾窟巨兽的巢里有一盏旧灯。不亮，但每隔一会儿就发出一次脉冲，很规律。", "没人认得它。先带回去放着。"],
    tide: ["兽潮", "第三段修通的那天夜里，路的深处传来很多脚步声。", "兽群沿着新修的路涌上来了。守住三波，这条路才算真正属于灰炉屯。", "失守一波炉温 -3。可以先回去准备，再来迎击。"],
    adv_hunter: ["定向破甲", "猎核装的护目镜换上了层甲骨磨的镜片，能看清甲壳的纹路。", "开启破甲时，前 2 轮只研究最强的敌人，不造成伤害。之后对它伤害 +60%。生命 40 以上的大型敌人被破甲后击杀，取到完整能核 +4。", "对付成群的小敌人，2 轮空档不划算。"],
    adv_guard: ["姿态切换", "韧骨板做的盾可以架稳，也可以收起来抢攻。", "架盾：受到的伤害减半，每挡一次耐力 -1，耐力耗尽自动转为机动反击。", "机动反击：自身伤害 ×2，被打时反击，每轮耐力 +1。耐力整次下潜共用，每走一步回 1。"],
    adv_stoker: ["模式切换", "导热丝让炉罐能接到不同的喷口上。", "投射打单个最强的敌人，压制打全部敌人。两者每轮烧 1 个随身能核，散热到上限要停火一轮。", "装甲：护甲 +4，不烧能核，自己几乎不出伤害。"],
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
  function affixText(a) {
    return a.map(([k, v]) => D.STATS[k][0] + " " + D.STATS[k][1] + v + D.STATS[k][2]).join("，");
  }
  function showResult() {
    const L = st.last;
    const mats = Object.keys(L.mats).filter((k) => L.mats[k] > 0).map((k) => D.MATS[k].name + " " + L.mats[k]).join("，");
    const head = L.how === "wiped" ? "倒在了" + D.LAYERS[L.layer - 1].name : "归返";
    const body = L.how === "wiped" ? "被常规队伍抬了回来，背着的东西都丢了。炉温 -2。" : "带回能核 " + L.core + (mats ? "，" + mats : "") + "。炉温 -1。";
    const got = (L.items || []).map((id) => st.items.find((x) => x.id === id)).filter(Boolean).map((it) => '<p class="r' + it.r + '">' + esc(S.itemName(it)) + '　<span class="dim">' + affixText(it.a) + "</span></p>").join("");
    const sk = (L.skills || []).map((k) => "<p>学会技艺「" + D.SKILLS[k].name + '」　<span class="dim">' + D.SKILLS[k].desc + "</span></p>").join("");
    const loss = [L.lost ? "回程氧气不够，丢下能核 " + L.lost : "", L.dropped ? "太重丢下能核 " + L.dropped : "", L.burned ? "炉罐烧掉能核 " + L.burned : ""].filter(Boolean).join("，");
    show("<h3>" + head + "</h3><p>" + body + "</p>" + got + sk + (L.auto ? '<p class="dim">库房放不下，拆掉了 ' + L.auto + " 件旧配件换成能核。</p>" : "") + (got || sk ? '<p class="dim">配件和技艺在聚落的「行装」页里装上。</p>' : "") + (loss ? '<p class="lack">' + loss + "。</p>" : "") + '<div class="btns"><button class="btn main" data-act="close">回到灰炉屯</button></div>');
    if (st.flags.wei) story("wei");
    else if (st.flags.weiSign) story("weiSign");
    else if (st.signAt && !st.flags.seen_signHint) {
      st.flags.seen_signHint = true;
      show('<h3>没有路标</h3><p>据点清掉了，但不知道旧补给线往哪里走。下次下潜再仔细找找。</p><div class="btns"><button class="btn main" data-act="close">继续</button></div>');
    }
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
    $("bSnd").textContent = opt.snd ? "关闭声音" : "打开声音";
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
    const f = view.fight, fx = f.fx, E = D.ENEMIES[fx.e];
    const fr = fx.frames[Math.min(f.i, fx.frames.length - 1)];
    const foes = fr.f.filter((h) => h > 0).length;
    return '<div class="card"><h3>' + (fx.tide ? "兽潮第 " + fx.tide + " 波 · " : "") + "交战 · " + E.name + '</h3><div class="row team"><span class="c-' + fx.wear + '">' + D.OUTFITS[fx.wear].name + " 生命 " + fr.t[0] + "/" + fx.max[0] + '</span></div><p class="dim">第 ' + f.i + " 轮，剩余敌人 " + foes + '</p><div class="btns"><button class="btn" data-act="skip">直接看结果 <kbd>空格</kbd></button></div></div>';
  }
  function hudBlock() {
    const d = st.dive, rc = S.returnCost(st), w = S.weight(st), cap = S.capacity(st), h = d.team[0];
    const mats = Object.keys(d.carry.mats).filter((k) => d.carry.mats[k] > 0).map((k) => D.MATS[k].name + " " + d.carry.mats[k]).join("，");
    return (
      '<div class="hud">' +
      '<div class="row"><span class="lbl c-' + h.id + '">' + D.OUTFITS[h.id].name + '</span><span class="lbl">生命 ' + Math.max(0, Math.round(h.hp)) + "/" + h.max + "</span>" + barH("hp", h.hp, h.max) + (h.id === "guard" && st.outfits.guard.adv ? '<span class="lbl dim">耐力 ' + d.stam + "/" + S.stamMax(st) + "</span>" : "") + (h.id === "stoker" || st.spare === "stoker" ? '<span class="lbl dim">底火 ' + (d.pilot || 0) + "</span>" : "") + "</div>" +
      '<div class="row">' + ic("o2") + '<span class="lbl">氧气 ' + d.o2 + "/" + d.o2Max + "</span>" + barH("o2", d.o2, d.o2Max, rc) + '<span class="lbl ' + (d.o2 < rc ? "lack" : "dim") + '">回程 ' + rc + "</span></div>" +
      '<div class="row">' + ic("load") + '<span class="lbl ' + (w > cap ? "lack" : "") + '">负重 ' + fmt(w) + "/" + cap + (S.tooHeavy(st) ? " 走不动" : w > cap ? " 超重" : "") + "</span>" + ic("core") + '<span class="lbl">能核 ' + d.carry.core + "</span>" + (d.carry.items.length ? '<span class="lbl">配件 ' + d.carry.items.length + "</span>" : "") + (mats ? '<span class="lbl dim">' + mats + "</span>" : "") + "</div>" +
      "</div>"
    );
  }
  const fmt = (x) => (Math.round(x * 10) / 10).toString();
  function homeLabel(verb) {
    const rc = S.returnCost(st), loss = S.homeLoss(st);
    return verb + "（回程氧气 " + rc + "，当前 " + st.dive.o2 + (loss ? "，会丢下约 " + loss + " 个能核" : "") + "）";
  }
  function nodeText(n, L) {
    if (n.t === "fight") {
      const E = D.ENEMIES[n.e];
      return [E.name + (n.n > 1 ? " ×" + n.n : ""), n.frozen ? "冰封：靠近时不会被伏击，绕行多费 1 氧气" : TRAIT[E.trait], "fight"];
    }
    if (n.t === "boss") return ["据点 · " + D.ENEMIES[n.e].name, bossNote(st.dive.layer) + "。不能绕行", "boss"];
    if (n.t === "crate") return ["冰封的旧货箱", "开箱氧气 -1，能核 +4，" + D.MATS[L.mat].name + " +1", "crate"];
    if (n.t === "anchor") return ["锚点", st.dive.anchor ? "本层锚点已修好" : "修好后，本层回程氧气减半", "anchor"];
    if (n.t === "spring") return ["热泉", "氧气 +5", "spring"];
    if (n.t === "cache") return ["补给", "能核 +2 到 4", "cache"];
    return ["未知", "可能有余气，可能有前人留下的配件，也可能塌方", "unknown"];
  }
  const TRAIT = { ambush: "伏击：靠近时先手一击", track: "成群追踪：绕行有一半机会甩不掉", cling: "攀在岩壁上：绕行多费 1 氧气", mimic: "伪装：靠近才现形，现形后封路", "": "成群：数量多，单个弱" };
  function bossNote(layer) {
    return st.route >= layer ? "据点首领，每 3 轮重击一次，伤害是平时的 2.5 倍" : "清掉它才能修复这一段补给线。每 3 轮重击一次，伤害是平时的 2.5 倍";
  }
  function divePanel() {
    const d = st.dive, L = D.LAYERS[d.layer - 1];
    let h = hudBlock();
    if (d.event === "rescue") return h + '<div class="card"><p>岩缝里有人在呼救。</p></div>';
    if (d.enc) return h + encPanel() + logBox();
    const rc = S.returnCost(st);
    const heavy = S.tooHeavy(st);
    const dropBtn = S.overweight(st) ? '<button class="btn" data-act="drop">丢下能核，回到负重上限</button>' : "";
    const heavyNote = heavy ? '<p class="lack">背得太重，走不动了。丢下一些能核，或者归返。</p>' : "";
    if (d.atEnd) {
      if (S.canDescend(st)) {
        const NL = D.LAYERS[d.layer];
        const after = rc + L.o2Step * (L.steps - d.step) + NL.o2Step;
        return h + '<div class="card"><h3>' + L.name + "据点已清</h3><p>往下是" + NL.name + "。下去以后，回程至少要氧气 " + Math.max(after, rc + NL.o2Step) + "。</p>" + heavyNote + '<div class="btns col"><button class="btn main" data-act="descend"' + (heavy ? " disabled" : "") + ">下到" + NL.name + "</button>" + dropBtn + '<button class="btn" data-act="home">' + homeLabel("归返") + "</button></div></div>" + logBox();
      }
      return h + '<div class="card"><h3>' + L.name + '据点已清</h3><p>再往下没有路标了。带着收获回去吧。</p><div class="btns"><button class="btn main" data-act="home">' + homeLabel("归返") + "</button></div></div>" + logBox();
    }
    const opts = S.options(st);
    const sc = S.stepCost(st, d.layer);
    h += '<div class="card"><h3>' + L.name + " · 第 " + (d.step + 1) + "/" + d.map.length + ' 步</h3><p class="dim">每走一步氧气 -' + sc + (L.special === "fog" ? "（雾中 +1）" : "") + (S.overweight(st) ? "（超重 +1）" : "") + (L.special === "cliff" && S.overweight(st) ? "，超重时可能在峭壁上滑落" : "") + "</p>" + heavyNote + '<div class="nodes">';
    opts.forEach((n, i) => {
      const [name, desc, icon] = nodeText(n, L);
      const tight = d.o2 - sc < rc + (n.t === "crate" ? 1 : 0) - (n.t === "spring" ? 5 : 0);
      h += '<button class="node" data-act="node" data-v="' + i + '"' + (heavy ? " disabled" : "") + ">" + ic(icon) + "<span><b>" + esc(name) + "</b><small>" + esc(desc) + "</small>" + (tight ? '<small class="lack">走这一步后，回程氧气不够</small>' : "") + "</span><kbd>" + (i + 1) + "</kbd></button>";
    });
    h += '</div><div class="btns col">' + dropBtn + '<button class="btn" data-act="home">' + homeLabel("归返") + "</button></div></div>";
    return h + logBox();
  }
  function tactics() {
    let h = "";
    const t = st.dive ? st.dive : st.tactic;
    if (!st.outfits[st.wear].adv) return "";
    if (st.wear === "hunter") h += tacRow("破甲", [["breach:1", "开", t.breach], ["breach:0", "关", !t.breach]], t.breach ? "遇到大型敌人：前 2 轮不攻击，之后伤害 +60%，击杀多得能核 4" : "直接攻击");
    if (st.wear === "guard") h += tacRow("姿态", [["stance:cover", "架盾", t.stance === "cover"], ["stance:counter", "机动反击", t.stance === "counter"]], t.stance === "cover" ? "受到的伤害减半，每挡一次耐力 -1" : "自身伤害 ×2，被打时反击，每轮耐力 +1");
    if (st.wear === "stoker") h += tacRow("模式", [["mode:lance", "投射", t.mode === "lance"], ["mode:blanket", "压制", t.mode === "blanket"], ["mode:plating", "装甲", t.mode === "plating"]], t.mode === "plating" ? "护甲 +4，不烧能核" : (t.mode === "lance" ? "单体伤害高" : "打全部敌人") + "，每轮烧 1 个随身能核");
    return '<div class="tac">' + h + "</div>";
  }
  function tacRow(label, items, note) {
    return '<div class="row"><span class="lbl">' + label + '</span><span class="seg">' + items.map(([v, t, on]) => '<button class="chip' + (on ? " on" : "") + '" data-act="tac" data-v="' + v + '">' + t + "</button>").join("") + '</span></div><small class="dim">' + note + "</small>";
  }
  function fcWord(fc) {
    return fc.win === 0 ? "打不过" : fc.win < fc.n ? "有可能倒下" : fc.cost >= 0.3 ? "能赢，伤得重" : fc.cost >= 0.1 ? "能赢，会掉血" : "稳";
  }
  function fcLine(fc) {
    return "预估：" + fcWord(fc) + "。推演 " + fc.n + " 次胜 " + fc.win + " 次" + (fc.win ? "，生命 -" + Math.round(fc.cost * 100) + "%" : "") + (fc.burned ? "，烧能核 " + fc.burned : "") + (fc.o2 ? "，久战耗氧 " + fc.o2 : "") + "。";
  }
  function encPanel() {
    const d = st.dive, E = D.ENEMIES[d.enc.e];
    const fc = S.forecast(st);
    const canD = S.canDetour(st);
    const rc = S.returnCost(st), loss = S.homeLoss(st);
    const why = d.enc.boss ? "不能绕行" : d.enc.hidden ? "路被封住" : "氧气 -" + S.detourCost(st) + (E.trait === "track" ? "，可能甩不掉" : "");
    const note = d.enc.boss ? bossNote(d.layer) : d.enc.frozen ? "冰封：没有被伏击，绕行多费 1 氧气" : TRAIT[E.trait];
    let h = '<div class="card enc"><h3>' + esc(E.name) + (d.enc.foes.length > 1 ? " ×" + d.enc.foes.length : "") + (E.hp >= 40 ? "（大型）" : "") + ' <span class="dim">' + esc(note) + "</span></h3>";
    h += '<p class="' + (fc.win < fc.n ? "lack" : "") + '"><span class="c-' + st.wear + '">' + D.OUTFITS[st.wear].name + "</span> " + fcLine(fc) + "</p>";
    if (S.canSwap(st)) {
      const f2 = S.forecastSwap(st);
      h += '<div class="row swap"><button class="chip" data-act="swap">换上' + D.OUTFITS[st.spare].name + ' <kbd>S</kbd></button><small class="' + (f2.win < f2.n ? "lack" : "dim") + '">' + fcLine(f2).replace("预估：", "换上后：") + "</small></div>";
    }
    h += '<div class="btns three"><button class="btn main" data-act="fight"><b>战斗</b><small>' + (fc.win ? "生命 -" + Math.round(fc.cost * 100) + "%" : "打不过") + "</small><kbd>F</kbd></button>";
    h += '<button class="btn" data-act="detour"' + (canD ? "" : " disabled") + "><b>绕行</b><small>" + why + "</small><kbd>D</kbd></button>";
    h += '<button class="btn" data-act="retreat"><b>撤退并归返</b><small>回程氧气 ' + rc + (loss ? "，丢下约 " + loss + " 个能核" : "") + "</small><kbd>R</kbd></button></div>";
    h += tactics();
    return h + "</div>";
  }
  function logBox() {
    const lines = st.log.slice(-6).reverse();
    return '<div class="log"><h4>行程日志</h4>' + (lines.length ? lines.map((l) => "<p>" + esc(l) + "</p>").join("") : '<p class="dim">还没有记录。出发下潜后，这里会记下沿途的事。</p>') + "</div>";
  }
  function townPanel() {
    const tabs = [["go", "出发"], ["hearth", "炉火"], ["shop", "工坊"], ["kit", "行装"], ["route", "补给线"], ["opt", "设置"]];
    let h = '<nav class="tabs">' + tabs.map(([k, t]) => '<button data-act="tab" data-v="' + k + '"' + (view.tab === k ? ' class="on"' : "") + ">" + t + "</button>").join("") + "</nav>";
    h += '<div class="tabBody">' + ({ go: goTab, hearth: hearthTab, shop: shopTab, kit: kitTab, route: routeTab, opt: optTab }[view.tab] || goTab)() + "</div>";
    return h;
  }
  function goTab() {
    let h = "";
    if (st.tide && !st.won) {
      const w = S.TIDE[st.tide.wave], E = D.ENEMIES[w.e];
      const fc = S.tideForecast(st);
      h += '<div class="card tide"><h3>兽潮 · 第 ' + (st.tide.wave + 1) + "/" + S.TIDE.length + " 波</h3><p>" + E.name + " ×" + w.n + "。失守一波炉温 -3。炉温每 2 格，守城护甲 +1。穿御炉装时烧库房里的能核。</p>" + '<p class="' + (fc.win < fc.n ? "lack" : "") + '">' + fcLine(fc) + "</p>" + tactics() + '<div class="btns"><button class="btn main" data-act="tide">迎击第 ' + (st.tide.wave + 1) + " 波</button></div></div>";
    }
    if (st.won) h += '<div class="card"><h3>补给线恢复</h3><p class="dim">第一阶段已完成。石灯的补给队定期往返。可以继续下潜、继续建设。</p></div>';
    const maxL = Math.min(st.route + 1, D.LAYERS.length);
    if (view.startLayer > maxL) view.startLayer = 1;
    const hs = S.heroStats(st), o2 = hs.o2;
    h += '<div class="card"><h3>出发下潜</h3>';
    h += '<div class="row"><span class="lbl">行装</span><span class="seg">' + Object.keys(D.OUTFITS).map((id) => '<button class="chip' + (st.wear === id ? " on" : "") + '" data-act="wear" data-v="' + id + '">' + D.OUTFITS[id].name + "</button>").join("") + "</span></div>";
    h += '<div class="row"><span class="lbl">备用</span><span class="seg"><button class="chip' + (st.spare ? "" : " on") + '" data-act="spare" data-v="none">不带</button>' + Object.keys(D.OUTFITS).filter((id) => id !== st.wear).map((id) => '<button class="chip' + (st.spare === id ? " on" : "") + '" data-act="spare" data-v="' + id + '">' + D.OUTFITS[id].name + "</button>").join("") + "</span></div>";
    h += '<p class="c-' + st.wear + '">' + D.OUTFITS[st.wear].trait + '</p><p class="dim">适合：' + D.OUTFITS[st.wear].good + "。" + (st.spare ? "备用的" + D.OUTFITS[st.spare].name + "占负重 " + D.SPARE_W + "，遇敌时可以换上，适合" + D.OUTFITS[st.spare].good + "。" : "带一套备用行装（负重 " + D.SPARE_W + "），遇敌时可以换上。") + "</p>";
    {
      const L = D.LAYERS[view.startLayer - 1];
      h += '<p class="dim">' + L.name + "常见：" + L.enemies.map((e) => D.ENEMIES[e].name + (D.ENEMIES[e].hp >= 40 ? "（大型）" : "（成群，" + D.ENEMIES[e].n[0] + " 到 " + D.ENEMIES[e].n[1] + " 只）")).join("、") + "。据点首领：" + D.ENEMIES[L.boss].name + "（大型）。</p>";
    }
    h += '<p class="dim">生命 ' + hs.hp + "，攻击 " + fmt(hs.atk) + "，护甲 " + hs.arm + "。配件 " + st.equip.length + "/" + D.EQUIP_SLOTS + "，技艺 " + st.slots.length + "/" + D.SKILL_SLOTS + "。</p>";
    if (maxL > 1) h += '<div class="row"><span class="lbl">起点</span><span class="seg">' + D.LAYERS.slice(0, maxL).map((L, i) => '<button class="chip' + (view.startLayer === i + 1 ? " on" : "") + '" data-act="layer" data-v="' + (i + 1) + '">' + L.name + "</button>").join("") + "</span></div>";
    h += '<p class="dim">氧气 ' + o2 + "，负重 " + fmt(S.weight(st)) + "/" + S.capacity(st) + "（装备已占）。每次下潜炉温 -1。" + (st.hearth <= 0 ? '<span class="lack">炉火已熄，出发时生命 -30%。</span>' : "") + "</p>";
    h += '<div class="btns"><button class="btn main big" data-act="go">出发下潜 <kbd>空格</kbd></button></div></div>';
    h += '<div class="card"><h4>下一步</h4><p>' + esc(hint()) + "</p></div>";
    return h + logBox();
  }
  function hint() {
    if (!st.dives) return "先下到霜根廊看看。能核随身带着，回程会耗氧气，氧气条上的竖线是回程需要的量。";
    if (!S.routeUnlocked(st) && st.signAt) return "据点清掉了，还不知道旧路怎么走。再下一次霜根廊，走到第 3 步附近仔细找找。";
    if (!S.routeUnlocked(st)) return "霜根廊最深处是据点。清掉它，或者找到熟悉旧路的人，才知道补给线怎么修。";
    const seg = D.ROUTE[st.route];
    if (seg && !st.cleared[seg.layer]) return "修复第 " + (st.route + 1) + " 段补给线，要先清掉" + D.LAYERS[seg.layer - 1].name + "的据点。";
    if (seg) return "补给线第 " + (st.route + 1) + " 段可以修了，去「补给线」页看看还缺什么。";
    if (st.tide && !st.won) return "兽潮正在逼近。迎击前可以先换行装、升级、去工坊做准备。";
    return "继续下潜，把聚落建得更好。";
  }
  function hearthTab() {
    return (
      '<div class="card"><h3>炉火 · 炉温 ' + st.hearth + "/" + D.HEARTH.max + "</h3>" + barH("hearth", st.hearth, D.HEARTH.max) +
      '<p class="dim">每次下潜炉温 -1，倒下再 -1。炉温低于 3 时工匠停工，行装不能升级；炉火熄灭时出发生命 -30%。兽潮时炉温每 2 格，守城护甲 +1。</p>' +
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
      h += '<div class="card"><h4>' + ["旧", "新", "精制"][lv] + G0.name + "</h4><p>" + GEARFX[k](cur) + "</p>";
      if (nx) h += '<p class="dim">' + ["旧", "新", "精制"][lv + 1] + G0.name + "：" + GEARFX[k](nx) + "</p><p>" + cost(nx.cost) + '</p><div class="btns"><button class="btn" data-act="build" data-v="' + k + '"' + (S.has(st, nx.cost) ? "" : " disabled") + ">打造" + ["旧", "新", "精制"][lv + 1] + G0.name + "</button></div>";
      else h += '<p class="dim">已是最好的一级。</p>';
      h += "</div>";
    }
    return h;
  }
  function kitTab() {
    const subs = [["outfit", "行装"], ["items", "配件 " + st.equip.length + "/" + D.EQUIP_SLOTS], ["skills", "技艺 " + st.slots.length + "/" + D.SKILL_SLOTS]];
    let h = '<nav class="tabs sub">' + subs.map(([k, t]) => '<button data-act="kit" data-v="' + k + '"' + (view.kit === k ? ' class="on"' : "") + ">" + t + "</button>").join("") + "</nav>";
    if (view.kit === "items") return h + itemsPage();
    if (view.kit === "skills") return h + skillsPage();
    h += '<div class="card"><p class="dim">你只有一个人，穿哪套行装就是哪种打法。每套行装单独升级（生命和攻击各 +10% 每级）和进阶。下潜时可以再背一套备用的，遇敌时换上。' + (st.hearth < 3 ? '<span class="lack">炉温低于 3，工匠停工，不能升级。</span>' : "") + "</p></div>";
    for (const id of ["hunter", "guard", "stoker"]) {
      const O = D.OUTFITS[id], c = st.outfits[id], tc = S.upgradeCost(st, id), on = st.wear === id, sp = st.spare === id;
      h += '<div class="card' + (on ? " sel" : "") + '"><h4 class="c-' + id + '">' + O.name + " · " + c.lv + " 级" + (on ? "（穿着）" : sp ? "（备用）" : "") + '</h4><p class="dim">' + O.trait + "</p><p>适合：" + O.good + "</p>";
      h += c.adv ? "<p>已进阶：" + O.adv.name + "</p>" : "<p>进阶「" + O.adv.name + "」需要 " + cost(O.adv.need) + "</p>";
      h += '<div class="btns">' + (on ? "" : '<button class="btn main" data-act="wear" data-v="' + id + '">穿上</button>') + (on || sp ? "" : '<button class="btn" data-act="spare" data-v="' + id + '">当备用</button>') + '<button class="btn" data-act="upgrade" data-v="' + id + '"' + (st.hearth >= 3 && st.store.core >= tc ? "" : " disabled") + ">升级（能核 -" + tc + "）</button>" + (c.adv ? "" : '<button class="btn" data-act="promote" data-v="' + id + '"' + (S.has(st, O.adv.need) ? "" : " disabled") + ">进阶</button>") + "</div></div>";
    }
    return h;
  }
  function itemsPage() {
    let h = '<div class="card"><p class="dim">打倒敌人会掉配件，带回聚落才算数。最多装 ' + D.EQUIP_SLOTS + " 件，同名的只能装一件。写着「穿某行装时」的词条，只有穿着那套才生效。库房最多放 " + D.BAG + " 件，多了会自动拆掉最差的。</p>";
    const list = st.items.slice().sort((a, b) => (st.equip.includes(b.id) ? 1 : 0) - (st.equip.includes(a.id) ? 1 : 0) || b.r - a.r || a.id - b.id);
    if (!list.length) h += "<p>还没有配件。出发下潜，打倒敌人后把掉落带回来。</p>";
    for (const it of list) {
      const on = st.equip.includes(it.id), fit = D.ITEMS[it.b].fit, ask = view.confirm === it.id;
      h += '<div class="item' + (on ? " on" : "") + '"><span><b class="r' + it.r + '">' + esc(S.itemName(it)) + (on ? "（装着）" : "") + "</b><small>" + affixText(it.a) + (fit ? "。配" + D.OUTFITS[fit].name : "") + "</small></span>" + (on ? '<button class="chip" data-act="unequip" data-v="' + it.id + '">卸下</button>' : '<button class="chip" data-act="equip" data-v="' + it.id + '">装上</button><button class="chip' + (ask ? " warn" : "") + '" data-act="salvage" data-v="' + it.id + '">' + (ask ? "再点一次拆掉" : "拆成能核 " + D.RARITY[it.r].salvage) + "</button>") + "</div>";
    }
    return h + "</div>";
  }
  function skillsPage() {
    let h = '<div class="card"><p class="dim">最多带 ' + D.SKILL_SLOTS + " 个。每层的据点首领必掉一个（没带回来就倒下的话，下次再打还会掉），回声井以下的敌人偶尔也掉。</p>";
    if (!st.skills.length) h += "<p>还没有技艺。清掉霜根廊的据点会学到第一个。</p>";
    for (const k of st.skills) {
      const on = st.slots.includes(k);
      h += '<div class="item' + (on ? " on" : "") + '"><span><b>' + D.SKILLS[k].name + (on ? "（带着）" : "") + "</b><small>" + D.SKILLS[k].desc + '</small></span><button class="chip" data-act="skill" data-v="' + k + '">' + (on ? "放下" : "带上") + "</button></div>";
    }
    return h + "</div>";
  }
  function routeTab() {
    let h = '<div class="card"><h3>补给线</h3><p class="dim">修好的路段有常规队伍往返：持续带回能核，沿途回程不耗氧，下次可以从下一层出发。</p>' + (S.routeUnlocked(st) ? "" : '<p class="lack">还不知道旧路怎么走。先去霜根廊深处找找线索。</p>') + "</div>";
    D.ROUTE.forEach((seg, i) => {
      const L = D.LAYERS[seg.layer - 1];
      h += '<div class="card"><h4>第 ' + (i + 1) + " 段 · " + L.name + "</h4>";
      if (i < st.route) h += '<p>已修复。常规队伍 +' + seg.rate + " 能核/分。</p>";
      else if (i === st.route) {
        const need = S.routeNeed(st, i);
        h += "<p>" + (st.cleared[seg.layer] ? "据点已清" : '<span class="lack">据点未清</span>') + " " + cost(need) + "</p>" + (i === 0 && st.flags.wei ? '<p class="dim">苇带路，少用能核 15、冻筋 2。</p>' : "");
        h += '<div class="btns"><button class="btn main" data-act="repair"' + (S.routeUnlocked(st) && st.cleared[seg.layer] && S.has(st, need) ? "" : " disabled") + ">修复（修好后常规队伍 +" + seg.rate + " 能核/分）</button></div>";
      } else h += '<p class="dim">先修好上一段。</p>';
      h += "</div>";
    });
    return h;
  }
  function optTab() {
    return (
      '<div class="card"><h3>设置</h3><div class="btns col"><button class="btn" data-act="snd">' + (opt.snd ? "关闭声音" : "打开声音") + '</button><button class="btn" data-act="export">导出存档</button><button class="btn" data-act="import">导入存档</button><button class="btn warn" data-act="reset">重新开始</button></div></div>' +
      '<div class="card"><h4>操作</h4><p class="dim">数字键 1 到 3 选节点，F 战斗，D 绕行，R 撤退或归返，空格出发，或在交战时直接看结果。</p><p class="dim">像素字体 Fusion Pixel（SIL OFL 1.1）。</p></div>'
    );
  }
  function rescueModal() {
    modal('<h3>呼救</h3><p>岩缝里卡着一个外乡人，腿被冻住了。把她背出来，就得放下一半背着的能核。</p><p class="dim">现在背着能核 ' + st.dive.carry.core + "，救她要放下 " + Math.ceil(st.dive.carry.core / 2) + "。她像是从路的另一头来的，也许认得旧补给线。</p>" + '<div class="btns col"><button class="btn main" data-act="rescue" data-v="1">放下一半能核，救她</button><button class="btn" data-act="rescue" data-v="0">不停下，继续走</button></div>');
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
  let idleSum = 0;
  function idle(first) {
    const n = S.idleTick(st, Date.now());
    if (n > 0) {
      idleSum += n;
      if (!st.dive && !view.fight) {
        if (first || idleSum >= 5) {
          toast((first ? "离开期间，" : "") + "常规队伍带回能核 +" + idleSum + "。"); // 攒够 5 个再提示，下潜中不打扰
          idleSum = 0;
        }
        render();
      }
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

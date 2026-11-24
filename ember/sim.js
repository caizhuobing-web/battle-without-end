/* 余烬归途：模拟层。不依赖 DOM，可在 Node 中直接运行做数值测试。
   所有状态都是可 JSON 序列化的普通对象，存档直接存 state。 */
(function (G) {
  const D = G.EmberData;
  const MAX_ROUNDS = 80;

  function rnd(s) {
    const a = (s.rs = (s.rs + 0x6d2b79f5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const pick = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];
  const addBag = (bag, k, n) => (bag[k] = (bag[k] || 0) + n);

  function newGame(seed, now) {
    return {
      v: 1,
      rs: seed | 0,
      store: { core: 10, mats: {} },
      hearth: D.HEARTH.start,
      gear: { tank: 0, armor: 0, frame: 0 },
      cls: { hunter: { lv: 1, adv: false }, guard: { lv: 1, adv: false }, stoker: { lv: 1, adv: false } },
      route: 0, // 已修复段数
      cleared: {}, // 已清据点的层
      flags: {},
      dives: 0,
      idleAt: now || 0,
      idleBank: 0,
      dive: null,
      tide: null,
      won: false,
      log: [],
    };
  }

  function say(s, text) {
    s.log.push(text);
    if (s.log.length > 40) s.log.shift();
  }

  /* ---------- 负重与氧气 ---------- */
  function gearWeight(s) {
    return D.GEAR.tank.levels[s.gear.tank].w + D.GEAR.armor.levels[s.gear.armor].w;
  }
  function capacity(s) {
    return D.GEAR.frame.levels[s.gear.frame].cap;
  }
  function weight(s) {
    let w = gearWeight(s);
    const c = s.dive && s.dive.carry;
    if (c) {
      w += c.core * D.CORE_W;
      for (const k in c.mats) w += D.MATS[k].w * c.mats[k];
    }
    return w;
  }
  const overweight = (s) => weight(s) > capacity(s);

  function stepCost(s, layer) {
    const L = D.LAYERS[layer - 1];
    return L.o2Step + (overweight(s) ? 1 : 0) + (L.special === "fog" ? 1 : 0);
  }
  /* 回程氧气：从当前层往上，每层按一个节点的量；当前层按已走的步数。
     已修复的补给线路段沿途有补给点，回程不耗氧。回声井锚点修好后该层减半。 */
  function returnCost(s) {
    if (!s.dive) return 0;
    let n = 0;
    for (let l = s.route + 1; l <= s.dive.layer; l++) {
      let c = D.LAYERS[l - 1].o2Step * (l === s.dive.layer ? Math.max(1, s.dive.step) : 1);
      if (l === 2 && s.dive.anchor) c = Math.ceil(c / 2);
      n += c;
    }
    return n;
  }

  /* ---------- 小队 ---------- */
  function member(s, id) {
    const C = D.CLASSES[id], lv = s.cls[id].lv;
    const hp = Math.round(C.hp * (1 + 0.15 * (lv - 1)));
    return { id, hp, max: hp, atk: C.atk * (1 + 0.12 * (lv - 1)), arm: C.arm + D.GEAR.armor.levels[s.gear.armor].arm, stam: 30 };
  }

  /* ---------- 路线图 ---------- */
  function genLayer(s, layer) {
    const L = D.LAYERS[layer - 1];
    const map = [];
    for (let i = 0; i < L.steps; i++) {
      if (i === L.steps - 1) {
        map.push([{ t: "boss", e: L.boss }]);
        continue;
      }
      const n = 2 + (rnd(s) < 0.5 ? 1 : 0);
      const row = [];
      for (let j = 0; j < n; j++) {
        const r = rnd(s);
        let node;
        if (r < 0.55) node = { t: "fight", e: pick(s, L.enemies) };
        else if (r < 0.75) node = { t: L.special === "frozen" ? "crate" : L.special === "cliff" ? "anchor" : "spring" };
        else if (r < 0.9) node = { t: "cache" };
        else node = { t: "unknown" };
        if (L.special === "frozen" && node.t === "fight" && rnd(s) < 0.4) node.frozen = true;
        if (node.e === "mimicWorm") node.hidden = true; // 拟岩虫看起来像普通节点
        row.push(node);
      }
      map.push(row);
    }
    return map;
  }

  function startDive(s, fromLayer) {
    if (s.dive) throw new Error("already diving");
    const layer = Math.max(1, Math.min(fromLayer || 1, s.route + 1, D.LAYERS.length)); // 修好第 N 段后可从第 N+1 层出发
    const o2 = D.GEAR.tank.levels[s.gear.tank].o2;
    s.dive = {
      layer,
      step: 0,
      o2,
      o2Max: o2,
      carry: { core: 0, mats: {} },
      map: genLayer(s, layer),
      team: ["hunter", "guard", "stoker"].map((id) => member(s, id)),
      enc: null,
      event: null,
      anchor: false,
      stance: "cover",
      mode: "blanket",
      breach: true,
    };
    s.dives++;
    say(s, "出发下潜。氧气 " + o2 + "。");
    return s.dive;
  }

  /* 下一步可选的节点。隐藏节点显示为普通节点。 */
  function options(s) {
    const d = s.dive;
    if (!d || d.enc || d.event) return [];
    const row = d.map[d.step];
    return row ? row.map((n) => (n.hidden ? { t: "cache" } : n)) : [];
  }

  function spendO2(s, n) {
    const d = s.dive;
    d.o2 -= n;
    if (d.o2 < 0) {
      const lack = -d.o2;
      d.o2 = 0;
      for (const m of d.team) if (m.hp > 0) m.hp = Math.max(1, m.hp - 6 * lack);
      say(s, "氧气耗尽。全员生命 -" + 6 * lack + "。");
    }
  }

  function moveTo(s, idx) {
    const d = s.dive;
    const node = d.map[d.step][idx];
    if (!node) throw new Error("bad node");
    const L = D.LAYERS[d.layer - 1];
    spendO2(s, stepCost(s, d.layer));
    if (L.special === "cliff" && overweight(s) && rnd(s) < 0.35) {
      for (const m of d.team) if (m.hp > 0) m.hp = Math.max(1, m.hp - 8);
      say(s, "超重，在峭壁上滑落。全员生命 -8。");
    }
    d.cur = node;
    if (d.layer === 1 && d.step === 2 && !s.flags.metWei) {
      s.flags.metWei = true;
      d.event = "rescue";
      return node;
    }
    resolveNode(s, node);
    return node;
  }

  function resolveNode(s, node) {
    const d = s.dive;
    const L = D.LAYERS[d.layer - 1];
    if (node.t === "fight" || node.t === "boss") {
      const E = D.ENEMIES[node.e];
      d.enc = { e: node.e, foes: [], frozen: !!node.frozen, boss: node.t === "boss", hidden: !!node.hidden };
      for (let i = 0; i < E.n; i++) d.enc.foes.push({ hp: Math.round(E.hp * (1 + 0.1 * (s.dives > 6 ? 1 : 0))), max: E.hp });
      if (node.hidden) say(s, "一块岩石裂开了。是" + E.name + "，路被封住。");
      else say(s, "前方有" + E.name + (E.n > 1 ? " ×" + E.n : "") + "。");
      if (E.trait === "ambush" && !node.frozen) {
        const t = target(s, d.team);
        if (t) hurt(s, t, E.atk * 1.5);
        say(s, E.name + "从暗处扑出，先手一击。");
      }
      return;
    }
    if (node.t === "crate") {
      spendO2(s, 1);
      d.carry.core += 4;
      addBag(d.carry.mats, L.mat, 1);
      say(s, "撬开冰封的旧货箱。能核 +4，" + D.MATS[L.mat].name + " +1。");
    } else if (node.t === "anchor") {
      d.anchor = true;
      say(s, "修好一处锚点。本层回程氧气减半。");
    } else if (node.t === "spring") {
      d.o2 = Math.min(d.o2Max, d.o2 + 6);
      say(s, "在热泉边换气。氧气 +6。");
    } else if (node.t === "cache") {
      const n = 2 + Math.floor(rnd(s) * 3);
      d.carry.core += n;
      say(s, "找到前人留下的补给。能核 +" + n + "。");
    } else {
      if (rnd(s) < 0.5) {
        d.o2 = Math.min(d.o2Max, d.o2 + 3);
        say(s, "一处还有余气的旧通风口。氧气 +3。");
      } else {
        for (const m of d.team) if (m.hp > 0) m.hp = Math.max(1, m.hp - 5);
        say(s, "塌方。全员生命 -5。");
      }
    }
    advance(s);
  }

  function rescue(s, yes) {
    const d = s.dive;
    if (d.event !== "rescue") throw new Error("no event");
    d.event = null;
    if (yes) {
      const lost = Math.ceil(d.carry.core / 2);
      d.carry.core -= lost;
      s.flags.wei = true;
      say(s, "放下 " + lost + " 个能核，把被困的外乡人背了出来。她叫苇，知道旧补给线怎么走。");
    } else {
      say(s, "没有停下。身后的呼救声渐渐听不见了。");
    }
    resolveNode(s, d.cur);
  }

  function advance(s) {
    const d = s.dive;
    d.step++;
    if (d.step >= d.map.length) {
      if (d.layer < D.LAYERS.length && s.cleared[d.layer]) {
        d.layer++;
        d.step = 0;
        d.map = genLayer(s, d.layer);
        say(s, "下到" + D.LAYERS[d.layer - 1].name + "。");
      } else {
        d.atEnd = true;
      }
    }
  }

  /* ---------- 战斗 ---------- */
  function target(s, team) {
    const alive = team.filter((m) => m.hp > 0);
    if (!alive.length) return null;
    const g = alive.find((m) => m.id === "guard");
    if (g && rnd(s) < 0.4) return g;
    return pick(s, alive);
  }
  function hurt(s, m, dmg) {
    const d = s.dive;
    const g = d.team.find((x) => x.id === "guard" && x.hp > 0);
    let arm = m.arm + (s.cls.stoker.adv && d.mode === "plating" ? 3 : 0);
    if (g && s.cls.guard.adv && d.stance === "cover" && g.stam > 0 && m !== g) {
      g.stam -= 2;
      m = g;
      arm = g.arm + 2;
    }
    m.hp -= Math.max(1, Math.round(dmg - arm));
  }

  function fightRound(s) {
    const d = s.dive, enc = d.enc, E = D.ENEMIES[enc.e];
    const foes = enc.foes.filter((f) => f.hp > 0);
    const team = d.team.filter((m) => m.hp > 0);
    const breached = s.cls.hunter.adv && d.breach;
    for (const m of team) {
      if (!foes.some((f) => f.hp > 0)) break;
      const live = foes.filter((f) => f.hp > 0);
      const strongest = live.reduce((a, b) => (b.hp > a.hp ? b : a));
      const mul = breached && strongest.breached ? 1.3 : 1;
      if (m.id === "hunter") {
        if (breached && !strongest.breached) strongest.breached = true;
        strongest.hp -= m.atk * mul * (live.length > 2 ? 0.8 : 1.2);
      } else if (m.id === "guard") {
        const counter = s.cls.guard.adv && d.stance === "counter";
        strongest.hp -= m.atk * mul * (counter ? 2.2 : 1);
        if (!counter) m.stam = Math.min(30, m.stam + 1);
      } else {
        const mode = s.cls.stoker.adv ? d.mode : "blanket";
        const fuel = d.carry.core > 0;
        d.burn = (d.burn || 0) + 1;
        if (fuel && mode !== "plating" && d.burn % 3 === 0) d.carry.core--; // 每三轮烧掉 1 个随身能核
        const pow = m.atk * (fuel ? 1.6 : 0.6);
        if (mode === "lance") strongest.hp -= pow * 2.2 * mul;
        else if (mode === "blanket") for (const f of live) f.hp -= pow * (f.breached && breached ? 1.3 : 1);
        else strongest.hp -= m.atk * 0.6;
      }
    }
    for (const f of foes) {
      if (f.hp <= 0) continue;
      const t = target(s, d.team);
      if (!t) break;
      hurt(s, t, E.atk);
      if (t.id === "guard" && s.cls.guard.adv && d.stance === "counter") f.hp -= t.atk * 0.8;
    }
    const g = d.team.find((x) => x.id === "guard");
    if (g && g.stam <= 0 && d.stance === "cover") {
      d.stance = "counter";
      say(s, "护卫者耐力耗尽，掩护解除。");
    }
  }

  function fight(s) {
    const d = s.dive, enc = d.enc, E = D.ENEMIES[enc.e];
    let r = 0;
    while (r++ < MAX_ROUNDS && enc.foes.some((f) => f.hp > 0) && d.team.some((m) => m.hp > 0)) fightRound(s);
    if (!d.team.some((m) => m.hp > 0)) {
      say(s, "小队倒在了" + D.LAYERS[d.layer - 1].name + "。被救回灰炉屯，背着的东西都丢了。");
      d.carry = { core: 0, mats: {} };
      s.hearth = Math.max(1, s.hearth - 1);
      return finish(s, "wiped");
    }
    let core = 0;
    for (const f of enc.foes) core += f.breached ? E.core + 4 : E.core; // 破甲后取到完整能核
    d.carry.core += core;
    const L = D.LAYERS[d.layer - 1];
    if (rnd(s) < 0.3) addBag(d.carry.mats, L.mat, 1);
    if (E.drop) for (const k in E.drop) addBag(d.carry.mats, k, E.drop[k]);
    if (enc.boss && !s.cleared[d.layer]) {
      s.cleared[d.layer] = true;
      if (d.layer === 1 && !s.flags.wei) s.flags.weiSign = true;
      if (d.layer === 3) s.flags.relic = true;
    }
    say(s, "打倒了" + E.name + "。能核 +" + core + "。");
    d.enc = null;
    for (const m of d.team) if (m.hp > 0) m.hp = Math.min(m.max, m.hp + 4);
    advance(s);
    return "won";
  }

  /* 敌情节点的三个选择。 */
  function act(s, choice) {
    const d = s.dive;
    if (!d || !d.enc) throw new Error("no encounter");
    const E = D.ENEMIES[d.enc.e];
    if (choice === "fight") return fight(s);
    if (choice === "retreat") return goHome(s);
    if (choice === "detour") {
      if (!canDetour(s)) throw new Error("cannot detour");
      spendO2(s, 1 + (d.enc.frozen ? 1 : 0));
      if (E.trait === "track" && rnd(s) < 0.5) {
        say(s, E.name + "循着声音追了上来，没能甩开。");
        return fight(s);
      }
      say(s, "绕开了" + E.name + "。");
      d.enc = null;
      advance(s);
      return "detoured";
    }
    throw new Error("bad choice");
  }
  const canDetour = (s) => !!(s.dive && s.dive.enc && !s.dive.enc.boss && !s.dive.enc.hidden);

  /* ---------- 归返与结算 ---------- */
  function goHome(s) {
    const d = s.dive;
    const need = returnCost(s);
    let lostShare = 0;
    if (d.o2 < need) {
      lostShare = Math.min(1, (need - d.o2) * 0.25);
      const lost = Math.ceil(d.carry.core * lostShare);
      d.carry.core -= lost;
      say(s, "回程氧气不够，丢下了 " + lost + " 个能核。");
    }
    d.o2 = Math.max(0, d.o2 - need);
    return finish(s, "home");
  }

  function finish(s, how) {
    const d = s.dive;
    s.store.core += d.carry.core;
    for (const k in d.carry.mats) addBag(s.store.mats, k, d.carry.mats[k]);
    s.hearth = Math.max(0, s.hearth - D.HEARTH.perDive);
    if (how === "home") say(s, "全员归返。带回能核 " + d.carry.core + "。");
    s.last = { how, core: d.carry.core, mats: Object.assign({}, d.carry.mats), layer: d.layer };
    s.dive = null;
    return how;
  }

  /* ---------- 聚落 ---------- */
  function has(s, need) {
    for (const k in need) {
      const have = k === "core" ? s.store.core : s.store.mats[k] || 0;
      if (have < need[k]) return false;
    }
    return true;
  }
  function pay(s, need) {
    if (!has(s, need)) return false;
    for (const k in need) {
      if (k === "core") s.store.core -= need[k];
      else s.store.mats[k] -= need[k];
    }
    return true;
  }
  function stoke(s) {
    if (s.hearth >= D.HEARTH.max || !pay(s, { core: D.HEARTH.fuelCost })) return false;
    s.hearth++;
    return true;
  }
  function build(s, kind) {
    const lv = D.GEAR[kind].levels[s.gear[kind] + 1];
    if (!lv || !pay(s, lv.cost)) return false;
    s.gear[kind]++;
    return true;
  }
  const trainCost = (s, id) => 6 * s.cls[id].lv;
  function train(s, id) {
    if (s.hearth < 3 || !pay(s, { core: trainCost(s, id) })) return false;
    s.cls[id].lv++;
    return true;
  }
  function promote(s, id) {
    if (s.cls[id].adv || !pay(s, D.CLASSES[id].adv.need)) return false;
    s.cls[id].adv = true;
    return true;
  }
  const routeUnlocked = (s) => !!(s.flags.wei || s.flags.weiSign);
  function repair(s) {
    const seg = D.ROUTE[s.route];
    if (!seg || !routeUnlocked(s) || !s.cleared[seg.layer] || !pay(s, seg.need)) return false;
    s.route++;
    if (s.route === D.ROUTE.length) s.tide = { wave: 0 };
    return true;
  }
  const idleRate = (s) => D.ROUTE.slice(0, s.route).reduce((a, r) => a + r.rate, 0);
  /* 常规队伍：按真实经过的秒数产出，上限 8 小时。 */
  function idleTick(s, now) {
    const sec = Math.min(D.IDLE_CAP_SEC, Math.max(0, (now - s.idleAt) / 1000));
    s.idleAt = now;
    s.idleBank += (idleRate(s) * sec) / 60;
    const whole = Math.floor(s.idleBank);
    s.idleBank -= whole;
    s.store.core += whole;
    return whole;
  }

  /* ---------- 兽潮 ---------- */
  const TIDE = [
    { e: "whiteHyena", n: 4 },
    { e: "chorusBat", n: 8 },
    { e: "fumeTyrant", n: 1 },
  ];
  function tideWave(s) {
    if (!s.tide || s.won) return null;
    const w = TIDE[s.tide.wave];
    s.dive = { layer: 3, step: 0, o2: 99, o2Max: 99, carry: { core: 10, mats: {} }, map: [], team: ["hunter", "guard", "stoker"].map((id) => member(s, id)), anchor: false, stance: "cover", mode: "blanket", breach: true, tide: true };
    s.dive.enc = { e: w.e, foes: Array.from({ length: w.n }, () => ({ hp: D.ENEMIES[w.e].hp, max: D.ENEMIES[w.e].hp })), boss: true };
    let r = 0;
    while (r++ < MAX_ROUNDS && s.dive.enc.foes.some((f) => f.hp > 0) && s.dive.team.some((m) => m.hp > 0)) fightRound(s);
    const held = s.dive.enc.foes.every((f) => f.hp <= 0);
    if (!held) s.hearth = Math.max(0, s.hearth - 3);
    s.dive = null;
    if (held) {
      s.tide.wave++;
      if (s.tide.wave >= TIDE.length) s.won = true;
    } else if (s.hearth <= 0) {
      s.hearth = 1;
      s.tide.wave = 0;
      s.store.core = Math.floor(s.store.core * 0.7);
    }
    return held;
  }

  G.EmberSim = { newGame, startDive, options, moveTo, rescue, act, canDetour, goHome, returnCost, stepCost, weight, capacity, overweight, stoke, build, train, trainCost, promote, repair, routeUnlocked, idleRate, idleTick, tideWave, has, TIDE };
})(typeof globalThis !== "undefined" ? globalThis : window);

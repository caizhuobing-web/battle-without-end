/* 万丈深渊：模拟层。不依赖 DOM，可在 Node 中直接运行做数值测试。
   所有状态都是可 JSON 序列化的普通对象，存档直接存 state。
   主角只有一个人：穿哪套行装就是哪种打法，配件和技艺围绕行装的特性来搭。 */
(function (G) {
  const D = G.EmberData;
  const MAX_ROUNDS = 80, BIG = 40;

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
      v: 2,
      rs: seed | 0,
      store: { core: 10, mats: {} },
      hearth: D.HEARTH.start,
      gear: { tank: 0, armor: 0, frame: 0 },
      outfits: { hunter: { lv: 1, adv: false }, guard: { lv: 1, adv: false }, stoker: { lv: 1, adv: false } },
      wear: "hunter",
      items: [], // 带回聚落的配件 {id, b 底子, r 品质, a 词条}
      equip: [], // 装着的配件 id，最多 3 件
      skills: [], // 学会的技艺
      slots: [], // 带着的技艺，最多 2 个
      nextId: 1,
      route: 0, // 已修复段数
      cleared: {}, // 已清据点的层
      flags: {},
      tactic: { stance: "cover", mode: "blanket", breach: true }, // 进阶后的战前选择，跨下潜保留
      dives: 0,
      signAt: 0,
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

  /* ---------- 行装、配件、技艺 ---------- */
  /* 装着的配件的词条合计。 */
  function mods(s) {
    const m = {};
    for (const k in D.STATS) m[k] = 0;
    for (const id of s.equip) {
      const it = s.items.find((x) => x.id === id);
      if (it) for (const [k, v] of it.a) m[k] += v;
    }
    return m;
  }
  const has2 = (s, sk) => s.slots.includes(sk);
  const stamMax = (s) => 8 + 2 * s.outfits.guard.lv + mods(s).stam; // 护卫装耐力：整次下潜共用，每走一步回 1
  function heroStats(s) {
    const O = D.OUTFITS[s.wear], lv = s.outfits[s.wear].lv, m = mods(s);
    return {
      hp: Math.round(O.hp * (1 + 0.15 * (lv - 1)) + m.hp),
      atk: O.atk * (1 + 0.12 * (lv - 1)) + m.atk,
      arm: O.arm + D.GEAR.armor.levels[s.gear.armor].arm + m.arm,
      o2: D.GEAR.tank.levels[s.gear.tank].o2 + m.o2,
      cap: D.GEAR.frame.levels[s.gear.frame].cap + m.cap,
    };
  }
  function hero(s) {
    const h = heroStats(s);
    return { id: s.wear, hp: h.hp, max: h.hp, atk: h.atk, arm: h.arm };
  }
  function wear(s, id) {
    if (s.dive || !D.OUTFITS[id]) return false;
    s.wear = id;
    return true;
  }
  const itemName = (it) => (it.r ? D.RARITY[it.r].name : "") + D.ITEMS[it.b].name;
  /* 掉一件配件：品质和数值随层数变好，首领必掉精良以上。 */
  function rollItem(s, layer, boss) {
    const keys = Object.keys(D.ITEMS);
    const b = pick(s, keys), q = rnd(s) + (boss ? 0.45 : 0) + 0.06 * (layer - 1);
    const r = q > 0.95 ? 2 : q > 0.6 ? 1 : 0;
    const scale = D.RARITY[r].mul * (1 + 0.25 * (layer - 1));
    const a = [[D.ITEMS[b].k, Math.max(1, Math.round(D.ITEMS[b].v * scale))]];
    if (r > 0) {
      const b2 = pick(s, keys.filter((k) => D.ITEMS[k].k !== D.ITEMS[b].k));
      a.push([D.ITEMS[b2].k, Math.max(1, Math.round(D.ITEMS[b2].v * scale * 0.6))]);
    }
    return { id: s.nextId++, b, r, a };
  }
  function equip(s, id) {
    if (s.dive || s.equip.includes(id) || s.equip.length >= D.EQUIP_SLOTS || !s.items.some((x) => x.id === id)) return false;
    s.equip.push(id);
    return true;
  }
  function unequip(s, id) {
    if (s.dive || !s.equip.includes(id)) return false;
    s.equip = s.equip.filter((x) => x !== id);
    return true;
  }
  function salvage(s, id) {
    const it = s.items.find((x) => x.id === id);
    if (s.dive || !it) return false;
    s.equip = s.equip.filter((x) => x !== id);
    s.items = s.items.filter((x) => x.id !== id);
    s.store.core += D.RARITY[it.r].salvage;
    return true;
  }
  function toggleSkill(s, sk) {
    if (s.dive || !s.skills.includes(sk)) return false;
    if (s.slots.includes(sk)) s.slots = s.slots.filter((x) => x !== sk);
    else if (s.slots.length < D.SKILL_SLOTS) s.slots.push(sk);
    else return false;
    return true;
  }

  /* ---------- 负重与氧气 ---------- */
  function gearWeight(s) {
    return D.GEAR.tank.levels[s.gear.tank].w + D.GEAR.armor.levels[s.gear.armor].w + D.GEAR.frame.levels[s.gear.frame].w;
  }
  const capacity = (s) => heroStats(s).cap;
  function weight(s) {
    let w = gearWeight(s);
    const c = s.dive && s.dive.carry;
    if (c) {
      w += c.core * D.CORE_W + (c.items ? c.items.length * D.ITEM_W : 0);
      for (const k in c.mats) w += D.MATS[k].w * c.mats[k];
    }
    return w;
  }
  const overweight = (s) => weight(s) > capacity(s);
  /* 超过上限 25% 就走不动了，只能丢东西或归返。 */
  const tooHeavy = (s) => weight(s) > capacity(s) * 1.25;
  function dropToCap(s) {
    const d = s.dive;
    const over = weight(s) - capacity(s);
    if (over <= 0) return 0;
    const n = Math.min(d.carry.core, Math.ceil(over / D.CORE_W));
    d.carry.core -= n;
    d.dropped = (d.dropped || 0) + n;
    say(s, "丢下 " + n + " 个能核，回到负重上限。");
    return n;
  }
  function stepCost(s, layer) {
    const L = D.LAYERS[layer - 1];
    return L.o2Step + (overweight(s) ? 1 : 0) + (L.special === "fog" ? 1 : 0);
  }
  /* 回程氧气：当前层按已走的步数，上面每个未修复的层按整层的步数。越深越贵。
     已修复的补给线路段沿途有补给点，回程不耗氧。回声井锚点修好后该层减半。 */
  function returnCost(s) {
    if (!s.dive) return 0;
    let n = 0;
    for (let l = s.route + 1; l <= s.dive.layer; l++) {
      const L = D.LAYERS[l - 1];
      let c = L.o2Step * (l === s.dive.layer ? Math.max(1, s.dive.step) : L.steps);
      if (l === 2 && s.dive.anchor) c = Math.ceil(c / 2);
      n += c;
    }
    return n;
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
        const spec = L.special === "frozen" ? "crate" : L.special === "cliff" ? "anchor" : "spring";
        if (r < 0.6) node = { t: "fight", e: pick(s, L.enemies) };
        else if (r < (spec === "spring" ? 0.7 : 0.78)) node = { t: spec };
        else if (r < 0.9) node = { t: "cache" };
        else node = { t: "unknown" };
        // 每层只有一处锚点
        if (node.t === "anchor" && (map.some((rw) => rw.some((x) => x.t === "anchor")) || row.some((x) => x.t === "anchor"))) node = { t: "cache" };
        if (node.t === "fight") {
          const E = D.ENEMIES[node.e];
          node.n = E.n[0] + Math.floor(rnd(s) * (E.n[1] - E.n[0] + 1)); // 成群的敌人每次数量不同
          if (L.special === "frozen" && E.trait === "ambush" && rnd(s) < 0.5) node.frozen = true;
        }
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
    const o2 = heroStats(s).o2;
    s.dive = {
      layer,
      step: 0,
      o2,
      o2Max: o2,
      carry: { core: 0, mats: {}, items: [], skills: [] },
      map: genLayer(s, layer),
      team: [hero(s)],
      enc: null,
      event: null,
      anchor: false,
      stam: stamMax(s),
      stance: s.tactic.stance,
      mode: s.tactic.mode,
      breach: s.tactic.breach,
    };
    s.dives++;
    if (s.hearth <= 0) {
      s.dive.team[0].hp = Math.round(s.dive.team[0].hp * 0.7);
      say(s, "炉火已熄，没睡暖。出发时生命 -30%。");
    }
    say(s, "穿着" + D.OUTFITS[s.wear].name + "出发下潜。氧气 " + o2 + "。");
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
    const d = s.dive, h = d.team[0];
    d.o2 -= n;
    if (d.o2 < 0) {
      const lack = -d.o2;
      d.o2 = 0;
      h.hp = Math.max(1, h.hp - 10 * lack);
      say(s, "氧气耗尽。生命 -" + 10 * lack + "。");
    }
  }

  function moveTo(s, idx) {
    const d = s.dive, h = d.team[0];
    const node = d.map[d.step][idx];
    if (!node) throw new Error("bad node");
    if (tooHeavy(s)) throw new Error("too heavy");
    const L = D.LAYERS[d.layer - 1];
    spendO2(s, stepCost(s, d.layer));
    d.stam = Math.min(stamMax(s), d.stam + 1);
    if (L.special === "cliff" && overweight(s) && rnd(s) < 0.35) {
      h.hp = Math.max(1, h.hp - 12);
      say(s, "超重，在峭壁上滑落。生命 -12。");
    }
    d.cur = node;
    if (d.layer === 1 && d.step >= 2 && s.signAt && s.dives > s.signAt && !s.flags.wei && !s.flags.weiSign) {
      s.flags.weiSign = true;
      say(s, "岩壁上有新刻的路标，指向更深处。有人走过这条路。");
    }
    if (d.layer === 1 && d.step === 2 && !s.flags.metWei) {
      s.flags.metWei = true;
      d.event = "rescue";
      return node;
    }
    resolveNode(s, node);
    return node;
  }

  function resolveNode(s, node) {
    const d = s.dive, h = d.team[0];
    const L = D.LAYERS[d.layer - 1];
    if (node.t === "fight" || node.t === "boss") {
      const E = D.ENEMIES[node.e];
      d.enc = { e: node.e, foes: [], frozen: !!node.frozen, boss: node.t === "boss", hidden: !!node.hidden };
      const n = node.n || E.n[0];
      for (let i = 0; i < n; i++) d.enc.foes.push({ hp: E.hp, max: E.hp });
      if (node.hidden) say(s, "一块岩石裂开了。是" + E.name + "，路被封住。");
      else say(s, "前方有" + E.name + (n > 1 ? " ×" + n : "") + "。");
      if (E.trait === "ambush" && !node.frozen) {
        h.hp -= Math.max(1, Math.round((E.atk * 1.5 * 10) / (10 + h.arm)));
        h.hp = Math.max(1, h.hp);
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
      d.o2 = Math.min(d.o2Max, d.o2 + 5);
      say(s, "在热泉边换气。氧气 +5。");
    } else if (node.t === "cache") {
      const n = 2 + Math.floor(rnd(s) * 3);
      d.carry.core += n;
      say(s, "找到前人留下的补给。能核 +" + n + "。");
    } else {
      const r = rnd(s);
      if (r < 0.35) {
        d.o2 = Math.min(d.o2Max, d.o2 + 3);
        say(s, "一处还有余气的旧通风口。氧气 +3。");
      } else if (r < 0.6) {
        const it = rollItem(s, d.layer, false);
        d.carry.items.push(it);
        say(s, "石缝里卡着一件前人留下的" + itemName(it) + "。");
      } else {
        h.hp = Math.max(1, h.hp - 8);
        say(s, "塌方。生命 -8。");
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
    if (d.step >= d.map.length) d.atEnd = true; // 据点已清：玩家选择往下一层还是归返
  }
  const canDescend = (s) => !!(s.dive && s.dive.atEnd && s.dive.layer < D.LAYERS.length && s.cleared[s.dive.layer]);
  function descend(s) {
    const d = s.dive;
    if (!canDescend(s)) throw new Error("cannot descend");
    if (tooHeavy(s)) throw new Error("too heavy");
    d.layer++;
    d.step = 0;
    d.atEnd = false;
    d.map = genLayer(s, d.layer);
    say(s, "下到" + D.LAYERS[d.layer - 1].name + "。");
  }

  /* ---------- 战斗 ----------
     每轮：主角出手，然后每个敌人各攻击一次。生命在一次下潜内不会自己恢复（除非配件或技艺）。
     据点首领每 3 轮重击一次（伤害 ×2.5）。
     行装自带特性：
       猎核装：只打最强的敌人，伤害 ×1.3；敌人多于 2 个时再 ×0.8。
       护卫装：每次被打都反击（攻击 ×0.5）。
       御炉装：每轮打全部敌人；每 2 轮烧 1 个随身能核，没有能核时 ×0.4。
     进阶后的战前选择：
       破甲（猎核装）：先花 2 轮研究最强的敌人，之后对它伤害 +60%；大型敌人（生命 40 以上）破甲后击杀，取到完整能核（+4）。
       姿态（护卫装）：架盾＝受到的伤害减半，每挡一次耐力 -1，耐力耗尽转为机动反击；
                       机动反击＝自身伤害 ×2，反击 ×0.6，每轮耐力 +1；生命低于一半且耐力回到一半时重新架盾。
       模式（御炉装）：投射＝单体 ×3.2；压制＝全体 ×1.3；两者每轮烧 1 个随身能核、散热 +2，到 6 停火一轮。
                       装甲＝护甲 +4，不烧能核，自身伤害很低。 */
  function hurt(s, raw, foe) {
    const d = s.dive, enc = d.enc, h = d.team[0], ad = s.outfits[s.wear].adv, M = enc.m;
    let mul = 1;
    if (enc.smoke && enc.round <= 3) mul *= 0.5;
    if (s.wear === "guard" && ad && enc.stance === "cover" && d.stam > 0) {
      d.stam--;
      mul *= 0.5;
      if (d.stam <= 0) {
        enc.stance = "counter";
        enc.switched = (enc.switched || 0) + 1;
      }
    }
    const arm = h.arm + (s.wear === "stoker" && ad && d.mode === "plating" ? 4 : 0);
    h.hp -= Math.max(1, Math.round((raw * mul * 10) / (10 + arm)));
    if (foe && s.wear === "guard") foe.hp -= h.atk * (ad ? (enc.stance === "counter" ? 0.6 : 0.3) : 0.5) * (1 + M.counter / 100);
  }
  function burn(s) {
    const d = s.dive;
    if (rnd(s) < d.enc.m.fuel / 100) return; // 节核阀：这次不消耗
    d.carry.core--;
    d.burned = (d.burned || 0) + 1;
  }

  function fightRound(s) {
    const d = s.dive, enc = d.enc, E = D.ENEMIES[enc.e], h = d.team[0], ad = s.outfits[s.wear].adv, M = enc.m;
    const live = () => enc.foes.filter((f) => f.hp > 0);
    const strongest = () => live().reduce((a, b) => (b.hp > a.hp ? b : a));
    enc.round = (enc.round || 0) + 1;
    const many = live().length > 2;
    const base = (1 + (many ? M.swarm : 0) / 100) * (1 + (E.hp >= BIG ? M.big : 0) / 100) * (rnd(s) < M.crit / 100 ? 2 : 1);
    const mulOf = (f) => base * (f.breached ? 1.6 + M.breach / 100 : 1);
    const tgt = strongest();
    if (s.wear === "hunter") {
      if (ad && d.breach && !tgt.breached) {
        tgt.study = (tgt.study || 0) + 1; // 研究两轮才破甲
        if (tgt.study >= 2) tgt.breached = true;
      } else tgt.hp -= h.atk * 1.3 * (many ? 0.8 : 1) * mulOf(tgt);
    } else if (s.wear === "guard") {
      tgt.hp -= h.atk * (!ad ? 1 : enc.stance === "counter" ? 2 : 0.6) * mulOf(tgt);
    } else {
      const mode = ad ? d.mode : "basic";
      const fuel = d.carry.core > 0;
      if (enc.heat >= 6) enc.heat = 0; // 过热停火一轮
      else if (mode === "plating") tgt.hp -= h.atk * 0.4 * mulOf(tgt);
      else if (mode === "basic") {
        if (fuel && enc.round % 2 === 0) burn(s);
        for (const f of live()) f.hp -= h.atk * (fuel ? 1 : 0.4) * mulOf(f);
      } else {
        if (fuel) burn(s);
        enc.heat += 2;
        if (mode === "lance") tgt.hp -= h.atk * (fuel ? 3.2 : 0.8) * mulOf(tgt);
        else for (const f of live()) f.hp -= h.atk * (fuel ? 1.3 : 0.4) * mulOf(f);
      }
    }
    // 技艺
    if (enc.spear && enc.round % 2 === 0 && live().length) {
      const t2 = strongest();
      t2.hp -= h.atk * 1.5 * mulOf(t2);
    }
    if (enc.quake && enc.round % 3 === 0) for (const f of live()) f.hp -= h.atk * 1.2 * mulOf(f);
    if (enc.brand) for (const f of live()) f.hp -= h.atk * 0.4;
    // 敌人出手
    for (const f of enc.foes) {
      if (f.hp <= 0 || h.hp <= 0) continue;
      hurt(s, E.trait === "boss" && enc.round % 3 === 0 ? E.atk * 2.5 : E.atk, f);
    }
    if (enc.aid && !enc.aided && h.hp > 0 && h.hp < h.max * 0.4) {
      h.hp = Math.min(h.max, h.hp + Math.round(h.max * 0.35));
      enc.aided = true;
    }
    if (s.wear === "guard" && ad && enc.stance === "counter") {
      d.stam = Math.min(stamMax(s), d.stam + 1);
      if (d.stance === "cover" && d.stam >= stamMax(s) / 2 && h.hp > 0 && h.hp < h.max / 2) {
        enc.stance = "cover";
        enc.switched = (enc.switched || 0) + 1;
      }
    }
  }
  function prepEnc(s) {
    const d = s.dive, enc = d.enc;
    enc.m = mods(s);
    enc.stance = d.stam > 0 ? d.stance : "counter";
    enc.heat = 0;
    for (const k of ["spear", "quake", "smoke", "aid", "brand", "still"]) enc[k] = has2(s, k);
  }
  const fighting = (d) => d.enc.foes.some((f) => f.hp > 0) && d.team[0].hp > 0;

  /* 逐轮快照，供界面回放战斗。 */
  function snap(d) {
    return { t: d.team.map((m) => Math.max(0, Math.round(m.hp))), f: d.enc.foes.map((f) => Math.max(0, Math.round(f.hp))), b: d.enc.foes.map((f) => (f.breached ? 1 : 0)) };
  }
  function runRounds(s) {
    const d = s.dive, enc = d.enc;
    prepEnc(s);
    const frames = [snap(d)];
    let r = 0;
    while (r++ < MAX_ROUNDS && fighting(d)) {
      fightRound(s);
      frames.push(snap(d));
    }
    s.fx = { e: enc.e, boss: !!enc.boss, layer: d.layer, wear: s.wear, max: d.team.map((m) => m.max), frames };
    if (enc.switched) say(s, "战斗中切换了 " + enc.switched + " 次姿态。");
  }
  /* 战前预估：换 5 个随机种子在副本上各打一遍。返回 {win 胜场数, n 总场数, cost 胜局平均损失的生命比例, burned 平均烧掉的能核}。 */
  function forecast(s) {
    let win = 0, left = 0, burned = 0;
    const N = 5;
    for (let i = 0; i < N; i++) {
      const c = JSON.parse(JSON.stringify(s));
      c.log = [];
      c.rs = (c.rs + 7919 * (i + 1)) | 0;
      const d = c.dive;
      prepEnc(c);
      const c0 = d.carry.core;
      let r = 0;
      while (r++ < MAX_ROUNDS && fighting(d)) fightRound(c);
      burned += c0 - d.carry.core;
      if (d.team[0].hp > 0 && !d.enc.foes.some((f) => f.hp > 0)) {
        win++;
        left += d.team[0].hp / d.team[0].max;
      }
    }
    const now = Math.max(0, s.dive.team[0].hp) / s.dive.team[0].max;
    return { win, n: N, left: win ? left / win : 0, cost: win ? Math.max(0, now - left / win) : now, burned: Math.round(burned / N) };
  }

  function fight(s) {
    const d = s.dive, enc = d.enc, E = D.ENEMIES[enc.e], h = d.team[0];
    runRounds(s);
    if (h.hp <= 0) {
      say(s, "倒在了" + D.LAYERS[d.layer - 1].name + "。被常规队伍抬回灰炉屯，背着的东西都丢了。");
      d.carry = { core: 0, mats: {}, items: [], skills: [] };
      s.hearth = Math.max(1, s.hearth - 1);
      return finish(s, "wiped");
    }
    let core = 0;
    for (const f of enc.foes) core += f.breached && E.hp >= BIG ? E.core + 4 : E.core; // 破甲的大型敌人取到完整能核
    core = Math.round(core * (1 + enc.m.loot / 100));
    d.carry.core += core;
    const L = D.LAYERS[d.layer - 1];
    if (rnd(s) < 0.45) addBag(d.carry.mats, L.mat, 1);
    if (E.drop) for (const k in E.drop) addBag(d.carry.mats, k, E.drop[k]);
    let got = "";
    // 掉配件：首领必掉，普通敌人三成
    if (enc.boss || rnd(s) < 0.3) {
      const it = rollItem(s, d.layer, enc.boss);
      d.carry.items.push(it);
      got += "，掉了一件" + itemName(it);
    }
    // 掉技艺：首领首次击倒必掉，第二层起的普通敌人偶尔掉
    const owned = (k) => s.skills.includes(k) || d.carry.skills.includes(k);
    let sk = null;
    if (enc.boss && !s.cleared[d.layer] && !owned(D.BOSS_SKILL[d.layer])) sk = D.BOSS_SKILL[d.layer];
    else if (!enc.boss && d.layer >= 2 && rnd(s) < 0.05) {
      const pool = Object.keys(D.SKILLS).filter((k) => !owned(k) && !Object.values(D.BOSS_SKILL).includes(k));
      if (pool.length) sk = pick(s, pool);
    }
    if (sk) {
      d.carry.skills.push(sk);
      got += "，学到技艺「" + D.SKILLS[sk].name + "」";
    }
    if (enc.boss && !s.cleared[d.layer]) {
      s.cleared[d.layer] = true;
      if (d.layer === 1 && !s.flags.wei && !s.signAt) s.signAt = s.dives; // 路标要下一次下潜才找得到
      if (d.layer === 3) s.flags.relic = true;
    }
    say(s, "打倒了" + E.name + "。能核 +" + core + got + "。");
    if (enc.m.regen) h.hp = Math.min(h.max, h.hp + enc.m.regen);
    if (enc.still) d.o2 = Math.min(d.o2Max, d.o2 + 2);
    d.enc = null;
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
      spendO2(s, detourCost(s));
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
  /* 绕行的氧气：1，冰封或攀壁蜥再 +1。 */
  const detourCost = (s) => 1 + (s.dive.enc.frozen ? 1 : 0) + (D.ENEMIES[s.dive.enc.e].trait === "cling" ? 1 : 0);
  const canDetour = (s) => !!(s.dive && s.dive.enc && !s.dive.enc.boss && !s.dive.enc.hidden);

  /* ---------- 归返与结算 ---------- */
  /* 归返会丢下多少能核（给界面预告）。 */
  function homeLoss(s) {
    const d = s.dive, need = returnCost(s);
    return d.o2 >= need ? 0 : Math.ceil(d.carry.core * Math.min(1, (need - d.o2) * 0.25));
  }
  function goHome(s) {
    const d = s.dive;
    const need = returnCost(s);
    const lost = homeLoss(s);
    if (lost) {
      d.carry.core -= lost;
      d.lost = lost;
      say(s, "回程氧气不够，丢下了 " + lost + " 个能核。");
    }
    d.o2 = Math.max(0, d.o2 - need);
    return finish(s, "home");
  }

  function finish(s, how) {
    const d = s.dive;
    s.store.core += d.carry.core;
    for (const k in d.carry.mats) addBag(s.store.mats, k, d.carry.mats[k]);
    const items = d.carry.items || [], skills = d.carry.skills || [];
    let auto = 0;
    for (const it of items) s.items.push(it);
    for (const sk of skills) if (!s.skills.includes(sk)) s.skills.push(sk);
    // 库房放不下：自动拆掉没装着的、品质最低的
    while (s.items.length > D.BAG) {
      const spare = s.items.filter((x) => !s.equip.includes(x.id)).sort((a, b) => a.r - b.r || a.id - b.id)[0];
      if (!spare) break;
      salvageRaw(s, spare);
      auto++;
    }
    s.hearth = Math.max(0, s.hearth - D.HEARTH.perDive);
    if (how === "home") say(s, "归返。带回能核 " + d.carry.core + (items.length ? "，配件 " + items.length + " 件" : "") + "。");
    s.last = { how, core: d.carry.core, mats: Object.assign({}, d.carry.mats), items: items.map((x) => x.id), skills: skills.slice(), auto, layer: d.layer, lost: d.lost || 0, burned: d.burned || 0, dropped: d.dropped || 0 };
    s.dive = null;
    return how;
  }
  function salvageRaw(s, it) {
    s.items = s.items.filter((x) => x.id !== it.id);
    s.store.core += D.RARITY[it.r].salvage;
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
  /* 升级行装：生命 +15%、攻击 +12% 每级。炉温低于 3 时工匠停工。 */
  const upgradeCost = (s, id) => 8 * s.outfits[id].lv;
  function upgrade(s, id) {
    if (s.hearth < 3 || !pay(s, { core: upgradeCost(s, id) })) return false;
    s.outfits[id].lv++;
    return true;
  }
  function promote(s, id) {
    if (s.outfits[id].adv || !pay(s, D.OUTFITS[id].adv.need)) return false;
    s.outfits[id].adv = true;
    return true;
  }
  const routeUnlocked = (s) => !!(s.flags.wei || s.flags.weiSign);
  /* 救了苇：她带路，第一段补给线少用 能核 15、冻筋 2。 */
  function routeNeed(s, i) {
    const seg = D.ROUTE[i];
    if (!seg) return null;
    const need = Object.assign({}, seg.need);
    if (i === 0 && s.flags.wei) {
      need.core -= 15;
      need.frostSinew -= 2;
    }
    return need;
  }
  function repair(s) {
    const seg = D.ROUTE[s.route];
    if (!seg || !routeUnlocked(s) || !s.cleared[seg.layer] || !pay(s, routeNeed(s, s.route))) return false;
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
    { e: "chorusBat", n: 9 },
    { e: "fumeTyrant", n: 1 },
  ];
  function tideSetup(s) {
    const w = TIDE[s.tide.wave], h = hero(s);
    h.arm += Math.floor(s.hearth / 2); // 炉温是防线：炉温每 2 格，守城护甲 +1
    s.dive = { layer: 3, step: 0, o2: 99, o2Max: 99, carry: { core: Math.min(20, s.store.core), mats: {}, items: [], skills: [] }, map: [], team: [h], anchor: false, stam: stamMax(s), stance: s.tactic.stance, mode: s.tactic.mode, breach: s.tactic.breach, tide: true };
    s.dive.enc = { e: w.e, foes: Array.from({ length: w.n }, () => ({ hp: D.ENEMIES[w.e].hp, max: D.ENEMIES[w.e].hp })), boss: true };
  }
  function tideForecast(s) {
    const c = JSON.parse(JSON.stringify(s));
    tideSetup(c);
    return forecast(c);
  }
  function tideWave(s) {
    if (!s.tide || s.won) return null;
    tideSetup(s);
    const fuel = s.dive.carry.core;
    runRounds(s);
    s.store.core -= fuel - s.dive.carry.core; // 御炉装烧的是库房里的能核
    s.fx.tide = s.tide.wave + 1;
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

  /* 设置战术：同时改本次下潜和默认值。 */
  function setTactic(s, k, v) {
    s.tactic[k] = v;
    if (s.dive) s.dive[k] = v;
  }
  G.EmberSim = {
    newGame, mods, heroStats, wear, equip, unequip, salvage, toggleSkill, itemName, rollItem, stamMax,
    startDive, options, moveTo, rescue, act, canDetour, detourCost, canDescend, descend, goHome, homeLoss, returnCost, stepCost,
    weight, capacity, overweight, tooHeavy, dropToCap, forecast, setTactic,
    stoke, build, upgrade, upgradeCost, promote, repair, routeNeed, routeUnlocked, idleRate, idleTick, tideWave, tideForecast, has, TIDE,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

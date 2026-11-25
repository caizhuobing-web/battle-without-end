/* 万丈深渊：模拟层。不依赖 DOM，可在 Node 中直接运行做数值测试。
   所有状态都是可 JSON 序列化的普通对象，存档直接存 state。
   一波的流程：拉 3×3 拨盘（连成线才召来帮手）→ 推一格、吸收升级（继承印记）、选核心、逛铺子 → 开打，全队自动守线。 */
(function (G) {
  const D = G.EmberData, R = D.RULES;
  const GATE_X = 18, SPAWN_X = 190;

  function rnd(s) {
    const a = (s.rs = (s.rs + 0x6d2b79f5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const pick = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];

  function newGame(seed) {
    return { v: 6, rs: seed | 0, embers: 0, meta: { cap: 0, purse: 0, heart: 0, hound: 0, drum: 0 }, best: 0, runs: 0, run: null, last: null };
  }
  function buy(s, k) {
    const M = D.META[k];
    if (s.run || !M || s.meta[k] >= M.max || s.embers < M.cost) return false;
    s.embers -= M.cost;
    s.meta[k]++;
    return true;
  }

  /* ---------- 一局 ---------- */
  const has = (r, c) => r.own.includes(c);
  const capOf = (s) => R.cap + s.meta.cap + (has(s.run, "camp") ? 1 : 0);
  const symbolsOf = (s) => D.SYMBOLS.filter((k) => (k !== "hound" && k !== "drum") || s.meta[k]);
  function startRun(s) {
    if (s.run) throw new Error("run in progress");
    const hearts = R.hearts + s.meta.heart;
    // back：这一波「回手」用过没有；lend：「借力」0 还没吸收过、1 下一次拉半价、2 已用掉
    s.run = { wave: 0, cores: R.startCores + 15 * s.meta.purse, oil: 0, items: {}, shop: [], hearts, heartsMax: hearts, units: [], nextId: 1, board: null, paid: null, jack: false, got: [], spins: 0, total: 0, nudges: R.nudges, back: false, lend: 0, own: [], pick: null, promo: null, phase: "prep", fight: null };
    s.runs++;
    rollShop(s);
    return s.run;
  }
  /* ---------- 灯油与铺子 ---------- */
  const itemLv = (r, k) => r.items[k] || 0;
  /* 摆三件不重样的货；已经买满的不再摆，不够三件就空着。 */
  function rollShop(s) {
    const r = s.run, left = Object.keys(D.ITEMS).filter((k) => itemLv(r, k) < R.itemMax);
    r.shop = [];
    while (r.shop.length < 3) r.shop.push(left.length ? left.splice(Math.floor(rnd(s) * left.length), 1)[0] : null);
  }
  function shopBuy(s, i) {
    const r = s.run, k = r && r.phase === "prep" ? r.shop[i] : null;
    if (!k || r.oil < R.itemCost || itemLv(r, k) >= R.itemMax) return false;
    r.oil -= R.itemCost;
    r.items[k] = itemLv(r, k) + 1;
    r.shop[i] = null;
    return true;
  }
  function shopReroll(s) {
    const r = s.run;
    if (!r || r.phase !== "prep" || r.oil < R.rerollCost) return false;
    r.oil -= R.rerollCost;
    rollShop(s);
    return true;
  }
  function rollSym(s) {
    if (rnd(s) < R.jokerRate * (has(s.run, "wild") ? 3 : 1)) return "joker";
    return pick(s, symbolsOf(s));
  }
  /* 一条线上三格相同（百搭可以顶任何一种）就返回那个兵种；三格全是百搭返回 joker。 */
  function lineSym(board, L) {
    let k = null;
    for (const i of L) {
      const c = board[i];
      if (c === "joker") continue;
      if (k && c !== k) return null;
      k = c;
    }
    return k || "joker";
  }
  function summon(s, k) {
    const r = s.run;
    if (k === "joker") k = pick(s, symbolsOf(s));
    const u = { id: r.nextId++, k, lv: has(r, "drill") && k !== "relic" ? 2 : 1, sub: null, trait: pick(s, Object.keys(D.TRAITS)), imp: [] };
    r.units.push(u);
    r.got.push(u.id);
    return u;
  }
  /* 结算盘面：没付过的中线各召来一个帮手；九格全中再唤醒一个古件卫。 */
  function evaluate(s) {
    const r = s.run;
    let n = 0;
    D.LINES.forEach((L, i) => {
      const k = lineSym(r.board, L);
      if (!k) return void (r.paid[i] = false);
      if (r.paid[i]) return;
      r.paid[i] = true;
      summon(s, k);
      n++;
    });
    if (!r.jack && r.paid.every(Boolean)) {
      r.jack = true;
      summon(s, "relic");
      n++;
    }
    return n;
  }
  function spinCost(s) {
    const c = Math.max(1, R.spinBase + R.spinStep * s.run.spins - (has(s.run, "cheap") ? 3 : 0));
    return s.run.lend === 1 ? Math.ceil(c / 2) : c; // 借力：吸收过之后的下一次半价
  }
  /* 从还没有的核心里抽三张；avoid 里的尽量不再出（重抽时用）。 */
  function drawCores(s, avoid) {
    const r = s.run, all = Object.keys(D.CORES).filter((c) => !has(r, c));
    const fresh = all.filter((c) => !avoid.includes(c)), left = fresh.length >= 3 ? fresh : all;
    const out = [];
    while (out.length < 3 && left.length) out.push(left.splice(Math.floor(rnd(s) * left.length), 1)[0]);
    return out.length ? out : null;
  }
  /* 现在为什么不能拉：返回原因，能拉返回空串。 */
  function spinBlock(s) {
    const r = s.run;
    if (!r || r.phase !== "prep") return "不在备战";
    if (r.pick) return "先选一个核心";
    if (r.promo) return "先选晋升";
    if (r.units.length > capOf(s)) return "队伍超员，先让帮手吸收";
    if (r.spins >= R.spinsPerWave) return "这一波的 " + R.spinsPerWave + " 次已经拉完";
    if (r.cores < spinCost(s)) return "能核不够";
    return "";
  }
  function spin(s) {
    const r = s.run;
    if (spinBlock(s)) return null;
    const cost = spinCost(s);
    r.cores -= cost;
    if (r.lend === 1) r.lend = 2;
    r.board = Array.from({ length: 9 }, () => rollSym(s));
    if (r.total === 0) r.board[3] = r.board[4] = r.board[5] = pick(s, ["bow", "spear"]); // 每局第一次必中中间一行，不让开局空手
    r.paid = D.LINES.map(() => false);
    r.jack = false;
    r.got = [];
    let n = evaluate(s);
    r.chain = 0;
    if (n && has(r, "ledger")) {
      // 连账：中线的格子清掉补新的，再结算一次
      const hitCells = new Set();
      D.LINES.forEach((L, i) => r.paid[i] && L.forEach((c) => hitCells.add(c)));
      for (const c of hitCells) r.board[c] = rollSym(s);
      r.paid = D.LINES.map(() => false);
      r.jack = true; // 补出来的不再算九格全中
      r.chain = evaluate(s);
      n += r.chain;
    }
    let free = false;
    if (!n && has(r, "back") && !r.back) {
      // 回手：这一波第一次没中，能核退回来
      r.back = free = true;
      r.cores += cost;
    }
    r.spins++;
    r.total++;
    if (r.own.length < R.coreMax && r.total >= R.coreFirst && (r.total - R.coreFirst) % R.coreEvery === 0) r.pick = drawCores(s, []);
    return { n, free, board: r.board.slice() };
  }
  /* 推：把一列往下推一格，最上面进来一个新符号。每波免费一次。
     只能推这一波刚拉出来的盘面：开打时盘面清空，没拉过就不能推。 */
  function nudge(s, col) {
    const r = s.run;
    if (!r || r.phase !== "prep" || !r.board || r.nudges <= 0 || r.pick || r.promo || col < 0 || col > 2) return null;
    const before = D.LINES.map((L) => lineSym(r.board, L));
    r.board[col + 6] = r.board[col + 3];
    r.board[col + 3] = r.board[col];
    r.board[col] = rollSym(s);
    r.nudges--;
    D.LINES.forEach((L, i) => {
      if (lineSym(r.board, L) !== before[i]) r.paid[i] = false; // 这条线变了，可以重新算
    });
    r.got = [];
    return { n: evaluate(s) };
  }
  function pickCore(s, i) {
    const r = s.run;
    if (!r || !r.pick || !r.pick[i]) return false;
    r.own.push(r.pick[i]);
    if (r.pick[i] === "push") r.nudges++;
    r.pick = null;
    return true;
  }
  /* 花 1 灯油，把三选一的核心重抽一遍。 */
  function rerollCores(s) {
    const r = s.run;
    if (!r || !r.pick || r.oil < R.rerollCost) return false;
    r.oil -= R.rerollCost;
    r.pick = drawCores(s, r.pick);
    return true;
  }
  /* 印记格：1 格，晋升后 2 格，12 级起 3 格。 */
  const slotsOf = (u) => (u.lv >= R.slot3At ? 3 : u.sub ? 2 : 1);
  /* 吸收：a 吃掉 b，a 的等级加上 b 的等级，b 消失。等级不封顶。到 5 级要选一次晋升。
     同时按 b 的兵种得到一枚印记：已有同种就升一阶（三阶满了改成多升 1 级）；没有就放进空格；
     格子满了要玩家选：opt 给格子下标就换掉那一格，给 "skip" 就不要印记、多升 1 级；
     没给 opt 时什么都不改，返回 { need: "imprint", k, slots }。b 自己身上的印记和特性不继承。
     成功返回 { ok, got, k }，got：up 升阶、new 放进空格、swap 换格、lv 多升 1 级、空串没有印记。 */
  function absorb(s, a, b, opt) {
    const r = s.run;
    if (!r || r.phase !== "prep" || r.promo || a === b) return false;
    const A = r.units.find((u) => u.id === a), B = r.units.find((u) => u.id === b);
    if (!A || !B) return false;
    const k = D.IMPRINTS[B.k] ? B.k : null, old = k && A.imp.find((m) => m.k === k);
    let got = "";
    if (old) got = old.t < 3 ? "up" : "lv";
    else if (k && A.imp.length < slotsOf({ lv: A.lv + B.lv, sub: A.sub })) got = "new";
    else if (k) {
      if (opt === undefined) return { need: "imprint", k, slots: A.imp.map((m) => ({ k: m.k, t: m.t })) };
      if (opt === "skip") got = "lv";
      else if (Number.isInteger(opt) && A.imp[opt]) got = "swap";
      else return false;
    }
    A.lv += B.lv;
    if (got === "up") old.t++;
    else if (got === "new") A.imp.push({ k, t: 1 });
    else if (got === "swap") A.imp[opt] = { k, t: 1 };
    else if (got === "lv") A.lv++;
    r.units = r.units.filter((u) => u.id !== b);
    if (A.lv >= R.promoteAt && !A.sub && D.SUBS[A.k]) r.promo = A.id;
    if (has(r, "lend") && !r.lend) r.lend = 1;
    return { ok: true, got, k };
  }
  function promote(s, i) {
    const r = s.run;
    if (!r || !r.promo) return false;
    const u = r.units.find((x) => x.id === r.promo), opt = D.SUBS[u.k][i];
    if (!opt) return false;
    u.sub = opt.id;
    r.promo = null;
    return true;
  }
  /* 自动吸收到不超员：每次让最弱的被同兵种里最强的吃掉，没有同兵种就给全队最强的。印记要选的时候一律不要、多升 1 级。 */
  function autoAbsorb(s) {
    const r = s.run;
    let n = 0;
    while (r && r.phase === "prep" && !r.promo && r.units.length > capOf(s)) {
      const food = r.units.slice().sort((x, y) => x.lv - y.lv || y.id - x.id)[0];
      const rest = r.units.filter((u) => u !== food);
      const same = rest.filter((u) => u.k === food.k).sort((x, y) => y.lv - x.lv)[0];
      const eater = same || rest.sort((x, y) => y.lv - x.lv)[0];
      const res = absorb(s, eater.id, food.id);
      if (res && res.need) absorb(s, eater.id, food.id, "skip");
      n++;
    }
    return n;
  }
  function fightBlock(s) {
    const r = s.run;
    if (!r || r.phase !== "prep") return "不在备战";
    if (r.pick) return "先选一个核心";
    if (r.promo) return "先选晋升";
    if (r.units.length > capOf(s)) return "队伍超员，先让帮手吸收";
    return "";
  }

  /* ---------- 战斗 ---------- */
  /* 站位：前排靠右，盾手最前；后排靠左。人多了自动站密一点。 */
  function lineup(units) {
    const order = { shield: 0, relic: 1, spear: 2, hound: 3 };
    const front = units.filter((u) => D.UNITS[u.k].line === "front").sort((a, b) => order[a.k] - order[b.k] || b.lv - a.lv);
    const back = units.filter((u) => D.UNITS[u.k].line === "back").sort((a, b) => b.lv - a.lv);
    const fs = Math.min(10, 52 / Math.max(1, front.length)), bs = Math.min(9, 30 / Math.max(1, back.length));
    return front.map((u, i) => ({ u, x: 108 - fs * i })).concat(back.map((u, i) => ({ u, x: 52 - bs * i })));
  }
  /* 某种印记现在的数值，没有就是 0。 */
  function impV(u, k) {
    const m = u.imp.find((x) => x.k === k);
    return m ? D.IMPRINTS[k].v[m.t - 1] : 0;
  }
  /* 把一个帮手变成战斗里的实体：等级、晋升、印记、特性、铺子里买的东西都在这里算进去。sh 是护盾，先于生命挨打。 */
  function body(r, u, x) {
    const U = D.UNITS[u.k], m = 1 + R.lvGrow * (u.lv - 1), tr = u.trait;
    const hp = Math.round(U.hp * m * (u.sub === "wall" ? 1.6 : 1) * (1 + impV(u, "shield")) * (tr === "bone" ? 1.15 : 1) * (1 + 0.1 * itemLv(r, "rug")));
    return {
      side: 0, k: u.k, sub: u.sub, lv: u.lv, uid: u.id, x, home: x, hp, max: hp, trait: tr,
      sh: Math.round(hp * ((tr === "tough" ? 0.2 : 0) + 0.1 * itemLv(r, "door"))),
      atk: U.atk * m * (u.sub === "heavy" ? 2 : 1) * (tr === "edge" ? 1.15 : 1) * (1 + 0.08 * itemLv(r, "whet")),
      cd: (U.cd * (u.sub === "heavy" ? 1.3 : 1)) / (u.sub === "rush" ? 1.5 : 1) / (tr === "quick" ? 1.1 : 1) / (1 + impV(u, "hound")) / (1 + 0.06 * itemLv(r, "boots")),
      heal: (U.heal || 0) * m * (u.sub === "medic" ? 2 : 1), splash: (U.splash || 0) * (u.sub === "blast" ? 2 : 1), t: 0.3, n: 0,
      pierce: impV(u, "spear"), again: impV(u, "bow"), ember: impV(u, "fire"), regen: impV(u, "drum"), rt: 6,
    };
  }
  function beginWave(s) {
    const r = s.run;
    if (fightBlock(s)) return false;
    const W = D.WAVES[r.wave], scale = 1 + R.waveGrow * r.wave + R.lateGrow * Math.max(0, r.wave - 4), ents = [];
    for (const { u, x } of lineup(r.units)) {
      ents.push(body(r, u, x));
      if (u.sub === "pack") ents.push(Object.assign(body(r, u, x - 5), { uid: 0 }));
    }
    const queue = [];
    let at = 0.5;
    for (const [e, n] of W.foes) for (let i = 0; i < n; i++) {
      queue.push({ at, e });
      at += D.ENEMIES[e].boss ? 0 : D.ENEMIES[e].big ? 1.4 : 0.24;
    }
    queue.sort((a, b) => a.at - b.at);
    r.fight = { t: 0, ents, queue, scale, kind: W.kind || "", ev: [], gotCores: 0, kills: 0, leaks: 0, salve: false };
    r.phase = "fight";
    r.board = null;
    r.got = [];
    return true;
  }
  const alive = (f, side) => f.ents.filter((e) => e.side === side && e.hp > 0);
  /* by：出手的帮手（敌人打人时不传）。护盾先挨打；带「拾荒」的帮手打死的敌人记一笔。 */
  function hit(f, e, dmg, big, by) {
    if (!e || e.hp <= 0) return;
    const block = Math.min(e.sh || 0, dmg);
    if (block) e.sh -= block;
    e.hp -= dmg - block;
    if (by && by.trait === "scav" && e.hp <= 0) e.scav = 1;
    f.ev.push({ k: "hit", x: e.x, side: e.side, v: Math.max(1, Math.round(dmg)), big: !!big, id: f.ents.indexOf(e) });
  }

  /* 点着：烧 3 秒，每秒掉 dps；已经在烧就取大的那个。 */
  function ignite(e, dps) {
    if (!e || e.hp <= 0) return;
    e.burnD = e.burn > 0 ? Math.max(e.burnD, dps) : dps;
    e.burn = 3;
  }

  function step(s, dt) {
    const r = s.run;
    if (!r || r.phase !== "fight") return;
    const f = r.fight;
    f.t += dt;
    while (f.queue.length && f.queue[0].at <= f.t) {
      const q = f.queue.shift(), E = D.ENEMIES[q.e], hp = Math.round(E.hp * f.scale);
      f.ents.push({ side: 1, k: q.e, x: SPAWN_X, hp, max: hp, atk: E.atk * f.scale, t: E.cd * 0.5, burn: 0, burnD: 0 });
    }
    const foes = alive(f, 1), mine = alive(f, 0);
    const haste = mine.some((a) => a.sub === "war") ? 1.25 : 1;
    const rage = f.t > 75 ? 2 : 1; // 拖太久敌人会发狂，避免僵局

    // 帮手
    for (const a of mine) {
      const U = D.UNITS[a.k];
      a.t -= dt * haste;
      if (a.regen) {
        // 自愈印记：每 6 秒回自己一口
        a.rt -= dt;
        if (a.rt <= 0) {
          a.rt += 6;
          a.hp = Math.min(a.max, a.hp + a.max * a.regen);
        }
      }
      if (a.k === "drum") {
        if (a.t <= 0) {
          a.t = a.cd;
          if (a.sub !== "war") for (const m of mine) m.hp = Math.min(m.max, m.hp + a.heal);
          f.ev.push({ k: "heal", x: a.x });
        }
        continue;
      }
      const tg = foes.reduce((b, e) => (!b || Math.abs(e.x - a.x) < Math.abs(b.x - a.x) ? e : b), null);
      if (!tg) {
        a.x += Math.sign(a.home - a.x) * Math.min(Math.abs(a.home - a.x), 30 * dt);
        continue;
      }
      const dist = Math.abs(tg.x - a.x);
      if (dist <= U.range) {
        if (a.t > 0) continue;
        a.t = a.cd;
        a.n++;
        const crit = a.sub === "alpha" && a.n % 3 === 0;
        const dmg = a.atk * (crit ? 3 : 1) * (a.trait === "first" && a.n === 1 ? 2 : 1) * (a.trait === "gate" && r.hearts <= 2 ? 1.25 : 1);
        // 这一下打到 e 身上，k 是伤害比例；「收割」对半血以下的敌人多打两成
        const to = (e, k, big) => e && hit(f, e, dmg * k * (a.trait === "reap" && e.hp < e.max / 2 ? 1.2 : 1), big, a);
        to(tg, 1, crit);
        if (a.sub === "twin") to(tg, 1);
        if (a.again && rnd(s) < a.again) to(tg, 1); // 追射印记
        if (a.sub === "oil" || a.ember) ignite(tg, a.atk * ((a.sub === "oil" ? 0.5 : 0) + a.ember));
        if (a.splash) for (const e of foes) if (e !== tg && Math.abs(e.x - tg.x) <= a.splash) {
          to(e, 0.6);
          if (a.sub === "oil") ignite(e, a.atk * 0.5);
        }
        const near = (d, not) => foes.filter((e) => e !== tg && e !== not && e.hp > 0 && Math.abs(e.x - tg.x) <= d).sort((p, q) => Math.abs(p.x - tg.x) - Math.abs(q.x - tg.x))[0];
        const second = a.sub === "pike" ? near(16) : null;
        to(second, 1);
        if (a.pierce) to(near(20, second), a.pierce); // 透甲印记：再往后捅一个
        if (U.range > 30) f.ev.push({ k: a.k === "fire" ? "lob" : "bolt", x0: a.x, x: tg.x });
        else f.ev.push({ k: "jab", x: a.x });
      } else if (U.line === "front" && tg.x > a.x && tg.x < 175) a.x = Math.min(tg.x - U.range + 1, 150, a.x + (U.spd || 30) * dt); // 前排一起压上去，不排队等
    }
    // 敌人
    for (const e of foes) {
      const E = D.ENEMIES[e.k];
      if (e.burn > 0) {
        e.burn -= dt;
        e.hp -= e.burnD * dt;
      }
      e.t -= dt;
      // 走地的打最前面的人；会飞的越过前排，直扑最后面的人
      const ahead = mine.filter((m) => m.hp > 0 && m.x <= e.x + 4);
      const tg = E.fly ? ahead.reduce((b, m) => (!b || m.x < b.x ? m : b), null) : ahead.reduce((b, m) => (!b || m.x > b.x ? m : b), null);
      if (!tg) {
        e.x -= E.spd * rage * dt;
        if (e.x <= GATE_X) {
          e.hp = 0;
          e.leaked = true;
          f.leaks++;
          f.ev.push({ k: "leak", x: e.x });
        }
        continue;
      }
      const dist = e.x - tg.x;
      if (dist > E.range) {
        e.x -= E.spd * dt;
        if (E.lunge && !e.lunged && dist < 48) {
          e.lunged = true;
          e.x = Math.max(tg.x + E.range, e.x - 26);
        }
      } else if (e.t <= 0) {
        e.t = E.cd;
        const dmg = e.atk * rage;
        hit(f, tg, dmg);
        if (tg.sub === "thorn") hit(f, e, dmg * 0.5);
      }
    }
    // 药包：每场一次，第一个掉到三成血以下还站着的队友立刻回一口
    if (!f.salve && itemLv(r, "salve")) {
      const low = mine.find((m) => m.hp > 0 && m.hp < m.max * 0.3);
      if (low) {
        f.salve = true;
        low.hp = Math.min(low.max, low.hp + low.max * (0.2 + 0.1 * itemLv(r, "salve")));
        f.ev.push({ k: "heal", x: low.x });
      }
    }
    for (const e of f.ents) {
      if (e.hp > 0 || e.dead) continue;
      e.dead = true;
      if (e.leaked) continue;
      const DE = e.side === 1 ? D.ENEMIES[e.k] : null;
      f.ev.push({ k: "die", x: e.x, side: e.side, big: DE && DE.big ? 1 : 0, boss: DE && DE.boss ? 1 : 0 });
      if (e.side === 1) {
        f.kills++;
        f.gotCores += (D.ENEMIES[e.k].core + (e.scav ? 1 : 0)) * (has(r, "bounty") ? 1.5 : 1);
      }
    }
    // 漏过去的：审判波和首领波漏一个就输；平常的波漏一个扣一条命
    if (f.leaks > 0) {
      if (f.kind) return endRun(s, "lost");
      r.hearts -= f.leaks;
      f.leaks = 0;
      if (r.hearts <= 0) return endRun(s, "lost");
    }
    if (!f.queue.length && !alive(f, 1).length) {
      const got = Math.round(f.gotCores) + R.waveBonus + 2 * r.wave;
      const oil = R.oilWave + (f.kind ? R.oilBig : 0);
      r.cores += got;
      r.oil += oil;
      r.lastWave = { got, oil, kills: f.kills, time: Math.round(f.t * 10) / 10 };
      if (has(r, "mend")) r.hearts = Math.min(r.heartsMax, r.hearts + 1);
      r.fight = null;
      r.wave++;
      r.spins = 0;
      r.nudges = R.nudges + (has(r, "push") ? 1 : 0);
      r.back = false;
      r.lend = 0;
      if (r.wave >= D.WAVES.length) return endRun(s, "won");
      r.phase = "prep";
      rollShop(s); // 每波开头铺子换一排货
    }
  }

  /* 一局结束：不管输赢都得到余烬，守住的波数越多越多。 */
  function endRun(s, how) {
    const r = s.run, gain = r.wave * 3 + (how === "won" ? 25 : 0);
    s.embers += gain;
    s.best = Math.max(s.best, r.wave);
    s.last = { how, wave: r.wave, gain, units: r.units.map((u) => ({ k: u.k, lv: u.lv, sub: u.sub })), own: r.own.slice() };
    s.run = null;
    return how;
  }
  function giveUp(s) {
    if (!s.run) return false;
    endRun(s, "quit");
    return true;
  }
  const subOf = (u) => (u.sub ? D.SUBS[u.k].find((x) => x.id === u.sub) : null);
  const nameOf = (u) => (subOf(u) ? subOf(u).name : D.UNITS[u.k].name);

  G.EmberSim = { newGame, buy, startRun, capOf, symbolsOf, lineSym, spin, spinCost, spinBlock, nudge, pickCore, rerollCores, absorb, slotsOf, promote, shopBuy, shopReroll, autoAbsorb, fightBlock, beginWave, lineup, step, giveUp, nameOf, subOf, GATE_X };
})(typeof globalThis !== "undefined" ? globalThis : window);

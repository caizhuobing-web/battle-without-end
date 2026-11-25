/* 万丈深渊：无界面回归与节奏测试（v6：3×3 拨盘连线、吸收与印记、特性、灯油铺子、核心、命数、审判波）。
   node tests/ember-sim.js           快速门禁
   node tests/ember-sim.js --report  打印统计 */
const path = require("path");
const assert = require("assert");
require(path.join(__dirname, "../ember/data.js"));
require(path.join(__dirname, "../ember/sim.js"));
const D = globalThis.EmberData, S = globalThis.EmberSim;
const report = process.argv.includes("--report");
const DT = 1 / 30;
const clone = (x) => JSON.parse(JSON.stringify(x));
const stat = { spins: 0, hit: 0, nudgeHit: 0, nudges: 0, bought: 0 };
const U = (id, k, lv, more) => Object.assign({ id, k, lv, sub: null, trait: null, imp: [] }, more);

/* 一个普通玩家：有灯油就买铺子里第一件买得起的，能核够就拉（留一点），会用免费的那次推，超员就自动吸收，核心和晋升都选第一个。 */
function prep(s, greedy) {
  const r = s.run;
  let guard = 0;
  for (let i = 0; i < 3; i++) if (S.shopBuy(s, i)) stat.bought++;
  while (guard++ < 40) {
    if (r.pick) {
      S.pickCore(s, 0);
      continue;
    }
    if (r.promo) {
      S.promote(s, 0);
      continue;
    }
    if (r.units.length > S.capOf(s)) {
      S.autoAbsorb(s);
      continue;
    }
    if (r.board && r.nudges > 0) {
      // 试三列，哪一列能推出线就推哪一列
      let best = -1;
      for (let c = 0; c < 3 && best < 0; c++) {
        const t = clone(s);
        t.rs = (t.rs ^ 0x5bd1e995) | 0; // 新进来的符号玩家看不到，预演时换一个随机数，不让自动玩家作弊
        const res = S.nudge(t, c);
        if (res && res.n > 0) best = c;
      }
      if (best >= 0) {
        stat.nudges++;
        if (S.nudge(s, best).n > 0) stat.nudgeHit++; // 新符号是随机的，实际推的时候不一定还中
        continue;
      }
    }
    if (S.spinBlock(s) || r.cores < S.spinCost(s) + (greedy ? 0 : 8)) break;
    const res = S.spin(s);
    stat.spins++;
    if (res.n > 0) stat.hit++;
  }
  if (r.pick) S.pickCore(s, 0);
  if (r.promo) S.promote(s, 0);
  S.autoAbsorb(s);
  if (r.promo) S.promote(s, 0);
}
function playRun(s, greedy) {
  S.startRun(s);
  const times = [];
  let guard = 0;
  while (s.run && guard++ < 40) {
    prep(s, greedy);
    assert.strictEqual(S.fightBlock(s), "", "must be able to fight after prep");
    assert(S.beginWave(s));
    let n = 0;
    while (s.run && s.run.phase === "fight" && n++ < 30 * 200) {
      S.step(s, DT);
      if (s.run && s.run.fight) s.run.fight.ev.length = 0;
    }
    assert(!s.run || s.run.phase !== "fight", "a wave must end within 200 seconds");
    times.push(n / 30);
    assert.deepStrictEqual(clone(s), s, "state must survive JSON round-trip");
  }
  return { last: s.last, times };
}

/* 1. 确定性 */
{
  const a = S.newGame(7), b = S.newGame(7);
  playRun(a);
  playRun(b);
  assert.deepStrictEqual(a, b, "same seed, same run");
}

/* 2. 连线规则 */
{
  const B = (str) => str.split("").map((c) => ({ s: "shield", p: "spear", b: "bow", f: "fire", j: "joker" })[c]);
  assert.strictEqual(S.lineSym(B("sssbbfpfb"), [0, 1, 2]), "shield");
  assert.strictEqual(S.lineSym(B("sjsbbfpfb"), [0, 1, 2]), "shield", "joker is wild");
  assert.strictEqual(S.lineSym(B("sbsbbfpfb"), [0, 1, 2]), null);
  assert.strictEqual(S.lineSym(B("jjjbbfpfb"), [0, 1, 2]), "joker");
  const s = S.newGame(3);
  S.startRun(s);
  assert.strictEqual(S.nudge(s, 0), null, "no nudge before the first spin of a wave");
  const res = S.spin(s);
  assert(res.n >= 1 && s.run.units.length >= 1, "the first spin of a run always hits");
  assert.strictEqual(s.run.cores, D.RULES.startCores - D.RULES.spinBase);
  assert.strictEqual(S.spinCost(s), D.RULES.spinBase + D.RULES.spinStep, "each extra spin in a wave costs more");
  // 九格全中：八条线各来一个，再加一个古件卫
  s.run.board = B("bbbbbbbbb");
  s.run.paid = D.LINES.map(() => false);
  s.run.jack = false;
  s.run.units = [];
  s.run.nudges = 1;
  s.run.board[0] = "spear";
  S.nudge(s, 0); // 推第一列：最上面换新的，不一定全中，这里只验证不出错
  assert(s.run.nudges === 0 && S.nudge(s, 1) === null, "one free nudge per wave");
  // 没拉过就不能推：打完一波盘面清空，推的次数回来了也推不了，拉一次之后才行
  s.run.units = [U(1, "shield", 30), U(2, "bow", 30)];
  assert(S.beginWave(s));
  for (let n = 0; s.run && s.run.phase === "fight" && n < 30 * 100; n++) S.step(s, DT);
  assert(s.run && s.run.phase === "prep" && s.run.board === null && s.run.nudges === 1);
  assert.strictEqual(S.nudge(s, 0), null, "the board is cleared every wave; nothing to nudge until you spin");
  s.run.cores = 999;
  S.spin(s);
  assert(S.nudge(s, 0) !== null, "after a spin the nudge works again");
}

/* 3. 吸收、晋升、超员 */
{
  const s = S.newGame(5);
  S.startRun(s);
  s.run.units = [U(1, "bow", 3), U(2, "bow", 2), U(3, "shield", 1)];
  s.run.nextId = 4;
  assert(S.absorb(s, 1, 2));
  assert(s.run.units.length === 2 && s.run.units[0].lv === 5, "levels add up");
  assert.strictEqual(s.run.promo, 1, "level 5 asks for a promotion");
  assert(S.spinBlock(s) !== "" && S.fightBlock(s) !== "", "must choose the promotion first");
  assert(S.promote(s, 1) && s.run.units[0].sub === "twin");
  assert(S.absorb(s, 1, 3) && s.run.units[0].lv === 6, "any class can be absorbed, no level cap");
  for (let i = 0; i < 7; i++) s.run.units.push(U(10 + i, "spear", 1));
  assert(S.spinBlock(s).includes("超员"));
  S.autoAbsorb(s);
  if (s.run.promo) S.promote(s, 0);
  S.autoAbsorb(s);
  assert(s.run.units.length <= S.capOf(s), "auto-absorb brings the army under the cap");
}

/* 3b. 印记：吸收时按被吃掉的兵种给一枚 */
{
  const s = S.newGame(21);
  S.startRun(s);
  const imps = (u) => u.imp.map((m) => m.k + m.t).join();
  const set = (units) => {
    s.run.units = units;
    s.run.promo = null;
    return units[0];
  };
  // 放进空格；被吃的那个自己身上的印记和特性不继承
  let a = set([U(1, "bow", 1), U(2, "spear", 1, { imp: [{ k: "fire", t: 3 }], trait: "edge" })]);
  assert.deepStrictEqual(S.absorb(s, 1, 2), { ok: true, got: "new", k: "spear" });
  assert(imps(a) === "spear1" && a.lv === 2 && a.trait === null, "empty slot takes the imprint; food's own imprints and trait are lost");
  assert.strictEqual(S.slotsOf(a), 1);
  // 同种升阶：I → II → III，再吃就多升 1 级
  s.run.units.push(U(3, "spear", 1), U(4, "spear", 1), U(5, "spear", 1));
  S.absorb(s, 1, 3);
  assert(imps(a) === "spear2" && a.lv === 3);
  S.absorb(s, 1, 4);
  assert(imps(a) === "spear3" && a.lv === 4);
  s.run.promo = null;
  assert.strictEqual(S.absorb(s, 1, 5).got, "lv");
  assert(imps(a) === "spear3" && a.lv === 6, "at tier III the imprint turns into one extra level");
  // 格子满了：不给 opt 什么都不改，返回 need
  a = set([U(1, "bow", 2, { imp: [{ k: "spear", t: 2 }] }), U(2, "shield", 1), U(3, "fire", 1), U(4, "drum", 1), U(5, "relic", 1)]);
  const before = clone(s);
  assert.deepStrictEqual(S.absorb(s, 1, 2), { need: "imprint", k: "shield", slots: [{ k: "spear", t: 2 }] });
  assert.deepStrictEqual(clone(s), before, "asking for a choice changes nothing");
  assert.strictEqual(S.absorb(s, 1, 2, 5), false, "a slot that does not exist is refused");
  assert.deepStrictEqual(clone(s), before);
  // skip：不要印记，多升 1 级
  assert.strictEqual(S.absorb(s, 1, 2, "skip").got, "lv");
  assert(imps(a) === "spear2" && a.lv === 4 && s.run.units.length === 4, "skip: no imprint, one extra level");
  // 替换某一格
  assert.strictEqual(S.absorb(s, 1, 3, 0).got, "swap");
  assert(imps(a) === "fire1" && a.lv === 5, "replace: the chosen slot now holds the new imprint at tier I");
  // 晋升后 2 格，12 级起 3 格
  assert.strictEqual(s.run.promo, 1);
  S.promote(s, 0);
  assert.strictEqual(S.slotsOf(a), 2);
  assert.strictEqual(S.absorb(s, 1, 4).got, "new");
  assert(imps(a) === "fire1,drum1");
  // 古件卫没有印记
  assert.strictEqual(S.absorb(s, 1, 5).got, "");
  assert(imps(a) === "fire1,drum1" && a.lv === 7);
  s.run.units.push(U(6, "hound", 5), U(7, "hound", 1));
  assert.strictEqual(S.absorb(s, 1, 6).got, "new", "the absorb that reaches level 12 opens the third slot");
  assert(a.lv === 12 && S.slotsOf(a) === 3 && imps(a) === "fire1,drum1,hound1");
  assert.strictEqual(S.absorb(s, 1, 7).got, "up");
  // 自动吸收遇到要选的一律 skip
  const big = set([U(1, "bow", 3, { imp: [{ k: "fire", t: 1 }] }), U(2, "relic", 1), U(3, "spear", 1), U(4, "hound", 1), U(5, "drum", 1), U(6, "shield", 1)]);
  assert.strictEqual(S.autoAbsorb(s), 1);
  assert(s.run.units.length === S.capOf(s) && imps(big) === "fire1" && big.lv === 5, "auto-absorb skips the imprint choice and takes the extra level");
  // 印记真的进了战斗：厚甲加生命，急性出手快
  set([U(1, "spear", 1, { imp: [{ k: "shield", t: 2 }, { k: "hound", t: 1 }] }), U(2, "spear", 1)]);
  S.beginWave(s);
  const [x, y] = s.run.fight.ents;
  assert(x.max === Math.round(y.max * 1.4) && Math.abs(x.cd - y.cd / 1.12) < 1e-9 && x.pierce === 0 && y.sh === 0);
}

/* 3c. 特性：召来时随机一条，同种子下相同 */
{
  const roll = (seed) => {
    const s = S.newGame(seed);
    S.startRun(s);
    s.run.cores = 9999;
    for (let i = 0; i < 5; i++) {
      s.run.spins = 0;
      S.spin(s);
      if (s.run.pick) S.pickCore(s, 0);
    }
    return s.run.units;
  };
  const a = roll(31), b = roll(31);
  assert(a.length >= 1 && a.every((u) => u.trait in D.TRAITS && Array.isArray(u.imp) && u.imp.length === 0), "every summoned unit has a trait and empty imprint slots");
  assert.deepStrictEqual(a, b, "same seed, same traits");
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) roll(seed).forEach((u) => seen.add(u.trait));
  assert.strictEqual(seen.size, Object.keys(D.TRAITS).length, "all traits can show up");
  // 特性进战斗：硬骨加生命，结实带护盾，利刃加攻击
  const s = S.newGame(33);
  S.startRun(s);
  s.run.units = [U(1, "spear", 1), U(2, "spear", 1, { trait: "bone" }), U(3, "spear", 1, { trait: "tough" }), U(4, "spear", 1, { trait: "edge" })];
  S.beginWave(s);
  const e = s.run.fight.ents;
  assert(e[1].max === Math.round(e[0].max * 1.15) && e[2].sh === Math.round(e[0].max * 0.2) && Math.abs(e[3].atk - e[0].atk * 1.15) < 1e-9);
}

/* 3d. 灯油与铺子 */
{
  const s = S.newGame(41);
  S.startRun(s);
  const r = s.run;
  assert(r.oil === 0 && r.shop.length === 3 && new Set(r.shop).size === 3 && r.shop.every((k) => k in D.ITEMS), "three different goods on the shelf");
  assert(!S.shopBuy(s, 0) && !S.shopReroll(s), "no oil, no deal");
  r.oil = 5;
  const k = r.shop[1];
  assert(S.shopBuy(s, 1) && r.oil === 3 && r.items[k] === 1 && r.shop[1] === null, "buying costs 2 oil and empties the slot");
  assert(!S.shopBuy(s, 1), "an empty slot sells nothing");
  assert(S.shopReroll(s) && r.oil === 2 && r.shop.every((x) => x in D.ITEMS), "reroll costs 1 oil and refills the shelf");
  r.items = { whet: 5, door: 5, salve: 5 };
  r.oil = 9;
  S.shopReroll(s);
  assert.deepStrictEqual(r.shop.filter(Boolean).sort(), ["boots", "rug"], "maxed goods are not offered again");
  // 买的东西进战斗
  r.items = { whet: 2, rug: 1, door: 1, boots: 1 };
  r.units = [U(1, "shield", 20), U(2, "bow", 20)];
  const shelf = r.shop.slice();
  S.beginWave(s);
  const a = r.fight.ents[0], base = Math.round(110 * (1 + D.RULES.lvGrow * 19) * 1.1);
  assert(a.max === base && a.sh === Math.round(base * 0.1) && Math.abs(a.atk - 3 * (1 + D.RULES.lvGrow * 19) * 1.16) < 1e-9 && Math.abs(a.cd - 1.1 / 1.06) < 1e-9);
  for (let n = 0; s.run && s.run.phase === "fight" && n < 30 * 100; n++) S.step(s, DT);
  assert(s.run.wave === 1 && s.run.oil === 8 + D.RULES.oilWave && s.run.lastWave.oil === 1, "a normal wave pays 1 oil");
  assert(s.run.shop.length === 3 && JSON.stringify(s.run.shop) !== JSON.stringify(shelf) || s.run.shop.filter(Boolean).length === 2, "the shelf is restocked every wave");
  s.run.wave = 4;
  s.run.oil = 0;
  S.beginWave(s);
  for (let n = 0; s.run && s.run.phase === "fight" && n < 30 * 100; n++) S.step(s, DT);
  assert(s.run.wave === 5 && s.run.oil === D.RULES.oilWave + D.RULES.oilBig, "a judgement wave pays 3 more");
  // 药包：每场一次
  s.run.items = { salve: 1 };
  s.run.units = [U(1, "shield", 1)];
  s.run.wave = 2;
  S.beginWave(s);
  let healed = 0;
  for (let n = 0; s.run && s.run.phase === "fight" && n < 30 * 100; n++) {
    const f = s.run.fight, was = f.salve;
    S.step(s, DT);
    if (s.run && s.run.fight && !was && s.run.fight.salve) healed++;
  }
  assert.strictEqual(healed, 1, "the salve fires once per fight");
}

/* 4. 核心：第 5 次拉杆给第一个，之后每 10 次一个；可以花灯油重抽 */
{
  const s = S.newGame(9);
  S.startRun(s);
  s.run.cores = 99999;
  const at = [];
  for (let i = 1; i <= 26; i++) {
    s.run.spins = 0;
    S.autoAbsorb(s);
    if (s.run.promo) S.promote(s, 0);
    S.autoAbsorb(s);
    S.spin(s);
    if (s.run.pick) {
      assert(s.run.pick.length === 3 && new Set(s.run.pick).size === 3);
      assert(S.spinBlock(s) !== "");
      if (i === 5) {
        assert(!S.rerollCores(s), "rerolling needs oil");
        s.run.oil = 1;
        const old = s.run.pick.slice();
        assert(S.rerollCores(s) && s.run.oil === 0 && s.run.pick.length === 3);
        assert(s.run.pick.every((c) => !old.includes(c)), "a reroll shows three other cores while enough are left");
      }
      S.pickCore(s, 1);
      at.push(i);
    }
  }
  assert.deepStrictEqual(at, [5, 15, 25], "a core after the 5th, 15th and 25th spin");
  assert.strictEqual(s.run.own.length, 3);
  assert(!("war" in D.CORES) && !("wall" in D.CORES) && !("swift" in D.CORES) && "back" in D.CORES && "lend" in D.CORES);
  // 最多 8 个
  s.run.own = Object.keys(D.CORES).slice(0, D.RULES.coreMax);
  s.run.total = 34;
  s.run.spins = 0;
  S.autoAbsorb(s);
  if (s.run.promo) S.promote(s, 0);
  S.autoAbsorb(s);
  assert(S.spin(s));
  assert(s.run.total === 35 && s.run.pick === null, "no more than 8 cores");
}

/* 4b. 回手与借力 */
{
  const s = S.newGame(51);
  S.startRun(s);
  const r = s.run;
  r.own = ["back", "lend"];
  r.total = 1; // 不走「第一次必中」
  r.cores = 1000;
  let free = 0, paid = 0, guard = 0;
  while (free + paid < 2 && guard++ < 200) {
    r.spins = 0;
    r.units = [];
    const before = r.cores, res = S.spin(s);
    if (r.pick) S.pickCore(s, 0);
    if (res.n) continue;
    if (res.free) {
      free++;
      assert.strictEqual(r.cores, before, "the first miss of a wave is free");
    } else {
      paid++;
      assert.strictEqual(r.cores, before - D.RULES.spinBase, "the second miss is paid for");
    }
  }
  assert(free === 1 && paid === 1);
  r.units = [U(1, "bow", 1), U(2, "bow", 1), U(3, "bow", 1)];
  r.spins = 0;
  r.pick = r.promo = null;
  assert.strictEqual(S.spinCost(s), D.RULES.spinBase);
  S.absorb(s, 1, 2);
  assert.strictEqual(S.spinCost(s), D.RULES.spinBase / 2, "after the first absorb of a wave the next spin is half price");
  S.spin(s);
  if (r.pick) S.pickCore(s, 0);
  r.spins = 0;
  S.absorb(s, 1, 3);
  assert.strictEqual(S.spinCost(s), D.RULES.spinBase, "only once per wave");
}

/* 5. 命数与审判波 */
{
  const s = S.newGame(11);
  S.startRun(s);
  S.beginWave(s); // 一个帮手都没有
  let n = 0;
  while (s.run && s.run.phase === "fight" && n++ < 30 * 100) S.step(s, DT);
  assert(s.run && s.run.hearts === D.RULES.hearts - 4 && s.run.wave === 1, "each leak on a normal wave costs a heart");
  s.run.wave = 4;
  S.beginWave(s);
  n = 0;
  while (s.run && n++ < 30 * 100) S.step(s, DT);
  assert(s.last.how === "lost" && s.embers === 4 * 3, "a single leak on a judgement wave ends the run; embers are paid anyway");
}

/* 6. 永久升级 */
{
  const s = S.newGame(13);
  s.embers = 100;
  assert(S.buy(s, "cap") && S.buy(s, "hound") && !S.buy(s, "hound"));
  S.startRun(s);
  assert(S.capOf(s) === D.RULES.cap + 1 && S.symbolsOf(s).includes("hound") && !S.symbolsOf(s).includes("drum"));
}

/* 7. 整体节奏 */
{
  const N = report ? 80 : 24;
  const first = [], clearedAt = [], times = [], lens = [];
  for (let i = 1; i <= N; i++) {
    const s = S.newGame(1000 + i);
    let cleared = 0;
    for (let run = 1; run <= 30 && !cleared; run++) {
      const res = playRun(s);
      if (run === 1) first.push(res.last.wave);
      times.push(...res.times);
      lens.push(res.times.reduce((a, b) => a + b, 0));
      if (res.last.how === "won") cleared = run;
      for (const k of ["cap", "purse", "hound", "cap", "heart", "drum", "purse", "cap"]) S.buy(s, k);
    }
    clearedAt.push(cleared || 99);
  }
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const hitRate = stat.hit / stat.spins;
  if (report) {
    console.log("每次拉拨盘至少中一条线的比例", (hitRate * 100).toFixed(0) + "%", "；推一格", stat.nudges, "次，推出线", stat.nudgeHit, "次");
    console.log("第一局守到第几波 中位", med(first), "最好", Math.max(...first), "最差", Math.min(...first));
    console.log("第几局第一次守住十波 中位", med(clearedAt), "分布", clearedAt.slice().sort((a, b) => a - b).join(","));
    console.log("一波战斗平均", avg(times).toFixed(1), "秒，最长", Math.max(...times).toFixed(0), "；一局战斗合计平均", (avg(lens) / 60).toFixed(1), "分钟");
  }
  assert(hitRate >= 0.3 && hitRate <= 0.65, "a spin should hit roughly a third to two thirds of the time, got " + hitRate.toFixed(2));
  assert(med(first) >= 3 && med(first) <= 8, "first run should reach mid-run, got " + med(first));
  assert(med(clearedAt) >= 3 && med(clearedAt) <= 15, "first clear should take several runs, got " + med(clearedAt));
  assert(avg(times) >= 6 && avg(times) <= 22, "average wave length, got " + avg(times).toFixed(1));
}

console.log("ember-sim: ok");

/* 万丈深渊：无界面回归与节奏测试（v5：3×3 拨盘连线、吸收、核心、命数、审判波）。
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
const stat = { spins: 0, hit: 0, nudgeHit: 0, nudges: 0 };

/* 一个普通玩家：能核够就拉（留一点），会用免费的那次推，超员就自动吸收，核心和晋升都选第一个。 */
function prep(s, greedy) {
  const r = s.run;
  let guard = 0;
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
}

/* 3. 吸收、晋升、超员 */
{
  const s = S.newGame(5);
  S.startRun(s);
  s.run.units = [{ id: 1, k: "bow", lv: 3, sub: null }, { id: 2, k: "bow", lv: 2, sub: null }, { id: 3, k: "shield", lv: 1, sub: null }];
  s.run.nextId = 4;
  assert(S.absorb(s, 1, 2));
  assert(s.run.units.length === 2 && s.run.units[0].lv === 5, "levels add up");
  assert.strictEqual(s.run.promo, 1, "level 5 asks for a promotion");
  assert(S.spinBlock(s) !== "" && S.fightBlock(s) !== "", "must choose the promotion first");
  assert(S.promote(s, 1) && s.run.units[0].sub === "twin");
  assert(S.absorb(s, 1, 3) && s.run.units[0].lv === 6, "any class can be absorbed, no level cap");
  for (let i = 0; i < 7; i++) s.run.units.push({ id: 10 + i, k: "spear", lv: 1, sub: null });
  assert(S.spinBlock(s).includes("超员"));
  S.autoAbsorb(s);
  if (s.run.promo) S.promote(s, 0);
  S.autoAbsorb(s);
  assert(s.run.units.length <= S.capOf(s), "auto-absorb brings the army under the cap");
}

/* 4. 核心：每拉满 5 次三选一 */
{
  const s = S.newGame(9);
  S.startRun(s);
  s.run.cores = 9999;
  let picked = 0;
  for (let i = 0; i < 12; i++) {
    s.run.spins = 0;
    S.autoAbsorb(s);
    if (s.run.promo) S.promote(s, 0);
    S.autoAbsorb(s);
    S.spin(s);
    if (s.run.pick) {
      assert(s.run.pick.length === 3 && new Set(s.run.pick).size === 3);
      assert(S.spinBlock(s) !== "");
      S.pickCore(s, 1);
      picked++;
    }
  }
  assert.strictEqual(picked, 2, "a core after the 5th and 10th spin");
  assert.strictEqual(s.run.own.length, 2);
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

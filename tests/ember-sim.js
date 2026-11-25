/* 万丈深渊：无界面回归与节奏测试（v4 切片：拨盘、合并、实时波次）。
   node tests/ember-sim.js           快速门禁
   node tests/ember-sim.js --report  打印各种玩法的统计 */
const path = require("path");
const assert = require("assert");
require(path.join(__dirname, "../ember/data.js"));
require(path.join(__dirname, "../ember/sim.js"));
const D = globalThis.EmberData, S = globalThis.EmberSim;
const report = process.argv.includes("--report");
const DT = 1 / 30;

/* 打一局。extra：每波在免费那一次之外再加拉几次（能核够的话）。返回这一局的结果和每波用时。 */
function playRun(s, extra) {
  S.startRun(s);
  const times = [];
  let guard = 0;
  while (s.run && guard++ < 400) {
    const r = s.run;
    S.spin(s);
    for (let i = 0; i < extra; i++) if (r.cores >= S.spinCost(s) + 6) S.spin(s);
    assert(S.beginWave(s), "wave must start after a spin");
    let n = 0;
    while (s.run && s.run.phase === "fight" && n++ < 30 * 180) {
      S.step(s, DT);
      if (s.run && s.run.fight) {
        assert(Number.isFinite(s.run.fight.ents[0].hp), "hp finite");
        s.run.fight.ev.length = 0;
      }
    }
    assert(!s.run || s.run.phase !== "fight", "a wave must end within 3 minutes");
    times.push(n / 30);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s, "state must survive JSON round-trip");
  }
  return { last: s.last, times };
}

/* 1. 确定性 */
{
  const a = S.newGame(7), b = S.newGame(7);
  playRun(a, 1);
  playRun(b, 1);
  assert.deepStrictEqual(a, b, "same seed, same run");
}

/* 2. 拨盘和合并 */
{
  const s = S.newGame(3);
  S.startRun(s);
  assert.strictEqual(S.spinCost(s), 0, "first spin of a wave is free");
  const reel = S.spin(s);
  assert(reel.length === 3 && reel.every((x) => ["new", "up", "core"].includes(x.got)));
  assert.strictEqual(S.spinCost(s), D.SPIN_COST, "second spin costs");
  assert.strictEqual(S.spin(s), null, "cannot spin without cores");
}
{
  // 直接验证 gain 的效果：反复拉到同名，星级封顶三星
  const s = S.newGame(11);
  S.startRun(s);
  s.run.cores = 9999;
  for (let i = 0; i < 60; i++) S.spin(s), (s.run.spins = 0);
  const r = s.run;
  assert(r.items.every((x) => x.star >= 1 && x.star <= 3), "stars stay within 1..3");
  assert(r.items.filter((x) => x.t === "s").length <= D.SKILL_SLOTS, "skill slots capped");
  assert(r.items.filter((x) => x.t !== "s").length <= D.BAG, "bag capped");
  assert(new Set(r.items.map((x) => x.t + x.k)).size === r.items.length, "no duplicate entries, duplicates merge");
}

/* 3. 回家全带回，倒下带一半 */
{
  const s = S.newGame(5);
  S.startRun(s);
  s.run.cores = 30;
  assert(S.goHome(s) && s.bank === 30 && s.last.how === "home");
  S.startRun(s);
  S.spin(s);
  s.run.cores = 31;
  s.run.hp = 1;
  s.run.items = [];
  s.run.wave = 9;
  S.beginWave(s);
  let n = 0;
  while (s.run && n++ < 30 * 120) S.step(s, DT);
  assert(s.last.how === "dead" && s.bank === 30 + 15, "death keeps half: " + s.bank);
}

/* 4. 行装各有所长：同一队帮手，打一群冻鼠御炉装更快，打首领猎核装更快 */
function clearTime(wear, waveIdx) {
  const s = S.newGame(21);
  s.wear = wear;
  S.startRun(s);
  S.spin(s);
  s.run.items = [{ t: "u", k: "shield", star: 2 }, { t: "u", k: "spear", star: 2 }];
  s.run.wave = waveIdx;
  s.run.hp = 9999;
  S.beginWave(s);
  s.run.fight.ents[0].hp = s.run.fight.ents[0].max = 9999;
  let n = 0;
  while (s.run && s.run.phase === "fight" && n++ < 30 * 300) S.step(s, DT), s.run && s.run.fight && (s.run.fight.ev.length = 0);
  return n / 30;
}
{
  const t = { ratH: clearTime("hunter", 5), ratS: clearTime("stoker", 5), bossH: clearTime("hunter", 9), bossS: clearTime("stoker", 9) };
  if (report) console.log("清场用时（秒）", JSON.stringify(t));
  assert(t.ratS < t.ratH * 0.8, "stoker clears a rat swarm clearly faster");
  assert(t.bossH < t.bossS * 0.8, "hunter kills the boss clearly faster");
}

/* 5. 整体节奏：新手头几局打不穿，升几级、多拉几次之后能打穿；一波 8 到 20 秒 */
{
  const N = report ? 60 : 20;
  const firstWave = [], clearedAt = [], waveTimes = [];
  for (let i = 1; i <= N; i++) {
    const s = S.newGame(1000 + i);
    let cleared = 0;
    for (let run = 1; run <= 25 && !cleared; run++) {
      const res = playRun(s, 1);
      if (run === 1) firstWave.push(res.last.wave);
      waveTimes.push(...res.times);
      if (res.last.how === "won") cleared = run;
      while (S.upgrade(s));
    }
    clearedAt.push(cleared || 99);
  }
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  if (report) {
    console.log("第一局打到第几波 中位", med(firstWave), "最好", Math.max(...firstWave), "最差", Math.min(...firstWave));
    console.log("第几局第一次打穿十波 中位", med(clearedAt), "分布", clearedAt.slice().sort((a, b) => a - b).join(","));
    console.log("一波平均用时", avg(waveTimes).toFixed(1), "秒；最长", Math.max(...waveTimes).toFixed(1));
  }
  assert(med(firstWave) >= 3 && med(firstWave) <= 9, "first run should reach mid-layer, got " + med(firstWave));
  assert(med(clearedAt) >= 3 && med(clearedAt) <= 12, "first clear should take a handful of runs, got " + med(clearedAt));
  assert(avg(waveTimes) >= 6 && avg(waveTimes) <= 20, "average wave length, got " + avg(waveTimes).toFixed(1));
}

console.log("ember-sim: ok");

/* 余烬归途：无界面回归与平衡测试。
   node tests/ember-sim.js           快速门禁
   node tests/ember-sim.js --report  打印 200 个种子的通关统计
   验收线来自 ember/docs/design.md 第 6 节。 */
const path = require("path");
const assert = require("assert");
require(path.join(__dirname, "../ember/data.js"));
require(path.join(__dirname, "../ember/sim.js"));
const D = globalThis.EmberData, S = globalThis.EmberSim;
const report = process.argv.includes("--report");

/* 一个朴素的玩家策略：氧气够回程 + 余量就继续，否则归返；先修路，再进阶，再装备，再训练。 */
function diveOnce(s, stats) {
  S.startDive(s, s.route + 1);
  const d = () => s.dive;
  let guard = 0;
  while (s.dive && guard++ < 200) {
    const dv = d();
    if (dv.event === "rescue") {
      S.rescue(s, true);
      continue;
    }
    if (dv.enc) {
      const E = D.ENEMIES[dv.enc.e];
      const hpFrac = dv.team.reduce((a, m) => a + Math.max(0, m.hp), 0) / dv.team.reduce((a, m) => a + m.max, 0);
      if (hpFrac < 0.35 && !dv.enc.boss) S.act(s, S.canDetour(s) ? "detour" : "retreat");
      else if (E.trait === "track" && S.canDetour(s) && dv.o2 > S.returnCost(s) + 8) S.act(s, "detour");
      else S.act(s, "fight");
      if (stats && s.last && !s.dive) stats.push(s.last);
      continue;
    }
    if (dv.atEnd) {
      S.goHome(s);
      break;
    }
    const next = S.stepCost(s, dv.layer);
    if (dv.o2 - next < S.returnCost(s) + 2) {
      S.goHome(s);
      break;
    }
    const opts = S.options(s);
    let i = opts.findIndex((n) => n.t !== "fight" && n.t !== "unknown");
    if (i < 0) i = 0;
    S.moveTo(s, i);
  }
  assert(!s.dive, "dive must end");
}

function manage(s) {
  while (S.repair(s));
  for (const id of ["guard", "hunter", "stoker"]) S.promote(s, id);
  if (s.hearth <= 2) S.stoke(s);
  for (const k of ["tank", "frame", "armor"]) S.build(s, k);
  const ids = ["guard", "hunter", "stoker"].sort((a, b) => s.cls[a].lv - s.cls[b].lv);
  if (s.store.core > 30) S.train(s, ids[0]);
  while (s.hearth < 5 && s.store.core > 20 && S.stoke(s));
}

function playThrough(seed, maxDives) {
  const s = S.newGame(seed, 0);
  let dives = 0;
  while (!s.won && dives < maxDives) {
    if (s.tide) {
      S.tideWave(s);
      manage(s);
      dives++;
      continue;
    }
    diveOnce(s);
    manage(s);
    dives++;
    // JSON 往返：存档必须是纯数据
    const copy = JSON.parse(JSON.stringify(s));
    assert.deepStrictEqual(copy, s, "state must survive JSON round-trip");
  }
  return { s, dives };
}

/* 1. 确定性：同种子同结果 */
{
  const a = playThrough(7, 80), b = playThrough(7, 80);
  assert.deepStrictEqual(a.s, b.s, "same seed, same game");
}

/* 2. 回程氧气：越深越贵，锚点减半 */
{
  const s = S.newGame(1, 0);
  S.startDive(s, 1);
  s.dive.step = 3;
  const c1 = S.returnCost(s);
  s.dive.layer = 2;
  s.dive.step = 2;
  const c2 = S.returnCost(s);
  s.dive.anchor = true;
  assert(c2 > c1, "deeper return costs more");
  assert(S.returnCost(s) < c2, "anchor halves layer-2 return");
}

/* 3. 救援事件：只出现一次，救人丢一半能核 */
{
  const s = S.newGame(3, 0);
  S.startDive(s, 1);
  s.dive.map[0] = [{ t: "cache" }];
  s.dive.map[1] = [{ t: "cache" }];
  s.dive.map[2] = [{ t: "cache" }];
  S.moveTo(s, 0);
  S.moveTo(s, 0);
  const before = s.dive.carry.core;
  S.moveTo(s, 0);
  assert.strictEqual(s.dive.event, "rescue");
  S.rescue(s, true);
  assert(s.flags.wei && s.dive.carry.core < before + 5, "rescue costs cores");
}

/* 4. 拟岩虫与据点不能绕行 */
{
  const s = S.newGame(5, 0);
  S.startDive(s, 1);
  s.dive.map[0] = [{ t: "fight", e: "mimicWorm", hidden: true }];
  assert.strictEqual(S.options(s)[0].t, "cache", "mimic looks like a cache");
  S.moveTo(s, 0);
  assert(!S.canDetour(s), "cannot detour a revealed mimic");
}

/* 5. 关键进阶需要真实材料，能核替代不了 */
{
  const s = S.newGame(9, 0);
  s.store.core = 9999;
  assert(!S.promote(s, "guard") && !S.promote(s, "hunter") && !S.promote(s, "stoker"));
  s.store.mats = { toughPlate: 2, frostSinew: 2 };
  assert(S.promote(s, "guard"));
}

/* 6. 常规队伍：按经过时间产出，8 小时封顶 */
{
  const s = S.newGame(11, 0);
  s.route = 1;
  const c0 = s.store.core;
  S.idleTick(s, 60 * 60 * 1000);
  assert.strictEqual(s.store.core - c0, 30, "0.5 per minute for an hour");
  S.idleTick(s, 60 * 60 * 1000 + 48 * 3600 * 1000);
  assert.strictEqual(s.store.core - c0, 30 + 240, "capped at 8 hours");
}

/* 7. 朴素策略能通关，且下潜次数落在设计区间（约 40 分钟，按每次 3 分钟算 8 到 25 次） */
{
  const N = report ? 200 : 40;
  const res = [];
  for (let i = 1; i <= N; i++) res.push(playThrough(1000 + i, 80));
  const won = res.filter((r) => r.s.won);
  const ds = won.map((r) => r.dives).sort((a, b) => a - b);
  const med = ds[ds.length >> 1];
  if (report) {
    console.log("通关率", won.length + "/" + N, "下潜次数 中位", med, "最少", ds[0], "最多", ds[ds.length - 1]);
    const r = res.find((x) => !x.s.won);
    if (r) console.log("未通关样例：route", r.s.route, "cleared", r.s.cleared, "hearth", r.s.hearth, "store", r.s.store);
  }
  assert(won.length / N >= 0.9, "naive policy should finish: " + won.length + "/" + N);
  assert(med >= 8 && med <= 25, "median dives in design range, got " + med);
}

console.log("ember-sim: ok");

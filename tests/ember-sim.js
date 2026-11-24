/* 万丈深渊：无界面回归与平衡测试。
   node tests/ember-sim.js           快速门禁
   node tests/ember-sim.js --report  打印 200 个存档的通关统计、预估分布、战术差异
   验收线来自 ember/docs/design.md 第 6 节与 ember/docs/pm-review-r1.md。 */
const path = require("path");
const assert = require("assert");
require(path.join(__dirname, "../ember/data.js"));
require(path.join(__dirname, "../ember/sim.js"));
const D = globalThis.EmberData, S = globalThis.EmberSim;
const report = process.argv.includes("--report");
const hpFrac = (d) => d.team.reduce((a, m) => a + Math.max(0, m.hp), 0) / d.team.reduce((a, m) => a + m.max, 0);
const stats = { enc: 0, sure: 0, retreat: 0 };

/* 按敌情挑战术：大型单体破甲、掩护、投射；成群不破甲、反击、压制；能核不够时用装甲。 */
function pickTactic(s) {
  const d = s.dive, E = D.ENEMIES[d.enc.e], many = d.enc.foes.length > 2;
  S.setTactic(s, "breach", E.hp >= 40);
  S.setTactic(s, "stance", many ? "counter" : "cover");
  S.setTactic(s, "mode", d.carry.core < 4 ? "plating" : many ? "blanket" : "lance");
}

/* 一个朴素但会看预估的玩家。 */
function diveOnce(s) {
  S.startDive(s, s.route + 1);
  let guard = 0;
  while (s.dive && guard++ < 300) {
    const d = s.dive;
    if (d.event === "rescue") {
      S.rescue(s, true);
      continue;
    }
    if (d.enc) {
      pickTactic(s);
      const fc = S.forecast(s);
      stats.enc++;
      if (fc.win === fc.n && fc.cost < 0.1) stats.sure++;
      if (fc.win >= 4 || (d.enc.boss && fc.win >= 3)) S.act(s, "fight");
      else if (S.canDetour(s) && d.o2 > S.returnCost(s) + 3) S.act(s, "detour");
      else {
        stats.retreat++;
        S.act(s, "retreat");
      }
      continue;
    }
    if (S.tooHeavy(s)) S.dropToCap(s);
    if (d.atEnd) {
      if (S.canDescend(s) && hpFrac(d) > 0.6 && d.o2 > S.returnCost(s) + 10) S.descend(s);
      else S.goHome(s);
      continue;
    }
    const next = S.stepCost(s, d.layer);
    if (d.o2 - next < S.returnCost(s) + 2 || hpFrac(d) < 0.35) {
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
  if (s.store.core > 40) S.train(s, ids[0]);
  while (s.hearth < 5 && s.store.core > 30 && S.stoke(s));
}

function playThrough(seed, maxDives) {
  const s = S.newGame(seed, 0);
  let dives = 0, waves = 0, lostWaves = 0;
  while (!s.won && dives < maxDives) {
    if (s.tide) {
      manage(s);
      // 准备不足时先回去下潜攒能核
      if (s.store.core < 20 && waves > 0) {
        diveOnce(s);
        dives++;
        manage(s);
      }
      waves++;
      if (!S.tideWave(s)) lostWaves++;
      delete s.fx;
      continue;
    }
    diveOnce(s);
    delete s.fx;
    manage(s);
    dives++;
    const copy = JSON.parse(JSON.stringify(s));
    assert.deepStrictEqual(copy, s, "state must survive JSON round-trip");
  }
  return { s, dives, waves, lostWaves };
}

/* 1. 确定性：同种子同结果 */
{
  const a = playThrough(7, 120), b = playThrough(7, 120);
  assert.deepStrictEqual(a.s, b.s, "same seed, same game");
}

/* 2. 回程氧气：越深越贵（打完据点下到下一层也不会变便宜），锚点减半 */
{
  const s = S.newGame(1, 0);
  S.startDive(s, 1);
  s.dive.step = 4;
  const c1 = S.returnCost(s);
  s.dive.layer = 2;
  s.dive.step = 0;
  const c2 = S.returnCost(s);
  s.dive.step = 5;
  const c2b = S.returnCost(s);
  s.dive.layer = 3;
  s.dive.step = 0;
  const c3 = S.returnCost(s);
  assert(c2 > c1 && c3 > c2b, "return cost never drops when going deeper: " + [c1, c2, c2b, c3]);
  s.dive.layer = 2;
  s.dive.step = 3;
  const before = S.returnCost(s);
  s.dive.anchor = true;
  assert(S.returnCost(s) < before, "anchor halves layer-2 return");
}

/* 3. 据点后停下，由玩家选择下一层或归返 */
{
  const s = S.newGame(2, 0);
  s.cleared[1] = true;
  S.startDive(s, 1);
  s.dive.step = s.dive.map.length;
  s.dive.atEnd = true;
  assert(S.canDescend(s));
  S.descend(s);
  assert.strictEqual(s.dive.layer, 2);
}

/* 4. 救援：只出现一次，救人丢一半能核；不救则路标晚一次下潜才找到 */
{
  const s = S.newGame(3, 0);
  S.startDive(s, 1);
  for (let i = 0; i < 3; i++) s.dive.map[i] = [{ t: "cache" }];
  S.moveTo(s, 0);
  S.moveTo(s, 0);
  const before = s.dive.carry.core;
  S.moveTo(s, 0);
  assert.strictEqual(s.dive.event, "rescue");
  S.rescue(s, true);
  assert(s.flags.wei && s.dive.carry.core < before + 5, "rescue costs cores");

  const t = S.newGame(4, 0);
  t.flags.metWei = true;
  S.startDive(t, 1);
  t.dive.map[0] = [{ t: "boss", e: "hyenaMatron" }];
  t.dive.team.forEach((m) => (m.hp = m.max = 9999));
  S.moveTo(t, 0);
  S.act(t, "fight");
  S.goHome(t);
  assert(!S.routeUnlocked(t), "sign not found on the same dive");
  S.startDive(t, 1);
  S.goHome(t);
  assert(S.routeUnlocked(t), "sign found one dive later");
}

/* 5. 拟岩虫与据点不能绕行 */
{
  const s = S.newGame(5, 0);
  S.startDive(s, 1);
  s.dive.map[0] = [{ t: "fight", e: "mimicWorm", hidden: true }];
  assert.strictEqual(S.options(s)[0].t, "cache", "mimic looks like a cache");
  S.moveTo(s, 0);
  assert(!S.canDetour(s), "cannot detour a revealed mimic");
}

/* 6. 关键进阶需要真实材料 */
{
  const s = S.newGame(9, 0);
  s.store.core = 9999;
  assert(!S.promote(s, "guard") && !S.promote(s, "hunter") && !S.promote(s, "stoker"));
  s.store.mats = { toughPlate: 2, frostSinew: 2 };
  assert(S.promote(s, "guard"));
}

/* 7. 超重：超过上限 25% 走不动，丢到上限后能走 */
{
  const s = S.newGame(10, 0);
  S.startDive(s, 1);
  s.dive.carry.core = 40;
  assert(S.tooHeavy(s));
  assert.throws(() => S.moveTo(s, 0));
  S.dropToCap(s);
  assert(!S.overweight(s) && !S.tooHeavy(s));
}

/* 8. 常规队伍：按经过时间产出，8 小时封顶 */
{
  const s = S.newGame(11, 0);
  s.route = 1;
  const c0 = s.store.core;
  S.idleTick(s, 60 * 60 * 1000);
  assert.strictEqual(s.store.core - c0, 30, "0.5 per minute for an hour");
  S.idleTick(s, 60 * 60 * 1000 + 48 * 3600 * 1000);
  assert.strictEqual(s.store.core - c0, 30 + 240, "capped at 8 hours");
}

/* 9. 进阶的选择要有代价：同一场战斗，换一个战术，结果明显不同 */
function tacticSpread(enemy, carry, n) {
  const s = S.newGame(21, 0);
  for (const id in s.cls) s.cls[id] = { lv: 3, adv: true };
  S.startDive(s, 1);
  s.dive.carry.core = carry;
  s.dive.map[0] = [{ t: "fight", e: enemy }];
  S.moveTo(s, 0);
  if (n) s.dive.enc.foes = Array.from({ length: n }, () => ({ hp: D.ENEMIES[enemy].hp, max: D.ENEMIES[enemy].hp }));
  const res = {};
  for (const breach of [true, false])
    for (const stance of ["cover", "counter"])
      for (const mode of ["lance", "blanket", "plating"]) {
        S.setTactic(s, "breach", breach);
        S.setTactic(s, "stance", stance);
        S.setTactic(s, "mode", mode);
        const f = S.forecast(s);
        res[(breach ? "破" : "不") + "/" + stance + "/" + mode] = f.win * 100 + Math.round(f.left * 100);
      }
  return res;
}
{
  const big = tacticSpread("wellWarden", 12), swarm = tacticSpread("chorusBat", 12, 8);
  const best = (r) => Object.keys(r).reduce((a, b) => (r[b] > r[a] ? b : a));
  const bb = best(big), bs = best(swarm);
  if (report) console.log("守兽最佳", bb, "群蝠最佳", bs);
  assert.notStrictEqual(bb, bs, "best tactic differs between a big single foe and a swarm");
  assert(bb.startsWith("破") && bb.endsWith("lance"), "big single foe: breach and lance");
  assert(bs.endsWith("blanket"), "swarm: blanket");
  const spreadBig = Math.max(...Object.values(big)) - Math.min(...Object.values(big));
  assert(spreadBig >= 15, "tactics must matter against a boss, spread " + spreadBig);
}

/* 10. 整体节奏：会看预估的朴素策略能通关；下潜次数 14 到 30（每次约 2 分钟，40 分钟左右）；战斗不能大多稳赢 */
{
  const N = report ? 200 : 40;
  const res = [];
  for (let i = 1; i <= N; i++) res.push(playThrough(1000 + i, 120));
  const won = res.filter((r) => r.s.won);
  const ds = won.map((r) => r.dives).sort((a, b) => a - b);
  const med = ds[ds.length >> 1];
  const lost = res.reduce((a, r) => a + r.lostWaves, 0), waves = res.reduce((a, r) => a + r.waves, 0);
  const advGuard = res.filter((r) => r.s.cls.guard.adv).length;
  const sure = stats.sure / stats.enc;
  if (report) {
    console.log("通关率", won.length + "/" + N, "下潜次数 中位", med, "最少", ds[0], "最多", ds[ds.length - 1]);
    console.log("几乎不掉血（损失 <10%）的稳赢局比例", (sure * 100).toFixed(0) + "%", "撤退", stats.retreat, "/", stats.enc);
    console.log("兽潮 失守", lost, "/", waves, "波；护卫者进阶率", advGuard + "/" + N);
  }
  assert(won.length / N >= 0.85, "policy should usually finish: " + won.length + "/" + N);
  assert(med >= 14 && med <= 30, "median dives in design range, got " + med);
  assert(sure <= 0.55, "about half the fights must cost something, got " + sure.toFixed(2));
}

console.log("ember-sim: ok");

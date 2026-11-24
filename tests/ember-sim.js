/* 万丈深渊：无界面回归与平衡测试。
   node tests/ember-sim.js           快速门禁
   node tests/ember-sim.js --report  打印 200 个存档的通关统计、各行装的整局表现、配件的作用
   验收线来自 ember/docs/design.md 第 6 节。 */
const path = require("path");
const assert = require("assert");
require(path.join(__dirname, "../ember/data.js"));
require(path.join(__dirname, "../ember/sim.js"));
const D = globalThis.EmberData, S = globalThis.EmberSim;
const report = process.argv.includes("--report");
const hpFrac = (d) => Math.max(0, d.team[0].hp) / d.team[0].max;
const stats = { enc: 0, sure: 0, retreat: 0 };

/* 按敌情挑战术：大型单体破甲、架盾、投射；成群不破甲、反击、压制；能核不够时用装甲。 */
function pickTactic(s) {
  const d = s.dive, E = D.ENEMIES[d.enc.e], many = d.enc.foes.length > 2;
  S.setTactic(s, "breach", E.hp >= 40);
  S.setTactic(s, "stance", E.trait === "boss" || E.hp >= 40 ? "cover" : "counter");
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

/* 配件对某套行装值多少：通用词条按固定分，专属词条只有穿对行装才算。 */
function itemScore(it, wear) {
  const W = { atk: 6, hp: 0.5, arm: 6, o2: 3, cap: 1, big: 0.5, swarm: 0.3, loot: 0.6, regen: 1.5, crit: 0.8, breach: wear === "hunter" ? 0.6 : 0, counter: wear === "guard" ? 0.3 : 0, stam: wear === "guard" ? 2 : 0, fuel: wear === "stoker" ? 0.4 : 0 };
  return it.a.reduce((a, [k, v]) => a + (W[k] || 0) * v, 0);
}
/* opt.wear 固定行装；opt.noItems 不装配件；opt.noSkills 不带技艺。 */
function manage(s, opt) {
  opt = opt || {};
  while (S.repair(s));
  for (const id of ["hunter", "guard", "stoker"]) S.promote(s, id);
  if (opt.wear) S.wear(s, opt.wear);
  for (const id of s.equip.slice()) S.unequip(s, id);
  if (!opt.noItems) for (const it of s.items.slice().sort((a, b) => itemScore(b, s.wear) - itemScore(a, s.wear)).slice(0, D.EQUIP_SLOTS)) S.equip(s, it.id);
  if (s.items.length > 8) for (const it of s.items.filter((x) => !s.equip.includes(x.id)).sort((a, b) => a.r - b.r).slice(0, s.items.length - 8)) S.salvage(s, it.id);
  if (!opt.noSkills) for (const k of s.skills) if (!s.slots.includes(k)) S.toggleSkill(s, k);
  if (s.hearth <= 2) S.stoke(s);
  for (const k of ["tank", "frame", "armor"]) S.build(s, k);
  if (s.store.core > 40) S.upgrade(s, s.wear);
  while (s.hearth < 5 && s.store.core > 30 && S.stoke(s));
}

function playThrough(seed, maxDives, opt) {
  const s = S.newGame(seed, 0);
  let dives = 0, waves = 0, lostWaves = 0;
  manage(s, opt);
  while (!s.won && dives < maxDives) {
    if (s.tide) {
      manage(s, opt);
      if (s.store.core < 20 && waves > 0) {
        diveOnce(s);
        dives++;
        manage(s, opt);
      }
      waves++;
      if (!S.tideWave(s)) lostWaves++;
      delete s.fx;
      continue;
    }
    diveOnce(s);
    delete s.fx;
    manage(s, opt);
    dives++;
    const copy = JSON.parse(JSON.stringify(s));
    assert.deepStrictEqual(copy, s, "state must survive JSON round-trip");
  }
  return { s, dives, waves, lostWaves };
}
function batch(n, opt) {
  const res = [];
  for (let i = 1; i <= n; i++) res.push(playThrough(1000 + i, 120, opt));
  const ds = res.map((r) => (r.s.won ? r.dives : 999)).sort((a, b) => a - b);
  return { res, med: ds[ds.length >> 1], won: res.filter((r) => r.s.won).length };
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

/* 4. 救援：只出现一次，救人丢一半能核；不救则路标要之后的下潜走到第 3 步才找到。首领首次击倒必掉技艺和配件 */
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
  t.dive.team[0].hp = t.dive.team[0].max = 9999;
  S.moveTo(t, 0);
  S.act(t, "fight");
  S.goHome(t);
  assert(!S.routeUnlocked(t), "sign not found on the same dive");
  assert(t.skills.includes("spear") && t.items.length >= 1, "first boss kill brings home a skill and an item");
  S.startDive(t, 1);
  for (let i = 0; i < 3; i++) t.dive.map[i] = [{ t: "cache" }];
  S.moveTo(t, 0);
  S.moveTo(t, 0);
  assert(!S.routeUnlocked(t), "sign is deep in the layer, not at the entrance");
  S.moveTo(t, 0);
  assert(S.routeUnlocked(t), "sign found one dive later, at step 3");
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

/* 7. 超重：超过上限 25% 走不动，丢到上限后能走；配件也占负重 */
{
  const s = S.newGame(10, 0);
  S.startDive(s, 1);
  const w0 = S.weight(s);
  s.dive.carry.items.push(S.rollItem(s, 1, false));
  assert.strictEqual(S.weight(s), w0 + D.ITEM_W);
  s.dive.carry.core = 40;
  assert(S.tooHeavy(s));
  assert.throws(() => S.moveTo(s, 0));
  S.dropToCap(s);
  assert(!S.tooHeavy(s));
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

/* 9. 行装、配件、技艺的规则 */
{
  const s = S.newGame(12, 0);
  const base = S.heroStats(s);
  for (let i = 0; i < 5; i++) s.items.push(S.rollItem(s, 1, false));
  s.items.push({ id: 900, b: "blade", r: 0, a: [["atk", 3]] }, { id: 901, b: "filter", r: 0, a: [["o2", 4]] });
  assert(S.equip(s, 900) && S.equip(s, 901) && S.equip(s, s.items[0].id));
  assert(!S.equip(s, s.items[1].id), "only 3 equip slots");
  const now = S.heroStats(s);
  assert(now.atk >= base.atk + 3 && now.o2 >= base.o2 + 4, "items change stats");
  S.wear(s, "guard");
  assert(S.heroStats(s).hp > now.hp, "guard outfit has more hp");
  const cores = s.store.core;
  assert(S.salvage(s, 900) && s.store.core > cores && !s.equip.includes(900), "salvage gives cores and unequips");
  s.skills = ["spear", "smoke", "aid"];
  assert(S.toggleSkill(s, "spear") && S.toggleSkill(s, "smoke") && !S.toggleSkill(s, "aid"), "only 2 skill slots");
  S.startDive(s, 1);
  assert(!S.wear(s, "hunter") && !S.equip(s, s.items[1].id), "no changing outfit or items during a dive");
  // 倒下：背着的配件全丢
  s.dive.carry.items.push(S.rollItem(s, 1, false));
  const n = s.items.length;
  s.dive.map[0] = [{ t: "boss", e: "fumeTyrant" }];
  S.moveTo(s, 0);
  S.act(s, "fight");
  assert.strictEqual(s.last.how, "wiped");
  assert.strictEqual(s.items.length, n, "carried items are lost on a wipe");
}

/* 10. 行装要有取舍：同一场战斗，换一套行装，结果明显不同 */
function spread(enemy, n, wearId, carry) {
  const s = S.newGame(21, 0);
  for (const id in s.outfits) s.outfits[id] = { lv: 3, adv: true };
  S.wear(s, wearId);
  S.startDive(s, 1);
  s.dive.carry.core = carry;
  s.dive.map[0] = [{ t: "fight", e: enemy, n }];
  S.moveTo(s, 0);
  pickTactic(s);
  const f = S.forecast(s);
  return f.win * 100 - Math.round(f.cost * 100);
}
{
  const r = {};
  for (const w of ["hunter", "guard", "stoker"]) r[w] = { big: spread("wellWarden", 1, w, 12), swarm: spread("chorusBat", 6, w, 12) };
  if (report) console.log("单场得分（胜场×100 减损失%）：守兽 / 六只群鸣蝠", JSON.stringify(r));
  assert(r.stoker.swarm > r.hunter.swarm, "stoker outfit is better against swarms than hunter");
  assert(r.hunter.big > r.stoker.big || r.guard.big > r.stoker.big, "single big foe favours hunter or guard over stoker");
}

/* 11. 整体节奏：会看预估的朴素策略能通关；下潜次数 14 到 30；相当一部分战斗要付出代价；配件和技艺确实有用 */
{
  const N = report ? 200 : 40;
  const all = batch(N);
  const ds = all.res.filter((r) => r.s.won).map((r) => r.dives).sort((a, b) => a - b);
  const lost = all.res.reduce((a, r) => a + r.lostWaves, 0), waves = all.res.reduce((a, r) => a + r.waves, 0);
  const sure = stats.sure / stats.enc;
  const items = all.res.reduce((a, r) => a + r.s.items.length, 0) / N, skills = all.res.reduce((a, r) => a + r.s.skills.length, 0) / N;
  if (report) {
    console.log("通关率", all.won + "/" + N, "下潜次数 中位", all.med, "最少", ds[0], "最多", ds[ds.length - 1]);
    console.log("几乎不掉血（损失 <10%）的稳赢局比例", (sure * 100).toFixed(0) + "%", "撤退", stats.retreat, "/", stats.enc);
    console.log("兽潮 失守", lost, "/", waves, "波；通关时平均配件", items.toFixed(1), "件，技艺", skills.toFixed(1), "个");
    const M = 60;
    for (const [name, opt] of [["只穿猎核装", { wear: "hunter" }], ["只穿护卫装", { wear: "guard" }], ["只穿御炉装", { wear: "stoker" }], ["不装配件", { noItems: true }], ["不带技艺", { noSkills: true }], ["配件技艺都不用", { noItems: true, noSkills: true }]]) {
      const b = batch(M, opt);
      console.log(name, "通关", b.won + "/" + M, "中位", b.med);
    }
  }
  assert(all.won / N >= 0.85, "policy should usually finish: " + all.won + "/" + N);
  assert(all.med >= 14 && all.med <= 30, "median dives in design range, got " + all.med);
  assert(sure <= 0.6, "a good share of fights must cost something, got " + sure.toFixed(2));
  const K = report ? 60 : 20;
  const bare = batch(K, { noItems: true, noSkills: true }), geared = batch(K);
  assert(bare.med > geared.med, "items and skills must speed up a run: bare " + bare.med + " vs geared " + geared.med);
}

console.log("ember-sim: ok");

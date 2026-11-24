/* 万变之种：无界面回归与平衡测试。
   node tests/evo-sim.js          快速门禁（CI 用）
   node tests/evo-sim.js --full   追加各培养皿可打性检查（较慢）
   node tests/evo-sim.js --report 打印流派平衡表
   验收线来自 evo/docs/pm-review-r1.md 的 A2 到 A8。 */
const path = require("path");
require(path.join(__dirname, "../evo/data.js"));
require(path.join(__dirname, "../evo/sim.js"));
const D = globalThis.EvoData, S = globalThis.EvoSim;
const assert = require("assert");
const DT = 1 / 30;
const full = process.argv.includes("--full"), report = process.argv.includes("--report");

function play(seed, prefs, meta, diff, opt) {
  opt = opt || {};
  const run = S.newRun(meta || {}, diff || 0, seed);
  let steps = 0, first = true;
  const max = (opt.limit || 1500) * 30;
  while (!run.over && steps < max) {
    if (run.choice) {
      if (first && opt.firstSkill) S.pick(run, Math.max(0, run.choice.opts.findIndex((o) => o.id === opt.firstSkill)));
      else S.autoPick(run, prefs, { exit: opt.exit || 99 });
      first = false;
      continue;
    }
    S.step(run, DT);
    steps++;
    if (opt.tick) opt.tick(run);
    run.fx.length = 0;
    assert(Number.isFinite(run.hp), "hp must stay finite");
    assert(run.enemies.length <= 220, "enemy count bounded");
  }
  return run;
}
const base = (n) => ({ vit: n, fang: n, meta: n, shell: n, sense: n, greed: n });
const HALF = base(5), FULL1 = Object.assign(base(10), { heir: 3 });
const BUILDS = { 随机: [], 物理: ["phys"], 鲜血: ["blood", "phys"], 火焰: ["fire"], 雷电: ["light"], 冰霜: ["cold"], 剧毒: ["poison"], 虫群: ["brood"], 甲壳: ["armor", "poison"] };
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];

/* 1. 数据表完整性 */
for (const id in D.FORMS) {
  const f = D.FORMS[id];
  if (f.p) assert(D.FORMS[f.p], "parent of " + id);
  for (const t of f.aff) assert(D.TAGS[t]);
}
for (const id in D.MUTS) for (const k of ["req", "req2", "tag"]) if (D.MUTS[id][k]) assert(D.TAGS[D.MUTS[id][k]], id);
for (const id in D.SKILLS) assert(D.TAGS[D.SKILLS[id].tag] && D.SKILLS[id].rg, "skill " + id);

/* 2. 确定性与快照往返 */
const a = play(7, ["poison"], {}, 0), b = play(7, ["poison"], {}, 0);
assert.strictEqual(a.wave, b.wave);
assert.strictEqual(a.kills, b.kills);
const r0 = play(42, ["fire"], HALF, 0, { limit: 200 });
const r1 = S.restore(JSON.parse(JSON.stringify(r0.snap)), {});
assert.strictEqual(r1.wave, r0.snap.wave);
assert.deepStrictEqual(r1.meta, HALF, "续局沿用开局时的基因强化");
for (let i = 0; i < 300 && !r1.over; i++) r1.choice ? S.autoPick(r1, [], { exit: 99 }) : S.step(r1, DT);
assert(Number.isFinite(r1.hp));

/* 3. A2：每个初始技能都能独立开局 */
const starter = {};
for (const id in D.SKILLS) starter[id] = avg([...Array(12)].map((_, i) => play(500 + i * 97, [], {}, 0, { firstSkill: id }).wave));
const sv = Object.values(starter), smin = Math.min(...sv), smax = Math.max(...sv);
assert(smin >= 6, "初始技能最低平均波次应不低于 6，实际 " + JSON.stringify(starter));
assert(smin >= smax * 0.6, "初始技能强弱差距过大 " + JSON.stringify(starter));

/* 4. A2：任意单技能都打得到喷吐体 */
for (const id in D.SKILLS) {
  const run = S.newRun({}, 0, 11);
  while (run.choice || run.pend.length) {
    if (!run.choice) S.step(run, DT);
    else S.pick(run, 0);
  }
  run.skills = [{ id, lvl: 5, cd: 0 }];
  S.recalc(run);
  run.hp = run.maxHp = 1e9;
  run.wave = 4;
  const spits = [];
  for (let i = 0; i < 5; i++) spits.push(S.spawn(run, "spit"));
  for (let i = 0; i < 60 * 30; i++) {
    run.choice ? S.autoPick(run, [], { exit: 99 }) : S.step(run, DT);
    run.fx.length = 0;
  }
  assert(spits.filter((e) => e.dead).length > 0, id + " 在 60 秒内没有击杀任何喷吐体");
}

/* 5. A3：战场密度 */
let empty = 0, ticks = 0, k60 = [];
for (let i = 0; i < 10; i++) {
  const r = play(900 + i * 13, [], {}, 0, { limit: 60, tick: (run) => (ticks++, run.enemies.length || empty++) });
  k60.push(r.kills);
}
assert(empty / ticks < 0.05, "前 60 秒无敌人时间占比 " + (empty / ticks).toFixed(3));
assert(avg(k60) >= 60, "前 60 秒平均击杀 " + avg(k60));
const late = [];
for (let i = 0; i < 6; i++) play(300 + i * 31, [], FULL1, 0, { tick: (run) => run.wave >= 10 && run.wave % 5 && Math.abs(run.wt - 10) < DT / 2 && late.push(run.enemies.length) });
assert(median(late) >= 15, "第 10 波以后同屏敌人中位数 " + median(late));

/* 6. A4：自动选择会填满技能位，设偏好不比不设弱 */
const rows = [], waves = {}, fill = {};
for (const name in BUILDS) {
  let filled = 0, reached = 0;
  const ws = [];
  for (let i = 0; i < 20; i++) {
    let seen = false;
    const r = play(1000 + i * 7919, BUILDS[name], HALF, 0, {
      tick: (run) => {
        if (!seen && run.wave >= 10) (seen = true), reached++, run.skills.length >= run.slots && filled++;
      },
    });
    ws.push(r.wave);
    assert(S.dnaOf(r) >= 0);
  }
  waves[name] = avg(ws.map((w) => Math.min(w, 30)));
  rows.push({ 流派: name, 半强化平均波次: +waves[name].toFixed(1), 中位: median(ws), 第10波技能位填满: reached ? Math.round((filled / reached) * 100) + "%" : "未到" });
  fill[name] = [filled, reached];
}
if (report) console.table(rows), console.log("初始技能平均波次", starter);
for (const name in fill) if (fill[name][1] >= 6) assert(fill[name][0] / fill[name][1] >= 0.9, name + " 第 10 波技能位填满率 " + fill[name].join("/"));
/* 无限下潜后少数极深的局会拉高平均值，所以每局按最多 30 波计入平均；线放在 85%。 */
for (const name in waves) assert(waves[name] >= waves["随机"] * 0.85, name + " 设偏好后弱于随机：" + waves[name].toFixed(1) + " 对 " + waves["随机"].toFixed(1));

/* 7. A5：离线结算公式 */
const hist = [{ dna: 40, wall: 400 }, { dna: 60, wall: 600 }];
assert.strictEqual(S.offlineGain(hist, 600), Math.min(Math.floor(0.1 * 600 * 0.5), Math.floor((S.offlineHourCap() * 600) / 3600)));
assert.strictEqual(S.offlineGain(hist, 0), 0);
assert.strictEqual(S.offlineGain([], 3600), 0);
assert.strictEqual(S.offlineGain([{ dna: 1e9, wall: 1 }], 99 * 3600), S.offlineHourCap() * 8, "封顶 8 小时");
assert(S.offlineHourCap() * 8 <= S.metaTotal() * 0.1, "8 小时离线收益不超过全部强化总价的 10%");
assert.strictEqual(S.offlineGain([{ dna: "x", wall: null }, null], 3600), 0, "坏数据不产生收益");

/* 8. 下潜与撤离 */
{
  // 死在井里只带回 25% 的 DNA，样本全丢
  const dead = play(31, [], HALF, 0);
  assert.strictEqual(dead.over, "dead");
  assert.strictEqual(S.dnaOf(dead), Math.floor(dead.loot * 0.25));
  assert.strictEqual(S.samplePoints(dead), 0);
  // 第 1 层就上浮：一定能活着回来，并带回全部
  let outs = 0, deeper = 0;
  for (let i = 0; i < 10; i++) {
    const r = play(700 + i * 17, [], {}, 0, { exit: 1 });
    if (r.over === "out") outs++, assert.strictEqual(S.dnaOf(r), Math.floor(r.loot)), assert(S.samplePoints(r) >= 1);
    const r3 = play(700 + i * 17, [], HALF, 0, { exit: 3 });
    if (r3.over === "out" && S.dnaOf(r3) > S.dnaOf(r)) deeper++;
  }
  assert(outs >= 8, "新档在第 1 层上浮应基本成功，实际 " + outs + "/10");
  assert(deeper >= 3, "下潜到第 3 层再上浮应当带回更多，实际 " + deeper + "/10 次成功且更多");
  // 减压伤害随深度增加，减压腺有效
  const probe = S.newRun({}, 0, 1), probe2 = S.newRun({ decomp: 5 }, 0, 1);
  assert(S.ascentStrain(probe, 6) > S.ascentStrain(probe, 2));
  assert(S.ascentStrain(probe2, 6) < S.ascentStrain(probe, 6));
  assert(S.ascentTime(8) > S.ascentTime(2));
}

/* 9. 营地强化让种子下得更深（慢，--full 才跑） */
if (full) {
  const T2 = (n, m) => ({ vit2: n, fang2: n, shell2: m, meta2: m });
  const PRE = [{}, HALF, Object.assign(base(10), { heir: 3 }), Object.assign(base(10), { heir: 3, twin: 1 }, T2(5, 0)), Object.assign(base(10), { heir: 3, twin: 1, fourth: 1 }, T2(10, 5)), Object.assign(base(10), { heir: 3, twin: 1, fourth: 1, apex: 5 }, T2(10, 10))];
  const out = [], mono = [];
  let prev = 0;
  PRE.forEach((meta, d) => {
    const ws = [];
    for (const name in BUILDS) for (let i = 0; i < 6; i++) ws.push(play(99 + i * 131 + d * 7 + name.length, BUILDS[name], meta, 0, { limit: 2400 }).wave);
    const m = avg(ws);
    out.push({ 营地水平: d, 平均最深波次: +m.toFixed(1), 平均最深层: +(m / D.LAYER).toFixed(1), 最深: Math.max(...ws) });
    mono.push(m);
    prev = m;
  });
  console.table(out);
  /* 相邻两档容许 1 波的抽样噪声；首尾必须翻倍。 */
  for (let i = 1; i < mono.length; i++) assert(mono[i] > mono[i - 1] - 1, "营地强化越多应下得越深：" + mono.map((v) => v.toFixed(1)).join(" "));
  assert(mono[mono.length - 1] >= mono[0] * 2, "满强化应比新档深一倍以上");
}
console.log("evo-sim: all checks passed" + (full ? " (full)" : ""));

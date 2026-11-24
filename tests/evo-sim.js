/* 万变之种：无界面模拟回归与平衡测试。node tests/evo-sim.js [--report] */
const path = require("path");
require(path.join(__dirname, "../evo/data.js"));
require(path.join(__dirname, "../evo/sim.js"));
const D = globalThis.EvoData, S = globalThis.EvoSim;
const assert = require("assert");

function play(seed, prefs, meta, diff, limitS) {
  const run = S.newRun(meta || {}, diff || 0, seed);
  let steps = 0;
  const max = (limitS || 1500) * 30;
  while (!run.over && steps++ < max) {
    if (run.choice) S.autoPick(run, prefs);
    else S.step(run, 1 / 30);
    run.fx.length = 0;
    assert(Number.isFinite(run.hp), "hp must stay finite");
    assert(run.enemies.length <= 140, "enemy count bounded");
  }
  return run;
}

const BUILDS = { 随机: [], 物理: ["phys"], 鲜血: ["blood", "phys"], 火焰: ["fire"], 雷电: ["light"], 冰霜: ["cold"], 冰雷: ["cold", "light"], 剧毒: ["poison"], 虫群: ["brood"], 甲壳: ["armor", "poison"] };
const report = process.argv.includes("--report");
const N = report ? 12 : 3;
const rows = [];
const finals = {};
for (const name in BUILDS) {
  for (const [label, meta, diff] of [["无强化", {}, 0], ["半强化", { vit: 5, fang: 5, meta: 5, shell: 5, sense: 5 }, 0], ["满强化", { vit: 10, fang: 10, meta: 10, shell: 10, sense: 10, heir: 3 }, 0], ["满强化难度1", { vit: 10, fang: 10, meta: 10, shell: 10, sense: 10, heir: 3 }, 1]]) {
    let wsum = 0, wins = 0, lv = 0, tsum = 0;
    for (let i = 0; i < N; i++) {
      const r = play(1000 + i * 7919 + name.length * 31, BUILDS[name], meta, diff);
      assert(r.over, "run must terminate: " + name);
      wsum += r.wave; lv += r.lvl; tsum += r.t;
      if (r.over === "win") wins++;
      if (r.forms[2]) finals[r.forms[2]] = (finals[r.forms[2]] || 0) + 1;
      assert(S.dnaOf(r) >= 0);
    }
    rows.push({ 流派: name, 条件: label, 平均波次: +(wsum / N).toFixed(1), 通关率: Math.round((wins / N) * 100) + "%", 平均等级: +(lv / N).toFixed(1), 平均时长秒: Math.round(tsum / N) });
  }
}
if (report) { console.table(rows); console.log("终极形态出现次数", finals); }

/* 存档快照往返 */
const r0 = play(42, ["fire"], {}, 0, 200);
const snap = JSON.parse(JSON.stringify(r0.snap));
const r1 = S.restore(snap, {});
assert.strictEqual(r1.wave, snap.wave);
assert.strictEqual(r1.skills.length, snap.skills.length);
for (let i = 0; i < 300 && !r1.over; i++) { if (r1.choice) S.autoPick(r1, []); else S.step(r1, 1 / 30); }
assert(Number.isFinite(r1.hp));

/* 确定性：同种子同结果 */
const a = play(7, ["poison"], {}, 0), b = play(7, ["poison"], {}, 0);
assert.strictEqual(a.wave, b.wave); assert.strictEqual(a.kills, b.kills);

/* 数据表完整性 */
for (const id in D.FORMS) { const f = D.FORMS[id]; if (f.p) assert(D.FORMS[f.p], "parent of " + id); for (const t of f.aff) assert(D.TAGS[t]); }
for (const id in D.MUTS) { const m = D.MUTS[id]; if (m.req) assert(D.TAGS[m.req], id); if (m.tag) assert(D.TAGS[m.tag], id); }
for (const id in D.SKILLS) assert(D.TAGS[D.SKILLS[id].tag]);
console.log("evo-sim: all checks passed");

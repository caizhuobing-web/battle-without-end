/* 万丈深渊：敌情 × 行装 对照表。每种敌情下三套行装各打 5 次推演，打印「胜场/损失生命%/耗氧」。
   node tests/ember-matrix.js          打印表格并检查：每套行装至少在一种敌情下最好，且没有一套在所有敌情下都最好
   用来回答「要不要按敌情换行装」，不依赖任何自动玩家策略。 */
const path = require("path");
const assert = require("assert");
require(path.join(__dirname, "../ember/data.js"));
require(path.join(__dirname, "../ember/sim.js"));
const D = globalThis.EmberData, S = globalThis.EmberSim;

/* 每层一个有代表性的进度：行装等级、护具等级、是否已进阶。 */
const STAGE = { 1: { lv: 3, armor: 0, adv: false }, 2: { lv: 5, armor: 1, adv: true }, 3: { lv: 8, armor: 2, adv: true } };
function tactic(s) {
  const d = s.dive, E = D.ENEMIES[d.enc.e], many = d.enc.foes.length > 2;
  S.setTactic(s, "breach", true);
  S.setTactic(s, "stance", E.trait === "boss" ? "cover" : "counter");
  S.setTactic(s, "mode", many ? "blanket" : "lance");
}
function cell(layer, enemy, n, wear) {
  const st = STAGE[layer], s = S.newGame(77, 0);
  for (const id in s.outfits) s.outfits[id] = { lv: st.lv, adv: st.adv };
  s.gear.armor = st.armor;
  S.wear(s, wear);
  S.startDive(s, 1);
  s.dive.layer = layer;
  s.dive.carry.core = 8;
  s.dive.map[0] = [{ t: enemy === D.LAYERS[layer - 1].boss ? "boss" : "fight", e: enemy, n, frozen: true }];
  s.flags.metWei = true;
  S.moveTo(s, 0);
  tactic(s);
  const f = S.forecast(s);
  return { win: f.win, cost: Math.round(f.cost * 100), o2: f.o2, score: f.win * 100 - Math.round(f.cost * 100) - f.o2 * 3 };
}
const rows = [];
for (const L of D.LAYERS) {
  for (const e of L.enemies) {
    const E = D.ENEMIES[e];
    for (const n of E.n[0] === E.n[1] ? [E.n[0]] : [E.n[0], E.n[1]]) rows.push([L.id, e, n]);
  }
  rows.push([L.id, L.boss, 1]);
}
const best = { hunter: 0, guard: 0, stoker: 0 };
const W = ["hunter", "guard", "stoker"];
console.log("层  敌情              猎核装        护卫装        御炉装        最好");
for (const [layer, e, n] of rows) {
  const c = W.map((w) => cell(layer, e, n, w));
  const top = Math.max(...c.map((x) => x.score));
  const winners = W.filter((w, i) => c[i].score >= top - 4); // 4 分以内算并列
  for (const w of winners) best[w] += 1 / winners.length;
  const f = (x) => (x.win + "胜 -" + x.cost + "% 氧" + x.o2).padEnd(14);
  console.log(layer + "   " + (D.ENEMIES[e].name + (n > 1 ? "×" + n : "")).padEnd(12, "　") + c.map(f).join("") + winners.map((w) => D.OUTFITS[w].name).join("、"));
}
console.log("各行装最好的敌情数（并列按比例算）", JSON.stringify(best), "共", rows.length);
for (const w of W) assert(best[w] >= 2, D.OUTFITS[w].name + " 至少要在两种敌情下最好，实际 " + best[w].toFixed(1));
for (const w of W) assert(best[w] <= rows.length * 0.6, D.OUTFITS[w].name + " 不能在六成以上的敌情下最好，实际 " + best[w].toFixed(1));
console.log("ember-matrix: ok");

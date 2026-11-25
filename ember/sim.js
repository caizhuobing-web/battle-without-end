/* 万丈深渊：模拟层。不依赖 DOM，可在 Node 中直接运行做数值测试。
   所有状态都是可 JSON 序列化的普通对象，存档直接存 state。
   一局：每波先拉拨盘（三格各出一样，同名自动合并升星），然后全队自动打一波。 */
(function (G) {
  const D = G.EmberData;
  const HERO_X = 16, SPAWN_X = 190, SNARE_X = 118;

  function rnd(s) {
    const a = (s.rs = (s.rs + 0x6d2b79f5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function newGame(seed) {
    return { v: 4, rs: seed | 0, bank: 0, lv: 1, wear: "hunter", best: 0, runs: 0, auto: true, run: null, last: null };
  }
  const upgradeCost = (s) => D.UPGRADE * s.lv;
  function upgrade(s) {
    if (s.run || s.bank < upgradeCost(s)) return false;
    s.bank -= upgradeCost(s);
    s.lv++;
    return true;
  }
  function wear(s, id) {
    if (s.run || !D.OUTFITS[id]) return false;
    s.wear = id;
    return true;
  }

  /* ---------- 一局 ---------- */
  const star = (r, t, k) => {
    const it = r.items.find((x) => x.t === t && x.k === k);
    return it ? it.star : 0;
  };
  function heroStats(s) {
    const r = s.run, O = D.OUTFITS[r ? r.wear : s.wear], g = (k) => (r ? star(r, "g", k) : 0), up = 1 + 0.1 * (s.lv - 1);
    return {
      max: Math.round(O.hp * up * (1 + 0.3 * g("felt"))),
      atk: O.atk * up * (1 + 0.3 * g("blade")),
      cd: O.cd / (1 + 0.2 * g("grip")),
      ultCd: O.ultCd * Math.max(0.4, 1 - 0.2 * g("wire")),
      range: O.range,
    };
  }
  function startRun(s) {
    if (s.run) throw new Error("run in progress");
    s.run = { wear: s.wear, wave: 0, cores: 0, hp: 0, items: [], reel: null, spins: 0, phase: "spin", fight: null, ultT: 0 };
    s.run.hp = heroStats(s).max;
    s.runs++;
    return s.run;
  }

  /* 拨盘里的东西和权重。行装偏向的种类权重 ×3。 */
  function pool(s) {
    const bias = D.OUTFITS[s.run.wear].bias, out = [];
    const add = (t, tbl) => {
      for (const k in tbl) out.push({ t, k, w: bias.includes(k) ? 3 : 1 });
    };
    add("u", D.UNITS);
    add("g", D.GEAR);
    add("s", D.SKILLS);
    return out;
  }
  function roll(s) {
    const p = pool(s), total = p.reduce((a, x) => a + x.w, 0);
    let q = rnd(s) * total;
    for (const x of p) if ((q -= x.w) < 0) return { t: x.t, k: x.k };
    return { t: p[0].t, k: p[0].k };
  }
  /* 拿到一样东西：同名合并升星；满三星或放不下就换成 3 个能核。返回 new / up / core。 */
  function gain(s, it) {
    const r = s.run, have = r.items.find((x) => x.t === it.t && x.k === it.k);
    if (have) {
      if (have.star < 3) {
        have.star++;
        if (it.k === "felt") r.hp += Math.round(D.OUTFITS[r.wear].hp * (1 + 0.1 * (s.lv - 1)) * 0.3);
        return "up";
      }
      r.cores += 3;
      return "core";
    }
    const skills = r.items.filter((x) => x.t === "s").length, body = r.items.length - skills;
    if (it.t === "s" ? skills >= D.SKILL_SLOTS : body >= D.BAG) {
      r.cores += 3;
      return "core";
    }
    r.items.push({ t: it.t, k: it.k, star: 1 });
    if (it.k === "felt") r.hp += Math.round(D.OUTFITS[r.wear].hp * (1 + 0.1 * (s.lv - 1)) * 0.3);
    return "new";
  }
  /* 每波第一次拉免费，之后第 n 次加拉花 4×n 能核。 */
  const spinCost = (s) => (s.run.spins === 0 ? 0 : D.SPIN_COST * s.run.spins);
  function spin(s) {
    const r = s.run;
    if (!r || r.phase !== "spin") return null;
    const c = spinCost(s);
    if (r.cores < c) return null;
    r.cores -= c;
    r.spins++;
    r.reel = [0, 1, 2].map(() => {
      const it = roll(s);
      return { t: it.t, k: it.k, got: gain(s, it) };
    });
    return r.reel;
  }

  /* ---------- 战斗 ---------- */
  function beginWave(s) {
    const r = s.run;
    if (!r || r.phase !== "spin" || r.spins === 0) return false; // 每波至少拉一次
    const h = heroStats(s), W = D.WAVES[r.wave], scale = 1 + 0.14 * r.wave;
    const ents = [{ side: 0, hero: 1, k: r.wear, x: HERO_X, hp: r.hp, max: h.max, t: 0.3 }];
    let nf = 0, nb = 0;
    for (const it of r.items) {
      if (it.t !== "u") continue;
      const U = D.UNITS[it.k];
      if (U.line === "fix") continue;
      const m = D.STAR[it.star], hp = Math.round(U.hp * m);
      const x = U.line === "front" ? 74 - 9 * nf++ : 40 - 7 * nb++;
      ents.push({ side: 0, k: it.k, x, home: x, hp, max: hp, atk: U.atk * m, star: it.star, t: 0.2 + 0.1 * (nf + nb) });
    }
    const queue = [];
    let at = 0.4;
    for (const [e, n] of W) for (let i = 0; i < n; i++) {
      queue.push({ at, e });
      at += D.ENEMIES[e].boss ? 0 : D.ENEMIES[e].big ? 1.4 : 0.22;
    }
    queue.sort((a, b) => a.at - b.at);
    r.fight = { t: 0, ents, queue, scale, snare: 2 * star(r, "u", "snare"), ult: r.ultT, fire: 0, fireT: 0, jav: 3, aided: false, ev: [], kills: 0, gotCores: 0 };
    r.phase = "fight";
    r.reel = null;
    return true;
  }
  const alive = (f, side) => f.ents.filter((e) => e.side === side && e.hp > 0);
  function hit(f, e, dmg, crit) {
    if (e.hp <= 0) return;
    e.hp -= dmg;
    f.ev.push({ k: "hit", x: e.x, side: e.side, v: Math.max(1, Math.round(dmg)), big: !!crit, id: f.ents.indexOf(e) });
  }
  /* 手动放大招：冷却好了、场上有敌人才有效。 */
  function ult(s) {
    const r = s.run;
    if (!r || r.phase !== "fight") return false;
    const f = r.fight, h = heroStats(s), foes = alive(f, 1);
    if (f.ult > 0 || !foes.length || f.ents[0].hp <= 0) return false;
    f.ult = h.ultCd;
    f.ev.push({ k: "ult", wear: r.wear });
    if (r.wear === "hunter") for (const e of foes) hit(f, e, h.atk * 5, true);
    else f.fire = 4;
    return true;
  }

  function step(s, dt) {
    const r = s.run;
    if (!r || r.phase !== "fight") return;
    const f = r.fight, h = heroStats(s), hero = f.ents[0];
    f.t += dt;
    f.ult = Math.max(0, f.ult - dt);
    while (f.queue.length && f.queue[0].at <= f.t) {
      const q = f.queue.shift(), E = D.ENEMIES[q.e], hp = Math.round(E.hp * f.scale);
      f.ents.push({ side: 1, k: q.e, x: SPAWN_X, hp, max: hp, atk: E.atk * f.scale, t: E.cd * 0.5, stun: 0 });
    }
    const haste = 1 + 0.15 * star(r, "u", "lamp"), ally = 1 + 0.25 * star(r, "g", "horn");
    const smoke = star(r, "s", "smoke"), guard = smoke && f.t < 2 + smoke ? 0.5 : 1;
    const rage = f.t > 60 ? 2 : 1; // 拖太久敌人会发狂，避免僵局
    const foes = alive(f, 1), mine = alive(f, 0);
    const nearest = foes.reduce((a, e) => (!a || e.x < a.x ? e : a), null);
    const front = mine.reduce((a, e) => (!a || e.x > a.x ? e : a), null);

    // 你
    if (hero.hp > 0) {
      hero.t -= dt;
      if (s.auto && f.ult <= 0 && foes.length >= (r.wear === "hunter" ? 3 : 2)) ult(s);
      if (hero.t <= 0 && foes.length) {
        if (r.wear === "hunter") {
          const inR = foes.filter((e) => e.x - hero.x <= h.range);
          const tg = inR.reduce((a, e) => (!a || e.max > a.max || (e.max === a.max && e.x < a.x) ? e : a), null);
          if (tg) {
            hit(f, tg, h.atk * (D.ENEMIES[tg.k].big ? 2 : 1));
            f.ev.push({ k: "shot", x: tg.x });
            hero.t = h.cd;
          }
        } else {
          const inR = foes.filter((e) => e.x - hero.x <= h.range);
          if (inR.length) {
            for (const e of inR) hit(f, e, h.atk);
            f.ev.push({ k: "flame" });
            hero.t = h.cd;
          }
        }
      }
      if (f.fire > 0) {
        f.fire -= dt;
        f.fireT -= dt;
        if (f.fireT <= 0) {
          f.fireT = 0.3;
          for (const e of foes) if (e.x - hero.x <= 110) hit(f, e, h.atk * 1.5);
        }
      }
      const jv = star(r, "s", "javelin");
      if (jv) {
        f.jav -= dt;
        if (f.jav <= 0 && foes.length) {
          f.jav = 3;
          const tg = foes.reduce((a, e) => (!a || e.hp > a.hp ? e : a), null);
          hit(f, tg, h.atk * 2.5 * D.STAR[jv], true);
          f.ev.push({ k: "jav", x: tg.x });
        }
      }
      const aid = star(r, "s", "aid");
      if (aid && !f.aided && hero.hp < hero.max * 0.4) {
        f.aided = true;
        hero.hp = Math.min(hero.max, hero.hp + Math.round(hero.max * 0.25 * D.STAR[aid]));
        f.ev.push({ k: "heal", x: hero.x });
      }
    }
    // 帮手
    for (const a of mine) {
      if (a.hero) continue;
      const U = D.UNITS[a.k];
      a.t -= dt * haste;
      if (a.k === "drum") {
        if (a.t <= 0) {
          a.t = U.cd;
          for (const m of mine) m.hp = Math.min(m.max, m.hp + 3 * D.STAR[a.star]);
          f.ev.push({ k: "heal", x: a.x });
        }
        continue;
      }
      const tg = foes.reduce((b, e) => (!b || Math.abs(e.x - a.x) < Math.abs(b.x - a.x) ? e : b), null);
      if (!tg) {
        a.x += Math.sign(a.home - a.x) * Math.min(Math.abs(a.home - a.x), 30 * dt);
        continue;
      }
      const dist = tg.x - a.x;
      if (dist <= U.range) {
        if (a.t <= 0) {
          a.t = U.cd;
          hit(f, tg, a.atk * ally);
          if (U.splash) for (const e of foes) if (e !== tg && Math.abs(e.x - tg.x) <= U.splash) hit(f, e, a.atk * ally * 0.6);
          if (U.range > 30) f.ev.push({ k: U.splash ? "lob" : "bolt", x0: a.x, x: tg.x });
        }
      } else if (U.line === "front" && tg.x < 160) a.x = Math.min(tg.x - U.range + 1, a.home + (U.spd ? 40 : 10), a.x + (U.spd || 26) * dt); // 前排只往前顶一点，把敌人挡在你够得着的地方
    }
    // 敌人
    for (const e of foes) {
      const E = D.ENEMIES[e.k];
      if (e.stun > 0) {
        e.stun -= dt;
        continue;
      }
      if (f.snare > 0 && !e.snared && e.x <= SNARE_X && !E.boss) {
        e.snared = true;
        e.stun = 2;
        f.snare--;
        f.ev.push({ k: "snare", x: e.x });
        continue;
      }
      if (!front) break;
      const dist = e.x - front.x;
      e.t -= dt;
      if (dist > E.range) {
        e.x -= E.spd * dt;
        if (E.lunge && !e.lunged && dist < 48) {
          e.lunged = true;
          e.x = Math.max(front.x + E.range, e.x - 26);
        }
      } else if (e.t <= 0) {
        e.t = E.cd;
        hit(f, front, e.atk * guard * rage);
      }
    }
    // 结算倒下的
    for (const e of f.ents) {
      if (e.hp > 0 || e.dead) continue;
      e.dead = true;
      f.ev.push({ k: "die", x: e.x, side: e.side });
      if (e.side === 1) {
        f.kills++;
        f.gotCores += D.ENEMIES[e.k].core * (1 + 0.2 * star(r, "g", "hook"));
      }
    }
    r.hp = Math.max(0, Math.round(hero.hp));
    if (hero.hp <= 0) return endRun(s, "dead");
    if (!f.queue.length && !alive(f, 1).length) {
      const got = Math.round(f.gotCores);
      r.cores += got;
      r.ultT = f.ult;
      r.lastWave = { got, kills: f.kills, time: f.t };
      r.fight = null;
      r.wave++;
      r.spins = 0;
      if (r.wave >= D.WAVES.length) return endRun(s, "won");
      r.phase = "spin";
    }
  }

  /* 主动回家：能核全部带回。倒下：只带回一半。打穿：全部带回再加 20。 */
  function endRun(s, how) {
    const r = s.run, keep = how === "dead" ? Math.floor(r.cores / 2) : r.cores + (how === "won" ? 20 : 0);
    s.bank += keep;
    s.best = Math.max(s.best, r.wave);
    s.last = { how, wave: r.wave, cores: r.cores, keep, items: r.items.map((x) => ({ t: x.t, k: x.k, star: x.star })) };
    s.run = null;
    return how;
  }
  function goHome(s) {
    if (!s.run || s.run.phase !== "spin") return false;
    endRun(s, "home");
    return true;
  }
  const info = (it) => (it.t === "u" ? D.UNITS : it.t === "g" ? D.GEAR : D.SKILLS)[it.k];

  G.EmberSim = { newGame, upgrade, upgradeCost, wear, heroStats, startRun, spin, spinCost, beginWave, step, ult, goHome, info, HERO_X, SNARE_X };
})(typeof globalThis !== "undefined" ? globalThis : window);

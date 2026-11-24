/* 万变之种：战斗模拟。不依赖 DOM，可在 Node 中直接运行做平衡测试。 */
(function (G) {
  const D = G.EvoData;
  const PR = 14; // 玩家半径
  const STAT_KEYS = "hp hpPct regen armor dodge dmg atkSpd crit critDmg area proj leech thorns shield xp dna dur physInc poisonInc fireInc lightInc coldInc bloodInc broodInc armorInc poisonCap poisonSpread burnExplode overload chain shatter freeze iceShard minions minionPoison minionSplash symb lowHp overheal hpToDmg execute frenzy soul revive thornPoison dblLight killHeal rerolls startLv choices".split(" ");

  function rnd(run) {
    const a = (run.rs = (run.rs + 0x6d2b79f5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const lvlMul = (l) => 1 + 0.5 * (l - 1);
  const extra = (l) => (l >= 3 ? 1 : 0) + (l >= 5 ? 1 : 0);
  const need = (l) => Math.round(3 + 1.6 * l + 0.15 * l * l);
  const hpMul = (w) => 0.75 + 0.1 * w + 0.02 * w * w;
  const dmMul = (w) => 0.8 + 0.05 * w + 0.003 * w * w;

  function addSt(st, list, n) {
    for (const [k, v] of list) st[k] += v * n;
  }

  function recalc(run) {
    const st = {};
    for (const k of STAT_KEYS) st[k] = 0;
    st.hp = 180;
    st.regen = 1.5;
    st.crit = 5;
    st.poisonCap = 10;
    for (const id in run.meta) if (D.META[id]) addSt(st, D.META[id].st, run.meta[id]);
    for (const id of run.forms) addSt(st, D.FORMS[id].st, 1);
    for (const id in run.muts) addSt(st, D.MUTS[id].st, run.muts[id]);
    const th = run.skills.find((s) => s.id === "thorn");
    if (th) {
      st.armor += 6 * th.lvl;
      st.thorns += 5 * lvlMul(th.lvl);
    }
    st.dodge = Math.min(60, st.dodge);
    const old = run.maxHp || 0;
    run.maxHp = Math.round(st.hp * Math.max(0.2, 1 + st.hpPct / 100));
    if (old && run.maxHp > old) run.hp += run.maxHp - old;
    run.hp = Math.min(run.hp, run.maxHp);
    run.st = st;
    run.slots = 3 + (run.forms.length >= 2 ? 1 : 0);
    return st;
  }

  function ownedTags(run) {
    const t = {};
    for (const s of run.skills) t[D.SKILLS[s.id].tag] = 1;
    return t;
  }
  function affTags(run) {
    const t = {};
    for (const id of run.forms) for (const a of D.FORMS[id].aff) t[a] = 1;
    return t;
  }

  function snapshot(run) {
    run.snap = {
      v: 1, diff: run.diff, rs: run.rs, wave: run.wave, lvl: run.lvl, xp: run.xp, t: run.t,
      hpF: run.hp / run.maxHp, forms: run.forms.slice(), skills: run.skills.map((s) => ({ id: s.id, lvl: s.lvl })),
      muts: Object.assign({}, run.muts), pend: run.pend.slice(), rerolls: run.rerolls, kills: run.kills,
      bosses: run.bosses, soul: run.soul, revived: run.revived, dmgBy: Object.assign({}, run.dmgBy),
    };
  }

  function blank(meta, diff, seed) {
    const dmgBy = {};
    for (const t in D.TAGS) dmgBy[t] = 0;
    return {
      diff, rs: seed | 0, meta: Object.assign({}, meta), t: 0, wave: 1, wt: 0, debt: 0, started: 0, bossAlive: false,
      lvl: 1, xp: 0, hp: 1, maxHp: 0, sh: 0, shT: 9, forms: [], skills: [], muts: {}, pend: [], choice: null,
      rerolls: 0, kills: 0, bosses: 0, soul: 0, frenzy: 0, frenzyT: 0, revived: 0, over: null, more: 1, hurtT: 0,
      enemies: [], projs: [], eprojs: [], clouds: [], minions: [], orbA: 0, q: [], fx: [], dmgBy, eid: 1,
    };
  }

  function newRun(meta, diff, seed) {
    const run = blank(meta, diff, seed);
    recalc(run);
    run.hp = run.maxHp;
    run.rerolls = run.st.rerolls;
    run.pend.push("skill");
    for (let i = 0; i < run.st.startLv; i++) run.pend.push("mut");
    snapshot(run);
    return run;
  }

  function restore(snap, meta) {
    const run = blank(meta, snap.diff, snap.rs);
    for (const k of ["wave", "lvl", "xp", "t", "rerolls", "kills", "bosses", "soul", "revived"]) run[k] = snap[k];
    run.forms = snap.forms.filter((id) => D.FORMS[id]);
    run.skills = snap.skills.filter((s) => D.SKILLS[s.id]).map((s) => ({ id: s.id, lvl: s.lvl, cd: 0 }));
    for (const id in snap.muts) if (D.MUTS[id]) run.muts[id] = snap.muts[id];
    run.pend = snap.pend.slice();
    Object.assign(run.dmgBy, snap.dmgBy);
    recalc(run);
    run.hp = Math.max(1, run.maxHp * snap.hpF);
    run.snap = snap;
    return run;
  }

  /* ---------- 选择：技能、变异、进化 ---------- */
  function wsample(run, cands, n) {
    const out = [];
    const pool = cands.slice();
    while (out.length < n && pool.length) {
      let tot = 0;
      for (const c of pool) tot += c.w;
      let r = rnd(run) * tot, i = 0;
      for (; i < pool.length - 1; i++) {
        r -= pool[i].w;
        if (r <= 0) break;
      }
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }

  function makeChoice(run, kind) {
    const n = 3 + run.st.choices;
    let cands = [];
    if (kind === "evo") {
      const tier = run.forms.length + 1;
      const last = run.forms[run.forms.length - 1];
      for (const id in D.FORMS) {
        const f = D.FORMS[id];
        if (f.tier === tier && (tier === 1 || f.p === last)) cands.push({ k: "form", id, w: 1 });
      }
      return cands.length ? { kind, opts: cands } : null;
    }
    const aff = affTags(run), own = ownedTags(run);
    const tagW = (t) => (t ? (aff[t] ? 1.8 : 1) * (own[t] ? 1.3 : 1) : 1);
    const has = {};
    for (const s of run.skills) has[s.id] = s;
    for (const id in D.SKILLS) {
      const sk = D.SKILLS[id];
      if (has[id]) {
        if (kind === "mut" && has[id].lvl < 5) cands.push({ k: "skill", id, w: 4 * tagW(sk.tag) });
      } else if (run.skills.length < run.slots) {
        cands.push({ k: "skill", id, w: (run.skills.length < 2 ? 5 : 2.2) * tagW(sk.tag) });
      }
    }
    if (kind === "mut") {
      for (const id in D.MUTS) {
        const m = D.MUTS[id];
        if ((run.muts[id] || 0) >= m.max) continue;
        if (m.req && !own[m.req] && !aff[m.req]) continue;
        cands.push({ k: "mut", id, w: [0, 4, 2.4, 1.1][m.rar] * tagW(m.tag) });
      }
    }
    const opts = wsample(run, cands, n);
    return opts.length ? { kind, opts } : null;
  }

  function pick(run, i) {
    const c = run.choice;
    if (!c) return null;
    const o = c.opts[i] || c.opts[0];
    if (o.k === "skill") {
      const s = run.skills.find((x) => x.id === o.id);
      if (s) s.lvl++;
      else run.skills.push({ id: o.id, lvl: 1, cd: 0 });
    } else if (o.k === "mut") run.muts[o.id] = (run.muts[o.id] || 0) + 1;
    else if (o.k === "form") run.forms.push(o.id);
    run.choice = null;
    recalc(run);
    if (o.k === "form") heal(run, run.maxHp * 0.3);
    return o;
  }

  function reroll(run) {
    if (!run.choice || run.choice.kind !== "mut" || run.rerolls <= 0) return false;
    run.rerolls--;
    run.choice = makeChoice(run, "mut");
    return true;
  }

  function optTag(o) {
    if (o.k === "skill") return D.SKILLS[o.id].tag;
    if (o.k === "mut") return D.MUTS[o.id].tag;
    return null;
  }

  /* 自动选择：prefs 为偏好标签数组；为空时沿用当前形态的亲和标签。 */
  function autoPick(run, prefs) {
    const c = run.choice;
    if (!c) return null;
    let pf = {};
    for (const t of prefs || []) pf[t] = 1;
    if (!Object.keys(pf).length) pf = affTags(run);
    const any = Object.keys(pf).length > 0;
    let best = 0, bs = -1;
    c.opts.forEach((o, i) => {
      let s = rnd(run) * 0.5;
      if (o.k === "form") {
        for (const a of D.FORMS[o.id].aff) if (pf[a]) s += 2;
      } else if (o.k === "skill") {
        const owned = run.skills.some((x) => x.id === o.id);
        const p = pf[D.SKILLS[o.id].tag];
        s += owned ? (p ? 6 : 3) : p ? 7 : any ? 1.5 : 4;
      } else {
        const m = D.MUTS[o.id];
        s += 1 + m.rar + (m.tag ? (pf[m.tag] ? 3.5 : -1) : 0.8);
      }
      if (s > bs) (bs = s), (best = i);
    });
    return pick(run, best);
  }

  /* ---------- 战斗结算 ---------- */
  function fx(run, o) {
    if (run.fx.length < 160) run.fx.push(o);
  }
  function heal(run, a) {
    run.hp += a;
    if (run.hp > run.maxHp) {
      const ex = run.hp - run.maxHp;
      run.hp = run.maxHp;
      if (run.st.overheal) run.sh = Math.min(run.st.shield + (run.maxHp * run.st.overheal) / 100, run.sh + ex);
    }
  }
  function addPoison(run, e, n, per) {
    e.psn = Math.min(run.st.poisonCap, e.psn + n);
    e.psnD = Math.max(e.psnD, per);
    e.psnT = 4 * (1 + run.st.dur / 100);
  }

  function hit(run, e, base, tag, o) {
    if (e.dead) return 0;
    const s = run.st;
    o = o || {};
    let d = base * (1 + (s.dmg + (s[tag + "Inc"] || 0)) / 100) * run.more;
    let crit = false;
    if (!o.dot) {
      if (rnd(run) * 100 < s.crit) {
        crit = true;
        d *= 1.5 + s.critDmg / 100;
      }
      if (s.shatter && (e.frz > 0 || e.chill > 0)) d *= 1 + s.shatter / 100;
      d *= 1 - e.arm;
      if (crit && s.execute && !e.boss && e.hp - d < (e.max * s.execute) / 100) d = Math.max(d, e.hp);
    }
    e.hp -= d;
    e.ht = run.t;
    run.dmgBy[tag] += d;
    if (!o.dot) {
      if (s.leech) heal(run, (d * s.leech) / 100);
      if (tag === "cold") {
        e.chill = 2.5;
        if (rnd(run) * 100 < s.freeze) e.frz = Math.max(e.frz, e.boss ? 0.4 : 1.4);
      } else if (tag === "fire" && !o.noBurn) {
        e.burn = Math.max(e.burn, base * 0.5);
        e.burnT = 3 * (1 + s.dur / 100);
      } else if (tag === "light" && !o.sec) {
        if (s.overload && e.burnT > 0) run.q.push({ x: e.x, y: e.y, r: 48, base: (base * s.overload) / 100, tag: "fire", o: { sec: 1 } });
        if (s.dblLight && rnd(run) * 100 < s.dblLight) run.q.push({ e, base, tag: "light", o: { sec: 1 } });
      }
    }
    fx(run, { t: "num", x: e.x, y: e.y - e.r, v: d, tag, crit, dot: o.dot });
    if (e.hp <= 0) kill(run, e);
    return d;
  }

  function aoe(run, x, y, r, base, tag, o, fn) {
    const R = r * (1 + run.st.area / 100);
    fx(run, { t: "boom", x, y, r: R, tag });
    for (const e of run.enemies) {
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - y, rr = R + e.r;
      if (dx * dx + dy * dy <= rr * rr) {
        hit(run, e, base, tag, o);
        if (fn && !e.dead) fn(e);
      }
    }
  }

  function kill(run, e) {
    if (e.dead) return;
    e.dead = true;
    const s = run.st;
    run.kills++;
    run.xp += e.xp * (1 + s.xp / 100);
    if (s.frenzy) {
      run.frenzy = Math.min(40, run.frenzy + s.frenzy);
      run.frenzyT = 5;
    }
    if (s.soul) run.soul = Math.min(200, run.soul + s.soul);
    if (s.killHeal) heal(run, s.killHeal);
    if (!e.boss) {
      if (s.burnExplode && e.burnT > 0) {
        const burn = e.burn;
        run.q.push({ x: e.x, y: e.y, r: 52, base: (e.max * s.burnExplode) / 100, tag: "fire", o: { noBurn: 1, sec: 1 }, burn });
      }
      if (s.iceShard && (e.frz > 0 || e.chill > 0)) run.q.push({ x: e.x, y: e.y, r: 50, base: (6 + run.lvl * 0.8) * s.iceShard / 100, tag: "cold", o: {} });
    }
    if (s.poisonSpread && e.psn > 0) {
      const n = Math.ceil((e.psn * Math.min(100, s.poisonSpread)) / 100);
      let c = 0;
      for (const o of run.enemies) {
        if (o.dead || c >= 3) continue;
        const dx = o.x - e.x, dy = o.y - e.y;
        if (dx * dx + dy * dy < 70 * 70) {
          addPoison(run, o, n, e.psnD);
          c++;
        }
      }
      if (c) fx(run, { t: "boom", x: e.x, y: e.y, r: 40, tag: "poison" });
    }
    if (e.split) for (let i = 0; i < 2; i++) spawn(run, "mite", e.x + (i ? 8 : -8), e.y);
    if (e.boss) {
      run.bosses++;
      run.bossAlive = false;
      if (run.wave >= D.WAVES) run.over = "win";
      else {
        run.wt = Math.max(run.wt, D.WAVE_T);
        if (run.wave === 5 || run.wave === 15) run.pend.push("evo");
      }
    }
    fx(run, { t: "die", x: e.x, y: e.y, r: e.r, c: e.c, boss: e.boss });
  }

  function hurt(run, amt, e) {
    const s = run.st;
    if (rnd(run) * 100 < s.dodge) {
      fx(run, { t: "txt", x: 0, y: -PR - 6, v: "闪避" });
      return;
    }
    amt *= 100 / (100 + s.armor);
    run.shT = 0;
    run.hurtT = 0.18;
    if (run.sh > 0) {
      const a = Math.min(run.sh, amt);
      run.sh -= a;
      amt -= a;
    }
    run.hp -= amt;
    fx(run, { t: "hurt", v: amt });
    if (e && !e.dead) {
      if (s.thornPoison) addPoison(run, e, s.thornPoison, 2.2);
      if (s.thorns) hit(run, e, s.thorns * (1 + s.armor / 100), "armor");
    }
    if (run.hp <= 0) {
      if (run.revived < s.revive) {
        run.revived++;
        run.hp = run.maxHp * 0.5;
        run.q.push({ x: 0, y: 0, r: 130, base: 40 + run.lvl * 8, tag: "phys", o: {}, stun: 1.5 });
        fx(run, { t: "txt", x: 0, y: -PR - 14, v: "第二心脏" });
      } else {
        run.hp = 0;
        run.over = "dead";
      }
    }
  }

  function spawn(run, type, x, y) {
    const E = D.ENEMIES[type], df = D.DIFFS[run.diff], w = run.wave;
    const elite = !E.boss && type !== "mite" && w >= 12 && rnd(run) < 0.03 + w * 0.002;
    if (x === undefined) {
      const a = rnd(run) * Math.PI * 2, d = 195 + rnd(run) * 25;
      x = Math.cos(a) * d;
      y = Math.sin(a) * d;
    }
    const hp = E.hp * hpMul(w) * df.hp * (elite ? 4 : 1) * (E.boss ? 1 + w / 10 : 1);
    const e = {
      id: run.eid++, type, x, y, hp, max: hp, sp: E.sp * (0.9 + rnd(run) * 0.2), dm: E.dm * dmMul(w) * df.dm * (elite ? 1.5 : 1),
      r: E.r * (elite ? 1.35 : 1), xp: E.xp * (elite ? 5 : 1), arm: E.arm || 0, boss: !!E.boss, ranged: !!E.ranged, bomb: !!E.bomb,
      split: !!E.split, elite, c: E.c, at: rnd(run), psn: 0, psnD: 0, psnT: 0, burn: 0, burnT: 0, chill: 0, frz: 0, oc: 0, dt: rnd(run) * 0.5, dead: false,
    };
    run.enemies.push(e);
    if (e.boss) {
      run.bossAlive = true;
      fx(run, { t: "txt", x: 0, y: -60, v: "领主降临", big: 1 });
    }
    return e;
  }

  function pickType(run) {
    let tot = 0;
    const w = run.wave;
    for (const id in D.ENEMIES) if (D.ENEMIES[id].w <= w) tot += D.ENEMIES[id].wt;
    let r = rnd(run) * tot;
    for (const id in D.ENEMIES) {
      const E = D.ENEMIES[id];
      if (E.w > w) continue;
      r -= E.wt;
      if (r <= 0) return id;
    }
    return "grunt";
  }

  /* 离 (x,y) 最近的 n 个敌人；range 以敌人边缘计。 */
  function nearest(run, x, y, range, n) {
    const out = [];
    for (const e of run.enemies) {
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - y, d = Math.sqrt(dx * dx + dy * dy) - e.r;
      if (d <= range) out.push({ e, d });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, n).map((o) => o.e);
  }

  const CAST = {
    claw(run, sk, m, ex) {
      const ts = nearest(run, 0, 0, PR + 46, 2 + ex);
      if (!ts.length) return false;
      for (const e of ts) {
        fx(run, { t: "slash", x: e.x, y: e.y });
        hit(run, e, sk.b * m, "phys");
      }
      return true;
    },
    spike(run, sk, m, ex) {
      const ts = nearest(run, 0, 0, 230, 1 + ex);
      if (!ts.length) return false;
      for (let i = 0; i < 1 + ex; i++) {
        const e = ts[i % ts.length];
        const a = Math.atan2(e.y, e.x) + (i >= ts.length ? (i - ts.length + 1) * 0.18 : 0);
        run.projs.push({ x: 0, y: 0, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 1.1, pierce: 2, base: sk.b * m, hitIds: [] });
      }
      return true;
    },
    spore(run, sk, m, ex) {
      const ts = nearest(run, 0, 0, 200, 99);
      if (!ts.length) return false;
      for (let i = 0; i < 1 + ex; i++) {
        const e = ts[Math.floor(rnd(run) * ts.length)];
        run.clouds.push({ x: e.x, y: e.y, r: 36 * (1 + run.st.area / 100), life: 3 * (1 + run.st.dur / 100), tk: 0, per: sk.b * m });
      }
      return true;
    },
    flame(run, sk, m, ex) {
      const R = 105 * (1 + run.st.area / 200);
      const ts = nearest(run, 0, 0, R, 1);
      if (!ts.length) return false;
      const a = Math.atan2(ts[0].y, ts[0].x), half = 0.5 + ex * 0.15;
      fx(run, { t: "cone", a, half, r: R });
      for (const e of run.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x, e.y) - e.r;
        if (d > R) continue;
        let da = Math.atan2(e.y, e.x) - a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) <= half || d < PR + 6) hit(run, e, sk.b * m, "fire");
      }
      return true;
    },
    arc(run, sk, m, ex) {
      const first = nearest(run, 0, 0, 210, 1)[0];
      if (!first) return false;
      let cur = first, px = 0, py = 0, b = sk.b * m;
      const seen = {};
      for (let i = 0; i < 3 + ex + run.st.chain && cur; i++) {
        seen[cur.id] = 1;
        fx(run, { t: "bolt", x1: px, y1: py, x2: cur.x, y2: cur.y });
        px = cur.x;
        py = cur.y;
        hit(run, cur, b, "light");
        b *= 0.88;
        let nx = null, nd = 90 * 90;
        for (const e of run.enemies) {
          if (e.dead || seen[e.id]) continue;
          const dx = e.x - px, dy = e.y - py, d = dx * dx + dy * dy;
          if (d < nd) (nd = d), (nx = e);
        }
        cur = nx;
      }
      return true;
    },
    nova(run, sk, m, ex) {
      const R = 92 * (1 + ex * 0.15);
      if (!nearest(run, 0, 0, R * (1 + run.st.area / 100), 1).length) return false;
      aoe(run, 0, 0, R, sk.b * m, "cold");
      return true;
    },
    drain(run, sk, m, ex) {
      const ts = nearest(run, 0, 0, 170, 99);
      if (!ts.length) return false;
      ts.sort((a, b) => b.hp - a.hp);
      for (const e of ts.slice(0, 1 + ex)) {
        fx(run, { t: "beam", x: e.x, y: e.y });
        heal(run, hit(run, e, sk.b * m, "blood") * 0.35);
      }
      return true;
    },
    thorn(run, sk, m, ex) {
      const R = 70 * (1 + ex * 0.15);
      if (!nearest(run, 0, 0, R * (1 + run.st.area / 100), 1).length) return false;
      aoe(run, 0, 0, R, sk.b * m + run.st.armor * 0.25, "armor");
      return true;
    },
  };

  function minionBite(run, mn, e, base) {
    const s = run.st;
    hit(run, e, base, "brood");
    if (s.minionSplash) run.q.push({ x: e.x, y: e.y, r: 30, base: (base * s.minionSplash) / 100, tag: "brood", o: {}, quiet: 1 });
    if (s.minionPoison && !e.dead) addPoison(run, e, s.minionPoison, 2.2);
    if (s.symb) {
      heal(run, run.maxHp * 0.004);
      if (!e.dead) {
        addPoison(run, e, 1, 2.2);
        e.burn = Math.max(e.burn, base * 0.5);
        e.burnT = 3;
        e.chill = 2;
      }
    }
  }

  function step(run, dt) {
    if (run.over || run.choice) return;
    if (run.pend.length) {
      run.choice = makeChoice(run, run.pend.shift());
      if (run.choice) return;
    }
    const s = run.st;
    run.t += dt;

    /* 波次 */
    const W = run.wave, bossW = W % 5 === 0;
    if (!run.started) {
      run.started = 1;
      snapshot(run);
      if (bossW) spawn(run, "boss");
    }
    run.wt += dt;
    const N = (6 + 2.4 * W) * (bossW ? 0.5 : 1);
    if (run.wt < 15) run.debt += (N / 15) * dt;
    else if (bossW && run.bossAlive) run.debt += (N / 30) * dt;
    while (run.debt >= 1 && run.enemies.length < 70) {
      run.debt--;
      spawn(run, pickType(run));
    }
    if (run.wt >= D.WAVE_T && !(bossW && run.bossAlive)) {
      run.wave++;
      run.wt = 0;
      run.started = 0;
    }

    /* 自身状态 */
    heal(run, s.regen * dt);
    run.shT += dt;
    if (run.shT > 3 && run.sh < s.shield) run.sh = Math.min(s.shield, run.sh + s.shield * 0.25 * dt);
    if (run.frenzyT > 0 && (run.frenzyT -= dt) <= 0) run.frenzy = 0;
    if (run.hurtT > 0) run.hurtT -= dt;
    run.more = (1 + (s.hpToDmg * run.maxHp) / 10000) * (1 + run.soul / 100) * (1 + (s.lowHp / 100) * (1 - run.hp / run.maxHp));
    const haste = Math.max(0.3, 1 + (s.atkSpd + run.frenzy) / 100);

    /* 技能 */
    let orb = null, brood = null;
    for (const k of run.skills) {
      const sk = D.SKILLS[k.id];
      if (k.id === "orbit") orb = k;
      else if (k.id === "brood") brood = k;
      else if ((k.cd -= dt * haste) <= 0) k.cd = CAST[k.id](run, sk, lvlMul(k.lvl), extra(k.lvl) + s.proj) ? sk.cd : 0.12;
    }
    if (orb) {
      run.orbA += 2.6 * dt * haste;
      const n = 2 + extra(orb.lvl) + s.proj, R = 50 * (1 + s.area / 200), b = D.SKILLS.orbit.b * lvlMul(orb.lvl);
      run.orbN = n;
      run.orbR = R;
      for (let i = 0; i < n; i++) {
        const a = run.orbA + (i * Math.PI * 2) / n, ox = Math.cos(a) * R, oy = Math.sin(a) * R;
        for (const e of run.enemies) {
          if (e.dead || e.oc > 0) continue;
          const dx = e.x - ox, dy = e.y - oy, rr = e.r + 8;
          if (dx * dx + dy * dy < rr * rr) {
            e.oc = 0.4;
            hit(run, e, b, "phys");
          }
        }
      }
    } else run.orbN = 0;

    /* 幼虫 */
    const mc = (brood ? 2 + (brood.lvl >= 2 ? 1 : 0) + (brood.lvl >= 4 ? 1 : 0) + s.proj : 0) + s.minions;
    while (run.minions.length < mc) run.minions.push({ x: 0, y: 0, cd: 0, a: run.minions.length * 2.4 });
    run.minions.length = Math.min(run.minions.length, mc);
    const mb = D.SKILLS.brood.b * lvlMul(brood ? brood.lvl : 1);
    for (const mn of run.minions) {
      mn.cd -= dt * haste;
      let tg = null, td = 1e9;
      for (const e of run.enemies) {
        if (e.dead || e.x * e.x + e.y * e.y > 150 * 150) continue;
        const dx = e.x - mn.x, dy = e.y - mn.y, d = dx * dx + dy * dy;
        if (d < td) (td = d), (tg = e);
      }
      let tx, ty;
      if (tg) (tx = tg.x), (ty = tg.y);
      else {
        mn.a += dt;
        tx = Math.cos(mn.a) * 34;
        ty = Math.sin(mn.a) * 34;
      }
      const dx = tx - mn.x, dy = ty - mn.y, d = Math.hypot(dx, dy) || 1, mv = Math.min(d, 130 * dt);
      mn.x += (dx / d) * mv;
      mn.y += (dy / d) * mv;
      if (tg && d < tg.r + 8 && mn.cd <= 0) {
        mn.cd = 0.6;
        minionBite(run, mn, tg, mb);
      }
    }

    /* 弹体与毒云 */
    for (const p of run.projs) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      for (const e of run.enemies) {
        if (e.dead || p.life <= 0 || p.hitIds.indexOf(e.id) >= 0) continue;
        const dx = e.x - p.x, dy = e.y - p.y, rr = e.r + 5;
        if (dx * dx + dy * dy < rr * rr) {
          p.hitIds.push(e.id);
          hit(run, e, p.base, "phys");
          if (--p.pierce < 0) p.life = 0;
        }
      }
    }
    for (const c of run.clouds) {
      c.life -= dt;
      if ((c.tk -= dt) <= 0) {
        c.tk = 0.5;
        for (const e of run.enemies) {
          if (e.dead) continue;
          const dx = e.x - c.x, dy = e.y - c.y, rr = c.r + e.r;
          if (dx * dx + dy * dy < rr * rr) addPoison(run, e, 1, c.per);
        }
      }
    }
    for (const p of run.eprojs) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x * p.x + p.y * p.y < PR * PR) {
        p.dead = true;
        hurt(run, p.dm, null);
      }
    }

    /* 敌人 */
    for (const e of run.enemies) {
      if (e.dead) continue;
      if (e.oc > 0) e.oc -= dt;
      if (e.chill > 0) e.chill -= dt;
      if (e.psnT > 0 && (e.psnT -= dt) <= 0) e.psn = 0;
      if (e.burnT > 0 && (e.burnT -= dt) <= 0) e.burn = 0;
      if ((e.dt -= dt) <= 0) {
        e.dt = 0.5;
        if (e.psn > 0) hit(run, e, e.psn * e.psnD * 0.5, "poison", { dot: 1 });
        if (e.burn > 0 && !e.dead) hit(run, e, e.burn * 0.5, "fire", { dot: 1 });
        if (e.dead) continue;
      }
      if (e.frz > 0) {
        e.frz -= dt;
        continue;
      }
      const d = Math.hypot(e.x, e.y) || 1, stop = e.ranged ? 118 : PR + e.r;
      if (d > stop) {
        const mv = e.sp * (e.chill > 0 ? 0.6 : 1) * dt;
        e.x -= (e.x / d) * mv;
        e.y -= (e.y / d) * mv;
      } else if ((e.at -= dt) <= 0) {
        if (e.ranged) {
          e.at = 2.2;
          run.eprojs.push({ x: e.x, y: e.y, vx: (-e.x / d) * 110, vy: (-e.y / d) * 110, dm: e.dm });
        } else if (e.bomb) {
          fx(run, { t: "boom", x: e.x, y: e.y, r: 26, tag: "fire" });
          hurt(run, e.dm, null);
          kill(run, e);
        } else {
          e.at = 1.2;
          hurt(run, e.dm, e);
        }
        if (run.over) return;
      }
    }

    /* 连锁效果队列：逐步处理，避免递归爆栈 */
    let guard = 40;
    while (run.q.length && guard-- > 0) {
      const a = run.q.shift();
      if (a.e) hit(run, a.e, a.base, a.tag, a.o);
      else
        aoe(run, a.x, a.y, a.r, a.base, a.tag, a.o, (e) => {
          if (a.burn) {
            e.burn = Math.max(e.burn, a.burn);
            e.burnT = 3 * (1 + s.dur / 100);
          }
          if (a.stun) e.frz = Math.max(e.frz, e.boss ? 0.5 : a.stun);
        });
    }

    /* 清理与升级 */
    if (run.kills !== run._k) {
      run._k = run.kills;
      run.enemies = run.enemies.filter((e) => !e.dead);
    }
    run.projs = run.projs.filter((p) => p.life > 0);
    run.clouds = run.clouds.filter((c) => c.life > 0);
    run.eprojs = run.eprojs.filter((p) => !p.dead);
    while (run.xp >= need(run.lvl)) {
      run.xp -= need(run.lvl);
      run.lvl++;
      if (run.lvl === 3 && !run.forms.length) run.pend.push("evo");
      run.pend.push("mut");
      fx(run, { t: "lvl" });
    }
  }

  function dnaOf(run) {
    const df = D.DIFFS[run.diff];
    return Math.round(((run.wave - 1) * 1.2 + run.bosses * 5 + (run.over === "win" ? 25 : 0)) * df.dna * (1 + run.st.dna / 100));
  }

  G.EvoSim = { newRun, restore, step, pick, reroll, autoPick, recalc, need, dnaOf, lvlMul, extra, optTag, PR };
})(typeof window !== "undefined" ? window : globalThis);

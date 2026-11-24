/* 万变之种：界面、主循环、存档与挂机结算。界面文字遵循 docs/copy-guide.md。 */
(function () {
  const D = EvoData, S = EvoSim, R = EvoRender, A = EvoAudio;
  const $ = (id) => document.getElementById(id);
  const KEY = "evoSeed.save.v1", DT = 1 / 30, OFFLINE_CAP = 8 * 3600;
  const RAR = ["", "普通变异", "稀有变异", "史诗变异"], RARC = ["", R.PAL.bone, R.PAL.volt, R.PAL.swarm];
  const cv = $("cv"), ctx = cv.getContext("2d");
  cv.width = cv.height = R.RES;
  let save = load(), run = null, paused = false, tab = "build", acc = 0, lastT = 0;
  let modal = null, peek = false, idleT = 0, autoT = 0, restartT = 0, panelT = 0, saveT = 0, sig = "", lastSnap = null, cache = {};

  function fresh() {
    return { v: 1, dna: 0, meta: {}, diff: 0, diffMax: 0, best: {}, codex: {}, runs: 0, wins: 0, hist: [], opt: { auto: false, autoBuy: false, calm: false, prefs: [], speed: 1, snd: true }, snap: null, live: null, wall: 0, last: Date.now() };
  }
  function num(v, lo, hi, d) {
    return typeof v === "number" && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d;
  }
  function obj(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  }
  /* 读档与导入共用：逐字段校验，任何不合法的值回落到默认值，绝不抛错。 */
  function sanitize(raw) {
    const f = fresh(), r = obj(raw), o = obj(r.opt), nD = D.DIFFS.length;
    f.dna = Math.floor(num(r.dna, 0, 1e9, 0));
    for (const id in D.META) {
      const lv = Math.floor(num(obj(r.meta)[id], 0, D.META[id].max, 0));
      if (lv) f.meta[id] = lv;
    }
    f.diffMax = Math.floor(num(r.diffMax, 0, nD - 1, 0));
    f.diff = Math.floor(num(r.diff, 0, f.diffMax, 0));
    for (let i = 0; i < nD; i++) {
      const b = Math.floor(num(obj(r.best)[i], 0, D.WAVES + 1, 0));
      if (b) f.best[i] = b;
    }
    for (const id in D.FORMS) if (obj(r.codex)[id]) f.codex[id] = 1;
    f.runs = Math.floor(num(r.runs, 0, 1e9, 0));
    f.wins = Math.floor(num(r.wins, 0, f.runs, 0));
    if (Array.isArray(r.hist)) for (const h of r.hist.slice(-5)) if (h && num(h.dna, 0, 1e7, -1) >= 0 && num(h.wall, 1, 1e6, 0) > 0) f.hist.push({ dna: h.dna, wall: h.wall });
    f.opt.auto = o.auto === true;
    f.opt.autoBuy = o.autoBuy === true;
    f.opt.calm = o.calm === true;
    f.opt.snd = o.snd !== false;
    f.opt.speed = [1, 2, 4].includes(o.speed) ? o.speed : 1;
    if (Array.isArray(o.prefs)) f.opt.prefs = o.prefs.filter((t, i, arr) => D.TAGS[t] && arr.indexOf(t) === i);
    const sn = r.snap;
    if (sn && typeof sn === "object" && Array.isArray(sn.skills) && Array.isArray(sn.forms) && Array.isArray(sn.pend) && num(sn.wave, 1, D.WAVES, 0) && num(sn.diff, 0, nD - 1, -1) >= 0 && num(sn.hpF, 0, 1, -1) >= 0 && typeof sn.muts === "object" && sn.muts && typeof sn.dmgBy === "object" && sn.dmgBy) f.snap = sn;
    f.live = f.snap && num(obj(r.live).hpF, 0, 1, -1) >= 0 ? { hpF: r.live.hpF } : null;
    f.wall = num(r.wall, 0, 1e6, 0);
    f.last = num(r.last, 0, Date.now(), Date.now());
    return f;
  }
  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
      const s = JSON.parse(raw);
      if (s && s.v === 1) {
        try {
          localStorage.setItem(KEY + ".bak", raw);
        } catch (e) {}
        return sanitize(s);
      }
    } catch (e) {}
    return fresh();
  }
  function persist() {
    save.last = Date.now();
    if (run && !run.over) save.live = { hpF: run.hp / run.maxHp };
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (e) {}
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmt = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + "m" : v >= 1e4 ? (v / 1e3).toFixed(1) + "k" : String(Math.round(v)));
  const tagChip = (t) => (t ? `<span class="tag" style="--tc:${D.TAGS[t].c}">${D.TAGS[t].n}</span>` : "");
  const img = (id, col) => `<img class="px" alt="" src="${R.icon(id, col)}">`;
  const dnaImg = () => img("dna", R.PAL.amber);
  function set(id, prop, v) {
    const k = id + prop;
    if (cache[k] === v) return;
    cache[k] = v;
    if (prop === "w") $(id).style.width = v + "%";
    else $(id)[prop] = v;
  }
  function toast(msg) {
    const el = document.createElement("span");
    el.textContent = msg;
    const box = $("toast");
    box.appendChild(el);
    while (box.children.length > 2) box.firstChild.remove();
    setTimeout(() => el.remove(), 2400);
  }
  function formPath(id) {
    const p = [];
    for (let k = id; k; k = D.FORMS[k].p) p.unshift(k);
    return p;
  }
  function paintPreviews(root) {
    root.querySelectorAll("canvas[data-form]").forEach((el) => R.preview(el, el.dataset.form ? formPath(el.dataset.form) : []));
  }
  const diffName = (i) => D.DIFFS[i].n;
  const bestText = (b) => (b ? (b > D.WAVES ? "已完成" : "最远第 " + b + " 波") : "");

  /* ---------- 对局生命周期 ---------- */
  function startRun(snap) {
    A.unlock();
    if (snap) {
      try {
        run = S.restore(snap, save.meta);
        if (save.live) run.hp = Math.max(1, Math.min(run.hp, run.maxHp * save.live.hpF));
      } catch (e) {
        run = null;
        save.snap = null;
        persist();
        showStart();
        return toast("上一局的记录已损坏，无法继续。请开始新的一局。");
      }
    } else {
      run = S.newRun(save.meta, save.diff, (Math.random() * 2147483647) | 0);
      save.runs++;
      save.wall = 0;
      save.live = null;
    }
    lastSnap = run.snap;
    save.snap = run.snap;
    R.clear();
    paused = false;
    peek = false;
    restartT = 0;
    closeModal();
    $("start").hidden = true;
    sig = "";
    persist();
    renderPanel();
  }

  function endRun() {
    const win = run.over === "win", dna = S.dnaOf(run);
    save.dna += dna;
    save.snap = null;
    save.hist.push({ dna, wall: Math.max(20, save.wall) });
    save.live = null;
    if (save.hist.length > 5) save.hist.shift();
    const reach = win ? D.WAVES + 1 : run.wave, best = save.best[run.diff] || 0, newBest = reach > best;
    if (newBest) save.best[run.diff] = reach;
    let unlock = "";
    if (win) {
      save.wins++;
      if (run.diff === save.diffMax && save.diffMax < D.DIFFS.length - 1) {
        save.diffMax++;
        unlock = diffName(save.diffMax);
      }
    }
    persist();
    A.sfx(win ? "win" : "dead");
    const top = Object.keys(run.dmgBy).sort((a, b) => run.dmgBy[b] - run.dmgBy[a])[0];
    const names = ["原初之种"].concat(run.forms.map((f) => D.FORMS[f].n)).join(" > ");
    const m = Math.floor(run.t / 60), s = Math.floor(run.t % 60);
    openModal(
      "end",
      `<div class="dlg">
        <h2 class="${win ? "evo" : ""}">${win ? "培养完成" : "培养终止"}</h2>
        <p>${win ? `种子在「${diffName(run.diff)}」活过了全部 ${D.WAVES} 波` : `种子在「${diffName(run.diff)}」第 ${run.wave} 波死亡`}${newBest && !win && best ? "，比上次走得更远" : ""}</p>
        <div class="dna-gain">${dnaImg()}+${fmt(dna)}</div>
        <div class="sum">
          <div class="stat"><span>到达</span><b>第 ${run.wave} 波</b></div>
          <div class="stat"><span>等级</span><b>${run.lvl}</b></div>
          <div class="stat"><span>击杀</span><b>${fmt(run.kills)}</b></div>
          <div class="stat"><span>用时</span><b>${m}:${String(s).padStart(2, "0")}</b></div>
          <div class="stat"><span>主要伤害</span><b style="color:${D.TAGS[top].c}">${run.dmgBy[top] > 0 ? D.TAGS[top].n : "无"}</b></div>
          <div class="stat"><span>击杀领主</span><b>${run.bosses}</b></div>
        </div>
        <p>${esc(names)}</p>
        ${unlock ? `<p style="color:var(--amber)">新培养皿已开放：${unlock}</p><p><button class="btn ghost" data-diff="${save.diffMax}">下一局前往 ${unlock}</button></p>` : ""}
        <p id="cd"></p>
        <div class="rowb" style="justify-content:center">
          <button class="btn" data-act="again">再培养一局</button>
          <button class="btn ghost" data-act="gene">去做基因强化</button>
        </div>
      </div>`,
    );
    run = null;
    if (save.opt.auto && save.opt.autoBuy) autoBuy();
    restartT = save.opt.auto ? 4 : 0;
    renderPanel();
  }

  function diffButtons() {
    return D.DIFFS.map((d, i) => (i <= save.diffMax ? `<button class="tag ${i === save.diff ? "on" : ""}" style="--tc:var(--amber)" data-diff="${i}">${d.n}</button>` : `<span class="tag off">${d.n}</span>`)).join("");
  }
  function showStart() {
    const el = $("start");
    el.hidden = false;
    el.innerHTML = `<div class="box">
      <h1>万变之种</h1>
      <p>种子会自动战斗。<br>你来决定它变异成什么，进化成什么。</p>
      ${save.diffMax > 0 ? `<div class="diffs">${diffButtons()}</div>` : ""}
      ${save.snap ? `<div class="rowb" style="justify-content:center"><button class="btn big" data-act="resume">继续培养</button><button class="btn ghost" data-act="new">放弃并重新开始</button></div><p class="muted" style="margin-top:8px">从第 ${save.snap.wave} 波开头继续，生命保持离开时的数值</p>` : `<button class="btn big" data-act="new">开始培养</button>`}
      <p id="cd0" class="muted" style="margin:8px 0 0"></p>
    </div>`;
  }

  /* ---------- 弹窗 ---------- */
  function openModal(kind, html) {
    modal = kind;
    const m = $("modal");
    m.innerHTML = html;
    m.hidden = false;
    paintPreviews(m);
  }
  function closeModal() {
    modal = null;
    $("modal").hidden = true;
    $("modal").innerHTML = "";
  }

  function optInfo(o) {
    if (o.k === "skill") {
      const sk = D.SKILLS[o.id], own = run.skills.find((s) => s.id === o.id), pic = img(o.id, D.TAGS[sk.tag].c);
      if (!own) return { cls: "", pic, ttl: sk.n, sub: "新技能，攻击距离：" + sk.rg, dsc: sk.d, tag: sk.tag };
      const nl = own.lvl + 1, more = nl === 3 || nl === 5 || (o.id === "brood" && (nl === 2 || nl === 4));
      return { cls: "", pic, ttl: sk.n, sub: `技能升级 ${own.lvl} 级 > ${nl} 级`, dsc: `伤害提高到 ${Math.round(S.lvlMul(nl) * 100)}%` + (more ? "，数量 +1" : ""), tag: sk.tag };
    }
    if (o.k === "mut") {
      const m = D.MUTS[o.id], cur = run.muts[o.id] || 0;
      return { cls: "r" + m.rar, pic: img("cell", m.tag ? D.TAGS[m.tag].c : RARC[m.rar]), ttl: m.n, sub: RAR[m.rar] + (m.max > 1 ? `，已有 ${cur}/${m.max}` : ""), dsc: m.d, tag: m.tag };
    }
    const f = D.FORMS[o.id];
    return { cls: "fm", pic: `<canvas data-form="${o.id}"></canvas>`, ttl: f.n, sub: `第 ${f.tier} 阶形态` + (save.codex[o.id] ? "" : "，首次遇见"), dsc: f.d + `<br><span class="muted">之后更容易出现${f.aff.map((t) => D.TAGS[t].n).join("、")}的技能与变异</span>`, tags: f.aff };
  }

  function showChoice() {
    const c = run.choice, evo = c.kind === "evo";
    const title = evo ? "进化" : c.kind === "skill" ? "选择第一个技能" : "选择变异";
    const sub = evo ? "选定后本局不能更改" : c.kind === "skill" ? "技能会自动释放" : `等级 ${run.lvl}，技能 ${run.skills.length}/${run.slots}`;
    const cards = c.opts
      .map((o, i) => {
        const f = optInfo(o);
        return `<button class="card ${f.cls}"${o.k === "skill" ? ` style="--rc:${D.TAGS[f.tag].c}"` : ""} data-pick="${i}"><div class="pic">${f.pic}</div><div><div class="ttl">${f.ttl}${tagChip(f.tag)}${(f.tags || []).map(tagChip).join("")}</div><div class="sub">${f.sub}</div><div class="dsc">${f.dsc}</div></div><kbd>${i + 1}</kbd></button>`;
      })
      .join("");
    const re = c.kind === "mut" && run.st.rerolls > 0 ? `<button class="btn ghost" data-act="reroll" ${run.rerolls > 0 ? "" : "disabled"}>重抽这一组（剩 ${run.rerolls} 次）</button>` : "";
    openModal("choice", `<div class="dlg"><h2 class="${evo ? "evo" : ""}">${title}</h2><p>${sub}</p><div class="cards">${cards}</div><div class="rowb" style="justify-content:center;margin-top:12px">${re}<button class="btn ghost" data-act="peek">先看看本局</button></div></div>`);
    if (evo) A.sfx("evo");
  }

  function afterPick(o, auto) {
    if (!o) return;
    const nm = o.k === "skill" ? D.SKILLS[o.id].n : o.k === "mut" ? D.MUTS[o.id].n : D.FORMS[o.id].n;
    if (o.k === "form") {
      const isNew = !save.codex[o.id];
      save.codex[o.id] = 1;
      R.pulse();
      A.sfx("evo");
      toast((isNew ? "新形态 " : "进化为 ") + nm);
      persist();
    } else {
      A.sfx("pick");
      if (auto) toast("自动选择 " + nm);
    }
    sig = "";
    renderPanel();
  }

  /* ---------- 常驻界面 ---------- */
  function hud() {
    set("dna", "textContent", fmt(save.dna));
    set("app", "className", run ? "" : "idle");
    if (!run) return set("bossBar", "hidden", true);
    const bossW = run.wave % 5 === 0;
    set("wv", "textContent", `第 ${run.wave} 波`);
    set("wvBar", "w", Math.round(Math.min(1, run.wt / D.WAVE_T) * 100));
    set("diffN", "textContent", diffName(run.diff).split(" ")[0]);
    set("hpBar", "w", Math.round((run.hp / run.maxHp) * 100));
    set("shBar", "w", Math.round(Math.min(1, run.sh / run.maxHp) * 100));
    set("hpTxt", "textContent", Math.ceil(run.hp) + " / " + run.maxHp + (run.sh > 1 ? " +" + Math.round(run.sh) : ""));
    set("lvTxt", "textContent", run.lvl + " 级");
    set("xpBar", "w", Math.round((run.xp / S.need(run.lvl)) * 100));
    set("formN", "textContent", run.forms.length ? D.FORMS[run.forms[run.forms.length - 1]].n : "原初之种");
    let boss = null;
    if (bossW && run.bossAlive) boss = run.enemies.find((e) => e.boss && !e.dead);
    set("bossBar", "hidden", !boss);
    if (boss) set("bossFill", "w", Math.round((boss.hp / boss.max) * 100));
    const ns = run.skills.map((s) => s.id + s.lvl).join() + run.slots;
    if (ns !== sig) {
      sig = ns;
      let h = "";
      for (let i = 0; i < 4; i++) {
        const s = run.skills[i];
        if (s) {
          const sk = D.SKILLS[s.id], col = D.TAGS[sk.tag].c;
          h += `<div class="slot" style="--tc:${col}" data-tip="${esc(sk.n + "，" + sk.d)}">${img(s.id, col)}<div class="nm">${sk.n}</div><div class="pips">${[1, 2, 3, 4, 5].map((n) => `<b class="${n <= s.lvl ? "f" : ""}"></b>`).join("")}</div></div>`;
        } else h += i < run.slots ? `<div class="slot empty" data-tip="升级时有机会获得新技能"><div class="ph">+</div><div class="nm">空技能位</div><div class="pips"></div></div>` : `<div class="slot lock" data-tip="第二次进化后开放第 4 个技能位"><div class="ph">${img("lock", R.PAL.bruise)}</div><div class="nm">二阶开放</div><div class="pips"></div></div>`;
      }
      $("skills").innerHTML = h;
    }
  }

  function nextEvoHint() {
    const n = run.forms.length;
    return n === 0 ? "下一次进化：等级 3" : n === 1 ? "下一次进化：击杀第 5 波的领主" : n === 2 ? "最后一次进化：击杀第 15 波的领主" : "已是终极形态。击杀第 30 波的领主即完成培养";
  }

  function panelBuild() {
    if (!run) {
      const b = save.best[save.diff];
      return `<h3>还没有开始培养</h3><p>点击培养皿里的按钮开始。${save.runs ? `已培养 ${save.runs} 局，完成 ${save.wins} 局。` : ""}</p>
        <p class="muted">${diffName(save.diff)}${b ? "，" + bestText(b) : ""}</p><p class="muted">图鉴 ${Object.keys(save.codex).length}/${Object.keys(D.FORMS).length}</p>`;
    }
    const s = run.st, tot = Object.values(run.dmgBy).reduce((a, b) => a + b, 0) || 1;
    const path = ["原初之种"].concat(run.forms.map((f) => D.FORMS[f].n)).join(" > ");
    const stats = [
      ["生命上限", run.maxHp], ["护甲减伤", Math.round((1 - 100 / (100 + s.armor)) * 100) + "%"], ["每秒回复", s.regen.toFixed(1)],
      ["伤害", "+" + Math.round(s.dmg + (run.more - 1) * 100) + "%"], ["攻击速度", "+" + Math.round(s.atkSpd + run.frenzy) + "%"], ["暴击率", Math.round(s.crit) + "%"],
    ];
    if (s.dodge) stats.push(["闪避率", Math.round(s.dodge) + "%"]);
    if (s.leech) stats.push(["吸血", s.leech + "%"]);
    if (s.shield) stats.push(["护盾", Math.round(s.shield)]);
    const dmg = Object.keys(run.dmgBy).filter((t) => run.dmgBy[t] > 0).sort((a, b) => run.dmgBy[b] - run.dmgBy[a])
      .map((t) => `<div><span style="color:${D.TAGS[t].c}">${D.TAGS[t].n}</span><div class="bar"><i style="width:${(run.dmgBy[t] / tot) * 100}%;background:${D.TAGS[t].c}"></i></div><em>${Math.round((run.dmgBy[t] / tot) * 100)}%</em></div>`).join("");
    const muts = Object.keys(run.muts).map((id) => `<span class="tag r${D.MUTS[id].rar}" data-tip="${esc(D.MUTS[id].n + "，" + D.MUTS[id].d)}">${D.MUTS[id].n}${run.muts[id] > 1 ? " x" + run.muts[id] : ""}</span>`).join("");
    return `<h3>进化路线</h3><p>${esc(path)}</p><p class="muted">${nextEvoHint()}</p>
      <h3>属性</h3><div class="stats">${stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
      <h3>伤害来源</h3><div class="dmg">${dmg || '<span class="muted">还没有造成伤害</span>'}</div>
      <h3>变异 ${Object.values(run.muts).reduce((a, b) => a + b, 0)} 个</h3><div class="tags">${muts || '<span class="muted">还没有变异。升级后从几个变异里选一个。</span>'}</div>`;
  }

  function panelTree() {
    const cur = run ? run.forms : [];
    const node = (id) => {
      const f = D.FORMS[id], known = save.codex[id];
      const open = known || f.tier === 1;
      return `<div class="node t${f.tier} ${cur.includes(id) ? "cur" : ""} ${known ? "" : "un"}"><canvas data-form="${id}"></canvas><div><b>${open ? f.n : "未收录"}</b>${known ? '<span class="ok">已收录</span>' : ""}${f.aff.map(tagChip).join(" ")}<small>${open ? f.d : "由" + D.FORMS[f.p].n + "进化而来。进化出这个形态后收录。"}</small></div></div>`;
    };
    let h = `<p class="muted">3 个系别，6 个亚种，12 个终极形态。已收录 ${Object.keys(save.codex).length}/${Object.keys(D.FORMS).length}</p><div class="tree">`;
    for (const a of ["A", "B", "C"]) {
      h += `<div class="fam">` + node(a);
      for (const b of [a + "1", a + "2"]) h += node(b) + node(b + "a") + node(b + "b");
      h += `</div>`;
    }
    return h + `</div>`;
  }

  const cleared = () => D.DIFFS.filter((d, i) => save.best[i] > D.WAVES).length;
  const metaOpen = (id) => (D.META[id].req || 0) <= cleared();
  function autoBuy() {
    for (let n = 0; n < 200; n++) {
      let pick = null, pc = Infinity;
      for (const id in D.META) {
        const c = metaCost(id);
        if (metaOpen(id) && (save.meta[id] || 0) < D.META[id].max && c <= save.dna && c < pc) (pick = id), (pc = c);
      }
      if (!pick) break;
      save.dna -= pc;
      save.meta[pick] = (save.meta[pick] || 0) + 1;
      toast("自动购买 " + D.META[pick].n);
    }
    persist();
  }
  const metaCost = (id) => Math.round(D.META[id].c * Math.pow(D.META[id].g, save.meta[id] || 0));
  function panelGene() {
    let h = `<h3>培养皿</h3><div class="tags">${diffButtons()}</div>
      <p class="muted" style="margin-top:6px">${diffName(save.diff)}：DNA x${D.DIFFS[save.diff].dna}${save.best[save.diff] ? "，" + bestText(save.best[save.diff]) : ""}。完成最高一级培养皿后开放下一级。</p>
      <h3>基因强化${run ? "（下一局生效）" : ""}</h3><div class="meta">`;
    for (const id in D.META) {
      const m = D.META[id], lv = save.meta[id] || 0, full = lv >= m.max, cost = metaCost(id);
      if (!metaOpen(id)) {
        h += `<div class="mrow"><div><b class="muted">${m.n}</b><small>完成 ${m.req} 个培养皿后开放</small></div><button class="btn" disabled>未开放</button></div>`;
        continue;
      }
      h += `<div class="mrow"><div><b>${m.n}</b><span class="lv">${lv}/${m.max}</span><small>${m.d}</small></div><button class="btn" data-buy="${id}" ${full || save.dna < cost ? "disabled" : ""}>${full ? "已满级" : dnaImg() + fmt(cost)}</button></div>`;
    }
    return h + `</div>`;
  }

  function panelOpt() {
    const prefs = Object.keys(D.TAGS).map((t) => `<button class="tag ${save.opt.prefs.includes(t) ? "on" : ""}" style="--tc:${D.TAGS[t].c}" data-pref="${t}">${D.TAGS[t].n}</button>`).join("");
    return `<h3>挂机</h3>
      <label class="sw"><div>挂机<small>自动选择变异和进化，死亡后自动开始下一局。关掉游戏后，按最近 5 局平均效率的 50% 结算 DNA，每小时最多 ${S.offlineHourCap()}，最多 8 小时。</small></div><input type="checkbox" data-opt="auto" ${save.opt.auto ? "checked" : ""}></label>
      <label class="sw"><div>挂机时自动购买基因强化<small>每局结束后，从最便宜的开始买。</small></div><input type="checkbox" data-opt="autoBuy" ${save.opt.autoBuy ? "checked" : ""}></label>
      <h3>挂机时优先选择</h3><div class="tags">${prefs}</div><p class="muted" style="margin-top:6px">不选时，跟随当前形态擅长的流派。</p>
      <h3>声音与画面</h3><label class="sw"><div>音效与音乐</div><input type="checkbox" data-opt="snd" ${save.opt.snd ? "checked" : ""}></label>
      <label class="sw"><div>减弱闪光与震动<small>关闭全屏闪光、画面震动和低生命红色闪烁。</small></div><input type="checkbox" data-opt="calm" ${save.opt.calm ? "checked" : ""}></label>
      <h3>存档</h3><div class="rowb"><button class="btn ghost" data-act="export">生成存档码</button><button class="btn ghost" data-act="import">读取存档码</button></div>
      <textarea id="io" placeholder="存档码显示在这里。换设备时，把存档码粘贴到这里，再点读取存档码。"></textarea>
      <h3>重置</h3><div class="rowb">${run ? `<button class="btn warn" data-act="quit">放弃本局</button>` : ""}<button class="btn warn" data-act="wipe">删除全部进度</button></div>
      <p class="muted" style="margin-top:10px">键盘：数字键选择，空格暂停，R 重抽，结算时回车开始下一局</p>`;
  }

  function syncTabs() {
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  }
  function renderPanel() {
    const p = $("panel");
    p.innerHTML = { build: panelBuild, tree: panelTree, gene: panelGene, opt: panelOpt }[tab]();
    paintPreviews(p);
    const can = Object.keys(D.META).some((id) => metaOpen(id) && (save.meta[id] || 0) < D.META[id].max && save.dna >= metaCost(id));
    document.querySelector('#tabs [data-tab="gene"]').innerHTML = "基因" + (can ? '<i class="dot"></i>' : "");
    const a = $("bAuto");
    a.textContent = save.opt.auto ? "挂机 开" : "挂机 关";
    a.classList.toggle("on", save.opt.auto);
    $("bSpd").textContent = "x" + save.opt.speed;
    $("bSnd").textContent = save.opt.snd ? "有声" : "静音";
    $("bPause").textContent = paused ? "继续" : "暂停";
    $("bPause").classList.toggle("on", paused);
  }

  /* ---------- 离线结算 ---------- */
  function offline() {
    const sec = Math.min(OFFLINE_CAP, (Date.now() - save.last) / 1000);
    save.last = Date.now();
    if (sec < 90 || !save.opt.auto) return;
    const gain = S.offlineGain(save.hist, sec);
    if (gain <= 0) return;
    save.dna += gain;
    persist();
    const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
    if (!modal) openModal("off", `<div class="dlg"><h2>离线培养报告</h2><p>离开了 ${hh ? hh + " 小时 " : ""}${mm} 分钟${sec >= OFFLINE_CAP ? "，已到 8 小时上限" : ""}</p><div class="dna-gain">${dnaImg()}+${fmt(gain)}</div><p>按最近 ${save.hist.length} 局平均效率的 50% 结算，每小时最多 ${S.offlineHourCap()}</p><button class="btn" data-act="close">收下 DNA</button></div>`);
    else toast("离线获得 DNA +" + fmt(gain));
  }

  /* ---------- 主循环 ---------- */
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (ts - lastT) / 1000 || 0);
    lastT = ts;
    const t = ts / 1000;
    if (run && !paused && !document.hidden) {
      if (run.choice) {
        if (save.opt.auto) {
          if (modal === "choice") closeModal();
          if (peek) (peek = false), ($("start").hidden = true);
          if ((autoT += dt) > 0.3) {
            autoT = 0;
            afterPick(S.autoPick(run, save.opt.prefs), true);
          }
        } else if (modal !== "choice" && !peek) showChoice();
      } else if (!modal) {
        save.wall += dt;
        acc += dt * save.opt.speed;
        let n = 0;
        while (acc >= DT && n++ < 10) {
          acc -= DT;
          S.step(run, DT);
          const snd = R.consume(run);
          for (const k in snd) A.sfx(k);
          if (run.over || run.choice) break;
        }
        if (acc > DT * 10) acc = 0;
        if (run.snap !== lastSnap) {
          lastSnap = save.snap = run.snap;
          persist();
          if (run.wave % 5 === 0) A.sfx("boss");
        }
      }
      A.music(dt, run.wave % 5 === 0 ? 1 : run.hp / run.maxHp < 0.4 ? 0.8 : 0.2);
    }
    R.draw(ctx, run, t, modal === "choice" || paused ? 0 : dt);
    hud();
    if (run && run.over) endRun();
    if (!run && !modal && save.opt.auto && !document.hidden) {
      idleT += dt;
      const cd0 = $("cd0");
      if (cd0) cd0.textContent = `挂机中，${Math.max(1, Math.ceil(3 - idleT))} 秒后自动${save.snap ? "继续" : "开始"}`;
      if (idleT >= 3) startRun(save.snap || undefined);
    } else idleT = 0;
    if (restartT > 0 && modal === "end") {
      restartT -= dt;
      const cd = $("cd");
      if (cd) cd.textContent = `挂机中，${Math.ceil(restartT)} 秒后开始下一局`;
      if (restartT <= 0) startRun();
    }
    if ((panelT += dt) > 0.6 && tab === "build" && run && !modal) {
      panelT = 0;
      const p = $("panel"), y = p.scrollTop;
      p.innerHTML = panelBuild();
      p.scrollTop = y;
    }
    if ((saveT += dt) > 5) {
      saveT = 0;
      persist();
    }
  }

  /* ---------- 事件 ---------- */
  function choose(i) {
    if (modal !== "choice" || !run || !run.choice || i >= run.choice.opts.length) return;
    const o = S.pick(run, i);
    peek = false;
    closeModal();
    afterPick(o, false);
  }
  function confirmTwice(el, text) {
    if (el.dataset.sure) return true;
    el.dataset.sure = 1;
    el.textContent = text;
    return false;
  }

  document.addEventListener("click", (ev) => {
    A.unlock();
    const el = ev.target.closest("[data-pick],[data-act],[data-diff],[data-buy],[data-pref],[data-tab],[data-tip]");
    if (!el) return;
    const d = el.dataset;
    if (d.pick !== undefined) return choose(+d.pick);
    if (d.tab) {
      tab = d.tab;
      syncTabs();
      $("panel").scrollTop = 0;
      return renderPanel();
    }
    if (d.diff !== undefined) {
      save.diff = +d.diff;
      persist();
      if (!run) showStart();
      else toast("下一局改用 " + diffName(save.diff));
      return renderPanel();
    }
    if (d.buy) {
      const cost = metaCost(d.buy);
      if (!metaOpen(d.buy) || save.dna < cost || (save.meta[d.buy] || 0) >= D.META[d.buy].max) return A.sfx("deny");
      save.dna -= cost;
      save.meta[d.buy] = (save.meta[d.buy] || 0) + 1;
      A.sfx("buy");
      persist();
      return renderPanel();
    }
    if (d.pref) {
      const i = save.opt.prefs.indexOf(d.pref);
      i >= 0 ? save.opt.prefs.splice(i, 1) : save.opt.prefs.push(d.pref);
      persist();
      return renderPanel();
    }
    if (d.tip) return toast(d.tip);
    const act = d.act;
    if (act === "new") {
      save.snap = null;
      startRun();
    } else if (act === "resume") startRun(save.snap);
    else if (act === "again") startRun();
    else if (act === "gene") {
      restartT = 0;
      closeModal();
      tab = "gene";
      syncTabs();
      showStart();
      renderPanel();
    } else if (act === "close") closeModal();
    else if (act === "peek") {
      peek = true;
      closeModal();
      $("start").hidden = false;
      $("start").innerHTML = `<button class="btn big" data-act="unpeek">回到选择</button>`;
    } else if (act === "unpeek") {
      peek = false;
      $("start").hidden = true;
    }
    else if (act === "reroll") {
      if (S.reroll(run)) {
        A.sfx("buy");
        showChoice();
      }
    } else if (act === "export") {
      persist();
      const io = $("io");
      io.value = btoa(unescape(encodeURIComponent(JSON.stringify(save))));
      io.select();
      toast("存档码已生成，请复制保存");
    } else if (act === "import") {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob($("io").value.trim()))));
        if (!s || typeof s !== "object" || s.v !== 1 || typeof s.dna !== "number") throw 0;
        save = sanitize(s);
        run = null;
        A.setOn(save.opt.snd);
        R.setCalm(save.opt.calm);
        persist();
        showStart();
        renderPanel();
        toast("存档已读取");
      } catch (e) {
        A.sfx("deny");
        toast("存档码无法识别，存档未改动");
      }
    } else if (act === "quit") {
      if (confirmTwice(el, "再点一次确认，已得 DNA 照常结算")) run.over = "dead";
    } else if (act === "wipe") {
      if (confirmTwice(el, "再点一次，永久删除全部进度")) {
        save = fresh();
        run = null;
        persist();
        showStart();
        renderPanel();
        toast("全部进度已删除");
      }
    }
  });
  document.addEventListener("change", (ev) => {
    const k = ev.target.dataset.opt;
    if (!k) return;
    save.opt[k] = ev.target.checked;
    if (k === "snd") A.setOn(save.opt.snd);
    if (k === "calm") R.setCalm(save.opt.calm);
    if (k === "auto" && !save.opt.auto) restartT = 0;
    persist();
    renderPanel();
  });
  $("bAuto").onclick = () => {
    save.opt.auto = !save.opt.auto;
    autoT = 0;
    if (!save.opt.auto) restartT = 0;
    toast(save.opt.auto ? "挂机已开，自动选择并自动开下一局" : "挂机已关");
    persist();
    renderPanel();
  };
  $("bSpd").onclick = () => {
    save.opt.speed = save.opt.speed === 1 ? 2 : save.opt.speed === 2 ? 4 : 1;
    persist();
    renderPanel();
  };
  $("bPause").onclick = () => {
    paused = !paused;
    renderPanel();
  };
  $("bSnd").onclick = () => {
    save.opt.snd = !save.opt.snd;
    A.setOn(save.opt.snd);
    persist();
    renderPanel();
  };
  document.addEventListener("keydown", (ev) => {
    if (ev.target.tagName === "TEXTAREA") return;
    if (modal === "end" || modal === "off") {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        modal === "end" ? startRun() : closeModal();
      }
      return;
    }
    if (ev.key >= "1" && ev.key <= "4") choose(+ev.key - 1);
    else if (ev.key === " ") {
      ev.preventDefault();
      $("bPause").click();
    } else if (ev.key === "r" || ev.key === "R") {
      if (modal === "choice" && S.reroll(run)) showChoice();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persist();
    else {
      lastT = performance.now();
      acc = 0;
      offline();
      renderPanel();
    }
  });
  window.addEventListener("pagehide", persist);

  $("dnaIc").src = R.icon("dna", R.PAL.amber);
  A.setOn(save.opt.snd);
  R.setCalm(save.opt.calm);
  showStart();
  offline();
  renderPanel();
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.load) document.fonts.load('16px "EvoPixel"').then(renderPanel, () => {});
  window.__evo = { get run() { return run; }, get save() { return save; } };
})();

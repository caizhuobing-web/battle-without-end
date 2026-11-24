/* 万变之种：界面、主循环、存档与挂机结算。 */
(function () {
  const D = EvoData, S = EvoSim, R = EvoRender, A = EvoAudio;
  const $ = (id) => document.getElementById(id);
  const KEY = "evoSeed.save.v1", DT = 1 / 30, OFFLINE_CAP = 8 * 3600;
  const RAR = ["", "普通", "稀有", "史诗"];
  const cv = $("cv"), ctx = cv.getContext("2d");
  let save = load(), run = null, paused = false, tab = "build", acc = 0, lastT = 0, size = 400;
  let modal = null, autoT = 0, restartT = 0, panelT = 0, saveT = 0, sig = "", lastSnap = null, cache = {};

  function fresh() {
    return { v: 1, dna: 0, meta: {}, diff: 0, diffMax: 0, best: {}, codex: {}, runs: 0, wins: 0, hist: [], opt: { auto: false, prefs: [], speed: 1, snd: true }, snap: null, last: Date.now() };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) return Object.assign(fresh(), s, { opt: Object.assign(fresh().opt, s.opt) });
    } catch (e) {}
    return fresh();
  }
  function persist() {
    save.last = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (e) {}
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmt = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + "m" : v >= 1e4 ? (v / 1e3).toFixed(1) + "k" : String(Math.round(v)));
  const tagChip = (t) => (t ? `<span class="tag" style="--tc:${D.TAGS[t].c}">${D.TAGS[t].n}</span>` : "");
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
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 2400);
  }
  function formPath(id) {
    const p = [];
    for (let f = D.FORMS[id]; f; f = D.FORMS[f.p]) p.unshift(Object.keys(D.FORMS).find((k) => D.FORMS[k] === f));
    return p;
  }
  function drawPreview(el, forms) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), s = 72 * dpr;
    el.width = el.height = s;
    const c = el.getContext("2d");
    c.translate(s / 2, s / 2);
    c.scale(dpr, dpr);
    R.creature(c, forms, 1.3, 13 - forms.length, false);
  }
  function paintPreviews(root) {
    root.querySelectorAll("canvas[data-form]").forEach((el) => drawPreview(el, el.dataset.form ? formPath(el.dataset.form) : []));
  }

  /* ---------- 对局生命周期 ---------- */
  function startRun(snap) {
    A.unlock();
    run = snap ? S.restore(snap, save.meta) : S.newRun(save.meta, save.diff, (Math.random() * 2147483647) | 0);
    if (!snap) save.runs++;
    lastSnap = run.snap;
    save.snap = run.snap;
    R.clear();
    paused = false;
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
    save.hist.push({ dna, dur: Math.max(30, run.t) });
    if (save.hist.length > 5) save.hist.shift();
    const reach = win ? D.WAVES + 1 : run.wave, best = save.best[run.diff] || 0, newBest = reach > best;
    if (newBest) save.best[run.diff] = reach;
    let unlock = "";
    if (win) {
      save.wins++;
      if (run.diff === save.diffMax && save.diffMax < D.DIFFS.length - 1) {
        save.diffMax++;
        unlock = D.DIFFS[save.diffMax].n;
      }
    }
    persist();
    A.sfx(win ? "win" : "dead");
    const top = Object.keys(run.dmgBy).sort((a, b) => run.dmgBy[b] - run.dmgBy[a])[0];
    const names = run.forms.map((f) => D.FORMS[f].n).join(" → ") || "原初之种";
    const m = Math.floor(run.t / 60), s = Math.floor(run.t % 60);
    openModal(
      "end",
      `<div class="dlg"><div class="box">
        <h2 class="${win ? "evo" : ""}">${win ? "进化完成" : "生命终结"}</h2>
        <p>${win ? `你征服了「${D.DIFFS[run.diff].n}」` : `倒在「${D.DIFFS[run.diff].n}」第 ${run.wave} 波`}${newBest && !win ? "，刷新了最佳纪录" : ""}</p>
        <div class="dna-gain">🧬 +${fmt(dna)}</div>
        <div class="sum">
          <div class="stat"><span>到达波次</span><b>${run.wave}</b></div>
          <div class="stat"><span>等级</span><b>${run.lvl}</b></div>
          <div class="stat"><span>击杀</span><b>${fmt(run.kills)}</b></div>
          <div class="stat"><span>用时</span><b>${m}:${String(s).padStart(2, "0")}</b></div>
          <div class="stat"><span>主要伤害</span><b style="color:${D.TAGS[top].c}">${run.dmgBy[top] > 0 ? D.TAGS[top].n : "无"}</b></div>
          <div class="stat"><span>领主击杀</span><b>${run.bosses}</b></div>
        </div>
        <p>进化路线：${esc(names)}</p>
        ${unlock ? `<p style="color:var(--gold)">新猎场已解锁：${unlock}</p>` : ""}
        <p id="cd"></p>
        <div class="rowb" style="justify-content:center">
          <button class="btn" data-act="again">再来一局</button>
          <button class="btn ghost" data-act="gene">基因强化</button>
        </div>
      </div></div>`,
    );
    restartT = save.opt.auto ? 4 : 0;
    run = null;
    renderPanel();
  }

  function showStart() {
    const el = $("start");
    el.hidden = false;
    const diffs = D.DIFFS.map((d, i) => (i <= save.diffMax ? `<button class="tag ${i === save.diff ? "on" : ""}" style="--tc:var(--acc)" data-diff="${i}">${d.n}${save.best[i] ? " · " + (save.best[i] > D.WAVES ? "通关" : save.best[i] + "波") : ""}</button>` : `<span class="tag" style="opacity:.4">🔒 ${d.n}</span>`)).join("");
    el.innerHTML = `<div>
      <h1>万变之种</h1>
      <p>生物会自动战斗。升级时选择变异，关键节点选择进化路线。<br>倒下后用 DNA 做永久强化，再试另一条路。</p>
      <div class="diffs">${diffs}</div>
      ${save.snap ? `<div class="rowb" style="justify-content:center"><button class="btn big" data-act="resume">继续（第 ${save.snap.wave} 波）</button><button class="btn ghost" data-act="new">新的一局</button></div>` : `<button class="btn big" data-act="new">开始进化</button>`}
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
      const sk = D.SKILLS[o.id], own = run.skills.find((s) => s.id === o.id);
      if (!own) return { cls: "sk", pic: sk.ic, ttl: sk.n, sub: "新技能", dsc: sk.d, tag: sk.tag };
      const nl = own.lvl + 1;
      return { cls: "sk", pic: sk.ic, ttl: sk.n, sub: `技能强化 Lv${own.lvl} → Lv${nl}`, dsc: `伤害提升至 ${Math.round(S.lvlMul(nl) * 100)}%` + (nl === 3 || nl === 5 || (o.id === "brood" && (nl === 2 || nl === 4)) ? "，数量 +1" : ""), tag: sk.tag };
    }
    if (o.k === "mut") {
      const m = D.MUTS[o.id], cur = run.muts[o.id] || 0;
      return { cls: "r" + m.rar, pic: "🧬", ttl: m.n, sub: RAR[m.rar] + "变异" + (m.max > 1 ? ` ${cur}/${m.max}` : ""), dsc: m.d, tag: m.tag };
    }
    const f = D.FORMS[o.id];
    return { cls: "fm", pic: `<canvas data-form="${o.id}"></canvas>`, ttl: f.n, sub: `第 ${f.tier} 阶形态` + (save.codex[o.id] ? "" : " · 未发现"), dsc: f.d, tags: f.aff };
  }

  function showChoice() {
    const c = run.choice, evo = c.kind === "evo";
    const title = evo ? "进化" : c.kind === "skill" ? "选择初始技能" : "选择变异";
    const sub = evo ? "选择一条进化路线，本局不可更改" : c.kind === "skill" ? "它决定了这一局的起点" : `等级 ${run.lvl} · 已有技能 ${run.skills.length}/${run.slots}`;
    const cards = c.opts
      .map((o, i) => {
        const f = optInfo(o);
        return `<button class="card ${f.cls}" data-pick="${i}"><div class="pic">${f.pic}</div><div><div class="ttl">${f.ttl}${tagChip(f.tag)}${(f.tags || []).map(tagChip).join("")}</div><div class="sub">${f.sub}</div><div class="dsc">${f.dsc}</div></div><kbd>${i + 1}</kbd></button>`;
      })
      .join("");
    openModal("choice", `<div class="dlg"><h2 class="${evo ? "evo" : ""}">${title}</h2><p>${sub}</p><div class="cards">${cards}</div>${c.kind === "mut" ? `<div style="margin-top:12px"><button class="btn ghost" data-act="reroll" ${run.rerolls > 0 ? "" : "disabled"}>重抽（剩余 ${run.rerolls}）</button></div>` : ""}</div>`);
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
      toast((isNew ? "新形态：" : "进化为：") + nm);
      persist();
    } else {
      A.sfx("pick");
      if (auto) toast("自动选择：" + nm);
    }
    sig = "";
    renderPanel();
  }

  /* ---------- 常驻界面 ---------- */
  function hud() {
    set("dna", "textContent", fmt(save.dna));
    if (!run) return;
    const bossW = run.wave % 5 === 0;
    set("wv", "textContent", `第 ${run.wave} 波`);
    set("wvBar", "w", Math.round(Math.min(1, run.wt / D.WAVE_T) * 100));
    set("diffN", "textContent", D.DIFFS[run.diff].n);
    set("hpBar", "w", Math.round((run.hp / run.maxHp) * 100));
    set("shBar", "w", Math.round(Math.min(1, run.sh / run.maxHp) * 100));
    set("hpTxt", "textContent", Math.ceil(run.hp) + " / " + run.maxHp + (run.sh > 1 ? "  +" + Math.round(run.sh) : ""));
    set("lvTxt", "textContent", "Lv " + run.lvl);
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
          const sk = D.SKILLS[s.id];
          h += `<div class="slot" style="--tc:${D.TAGS[sk.tag].c}" data-tip="${esc(sk.n + "：" + sk.d)}"><div class="ic">${sk.ic}</div><div class="nm">${sk.n}</div><div class="pips">${[1, 2, 3, 4, 5].map((n) => `<b class="${n <= s.lvl ? "f" : ""}"></b>`).join("")}</div></div>`;
        } else h += i < run.slots ? `<div class="slot empty"><div class="ic">＋</div><div class="nm">空技能槽</div><div class="pips"></div></div>` : `<div class="slot lock" data-tip="第二次进化后解锁第 4 个技能槽"><div class="ic">🔒</div><div class="nm">二阶解锁</div><div class="pips"></div></div>`;
      }
      $("skills").innerHTML = h;
    }
  }

  function nextEvoHint() {
    const n = run.forms.length;
    return n === 0 ? "等级 3 时首次进化" : n === 1 ? "击败第 5 波领主后二次进化" : n === 2 ? "击败第 15 波领主后终极进化" : "已达终极形态，击败第 30 波领主通关";
  }

  function panelBuild() {
    if (!run) {
      const b = save.best[save.diff];
      return `<h3>尚未开始</h3><p class="muted">共进行 ${save.runs} 局，通关 ${save.wins} 次。当前猎场「${D.DIFFS[save.diff].n}」最佳：${b ? (b > D.WAVES ? "已通关" : "第 " + b + " 波") : "无记录"}。</p><p class="muted">已发现形态 ${Object.keys(save.codex).length} / ${Object.keys(D.FORMS).length}。</p>`;
    }
    const s = run.st, tot = Object.values(run.dmgBy).reduce((a, b) => a + b, 0) || 1;
    const path = ["原初之种"].concat(run.forms.map((f) => D.FORMS[f].n)).join(" → ");
    const stats = [
      ["生命", run.maxHp], ["护甲减伤", Math.round((1 - 100 / (100 + s.armor)) * 100) + "%"], ["每秒回复", s.regen.toFixed(1)],
      ["伤害加成", "+" + Math.round(s.dmg + (run.more - 1) * 100) + "%"], ["攻速", "+" + Math.round(s.atkSpd + run.frenzy) + "%"], ["暴击", Math.round(s.crit) + "%"],
    ];
    if (s.dodge) stats.push(["闪避", Math.round(s.dodge) + "%"]);
    if (s.leech) stats.push(["吸血", s.leech + "%"]);
    if (s.shield) stats.push(["护盾", Math.round(s.shield)]);
    const dmg = Object.keys(run.dmgBy).filter((t) => run.dmgBy[t] > 0).sort((a, b) => run.dmgBy[b] - run.dmgBy[a])
      .map((t) => `<div><span style="color:${D.TAGS[t].c}">${D.TAGS[t].n}</span><div class="bar"><i style="width:${(run.dmgBy[t] / tot) * 100}%;background:${D.TAGS[t].c}"></i></div><em>${Math.round((run.dmgBy[t] / tot) * 100)}%</em></div>`).join("");
    const muts = Object.keys(run.muts).map((id) => `<span class="tag r${D.MUTS[id].rar}" data-tip="${esc(D.MUTS[id].n + "：" + D.MUTS[id].d)}">${D.MUTS[id].n}${run.muts[id] > 1 ? " ×" + run.muts[id] : ""}</span>`).join("");
    return `<h3>进化路线</h3><div>${esc(path)}</div><p class="muted" style="margin:2px 0 0">${nextEvoHint()}</p>
      <h3>属性</h3><div class="stats">${stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
      <h3>伤害构成</h3><div class="dmg">${dmg || '<span class="muted">暂无数据</span>'}</div>
      <h3>变异（${Object.values(run.muts).reduce((a, b) => a + b, 0)}）</h3><div class="tags">${muts || '<span class="muted">升级后获得</span>'}</div>`;
  }

  function panelTree() {
    const cur = run ? run.forms : [];
    const node = (id) => {
      const f = D.FORMS[id], known = save.codex[id];
      return `<div class="node t${f.tier} ${cur.includes(id) ? "cur" : ""} ${known ? "" : "un"}"><canvas data-form="${id}"></canvas><div><b>${f.n}${known ? '<span class="ok">已发现</span>' : ""}</b> ${f.aff.map(tagChip).join("")}<small>${f.d}</small></div></div>`;
    };
    let h = `<p class="muted" style="margin-top:0">3 个系别、6 个亚种、12 个终极形态。已发现 ${Object.keys(save.codex).length} / ${Object.keys(D.FORMS).length}。</p><div class="tree">`;
    for (const a of ["A", "B", "C"]) {
      h += `<div class="fam">` + node(a);
      for (const b of [a + "1", a + "2"]) h += node(b) + node(b + "a") + node(b + "b");
      h += `</div>`;
    }
    return h + `</div>`;
  }

  const metaCost = (id) => Math.round(D.META[id].c * Math.pow(D.META[id].g, save.meta[id] || 0));
  function panelGene() {
    let h = `<h3>猎场</h3><div class="tags">` + D.DIFFS.map((d, i) => (i <= save.diffMax ? `<button class="tag ${i === save.diff ? "on" : ""}" style="--tc:var(--acc)" data-diff="${i}">${d.n} · DNA ×${d.dna}</button>` : `<span class="tag" style="opacity:.4">🔒 ${d.n}</span>`)).join("") + `</div>
      <p class="muted">通关当前最高猎场后解锁下一个。${run ? "更换猎场与新购强化从下一局生效。" : ""}</p><h3>永久基因强化</h3><div class="meta">`;
    for (const id in D.META) {
      const m = D.META[id], lv = save.meta[id] || 0, full = lv >= m.max, cost = metaCost(id);
      h += `<div class="mrow"><div><b>${m.n}</b><span class="lv">${lv}/${m.max}</span><small>${m.d}</small></div><button class="btn ${full ? "ghost" : ""}" data-buy="${id}" ${full || save.dna < cost ? "disabled" : ""}>${full ? "已满" : "🧬 " + fmt(cost)}</button></div>`;
    }
    return h + `</div>`;
  }

  function panelOpt() {
    const prefs = Object.keys(D.TAGS).map((t) => `<button class="tag ${save.opt.prefs.includes(t) ? "on" : ""}" style="--tc:${D.TAGS[t].c}" data-pref="${t}">${D.TAGS[t].n}</button>`).join("");
    return `<h3>挂机</h3>
      <label class="sw"><div>挂机模式<small>自动选择变异与进化，死亡后自动重开。离线时按最近 5 局效率的一半结算 DNA，最多 8 小时。</small></div><input type="checkbox" data-opt="auto" ${save.opt.auto ? "checked" : ""}></label>
      <h3>挂机偏好流派</h3><div class="tags">${prefs}</div><p class="muted">自动选择会优先拿所选流派的技能、变异和进化路线。不选则跟随当前形态。</p>
      <h3>声音</h3><label class="sw"><div>音效与环境音乐</div><input type="checkbox" data-opt="snd" ${save.opt.snd ? "checked" : ""}></label>
      <h3>存档</h3><div class="rowb"><button class="btn ghost" data-act="export">导出存档码</button><button class="btn ghost" data-act="import">导入存档码</button></div>
      <textarea id="io" placeholder="导出的存档码会出现在这里；导入时把存档码粘贴到这里再点导入"></textarea>
      <h3>危险操作</h3><div class="rowb">${run ? `<button class="btn warn" data-act="quit">放弃本局</button>` : ""}<button class="btn warn" data-act="wipe">清空全部存档</button></div>
      <p class="muted">快捷键：数字键选择，空格暂停，R 重抽。</p>`;
  }

  function renderPanel() {
    const p = $("panel");
    p.innerHTML = { build: panelBuild, tree: panelTree, gene: panelGene, opt: panelOpt }[tab]();
    paintPreviews(p);
    const can = Object.keys(D.META).some((id) => (save.meta[id] || 0) < D.META[id].max && save.dna >= metaCost(id));
    const gb = document.querySelector('#tabs [data-tab="gene"]');
    gb.innerHTML = "基因" + (can ? '<i class="dot"></i>' : "");
    const a = $("bAuto");
    a.textContent = save.opt.auto ? "挂机 开" : "挂机 关";
    a.classList.toggle("on", save.opt.auto);
    $("bSpd").textContent = "×" + save.opt.speed;
    $("bSnd").textContent = save.opt.snd ? "🔊" : "🔇";
    $("bPause").textContent = paused ? "▶" : "⏸";
    $("bPause").classList.toggle("on", paused);
  }

  /* ---------- 离线结算 ---------- */
  function offline() {
    const sec = Math.min(OFFLINE_CAP, (Date.now() - save.last) / 1000);
    save.last = Date.now();
    if (sec < 90 || !save.opt.auto || !save.hist.length) return;
    let dna = 0, dur = 0;
    for (const h of save.hist) (dna += h.dna), (dur += h.dur);
    const gain = Math.floor((dna / dur) * sec);
    if (gain <= 0) return;
    save.dna += gain;
    persist();
    const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
    if (!modal) openModal("off", `<div class="dlg"><div class="box"><h2>离线进化报告</h2><p>离开了 ${hh ? hh + " 小时 " : ""}${mm} 分钟${sec >= OFFLINE_CAP ? "（已达 8 小时上限）" : ""}</p><div class="dna-gain">🧬 +${fmt(gain)}</div><p>按最近 ${save.hist.length} 局平均效率的一半结算</p><button class="btn" data-act="close">收下</button></div></div>`);
    else toast("离线获得 DNA +" + fmt(gain));
  }

  /* ---------- 主循环 ---------- */
  function resize() {
    const w = $("cvWrap").clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
    size = Math.max(200, Math.round(w * dpr));
    cv.width = cv.height = size;
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (ts - lastT) / 1000 || 0);
    lastT = ts;
    const t = ts / 1000;
    if (run && !paused && !document.hidden) {
      if (run.choice) {
        if (save.opt.auto) {
          if (modal === "choice") closeModal();
          if ((autoT += dt) > 0.3) {
            autoT = 0;
            afterPick(S.autoPick(run, save.opt.prefs), true);
          }
        } else if (modal !== "choice") showChoice();
      } else if (!modal) {
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
    R.draw(ctx, size, run, t, modal === "choice" || paused ? 0 : dt);
    hud();
    if (run && run.over) endRun();
    if (restartT > 0 && modal === "end") {
      restartT -= dt;
      const cd = $("cd");
      if (cd) cd.textContent = `挂机中：${Math.ceil(restartT)} 秒后自动开始下一局`;
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
    closeModal();
    afterPick(o, false);
  }

  document.addEventListener("click", (ev) => {
    A.unlock();
    const el = ev.target.closest("[data-pick],[data-act],[data-diff],[data-buy],[data-pref],[data-tab],[data-tip]");
    if (!el) return;
    const d = el.dataset;
    if (d.pick !== undefined) return choose(+d.pick);
    if (d.tab) {
      tab = d.tab;
      document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
      $("panel").scrollTop = 0;
      return renderPanel();
    }
    if (d.diff !== undefined) {
      save.diff = +d.diff;
      persist();
      if (!run) showStart();
      return renderPanel();
    }
    if (d.buy) {
      const cost = metaCost(d.buy);
      if (save.dna < cost || (save.meta[d.buy] || 0) >= D.META[d.buy].max) return A.sfx("deny");
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
      document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
      showStart();
      renderPanel();
    } else if (act === "close") closeModal();
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
      toast("存档码已生成，请全选复制保存");
    } else if (act === "import") {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob($("io").value.trim()))));
        if (!s || s.v !== 1 || typeof s.dna !== "number" || typeof s.meta !== "object") throw 0;
        save = Object.assign(fresh(), s, { opt: Object.assign(fresh().opt, s.opt) });
        run = null;
        persist();
        showStart();
        renderPanel();
        toast("存档已导入");
      } catch (e) {
        A.sfx("deny");
        toast("存档码无效，未做任何更改");
      }
    } else if (act === "quit") {
      if (el.dataset.sure) {
        run.over = "dead";
      } else {
        el.dataset.sure = 1;
        el.textContent = "再点一次确认放弃";
      }
    } else if (act === "wipe") {
      if (el.dataset.sure) {
        save = fresh();
        run = null;
        persist();
        showStart();
        renderPanel();
        toast("存档已清空");
      } else {
        el.dataset.sure = 1;
        el.textContent = "再点一次确认清空";
      }
    }
  });
  document.addEventListener("change", (ev) => {
    const k = ev.target.dataset.opt;
    if (!k) return;
    save.opt[k] = ev.target.checked;
    if (k === "snd") A.setOn(save.opt.snd);
    persist();
    renderPanel();
  });
  $("bAuto").onclick = () => {
    save.opt.auto = !save.opt.auto;
    autoT = 0;
    if (!save.opt.auto) restartT = 0;
    toast(save.opt.auto ? "挂机模式开启：自动选择并自动重开" : "挂机模式关闭");
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
  window.addEventListener("resize", resize);
  window.addEventListener("pagehide", persist);

  A.setOn(save.opt.snd);
  resize();
  showStart();
  offline();
  renderPanel();
  requestAnimationFrame(frame);
  window.__evo = { get run() { return run; }, get save() { return save; } };
})();

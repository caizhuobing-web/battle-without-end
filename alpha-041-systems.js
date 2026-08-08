/* Alpha 0.41 — world difficulty, permanent regions and lifelong companions. */
(() => {
  "use strict";
  if (typeof state === "undefined" || typeof MAPS === "undefined") return;

  const DIFFICULTIES = [
    ["normal", "普通", 1, 1, 1],
    ["hard", "困难", 1, 1, 1.15],
    ["expert", "专家", 1, 1, 1.35],
    ["master", "大师", 1, 1, 1.6],
    ["torment1", "折磨 I", 1.35, 1.12, 1.9],
    ["torment2", "折磨 II", 1.7, 1.24, 2.15],
    ["torment3", "折磨 III", 2.15, 1.38, 2.4],
    ["torment4", "折磨 IV", 2.7, 1.54, 2.7],
    ["torment5", "折磨 V", 3.4, 1.72, 3],
    ["torment6", "折磨 VI", 4.3, 1.92, 3.35],
    ["torment7", "折磨 VII", 5.4, 2.14, 3.7],
    ["torment8", "折磨 VIII", 6.8, 2.38, 4.1],
    ["torment9", "折磨 IX", 8.6, 2.66, 4.55],
    ["torment10", "折磨 X", 10.8, 2.98, 5.9],
  ].map(([id, name, hp, atk, reward], index) => ({
    id, name, hp, atk, def: Math.sqrt(hp), reward, index,
    minLevel: index * 10 + 1, maxLevel: (index + 1) * 10,
    torment: index >= 4,
  }));
  const DIFFICULTY_BY_ID = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));
  const PERMANENT_MAP_IDS = ["meadow", "hill", "forest", "shore", "ruins"];
  const MAP_FOCUS = {
    meadow: "武器与直接伤害",
    hill: "戒指与持续伤害",
    forest: "头部与治疗护盾",
    shore: "护甲与防御",
    ruins: "项链与技能循环",
  };

  // Keep compatibility fields for the old battle formula, but make all regions equal-value.
  MAPS.splice(0, MAPS.length, ...MAPS.filter((m) => PERMANENT_MAP_IDS.includes(m.id)));
  MAPS.forEach((m) => Object.assign(m, {
    cp: 117, mod: 0, gearTier: 1, petTier: 1, threatCap: 0, levels: [1, 10],
  }));

  function difficulty() {
    return DIFFICULTY_BY_ID[state.worldDifficulty] || DIFFICULTIES[0];
  }
  function applyDifficultyLevels() {
    const d = difficulty();
    MAPS.forEach((m) => { m.levels = [d.minLevel, d.maxLevel]; });
  }
  function bossSnapshotKey(mapId = state.mapId, difficultyId = state.worldDifficulty) {
    return `${mapId}:${difficultyId}`;
  }
  function clone(value, fallback) {
    try { return value == null ? fallback : JSON.parse(JSON.stringify(value)); }
    catch { return fallback; }
  }
  function persistEncounterState() {
    const key = bossSnapshotKey();
    state.bossState[key] = {
      progress: clone(state.bossProgress?.[state.mapId], null),
      cycle: clone(state.bossCycles?.[state.mapId], null),
    };
  }
  function restoreEncounterState() {
    const snap = state.bossState[bossSnapshotKey()] || {};
    state.bossProgress = state.bossProgress || {};
    state.bossCycles = state.bossCycles || {};
    if (snap.progress) state.bossProgress[state.mapId] = clone(snap.progress, null);
    else delete state.bossProgress[state.mapId];
    state.bossCycles[state.mapId] = clone(snap.cycle, null) || {
      normalSinceBoss: 0, retryCountdown: 0, bossEncounters: 0, bossWins: 0,
      threatTier: 0, threatUnlocked: 0, dangerFail: 0, warningIssued: false,
    };
  }
  function ensureAlpha041State() {
    state.version = VERSION;
    state.worldDifficulty = DIFFICULTY_BY_ID[state.worldDifficulty] ? state.worldDifficulty : "normal";
    state.highestUnlockedDifficulty = clamp(Number(state.highestUnlockedDifficulty || 0), 0, DIFFICULTIES.length - 1);
    state.difficultyStats = state.difficultyStats || {};
    state.bossState = state.bossState || {};
    if (!PERMANENT_MAP_IDS.includes(state.mapId)) state.mapId = "ruins";
    state.legacy041 = state.legacy041 || {
      rebirths: Number(state.rebirths || 0),
      rebirthLaws: clone(state.rebirthLaws, {}),
      abyssHighest: Number(state.abyssHighest || 1),
    };
    state.rebirths = 0;
    state.rebirthLaws = { war: 0, time: 0, hunt: 0 };
    state.petDust = 0;
    state.petCapacity = 9999;
    (state.pets || []).forEach((p) => {
      p.tier = clamp(Number(p.tier || 1), 1, 10);
      p.baseSpecies = petBaseSpecies(p) === "星核幼龙" ? "灰尾幼狼" : petBaseSpecies(p);
      p.type = ({
        "灰尾幼狼": "Attack", "裂风幼狮": "Attack", "树灵幼芽": "Magic",
        "霜鳍幼兽": "Defense", "王魂侍从": "Balance",
      })[p.baseSpecies] || p.type;
      p.mutationTrait = p.mutationTrait || (p.mutant ? "原生变异" : null);
    });
    delete state.shop?.stock;
    applyDifficultyLevels();
    restoreEncounterState();
  }

  window.ALPHA_041_DIFFICULTIES = DIFFICULTIES;
  window.alpha041EnsureState = ensureAlpha041State;
  const previousGameStarted = window.onGameStarted;
  window.onGameStarted = function () {
    if (typeof previousGameStarted === "function") previousGameStarted();
    ensureAlpha041State();
  };

  // Global difficulty replaces map threat, abyss depth and rebirth scaling.
  worldCombatScale = function () {
    const d = difficulty();
    return {
      tier: d.index, cpMult: Math.sqrt(d.hp * d.atk * Math.sqrt(d.def)),
      hp: d.hp, atk: d.atk, def: d.def, speed: 1 + d.index * 0.012,
      reward: d.reward, levelBonus: 0, worldTier: d.index,
    };
  };
  dangerDropProfile = function () {
    const d = difficulty(), t = Math.max(0, d.index - 3);
    return {
      progress: d.index / (DIFFICULTIES.length - 1), maxed: d.index === 13,
      gearDrop: d.reward, petDrop: 1 + t * 0.08,
      mythic: d.torment ? 1 + t * 0.18 : 0,
      mutation: d.torment ? 1 + t * 0.12 : 0,
      identity: 1,
    };
  };
  threatTier = () => 0;
  threatUnlocked = () => 0;
  threatCap = () => 0;
  threatCapText = () => "全局难度";
  dangerRise = () => {};
  dangerRecordWin = () => {};
  dangerRecordLoss = () => {};
  bossCycleConfig = function () {
    const period = Math.max(15, 42 - difficulty().index * 2 - (amuletPowers().bossNeed || 0));
    return { threat: difficulty().index, timeLv: 0, base: period, timeReduce: 0, period, retry: Math.ceil(period / 2), amuletReduce: amuletPowers().bossNeed || 0 };
  };

  const oldChangeMap = changeMap;
  changeMap = function (id) {
    if (!PERMANENT_MAP_IDS.includes(id)) return;
    persistEncounterState();
    oldChangeMap(id);
    restoreEncounterState();
    state.enemy = null;
    prepareNewBattle();
    save();
    render(false);
  };
  window.setWorldDifficulty = function (id) {
    const next = DIFFICULTY_BY_ID[id];
    if (!next || next.index > state.highestUnlockedDifficulty) return;
    persistEncounterState();
    state.worldDifficulty = id;
    applyDifficultyLevels();
    restoreEncounterState();
    state.enemy = null;
    prepareNewBattle();
    log(`世界难度切换为【${next.name}】。敌人已按新难度重建。`, "important", "important");
    save(); render(false);
  };
  window.challengeDifficultyBoss = function () {
    const c = ensureBossCycle(state.mapId);
    c.normalSinceBoss = bossCycleConfig(state.mapId).period;
    c.retryCountdown = 0;
    state.enemy = null;
    prepareNewBattle();
    log(`已发起【${difficulty().name}】世界突破，下一战为区域Boss。`, "important", "important");
    render(false);
  };

  const STARTER_PETS_041 = [
    ["灰尾幼狼", "进攻", "爆发、追击与处决"],
    ["树灵幼芽", "恢复", "治疗、净化与持续回复"],
    ["霜鳍幼兽", "防御", "承伤、护盾与减伤"],
  ];
  const previousRenderStart = renderStart;
  renderStart = function () {
    previousRenderStart();
    const app = document.getElementById("app");
    if (!app) return;
    const choices = `<h2>选择初契伙伴</h2><div class="choice-grid">${STARTER_PETS_041.map(([name, role, desc], i) => `<div class="choice pet ${i === 0 ? "selected" : ""}" data-id="${name}" onclick="selectStart('pet','${name}')"><h3>${PET_SPECIES_ICONS[name] || "🐾"}${name} · ${role}</h3><div class="compact-meta">${desc}</div></div>`).join("")}</div>`;
    app.innerHTML = app.innerHTML.replace('<div class="controls" style="margin-top:12px">', `${choices}<div class="controls" style="margin-top:12px">`);
  };
  const previousStartGame = startGame;
  startGame = function () {
    const chosen = document.querySelector(".choice.pet.selected")?.dataset.id || "灰尾幼狼";
    previousStartGame();
    if (!state.started || state.pets.some((p) => p.initialBond)) return;
    const type = { "灰尾幼狼": "Attack", "树灵幼芽": "Magic", "霜鳍幼兽": "Defense" }[chosen];
    const pet = createPet(chosen, type, 0);
    pet.initialBond = true; pet.locked = true; pet.name = chosen;
    state.pets.push(pet); state.activePetId = pet.id;
    state.petCodex = state.petCodex || {}; state.petCodex[chosen] = (state.petCodex[chosen] || 0) + 1;
    log(`【初契伙伴】${chosen}将与你一同成长至折磨 X。`, "important", "important");
    save(); render(false);
  };

  function recordDifficultyResult(won, enemy) {
    const id = state.worldDifficulty, row = state.difficultyStats[id] || { battles: 0, wins: 0, bosses: 0 };
    row.battles++; if (won) row.wins++; if (won && enemy?.boss) row.bosses++;
    state.difficultyStats[id] = row;
    if (won && enemy?.boss && difficulty().index === state.highestUnlockedDifficulty && state.highestUnlockedDifficulty < DIFFICULTIES.length - 1) {
      state.highestUnlockedDifficulty++;
      const unlocked = DIFFICULTIES[state.highestUnlockedDifficulty];
      log(`【世界突破】已解锁${unlocked.name}。难度不会自动切换。`, "important", "important");
    }
    persistEncounterState();
  }
  const previousWon = window.onBattleWon;
  window.onBattleWon = function (enemy, currentMap) {
    recordDifficultyResult(true, enemy);
    if (typeof previousWon === "function" && currentMap?.id !== "abyss") previousWon(enemy, currentMap);
  };
  const previousLost = window.onBattleLost;
  window.onBattleLost = function (enemy, currentMap) {
    recordDifficultyResult(false, enemy);
    if (typeof previousLost === "function" && currentMap?.id !== "abyss") previousLost(enemy, currentMap);
  };

  // Lifelong companion: cap progression and let mutant donors awaken the original pet.
  const oldPetEvolutionNeed = petEvolutionNeed;
  petEvolutionNeed = (p) => Number(p?.tier || 1) >= 10 ? Number.MAX_SAFE_INTEGER : oldPetEvolutionNeed(p);
  window.awakenPetMutation = function (targetId, donorId) {
    const target = state.pets.find((p) => p.id === targetId), donor = state.pets.find((p) => p.id === donorId);
    if (!target || !donor || !donor.mutant || !samePetSpecies(target, donor) || target.id === donor.id) return alert("需要同物种变异X素材。");
    const trait = donor.mutationTrait || "原生变异";
    if (target.mutationTrait && !confirm(`以【${trait}】替换现有变异特性【${target.mutationTrait}】？`)) return;
    target.mutant = true; target.mutationTrait = trait;
    state.pets = state.pets.filter((p) => p.id !== donor.id);
    log(`${target.name}完成变异觉醒，保留原有培养并获得【${trait}】。`, "important", "important");
    save(); render(false);
  };

  marketPanel = () => "";
  window.marketPanel = () => "";
  window.renderMapSystemsBefore = () => {
    const d = difficulty(), stats = state.difficultyStats[d.id] || {};
    return `<div class="card difficulty-card"><div class="map-head"><h3>世界难度 · ${d.name}</h3><b>Lv.${d.minLevel}—${d.maxLevel} · 最高 ${DIFFICULTIES[state.highestUnlockedDifficulty].name}</b></div><div class="compact-meta">生命×${d.hp.toFixed(2)} · 攻击×${d.atk.toFixed(2)} · 综合收益×${d.reward.toFixed(2)} · ${d.torment ? "神话／变异X／★词缀已开放" : "等级成长阶段"}</div><div class="difficulty-grid">${DIFFICULTIES.map((x) => `<button ${x.index > state.highestUnlockedDifficulty ? "disabled" : ""} class="${x.id === d.id ? "active" : ""}" onclick="setWorldDifficulty('${x.id}')">${x.name}<small>Lv.${x.minLevel}—${x.maxLevel}</small></button>`).join("")}</div><div class="controls"><button onclick="challengeDifficultyBoss()">挑战${d.name}突破Boss</button></div><div class="compact-meta">本难度胜率：${stats.battles ? ((stats.wins / stats.battles) * 100).toFixed(1) + "%" : "—"}。胜利只解锁下一档，不自动升档。</div></div>`;
  };
  renderMaps = function () {
    return `${window.renderMapSystemsBefore()}${helpBlock("永久地图规则", "地图只决定怪物生态、Boss、宠物物种与定向掉落；五张地图共享等级、装备和世界难度，不再存在地图T级、装备阶级或宠物阶级门槛。")}${MAPS.map((m) => {
      const bp = state.bossState?.[bossSnapshotKey(m.id)]?.progress;
      return `<div class="map-card ${state.mapId === m.id ? "selected" : ""}"><div class="map-head"><b>${m.name}</b><span>${m.pet}</span></div><div class="compact-meta">怪物：${m.monsters.join("、")} · Boss：${m.boss}</div><div class="compact-meta">定向：${MAP_FOCUS[m.id]} · 宠物：${m.pet}${bp ? ` · 受伤Boss ${Math.round(bp.hp)}/${bp.maxHp}` : ""}</div><div class="controls"><button ${state.mapId === m.id ? "disabled" : ""} onclick="changeMap('${m.id}')">前往</button></div></div>`;
    }).join("")}`;
  };

  ensureAlpha041State();
  save();
  render(false);
})();

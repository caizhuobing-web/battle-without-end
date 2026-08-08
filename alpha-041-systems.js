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
  const MAP_FOCUS_SLOTS = {
    meadow: ["weapon"], hill: ["ring", "boots"], forest: ["head"],
    shore: ["armor"], ruins: ["amulet"],
  };
  const DAMAGE_LABELS_042 = {
    basic: "普通／技能", crit: "暴击追斩", blood: "鲜血", shield: "反伤",
    burn: "灼烧引爆", cooldown: "技能回响", pet: "宠物共战",
  };

  const LEVEL_CAP_041 = 140;
  const BUILDS_041 = {
    crit: { name: "暴击连斩流", icon: "⚔️" },
    blood: { name: "血牛血爆流", icon: "🩸" },
    shield: { name: "护盾反伤流", icon: "🛡️" },
    burn: { name: "灼烧引爆流", icon: "🔥" },
    cooldown: { name: "冷却技能流", icon: "✨" },
    pet: { name: "宠物共战流", icon: "🐾" },
  };
  const NAMED_MYTHICS_041 = [
    { id: "worldfang", name: "断界之牙", slot: "weapon", build: "crit", desc: "暴击后追加一次追击；溢出暴击率可触发强烈暴击。" },
    { id: "murderclock", name: "万刃时计", slot: "amulet", build: "crit", desc: "暴击会推进连斩，并缩短技能冷却。" },
    { id: "titanheart", name: "泰坦之心", slot: "armor", build: "blood", desc: "攻击附加最大生命伤害；受击积蓄血爆。" },
    { id: "bloodcrown", name: "不灭血冠", slot: "head", build: "blood", desc: "每损失一定生命触发血爆，残血时获得减伤。" },
    { id: "mirrorwall", name: "万镜壁垒", slot: "armor", build: "shield", desc: "受击生成护盾并反射伤害，护盾破裂时爆炸。" },
    { id: "thornring", name: "荆棘王戒", slot: "ring", build: "shield", desc: "反伤可以暴击，并对Boss造成额外伤害。" },
    { id: "emberstaff", name: "焚世余烬", slot: "weapon", build: "burn", desc: "直接伤害叠加灼烧，达到层数后自动引爆。" },
    { id: "ashcrown", name: "灰烬王冠", slot: "head", build: "burn", desc: "引爆后保留一半灼烧层数并提高下一次引爆。" },
    { id: "eternalloop", name: "永续回路", slot: "amulet", build: "cooldown", desc: "释放技能后缩短其他技能冷却，并可能产生回响。" },
    { id: "echoring", name: "无尽回响", slot: "ring", build: "cooldown", desc: "每第三次技能释放复制本次伤害。" },
    { id: "beastpact", name: "万兽盟约", slot: "amulet", build: "pet", desc: "宠物继承主人力量，并在主人攻击后协击。" },
    { id: "twinfang", name: "双生兽牙", slot: "weapon", build: "pet", desc: "宠物攻击可触发主人追击，觉醒宠物获得额外倍率。" },
  ];

  function equippedNamedMythics() {
    return Object.values(state.equipment || {}).filter((it) => it?.rarity === 5 && it.namedMythicId);
  }
  function mythicPowers() {
    const out = { crit: 0, blood: 0, shield: 0, burn: 0, cooldown: 0, pet: 0 };
    equippedNamedMythics().forEach((it) => { if (out[it.buildTag] != null) out[it.buildTag]++; });
    return out;
  }
  function activeBuildText() {
    const p = mythicPowers(), ranked = Object.entries(p).sort((a, b) => b[1] - a[1]);
    const [id, count] = ranked[0];
    return count ? `${BUILDS_041[id].icon}${BUILDS_041[id].name} · ${count}/2核心` : "尚未形成Build";
  }

  function assignNamedMythic(it) {
    if (!it || it.rarity !== 5 || it.namedMythicId) return it;
    const pool = NAMED_MYTHICS_041.filter((x) => x.slot === it.slot);
    if (!pool.length) return it;
    const def = pool[rnd(0, pool.length - 1)];
    it.namedMythicId = def.id;
    it.buildTag = def.build;
    it.name = `神话·${def.name}`;
    it.locked = true;
    return it;
  }

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
    state.buildDamage042 = state.buildDamage042 || {};
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
      p.mutationTrait = p.mutant ? (typeof p.mutationTrait === "string" && p.mutationTrait.trim() ? p.mutationTrait.trim().slice(0, 24) : "原生变异") : null;
    });
    if (state.tab === "rebirth") state.tab = "character";
    delete state.shop?.stock;
    applyDifficultyLevels();
    restoreEncounterState();
  }

  window.ALPHA_041_DIFFICULTIES = DIFFICULTIES;
  window.ALPHA_041_NAMED_MYTHICS = NAMED_MYTHICS_041;
  window.ALPHA_041_BUILDS = BUILDS_041;
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
  const oldMakeEnemy041 = makeEnemy;
  makeEnemy = function (forceBoss = false) {
    const e = oldMakeEnemy041(forceBoss);
    if (!e?.boss || !state.difficultyBreakthroughPending) return e;
    const prefix = typeof bossPrefixById === "function" ? bossPrefixById(e.bossPrefixId) : null;
    e.maxHp = Math.max(1, Math.round(e.maxHp / Math.max(1, prefix?.hp || 1) * 0.82));
    e.hp = e.maxHp;
    e.huntStartHp = e.maxHp;
    e.atk = Math.max(1, Math.round(e.atk / Math.max(1, prefix?.atk || 1) * 0.9));
    e.def = Math.max(0, Math.round(e.def / Math.max(1, prefix?.def || 1)));
    e.level = difficulty().maxLevel + 1;
    e.name = `世界突破：${difficulty().name}守门者`;
    e.bossPrefixId = "none";
    e.bossPrefixName = "";
    e.bossPrefixDesc = "固定标准模板";
    e.bossPrefixMechanic = "none";
    e.bossLootMult = 1;
    e.bossGoldMult = 1;
    e.difficultyBreakthrough = true;
    return e;
  };
  bossCycleConfig = function () {
    const period = Math.max(15, 42 - difficulty().index * 2 - (amuletPowers().bossNeed || 0));
    return { threat: difficulty().index, timeLv: 0, base: period, timeReduce: 0, period, retry: Math.ceil(period / 2), amuletReduce: amuletPowers().bossNeed || 0 };
  };

  window.alpha041BeginOfflineProtection = function () {
    const d = difficulty();
    if (state.level <= d.maxLevel + 5) return null;
    const original = MAPS.map((m) => m.levels.slice());
    const protectedMax = Math.max(d.maxLevel, state.level - 6);
    MAPS.forEach((m) => { m.levels = [d.minLevel, protectedMax]; });
    return original;
  };
  window.alpha041EndOfflineProtection = function (snapshot) {
    if (!Array.isArray(snapshot)) return;
    MAPS.forEach((m, i) => { if (snapshot[i]) m.levels = snapshot[i]; });
  };

  // Alpha 0.41 endgame: no reincarnation, hard level cap, and a flatter
  // three-stage curve that is calibrated together with world rewards.
  xpNeed = function (level = state.level) {
    const l = clamp(Math.round(level), 1, LEVEL_CAP_041);
    if (l <= 40) return Math.round(42 + l * l * 4.7);
    if (l <= 100) return Math.round(7560 + (l - 40) * 360 + Math.pow(l - 40, 2) * 2.1);
    return Math.round(36720 + (l - 100) * 690);
  };
  const oldGainXp041 = gainXp;
  gainXp = function (amount) {
    if (state.level >= LEVEL_CAP_041) { state.level = LEVEL_CAP_041; state.xp = 0; return; }
    oldGainXp041(amount);
    if (state.level >= LEVEL_CAP_041) { state.level = LEVEL_CAP_041; state.xp = 0; }
  };

  // Only mythics can carry rule-changing powers. Ordinary through legendary
  // gear remains score-first and uses the original comparison model.
  const oldMakeItem041 = makeItem;
  makeItem = function (...args) {
    const currentMap = map(), oldTier = currentMap.gearTier;
    currentMap.gearTier = 1 + Math.floor(difficulty().index / 2);
    let it = oldMakeItem041(...args);
    const forcedWeapon = !!args[1], focus = MAP_FOCUS_SLOTS[state.mapId] || [];
    if (!forcedWeapon && focus.length && !focus.includes(it.slot) && Math.random() < 0.55) {
      for (let i = 0; i < 5 && !focus.includes(it.slot); i++) it = oldMakeItem041(...args);
    }
    currentMap.gearTier = oldTier;
    return assignNamedMythic(it);
  };
  const oldItemText041 = itemText;
  itemText = function (it) {
    const base = oldItemText041(it), def = NAMED_MYTHICS_041.find((x) => x.id === it?.namedMythicId);
    return def ? `${base} / 【${BUILDS_041[def.build].name}】${def.desc}` : base;
  };
  const oldSellNonUpgrade041 = sellNonUpgradeItems;
  sellNonUpgradeItems = function () {
    const protectedItems = state.inventory.filter((it) => it.rarity === 5 && it.namedMythicId && !it.locked);
    protectedItems.forEach((it) => { it.locked = true; });
    return oldSellNonUpgrade041();
  };

  function recordDamage042(kind, amount) {
    const key = difficulty().id;
    state.buildDamage042[key] = state.buildDamage042[key] || {};
    state.buildDamage042[key][kind] = (state.buildDamage042[key][kind] || 0) + Math.max(0, Math.round(amount));
  }
  function directBuildDamage(e, amount, label, kind) {
    const dmg = Math.max(1, Math.round(amount));
    e.hp -= dmg;
    recordDamage042(kind, dmg);
    log(`${label}造成${dmg}伤害。`, "important", "damage");
    return dmg;
  }
  const oldPlayerAttack041 = playerAttack;
  playerAttack = function () {
    const e = state.enemy;
    if (!e) return;
    const before = e.hp, mpBefore = state.mp, p = mythicPowers(), s = stats();
    oldPlayerAttack041();
    const dealt = Math.max(0, before - e.hp);
    if (!dealt) return;
    recordDamage042("basic", dealt);
    state.temp = state.temp || {};
    if (p.crit) {
      const critChance = clamp((s.rawCrit || s.crit) / 100, 0, 2);
      if (Math.random() < Math.min(1, critChance)) {
        const strong = Math.random() < Math.max(0, critChance - 1);
        directBuildDamage(e, dealt * (strong ? 1.15 + p.crit * 0.25 : 0.38 + p.crit * 0.12), strong ? "【强烈暴击·断界】" : "【暴击追斩】", "crit");
        Object.keys(state.skillReadyAt || {}).forEach((id) => { state.skillReadyAt[id] = Math.max(state.combatTurn, state.skillReadyAt[id] - p.crit); });
      }
    }
    if (p.blood) directBuildDamage(e, s.maxHp * (0.009 + p.blood * 0.004), "【泰坦血击】", "blood");
    if (p.burn) {
      e.burn041 = (e.burn041 || 0) + 2 + p.burn * 2;
      if (e.burn041 >= 12) {
        const layers = e.burn041;
        directBuildDamage(e, dealt * (0.75 + layers * 0.07), "【焚世引爆】", "burn");
        e.burn041 = p.burn >= 2 ? Math.floor(layers / 2) : 0;
      }
    }
    if (p.cooldown && state.mp < mpBefore) {
      state.temp.spells041 = (state.temp.spells041 || 0) + 1;
      Object.keys(state.skillReadyAt || {}).forEach((id) => { state.skillReadyAt[id] = Math.max(state.combatTurn, state.skillReadyAt[id] - p.cooldown); });
      if (p.cooldown >= 2 && state.temp.spells041 % 3 === 0) directBuildDamage(e, dealt * 0.72, "【无尽回响】", "cooldown");
    }
    if (p.pet && activePet() && petAlive(activePet())) directBuildDamage(e, expectedPetRoundDamageAgainst(e) * (0.3 + p.pet * 0.15), "【盟约协击】", "pet");
  };

  const oldEnemyAttack041 = enemyAttack;
  enemyAttack = function () {
    const e = state.enemy;
    if (!e) return;
    const hpBefore = state.hp, p = mythicPowers(), s = stats();
    oldEnemyAttack041();
    const taken = Math.max(0, hpBefore - Math.max(0, state.hp));
    if (!taken || !e || e.hp <= 0) return;
    state.temp = state.temp || {};
    if (p.shield) {
      const barrier = Math.round(taken * (0.35 + p.shield * 0.12));
      state.temp.mythicShield041 = (state.temp.mythicShield041 || 0) + barrier;
      state.hp = Math.min(s.maxHp, state.hp + barrier);
      directBuildDamage(e, taken * (0.55 + p.shield * 0.28), "【万镜反伤】", "shield");
    }
    if (p.blood) {
      state.temp.bloodTaken041 = (state.temp.bloodTaken041 || 0) + taken;
      if (state.temp.bloodTaken041 >= s.maxHp * 0.25) {
        directBuildDamage(e, s.maxHp * (0.06 + p.blood * 0.025), "【不灭血爆】", "blood");
        state.temp.bloodTaken041 = 0;
      }
    }
  };

  const oldPetTurn041 = petTurn;
  petTurn = function () {
    const e = state.enemy;
    if (!e) return;
    const before = e.hp, p = mythicPowers();
    oldPetTurn041();
    const dealt = Math.max(0, before - e.hp);
    if (dealt) recordDamage042("pet", dealt);
    if (dealt && p.pet) directBuildDamage(e, dealt * (0.35 + p.pet * 0.22), "【双生共战】", "pet");
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
    state.difficultyBreakthroughPending = true;
    state.enemy = null;
    prepareNewBattle();
    log(`已发起【${difficulty().name}】世界突破，下一战为区域Boss。`, "important", "important");
    render(false);
  };
  rebirth = function () { alert("转生已在Alpha 0.42永久移除；Lv.140后请继续优化装备、神话与宠物构筑。"); };

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
    if (won && enemy?.difficultyBreakthrough && difficulty().index === state.highestUnlockedDifficulty && state.highestUnlockedDifficulty < DIFFICULTIES.length - 1) {
      state.highestUnlockedDifficulty++;
      const unlocked = DIFFICULTIES[state.highestUnlockedDifficulty];
      log(`【世界突破】已解锁${unlocked.name}。难度不会自动切换。`, "important", "important");
    }
    if (won && enemy?.difficultyBreakthrough) state.difficultyBreakthroughPending = false;
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
    const d = difficulty(), stats = state.difficultyStats[d.id] || {}, damage = state.buildDamage042[d.id] || {}, total = Object.values(damage).reduce((n, x) => n + x, 0);
    const damageRows = Object.entries(DAMAGE_LABELS_042).filter(([id]) => damage[id]).sort((a,b)=>(damage[b[0]]||0)-(damage[a[0]]||0)).map(([id,name])=>`<div class="stat"><b>${total ? Math.round((damage[id]||0)/total*100) : 0}%</b>${name}</div>`).join("");
    return `<div class="card difficulty-card"><div class="map-head"><h3>世界难度 · ${d.name}</h3><b>Lv.${d.minLevel}—${d.maxLevel} · 装备${1 + Math.floor(d.index / 2)}阶 · 最高 ${DIFFICULTIES[state.highestUnlockedDifficulty].name}</b></div><div class="compact-meta">生命×${d.hp.toFixed(2)} · 攻击×${d.atk.toFixed(2)} · 综合收益×${d.reward.toFixed(2)} · ${d.torment ? "命名神话／变异X已开放" : "等级成长阶段"}</div><div class="compact-meta"><b>当前构筑：${activeBuildText()}</b>｜普通—传说按评分优先；只有命名神话按机制选择。</div><div class="difficulty-grid">${DIFFICULTIES.map((x) => `<button ${x.index > state.highestUnlockedDifficulty ? "disabled" : ""} class="${x.id === d.id ? "active" : ""}" onclick="setWorldDifficulty('${x.id}')">${x.name}<small>Lv.${x.minLevel}—${x.maxLevel}</small></button>`).join("")}</div><div class="controls"><button onclick="challengeDifficultyBoss()">挑战${d.name}固定突破Boss</button></div><div class="compact-meta">本难度胜率：${stats.battles ? ((stats.wins / stats.battles) * 100).toFixed(1) + "%" : "—"}。突破Boss无随机前缀；胜利只解锁下一档，不自动升档。</div>${damageRows ? `<h3>构筑伤害贡献</h3><div class="stat-table">${damageRows}</div>` : ""}</div>`;
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

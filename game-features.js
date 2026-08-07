/* Battle Without End — consolidated feature rules. Load after game-core.js. */

/* ===== identity-start-gear.js ===== */
/* Alpha 0.35 - single humble start + profession-specific equipment scoring */
(() => {
  "use strict";
  if (typeof STYLES === "undefined" || typeof SKILLS === "undefined") return;

  // ---- One fixed starting identity ----
  STYLES.farmer = {
    name: "农民",
    icon: "🌾",
    rarity: 0,
    starter: true,
    archetype: "melee",
    growth: { str: 1.0, int: 0.86, dex: 0.92, will: 1.02, luck: 1.02 },
    skills: ["farmer_swing"],
    desc: "最普通的起点。没有职业优势，真正的职业需要从Boss身上获得。",
  };
  SKILLS.farmer_swing = {
    name: "挥锄",
    classId: "farmer",
    type: "active",
    cat: "attack",
    baseChance: 0.3,
    cooldown: 1,
    kind: "damage",
    mult: 1.45,
    desc: "朴素的基础攻击技能。正式职业解锁后会自然取代它。",
  };
  ["melee", "ranged", "magic"].forEach((id) => {
    if (STYLES[id]) STYLES[id].starter = false;
  });
  if (Array.isArray(STARTER_RACES))
    STARTER_RACES.splice(0, STARTER_RACES.length, "human");
  if (Array.isArray(STARTER_CLASSES))
    STARTER_CLASSES.splice(0, STARTER_CLASSES.length, "farmer");

  // ---- Profession-specific equipment demand ----
  const BASE = {
    atk: 0.55,
    crit: 0.45,
    str: 0.45,
    dex: 0.45,
    int: 0.45,
    will: 0.45,
    luck: 0.35,
    hp: 0.45,
    mp: 0.25,
    def: 0.45,
  };
  const P = (prefs, weapons, weights) => ({
    prefs,
    weapons,
    weights: { ...BASE, ...weights },
  });
  const PROFILES = {
    farmer: P(["str", "hp", "def"], ["axe", "sword"], {
      str: 1.25,
      hp: 1.1,
      def: 1.05,
      luck: 0.65,
      atk: 0.95,
      crit: 0.45,
      int: 0.12,
      mp: 0.1,
    }),
    melee: P(["str", "atk", "crit"], ["sword", "axe"], {
      str: 1.48,
      atk: 1.38,
      crit: 1.22,
      def: 0.75,
      hp: 0.72,
      dex: 0.66,
      int: 0.08,
      mp: 0.08,
    }),
    ranged: P(["dex", "crit", "atk"], ["bow", "crossbow"], {
      dex: 1.48,
      crit: 1.55,
      atk: 1.25,
      luck: 0.78,
      str: 0.28,
      hp: 0.55,
      def: 0.48,
      int: 0.08,
      mp: 0.08,
    }),
    magic: P(["int", "mp", "will"], ["staff", "tome"], {
      int: 1.55,
      mp: 1.32,
      will: 1.12,
      atk: 1.18,
      luck: 0.62,
      crit: 0.52,
      hp: 0.52,
      str: 0.06,
      dex: 0.15,
    }),
    guardian: P(["def", "hp", "will"], ["sword", "axe"], {
      def: 1.62,
      hp: 1.5,
      will: 1.3,
      str: 0.86,
      atk: 0.7,
      crit: 0.28,
      dex: 0.22,
      int: 0.18,
      mp: 0.16,
    }),
    warlock: P(["int", "hp", "will"], ["tome", "staff"], {
      int: 1.42,
      hp: 1.3,
      will: 1.2,
      mp: 1.05,
      atk: 1.02,
      crit: 0.58,
      luck: 0.48,
      str: 0.08,
      dex: 0.18,
    }),
    hunter: P(["crit", "dex", "atk"], ["bow", "crossbow"], {
      crit: 1.68,
      dex: 1.52,
      atk: 1.28,
      luck: 0.86,
      hp: 0.46,
      def: 0.38,
      str: 0.2,
      int: 0.05,
      mp: 0.06,
    }),
    paladin: P(["will", "hp", "def"], ["sword"], {
      will: 1.52,
      hp: 1.42,
      def: 1.36,
      str: 1.02,
      atk: 0.88,
      int: 0.65,
      mp: 0.48,
      crit: 0.3,
      dex: 0.16,
    }),
    assassin: P(["crit", "dex", "atk"], ["sword"], {
      crit: 1.78,
      dex: 1.62,
      atk: 1.34,
      luck: 0.82,
      str: 0.82,
      hp: 0.32,
      def: 0.26,
      int: 0.05,
      mp: 0.05,
    }),
    elementalist: P(["int", "mp", "atk"], ["staff", "tome"], {
      int: 1.72,
      mp: 1.42,
      atk: 1.3,
      will: 0.92,
      crit: 0.62,
      luck: 0.6,
      hp: 0.42,
      str: 0.04,
      dex: 0.12,
    }),
    swordsaint: P(["str", "crit", "atk"], ["sword"], {
      str: 1.66,
      crit: 1.55,
      atk: 1.48,
      dex: 1.02,
      will: 0.58,
      hp: 0.48,
      def: 0.42,
      int: 0.03,
      mp: 0.03,
    }),
    chronomancer: P(["int", "will", "mp"], ["tome", "staff"], {
      int: 1.58,
      will: 1.42,
      mp: 1.34,
      luck: 0.88,
      atk: 0.96,
      crit: 0.58,
      hp: 0.58,
      str: 0.04,
      dex: 0.3,
    }),
    starwalker: P(["crit", "dex", "luck"], ["bow", "crossbow"], {
      crit: 1.82,
      dex: 1.72,
      luck: 1.34,
      atk: 1.38,
      will: 0.54,
      hp: 0.4,
      def: 0.3,
      str: 0.14,
      int: 0.22,
      mp: 0.12,
    }),
    nightking: P(["str", "hp", "crit"], ["sword", "axe"], {
      str: 1.58,
      hp: 1.42,
      crit: 1.34,
      will: 1.18,
      atk: 1.32,
      def: 0.92,
      int: 0.6,
      dex: 0.5,
      mp: 0.24,
    }),
    arcanesovereign: P(["int", "mp", "will"], ["tome", "staff"], {
      int: 1.82,
      mp: 1.5,
      will: 1.3,
      atk: 1.36,
      luck: 0.92,
      crit: 0.7,
      hp: 0.62,
      str: 0.03,
      dex: 0.24,
    }),
  };
  window.CLASS_GEAR_PROFILES = PROFILES;
  function profile(style = state?.style) {
    return (
      PROFILES[style] || PROFILES[classArchetype(style)] || PROFILES.farmer
    );
  }
  function validStat(x) {
    return (
      typeof GEAR_STAT_NAMES !== "undefined" &&
      Object.prototype.hasOwnProperty.call(GEAR_STAT_NAMES, x)
    );
  }

  defaultGearScorePrefs = function (style = state.style) {
    const p = profile(style).prefs;
    return { primary: p[0], secondary: p[1], tertiary: p[2] };
  };
  ensureGearScorePrefs = function () {
    state.gearScorePrefsByClass = state.gearScorePrefsByClass || {};
    const style = state.style || "farmer",
      defaults = defaultGearScorePrefs(style),
      saved = state.gearScorePrefsByClass[style] || defaults;
    const out = {
      primary: validStat(saved.primary) ? saved.primary : defaults.primary,
      secondary: validStat(saved.secondary)
        ? saved.secondary
        : defaults.secondary,
      tertiary: validStat(saved.tertiary) ? saved.tertiary : defaults.tertiary,
    };
    const seen = new Set();
    ["primary", "secondary", "tertiary"].forEach((k) => {
      if (out[k] && seen.has(out[k])) out[k] = null;
      else if (out[k]) seen.add(out[k]);
    });
    state.gearScorePrefsByClass[style] = out;
    state.gearScorePrefs = out;
    return out;
  };
  setGearScorePref = function (rank, value) {
    const p = ensureGearScorePrefs(),
      v = value || null;
    Object.keys(p).forEach((k) => {
      if (k !== rank && p[k] === v) p[k] = null;
    });
    p[rank] = v;
    state.gearScorePrefsByClass[state.style] = { ...p };
    state.gearScorePrefs = p;
    save();
    render();
  };
  resetGearScorePrefs = function () {
    const d = defaultGearScorePrefs(state.style);
    state.gearScorePrefsByClass = state.gearScorePrefsByClass || {};
    state.gearScorePrefsByClass[state.style] = { ...d };
    state.gearScorePrefs = { ...d };
    save();
    render();
  };
  gearScoreWeights = function () {
    const w = { ...profile().weights },
      p = ensureGearScorePrefs();
    Object.entries(
      GEAR_PREF_BONUS || { primary: 0.55, secondary: 0.3, tertiary: 0.15 },
    ).forEach(([rank, bonus]) => {
      const stat = p[rank];
      if (stat) w[stat] = (w[stat] ?? 0.2) + bonus;
    });
    return w;
  };
  weaponScoreFactor = function (it) {
    if (it?.slot !== "weapon" || !it.weaponType) return 1;
    const pr = profile(),
      wt = WEAPON_TYPES[it.weaponType];
    if (!wt) return 1;
    if (pr.weapons.includes(it.weaponType)) return 1.16;
    if (wt.styles?.includes(classArchetype())) return 0.9;
    return 0.56;
  };

  // Preserve a separate preference set whenever the profession changes.
  window.beforeClassSwitch = function (id) {
    if (state?.style) {
      state.gearScorePrefsByClass = state.gearScorePrefsByClass || {};
      state.gearScorePrefsByClass[state.style] = {
        ...ensureGearScorePrefs(),
      };
    }
    if (STYLES[id]) {
      const d = state.gearScorePrefsByClass?.[id] || defaultGearScorePrefs(id);
      state.gearScorePrefs = { ...d };
    }
  };

  // New games have no identity choice: Human + Farmer only.
  renderStart = function () {
    const app = document.getElementById("app");
    if (!app) return;
    const r = RACES.human,
      c = STYLES.farmer,
      sk = SKILLS.farmer_swing;
    app.innerHTML = `<div class="start"><h1>无尽战域：核心 Alpha 0.40</h1><p class="subtitle">从普通人开始，正式职业沿谱系持续向上进阶，不需要回头补练低级职业。</p>
   <label>角色名称 <input id="hero-name" value="旅者" style="margin-left:8px;background:#12100c;color:#fff;border:1px solid #51442f;padding:7px"></label>
   <div class="grid2" style="margin-top:10px"><div class="choice selected"><h3>${r.icon}${r.name} · ${identityRarityLabel(r)}</h3><div class="compact-meta">唯一初始种族｜特性【${r.traitName}】${r.traitDesc}</div></div>
   <div class="choice selected"><h3>${c.icon}${c.name} · ${identityRarityLabel(c)}</h3><div class="compact-meta">唯一初始职业｜${c.desc}</div><div class="compact-meta">唯一技能：【${sk.name}】｜${sk.desc}</div></div></div>
   ${helpBlock("开局规则", "固定以人类·农民开局。首次击败月背巨狼后获得灰尾幼狼，并随机解锁战士、游侠或法师作为第一个正式职业；其他种族和职业继续由Boss身份掉落永久解锁。职业一经解锁，其技能立即永久可用；高级职业自动继承同谱系熟练成果并取代低阶技能。")}
   <div class="controls" style="margin-top:10px"><button onclick="startGame()">开始无尽战斗</button></div></div>`;
  };
  startGame = function () {
    state = fresh();
    state.started = true;
    state.race = "human";
    state.style = "farmer";
    state.unlockedRaces = ["human"];
    state.unlockedClasses = ["farmer"];
    const nameEl = document.getElementById("hero-name");
    state.name = sanitizePlayerName(nameEl?.value);
    state.gearScorePrefsByClass = { farmer: defaultGearScorePrefs("farmer") };
    state.gearScorePrefs = { ...state.gearScorePrefsByClass.farmer };
    const starter = makeItem(1, "sword", 0, false);
    starter.name = "旧铁锄";
    starter.locked = true;
    starter.weaponType = "sword";
    state.equipment.weapon = starter;
    syncSkills();
    state.activeSkillSlots = ["farmer_swing"];
    state.passiveSkillSlots = [];
    syncSkills();
    prepareNewBattle();
    log(
      "你以普通人类·农民的身份踏入无尽战域。除【挥锄】外，其他种族、职业与技能都要靠Boss掉落获得。",
      "important",
      "important",
    );
    if (typeof window.onGameStarted === "function") window.onGameStarted();
    save();
    render();
  };

  // Existing saves are not destructively stripped of identities already unlocked in previous alpha builds.
  // They do gain Farmer as a valid ordinary class only when it is actually unlocked or on a fresh start.
  try {
    if (state?.started) ensureGearScorePrefs();
  } catch (_) {}
})();

/* ===== skill-cooldown-balance.js ===== */
/* Alpha 0.34 skill cooldown rebalance: compact 1-4 turn cadence, hard design cap 5. */
(() => {
  "use strict";
  if (typeof SKILLS === "undefined") return;
  const CD = {
    warrior_slash: 1,
    ranger_volley: 1,
    mage_fireball: 1,
    guard_wall: 2,
    warlock_drain: 2,
    hunter_pierce: 2,
    hunter_execute: 3,
    paladin_strike: 1,
    paladin_heal: 3,
    assassin_shadow: 2,
    assassin_corrosion: 2,
    element_burst: 1,
    element_storm: 3,
    saint_slash: 2,
    saint_counter: 3,
    chrono_fracture: 2,
    chrono_rewind: 3,
    star_fall: 2,
    star_hunt: 4,
    night_feast: 3,
    night_mirror: 4,
    arcane_cataclysm: 3,
    arcane_reversal: 4,
  };
  Object.entries(CD).forEach(([id, cd]) => {
    if (SKILLS[id]?.type === "active")
      SKILLS[id].cooldown = Math.max(0, Math.min(5, cd));
  });
  // Drop cooldowns already queued under the previous balance table.
  if (typeof state !== "undefined" && state?.started) state.skillReadyAt = {};
  window.SKILL_COOLDOWN_BALANCE = Object.freeze({ ...CD });
})();

/* ===== early-progression-balance.js ===== */
/* Alpha 0.35 - core gameplay: progression milestone, real threat and boss hunting UX. */
(() => {
  "use strict";
  if (typeof MAPS === "undefined" || typeof SKILLS === "undefined") return;

  // ---- New Moon Meadow: explicit starter buffer ----
  const meadow = MAPS.find((m) => m.id === "meadow");
  if (meadow) meadow.levels = [1, 5];
  const originalMakeEnemy = typeof makeEnemy === "function" ? makeEnemy : null;
  if (originalMakeEnemy) {
    makeEnemy = function (forceBoss = false) {
      const e = originalMakeEnemy(forceBoss);
      if (!e || e.mapId !== "meadow") return e;
      if (e.boss) {
        // Keep the first boss as a real progression check; only soften its burst slightly.
        e.atk = Math.max(1, Math.round(e.atk * 0.9));
        e.def = Math.max(0, Math.round(e.def * 0.95));
        e.cp = Math.max(1, Math.round(e.cp * 0.94));
      } else {
        e.maxHp = Math.max(1, Math.round(e.maxHp * 0.85));
        e.hp = e.maxHp;
        e.atk = Math.max(1, Math.round(e.atk * 0.8));
        e.def = Math.max(0, Math.round(e.def * 0.9));
        e.cp = Math.max(1, Math.round(e.cp * 0.84));
      }
      return e;
    };
  }

  // ---- Short skill-training curve ----
  // Focused active training target: about 180 proficiency points to Lv.10.
  // Passive target: 720 winning battles (12 min at 1 win/sec; ~24-36 min at 2-3 sec/win).
  const FAST_ACTIVE = [0, 4, 10, 20, 34, 52, 75, 104, 138, 180];
  const FAST_PASSIVE = [0, 20, 50, 95, 155, 230, 320, 430, 560, 720];
  window.FAST_SKILL_TRAINING = {
    active: [...FAST_ACTIVE],
    passive: [...FAST_PASSIVE],
  };
  skillThresholds = function (id) {
    return SKILLS[id]?.type === "passive" ? FAST_PASSIVE : FAST_ACTIVE;
  };

  function activeMasteryWeight(id) {
    const sk = SKILLS[id] || {},
      cd = Math.max(0, Number(sk.cooldown || 0));
    if (sk.kind === "execute" || sk.kind === "mirror" || cd >= 4) return 4;
    if (
      sk.kind === "heal" ||
      sk.kind === "counter" ||
      cd >= 3 ||
      (sk.baseChance || 1) <= 0.18
    )
      return 3;
    if (cd >= 2 || (sk.baseChance || 1) <= 0.24) return 2;
    return 1;
  }
  registerSkillUse = function (id) {
    const sk = SKILLS[id];
    if (!id || sk?.type !== "active") return;
    const oldLv = skillLevel(id),
      mult = (rebirthProfile().skillMastery || 1) * activeMasteryWeight(id);
    let gain = Math.floor(mult),
      fraction = mult - gain;
    if (Math.random() < fraction) gain++;
    gain = Math.max(1, gain);
    state.skillUse[id] = (state.skillUse[id] || 0) + gain;
    const newLv = skillLevel(id);
    if (newLv > oldLv) log(`${sk.name}提升至Lv.${newLv}。`, "sys", "system");
    if (newLv >= 10 && !state.skillMastered?.[id]) {
      state.skillMastered[id] = true;
      log(
        `【技能满级】${sk.name}达到Lv.10，效果成长完成。`,
        "important",
        "important",
      );
    }
  };

  // Any old save already above the new threshold should immediately resolve as mastered.
  try {
    if (state?.started && typeof syncSkills === "function") syncSkills();
  } catch (_) {}

  // ---- Automatic danger: boss win +1, any defeat -1 ----
  renderMaps = function () {
    return `${typeof window.renderMapSystemsBefore === "function" ? window.renderMapSystemsBefore() : ""}${helpBlock("地图、稀有遭遇与危险度说明", "所有地图始终可进入。普通战有0.5%概率遭遇宝箱怪，提供100倍基础金币且不会替代Boss。Boss前缀不再只有掉率倍率：藏珍每4回合生成护盾；镀金前4回合减伤40%；天眷每4回合恢复5%；星辉半血后升华。失败重遇时前缀与机制固定。<br><br>危险度全自动运行：击败区域Boss后升1级，任意战斗失败后降1级，最低T0。T0的Boss基础周期为50只普通怪，每级危险度减少5只；时流法则和猎手罗盘继续缩短，最终可降至0只并进入连续Boss战。挑战失败后完成该次Boss原完整周期的一半（向上取整）再战。每张地图只掉落一种区域宠物，且仍然只有Boss能掉落宠物。")}${MAPS.map(
      (m) => {
        const effective = effectiveMapCp(m),
          ratio = effective / Math.max(1, cp()),
          risk =
            ratio < 0.75
              ? ["安全", "risk-safe"]
              : ratio < 1.35
                ? ["适中", "risk-even"]
                : ratio < 2.5
                  ? ["高危", "risk-hard"]
                  : ["极危", "risk-hard"],
          bp = state.bossProgress[m.id],
          metric = ensureMetric(m.id),
          actual = metric.battles
            ? `${((metric.wins / metric.battles) * 100).toFixed(1)}%`
            : "—",
          cycle = ensureBossCycle(m.id),
          d = dangerDropProfile(m.id),
          w = worldCombatScale(m.id),
          selected = cycle.threatTier || 0,
          unlocked = cycle.threatUnlocked || 0;
        return `<div class="map-card ${state.mapId === m.id ? "selected" : ""}"><div class="map-head"><b>${m.name} · 自动T${selected}｜历史最高T${unlocked}｜${threatCapText(m.id)}</b><span class="${risk[1]}">${risk[0]} · CP ${effective}</span></div><div class="compact-meta">Lv.${m.levels[0]}—${m.levels[1]} · 装备${m.gearTier}阶 · 区域宠物：${m.pet} · 预计胜率${estimatedWin(m)}% · 区域总胜率${actual}</div><div class="compact-meta">${bossEncounterText(m.id)}${bp ? ` · Boss ${Math.round(bp.hp)}/${bp.maxHp}` : ""} · 已击败${cycle.bossWins}次</div><div class="compact-meta"><b>Boss机制：</b>${bossTacticalHint(m.id)}</div>${miniDetail("危险度与掉落详情", `自动规则：Boss胜利T+1｜任意失败T−1｜最低T0<br>敌人：生命×${w.hp.toFixed(2)}｜攻击×${w.atk.toFixed(2)}｜防御×${w.def.toFixed(2)}｜速度×${w.speed.toFixed(2)}<br>战斗收益：经验/金币×${w.reward.toFixed(2)}｜装备×${d.gearDrop.toFixed(2)}｜区域宠物×${d.petDrop.toFixed(2)}｜神话×${d.mythic.toFixed(2)}｜变异X×${d.mutation.toFixed(2)}｜身份×${d.identity.toFixed(2)}<br>稀有遭遇：宝箱怪0.5%｜Boss前缀总概率42%｜星辉前缀1%<br>怪物：${m.monsters.join("、")}｜Boss：${m.boss}｜唯一宠物：${m.pet}`)}<div class="controls"><button ${state.mapId === m.id ? "disabled" : ""} onclick="changeMap('${m.id}')">前往</button></div></div>`;
      },
    ).join("")}`;
  };

  // ---- First-boss profession result (randomized in core-11) ----
  function renderStarterProfessionChoice() {
    document.getElementById("starter-profession-overlay")?.remove();
  }
  renderStarterProfessionChoice();
})();

/* ===== build-system-v14.js ===== */
/* Alpha 0.34 v14 - 4 active / 5 passive, universal weapon attack, soft profession fit. */
(() => {
  "use strict";
  if (typeof SKILLS === "undefined" || typeof state === "undefined") return;
  const ACTIVE_LIMIT = 4,
    PASSIVE_LIMIT = 5;
  window.SKILL_SLOT_LIMITS = Object.freeze({
    active: ACTIVE_LIMIT,
    passive: PASSIVE_LIMIT,
  });

  // ---- Skill slots: collection should be visible in the build, especially passives. ----
  syncSkills = function () {
    state.skills = state.skills || {};
    state.skillUse = state.skillUse || {};
    state.skillMastered = state.skillMastered || {};
    state.activeSkillSlots = Array.isArray(state.activeSkillSlots)
      ? state.activeSkillSlots
          .filter((id) => SKILLS[id]?.type === "active" && skillUsable(id))
          .slice(0, ACTIVE_LIMIT)
      : [];
    state.passiveSkillSlots = Array.isArray(state.passiveSkillSlots)
      ? state.passiveSkillSlots
          .filter((id) => SKILLS[id]?.type === "passive" && skillUsable(id))
          .slice(0, PASSIVE_LIMIT)
      : [];
    for (const id of unlockedSkills()) {
      if (state.skillUse[id] === undefined) state.skillUse[id] = 0;
      if (skillLevel(id) >= 10) state.skillMastered[id] = true;
    }
    if (!state.activeSkillSlots.length)
      state.activeSkillSlots = nativeActiveSkills().slice(0, ACTIVE_LIMIT);
    if (!state.passiveSkillSlots.length)
      state.passiveSkillSlots = nativePassiveSkills().slice(0, PASSIVE_LIMIT);
    state.skillPriority = {
      attack: state.activeSkillSlots.filter(
        (id) => SKILLS[id]?.cat === "attack",
      ),
      defense: state.activeSkillSlots.filter(
        (id) => SKILLS[id]?.cat === "defense",
      ),
    };
    state.activeSkillSlots.forEach((id) => (state.skills[id] = true));
  };
  toggleActiveSkill = function (id) {
    if (!SKILLS[id] || SKILLS[id].type !== "active" || !skillUsable(id)) return;
    state.activeSkillSlots = state.activeSkillSlots || [];
    const i = state.activeSkillSlots.indexOf(id);
    if (i >= 0) state.activeSkillSlots.splice(i, 1);
    else {
      if (state.activeSkillSlots.length >= ACTIVE_LIMIT)
        return alert(`主动技能槽最多${ACTIVE_LIMIT}个，请先卸下一个。`);
      state.activeSkillSlots.push(id);
    }
    syncSkills();
    save();
    render();
  };
  togglePassiveSkill = function (id) {
    if (!SKILLS[id] || SKILLS[id].type !== "passive" || !skillUsable(id))
      return;
    state.passiveSkillSlots = state.passiveSkillSlots || [];
    const i = state.passiveSkillSlots.indexOf(id);
    if (i >= 0) state.passiveSkillSlots.splice(i, 1);
    else {
      if (state.passiveSkillSlots.length >= PASSIVE_LIMIT)
        return alert(`被动技能槽最多${PASSIVE_LIMIT}个，请先卸下一个。`);
      state.passiveSkillSlots.push(id);
    }
    syncSkills();
    save();
    render();
  };
  equipNativeClassSet = function (styleId = state.style) {
    if (styleId !== state.style) return;
    state.activeSkillSlots = nativeActiveSkills(styleId).slice(0, ACTIVE_LIMIT);
    state.passiveSkillSlots = nativePassiveSkills(styleId).slice(
      0,
      PASSIVE_LIMIT,
    );
    syncSkills();
    save();
    render();
  };
  // ---- One universal Attack stat. Weapons never lose their base attack after a class switch. ----
  if (typeof WEAPON_TYPES !== "undefined") {
    if (WEAPON_TYPES.bow) {
      WEAPON_TYPES.bow.mods = { atkMult: 1.08, speed: 4 };
      WEAPON_TYPES.bow.desc = "攻击+8%，速度+4。";
    }
    if (WEAPON_TYPES.staff) {
      WEAPON_TYPES.staff.mods = { atkMult: 1.1, mp: 10 };
      WEAPON_TYPES.staff.desc = "攻击+10%，最大法力+10。";
    }
  }
  attributeImpactText = function (k) {
    const a = classArchetype(),
      d = {
        str: `每+1力量：生命+5、防御+0.32${a === "melee" ? "，并高效率转化为当前职业攻击" : a === "ranged" ? "，小幅转化为当前职业攻击" : "。"}。`,
        int: `每+1智力：法力+5${a === "magic" ? "，并高效率转化为当前职业攻击" : "。"}。`,
        dex: `每+1敏捷：原始暴击+0.32、平衡+0.45个百分点、速度+0.75${a === "ranged" ? "，并高效率转化为当前职业攻击" : a === "melee" ? "，小幅转化为当前职业攻击" : "。"}。`,
        will: `每+1意志：生命+3、法力+2、防御+1.35${a === "magic" ? "，并小幅转化为当前职业攻击" : "。"}。`,
        luck: "每+1幸运：原始暴击+0.24，并提高装备品质、Boss宠物和身份掉落相关判定。",
      };
    return d[k];
  };
  styleGrowthText = function (styleId = state.style) {
    const c = STYLES[styleId];
    return `${identityGrowthText(c)}｜所有武器与装备统一提供“攻击”；职业只改变基础属性的攻击转化效率，装备攻击始终100%生效。`;
  };

  // ---- Equipment score = mostly universal item strength, softly adjusted by current profession. ----
  const UNIVERSAL = {
    atk: 1.05,
    crit: 0.95,
    str: 0.82,
    dex: 0.82,
    int: 0.82,
    will: 0.82,
    luck: 0.78,
    hp: 0.92,
    mp: 0.78,
    def: 0.92,
  };
  function profilePrefs(style = state.style) {
    const p =
      window.CLASS_GEAR_PROFILES?.[style]?.prefs ||
      window.CLASS_GEAR_PROFILES?.[classArchetype(style)]?.prefs;
    return Array.isArray(p) ? p : ["atk", "hp", "def"];
  }
  function preferredWeapons(style = state.style) {
    const p =
      window.CLASS_GEAR_PROFILES?.[style]?.weapons ||
      window.CLASS_GEAR_PROFILES?.[classArchetype(style)]?.weapons;
    return Array.isArray(p) ? p : [];
  }
  gearScoreWeights = function () {
    const w = { ...UNIVERSAL },
      defaults = profilePrefs();
    [0.3, 0.2, 0.12].forEach((bonus, i) => {
      const stat = defaults[i];
      if (stat) w[stat] = (w[stat] || 0.75) + bonus;
    });
    const custom = ensureGearScorePrefs();
    [
      ["primary", 0.18],
      ["secondary", 0.1],
      ["tertiary", 0.05],
    ].forEach(([rank, bonus]) => {
      const stat = custom[rank];
      if (stat) w[stat] = (w[stat] || 0.75) + bonus;
    });
    return w;
  };
  weaponScoreFactor = function (it) {
    if (it?.slot !== "weapon" || !it.weaponType) return 1;
    return preferredWeapons().includes(it.weaponType) ? 1.08 : 1.0;
  };

  syncSkills();
})();

/* ===== jackpot-system-v14.js ===== */
/* Alpha 0.34 v14 - perfect-roll mythics, super-concentrated affixes, unique mythic powers and mutant X traits. */
(() => {
  "use strict";
  if (
    typeof state === "undefined" ||
    typeof makeItem !== "function" ||
    typeof createPet !== "function"
  )
    return;

  const SUPER_CONCENTRATION_CHANCE = 0.06;
  const MYTHIC_POWER_DEFS = {
    weapon_wargod: {
      slot: "weapon",
      name: "战神之锋",
      desc: "最终攻击+18%。",
      effects: { atkPct: 0.18 },
      score: 1.2,
    },
    weapon_starbreaker: {
      slot: "weapon",
      name: "破星者",
      desc: "攻击+8%，对Boss伤害+25%。",
      effects: { atkPct: 0.08, bossDamage: 0.25 },
      score: 1.22,
    },
    weapon_echo: {
      slot: "weapon",
      name: "战技回响",
      desc: "攻击+8%，技能触发率+8个百分点。",
      effects: { atkPct: 0.08, skillChance: 0.08 },
      score: 1.2,
    },
    head_oracle: {
      slot: "head",
      name: "天启之眼",
      desc: "原始暴击+10，技能触发率+5个百分点。",
      effects: { crit: 10, skillChance: 0.05 },
      score: 1.19,
    },
    head_arcane: {
      slot: "head",
      name: "奥术王冠",
      desc: "最大法力+25%，技能触发率+6个百分点。",
      effects: { mpPct: 0.25, skillChance: 0.06 },
      score: 1.19,
    },
    head_warcrown: {
      slot: "head",
      name: "不屈战冠",
      desc: "最大生命+15%，防御+12%。",
      effects: { hpPct: 0.15, defPct: 0.12 },
      score: 1.19,
    },
    armor_titan: {
      slot: "armor",
      name: "泰坦之躯",
      desc: "最大生命+25%，防御+8%。",
      effects: { hpPct: 0.25, defPct: 0.08 },
      score: 1.21,
    },
    armor_fortress: {
      slot: "armor",
      name: "永固壁垒",
      desc: "防御+22%，最大生命+10%。",
      effects: { defPct: 0.22, hpPct: 0.1 },
      score: 1.21,
    },
    armor_bloodshell: {
      slot: "armor",
      name: "血王之铠",
      desc: "最大生命+14%，全域吸血+8%。",
      effects: { hpPct: 0.14, lifesteal: 0.08 },
      score: 1.22,
    },
    boots_starstep: {
      slot: "boots",
      name: "逐星",
      desc: "速度+22%，原始暴击+5。",
      effects: { speedPct: 0.22, crit: 5 },
      score: 1.18,
    },
    boots_predator: {
      slot: "boots",
      name: "猎影",
      desc: "攻击+10%，原始暴击+8。",
      effects: { atkPct: 0.1, crit: 8 },
      score: 1.19,
    },
    boots_windveil: {
      slot: "boots",
      name: "风界",
      desc: "速度+15%，技能触发率+5个百分点。",
      effects: { speedPct: 0.15, skillChance: 0.05 },
      score: 1.18,
    },
    ring_redmoon: {
      slot: "ring",
      name: "红月",
      desc: "原始暴击+12，暴击伤害+35%。",
      effects: { crit: 12, critDmg: 0.35 },
      score: 1.23,
    },
    ring_sovereign: {
      slot: "ring",
      name: "统御",
      desc: "攻击+12%，技能触发率+5个百分点。",
      effects: { atkPct: 0.12, skillChance: 0.05 },
      score: 1.2,
    },
    ring_hunt: {
      slot: "ring",
      name: "猎王印",
      desc: "对Boss伤害+22%，原始暴击+6。",
      effects: { bossDamage: 0.22, crit: 6 },
      score: 1.21,
    },
    amulet_eternity: {
      slot: "amulet",
      name: "永恒链",
      desc: "全技能冷却-1，技能触发率+4个百分点。",
      effects: { cooldown: 1, skillChance: 0.04 },
      score: 1.23,
    },
    amulet_fate: {
      slot: "amulet",
      name: "命运链",
      desc: "暴击转化效率+10%，技能触发率+6个百分点。",
      effects: { critEfficiency: 0.1, skillChance: 0.06 },
      score: 1.22,
    },
    amulet_bloodking: {
      slot: "amulet",
      name: "血王链",
      desc: "全域吸血+10%，最大生命+12%。",
      effects: { lifesteal: 0.1, hpPct: 0.12 },
      score: 1.22,
    },
  };
  window.MYTHIC_POWER_DEFS = MYTHIC_POWER_DEFS;

  const MUTATION_TRAITS = {
    frenzy: { name: "狂暴异变", desc: "宠物造成的全部伤害+30%。" },
    colossus: { name: "巨躯异变", desc: "最大生命+35%，防御+15%。" },
    overdrive: { name: "超能异变", desc: "攻击与魔力+25%。" },
    regen: { name: "再生异变", desc: "每次行动后额外恢复4%最大生命。" },
    bossbane: { name: "猎王异变", desc: "对区域Boss造成的伤害+40%。" },
    carapace: { name: "硬壳异变", desc: "自身受到的伤害降低18%。" },
    symbiosis: {
      name: "共生护膜",
      desc: "存活出战时，玩家受到的直接伤害降低10%。",
    },
    resonance: { name: "战意共鸣", desc: "存活出战时，玩家攻击+12%。" },
  };
  window.MUTATION_TRAITS = MUTATION_TRAITS;

  function randomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function mythicPowerDef(it) {
    const id =
      typeof it?.mythicPower === "string"
        ? it.mythicPower
        : it?.mythicPower?.id;
    return id ? MYTHIC_POWER_DEFS[id] || null : null;
  }
  function ensureMythicPower(it) {
    if (!it || it.rarity !== 5) return null;
    let def = mythicPowerDef(it);
    if (def) return def;
    const ids = Object.keys(MYTHIC_POWER_DEFS).filter(
      (id) => MYTHIC_POWER_DEFS[id].slot === it.slot,
    );
    const id = randomOf(ids);
    it.mythicPower = id;
    return MYTHIC_POWER_DEFS[id];
  }
  function ensureMutationTrait(p) {
    if (!p?.mutant) return null;
    if (!p.mutationTrait || !MUTATION_TRAITS[p.mutationTrait])
      p.mutationTrait = randomOf(Object.keys(MUTATION_TRAITS));
    return MUTATION_TRAITS[p.mutationTrait];
  }
  function affixDef(stat) {
    return (AFFIXES || []).find((a) => a.stat === stat) || null;
  }
  function maxAffixValue(a, tier, rarity = 5) {
    const q = QUALITY_STAT_MULT[rarity] || 1,
      base = a.max;
    if (a.curve === "crit")
      return Math.max(
        1,
        Math.round(base * (1 + 0.15 * (tier - 1)) * Math.pow(q, 0.55)),
      );
    return Math.max(1, Math.round(base * gearStatTierPower(tier) * q));
  }
  function rebuildMythicAffixes(it, concentrate = false) {
    if (!it || it.rarity !== 5) return it;
    const tier = inferItemTier(it),
      oldAff = Array.isArray(it.affixes) ? it.affixes : [],
      baseStats = { ...(it.stats || {}) };
    oldAff.forEach((a) => {
      if (a?.stat)
        baseStats[a.stat] = (baseStats[a.stat] || 0) - Number(a.value || 0);
    });
    Object.keys(baseStats).forEach((k) => {
      if (Math.abs(baseStats[k]) < 0.0001 || baseStats[k] < 0)
        delete baseStats[k];
    });
    const count = Math.max(1, oldAff.length || 1 + (RARITIES[5]?.aff || 5));
    let defs = [];
    if (concentrate) {
      const chosen = randomOf(AFFIXES);
      defs = Array.from({ length: count }, () => chosen);
      it.superConcentrated = true;
    } else {
      defs = oldAff.map((a) => affixDef(a.stat)).filter(Boolean);
      while (defs.length < count) defs.push(randomOf(AFFIXES));
    }
    it.affixes = defs.map((a) => ({
      name: a.name,
      stat: a.stat,
      value: maxAffixValue(a, tier, 5),
    }));
    it.stats = baseStats;
    it.affixes.forEach(
      (a) => (it.stats[a.stat] = (it.stats[a.stat] || 0) + a.value),
    );
    it.perfectRoll = true;
    it.qualityCurveVersion = Math.max(8, Number(it.qualityCurveVersion || 0));
    return it;
  }

  // Every red affix is a max roll for its tier. The combination remains random.
  const oldRollAffixValue = rollAffixValue;
  rollAffixValue = function (a, tier, rarity) {
    return Number(rarity) === 5
      ? maxAffixValue(a, tier, 5)
      : oldRollAffixValue(a, tier, rarity);
  };
  const oldMakeItem = makeItem;
  makeItem = function (...args) {
    const it = oldMakeItem(...args);
    if (it?.rarity === 5) {
      rebuildMythicAffixes(it, Math.random() < SUPER_CONCENTRATION_CHANCE);
      ensureMythicPower(it);
    }
    return it;
  };

  // Mythic powers add real build strength regardless of profession.
  function mythicGearTotals() {
    const out = {
      atkPct: 0,
      hpPct: 0,
      mpPct: 0,
      defPct: 0,
      speedPct: 0,
      crit: 0,
      critDmg: 0,
      skillChance: 0,
      bossDamage: 0,
      lifesteal: 0,
      cooldown: 0,
      critEfficiency: 0,
    };
    Object.values(state.equipment || {}).forEach((it) => {
      const def = mythicPowerDef(it);
      if (!def) return;
      Object.entries(def.effects || {}).forEach(
        ([k, v]) => (out[k] = (out[k] || 0) + Number(v || 0)),
      );
    });
    return out;
  }
  window.mythicGearTotals = mythicGearTotals;
  const oldAmuletPowers = amuletPowers;
  amuletPowers = function () {
    const p = oldAmuletPowers(),
      m = mythicGearTotals();
    p.cooldown = (p.cooldown || 0) + (m.cooldown || 0);
    p.bossDamage = (p.bossDamage || 0) + (m.bossDamage || 0);
    p.lifesteal = (p.lifesteal || 0) + (m.lifesteal || 0);
    p.critEfficiency = (p.critEfficiency || 0) + (m.critEfficiency || 0);
    p.skillChance = (p.skillChance || 0) + (m.skillChance || 0);
    return p;
  };
  const oldStats = stats;
  stats = function () {
    const s = oldStats(),
      m = mythicGearTotals(),
      p = typeof activePet === "function" ? activePet() : null,
      t = p && p.mutant ? ensureMutationTrait(p) : null;
    if (m.hpPct) s.maxHp = Math.round(s.maxHp * (1 + m.hpPct));
    if (m.mpPct) s.maxMp = Math.round(s.maxMp * (1 + m.mpPct));
    if (m.atkPct) s.atk = Math.round(s.atk * (1 + m.atkPct));
    if (m.defPct) s.def = Math.round(s.def * (1 + m.defPct));
    if (m.speedPct) s.speed = Math.round(s.speed * (1 + m.speedPct));
    if (m.crit) {
      s.rawCrit += m.crit;
      s.crit = applyAmuletCritEfficiency(effectiveCritChance(s.rawCrit));
    }
    if (m.critDmg) s.critMult += m.critDmg;
    if (t && p?.mutationTrait === "resonance" && petAlive(p))
      s.atk = Math.round(s.atk * 1.12);
    return s;
  };

  // Mythic power has its own universal score component; profession fit remains secondary.
  const oldGearScoreBreakdown = gearScoreBreakdown;
  gearScoreBreakdown = function (it) {
    const b = oldGearScoreBreakdown(it),
      def = mythicPowerDef(it);
    if (def) {
      b.mythicPower = def;
      b.mythicPowerMult = def.score;
      b.score = Math.max(1, Math.round(b.score * def.score));
    }
    return b;
  };
  const oldGearScoreDetail = gearScoreDetail;
  gearScoreDetail = function (it) {
    let t = oldGearScoreDetail(it),
      def = mythicPowerDef(it);
    if (def) t += `｜神话特性【${def.name}】${def.desc}｜红装词条：满值`;
    if (it?.superConcentrated) t += "｜超级品：词条高度集中";
    return t;
  };
  const oldItemText = itemText;
  itemText = function (it) {
    let t = oldItemText(it),
      def = mythicPowerDef(it);
    if (def)
      t += ` / <span class="r5">神话特性【${def.name}】：${def.desc}</span>`;
    if (it?.superConcentrated)
      t += ' / <span class="r5">超级品·同源词条集中</span>';
    return t;
  };
  if (typeof compactItemText === "function") {
    const oldCompactItemText = compactItemText;
    compactItemText = function (it) {
      const def = mythicPowerDef(it);
      return (
        oldCompactItemText(it) +
        (def ? `｜<span class="r5">【${def.name}】</span>` : "") +
        (it?.superConcentrated ? '｜<span class="r5">超级品</span>' : "")
      );
    };
  }
  const oldReceiveItem = receiveItem;
  receiveItem = function (it) {
    if (it?.rarity === 5) {
      const def = ensureMythicPower(it);
      log(
        `【神话装备】${it.name}降临：全部词条满值${it.superConcentrated ? " · 超级品词条集中" : ""} · 特性【${def.name}】${def.desc}`,
        "important",
        "important",
      );
    }
    return oldReceiveItem(it);
  };

  // ---- Mutant X: one persistent extra mutation trait on top of the existing X multiplier. ----
  const oldCreatePet = createPet;
  createPet = function (...args) {
    const p = oldCreatePet(...args);
    if (p?.mutant) ensureMutationTrait(p);
    return p;
  };
  const oldPetStats = petStats;
  petStats = function (p) {
    const s = oldPetStats(p);
    if (!p?.mutant) return s;
    ensureMutationTrait(p);
    if (p.mutationTrait === "colossus") {
      s.maxHp = Math.round(s.maxHp * 1.35);
      s.def = Math.round(s.def * 1.15);
    } else if (p.mutationTrait === "overdrive") {
      s.atk = Math.round(s.atk * 1.25);
      s.magic = Math.round(s.magic * 1.25);
    }
    return s;
  };
  const oldPetSpeciesDamageMult = petSpeciesDamageMult;
  petSpeciesDamageMult = function (p, e) {
    let m = oldPetSpeciesDamageMult(p, e);
    if (!p?.mutant) return m;
    ensureMutationTrait(p);
    if (p.mutationTrait === "frenzy") m *= 1.3;
    if (p.mutationTrait === "bossbane" && e?.boss) m *= 1.4;
    return m;
  };
  const oldPetDamageTakenMult = petDamageTakenMult;
  petDamageTakenMult = function (p) {
    let m = oldPetDamageTakenMult(p);
    if (p?.mutant) {
      ensureMutationTrait(p);
      if (p.mutationTrait === "carapace") m *= 0.82;
    }
    return m;
  };
  const oldPlayerDamageTakenPetMult = playerDamageTakenPetMult;
  playerDamageTakenPetMult = function (p) {
    let m = oldPlayerDamageTakenPetMult(p);
    if (p?.mutant && petAlive(p)) {
      ensureMutationTrait(p);
      if (p.mutationTrait === "symbiosis") m *= 0.9;
    }
    return m;
  };
  const oldPetSpeciesAfterAction = petSpeciesAfterAction;
  petSpeciesAfterAction = function (p) {
    oldPetSpeciesAfterAction(p);
    if (!p?.mutant || !petAlive(p)) return;
    ensureMutationTrait(p);
    if (p.mutationTrait === "regen") {
      const ps = petStats(p),
        h = Math.max(1, Math.round(ps.maxHp * 0.04));
      p.hp = Math.min(ps.maxHp, p.hp + h);
    }
  };
  const oldPetScaledTraitText = petScaledTraitText;
  petScaledTraitText = function (p) {
    const base = oldPetScaledTraitText(p);
    if (!p?.mutant) return base;
    const t = ensureMutationTrait(p);
    return `${base}<br><span class="mutant-x"><b>变异特性【${t.name}】</b>：${t.desc}</span>`;
  };
  if (typeof petCombatPower === "function") {
    const oldPetCombatPower = petCombatPower;
    petCombatPower = function (p) {
      let v = oldPetCombatPower(p);
      if (!p?.mutant) return v;
      ensureMutationTrait(p);
      const f =
        {
          frenzy: 1.22,
          regen: 1.1,
          bossbane: 1.1,
          carapace: 1.12,
          symbiosis: 1.08,
          resonance: 1.08,
        }[p.mutationTrait] || 1;
      return Math.round(v * f);
    };
  }
  window.onPetReceivedCandidate = function (p) {
    if (p?.mutant) {
      const t = ensureMutationTrait(p);
      log(
        `【变异X】${p.name}发生独特异变：特性【${t.name}】${t.desc}`,
        "important",
        "important",
      );
    }
  };

  // Upgrade legacy red gear and legacy mutant pets without deleting their existing combinations/progress.
  let migrated = false;
  try {
    const allItems = [
      ...(state.inventory || []),
      ...Object.values(state.equipment || {}).filter(Boolean),
    ];
    allItems.forEach((it) => {
      if (it?.rarity === 5) {
        rebuildMythicAffixes(it, false);
        ensureMythicPower(it);
        migrated = true;
      }
    });
    (state.pets || []).forEach((p) => {
      if (p?.mutant && !p.mutationTrait) {
        ensureMutationTrait(p);
        migrated = true;
      }
    });
    if (migrated && typeof save === "function") save();
  } catch (err) {
    console.warn("v14 jackpot migration skipped", err);
  }
})();

/* ===== equipment-live.js ===== */
/* Alpha 0.34 equipment live-refresh patch */
(function () {
  if (
    typeof renderInventory !== "function" ||
    typeof receiveItem !== "function"
  )
    return;

  const baseRenderInventory = renderInventory;
  renderInventory = function () {
    let html = baseRenderInventory();
    html = html.replace(
      '<div class="grid2"><div class="card"><h3>评分偏好</h3>',
      '<div class="inventory-page"><div class="grid2"><div class="card"><h3>评分偏好</h3>',
    );
    html = html.replace(
      "<p>背包 " +
        state.inventory.length +
        "/" +
        state.inventoryCapacity +
        "</p>",
      '<p>背包 <span id="inventory-count">' +
        state.inventory.length +
        "/" +
        state.inventoryCapacity +
        "</span></p>",
    );
    html = html.replace(
      '<div class="card" style="margin-top:10px"><h3>背包</h3>',
      '<div class="card inventory-backpack" id="inventory-backpack" style="margin-top:7px"><h3>背包</h3>',
    );
    return html + "</div>";
  };

  function refreshInventoryBackpackLive() {
    if (!state || state.tab !== "inventory") return;
    const current = document.getElementById("inventory-backpack");
    if (!current) return;

    const scrollY = window.scrollY;
    const open = [...current.querySelectorAll("details")]
      .map((d, i) => (d.open ? i : -1))
      .filter((i) => i >= 0);
    const tmp = document.createElement("div");
    tmp.innerHTML = renderInventory();
    const next = tmp.querySelector("#inventory-backpack");
    if (!next) return;

    current.replaceWith(next);
    const nextDetails = [...next.querySelectorAll("details")];
    open.forEach((i) => {
      if (nextDetails[i]) nextDetails[i].open = true;
    });

    const count = document.getElementById("inventory-count");
    if (count)
      count.textContent =
        state.inventory.length + "/" + state.inventoryCapacity;
    window.scrollTo(0, scrollY);
  }

  const baseReceiveItem = receiveItem;
  receiveItem = function (it) {
    const before = (state.inventory || []).map((x) => x.id).join("|");
    const result = baseReceiveItem(it);
    const after = (state.inventory || []).map((x) => x.id).join("|");
    if (before !== after) {
      requestAnimationFrame(refreshInventoryBackpackLive);
    }
    return result;
  };

  window.refreshInventoryBackpackLive = refreshInventoryBackpackLive;
})();

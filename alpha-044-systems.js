/* Alpha 0.44 — readable enemy ecologies and build-side counterplay. */
(() => {
  "use strict";
  if (typeof state === "undefined" || typeof makeEnemy !== "function") return;

  const ECOLOGIES_044 = {
    armor: {
      name: "护甲型",
      icon: "🛡️",
      desc: "防御提高35%；破甲、穿透、技能与宠物撕裂更有效。",
    },
    evade: {
      name: "闪避型",
      icon: "💨",
      desc: "可闪避16%普通攻击和8%宠物协击；主动技能不会被闪避。",
    },
    regen: {
      name: "回复型",
      icon: "🌿",
      desc: "每4回合恢复3%最大生命；爆发、处决与持续压制更有效。",
    },
  };

  const MAP_ECOLOGY_044 = {
    meadow: {
      summary: "闪避型为主",
      advice: "主动技能与宠物协击比纯普通攻击稳定。",
      normal: ["evade", "evade", "neutral"],
      boss: "evade",
    },
    hill: {
      summary: "护甲型为主",
      advice: "破甲、穿透和宠物撕裂可以显著缩短战斗。",
      normal: ["armor", "armor", "neutral"],
      boss: "armor",
    },
    forest: {
      summary: "回复型为主",
      advice: "爆发、处决和破甲优于缓慢消耗；Boss自带更强回复。",
      normal: ["regen", "regen", "neutral"],
      boss: "regen",
    },
    shore: {
      summary: "护甲与闪避混合",
      advice: "主动技能兼顾两类生态；穿透负责冰壳，技能负责闪避。",
      normal: ["armor", "evade", "neutral"],
      boss: "armor",
    },
    ruins: {
      summary: "三类混合生态",
      advice: "使用构筑方案保存两套配置，再按当前敌人标签切换。",
      normal: ["armor", "evade", "regen"],
      boss: "evade",
    },
    abyss: {
      summary: "无尽混合生态",
      advice: "敌人生态随遭遇轮换，单一极端Build的效率会波动。",
      normal: ["armor", "evade", "regen"],
      boss: null,
    },
  };

  window.ALPHA_044_ECOLOGIES = ECOLOGIES_044;

  MAPS.forEach((mapDef) => {
    const cfg = MAP_ECOLOGY_044[mapDef.id];
    if (!cfg) return;
    mapDef.ecologySummary = cfg.summary;
    mapDef.ecologyAdvice = cfg.advice;
  });

  function ecologyIdFor044(enemy) {
    const cfg = MAP_ECOLOGY_044[enemy.mapId] || MAP_ECOLOGY_044.ruins;
    if (enemy.boss) {
      if (cfg.boss) return cfg.boss;
      const depth = Math.max(1, Number(enemy.abyssDepth || state.abyssDepth || 1));
      return ["armor", "evade", "regen"][(Math.floor((depth - 1) / 5)) % 3];
    }
    return cfg.normal[Math.floor(Math.random() * cfg.normal.length)] || "neutral";
  }

  function applyEcology044(enemy) {
    if (!enemy || enemy.ecologyApplied044) return enemy;
    const id = ecologyIdFor044(enemy), eco = ECOLOGIES_044[id];
    enemy.ecologyApplied044 = true;
    enemy.ecologyId = id;
    if (!eco) {
      enemy.ecologyName = "普通型";
      enemy.ecologyIcon = "⚔️";
      enemy.ecologyDesc = "没有额外防御生态。";
      return enemy;
    }
    enemy.ecologyName = eco.name;
    enemy.ecologyIcon = eco.icon;
    enemy.ecologyDesc = eco.desc;
    if (id === "armor") {
      enemy.def = Math.max(1, Math.round(enemy.def * 1.35));
      enemy.cp = Math.max(1, Math.round(enemy.cp * Math.pow(1.35, 0.25)));
    } else if (id === "evade") {
      enemy.ecologyEvadeHero = 0.16;
      enemy.ecologyEvadePet = 0.08;
      enemy.cp = Math.max(1, Math.round(enemy.cp * 1.08));
    } else if (id === "regen") {
      enemy.ecologyRegenPct = 0.03;
      enemy.cp = Math.max(1, Math.round(enemy.cp * 1.09));
    }
    return enemy;
  }

  const makeEnemyBefore044 = makeEnemy;
  makeEnemy = function (forceBoss = false) {
    return applyEcology044(makeEnemyBefore044(forceBoss));
  };

  window.alpha044AttackEvaded = function (enemy, skillId, source) {
    if (!enemy || enemy.ecologyId !== "evade" || skillId) return false;
    const chance = source === "pet"
      ? Number(enemy.ecologyEvadePet || 0.08)
      : Number(enemy.ecologyEvadeHero || 0.16);
    return Math.random() < chance;
  };

  window.alpha044EnemyAttackMultiplier = function () {
    return 1;
  };

  window.alpha044OnEnemyRound = function (enemy) {
    if (!enemy || enemy.hp <= 0 || enemy.ecologyId !== "regen") return;
    if ((enemy.round || 0) % 4 !== 0) return;
    // The Soulwood boss already owns a stronger native 4-turn regeneration.
    if (enemy.boss && enemy.mapId === "forest") return;
    const heal = Math.max(1, Math.round(enemy.maxHp * Number(enemy.ecologyRegenPct || 0.03)));
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
    log(`${enemy.name}触发回复生态，恢复${heal}生命。`, "lose", "defense");
  };

  const bossTacticalHintBefore044 = bossTacticalHint;
  bossTacticalHint = function (id = state.mapId) {
    const cfg = MAP_ECOLOGY_044[id];
    const nativeHint = bossTacticalHintBefore044(id);
    return cfg ? `${cfg.summary}：${cfg.advice} ${nativeHint}` : nativeHint;
  };

  const renderInventoryBefore044 = renderInventory;
  renderInventory = function () {
    const weapon = state.equipment?.weapon;
    const level = Math.max(0, Number(weapon?.refine || 0));
    const next = Math.min(10, level + 1);
    const nextGain = next > level ? next * 5 : 0;
    const panel = `<div class="card refine-guide-044"><h3>十级武器精炼</h3><div class="compact-meta">每级新增5%×等级：+1新增5%，+2新增10%……+10新增50%；满级累计提升275%武器属性。</div>${weapon ? `<div class="compact-meta">当前 ${weapon.name}：+${level}/10 · 累计+${refineBonusPct(weapon)}%${nextGain ? ` · 下一级再增加${nextGain}% · 需要${refineCost(weapon)}金币` : " · 已满级"}</div>` : '<div class="compact-meta">装备武器后显示下一次精炼成本。</div>'}</div>`;
    return panel + renderInventoryBefore044();
  };

  const renderMapsBefore044 = renderMaps;
  renderMaps = function () {
    const mapGuide = MAPS.map((mapDef) => `<div><b>${mapDef.name}：</b>${mapDef.ecologySummary}｜${mapDef.ecologyAdvice}</div>`).join("");
    const legend = `<div class="card ecology-legend-044"><h3>敌人生态</h3><div class="ecology-grid-044">${Object.values(ECOLOGIES_044).map((eco) => `<div><b>${eco.icon} ${eco.name}</b><span>${eco.desc}</span></div>`).join("")}</div><details class="mini"><summary>区域生态应对</summary><div class="help-body">${mapGuide}</div></details><div class="compact-meta">生态只改变约20%—40%的战斗效率，不设置免疫；不合适的Build仍能战斗，只是效率较低。</div></div>`;
    return legend + renderMapsBefore044();
  };

  const loadBefore044 = load;
  load = function () {
    const ok = loadBefore044();
    if (!ok) return false;
    state.version = VERSION;
    if (state.enemy) applyEcology044(state.enemy);
    save();
    return true;
  };

  state.version = VERSION;
  if (state.enemy) applyEcology044(state.enemy);
  save();
  render(false);
})();

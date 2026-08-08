/* Alpha 0.45 — lifelong companion paths, complete evolutions and collection codex. */
(() => {
  "use strict";
  if (typeof state === "undefined" || typeof renderPets !== "function") return;

  const LIFELONG_PATHS_045 = {
    hunt: {
      name: "永猎契约",
      icon: "⚔️",
      desc: "伙伴全部伤害+20%，对区域Boss再提高10%。",
    },
    guard: {
      name: "守誓契约",
      icon: "🛡️",
      desc: "伙伴受到伤害降低15%；存活出战时，玩家受到的直接伤害降低6%。",
    },
  };
  window.ALPHA_045_LIFELONG_PATHS = LIFELONG_PATHS_045;

  function mutationKeys045() {
    return Object.keys(window.MUTATION_TRAITS || {});
  }

  function mutationDef045(id) {
    return window.MUTATION_TRAITS?.[id] || {
      name: "未知异变",
      desc: "旧版异变正在重新稳定。",
    };
  }

  function normalizeMutationTrait045(p) {
    if (!p?.mutant) return null;
    const ids = mutationKeys045();
    if (!ids.length) return p.mutationTrait || null;
    if (!ids.includes(p.mutationTrait)) {
      const seed = `${p.id || ""}${petBaseSpecies(p)}`
        .split("")
        .reduce((n, ch) => n + ch.charCodeAt(0), 0);
      p.mutationTrait = ids[seed % ids.length];
    }
    return p.mutationTrait;
  }

  function blankSpeciesRecord045(species) {
    return {
      found: Math.max(0, Number(state.petCodex?.[species] || 0)),
      highestTier: 0,
      types: [],
      branches: [],
      mutations: [],
      lifelongPaths: [],
      initialBond: false,
    };
  }

  function speciesRecord045(species) {
    state.petCodex045 = state.petCodex045 || {};
    const current = state.petCodex045[species] || blankSpeciesRecord045(species);
    current.found = Math.max(
      0,
      Number(current.found || 0),
      Number(state.petCodex?.[species] || 0),
    );
    current.highestTier = Math.max(0, Number(current.highestTier || 0));
    for (const key of ["types", "branches", "mutations", "lifelongPaths"])
      current[key] = [...new Set(Array.isArray(current[key]) ? current[key] : [])];
    current.initialBond = !!current.initialBond;
    state.petCodex045[species] = current;
    return current;
  }

  function branchKey045(stage, choice) {
    return `stage${stage}:${choice}`;
  }

  function recordPetDiscovery045(p) {
    if (!p) return;
    const species = petBaseSpecies(p);
    if (!species) return;
    const record = speciesRecord045(species);
    record.highestTier = Math.max(record.highestTier, Number(p.tier || 1));
    if (p.type && !record.types.includes(p.type)) record.types.push(p.type);
    if (p.evolutionBranches?.stage3) {
      const key = branchKey045(3, p.evolutionBranches.stage3);
      if (!record.branches.includes(key)) record.branches.push(key);
    }
    if (p.evolutionBranches?.stage6) {
      const key = branchKey045(6, p.evolutionBranches.stage6);
      if (!record.branches.includes(key)) record.branches.push(key);
    }
    if (p.mutant) {
      const trait = normalizeMutationTrait045(p);
      if (trait && !record.mutations.includes(trait)) record.mutations.push(trait);
    }
    if (p.initialBond) record.initialBond = true;
    if (p.lifelongPath && !record.lifelongPaths.includes(p.lifelongPath))
      record.lifelongPaths.push(p.lifelongPath);
  }
  window.alpha045RecordPetDiscovery = recordPetDiscovery045;

  function syncPetEvolutionName045(p) {
    if (!p) return;
    const finalRoute = petEvolutionRoute(p, 6) || petEvolutionRoute(p, 3);
    if (finalRoute?.name) p.name = finalRoute.name;
  }

  function ensureAlpha045State() {
    state.version = VERSION;
    state.petCodex = state.petCodex || {};
    state.petCodex045 = state.petCodex045 || {};
    for (const mapDef of MAPS) speciesRecord045(mapDef.pet);

    const pets = state.pets || [];
    if (state.started && pets.length && !pets.some((p) => p.initialBond)) {
      const inherited = activePet() || pets.slice().sort((a, b) => petKeepScore(b) - petKeepScore(a))[0];
      inherited.initialBond = true;
      inherited.locked = true;
    }
    pets.forEach((p) => {
      p.baseSpecies = petBaseSpecies(p);
      p.evolutionBranches = p.evolutionBranches || {};
      syncPetEvolutionName045(p);
      recordPetDiscovery045(p);
    });
  }
  window.alpha045EnsureState = ensureAlpha045State;

  window.chooseLifelongPath045 = function (id, pathId) {
    const p = state.pets.find((x) => x.id === id),
      path = LIFELONG_PATHS_045[pathId];
    if (!p || !p.initialBond || !path) return alert("只有初契伙伴可以建立最终契约。");
    if (Number(p.tier || 1) < 10) return alert("初契伙伴达到10阶后才能建立最终契约。");
    if (p.lifelongPath) return alert("最终契约已经建立，不能重复选择。");
    if (!confirm(`与${p.name}建立【${path.name}】？\n${path.desc}\n\n该选择永久生效。`)) return;
    p.lifelongPath = pathId;
    recordPetDiscovery045(p);
    log(`${p.name}与你建立【${path.name}】：${path.desc}`, "important", "important");
    save();
    render(false);
  };

  window.awakenLifelongPet045 = function (targetId, donorId) {
    const target = state.pets.find((p) => p.id === targetId),
      donor = state.pets.find((p) => p.id === donorId);
    if (!target?.initialBond) return alert("只有初契伙伴可以保留本体完成变异觉醒。");
    if (!donor || donor.id === target.id || !donor.mutant || !samePetSpecies(target, donor))
      return alert("需要同物种变异X宠物作为觉醒素材。");
    const trait = normalizeMutationTrait045(donor),
      def = mutationDef045(trait),
      current = target.mutant ? mutationDef045(normalizeMutationTrait045(target)) : null;
    const prompt = current
      ? `以【${def.name}】替换${target.name}现有的【${current.name}】？`
      : `消耗${donor.name}，让${target.name}觉醒【${def.name}】？`;
    if (!confirm(`${prompt}\n${def.desc}\n\n初契伙伴的等级、阶级、资质和进化路线全部保留。`)) return;
    recordPetDiscovery045(donor);
    target.mutant = true;
    target.mutationGrade = "X";
    target.mutationTrait = trait;
    state.pets = state.pets.filter((p) => p.id !== donor.id);
    recordPetDiscovery045(target);
    const ps = petStats(target);
    target.hp = Math.min(ps.maxHp, Math.max(1, Number(target.hp || ps.maxHp)));
    log(`${target.name}完成变异觉醒并获得【${def.name}】：${def.desc}`, "important", "important");
    save();
    render(false);
  };

  // Finish two route promises that were previously only partially implemented.
  const petSpeciesSpecialBefore045 = petSpeciesSpecial;
  petSpeciesSpecial = function (p, e, ps, s) {
    petSpeciesSpecialBefore045(p, e, ps, s);
    if (
      petBaseSpecies(p) === "树灵幼芽" &&
      p.evolutionBranches?.stage3 === "guardian" &&
      (p.battleTurns || 0) % 4 === 0
    ) {
      const skill =
          petTierInstincts(p).speciesSkill *
          (1 + amuletPowers().petSpecies) *
          petExclusiveSkillScale(p),
        playerBefore = state.hp,
        petBefore = p.hp,
        playerBonus = Math.max(1, Math.round((s.maxHp * 0.06 + ps.magic * 0.35) * skill * 0.4)),
        petBonus = Math.max(1, Math.round((ps.maxHp * 0.08 + ps.magic * 0.28) * skill * 0.4));
      if (playerAlive()) state.hp = Math.min(s.maxHp, state.hp + playerBonus);
      p.hp = Math.min(ps.maxHp, p.hp + petBonus);
      const actualPlayer = Math.max(0, state.hp - playerBefore),
        actualPet = Math.max(0, p.hp - petBefore);
      if (actualPlayer || actualPet)
        log(`${p.name}触发【古木守心】，追加治疗玩家${actualPlayer}、自身${actualPet}。`, "skill", "defense");
    }
  };

  const markPetFallenBefore045 = markPetFallen;
  markPetFallen = function (p) {
    const alreadyRevived = !!p?.apexRevived;
    markPetFallenBefore045(p);
    if (
      !alreadyRevived &&
      p?.apexRevived &&
      !p.fallen &&
      petBaseSpecies(p) === "王魂侍从" &&
      p.evolutionBranches?.stage6 === "apex" &&
      state.enemy?.hp > 0
    ) {
      const ps = petStats(p),
        e = state.enemy,
        dmg = Math.max(1, Math.round(ps.atk * 1.2 + ps.magic * 0.55 - e.def * 0.4));
      e.hp -= dmg;
      log(`${p.name}复起后立即发动魂刃，造成${dmg}穿透伤害。`, "skill", "damage");
    }
  };

  const petSpeciesDamageMultBefore045 = petSpeciesDamageMult;
  petSpeciesDamageMult = function (p, e) {
    let mult = petSpeciesDamageMultBefore045(p, e);
    if (p?.initialBond && p.lifelongPath === "hunt") mult *= e?.boss ? 1.32 : 1.2;
    return mult;
  };

  const petDamageTakenMultBefore045 = petDamageTakenMult;
  petDamageTakenMult = function (p) {
    let mult = petDamageTakenMultBefore045(p);
    if (p?.initialBond && p.lifelongPath === "guard") mult *= 0.85;
    return mult;
  };

  const playerDamageTakenPetMultBefore045 = playerDamageTakenPetMult;
  playerDamageTakenPetMult = function (p) {
    let mult = playerDamageTakenPetMultBefore045(p);
    if (p?.initialBond && p.lifelongPath === "guard" && petAlive(p)) mult *= 0.94;
    return mult;
  };

  const petCombatPowerBefore045 = petCombatPower;
  petCombatPower = function (p) {
    const power = petCombatPowerBefore045(p);
    if (!p?.initialBond) return power;
    if (p.lifelongPath === "hunt") return Math.round(power * 1.22);
    if (p.lifelongPath === "guard") return Math.round(power * 1.18);
    return power;
  };

  const petScaledTraitTextBefore045 = petScaledTraitText;
  petScaledTraitText = function (p) {
    const base = petScaledTraitTextBefore045(p);
    if (!p?.initialBond) return base;
    const path = LIFELONG_PATHS_045[p.lifelongPath];
    return `${base}<br><span class="lifelong-trait-045"><b>初契伙伴${path ? `【${path.name}】` : ""}</b>：${path ? path.desc : "10阶后可选择最终契约。"}</span>`;
  };

  const choosePetEvolutionBefore045 = window.choosePetEvolution;
  window.choosePetEvolution = function (id, stage, choice) {
    choosePetEvolutionBefore045(id, stage, choice);
    const p = state.pets.find((x) => x.id === id);
    if (!p) return;
    syncPetEvolutionName045(p);
    recordPetDiscovery045(p);
    save();
    render(false);
  };

  const beforeReceivePet045 = window.beforeReceivePet;
  window.beforeReceivePet = function (p) {
    const result = typeof beforeReceivePet045 === "function" ? beforeReceivePet045(p) : { handled: false };
    recordPetDiscovery045(p);
    return result;
  };

  function branchNames045(species, record) {
    const sample = { name: species, baseSpecies: species, evolutionBranches: {} };
    return record.branches
      .map((key) => {
        const [stageKey, choice] = key.split(":"),
          stage = Number(stageKey.replace("stage", ""));
        return petEvolutionChoiceDetail(sample, stage, choice)?.name;
      })
      .filter(Boolean);
  }

  function codexSummary045() {
    const records = MAPS.map((m) => speciesRecord045(m.pet)),
      species = records.filter((r) => r.found > 0).length,
      types = new Set(records.flatMap((r) => r.types)).size,
      branches = records.reduce((n, r) => n + r.branches.length, 0),
      mutations = new Set(records.flatMap((r) => r.mutations)).size;
    return { species, types, branches, mutations };
  }
  window.alpha045CodexSummary = codexSummary045;

  function renderCodex045() {
    const totalBranches = MAPS.length * 4,
      summary = codexSummary045();
    return `<div class="card codex-045"><div class="map-head"><h3>伙伴图鉴与长期收集</h3><b>${summary.species}/${MAPS.length}物种</b></div><div class="collection-grid-045"><div><b>${summary.types}/4</b><span>类型</span></div><div><b>${summary.branches}/${totalBranches}</b><span>进化形态</span></div><div><b>${summary.mutations}/${mutationKeys045().length}</b><span>异变特性</span></div><div><b>${state.pets.filter((p) => p.initialBond && p.lifelongPath).length ? "已立誓" : "未立誓"}</b><span>初契终点</span></div></div><div class="codex-species-grid-045">${MAPS.map((m) => {
      const r = speciesRecord045(m.pet),
        seen = r.found > 0,
        routes = branchNames045(m.pet, r),
        mutationNames = r.mutations.map((id) => mutationDef045(id).name);
      return `<details class="codex-species-045 ${seen ? "seen" : "unseen"}"><summary>${seen ? `${PET_SPECIES_ICONS[m.pet] || "🐾"}${m.pet}` : "❔未发现物种"}<span>${seen ? `获得${r.found} · 最高${r.highestTier}阶` : m.name}</span></summary><div class="help-body">来源：${m.name}区域Boss<br>类型：${r.types.length ? r.types.map((id) => PET_TYPES[id]?.name || id).join("、") : "尚未收集"}<br>进化：${routes.length ? routes.join("、") : "0/4"}<br>异变：${mutationNames.length ? mutationNames.join("、") : "尚未发现"}${r.initialBond ? "<br><b>此物种包含你的初契伙伴。</b>" : ""}</div></details>`;
    }).join("")}</div><div class="compact-meta">图鉴记录曾经获得、进化和觉醒过的结果；放归或融合后不会失去发现记录，也不提供每日作业或新货币。</div></div>`;
  }

  function renderLifelongPanel045() {
    const target = (state.pets || []).find((p) => p.initialBond);
    if (!target) return `<div class="card lifelong-card-045"><h3>终身伙伴</h3><div class="muted">选择初契伙伴后开启长期培养。</div></div>`;
    const path = LIFELONG_PATHS_045[target.lifelongPath],
      donors = state.pets.filter((p) => p.id !== target.id && p.mutant && samePetSpecies(target, p));
    const pathUi = path
      ? `<div class="lifelong-selected-045"><b>${path.icon} ${path.name}</b><span>${path.desc}</span></div>`
      : Number(target.tier || 1) >= 10
        ? `<div class="lifelong-choice-grid-045">${Object.entries(LIFELONG_PATHS_045).map(([id, x]) => `<button onclick="chooseLifelongPath045('${target.id}','${id}')"><b>${x.icon} ${x.name}</b><span>${x.desc}</span></button>`).join("")}</div>`
        : `<div class="compact-meta">达到10阶后选择最终契约；当前${target.tier || 1}阶。选择不会增加新货币或日常任务。</div>`;
    const currentMutation = target.mutant ? mutationDef045(normalizeMutationTrait045(target)) : null;
    const awakeningUi = donors.length
      ? donors.map((donor) => {
          const def = mutationDef045(normalizeMutationTrait045(donor));
          return `<button onclick="awakenLifelongPet045('${target.id}','${donor.id}')">觉醒【${def.name}】<small>${def.desc}</small></button>`;
        }).join("")
      : `<span class="muted">在${MAPS.find((m) => m.pet === petBaseSpecies(target))?.name || "对应区域"}击败Boss，寻找同物种变异X素材。</span>`;
    return `<div class="card lifelong-card-045"><div class="map-head"><h3>终身伙伴 · ${target.name}</h3><b>${target.tier || 1}阶 Lv.${target.level || 1}</b></div><div class="compact-meta">这是你的初契伙伴；等级、阶级、资质、进化路线和觉醒都保留在同一只伙伴身上。</div>${pathUi}<details class="mini"><summary>变异觉醒${currentMutation ? ` · 当前【${currentMutation.name}】` : ""}</summary><div class="help-body"><div class="awakening-grid-045">${awakeningUi}</div><div class="compact-meta">觉醒只消耗同物种变异X素材，初契伙伴本体和全部培养记录不会被替换。</div></div></details></div>`;
  }

  window.renderPetSystemsAfter = function () {
    return renderCodex045();
  };

  const renderPetsBefore045 = renderPets;
  renderPets = function () {
    ensureAlpha045State();
    return renderLifelongPanel045() + renderPetsBefore045();
  };

  const renderMapsBefore045 = renderMaps;
  renderMaps = function () {
    ensureAlpha045State();
    const tracker = `<div class="card map-pet-tracker-045"><h3>区域伙伴追踪</h3><div class="map-pet-grid-045">${MAPS.map((m) => {
      const r = speciesRecord045(m.pet);
      return `<div class="${r.found ? "seen" : "unseen"}"><b>${m.name}</b><span>${r.found ? `${PET_SPECIES_ICONS[m.pet] || "🐾"}${m.pet} · 获得${r.found} · 最高${r.highestTier}阶` : `Boss专属：${m.pet} · 尚未发现`}</span></div>`;
    }).join("")}</div><div class="compact-meta">普通怪不会掉落宠物；每个区域Boss只掉落对应物种，便于长期定向收集。</div></div>`;
    return tracker + renderMapsBefore045();
  };

  const loadBefore045 = load;
  load = function () {
    const ok = loadBefore045();
    if (!ok) return false;
    ensureAlpha045State();
    state.version = VERSION;
    save();
    return true;
  };

  ensureAlpha045State();
  state.version = VERSION;
  save();
  render(false);
})();

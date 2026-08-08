/* Alpha 0.43 — idle-first pacing, loot automation and memorable mythic drops. */
(() => {
  "use strict";
  if (typeof state === "undefined" || typeof battleTick !== "function") return;

  const SPEEDS_043 = [1, 2, 4, 10, 20];
  const LIVE_TICK_MS_043 = 650;
  // Offline play resolves one representative encounter every 45 seconds.
  // It is intentionally independent from the live animation speed so a
  // 24-hour return remains bounded on iPhone instead of replaying ~500k turns.
  const OFFLINE_BATTLE_MS_043 = 45000;
  const MAX_HIGHLIGHTS_043 = 24;
  const OLD_MYTHIC_STAT_MULT_043 = 2.05;
  const MYTHIC_STAT_MULT_043 = 1.82;
  let offlineCollector043 = null;
  let audioContext043 = null;

  function escapeHtml043(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function validSpeed043(value) {
    const speed = Number(value);
    return SPEEDS_043.includes(speed) ? speed : 1;
  }

  function ensureAlpha043State() {
    state.battleSpeed = validSpeed043(state.battleSpeed);
    state.autoLoot = {
      minRarity: clamp(Number(state.autoLoot?.minRarity ?? state.autoSell ?? 0), 0, 5),
      keepUpgrades: state.autoLoot?.keepUpgrades !== false,
      ...(state.autoLoot || {}),
    };
    state.autoLoot.minRarity = clamp(Number(state.autoLoot.minRarity) || 0, 0, 5);
    state.autoLoot.keepUpgrades = state.autoLoot.keepUpgrades !== false;
    // The old threshold is disabled. Alpha 0.43 applies its own protected rule set.
    state.autoSell = 0;
    state.lootFeedback = {
      sound: !!state.lootFeedback?.sound,
      haptics: state.lootFeedback?.haptics !== false,
      reducedMotion: !!state.lootFeedback?.reducedMotion,
    };
    state.lootHighlights = Array.isArray(state.lootHighlights)
      ? state.lootHighlights.slice(0, MAX_HIGHLIGHTS_043)
      : [];
    state.discoveredMythics = Array.isArray(state.discoveredMythics)
      ? [...new Set(state.discoveredMythics)]
      : [];
    state.lastOfflineReport = state.lastOfflineReport || null;
    state.lootPauseUntil = Number(state.lootPauseUntil || 0);
  }

  function migrateMythicCurve043(it) {
    if (!it || Number(it.rarity) !== 5) return;
    it.locked = true;
    if (Number(it.qualityCurveVersion || 0) >= 9)
      return;
    const ratio = MYTHIC_STAT_MULT_043 / OLD_MYTHIC_STAT_MULT_043;
    Object.keys(it.stats || {}).forEach((key) => {
      it.stats[key] = Math.max(1, Math.round(Number(it.stats[key] || 0) * ratio));
    });
    (it.affixes || []).forEach((affix) => {
      affix.value = Math.max(1, Math.round(Number(affix.value || 0) * ratio));
    });
    it.score = gearTierScore(inferItemTier(it), 5);
    it.qualityCurveVersion = 9;
  }

  function migrateAllMythics043() {
    (state.inventory || []).forEach(migrateMythicCurve043);
    Object.values(state.equipment || {}).filter(Boolean).forEach(migrateMythicCurve043);
  }

  window.alpha043EnsureState = ensureAlpha043State;

  // Narrow the raw legendary-to-mythic stat gap. Mythic identity now comes
  // primarily from its named rule-changing power, not a runaway stat budget.
  QUALITY_STAT_MULT[5] = MYTHIC_STAT_MULT_043;
  QUALITY_SCORE_MULT[5] = 3.2;
  RARITIES[5].mult = 2.25;

  function restartBattleTimer043() {
    try {
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = null;
      if (state.started && state.running && !document.hidden) {
        tickTimer = setInterval(battleTick, Math.round(LIVE_TICK_MS_043 / validSpeed043(state.battleSpeed)));
      }
    } catch (_) {}
  }

  window.alpha043RestartBattleTimer = restartBattleTimer043;
  window.setBattleSpeed = function (speed) {
    ensureAlpha043State();
    state.battleSpeed = validSpeed043(speed);
    restartBattleTimer043();
    save();
    render();
  };
  window.toggleBattleRunning = function () {
    state.running = !state.running;
    restartBattleTimer043();
    save();
    render();
  };
  window.renderAlpha043BattleControls = function () {
    ensureAlpha043State();
    return `<button onclick="toggleBattleRunning()">${state.running ? "暂停战斗" : "继续战斗"}</button><span class="speed-label">在线速度</span>${SPEEDS_043.map((speed) => `<button class="speed-button ${state.battleSpeed === speed ? "active" : ""}" onclick="setBattleSpeed(${speed})" aria-pressed="${state.battleSpeed === speed}" title="${speed >= 10 ? "测试速度 · " : ""}每回合约${Math.round(LIVE_TICK_MS_043 / speed)}毫秒">×${speed}</button>`).join("")}`;
  };

  const coreBattleTick043 = battleTick;
  battleTick = function () {
    if (!window.__bweOfflineSettlementActive && Date.now() < Number(state.lootPauseUntil || 0)) return;
    return coreBattleTick043();
  };

  function mythicDiscoveryKey043(it) {
    return String(it.namedMythicId || it.mythicPower || `${it.slot}:${it.name}`);
  }

  function recordHighlight043(it, disposition, delta) {
    if (!it || (it.rarity < 4 && delta <= 0)) return;
    const entry = {
      id: it.id,
      name: it.name,
      rarity: it.rarity,
      slot: it.slot,
      tier: inferItemTier(it),
      score: itemScore(it),
      delta: Math.round(delta),
      disposition,
      namedMythicId: it.namedMythicId || null,
      buildTag: it.buildTag || null,
      at: Date.now(),
    };
    state.lootHighlights = [entry, ...(state.lootHighlights || []).filter((x) => x.id !== entry.id)]
      .slice(0, MAX_HIGHLIGHTS_043);
    if (offlineCollector043) offlineCollector043.highlights.push(entry);
  }

  function recordDrop043(it) {
    if (!offlineCollector043 || !it) return;
    const rarity = clamp(Number(it.rarity) || 0, 0, 5);
    offlineCollector043.drops[rarity]++;
  }

  function recordSalvage043(it, value) {
    if (!offlineCollector043) return;
    offlineCollector043.salvaged++;
    offlineCollector043.salvageGold += value;
    offlineCollector043.salvagedByRarity[clamp(Number(it.rarity) || 0, 0, 5)]++;
  }

  function playMythicChime043() {
    if (!state.lootFeedback?.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContext043 || new AudioCtx();
      audioContext043 = ctx;
      if (ctx.state === "suspended") ctx.resume();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      gain.connect(ctx.destination);
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.connect(gain);
        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + 0.9);
      });
    } catch (_) {}
  }

  function showMythicDrop043(it, firstDiscovery) {
    if (window.__bweOfflineSettlementActive || !it) return;
    const reduced = !!state.lootFeedback?.reducedMotion;
    state.lootPauseUntil = Date.now() + (reduced ? 300 : 1500);
    try {
      document.getElementById("mythic-drop-overlay")?.remove();
      const overlay = document.createElement("div");
      overlay.id = "mythic-drop-overlay";
      overlay.className = `mythic-drop-overlay${reduced ? " reduced" : ""}`;
      const build = it.buildTag && window.ALPHA_041_BUILDS?.[it.buildTag]
        ? window.ALPHA_041_BUILDS[it.buildTag].name
        : "改变构筑规则的神话装备";
      overlay.innerHTML = `<div class="mythic-drop-card"><div class="mythic-kicker">${firstDiscovery ? "首次发现 · 命名神话" : "神话掉落"}</div><div class="mythic-name">${escapeHtml043(it.name)}</div><div class="mythic-meta">${escapeHtml043(SLOT_NAMES[it.slot] || it.slot)} · ${escapeHtml043(build)}</div><div class="mythic-hint">已自动锁定并加入重要收获</div></div>`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), reduced ? 900 : 2200);
    } catch (_) {}
    if (state.lootFeedback?.haptics) {
      try { navigator.vibrate?.([45, 35, 80]); } catch (_) {}
    }
    playMythicChime043();
  }

  function salvageDrop043(it, reason) {
    const value = itemSellValue(it);
    state.gold += value;
    recordSalvage043(it, value);
    log(`自动分解 ${it.name}，金币+${value}${reason ? `（${reason}）` : ""}。`, "loot", "loot");
    return value;
  }

  function isProtected043(it, delta) {
    if (it.locked || it.rarity === 5 || it.namedMythicId) return true;
    return !!state.autoLoot.keepUpgrades && delta > 0;
  }

  const receiveItemBefore043 = receiveItem;
  receiveItem = function (it) {
    if (!it) return receiveItemBefore043(it);
    ensureAlpha043State();
    recordDrop043(it);
    const delta = inventoryUpgradeDelta(it);
    const protectedItem = isProtected043(it, delta);
    if (!protectedItem && it.rarity < state.autoLoot.minRarity) {
      recordHighlight043(it, "salvaged", delta);
      salvageDrop043(it, `低于${RARITIES[state.autoLoot.minRarity].name}`);
      return;
    }

    if (it.rarity === 5) {
      it.locked = true;
      it.qualityCurveVersion = Math.max(9, Number(it.qualityCurveVersion || 0));
    }
    if (state.inventory.length >= state.inventoryCapacity) {
      const removable = state.inventory
        .filter((old) => !isProtected043(old, inventoryUpgradeDelta(old)))
        .sort((a, b) => inventoryUpgradeDelta(a) - inventoryUpgradeDelta(b) || itemScore(a) - itemScore(b))[0];
      if (removable) {
        state.inventory = state.inventory.filter((old) => old.id !== removable.id);
        salvageDrop043(removable, "背包替换");
      } else if (protectedItem) {
        state.inventoryCapacity = state.inventory.length + 1;
        log("背包没有可安全处理的装备，系统临时增加1格以保护重要掉落。", "important", "important");
      } else {
        recordHighlight043(it, "salvaged", delta);
        salvageDrop043(it, "背包已满");
        return;
      }
    }

    state.inventory.push(it);
    recordHighlight043(it, "kept", delta);
    log(`获得 ${it.name}：${itemText(it)}。`, it.rarity >= 5 ? "important" : "loot", it.rarity >= 5 ? "important" : "loot");
    if (it.rarity === 5) {
      const key = mythicDiscoveryKey043(it);
      const first = !state.discoveredMythics.includes(key);
      if (first) state.discoveredMythics.push(key);
      if (offlineCollector043) offlineCollector043.mythics.push({ name: it.name, first });
      showMythicDrop043(it, first);
    }
  };

  window.setAutoLootRarity = function (rarity) {
    ensureAlpha043State();
    state.autoLoot.minRarity = clamp(Number(rarity) || 0, 0, 5);
    save();
    render();
  };
  window.setAutoLootUpgradeProtection = function (enabled) {
    ensureAlpha043State();
    state.autoLoot.keepUpgrades = !!enabled;
    save();
    render();
  };
  window.setLootFeedback043 = function (key, enabled) {
    ensureAlpha043State();
    if (["sound", "haptics", "reducedMotion"].includes(key))
      state.lootFeedback[key] = !!enabled;
    if (key === "sound" && enabled) playMythicChime043();
    save();
    render();
  };
  window.clearLootHighlights043 = function () {
    state.lootHighlights = [];
    save();
    render();
  };

  function highlightRows043() {
    const rows = (state.lootHighlights || []).slice(0, 8);
    if (!rows.length) return '<div class="muted">尚无传说、神话或评分提升装备。</div>';
    return rows.map((x) => `<div class="loot-highlight"><div><b class="${RARITIES[x.rarity]?.cls || ""}">${escapeHtml043(x.name)}</b><div class="compact-meta">${escapeHtml043(SLOT_NAMES[x.slot] || x.slot)} · ${x.tier}阶 · 评分${x.score}${x.delta > 0 ? ` · 提升+${x.delta}` : ""}</div></div><span>${x.disposition === "kept" ? "已保留" : "已分解"}</span></div>`).join("");
  }

  window.renderAlpha043LootAutomation = function () {
    ensureAlpha043State();
    const f = state.lootFeedback;
    return `<div class="card"><h3>自动分解与保护</h3><label>自动分解低于 <select onchange="setAutoLootRarity(this.value)">${RARITIES.map((r, i) => `<option value="${i}" ${state.autoLoot.minRarity === i ? "selected" : ""}>${r.name}</option>`).join("")}</select></label><p><label><input type="checkbox" ${state.autoLoot.keepUpgrades ? "checked" : ""} onchange="setAutoLootUpgradeProtection(this.checked)"> 始终保留评分提升装备</label></p><div class="compact-meta">锁定装备、全部神话和命名神话永不自动分解。背包 ${state.inventory.length}/${state.inventoryCapacity}</div><button onclick="sellNonUpgradeItems()">分解现有无提升装备</button></div>`;
  };
  window.renderAlpha043LootHub = function () {
    ensureAlpha043State();
    const report = state.lastOfflineReport;
    return `<div class="card loot-hub"><div class="map-head"><h3>重要收获</h3><button onclick="clearLootHighlights043()">清空记录</button></div>${highlightRows043()}${report ? `<div class="offline-last"><b>上次离线：</b>${escapeHtml043(report.durationText)} · 胜${report.wins}负${report.losses} · 金币+${report.gold} · 装备${report.dropTotal}　<button onclick="showLastOfflineReport043()">查看战报</button></div>` : ""}<details class="mini"><summary>掉落反馈设置</summary><div class="help-body"><label><input type="checkbox" ${state.lootFeedback.sound ? "checked" : ""} onchange="setLootFeedback043('sound',this.checked)"> 神话音效</label>　<label><input type="checkbox" ${state.lootFeedback.haptics ? "checked" : ""} onchange="setLootFeedback043('haptics',this.checked)"> 手机震动</label>　<label><input type="checkbox" ${state.lootFeedback.reducedMotion ? "checked" : ""} onchange="setLootFeedback043('reducedMotion',this.checked)"> 减少动画</label></div></details></div>`;
  };

  function offlineSnapshot043() {
    return {
      level: Number(state.level || 1),
      xp: Number(state.xp || 0),
      metricXp: Number(state.metrics?.xp || 0),
      gold: Number(state.gold || 0),
      wins: Number(state.totalWins || 0),
      losses: Number(state.totalLosses || 0),
      bosses: Object.values(state.bossCycles || {}).reduce((n, x) => n + Number(x?.bossWins || 0), 0),
      pets: Number(state.pets?.length || 0),
      identities: Number(state.unlockedRaces?.length || 0) + Number(state.unlockedClasses?.length || 0),
    };
  }

  window.alpha043OfflineBattleCount = function (elapsedMs) {
    ensureAlpha043State();
    return Math.max(0, Math.floor((Number(elapsedMs) || 0) / OFFLINE_BATTLE_MS_043));
  };
  window.alpha043BeginOfflineSession = function (meta = {}) {
    ensureAlpha043State();
    window.__bweOfflineSettlementActive = true;
    offlineCollector043 = {
      before: offlineSnapshot043(),
      elapsed: Number(meta.elapsed || 0),
      realElapsed: Number(meta.realElapsed || 0),
      drops: [0, 0, 0, 0, 0, 0],
      salvagedByRarity: [0, 0, 0, 0, 0, 0],
      salvaged: 0,
      salvageGold: 0,
      highlights: [],
      mythics: [],
    };
  };

  function offlineWinChance043(enemy) {
    const ratio = cp() / Math.max(1, Number(enemy?.cp || 1));
    let chance = 1 / (1 + Math.exp(-3.1 * Math.log(Math.max(0.05, ratio))));
    if (enemy?.boss) chance -= 0.08;
    return clamp(chance, 0.04, 0.97);
  }

  window.alpha043ResolveOfflineBattle = function () {
    if (!state.started || !state.running) return false;
    ensureEnemy();
    const enemy = state.enemy;
    if (!enemy) return false;
    enemy.round = Math.max(1, Math.round(7 / Math.max(0.35, cp() / Math.max(1, enemy.cp))));
    if (Math.random() < offlineWinChance043(enemy)) {
      enemy.hp = 0;
      winBattle();
    } else {
      state.hp = 0;
      const pet = activePet();
      if (pet) pet.hp = 0;
      loseBattle();
    }
    return true;
  };

  function durationText043(ms) {
    const totalMinutes = Math.max(1, Math.floor(Number(ms || 0) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours}小时${minutes ? `${minutes}分钟` : ""}` : `${minutes}分钟`;
  }

  function reportHtml043(report) {
    const rarityRows = report.drops.map((count, i) => count ? `<span class="${RARITIES[i].cls}">${RARITIES[i].name} ${count}</span>` : "").filter(Boolean).join(" · ") || "无装备掉落";
    const important = report.highlights.slice(0, 10).map((x) => `<div class="offline-loot-row"><b class="${RARITIES[x.rarity]?.cls || ""}">${escapeHtml043(x.name)}</b><span>${x.disposition === "kept" ? "已保留" : "已分解"}${x.delta > 0 ? ` · 提升+${x.delta}` : ""}</span></div>`).join("") || '<div class="muted">本次没有传说、神话或评分提升装备。</div>';
    return `<div class="offline-report-card"><button class="offline-close" onclick="closeOfflineReport043()">×</button><div class="mythic-kicker">离线战报 · ${escapeHtml043(report.durationText)} · 稳定离线效率</div><h2>战斗没有停下</h2><div class="offline-stat-grid"><div><b>${report.wins}</b><span>胜利</span></div><div><b>${report.losses}</b><span>失败</span></div><div><b>${report.bosses}</b><span>Boss</span></div><div><b>+${report.xp}</b><span>经验</span></div><div><b>+${report.gold}</b><span>金币</span></div><div><b>${report.levelGain}</b><span>等级</span></div><div><b>${report.dropTotal}</b><span>装备</span></div></div><div class="compact-meta">${rarityRows}${report.pets || report.identities ? ` · 新宠物${report.pets} · 新身份${report.identities}` : ""}</div>${report.salvaged ? `<div class="compact-meta">自动分解 ${report.salvaged}件 · 其中获得金币 ${report.salvageGold}</div>` : ""}<h3>重要收获</h3>${important}<button class="offline-confirm" onclick="closeOfflineReport043()">收下战果</button></div>`;
  }

  window.closeOfflineReport043 = function () {
    try { document.getElementById("offline-report-overlay")?.remove(); } catch (_) {}
  };
  window.showLastOfflineReport043 = function () {
    const report = state.lastOfflineReport;
    if (!report) return;
    try {
      window.closeOfflineReport043();
      const overlay = document.createElement("div");
      overlay.id = "offline-report-overlay";
      overlay.className = "offline-report-overlay";
      overlay.innerHTML = reportHtml043(report);
      document.body.appendChild(overlay);
    } catch (_) {}
  };
  window.alpha043CompleteOfflineSession = function () {
    const collector = offlineCollector043;
    window.__bweOfflineSettlementActive = false;
    offlineCollector043 = null;
    if (!collector) return null;
    const after = offlineSnapshot043();
    const report = {
      at: Date.now(),
      durationText: durationText043(collector.elapsed),
      elapsed: collector.elapsed,
      realElapsed: collector.realElapsed,
      wins: Math.max(0, after.wins - collector.before.wins),
      losses: Math.max(0, after.losses - collector.before.losses),
      bosses: Math.max(0, after.bosses - collector.before.bosses),
      xp: Math.max(0, after.metricXp - collector.before.metricXp),
      gold: Math.max(0, after.gold - collector.before.gold),
      levelGain: Math.max(0, after.level - collector.before.level),
      pets: Math.max(0, after.pets - collector.before.pets),
      identities: Math.max(0, after.identities - collector.before.identities),
      drops: collector.drops,
      dropTotal: collector.drops.reduce((n, x) => n + x, 0),
      salvaged: collector.salvaged,
      salvageGold: collector.salvageGold,
      highlights: collector.highlights.slice(0, 20),
      mythics: collector.mythics,
    };
    state.lastOfflineReport = report;
    setTimeout(() => window.showLastOfflineReport043(), 20);
    return report;
  };

  const renderInventoryBefore043 = renderInventory;
  renderInventory = function () {
    return window.renderAlpha043LootHub() + renderInventoryBefore043();
  };

  const loadBefore043 = load;
  load = function () {
    const ok = loadBefore043();
    if (!ok) return false;
    ensureAlpha043State();
    migrateAllMythics043();
    state.version = VERSION;
    save();
    return true;
  };

  ensureAlpha043State();
  migrateAllMythics043();
  state.version = VERSION;
  save();
  render(false);
  restartBattleTimer043();
})();

/* ===== Alpha 0.43: clear skill rules, pet parity and capacity access ===== */
(function () {
  const PET_GEAR_COMPENSATION_043 = 1.35;
  const basePetStats043 = petStats;

  petStats = function (pet) {
    const result = basePetStats043(pet);
    return {
      maxHp: Math.round(result.maxHp * PET_GEAR_COMPENSATION_043),
      atk: Math.round(result.atk * PET_GEAR_COMPENSATION_043),
      def: Math.round(result.def * PET_GEAR_COMPENSATION_043),
      magic: Math.round(result.magic * PET_GEAR_COMPENSATION_043),
    };
  };

  function migratePetGearCompensation043() {
    if (state.petGearCompensation043) return;
    (state.pets || []).forEach((pet) => {
      pet.hp = Math.max(0, Math.round((Number(pet.hp) || 0) * PET_GEAR_COMPENSATION_043));
    });
    state.petGearCompensation043 = true;
  }

  const loadWithPetCompensation043 = load;
  load = function () {
    const ok = loadWithPetCompensation043();
    if (!ok) return false;
    migratePetGearCompensation043();
    save();
    return true;
  };
  migratePetGearCompensation043();

  function inventoryExpansionCost043() {
    return Math.round(900 * Math.pow(1.45, state.shop?.inventoryUpgrades || 0));
  }
  function petExpansionCost043() {
    return Math.round(750 * Math.pow(1.5, state.shop?.petUpgrades || 0));
  }

  expandInventory = function () {
    state.shop = state.shop || { inventoryUpgrades: 0, petUpgrades: 0 };
    const cost = inventoryExpansionCost043();
    if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
    state.gold -= cost;
    state.inventoryCapacity += 5;
    state.shop.inventoryUpgrades = (state.shop.inventoryUpgrades || 0) + 1;
    log(`物品栏永久扩容至${state.inventoryCapacity}格，金币-${cost}。`, "loot");
    save();
    render();
  };

  expandPetCapacity = function () {
    state.shop = state.shop || { inventoryUpgrades: 0, petUpgrades: 0 };
    const cost = petExpansionCost043();
    if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
    state.gold -= cost;
    state.petCapacity += 2;
    state.shop.petUpgrades = (state.shop.petUpgrades || 0) + 1;
    log(`宠物栏永久扩容至${state.petCapacity}格，金币-${cost}。`, "loot");
    save();
    render();
  };

  const baseRenderInventory043 = renderInventory;
  renderInventory = function () {
    const panel = `<div class="card capacity-card"><div><h3>物品栏扩容</h3><div class="compact-meta">当前 ${state.inventory.length}/${state.inventoryCapacity}格 · 每次永久增加5格</div></div><button onclick="expandInventory()">扩容 · ${inventoryExpansionCost043()}金币</button></div>`;
    return panel + baseRenderInventory043();
  };

  const baseRenderPets043 = renderPets;
  renderPets = function () {
    const panel = `<div class="card capacity-card"><div><h3>宠物栏与伙伴补偿</h3><div class="compact-meta">当前 ${state.pets.length}/${state.petCapacity}只 · 每次永久增加2格</div><div class="compact-meta">宠物无法穿戴装备，生命、攻击、防御与魔力固定提高35%。</div></div><button onclick="expandPetCapacity()">扩容 · ${petExpansionCost043()}金币</button></div>`;
    return panel + baseRenderPets043();
  };

  // Skills now fire deterministically: the first equipped, ready and valid
  // skill wins. Cooldown, mana and conditional rules remain meaningful.
  chooseSkill = function (category) {
    const current = stats();
    syncSkills();
    return (state.activeSkillSlots || []).find((id) => {
      const skill = SKILLS[id];
      if (!skill || skill.type !== "active" || skill.cat !== category) return false;
      if (!skillUsable(id) || !skillReady(id)) return false;
      if (typeof window.skillRulePass === "function" && !window.skillRulePass(id)) return false;
      if ((skill.mp || 0) > state.mp) return false;
      if (skill.kind === "heal" && state.hp >= current.maxHp * (skill.threshold || 0.55)) return false;
      if (skill.kind === "execute" && state.enemy && state.enemy.hp / state.enemy.maxHp > (skill.executeThreshold || 0.25)) return false;
      return true;
    }) || null;
  };

  skillLevel = function () { return 1; };
  skillNextUses = function () { return null; };
  skillProgressPct = function () { return 100; };
  registerSkillUse = function () {};
  registerPassiveBattleWin = function () {};
  passiveScale = function (id) { return isNativeSkill(id) ? 1.1 : 1; };

  const baseSkillPower043 = skillPower;
  skillPower = function (id) {
    const legacyEffectBonus = Math.max(0, Number(stats()?.skillChance || 0));
    return (isNativeSkill(id) ? 1.15 : 1) * (1 + legacyEffectBonus);
  };

  const baseRenderSkills043 = renderSkills;
  renderSkills = function () {
    let html = baseRenderSkills043();
    html = html
      .replace(/ · Lv\.1\/10/g, "")
      .replace(/ · <span class="r4">已满级<\/span>/g, "")
      .replace(/被动 · 每场胜利获得熟练/g, "被动 · 装备后持续生效")
      .replace(/主动 · 实际释放获得熟练/g, "主动 · 就绪时按优先级释放")
      .replace(/<div class="bar" style="margin-top:4px">[\s\S]*?<\/div><div class="compact-meta">/g, '<div class="compact-meta">')
      .replace(/<details class="mini"><summary>训练详情<\/summary>[\s\S]*?<\/details>/g, "")
      .replace("职业纵向进阶", "技能搭配与释放规则")
      .replace(/高级职业覆盖同谱系低阶职业；向上切换时自动装备高级技能，并继承低阶技能的同类熟练成果。Lv.10现在只代表技能满级。/, "主动技能满足条件、法力足够且冷却结束时，严格按从上到下的顺序释放。原技能触发率属性现转换为技能效果加成。")
      .replace(/<details class="help"><summary>人物档案<\/summary>[\s\S]*?<\/details>/, "");
    return `<div class="notice">技能不再随机触发，也没有熟练度。玩家只需决定技能搭配和从上到下的释放优先级。</div>${html}`;
  };

  const baseRenderCharacter043 = renderCharacter;
  renderCharacter = function () {
    return baseRenderCharacter043()
      .replace(/技能触发率/g, "技能效果")
      .replace(/技能触发/g, "技能效果")
      .replace(/<div class="grid2" style="margin-top:7px"><div class="card"><h3>人物档案<\/h3>[\s\S]*?<\/div><div class="card"><h3>实时效率/, '<div class="card" style="margin-top:7px"><h3>实时效率')
      .replace(/<\/div><\/div>$/, "</div>");
  };
  save();
  render(false);
})();

/* Alpha 0.35 iOS/PWA background battle catch-up.
   iOS suspends browser JS in background, so we freeze the live timer on hide
   and replay the missed 650ms battle ticks when the app becomes visible again. */
(() => {
  "use strict";
  const KEY = "bwe-background-battle-v1";
  const TICK_MS = 650;
  const MAX_MS = 8 * 60 * 60 * 1000;
  const MIN_MS = 1800;
  let suspended = false;
  let settling = false;

  function readStamp() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (_) {
      return null;
    }
  }
  function writeStamp(running) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ at: Date.now(), running: !!running }),
      );
    } catch (_) {}
  }
  function clearStamp() {
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
  }
  function stopLiveTimer() {
    try {
      if (typeof tickTimer !== "undefined" && tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
    } catch (_) {}
  }
  function startLiveTimer() {
    try {
      if (
        typeof tickTimer !== "undefined" &&
        !tickTimer &&
        state?.started &&
        state.running &&
        !document.hidden
      ) {
        tickTimer = setInterval(battleTick, TICK_MS);
      }
    } catch (_) {}
  }
  function bossWins() {
    try {
      return Object.values(state.bossCycles || {}).reduce(
        (n, x) => n + Number(x?.bossWins || 0),
        0,
      );
    } catch (_) {
      return 0;
    }
  }
  function masteredCount() {
    try {
      return Object.values(state.skillMastered || {}).filter(Boolean).length;
    } catch (_) {
      return 0;
    }
  }
  function snap() {
    return {
      level: Number(state.level || 1),
      wins: Number(state.totalWins || 0),
      losses: Number(state.totalLosses || 0),
      kills: Number(state.totalKills || 0),
      gold: Number(state.gold || 0),
      drops: Number(state.metrics?.drops || 0),
      inv: Number(state.inventory?.length || 0),
      pets: Number(state.pets?.length || 0),
      bosses: bossWins(),
      races: Number(state.unlockedRaces?.length || 0),
      classes: Number(state.unlockedClasses?.length || 0),
      mastered: masteredCount(),
    };
  }
  function delta(a, b, k) {
    return Number(b[k] || 0) - Number(a[k] || 0);
  }
  function durationText(ms) {
    const total = Math.floor(ms / 60000),
      h = Math.floor(total / 60),
      m = total % 60;
    return h ? `${h}小时${m ? m + "分钟" : ""}` : `${Math.max(1, m)}分钟`;
  }
  function ensureToast() {
    let el = document.getElementById("offline-battle-toast");
    if (el) return el;
    const style = document.createElement("style");
    style.textContent = `#offline-battle-toast{position:fixed;z-index:150;left:calc(10px + env(safe-area-inset-left));right:calc(10px + env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 10px);background:rgba(29,24,17,.97);border:1px solid #8d7040;color:#eadfca;padding:8px 10px;border-radius:7px;box-shadow:0 6px 24px #000b;font:11px/1.45 Arial,\"Microsoft YaHei\",sans-serif;display:none;max-width:680px;margin:auto}#offline-battle-toast b{color:#f0c86d}#offline-battle-toast .muted{font-size:9px;color:#a99a80}`;
    document.head.appendChild(style);
    el = document.createElement("div");
    el.id = "offline-battle-toast";
    document.body.appendChild(el);
    return el;
  }
  function toast(html, hold = 5200) {
    const el = ensureToast();
    el.innerHTML = html;
    el.style.display = "block";
    clearTimeout(el._hide);
    if (hold > 0)
      el._hide = setTimeout(() => (el.style.display = "none"), hold);
  }
  function sleep0() {
    return new Promise((r) => setTimeout(r, 0));
  }

  async function settle(stamp) {
    if (settling || !stamp || !stamp.running) return;
    if (!state?.started) {
      clearStamp();
      return;
    }
    const realElapsed = Math.max(
      0,
      Date.now() - Number(stamp.at || Date.now()),
    );
    if (realElapsed < MIN_MS) return;
    settling = true;
    stopLiveTimer();
    const elapsed = Math.min(realElapsed, MAX_MS),
      ticks = Math.floor(elapsed / TICK_MS),
      before = snap();
    const difficultyProtection =
      typeof window.alpha041BeginOfflineProtection === "function"
        ? window.alpha041BeginOfflineProtection()
        : null;
    toast(
      `<b>正在结算后台战斗…</b><div class="muted">离开 ${durationText(realElapsed)}${realElapsed > MAX_MS ? " · 按8小时上限结算" : ""}</div>`,
      0,
    );

    const old = {
      render: typeof render === "function" ? render : null,
      renderBattleOnly:
        typeof renderBattleOnly === "function" ? renderBattleOnly : null,
      renderLogOnly: typeof renderLogOnly === "function" ? renderLogOnly : null,
      refreshLiveUI: typeof refreshLiveUI === "function" ? refreshLiveUI : null,
      log: typeof log === "function" ? log : null,
      save: typeof save === "function" ? save : null,
    };
    try {
      if (old.render) render = () => {};
      if (old.renderBattleOnly) renderBattleOnly = () => {};
      if (old.renderLogOnly) renderLogOnly = () => {};
      if (old.refreshLiveUI) refreshLiveUI = () => {};
      if (old.save) save = () => {};
      if (old.log) {
        log = (msg, cls = "", category = null) => {
          const important =
            category === "important" ||
            cls === "important" ||
            /神话|传说|变异\s*X|永久解锁|技能传承|被动传承|身份掉落|SSS/.test(
              String(msg),
            );
          if (important) old.log(msg, cls, category || "important");
        };
      }
      const CHUNK = 1000;
      for (let i = 0; i < ticks; i++) {
        battleTick();
        if (!state.running) break;
        if (i > 0 && i % CHUNK === 0) {
          const pct = Math.min(99, Math.round((i / ticks) * 100));
          const el = document.getElementById("offline-battle-toast");
          if (el)
            el.querySelector("b").textContent = `正在结算后台战斗… ${pct}%`;
          await sleep0();
        }
      }
    } catch (err) {
      console.error("Offline battle catch-up failed", err);
    } finally {
      if (typeof window.alpha041EndOfflineProtection === "function")
        window.alpha041EndOfflineProtection(difficultyProtection);
      if (old.render) render = old.render;
      if (old.renderBattleOnly) renderBattleOnly = old.renderBattleOnly;
      if (old.renderLogOnly) renderLogOnly = old.renderLogOnly;
      if (old.refreshLiveUI) refreshLiveUI = old.refreshLiveUI;
      if (old.log) log = old.log;
      if (old.save) save = old.save;
    }

    const after = snap();
    clearStamp();
    suspended = false;
    settling = false;
    try {
      old.save && old.save();
    } catch (_) {}
    try {
      old.render && old.render(false);
    } catch (_) {
      try {
        old.render && old.render();
      } catch (__) {}
    }
    startLiveTimer();

    const parts = [`胜利 ${Math.max(0, delta(before, after, "wins"))} 场`];
    const losses = Math.max(0, delta(before, after, "losses"));
    if (losses) parts.push(`失败 ${losses}`);
    const bosses = Math.max(0, delta(before, after, "bosses"));
    if (bosses) parts.push(`Boss ${bosses}`);
    const gold = Math.max(0, delta(before, after, "gold"));
    if (gold) parts.push(`金币 +${gold}`);
    const drops = Math.max(0, delta(before, after, "drops"));
    if (drops) parts.push(`装备掉落 ${drops}`);
    const pets = delta(before, after, "pets");
    if (pets > 0) parts.push(`宠物净增 ${pets}`);
    const identities =
      Math.max(0, delta(before, after, "races")) +
      Math.max(0, delta(before, after, "classes"));
    if (identities) parts.push(`新身份 ${identities}`);
    const mastered = Math.max(0, delta(before, after, "mastered"));
    if (mastered) parts.push(`永久技能 ${mastered}`);
    const levelGain = Math.max(0, delta(before, after, "level"));
    if (levelGain) parts.push(`等级 +${levelGain}`);
    const summary = `后台战斗 ${durationText(elapsed)}：${parts.join(" · ")}`;
    try {
      old.log && old.log(`【后台结算】${summary}`, "important", "important");
    } catch (_) {}
    toast(
      `<b>后台战斗结算完成</b><div>${parts.join(" · ")}</div><div class="muted">${durationText(elapsed)}${realElapsed > MAX_MS ? " · 已达到8小时结算上限" : ""}</div>`,
      6500,
    );
  }

  function suspend() {
    if (settling || suspended || !state?.started) return;
    const wasRunning = !!state.running;
    writeStamp(wasRunning);
    suspended = true;
    if (wasRunning) stopLiveTimer();
    try {
      save();
    } catch (_) {}
  }
  async function resume() {
    if (settling) return;
    const stamp = readStamp();
    if (!stamp) {
      suspended = false;
      startLiveTimer();
      return;
    }
    if (!stamp.running) {
      clearStamp();
      suspended = false;
      startLiveTimer();
      return;
    }
    await settle(stamp);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) suspend();
    else resume();
  });
  window.addEventListener("pagehide", suspend);
  window.addEventListener("pageshow", () => {
    if (!document.hidden) resume();
  });

  // A previous iOS/PWA session may have been killed while backgrounded.
  const existing = readStamp();
  if (existing?.running) {
    stopLiveTimer();
    setTimeout(() => resume(), 50);
  }
})();

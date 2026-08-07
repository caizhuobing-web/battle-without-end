const vm = require("vm");
module.exports = async (req, res) => {
  try {
    const host = req.headers.host;
    const files = [
      "game-core.js",
      "game-features.js",
      "alpha-039-systems.js",
      "background-progress.js",
    ];
    const chunks = [];
    for (const f of files) {
      const r = await fetch(`https://${host}/${f}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`${f} HTTP ${r.status}`);
      chunks.push(await r.text());
    }
    const code = chunks.join("\n");
    new vm.Script(code, { filename: "alpha-040-all.js" });
    const required = [
      "const SLOT_NAMES=",
      "const WEAPON_TYPES=",
      "const PET_TIER_GROWTH_STEP=",
      "const PET_TIER_INSTINCTS=",
      "const RACES=",
      "const STYLES=",
      "function tryDropIdentity(",
      "function dangerRise(",
      "function dangerRecordLoss(",
      "function grantFirstBossMilestone(",
      "function registerPassiveBattleWin(",
      "function renderLogControls(",
      "function battleTick(",
      "function renderCharacter(",
      "Alpha 0.40",
      "SHOP_REFRESH_MS",
      "BOSS_PET_BY_MAP",
      "ABYSS_VARIANTS",
      "function samePetSpecies(",
      "function inheritPetEvolution(",
      "const CLASS_LINEAGES",
      "function buildDefeatReport(",
      "const PROGRESSION_GOALS",
      "arcanesovereign",
    ];
    const missing = required.filter((x) => !code.includes(x));
    res.status(missing.length ? 500 : 200).json({
      ok: missing.length === 0,
      version: "0.40.0",
      files: chunks.length,
      bytes: code.length,
      missing,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message,
      stack: String(e.stack || "")
        .split("\n")
        .slice(0, 4),
    });
  }
};

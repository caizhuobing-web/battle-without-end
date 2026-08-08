const vm = require("vm");

const REQUIRED_IDENTIFIERS = [
  "SLOT_NAMES",
  "WEAPON_TYPES",
  "PET_TIER_GROWTH_STEP",
  "PET_TIER_INSTINCTS",
  "RACES",
  "STYLES",
  "tryDropIdentity",
  "dangerRise",
  "dangerRecordLoss",
  "grantFirstBossMilestone",
  "registerPassiveBattleWin",
  "renderLogControls",
  "battleTick",
  "renderCharacter",
  "SHOP_REFRESH_MS",
  "BOSS_PET_BY_MAP",
  "ABYSS_VARIANTS",
  "DIFFICULTIES",
  "samePetSpecies",
  "inheritPetEvolution",
  "CLASS_LINEAGES",
  "buildDefeatReport",
  "PROGRESSION_GOALS",
];

const REQUIRED_LITERALS = ["Alpha 0.41", "arcanesovereign"];

function findMissing(code) {
  const missingIdentifiers = REQUIRED_IDENTIFIERS.filter(
    (name) => !new RegExp(`\\b(?:const|let|var|function)\\s+${name}\\b`).test(code),
  );
  const missingLiterals = REQUIRED_LITERALS.filter(
    (literal) => !code.includes(literal),
  );
  return [...missingIdentifiers, ...missingLiterals];
}

module.exports = async (req, res) => {
  try {
    const host = req.headers.host;
    const files = [
      "game-core.js",
      "game-features.js",
      "alpha-039-systems.js",
      "alpha-041-systems.js",
      "background-progress.js",
    ];
    const chunks = [];
    for (const f of files) {
      const r = await fetch(`https://${host}/${f}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`${f} HTTP ${r.status}`);
      chunks.push(await r.text());
    }
    const code = chunks.join("\n");
    new vm.Script(code, { filename: "alpha-041-all.js" });
    const missing = findMissing(code);
    res.status(missing.length ? 500 : 200).json({
      ok: missing.length === 0,
      version: "0.41.0",
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

module.exports.findMissing = findMissing;

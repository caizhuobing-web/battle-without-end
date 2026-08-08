const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const SCRIPT_FILES = [...html.matchAll(/<script src="\.\/([^"?]+\.js)"/g)].map(
  (match) => match[1],
);

class MemoryStorage {
  constructor(seed = {}) {
    this.data = new Map(Object.entries(seed));
  }
  get length() {
    return this.data.size;
  }
  key(index) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(String(key), String(value));
  }
  removeItem(key) {
    this.data.delete(String(key));
  }
  clear() {
    this.data.clear();
  }
}

function element(id = "") {
  return {
    id,
    value: id === "hero-name" ? "旅者" : "",
    innerHTML: "",
    textContent: "",
    scrollTop: 0,
    open: false,
    parentElement: null,
    style: {},
    dataset: {},
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild() {},
    remove() {},
    click() {},
    scrollIntoView() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function createContext(seed = {}) {
  const nodes = new Map();
  const getNode = (id) => {
    if (!nodes.has(id)) nodes.set(id, element(id));
    return nodes.get(id);
  };
  const document = {
    title: "",
    hidden: false,
    head: element("head"),
    body: element("body"),
    getElementById: getNode,
    createElement: (tag) => element(tag),
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const context = {
    console,
    document,
    localStorage: new MemoryStorage(seed),
    navigator: { userAgent: "node" },
    location: { protocol: "file:", reload() {} },
    alert() {},
    confirm() {
      return true;
    },
    requestAnimationFrame(fn) {
      if (fn) fn();
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    Blob: class {},
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    FileReader: class {},
  };
  context.window = context;
  context.window.scrollY = 0;
  context.window.scrollTo = () => {};
  context.window.matchMedia = () => ({ matches: false });
  context.window.addEventListener = () => {};
  context.window.removeEventListener = () => {};
  vm.createContext(context);
  for (const file of SCRIPT_FILES) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

function evaluate(context, source) {
  return vm.runInContext(source, context);
}
function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test("all browser scripts parse and load in index order", () => {
  assert.deepStrictEqual(SCRIPT_FILES, [
    "game-core.js",
    "game-features.js",
    "alpha-039-systems.js",
    "alpha-041-systems.js",
    "background-progress.js",
  ]);
  createContext();
});

test("deployment smoke requirements accept the formatted runtime bundle", () => {
  const { findMissing } = require(path.join(ROOT, "api/smoke.js"));
  const runtimeCode = SCRIPT_FILES.map(read).join("\n");
  assert.deepStrictEqual(findMissing(runtimeCode), []);
});

test("repository runtime has no historical shard or duplicate training files", () => {
  const names = fs.readdirSync(ROOT);
  assert(
    !names.some((name) =>
      /\.(?:b64|part)$|^payload\d|^core-\d+\.js$|^test-034\.html$/.test(name),
    ),
  );
  assert(!names.includes("training-profile.js"));
  assert.strictEqual(
    [...html.matchAll(/<link rel="stylesheet" href="\.\/([^"?]+\.css)"/g)]
      .length,
    1,
  );
});

test("fusion transfers the donor itself plus all 100 prior fusions and all level XP", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  state.pets=[];state.nextId=1;
  const a=createPet('灰尾幼狼','Attack',0);a.mutant=false;a.mutationGrade=null;a.fusionInvestedXp=1;
  for(let i=0;i<100;i++){const donor=createPet('灰尾幼狼','Balance',0);donor.mutant=false;donor.mutationGrade=null;donor.fusionInvestedXp=1;inheritPetEvolution(a,donor)}
  a.level=6;a.xp=9;
  const expectedLevelXp=petLevelInvestment(a);
  const b=createPet('灰尾幼狼','Attack',0);b.mutant=false;b.mutationGrade=null;b.fusionInvestedXp=1;
  const inherited=inheritPetEvolution(b,a);
  return JSON.stringify({aInvestment:petEvolutionValue(a),evolutionXp:inherited.evolutionXp,levelXp:inherited.levelXp,expectedLevelXp,targetLevel:b.level,targetTier:b.tier});
 })()`,
    ),
  );
  assert.strictEqual(result.aInvestment, 101);
  assert.strictEqual(result.evolutionXp, 101);
  assert.strictEqual(result.levelXp, result.expectedLevelXp);
  assert(result.targetLevel > 1);
  assert(result.targetTier > 1);
});

test("evolved forms can consume their base form through shared species lineage", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  state.pets=[];state.nextId=1;
  const evolved=createPet('灰尾幼狼','Attack',0);evolved.name='月影追猎';evolved.baseSpecies='灰尾幼狼';
  const base=createPet('灰尾幼狼','Attack',0);state.pets=[evolved,base];
  return JSON.stringify({same:samePetSpecies(evolved,base),donors:sameSpeciesDonors(evolved,false).length,base:petBaseSpecies(evolved)});
 })()`,
    ),
  );
  assert.deepStrictEqual(result, { same: true, donors: 1, base: "灰尾幼狼" });
});

test("renamed evolved forms retain base-species combat mechanics and icon", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  const base=createPet('灰尾幼狼','Attack',0);base.mutant=false;base.evolutionBranches={stage3:'assault',stage6:'apex'};
  const evolved={...base,name:'月影追猎',baseSpecies:'灰尾幼狼',aptitudes:{...base.aptitudes},evolutionBranches:{...base.evolutionBranches}};
  const enemy={boss:true,hp:20,maxHp:100,def:5};
  return JSON.stringify({base:petSpeciesDamageMult(base,enemy),evolved:petSpeciesDamageMult(evolved,enemy),basePower:petCombatPower(base),evolvedPower:petCombatPower(evolved),icon:petSpeciesIcon(evolved)});
 })()`,
    ),
  );
  assert.strictEqual(result.evolved, result.base);
  assert.strictEqual(result.evolvedPower, result.basePower);
  assert.strictEqual(result.icon, "🐺");
});

test("player names are sanitized before entering HTML-backed UI", () => {
  const context = createContext();
  const name = evaluate(
    context,
    `sanitizePlayerName(' <img src=x onerror=alert(1)> Teddy & Co. ')`,
  );
  assert(!/[<>&]/.test(name));
  assert(name.includes("Teddy"));
  assert(name.length <= 20);
});

test("reset removes stale background settlement state and unused age state", () => {
  const context = createContext({
    "bwe-background-battle-v1": JSON.stringify({ at: 1, running: true }),
  });
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{resetGame();return JSON.stringify({stamp:localStorage.getItem('bwe-background-battle-v1'),hasAge:Object.prototype.hasOwnProperty.call(state,'age')})})()`,
    ),
  );
  assert.deepStrictEqual(result, { stamp: null, hasAge: false });
});

test("ordinary enemies never drop pets while a defeated Boss can", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.firstBossMilestoneClaimed=true;Math.random=()=>0;
  state.enemy=makeEnemy(false);const before=state.pets.length;winBattle();const afterNormal=state.pets.length;
  state.enemy=makeEnemy(true);winBattle();const afterBoss=state.pets.length;
  return JSON.stringify({before,afterNormal,afterBoss});
 })()`,
    ),
  );
  assert.strictEqual(result.afterNormal, result.before);
  assert(result.afterBoss > result.afterNormal);
});

test("treasure monsters replace only ordinary encounters at 0.5% and carry 100x base gold", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;Math.random=()=>0;
  const treasure=makeEnemy(false),boss=makeEnemy(true);
  return JSON.stringify({chance:TREASURE_MONSTER_CHANCE,treasure:treasure.treasure,boss:treasure.boss,name:treasure.name,goldBase:treasure.gold/3.2,bossTreasure:boss.treasure});
 })()`,
    ),
  );
  assert.strictEqual(result.chance, 0.005);
  assert.deepStrictEqual(
    {
      treasure: result.treasure,
      boss: result.boss,
      name: result.name,
      goldBase: result.goldBase,
      bossTreasure: result.bossTreasure,
    },
    {
      treasure: true,
      boss: false,
      name: "宝箱怪",
      goldBase: 100,
      bossTreasure: false,
    },
  );
});

test("Boss prefix weights and global loot multipliers match the GM curve", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.highestUnlockedDifficulty=4;setWorldDifficulty('torment1');Math.random=()=>.999;
  const boss=makeEnemy(true),baseIdentity=identityDropChance(1),boostedIdentity=identityDropChance(boss.bossLootMult);
  Math.random=()=>.005;const baseMutation=rollPetMutation(map(),1),boostedMutation=rollPetMutation(map(),boss.bossLootMult);
  return JSON.stringify({weight:BOSS_PREFIXES.reduce((n,x)=>n+x.w,0),id:boss.bossPrefixId,loot:boss.bossLootMult,gold:boss.bossGoldMult,name:boss.name,identityRatio:boostedIdentity/baseIdentity,baseMutation,boostedMutation});
 })()`,
    ),
  );
  assert.strictEqual(result.weight, 100);
  assert.deepStrictEqual(
    { id: result.id, loot: result.loot, gold: result.gold },
    { id: "astral", loot: 3, gold: 5 },
  );
  assert(result.name.includes("星辉"));
  assert(Math.abs(result.identityRatio - 3) < 1e-9);
  assert.strictEqual(result.baseMutation, false);
  assert.strictEqual(result.boostedMutation, true);
});

test("Boss retries preserve the original rare prefix instead of rerolling it", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.firstBossMilestoneClaimed=true;Math.random=()=>.999;
  const cycle=ensureBossCycle('meadow');state.enemy=makeEnemy(true);state.enemy.bossCyclePeriod=25;state.enemy.hp=Math.round(state.enemy.maxHp*.5);loseBattle();
  const stored=state.bossProgress.meadow.prefixId;cycle.retryCountdown=0;state.enemy=null;Math.random=()=>0;ensureEnemy();
  return JSON.stringify({stored,retry:state.enemy.bossPrefixId,loot:state.enemy.bossLootMult,name:state.enemy.name});
 })()`,
    ),
  );
  assert.deepStrictEqual(
    { stored: result.stored, retry: result.retry, loot: result.loot },
    { stored: "astral", retry: "astral", loot: 3 },
  );
  assert(result.name.includes("星辉"));
});

test("Boss global loot prefix raises pet acquisition without enabling ordinary pet drops", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.firstBossMilestoneClaimed=true;Math.random=()=>.4;
  state.enemy=makeEnemy(true);state.enemy.bossLootMult=1;winBattle();const basePets=state.pets.length;
  state.enemy=makeEnemy(true);state.enemy.bossLootMult=3;winBattle();const boostedPets=state.pets.length;
  state.enemy=makeEnemy(false);winBattle();return JSON.stringify({basePets,boostedPets,afterNormal:state.pets.length});
 })()`,
    ),
  );
  assert.strictEqual(result.boostedPets, result.basePets + 1);
  assert.strictEqual(result.afterNormal, result.boostedPets);
});

test("Boss retry uses half of the original encounter period even after danger falls", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.firstBossMilestoneClaimed=true;
  const cycle=ensureBossCycle('meadow');cycle.threatUnlocked=5;cycle.threatTier=5;
  state.enemy=makeEnemy(true);state.enemy.bossCyclePeriod=25;state.enemy.hp=Math.round(state.enemy.maxHp*.50);loseBattle();
  const first={retry:cycle.retryCountdown,period:state.bossProgress.meadow.encounterPeriod,threat:cycle.threatTier};
  cycle.retryCountdown=0;state.enemy=null;ensureEnemy();state.enemy.hp=Math.round(state.enemy.hp*.50);loseBattle();
  return JSON.stringify({first,secondRetry:cycle.retryCountdown,secondPeriod:state.bossProgress.meadow.encounterPeriod});
 })()`,
    ),
  );
  assert.strictEqual(result.first.period, 25);
  assert.strictEqual(result.first.retry, 13);
  assert(result.first.threat < 5);
  assert.strictEqual(result.secondPeriod, 25);
  assert.strictEqual(result.secondRetry, 13);
});

test("legacy timed shop stock is retired in 0.41", () => {
  const context = createContext();
  const stock = JSON.parse(
    evaluate(
      context,
      `(()=>{state.shop.stock=[];state.shop.nextRefreshAt=Date.now()+999999;renderShop();return JSON.stringify({size:state.shop.stock.length,next:state.shop.nextRefreshAt>Date.now()})})()`,
    ),
  );
  assert.deepStrictEqual(stock, { size: 0, next: true });
});

test("0.38 save migrates without Soul and keeps pet tier, evolution XP and level", () => {
  const source = createContext();
  const oldSave = JSON.parse(
    evaluate(
      source,
      `(()=>{const d=fresh(),p=createPet('灰尾幼狼','Attack',0);d.version='0.38.0';d.soul=77;p.tier=4;p.evolutionXp=17;p.level=8;p.xp=11;delete p.fusionInvestedXp;d.pets=[p];d.activePetId=p.id;return JSON.stringify(d)})()`,
    ),
  );
  const context = createContext({
    "bwe-core-alpha-038": JSON.stringify(oldSave),
  });
  const migrated = JSON.parse(
    evaluate(
      context,
      `JSON.stringify({version:state.version,hasSoul:Object.prototype.hasOwnProperty.call(state,'soul'),pet:state.pets[0]&&{tier:state.pets[0].tier,evolutionXp:state.pets[0].evolutionXp,level:state.pets[0].level,xp:state.pets[0].xp,baseSpecies:state.pets[0].baseSpecies,investment:state.pets[0].fusionInvestedXp}})`,
    ),
  );
  assert.strictEqual(migrated.version, "0.42.0");
  assert.strictEqual(migrated.hasSoul, false);
  assert.deepStrictEqual(
    {
      tier: migrated.pet.tier,
      evolutionXp: migrated.pet.evolutionXp,
      level: migrated.pet.level,
      xp: migrated.pet.xp,
      baseSpecies: migrated.pet.baseSpecies,
    },
    { tier: 4, evolutionXp: 17, level: 8, xp: 11, baseSpecies: "灰尾幼狼" },
  );
  assert(migrated.pet.investment > 17);
});

test("0.39 save migrates to 0.40 with profession progress and new decision state", () => {
  const source = createContext();
  const oldSave = JSON.parse(
    evaluate(
      source,
      `(()=>{const d=fresh();d.version='0.39.0';d.started=true;d.style='melee';d.unlockedClasses=['melee','guardian'];d.skillUse.warrior_slash=138;delete d.bossBuildPreset;delete d.goalsClaimed;delete d.lastDefeatReport;return JSON.stringify(d)})()`,
    ),
  );
  const context = createContext({
    "bwe-core-alpha-039": JSON.stringify(oldSave),
  });
  const migrated = JSON.parse(
    evaluate(
      context,
      `JSON.stringify({version:state.version,guardian:state.unlockedClasses.includes('guardian'),inherited:state.skillUse.guard_wall,bossBuildPreset:state.bossBuildPreset,goalsClaimed:state.goalsClaimed,lastDefeatReport:state.lastDefeatReport})`,
    ),
  );
  assert.deepStrictEqual(migrated, {
    version: "0.42.0",
    guardian: true,
    inherited: 138,
    bossBuildPreset: null,
    goalsClaimed: {},
    lastDefeatReport: null,
  });
});

test("0.40 save migrates into a separate 0.41 key without overwriting the source", () => {
  const source = createContext();
  const oldSave = JSON.parse(evaluate(source, `(()=>{const d=fresh();d.version='0.40.0';d.started=true;d.race='human';d.style='melee';return JSON.stringify(d)})()`));
  const raw = JSON.stringify(oldSave);
  const context = createContext({ "bwe-core-alpha-040": raw });
  const result = JSON.parse(evaluate(context, `JSON.stringify({version:state.version,has041:!!localStorage.getItem('bwe-core-alpha-041'),source:localStorage.getItem('bwe-core-alpha-040')})`));
  assert.strictEqual(result.version, "0.42.0");
  assert.strictEqual(result.has041, true);
  assert.strictEqual(result.source, raw);
});

test("background settlement replays the canonical battle tick without a parallel reward formula", () => {
  const source = read("background-progress.js");
  assert(source.includes("battleTick();"));
  assert(!/state\.gold\s*[+\-*/]?=/.test(source));
  assert(!/receivePet\(|makeItem\(/.test(source));
});

test("five permanent maps and fourteen global difficulties replace Abyss and rebirth scaling", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{state.highestUnlockedDifficulty=13;setWorldDifficulty('torment10');return JSON.stringify({maps:MAPS.map(m=>m.id),difficulties:ALPHA_041_DIFFICULTIES.length,world:worldCombatScale('meadow'),rebirths:state.rebirths})})()`,
    ),
  );
  assert.deepStrictEqual(result.maps, ["meadow", "hill", "forest", "shore", "ruins"]);
  assert.strictEqual(result.difficulties, 14);
  assert.strictEqual(result.rebirths, 0);
  assert.deepStrictEqual(
    {
      hp: result.world.hp,
      atk: result.world.atk,
      def: result.world.def,
      reward: result.world.reward,
    },
    { hp: 10.8, atk: 2.98, def: Math.sqrt(10.8), reward: 5.9 },
  );
});

test("all six species expose unique Tier 3 and Tier 6 routes with implemented mechanics", () => {
  const context = createContext();
  const routes = JSON.parse(
    evaluate(
      context,
      `JSON.stringify(Object.entries(PET_EVOLUTION_ROUTES).map(([group,r])=>({group,three:Object.values(r.three).map(x=>x.name),six:Object.values(r.six).map(x=>x.name)})))`,
    ),
  );
  assert.strictEqual(routes.length, 6);
  assert.strictEqual(
    new Set(routes.flatMap((x) => [...x.three, ...x.six])).size,
    24,
  );
  const mechanics = read("game-core.js");
  for (const species of [
    "灰尾幼狼",
    "裂风幼狮",
    "树灵幼芽",
    "霜鳍幼兽",
    "王魂侍从",
    "星核幼龙",
  ])
    assert(mechanics.includes(species));
});

test("Soul and visible fusion-investment totals are absent from the player UI", () => {
  const context = createContext();
  const rendered = evaluate(
    context,
    `(()=>{startGame();state.running=false;return renderPets()+renderCharacter()+renderShop()})()`,
  );
  assert(!rendered.includes("live-soul"));
  assert(!rendered.includes("血脉总量"));
  assert(!rendered.includes("fusionInvestedXp"));
});

test("every starter profession has a mythic endpoint and unlocked skills never require backtracking", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;
  state.unlockedClasses.push('melee','guardian','nightking','ranged','hunter','starwalker','magic','warlock','elementalist','chronomancer','arcanesovereign');
  state.skillMastered={};state.style='nightking';syncSkills();
  return JSON.stringify({ends:Object.values(CLASS_LINEAGES).map(line=>STYLES[line.at(-1)].rarity),warriorUsable:skillUsable('warrior_slash'),mageUsable:skillUsable('mage_fireball'),arcaneUsable:skillUsable('arcane_cataclysm')});
 })()`,
    ),
  );
  assert.deepStrictEqual(result.ends, [5, 5, 5]);
  assert.strictEqual(result.warriorUsable, true);
  assert.strictEqual(result.mageUsable, true);
  assert.strictEqual(result.arcaneUsable, true);
});

test("switching upward replaces low-tier slots and carries lineage proficiency", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.unlockedClasses.push('melee','guardian');state.style='melee';state.skillUse.warrior_slash=120;state.activeSkillSlots=['warrior_slash'];
  switchClass('guardian');
  return JSON.stringify({style:state.style,slots:state.activeSkillSlots,uses:state.skillUse.guard_wall,oldUsable:skillUsable('warrior_slash')});
 })()`,
    ),
  );
  assert.strictEqual(result.style, "guardian");
  assert.deepStrictEqual(result.slots, ["guard_wall"]);
  assert.strictEqual(result.uses, 120);
  assert.strictEqual(result.oldUsable, true);
});

test("Boss prefixes change combat behavior instead of only loot multipliers", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;Math.random=()=>.999;const e=makeEnemy(true);state.enemy=e;e.hp=Math.round(e.maxHp*.49);enemyAttack();
  const armor={bossPrefixMechanic:'armor',round:0};
  return JSON.stringify({mechanic:e.bossPrefixMechanic,ascended:e.prefixAscended,shield:e.shield,armorMult:bossPrefixDamageTakenMult(armor)});
 })()`,
    ),
  );
  assert.deepStrictEqual(result, {
    mechanic: "ascension",
    ascended: true,
    shield: 1,
    armorMult: 0.6,
  });
});

test("defeats produce a concrete report and the milestone board pays only existing resources", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.enemy=makeEnemy(true);state.enemy.hp=Math.round(state.enemy.maxHp*.8);state.pets=[];state.activePetId=null;loseBattle();
  const report=state.lastDefeatReport;state.firstBossMilestoneClaimed=true;const before=state.gold;const claimed=claimProgressionGoal('first_boss');
  return JSON.stringify({primary:report.primary,reasons:report.reasons.length,claimed,goldGain:state.gold-before,hasCurrency:Object.keys(state).some(k=>/token|currency/i.test(k))});
 })()`,
    ),
  );
  assert(result.primary);
  assert(result.reasons >= 1 && result.reasons <= 3);
  assert.strictEqual(result.claimed, true);
  assert(result.goldGain >= 500);
  assert.strictEqual(result.hasCurrency, false);
});

test("a designated Boss preset round-trips to the prior farming build", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;state.unlockedClasses.push('melee','magic');state.style='magic';state.activeSkillSlots=['mage_fireball'];saveBuildPreset(1);
  state.style='melee';state.activeSkillSlots=['warrior_slash'];syncSkills();setBossBuildPreset(1);applyBossBuildForEncounter();const during={style:state.style,skill:state.activeSkillSlots[0]};restoreAfterBossBuild();
  return JSON.stringify({during,after:{style:state.style,skill:state.activeSkillSlots[0]}});
 })()`,
    ),
  );
  assert.deepStrictEqual(result.during, {
    style: "magic",
    skill: "mage_fireball",
  });
  assert.deepStrictEqual(result.after, {
    style: "melee",
    skill: "warrior_slash",
  });
});

test("all equipment merchants are removed in favor of combat drops", () => {
  const context = createContext();
  const shop = evaluate(
    context,
    `(()=>{startGame();state.running=false;return renderShop()})()`,
  );
  assert(!shop.includes("<h3>装备行商</h3>"));
  assert(!shop.includes("定时装备商店"));
});

test("world difficulty changes only by player choice and boss victories unlock without auto-switch", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.highestUnlockedDifficulty=0;state.worldDifficulty='normal';
    onBattleLost({boss:false},map());
    const afterLoss=state.worldDifficulty;
    onBattleWon({boss:true,difficultyBreakthrough:true},map());
    return JSON.stringify({afterLoss,current:state.worldDifficulty,highest:state.highestUnlockedDifficulty});
  })()`));
  assert.deepStrictEqual(result, { afterLoss: "normal", current: "normal", highest: 1 });
});

test("ordinary map bosses cannot unlock difficulty and breakthrough bosses use a fixed template", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.highestUnlockedDifficulty=0;state.worldDifficulty='normal';
    onBattleWon({boss:true},map());const afterOrdinary=state.highestUnlockedDifficulty;
    challengeDifficultyBoss();const e=makeEnemy(true);
    return JSON.stringify({afterOrdinary,level:e.level,breakthrough:e.difficultyBreakthrough,prefix:e.bossPrefixId,name:e.name});
  })()`));
  assert.strictEqual(result.afterOrdinary, 0);
  assert.strictEqual(result.level, 11);
  assert.strictEqual(result.breakthrough, true);
  assert.strictEqual(result.prefix, "none");
  assert(result.name.includes("世界突破"));
});

test("six build families and twelve named mythics are mythic-only rule changers", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    const builds=Object.keys(ALPHA_041_BUILDS),mythics=ALPHA_041_NAMED_MYTHICS;
    const ordinary=[];for(let i=0;i<80;i++)ordinary.push(makeItem(1,null,4,false));
    const named=[];for(let i=0;i<240;i++){const it=makeItem(1,null,5,false);if(it.namedMythicId)named.push(it);}
    return JSON.stringify({builds,mythicCount:mythics.length,mythicBuilds:[...new Set(mythics.map(x=>x.build))],ordinaryNamed:ordinary.filter(x=>x.namedMythicId).length,namedLocked:named.every(x=>x.locked),namedCount:named.length});
  })()`));
  assert.strictEqual(result.builds.length, 6);
  assert.strictEqual(result.mythicCount, 12);
  assert.strictEqual(result.mythicBuilds.length, 6);
  assert.strictEqual(result.ordinaryNamed, 0);
  assert.strictEqual(result.namedLocked, true);
  assert(result.namedCount > 0);
});

test("build cores produce distinct combat events instead of passive score multipliers", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    startGame();state.running=false;Math.random=()=>0;state.level=80;syncSkills();
    const item=(id,build,slot)=>({id,rarity:5,namedMythicId:id,buildTag:build,slot,stats:{},affixes:[],locked:true});
    const hit=(build,ids,turns=1)=>{state.equipment={weapon:null,head:null,armor:null,boots:null,ring:null,amulet:null};ids.forEach((x,i)=>state.equipment[x[1]]=item(x[0],build,x[1]));state.skillReadyAt={};state.combatTurn=1;state.enemy=makeEnemy(false);state.enemy.hp=state.enemy.maxHp=1e9;prepareNewBattle();for(let i=0;i<turns;i++){playerAttack();state.combatTurn++;}return state.enemy.maxHp-state.enemy.hp;};
    const base=hit('none',[],1),crit=hit('crit',[['worldfang','weapon'],['murderclock','amulet']],1),blood=hit('blood',[['titanheart','armor'],['bloodcrown','head']],1),burn=hit('burn',[['emberstaff','weapon'],['ashcrown','head']],2);
    if(!state.pets.length){const p=createPet('灰尾幼狼','Attack',0);state.pets=[p];state.activePetId=p.id;}
    const pet=hit('pet',[['beastpact','amulet'],['twinfang','weapon']],1);
    state.pets=[];state.activePetId=null;state.equipment={weapon:null,head:null,armor:item('mirrorwall','shield','armor'),boots:null,ring:item('thornring','shield','ring'),amulet:null};state.enemy=makeEnemy(false);state.enemy.hp=state.enemy.maxHp=1e9;prepareNewBattle();const hp0=state.hp;enemyAttack();const shieldDamage=1e9-state.enemy.hp,netTaken=hp0-state.hp;
    return JSON.stringify({base,crit,blood,burn,pet,shieldDamage,netTaken});
  })()`));
  assert(result.crit > result.base);
  assert(result.blood > result.base);
  assert(result.burn > result.base * 2);
  assert(result.pet > result.base);
  assert(result.shieldDamage > 0);
  assert(result.netTaken >= 0);
});

test("level 140 is a hard cap and offline protection restores the selected difficulty band", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.level=139;state.xp=xpNeed(139)-1;gainXp(999999999);
    const cap={level:state.level,xp:state.xp};state.level=35;state.worldDifficulty='normal';
    const before=[...map().levels],snap=alpha041BeginOfflineProtection(),during=[...map().levels];
    alpha041EndOfflineProtection(snap);const after=[...map().levels];
    return JSON.stringify({cap,before,during,after,selected:state.worldDifficulty});
  })()`));
  assert.deepStrictEqual(result.cap, { level: 140, xp: 0 });
  assert.deepStrictEqual(result.before, [1, 10]);
  assert.deepStrictEqual(result.during, [1, 29]);
  assert.deepStrictEqual(result.after, [1, 10]);
  assert.strictEqual(result.selected, "normal");
});

test("0.42 uses smooth defense, seven equipment bands and real map slot focus", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.started=true;state.worldDifficulty='torment10';state.highestUnlockedDifficulty=13;state.mapId='meadow';alpha041EnsureState();
    let weapon=0;for(let i=0;i<300;i++){const it=makeItem(1,null,2,true);if(it.slot==='weapon')weapon++;if(it.tier!==7)throw new Error('wrong tier')}
    return JSON.stringify({zero:smoothDamageAfterDefense(100,0),mid:smoothDamageAfterDefense(100,180),high:smoothDamageAfterDefense(100,1800),weapon});
  })()`));
  assert.deepStrictEqual({zero:result.zero,mid:result.mid,high:result.high},{zero:100,mid:50,high:9});
  assert(result.weapon > 100, `expected meadow weapon focus above the 50/300 baseline, got ${result.weapon}/300`);
});

test("0.42 retires legacy rebirth tabs and records build damage by source", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.tab='rebirth';alpha041EnsureState();state.buildDamage042={};
    state.equipment={weapon:null,head:null,armor:null,boots:null,ring:null,amulet:null};
    state.enemy=makeEnemy(false);state.enemy.hp=state.enemy.maxHp=1e9;prepareNewBattle();playerAttack();
    return JSON.stringify({tab:state.tab,rebirths:state.rebirths,damage:state.buildDamage042.normal?.basic||0});
  })()`));
  assert.strictEqual(result.tab,"character");
  assert.strictEqual(result.rebirths,0);
  assert(result.damage>0);
});

test("world difficulty owns ten-level enemy bands from normal through torment X", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.highestUnlockedDifficulty=13;
    const rows=[];
    for(const d of ALPHA_041_DIFFICULTIES){
      setWorldDifficulty(d.id);
      const levels=[];
      for(let i=0;i<200;i++) levels.push(makeEnemy(false).level);
      rows.push({id:d.id,min:Math.min(...levels),max:Math.max(...levels),mapLevels:[...map().levels]});
    }
    return JSON.stringify(rows);
  })()`));
  assert.strictEqual(result.length, 14);
  result.forEach((row, index) => {
    assert(row.min >= index * 10 + 1, `${row.id} spawned below its level band`);
    assert(row.max <= (index + 1) * 10, `${row.id} spawned above its level band`);
    assert.deepStrictEqual(row.mapLevels, [index * 10 + 1, (index + 1) * 10]);
  });
  assert.deepStrictEqual(result[0].mapLevels, [1, 10]);
  assert.deepStrictEqual(result[4].mapLevels, [41, 50]);
  assert.deepStrictEqual(result[13].mapLevels, [131, 140]);
});

test("boss progress is isolated by map and world difficulty", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.highestUnlockedDifficulty=1;
    state.bossProgress.meadow={active:true,hp:111,maxHp:999};
    setWorldDifficulty('hard');
    const hardHas=!!state.bossProgress.meadow;
    state.bossProgress.meadow={active:true,hp:222,maxHp:999};
    setWorldDifficulty('normal');
    return JSON.stringify({hardHas,normalHp:state.bossProgress.meadow.hp});
  })()`));
  assert.deepStrictEqual(result, { hardHas: false, normalHp: 111 });
});

test("mutant awakening preserves the lifelong pet and consumes only the donor", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.pets=[];const target=createPet('灰尾幼狼','Attack',0),donor=createPet('灰尾幼狼','Attack',0);
    target.level=23;target.tier=7;target.initialBond=true;donor.mutant=true;donor.mutationTrait='迅捷回响';
    state.pets=[target,donor];state.activePetId=target.id;awakenPetMutation(target.id,donor.id);
    return JSON.stringify({count:state.pets.length,id:state.pets[0].id,level:state.pets[0].level,tier:state.pets[0].tier,bond:state.pets[0].initialBond,trait:state.pets[0].mutationTrait});
  })()`));
  assert.strictEqual(result.count, 1);
  assert.strictEqual(result.level, 23);
  assert.strictEqual(result.tier, 7);
  assert.strictEqual(result.bond, true);
  assert.strictEqual(result.trait, "迅捷回响");
});

test("long deterministic battle run keeps core state finite", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  let seed=123456789;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  startGame();state.running=true;
  for(let i=0;i<12000;i++)battleTick();
  const values=[state.level,state.xp,state.gold,state.hp,state.mp,state.totalWins,state.totalLosses,state.inventory.length,state.pets.length];
  return JSON.stringify({finite:values.every(Number.isFinite),nonnegative:values.every(x=>x>=0),started:state.started,version:state.version});
 })()`,
    ),
  );
  assert.deepStrictEqual(result, {
    finite: true,
    nonnegative: true,
    started: true,
    version: "0.42.0",
  });
});

console.log("\nAlpha 0.42 regression suite passed.");

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const SCRIPT_FILES = [...html.matchAll(/<script src="\.\/([^"?]+\.js)(?:\?[^" ]+)?"/g)].map(
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
    scrollHeight: 0,
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
    "alpha-043-systems.js",
    "alpha-044-systems.js",
    "alpha-045-systems.js",
    "background-progress.js",
  ]);
  const context = createContext();
  const startTitle = evaluate(
    context,
    `(()=>{renderStart();return document.getElementById('app').innerHTML.includes('无尽战域：Alpha 0.45.3')})()`,
  );
  assert.strictEqual(startTitle, true);
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
    [...html.matchAll(/<link rel="stylesheet" href="\.\/([^"?]+\.css)(?:\?[^" ]+)?"/g)]
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
  assert.strictEqual(migrated.version, "0.45.3");
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
    version: "0.45.3",
    guardian: true,
    inherited: 138,
    bossBuildPreset: null,
    goalsClaimed: {},
    lastDefeatReport: null,
  });
});

test("0.40 save migrates all critical progress without overwriting the source", () => {
  const source = createContext();
  const oldSave = JSON.parse(evaluate(source, `(()=>{const d=fresh();d.version='0.40.0';d.started=true;d.race='human';d.style='melee';d.level=73;d.xp=1234;d.gold=45678;d.worldDifficulty='expert';d.highestUnlockedDifficulty=4;d.inventory=[makeItem(1,null,3,false)];d.bossProgress={meadow:{active:true,hp:321,maxHp:999}};return JSON.stringify(d)})()`));
  const raw = JSON.stringify(oldSave);
  const context = createContext({ "bwe-core-alpha-040": raw });
  const result = JSON.parse(evaluate(context, `JSON.stringify({version:state.version,level:state.level,xp:state.xp,gold:state.gold,difficulty:state.worldDifficulty,highest:state.highestUnlockedDifficulty,inventory:state.inventory.length,bossHp:state.bossProgress.meadow.hp,capacity:state.inventoryCapacity,has041:!!localStorage.getItem('bwe-core-alpha-041'),source:localStorage.getItem('bwe-core-alpha-040')})`));
  assert.deepStrictEqual({version:result.version,level:result.level,xp:result.xp,gold:result.gold,difficulty:result.difficulty,highest:result.highest,inventory:result.inventory,bossHp:result.bossHp,capacity:result.capacity},{version:"0.45.3",level:73,xp:1234,gold:45678,difficulty:"expert",highest:4,inventory:1,bossHp:321,capacity:120});
  assert.strictEqual(result.has041, true);
  assert.strictEqual(result.source, raw);
});

test("0.41 save under the stable key is accepted and migrated in place", () => {
  const source = createContext();
  const oldSave = JSON.parse(evaluate(source, `(()=>{const d=fresh();d.version='0.41.0';d.started=true;d.level=88;d.xp=777;d.gold=65432;d.worldDifficulty='torment2';d.highestUnlockedDifficulty=5;delete d.bossState;d.inventoryCapacity=40;return JSON.stringify(d)})()`));
  const context = createContext({ "bwe-core-alpha-041": JSON.stringify(oldSave) });
  const result = JSON.parse(evaluate(context, `JSON.stringify({version:state.version,level:state.level,xp:state.xp,gold:state.gold,difficulty:state.worldDifficulty,highest:state.highestUnlockedDifficulty,bossState:state.bossState,capacity:state.inventoryCapacity})`));
  assert.deepStrictEqual({version:result.version,level:result.level,xp:result.xp,gold:result.gold,difficulty:result.difficulty,highest:result.highest,capacity:result.capacity},{version:"0.45.3",level:88,xp:777,gold:65432,difficulty:"torment2",highest:5,capacity:120});
  assert.deepStrictEqual(result.bossState, {});
});

test("0.42.1 save gains 0.43 idle and loot fields without losing progress", () => {
  const seedContext = createContext();
  const oldSave = evaluate(seedContext, `(()=>{const d=fresh();d.version='0.42.1';d.started=true;d.race='human';d.style='melee';d.unlockedRaces=['human'];d.unlockedClasses=['melee'];d.level=96;d.xp=4321;d.gold=76543;d.worldDifficulty='torment4';d.highestUnlockedDifficulty=7;delete d.battleSpeed;delete d.autoLoot;delete d.lootFeedback;delete d.lootHighlights;delete d.lastOfflineReport;return JSON.stringify(d)})()`);
  const context = createContext({ "bwe-core-alpha-041": oldSave });
  const result = JSON.parse(evaluate(context, `JSON.stringify({version:state.version,level:state.level,xp:state.xp,gold:state.gold,difficulty:state.worldDifficulty,highest:state.highestUnlockedDifficulty,speed:state.battleSpeed,autoLoot:state.autoLoot,feedback:state.lootFeedback,highlights:state.lootHighlights,lastOfflineReport:state.lastOfflineReport})`));
  assert.deepStrictEqual(result, {
    version: "0.45.3",
    level: 96,
    xp: 4321,
    gold: 76543,
    difficulty: "torment4",
    highest: 7,
    speed: 1,
    autoLoot: { minRarity: 0, keepUpgrades: true },
    feedback: { sound: false, haptics: true, reducedMotion: false },
    highlights: [],
    lastOfflineReport: null,
  });
});

test("0.44 save migrates its active pet into the 0.45 lifelong companion model", () => {
  const seedContext = createContext();
  const oldSave = evaluate(seedContext, `(()=>{const d=fresh(),p=createPet('灰尾幼狼','Attack',0);d.version='0.44.0';d.started=true;d.level=111;d.gold=88888;p.id='legacy-main';p.level=57;p.tier=10;p.mutant=true;p.mutationTrait='bossbane';p.evolutionBranches={stage3:'assault',stage6:'apex'};delete p.initialBond;delete p.lifelongPath;d.pets=[p];d.activePetId=p.id;d.petCodex={'灰尾幼狼':12};delete d.petCodex045;return JSON.stringify(d)})()`);
  const context = createContext({ "bwe-core-alpha-041": oldSave });
  const result = JSON.parse(evaluate(context, `(()=>{const p=state.pets[0],r=state.petCodex045['灰尾幼狼'];return JSON.stringify({version:state.version,level:state.level,gold:state.gold,id:p.id,petLevel:p.level,tier:p.tier,name:p.name,initial:p.initialBond,locked:p.locked,mutation:p.mutationTrait,branch:p.evolutionBranches.stage6,found:r.found,highest:r.highestTier})})()`));
  assert.deepStrictEqual(result, {
    version: "0.45.3",
    level: 111,
    gold: 88888,
    id: "legacy-main",
    petLevel: 57,
    tier: 10,
    name: "血月猎王",
    initial: true,
    locked: true,
    mutation: "bossbane",
    branch: "apex",
    found: 12,
    highest: 10,
  });
});

test("future-version saves are rejected instead of being parsed by an older build", () => {
  const source = createContext();
  const future = JSON.parse(evaluate(source, `(()=>{const d=fresh();d.version='1.0.0';d.started=true;d.level=99;return JSON.stringify(d)})()`));
  const context = createContext({ "bwe-core-alpha-041": JSON.stringify(future) });
  const result = JSON.parse(evaluate(context, `JSON.stringify({started:state.started,level:state.level,version:state.version})`));
  assert.deepStrictEqual(result, {started:false,level:1,version:"0.45.3"});
});

test("validated saves reject corrupt fields and never relabel future imports", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    const good=validateSaveData({version:'0.41.0',level:8,inventory:[],pets:[]});
    const future=validateSaveData({version:'9.0.0',level:8,inventory:[],pets:[]});
    const broken=validateSaveData({version:'0.41.0',level:8,inventory:{},pets:[]});
    return JSON.stringify({good:good.ok,future:future.ok,futureReason:future.reason,broken:broken.ok});
  })()`));
  assert.strictEqual(result.good, true);
  assert.strictEqual(result.future, false);
  assert(result.futureReason.includes("更高版本"));
  assert.strictEqual(result.broken, false);
});

test("each overwrite preserves the previous valid main save as a safety backup", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state=fresh();state.version=VERSION;state.level=17;state.inventory=[];state.pets=[];save();
    const first=localStorage.getItem(SAVE_KEY);state.level=18;save();
    const backup=JSON.parse(localStorage.getItem(SAFE_BACKUP_KEY));
    return JSON.stringify({firstValid:!!parseValidatedSave(first).data,backupLevel:backup.level,mainLevel:JSON.parse(localStorage.getItem(SAVE_KEY)).level});
  })()`));
  assert.deepStrictEqual(result, { firstValid: true, backupLevel: 17, mainLevel: 18 });
});

test("a corrupt main save falls back to the last valid safety backup", () => {
  const backup = {
    version: "0.41.0", started: true, race: "human", style: "melee",
    level: 26, xp: 123, gold: 456, mapId: "meadow", inventory: [], pets: [], equipment: {},
  };
  const context = createContext({
    "bwe-core-alpha-041": "{broken-json",
    "bwe-core-safe-backup-v1": JSON.stringify(backup),
  });
  const result = JSON.parse(evaluate(context, `(()=>{
    const ok=load();return JSON.stringify({ok,level:state.level,xp:state.xp,gold:state.gold,version:state.version,mainValid:!!parseValidatedSave(localStorage.getItem(SAVE_KEY)).data});
  })()`));
  assert.deepStrictEqual(result, { ok: true, level: 26, xp: 123, gold: 456, version: "0.45.3", mainValid: true });
});

test("background settlement supports a 24-hour campaign without a parallel reward formula", () => {
  const source = read("background-progress.js");
  assert(source.includes("battleTick();"));
  assert(source.includes("24 * 60 * 60 * 1000"));
  assert(source.includes("alpha043ResolveOfflineBattle"));
  assert(!/state\.gold\s*[+\-*/]?=/.test(source));
  assert(!/receivePet\(|makeItem\(/.test(source));
});

test("0.43 exposes only reachable milestone goals and explains map focus precisely", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `JSON.stringify({goalIds:PROGRESSION_GOALS.map(x=>x.id),mapHtml:renderMaps(),starterSource:String(renderStart)})`));
  assert(!result.goalIds.some((id) => id.startsWith("abyss_") || id === "threat_3" || id === "six_tier_six"));
  assert(result.goalIds.includes("difficulty_expert"));
  assert(result.goalIds.includes("level_140"));
  assert(result.mapHtml.includes("提高概率，非限定掉落"));
  assert(result.mapHtml.includes("不提高品质、阶级、属性或收益"));
  assert(result.starterSource.includes('querySelector(".start .controls")'));
  assert(result.starterSource.includes('insertAdjacentHTML("beforebegin", choices)'));
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

test("defeat diagnosis keeps a fixed compact slot and opens details only on demand", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
  startGame();state.running=false;
  const empty=renderDefeatReport();
  state.lastDefeatReport={primary:'破甲不足',enemy:'测试敌人',enemyHpPct:64,rounds:5,reasons:[{name:'破甲不足',advice:'换上破甲技能。'}]};
  defeatReportOpen=false;const closed=renderDefeatReport();defeatReportOpen=true;const opened=renderDefeatReport();
  return JSON.stringify({emptySlot:empty.includes('defeat-report-slot'),emptyDisabled:empty.includes('disabled'),closedSlot:closed.includes('defeat-report-slot'),closedOverlay:closed.includes('defeat-report-overlay'),openedOverlay:opened.includes('defeat-report-overlay'),openedAdvice:opened.includes('换上破甲技能')});
 })()`,
    ),
  );
  assert.deepStrictEqual(result, {
    emptySlot: true,
    emptyDisabled: true,
    closedSlot: true,
    closedOverlay: false,
    openedOverlay: true,
    openedAdvice: true,
  });
});

test("0.45.3 battle and log docks preserve their roots and fixed geometry", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
        startGame();state.running=false;
        const panel=document.getElementById('battle-panel');
        const first=panel.innerHTML;
        renderBattleOnly();
        const second=panel.innerHTML;
        state.hp=Math.max(1,state.hp-1);state.enemy.hp=Math.max(1,state.enemy.hp-1);
        renderBattleOnly();
        return JSON.stringify({stable:first===second&&second===panel.innerHTML,key:panel.dataset.structureKey,hasMechanics:first.includes('battle-enemy-mechanics')});
      })()`,
    ),
  );
  const css = read("game.css");
  assert.deepStrictEqual(result, {
    stable: true,
    key: "pet",
    hasMechanics: true,
  });
  assert(css.includes(".battle-live-root,\n.log-dock {\n  overflow-anchor: none;"));
  assert(css.includes("scroll-behavior: auto;"));
  assert(css.includes("height: 160px;\n  min-height: 160px;\n  max-height: 160px;"));
  assert(css.includes("height: 124px;\n    min-height: 124px;\n    max-height: 124px;"));
  assert(css.includes("overscroll-behavior: contain;"));
  assert(css.includes("height: 72px;"));
  const core = read("game-core.js");
  assert(core.includes('dock.querySelector?.(".log-toolbar")'));
  assert(core.includes('dock.querySelector?.(".log-stream")'));
  assert(core.includes('button.dataset.logFilter'));
  assert(!core.includes('if (dock.innerHTML !== html) dock.innerHTML = html;'));
});

test("0.45.3 log updates keep the dock and toolbar while preserving internal reading position", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{
        const buttons=["damage","defense","loot","important","system"].map((key)=>({dataset:{logFilter:key},active:false,classList:{toggle(name,on){if(name==="active")this.owner.active=on},owner:null}}));
        buttons.forEach((button)=>button.classList.owner=button);
        const toolbar={querySelectorAll(){return buttons}};
        let streamWrites=0,dockWrites=0;
        const stream={scrollTop:0,scrollHeight:100,_inner:""};
        Object.defineProperty(stream,"innerHTML",{get(){return this._inner},set(value){this._inner=value;streamWrites++;this.scrollHeight=100+(value.match(/cat-/g)||[]).length*20}});
        const dock={querySelector(selector){return selector===".log-toolbar"?toolbar:selector===".log-stream"?stream:null}};
        Object.defineProperty(dock,"innerHTML",{get(){return ""},set(){dockWrites++}});
        const originalGet=document.getElementById;
        document.getElementById=(id)=>id==="log-dock"?dock:originalGet(id);
        state.logFilters={damage:false,defense:false,loot:true,important:true,system:true};
        state.log=[{msg:"旧记录",cls:"important",category:"important"}];
        renderLogOnly();
        stream.scrollTop=20;
        state.log.unshift({msg:"新记录",cls:"important",category:"important"});
        renderLogOnly();
        setAllLogMode();
        return JSON.stringify({dockWrites,streamWrites,scrollTop:stream.scrollTop,allActive:buttons.every((button)=>button.active),toolbarKept:dock.querySelector(".log-toolbar")===toolbar});
      })()`,
    ),
  );
  assert.deepStrictEqual(result, {
    dockWrites: 0,
    streamWrites: 2,
    scrollTop: 40,
    allActive: true,
    toolbarKept: true,
  });
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

test("0.45.2 world difficulty raises Boss pet drop tiers without exceeding natural Tier 6", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    const ids=['normal','hard','expert','master','torment1','torment2','torment3','torment4','torment5','torment6','torment7','torment8','torment9','torment10'];
    const profiles=ids.map(id=>{state.worldDifficulty=id;const p=alpha0452PetDropTierProfile();return [p.guaranteed,p.promoted,Math.round(p.promotionChance*100)];});
    const roll=(id,r)=>{state.worldDifficulty=id;Math.random=()=>r;return createPet('灰尾幼狼','Attack',0).tier;};
    const rolls={normal:roll('normal',0),hardHigh:roll('hard',0),hardBase:roll('hard',0.99),master:roll('master',0),t6:roll('torment6',0.99),t10High:roll('torment10',0),t10Base:roll('torment10',0.99)};
    state.worldDifficulty='torment10';const ui=renderMaps();
    return JSON.stringify({profiles,rolls,ui:ui.includes('Boss宠物初始阶级：5阶80% / 6阶20%')&&ui.includes('当前难度5阶80% / 6阶20%')});
  })()`));
  assert.deepStrictEqual(result.profiles, [
    [1,2,0],[1,2,20],[1,2,40],
    [2,3,0],[2,3,20],[2,3,40],
    [3,4,0],[3,4,20],[3,4,40],
    [4,5,0],[4,5,20],[4,5,40],
    [5,6,0],[5,6,20],
  ]);
  assert.deepStrictEqual(result.rolls, {
    normal: 1,
    hardHigh: 2,
    hardBase: 1,
    master: 2,
    t6: 4,
    t10High: 6,
    t10Base: 5,
  });
  assert.strictEqual(result.ui, true);
});

test("natural high-tier pets preserve their completed tier investment when fused", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.worldDifficulty='torment10';let calls=0;Math.random=()=>calls++===0?0:0.99;
    const donor=createPet('灰尾幼狼','Attack',0),expected=1+petEvolutionSpentXp(donor),recorded=donor.fusionInvestedXp;
    state.worldDifficulty='normal';Math.random=()=>0.99;const target=createPet('灰尾幼狼','Attack',0),inherited=inheritPetEvolution(target,donor);
    const legacy=createPet('灰尾幼狼','Attack',0);legacy.tier=6;legacy.fusionInvestedXp=1;state.pets=[legacy];alpha041EnsureState();
    return JSON.stringify({donorTier:donor.tier,mutant:donor.mutant,expected,recorded,inherited:inherited.evolutionXp,targetTier:target.tier,legacyInvestment:legacy.fusionInvestedXp});
  })()`));
  assert.strictEqual(result.donorTier, 6);
  assert.strictEqual(result.mutant, false);
  assert.strictEqual(result.recorded, result.expected);
  assert.strictEqual(result.inherited, result.expected);
  assert.strictEqual(result.targetTier, 6);
  assert.strictEqual(result.legacyInvestment, result.expected);
});

test("regional bosses require accumulated normal wins and unlock the next difficulty", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.highestUnlockedDifficulty=0;state.worldDifficulty='normal';
    const c=ensureBossCycle(state.mapId),period=bossCycleConfig(state.mapId).period;
    challengeDifficultyBoss();const afterManual=c.normalSinceBoss;
    c.normalSinceBoss=period-1;state.enemy=null;ensureEnemy();const beforeBoss=state.enemy.boss;
    state.enemy=null;c.normalSinceBoss=period;ensureEnemy();const e=state.enemy;
    onBattleWon(e,map());
    return JSON.stringify({period,afterManual,beforeBoss,boss:e.boss,breakthrough:e.difficultyBreakthrough,name:e.name,highest:state.highestUnlockedDifficulty});
  })()`));
  assert.strictEqual(result.afterManual, 0);
  assert.strictEqual(result.beforeBoss, false);
  assert.strictEqual(result.boss, true);
  assert.strictEqual(result.breakthrough, true);
  assert(result.name.includes("区域首领"));
  assert.strictEqual(result.highest, 1);
});

test("threat rises on wins, falls on losses and T9 fixes ordinary enemies at band maximum", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    alpha041EnsureState();state.worldDifficulty='normal';const c=ensureBossCycle(state.mapId);
    c.threatTier=0;c.threatUnlocked=0;
    for(let i=0;i<9;i++) dangerRecordWin(c,false);
    const atCap=threatTier(),levels=[];for(let i=0;i<30;i++)levels.push(makeEnemy(false).level);
    dangerRecordLoss({boss:false},map(),c);
    return JSON.stringify({atCap,unique:[...new Set(levels)],afterLoss:threatTier()});
  })()`));
  assert.strictEqual(result.atCap, 9);
  assert.deepStrictEqual(result.unique, [10]);
  assert.strictEqual(result.afterLoss, 8);
});

test("legacy unlimited pet capacity is migrated to a real visible capacity", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.petCapacity=9999;state.pets=[createPet('灰尾幼狼','Attack',0)];alpha041EnsureState();
    state.tab='pets';const html=renderPets();
    return JSON.stringify({capacity:state.petCapacity,label:html.includes('已拥有 1只｜容量 12只'),legacy:html.includes('/9999')});
  })()`));
  assert.deepStrictEqual(result, {capacity:12,label:true,legacy:false});
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
    const hit=(build,ids,turns=1)=>{state.equipment={weapon:null,head:null,armor:null,boots:null,ring:null,amulet:null};ids.forEach((x,i)=>state.equipment[x[1]]=item(x[0],build,x[1]));state.skillReadyAt={};state.combatTurn=1;state.enemy=makeEnemy(false);state.enemy.ecologyId='neutral';state.enemy.ecologyEvadeHero=0;state.enemy.hp=state.enemy.maxHp=1e9;prepareNewBattle();for(let i=0;i<turns;i++){playerAttack();state.combatTurn++;}return state.enemy.maxHp-state.enemy.hp;};
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

test("level 140 is a hard cap and offline settlement preserves the selected difficulty band", () => {
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
  assert.deepStrictEqual(result.during, [1, 10]);
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
    state.enemy=makeEnemy(false);state.enemy.ecologyId='neutral';state.enemy.hp=state.enemy.maxHp=1e9;prepareNewBattle();playerAttack();
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

test("0.45.3 exposes x10/x20 test speeds without changing offline settlement", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    const intervals=[];
    setInterval=(_,ms)=>{intervals.push(ms);return intervals.length+10};
    state.started=true;state.running=true;
    state.battleSpeed=10;alpha043EnsureState();alpha043RestartBattleTimer();
    state.battleSpeed=20;alpha043EnsureState();alpha043RestartBattleTimer();
    const controls=renderAlpha043BattleControls();
    state.battleSpeed=8;alpha043EnsureState();
    return JSON.stringify({version:VERSION,speed20:controls.includes('aria-pressed="true" title="测试速度 · 每回合约33毫秒">×20'),fallback:state.battleSpeed,intervals,offline:alpha043OfflineBattleCount(24*60*60*1000),buttons:[1,2,4,10,20].every(x=>controls.includes('×'+x))});
  })()`));
  assert.deepStrictEqual(result, {
    version: "0.45.3",
    speed20: true,
    fallback: 1,
    intervals: [65, 33],
    offline: 1920,
    buttons: true,
  });
});

test("0.43 auto dismantling protects upgrades and every mythic", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state=fresh();state.started=true;state.race='human';state.style='melee';
    state.unlockedRaces=['human'];state.unlockedClasses=['melee'];
    alpha043EnsureState();state.autoLoot.minRarity=3;state.autoLoot.keepUpgrades=false;
    const low=makeItem(1,null,0,false),before=state.gold;receiveItem(low);
    const mythic=makeItem(1,'sword',5,false);receiveItem(mythic);
    const ui=renderInventory();
    return JSON.stringify({lowGone:!state.inventory.some(x=>x.id===low.id),goldGain:state.gold>before,mythicKept:state.inventory.some(x=>x.id===mythic.id),mythicLocked:mythic.locked,threshold:state.autoLoot.minRarity,ui:ui.includes('自动分解与保护')&&ui.includes('重要收获')&&ui.includes('神话音效')});
  })()`));
  assert.deepStrictEqual(result, {
    lowGone: true,
    goldGain: true,
    mythicKept: true,
    mythicLocked: true,
    threshold: 3,
    ui: true,
  });
});

test("0.43 flattens raw mythic stats while retaining named build powers", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state=fresh();state.started=true;state.race='human';state.style='melee';
    const item=makeItem(1,'sword',5,false);
    return JSON.stringify({statGap:QUALITY_STAT_MULT[5]/QUALITY_STAT_MULT[4],scoreGap:QUALITY_SCORE_MULT[5]/QUALITY_SCORE_MULT[4],named:!!item.namedMythicId,lockedAfterReceive:(receiveItem(item),item.locked),curve:item.qualityCurveVersion});
  })()`));
  assert(result.statGap < 1.25);
  assert(result.scoreGap < 1.25);
  assert.strictEqual(result.named, true);
  assert.strictEqual(result.lockedAfterReceive, true);
  assert.strictEqual(result.curve, 9);
});

test("0.43 mythic migration is idempotent across repeated save loads", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state=fresh();state.started=true;state.race='human';state.style='melee';state.unlockedRaces=['human'];state.unlockedClasses=['melee'];
    const item=makeItem(1,'sword',5,false);receiveItem(item);save();
    const first=JSON.stringify(item.stats);load();const second=JSON.stringify(state.inventory.find(x=>x.id===item.id).stats);load();const third=JSON.stringify(state.inventory.find(x=>x.id===item.id).stats);
    return JSON.stringify({first,second,third,curve:state.inventory.find(x=>x.id===item.id).qualityCurveVersion});
  })()`));
  assert.strictEqual(result.first, result.second);
  assert.strictEqual(result.second, result.third);
  assert.strictEqual(result.curve, 9);
});

test("0.43 offline report records rarity, dismantling and important loot", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state=fresh();state.started=true;state.race='human';state.style='melee';
    state.unlockedRaces=['human'];state.unlockedClasses=['melee'];alpha043EnsureState();
    state.autoLoot.minRarity=4;state.autoLoot.keepUpgrades=false;
    alpha043BeginOfflineSession({elapsed:3600000,realElapsed:3600000});
    receiveItem(makeItem(1,null,0,false));receiveItem(makeItem(1,'sword',5,false));
    const report=alpha043CompleteOfflineSession();
    return JSON.stringify({duration:report.durationText,drops:report.dropTotal,normal:report.drops[0],mythic:report.drops[5],salvaged:report.salvaged,highlights:report.highlights.length,last:state.lastOfflineReport.dropTotal,reopen:renderAlpha043LootHub().includes('查看战报')});
  })()`));
  assert.deepStrictEqual(result, {
    duration: "1小时",
    drops: 2,
    normal: 1,
    mythic: 1,
    salvaged: 1,
    highlights: 2,
    last: 2,
    reopen: true,
  });
});

test("compressed offline campaign remains finite across 1000 resolved battles", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    let seed=987654321;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    startGame();state.running=true;alpha043BeginOfflineSession({elapsed:3600000,realElapsed:3600000});
    for(let i=0;i<1000;i++)alpha043ResolveOfflineBattle();
    const report=alpha043CompleteOfflineSession();
    const values=[state.level,state.xp,state.gold,state.hp,state.mp,state.totalWins,state.totalLosses,state.inventory.length,state.pets.length,report.dropTotal];
    return JSON.stringify({finite:values.every(Number.isFinite),nonnegative:values.every(x=>x>=0),battles:report.wins+report.losses,version:state.version});
  })()`));
  assert.deepStrictEqual(result, {
    finite: true,
    nonnegative: true,
    battles: 1000,
    version: "0.45.3",
  });
});

test("0.43 pets receive equipment-gap compensation on all combat stats", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{const p=createPet('灰尾幼狼','Attack',0);const boosted=petStats(p);const raw=(()=>{const fn=String(petStats);return boosted})();return JSON.stringify({hp:boosted.maxHp,atk:boosted.atk,def:boosted.def,magic:boosted.magic,notice:renderPets().includes('固定提高35%')})})()`));
  assert(result.hp > 0 && result.atk > 0 && result.def > 0 && result.magic > 0);
  assert.strictEqual(result.notice, true);
});

test("0.43 capacity upgrades are reachable from inventory and pet pages", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{state.gold=100000;const i=state.inventoryCapacity,p=state.petCapacity;const invUi=renderInventory(),petUi=renderPets();expandInventory();expandPetCapacity();return JSON.stringify({invUi:invUi.includes('物品栏扩容'),petUi:petUi.includes('宠物栏与伙伴补偿'),inv:state.inventoryCapacity-i,pet:state.petCapacity-p})})()`));
  assert.deepStrictEqual(result, { invUi: true, petUi: true, inv: 5, pet: 2 });
});

test("0.43 skills use deterministic priority without proficiency growth", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{state.unlockedClasses=['farmer'];state.style='farmer';syncSkills();state.activeSkillSlots=['farmer_swing'];state.mp=999;state.skillReadyAt={};const before=state.skillUse.farmer_swing||0;const picked=chooseSkill('attack');registerSkillUse(picked);const ui=renderSkills();return JSON.stringify({picked,before,after:state.skillUse.farmer_swing||0,noMastery:ui.includes('没有熟练度'),priority:ui.includes('从上到下')})})()`));
  assert.deepStrictEqual(result, { picked: "farmer_swing", before: 0, after: 0, noMastery: true, priority: true });
});

test("0.44 weapon refinement reaches cumulative +275% at +10", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    const weapon=makeItem(1,'sword',2,false),armor=makeItem(1,null,2,false);
    weapon.slot='weapon';weapon.refine=10;armor.slot='armor';armor.refine=5;
    return JSON.stringify({weaponMax:refineMaxLevel(weapon),weaponPct:refineBonusPct(weapon),weaponMult:refineMultiplier(weapon),armorMax:refineMaxLevel(armor),armorPct:refineBonusPct(armor),ui:renderInventory().includes('满级累计提升275%')});
  })()`));
  assert.deepStrictEqual(result, { weaponMax: 10, weaponPct: 275, weaponMult: 3.75, armorMax: 5, armorPct: 40, ui: true });
});

test("0.44 enemy ecologies are visible and have bounded counterplay", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    let seed=12345;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    state.mapId='hill';const armor=makeEnemy(true);
    state.mapId='meadow';const evade=makeEnemy(true);
    state.mapId='forest';const regen=makeEnemy(true);regen.boss=false;regen.round=4;const before=regen.hp=Math.round(regen.maxHp*.5);alpha044OnEnemyRound(regen);
    const maps=renderMaps();
    return JSON.stringify({armor:armor.ecologyId,armorRaised:armor.def>0,evade:evade.ecologyId,evadeHero:evade.ecologyEvadeHero,regen:regen.ecologyId,healed:regen.hp>before,maps:maps.includes('敌人生态')&&maps.includes('生态应对')});
  })()`));
  assert.deepStrictEqual(result, { armor: "armor", armorRaised: true, evade: "evade", evadeHero: 0.16, regen: "regen", healed: true, maps: true });
});

test("0.45 evolution choices change form names and complete missing route effects", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.pets=[];state.nextId=1;state.hp=1;
    const tree=createPet('树灵幼芽','Magic',2);tree.mutant=false;tree.tier=6;tree.evolutionBranches={};state.pets=[tree];state.activePetId=tree.id;
    choosePetEvolution(tree.id,3,'guardian');choosePetEvolution(tree.id,6,'harmony');
    const s=stats(),ps=petStats(tree),enemy=makeEnemy(false);state.temp={};state.hp=Math.round(s.maxHp*.25);tree.hp=Math.round(ps.maxHp*.25);tree.battleTurns=4;
    const hp0=state.hp,pet0=tree.hp;petSpeciesSpecial(tree,enemy,ps,s);
    const spirit=createPet('王魂侍从','Defense',4);spirit.mutant=false;spirit.tier=6;spirit.evolutionBranches={stage3:'assault',stage6:'apex'};spirit.name='不灭猎王';state.pets=[spirit];state.activePetId=spirit.id;state.enemy=makeEnemy(true);const enemyHp=state.enemy.hp;spirit.hp=0;spirit.apexRevived=false;spirit.fallen=false;markPetFallen(spirit);
    return JSON.stringify({treeName:tree.name,treeHealed:state.hp>hp0&&tree.hp>pet0,bonusLogged:state.log.some(x=>x.msg.includes('古木守心')),revived:spirit.apexRevived&&!spirit.fallen,blade:state.enemy.hp<enemyHp});
  })()`));
  assert.deepStrictEqual(result, { treeName: "生命共鸣", treeHealed: true, bonusLogged: true, revived: true, blade: true });
});

test("0.45 gives the Tier 10 initial companion a permanent final path", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.pets=[];const p=createPet('灰尾幼狼','Attack',0);p.mutant=false;p.initialBond=true;p.tier=10;p.evolutionBranches={stage3:'assault',stage6:'apex'};state.pets=[p];state.activePetId=p.id;
    const enemy={boss:true,hp:100,maxHp:100,def:10};const base=petSpeciesDamageMult(p,enemy);chooseLifelongPath045(p.id,'hunt');const hunt=petSpeciesDamageMult(p,enemy),power=petCombatPower(p),ui=renderPets();
    p.lifelongPath='guard';const petTaken=petDamageTakenMult(p),playerTaken=playerDamageTakenPetMult(p);
    return JSON.stringify({path:p.lifelongPath,hunt:Math.round(hunt/base*100),power,petTaken,playerTaken,ui:ui.includes('终身伙伴')&&ui.includes('变异觉醒')});
  })()`));
  assert.strictEqual(result.hunt, 132);
  assert(result.power > 0 && result.petTaken < 1 && result.playerTaken < 1);
  assert.strictEqual(result.ui, true);
});

test("0.45 mutation awakening preserves the original lifelong companion", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.pets=[];const target=createPet('灰尾幼狼','Attack',0),donor=createPet('灰尾幼狼','Magic',0);target.mutant=false;target.initialBond=true;target.level=41;target.tier=9;target.evolutionBranches={stage3:'guardian',stage6:'harmony'};donor.mutant=true;donor.mutationTrait='frenzy';state.pets=[target,donor];state.activePetId=target.id;awakenLifelongPet045(target.id,donor.id);
    return JSON.stringify({count:state.pets.length,id:state.pets[0].id,level:state.pets[0].level,tier:state.pets[0].tier,branch:state.pets[0].evolutionBranches.stage6,mutant:state.pets[0].mutant,trait:state.pets[0].mutationTrait});
  })()`));
  assert.deepStrictEqual(result, { count: 1, id: "p1", level: 41, tier: 9, branch: "harmony", mutant: true, trait: "frenzy" });
});

test("0.45 codex permanently tracks species, types, routes and mutations", () => {
  const context = createContext();
  const result = JSON.parse(evaluate(context, `(()=>{
    state.petCodex={'灰尾幼狼':3};state.petCodex045={};state.pets=[];
    const a=createPet('灰尾幼狼','Attack',0),b=createPet('灰尾幼狼','Magic',0);a.mutant=true;a.mutationTrait='bossbane';a.tier=6;a.evolutionBranches={stage3:'assault',stage6:'apex'};b.mutant=false;b.evolutionBranches={stage3:'guardian'};alpha045RecordPetDiscovery(a);alpha045RecordPetDiscovery(b);const summary=alpha045CodexSummary(),pets=renderPets(),maps=renderMaps();
    return JSON.stringify({summary,record:state.petCodex045['灰尾幼狼'],pets:pets.includes('伙伴图鉴与长期收集')&&pets.includes('获得3 · 最高6阶'),maps:maps.includes('区域伙伴追踪')&&maps.includes('Boss专属')});
  })()`));
  assert.deepStrictEqual(result.summary, { species: 1, types: 2, branches: 3, mutations: 1 });
  assert.strictEqual(result.record.found, 3);
  assert.strictEqual(result.record.highestTier, 6);
  assert.strictEqual(result.pets, true);
  assert.strictEqual(result.maps, true);
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
    version: "0.45.3",
  });
});

console.log("\nAlpha 0.45.3 regression suite passed.");

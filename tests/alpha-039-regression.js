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
    "background-progress.js",
  ]);
  createContext();
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
  startGame();state.running=false;Math.random=()=>.999;
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
  assert.strictEqual(result.basePets, 0);
  assert.strictEqual(result.boostedPets, 1);
  assert.strictEqual(result.afterNormal, 1);
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

test("sold-out shop stock immediately refreshes by design", () => {
  const context = createContext();
  const stock = JSON.parse(
    evaluate(
      context,
      `(()=>{state.shop.stock=[];state.shop.nextRefreshAt=Date.now()+999999;renderShop();return JSON.stringify({size:state.shop.stock.length,next:state.shop.nextRefreshAt>Date.now()})})()`,
    ),
  );
  assert.deepStrictEqual(stock, { size: 6, next: true });
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
  assert.strictEqual(migrated.version, "0.40.0");
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
    version: "0.40.0",
    guardian: true,
    inherited: 138,
    bossBuildPreset: null,
    goalsClaimed: {},
    lastDefeatReport: null,
  });
});

test("background settlement replays the canonical battle tick without a parallel reward formula", () => {
  const source = read("background-progress.js");
  assert(source.includes("battleTick();"));
  assert(!/state\.gold\s*[+\-*/]?=/.test(source));
  assert(!/receivePet\(|makeItem\(/.test(source));
});

test("gold baseline, Abyss entry and world-tier ratios survive the 0.40 upgrade", () => {
  const context = createContext();
  const result = JSON.parse(
    evaluate(
      context,
      `(()=>{state.rebirths=1;state.rebirthLaws={war:0,time:0,hunt:0};state.mapId='meadow';const e=makeEnemy(false),rp=rebirthProfile(),abyss=MAPS.find(m=>m.id==='abyss');return JSON.stringify({gold:e.gold/e.title.gold,cp:abyss.cp,damage:rp.damage,hp:rp.hp,def:rp.def,pet:rp.petPower,goldRebirth:rp.gold,world:worldCombatScale('meadow')})})()`,
    ),
  );
  assert(Math.abs(result.gold - 3.2) < 1e-9);
  assert(result.cp >= 8000 && result.cp <= 10000);
  assert.deepStrictEqual(
    {
      damage: result.damage,
      hp: result.hp,
      def: result.def,
      pet: result.pet,
      gold: result.goldRebirth,
    },
    { damage: 1.1, hp: 1.06, def: 1.06, pet: 1.1, gold: 1.08 },
  );
  assert.deepStrictEqual(
    {
      hp: result.world.hp,
      atk: result.world.atk,
      def: result.world.def,
      reward: result.world.reward,
    },
    { hp: 1.12, atk: 1.08, def: 1.06, reward: 1.12 },
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

test("the duplicate random gear merchant is removed", () => {
  const context = createContext();
  const shop = evaluate(
    context,
    `(()=>{startGame();state.running=false;return renderShop()})()`,
  );
  assert(!shop.includes("<h3>装备行商</h3>"));
  assert(shop.includes("定时装备商店"));
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
    version: "0.40.0",
  });
});

console.log("\nAlpha 0.40 regression suite passed.");

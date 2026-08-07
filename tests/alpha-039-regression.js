const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const SCRIPT_FILES=[...html.matchAll(/<script src="\.\/([^"?]+\.js)"/g)].map(match=>match[1]);

class MemoryStorage{
 constructor(seed={}){this.data=new Map(Object.entries(seed))}
 get length(){return this.data.size}
 key(index){return [...this.data.keys()][index]??null}
 getItem(key){return this.data.has(key)?this.data.get(key):null}
 setItem(key,value){this.data.set(String(key),String(value))}
 removeItem(key){this.data.delete(String(key))}
 clear(){this.data.clear()}
}

function element(id=''){
 return{
  id,value:id==='hero-name'?'旅者':'',innerHTML:'',textContent:'',scrollTop:0,open:false,parentElement:null,
  style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},
  appendChild(){},remove(){},click(){},scrollIntoView(){},
  querySelector(){return null},querySelectorAll(){return[]},
 };
}

function createContext(seed={}){
 const nodes=new Map();
 const getNode=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)};
 const document={
  title:'',hidden:false,head:element('head'),body:element('body'),
  getElementById:getNode,createElement:tag=>element(tag),
  querySelector(){return null},querySelectorAll(){return[]},
  addEventListener(){},removeEventListener(){},
 };
 const context={
  console,document,localStorage:new MemoryStorage(seed),navigator:{userAgent:'node'},location:{protocol:'file:',reload(){}},
  alert(){},confirm(){return true},requestAnimationFrame(fn){if(fn)fn()},
  setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},
  Blob:class{},URL:{createObjectURL(){return'blob:test'},revokeObjectURL(){}},FileReader:class{},
 };
 context.window=context;context.window.scrollY=0;context.window.scrollTo=()=>{};context.window.matchMedia=()=>({matches:false});context.window.addEventListener=()=>{};context.window.removeEventListener=()=>{};
 vm.createContext(context);
 for(const file of SCRIPT_FILES){
  const source=fs.readFileSync(path.join(ROOT,file),'utf8');
  vm.runInContext(source,context,{filename:file});
 }
 return context;
}

function evaluate(context,source){return vm.runInContext(source,context)}
function read(file){return fs.readFileSync(path.join(ROOT,file),'utf8')}
function test(name,fn){
 try{fn();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`);throw error}
}

test('all browser scripts parse and load in index order',()=>{
 assert.strictEqual(SCRIPT_FILES.at(-1),'alpha-039-systems.js');
 assert(!SCRIPT_FILES.includes('auto-pet-fusion.js'));
 createContext();
});

test('fusion transfers the donor itself plus all 100 prior fusions and all level XP',()=>{
 const context=createContext();
 const result=JSON.parse(evaluate(context,`(()=>{
  state.pets=[];state.nextId=1;
  const a=createPet('灰尾幼狼','Attack',0);a.mutant=false;a.mutationGrade=null;a.fusionInvestedXp=1;
  for(let i=0;i<100;i++){const donor=createPet('灰尾幼狼','Balance',0);donor.mutant=false;donor.mutationGrade=null;donor.fusionInvestedXp=1;inheritPetEvolution(a,donor)}
  a.level=6;a.xp=9;
  const expectedLevelXp=petLevelInvestment(a);
  const b=createPet('灰尾幼狼','Attack',0);b.mutant=false;b.mutationGrade=null;b.fusionInvestedXp=1;
  const inherited=inheritPetEvolution(b,a);
  return JSON.stringify({aInvestment:petEvolutionValue(a),evolutionXp:inherited.evolutionXp,levelXp:inherited.levelXp,expectedLevelXp,targetLevel:b.level,targetTier:b.tier});
 })()`));
 assert.strictEqual(result.aInvestment,101);
 assert.strictEqual(result.evolutionXp,101);
 assert.strictEqual(result.levelXp,result.expectedLevelXp);
 assert(result.targetLevel>1);
 assert(result.targetTier>1);
});

test('evolved forms can consume their base form through shared species lineage',()=>{
 const context=createContext();
 const result=JSON.parse(evaluate(context,`(()=>{
  state.pets=[];state.nextId=1;
  const evolved=createPet('灰尾幼狼','Attack',0);evolved.name='月影追猎';evolved.baseSpecies='灰尾幼狼';
  const base=createPet('灰尾幼狼','Attack',0);state.pets=[evolved,base];
  return JSON.stringify({same:samePetSpecies(evolved,base),donors:sameSpeciesDonors(evolved,false).length,base:petBaseSpecies(evolved)});
 })()`));
 assert.deepStrictEqual(result,{same:true,donors:1,base:'灰尾幼狼'});
});

test('ordinary enemies never drop pets while a defeated Boss can',()=>{
 const context=createContext();
 const result=JSON.parse(evaluate(context,`(()=>{
  startGame();state.running=false;state.firstBossMilestoneClaimed=true;Math.random=()=>0;
  state.enemy=makeEnemy(false);const before=state.pets.length;winBattle();const afterNormal=state.pets.length;
  state.enemy=makeEnemy(true);winBattle();const afterBoss=state.pets.length;
  return JSON.stringify({before,afterNormal,afterBoss});
 })()`));
 assert.strictEqual(result.afterNormal,result.before);
 assert(result.afterBoss>result.afterNormal);
});

test('Boss retry uses half of the original encounter period even after danger falls',()=>{
 const context=createContext();
 const result=JSON.parse(evaluate(context,`(()=>{
  startGame();state.running=false;state.firstBossMilestoneClaimed=true;
  const cycle=ensureBossCycle('meadow');cycle.threatUnlocked=5;cycle.threatTier=5;
  state.enemy=makeEnemy(true);state.enemy.bossCyclePeriod=25;state.enemy.hp=Math.round(state.enemy.maxHp*.50);loseBattle();
  const first={retry:cycle.retryCountdown,period:state.bossProgress.meadow.encounterPeriod,threat:cycle.threatTier};
  cycle.retryCountdown=0;state.enemy=null;ensureEnemy();state.enemy.hp=Math.round(state.enemy.hp*.50);loseBattle();
  return JSON.stringify({first,secondRetry:cycle.retryCountdown,secondPeriod:state.bossProgress.meadow.encounterPeriod});
 })()`));
 assert.strictEqual(result.first.period,25);
 assert.strictEqual(result.first.retry,13);
 assert(result.first.threat<5);
 assert.strictEqual(result.secondPeriod,25);
 assert.strictEqual(result.secondRetry,13);
});

test('sold-out shop stock immediately refreshes by design',()=>{
 const context=createContext();
 const stock=JSON.parse(evaluate(context,`(()=>{state.shop.stock=[];state.shop.nextRefreshAt=Date.now()+999999;renderShop();return JSON.stringify({size:state.shop.stock.length,next:state.shop.nextRefreshAt>Date.now()})})()`));
 assert.deepStrictEqual(stock,{size:6,next:true});
});

test('0.38 save migrates without Soul and keeps pet tier, evolution XP and level',()=>{
 const source=createContext();
 const oldSave=JSON.parse(evaluate(source,`(()=>{const d=fresh(),p=createPet('灰尾幼狼','Attack',0);d.version='0.38.0';d.soul=77;p.tier=4;p.evolutionXp=17;p.level=8;p.xp=11;delete p.fusionInvestedXp;d.pets=[p];d.activePetId=p.id;return JSON.stringify(d)})()`));
 const context=createContext({'bwe-core-alpha-038':JSON.stringify(oldSave)});
 const migrated=JSON.parse(evaluate(context,`JSON.stringify({version:state.version,hasSoul:Object.prototype.hasOwnProperty.call(state,'soul'),pet:state.pets[0]&&{tier:state.pets[0].tier,evolutionXp:state.pets[0].evolutionXp,level:state.pets[0].level,xp:state.pets[0].xp,baseSpecies:state.pets[0].baseSpecies,investment:state.pets[0].fusionInvestedXp}})`));
 assert.strictEqual(migrated.version,'0.39.0');
 assert.strictEqual(migrated.hasSoul,false);
 assert.deepStrictEqual({tier:migrated.pet.tier,evolutionXp:migrated.pet.evolutionXp,level:migrated.pet.level,xp:migrated.pet.xp,baseSpecies:migrated.pet.baseSpecies},{tier:4,evolutionXp:17,level:8,xp:11,baseSpecies:'灰尾幼狼'});
 assert(migrated.pet.investment>17);
});

test('background settlement replays the canonical battle tick without a parallel reward formula',()=>{
 const source=read('background-progress.js');
 assert(source.includes('battleTick();'));
 assert(!/state\.gold\s*[+\-*/]?=/.test(source));
 assert(!/receivePet\(|makeItem\(/.test(source));
});

test('gold baseline, Abyss entry and world-tier ratios match the 0.39 rebalance',()=>{
 const context=createContext();
 const result=JSON.parse(evaluate(context,`(()=>{state.rebirths=1;state.rebirthLaws={war:0,time:0,hunt:0};state.mapId='meadow';const e=makeEnemy(false),rp=rebirthProfile(),abyss=MAPS.find(m=>m.id==='abyss');return JSON.stringify({gold:e.gold/e.title.gold,cp:abyss.cp,damage:rp.damage,hp:rp.hp,def:rp.def,pet:rp.petPower,goldRebirth:rp.gold,world:worldCombatScale('meadow')})})()`));
 assert(Math.abs(result.gold-3.2)<1e-9);
 assert(result.cp>=8000&&result.cp<=10000);
 assert.deepStrictEqual({damage:result.damage,hp:result.hp,def:result.def,pet:result.pet,gold:result.goldRebirth},{damage:1.1,hp:1.06,def:1.06,pet:1.1,gold:1.08});
 assert.deepStrictEqual({hp:result.world.hp,atk:result.world.atk,def:result.world.def,reward:result.world.reward},{hp:1.12,atk:1.08,def:1.06,reward:1.12});
});

test('all six species expose unique Tier 3 and Tier 6 routes with implemented mechanics',()=>{
 const context=createContext();
 const routes=JSON.parse(evaluate(context,`JSON.stringify(Object.entries(PET_EVOLUTION_ROUTES).map(([group,r])=>({group,three:Object.values(r.three).map(x=>x.name),six:Object.values(r.six).map(x=>x.name)})))`));
 assert.strictEqual(routes.length,6);
 assert.strictEqual(new Set(routes.flatMap(x=>[...x.three,...x.six])).size,24);
 const mechanics=read('core-05.js');
 for(const species of ['灰尾幼狼','裂风幼狮','树灵幼芽','霜鳍幼兽','王魂侍从','星核幼龙'])assert(mechanics.includes(species));
});

test('Soul and visible fusion-investment totals are absent from the player UI',()=>{
 const rendered=[read('core-13.js'),read('core-15.js'),read('alpha-039-systems.js')].join('\n');
 assert(!rendered.includes('live-soul'));
 assert(!rendered.includes('血脉总量'));
 assert(!rendered.includes('fusionInvestedXp'));
});

console.log('\nAlpha 0.39 regression suite passed.');

/* Alpha 0.35 - single humble start + profession-specific equipment scoring */
(()=>{
 'use strict';
 if(typeof STYLES==='undefined'||typeof SKILLS==='undefined')return;

 // ---- One fixed starting identity ----
 STYLES.farmer={
  name:'农民',icon:'🌾',rarity:0,starter:true,archetype:'melee',
  growth:{str:1.00,int:.86,dex:.92,will:1.02,luck:1.02},
  skills:['farmer_swing'],
  desc:'最普通的起点。没有职业优势，真正的职业需要从Boss身上获得。'
 };
 SKILLS.farmer_swing={
  name:'挥锄',classId:'farmer',type:'active',cat:'attack',baseChance:.30,cooldown:1,
  kind:'damage',mult:1.45,desc:'朴素的基础攻击技能。Lv.10后同样可以永久录入人物档案。'
 };
 ['melee','ranged','magic'].forEach(id=>{if(STYLES[id])STYLES[id].starter=false});
 if(Array.isArray(STARTER_RACES))STARTER_RACES.splice(0,STARTER_RACES.length,'human');
 if(Array.isArray(STARTER_CLASSES))STARTER_CLASSES.splice(0,STARTER_CLASSES.length,'farmer');

 // ---- Profession-specific equipment demand ----
 const BASE={atk:.55,crit:.45,str:.45,dex:.45,int:.45,will:.45,luck:.35,hp:.45,mp:.25,def:.45};
 const P=(prefs,weapons,weights)=>({prefs,weapons,weights:{...BASE,...weights}});
 const PROFILES={
  farmer:P(['str','hp','def'],['axe','sword'],{str:1.25,hp:1.10,def:1.05,luck:.65,atk:.95,crit:.45,int:.12,mp:.10}),
  melee:P(['str','atk','crit'],['sword','axe'],{str:1.48,atk:1.38,crit:1.22,def:.75,hp:.72,dex:.66,int:.08,mp:.08}),
  ranged:P(['dex','crit','atk'],['bow','crossbow'],{dex:1.48,crit:1.55,atk:1.25,luck:.78,str:.28,hp:.55,def:.48,int:.08,mp:.08}),
  magic:P(['int','mp','will'],['staff','tome'],{int:1.55,mp:1.32,will:1.12,atk:1.18,luck:.62,crit:.52,hp:.52,str:.06,dex:.15}),
  guardian:P(['def','hp','will'],['sword','axe'],{def:1.62,hp:1.50,will:1.30,str:.86,atk:.70,crit:.28,dex:.22,int:.18,mp:.16}),
  warlock:P(['int','hp','will'],['tome','staff'],{int:1.42,hp:1.30,will:1.20,mp:1.05,atk:1.02,crit:.58,luck:.48,str:.08,dex:.18}),
  hunter:P(['crit','dex','atk'],['bow','crossbow'],{crit:1.68,dex:1.52,atk:1.28,luck:.86,hp:.46,def:.38,str:.20,int:.05,mp:.06}),
  paladin:P(['will','hp','def'],['sword'],{will:1.52,hp:1.42,def:1.36,str:1.02,atk:.88,int:.65,mp:.48,crit:.30,dex:.16}),
  assassin:P(['crit','dex','atk'],['sword'],{crit:1.78,dex:1.62,atk:1.34,luck:.82,str:.82,hp:.32,def:.26,int:.05,mp:.05}),
  elementalist:P(['int','mp','atk'],['staff','tome'],{int:1.72,mp:1.42,atk:1.30,will:.92,crit:.62,luck:.60,hp:.42,str:.04,dex:.12}),
  swordsaint:P(['str','crit','atk'],['sword'],{str:1.66,crit:1.55,atk:1.48,dex:1.02,will:.58,hp:.48,def:.42,int:.03,mp:.03}),
  chronomancer:P(['int','will','mp'],['tome','staff'],{int:1.58,will:1.42,mp:1.34,luck:.88,atk:.96,crit:.58,hp:.58,str:.04,dex:.30}),
  starwalker:P(['crit','dex','luck'],['bow','crossbow'],{crit:1.82,dex:1.72,luck:1.34,atk:1.38,will:.54,hp:.40,def:.30,str:.14,int:.22,mp:.12}),
  nightking:P(['str','hp','crit'],['sword','axe'],{str:1.58,hp:1.42,crit:1.34,will:1.18,atk:1.32,def:.92,int:.60,dex:.50,mp:.24})
 };
 window.CLASS_GEAR_PROFILES=PROFILES;
 function profile(style=state?.style){return PROFILES[style]||PROFILES[classArchetype(style)]||PROFILES.farmer}
 function validStat(x){return typeof GEAR_STAT_NAMES!=='undefined'&&Object.prototype.hasOwnProperty.call(GEAR_STAT_NAMES,x)}

 defaultGearScorePrefs=function(style=state.style){
  const p=profile(style).prefs;return{primary:p[0],secondary:p[1],tertiary:p[2]};
 };
 ensureGearScorePrefs=function(){
  state.gearScorePrefsByClass=state.gearScorePrefsByClass||{};
  const style=state.style||'farmer',defaults=defaultGearScorePrefs(style),saved=state.gearScorePrefsByClass[style]||defaults;
  const out={primary:validStat(saved.primary)?saved.primary:defaults.primary,secondary:validStat(saved.secondary)?saved.secondary:defaults.secondary,tertiary:validStat(saved.tertiary)?saved.tertiary:defaults.tertiary};
  const seen=new Set();['primary','secondary','tertiary'].forEach(k=>{if(out[k]&&seen.has(out[k]))out[k]=null;else if(out[k])seen.add(out[k])});
  state.gearScorePrefsByClass[style]=out;state.gearScorePrefs=out;return out;
 };
 setGearScorePref=function(rank,value){
  const p=ensureGearScorePrefs(),v=value||null;Object.keys(p).forEach(k=>{if(k!==rank&&p[k]===v)p[k]=null});p[rank]=v;
  state.gearScorePrefsByClass[state.style]={...p};state.gearScorePrefs=p;save();render();
 };
 resetGearScorePrefs=function(){
  const d=defaultGearScorePrefs(state.style);state.gearScorePrefsByClass=state.gearScorePrefsByClass||{};state.gearScorePrefsByClass[state.style]={...d};state.gearScorePrefs={...d};save();render();
 };
 gearScoreWeights=function(){
  const w={...profile().weights},p=ensureGearScorePrefs();
  Object.entries(GEAR_PREF_BONUS||{primary:.55,secondary:.30,tertiary:.15}).forEach(([rank,bonus])=>{const stat=p[rank];if(stat)w[stat]=(w[stat]??.2)+bonus});
  return w;
 };
 weaponScoreFactor=function(it){
  if(it?.slot!=='weapon'||!it.weaponType)return 1;
  const pr=profile(),wt=WEAPON_TYPES[it.weaponType];if(!wt)return 1;
  if(pr.weapons.includes(it.weaponType))return 1.16;
  if(wt.styles?.includes(classArchetype()))return .90;
  return .56;
 };

 // Preserve a separate preference set whenever the profession changes.
 const oldSwitchClass=typeof switchClass==='function'?switchClass:null;
 if(oldSwitchClass){
  switchClass=function(id){
   if(state?.style){state.gearScorePrefsByClass=state.gearScorePrefsByClass||{};state.gearScorePrefsByClass[state.style]={...ensureGearScorePrefs()};}
   if(STYLES[id]){const d=state.gearScorePrefsByClass?.[id]||defaultGearScorePrefs(id);state.gearScorePrefs={...d};}
   return oldSwitchClass(id);
  };
 }

 // New games have no identity choice: Human + Farmer only.
 renderStart=function(){
  const app=document.getElementById('app');if(!app)return;
  const r=RACES.human,c=STYLES.farmer,sk=SKILLS.farmer_swing;
  app.innerHTML=`<div class="start"><h1>无尽战域：核心 Alpha 0.35</h1><p class="subtitle">从普通人开始，击败首个Boss选择正式职业，再逐步收集身份与构筑。</p>
   <label>角色名称 <input id="hero-name" value="旅者" style="margin-left:8px;background:#12100c;color:#fff;border:1px solid #51442f;padding:7px"></label>
   <div class="grid2" style="margin-top:10px"><div class="choice selected"><h3>${r.icon}${r.name} · ${identityRarityLabel(r)}</h3><div class="compact-meta">唯一初始种族｜特性【${r.traitName}】${r.traitDesc}</div></div>
   <div class="choice selected"><h3>${c.icon}${c.name} · ${identityRarityLabel(c)}</h3><div class="compact-meta">唯一初始职业｜${c.desc}</div><div class="compact-meta">唯一技能：【${sk.name}】｜${sk.desc}</div></div></div>
   ${helpBlock('开局规则','固定以人类·农民开局。首次击败月背巨狼后获得灰尾幼狼，并从战士、游侠、法师中选择第一个正式职业；其他种族和职业继续由Boss身份掉落永久解锁。职业技能练到Lv.10后可以永久传承；种族特性不能传承。')}
   <div class="controls" style="margin-top:10px"><button onclick="startGame()">开始无尽战斗</button></div></div>`;
 };
 startGame=function(){
  state=fresh();state.started=true;state.race='human';state.style='farmer';state.unlockedRaces=['human'];state.unlockedClasses=['farmer'];
  const nameEl=document.getElementById('hero-name');state.name=nameEl?.value?.trim()||'旅者';
  state.gearScorePrefsByClass={farmer:defaultGearScorePrefs('farmer')};state.gearScorePrefs={...state.gearScorePrefsByClass.farmer};
  const starter=makeItem(1,'sword',0,false);starter.name='旧铁锄';starter.locked=true;starter.weaponType='sword';state.equipment.weapon=starter;
  syncSkills();state.activeSkillSlots=['farmer_swing'];state.passiveSkillSlots=[];syncSkills();prepareNewBattle();
  log('你以普通人类·农民的身份踏入无尽战域。除【挥锄】外，其他种族、职业与技能都要靠Boss掉落获得。','important','important');
  save();render();
 };

 // Existing saves are not destructively stripped of identities already unlocked in previous alpha builds.
 // They do gain Farmer as a valid ordinary class only when it is actually unlocked or on a fresh start.
 try{if(state?.started)ensureGearScorePrefs()}catch(_){}
})();

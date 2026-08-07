/* Alpha 0.34 v14 - perfect-roll mythics, super-concentrated affixes, unique mythic powers and mutant X traits. */
(()=>{
 'use strict';
 if(typeof state==='undefined'||typeof makeItem!=='function'||typeof createPet!=='function')return;

 const SUPER_CONCENTRATION_CHANCE=.06;
 const MYTHIC_POWER_DEFS={
  weapon_wargod:{slot:'weapon',name:'战神之锋',desc:'最终攻击+18%。',effects:{atkPct:.18},score:1.20},
  weapon_starbreaker:{slot:'weapon',name:'破星者',desc:'攻击+8%，对Boss伤害+25%。',effects:{atkPct:.08,bossDamage:.25},score:1.22},
  weapon_echo:{slot:'weapon',name:'战技回响',desc:'攻击+8%，技能触发率+8个百分点。',effects:{atkPct:.08,skillChance:.08},score:1.20},
  head_oracle:{slot:'head',name:'天启之眼',desc:'原始暴击+10，技能触发率+5个百分点。',effects:{crit:10,skillChance:.05},score:1.19},
  head_arcane:{slot:'head',name:'奥术王冠',desc:'最大法力+25%，技能触发率+6个百分点。',effects:{mpPct:.25,skillChance:.06},score:1.19},
  head_warcrown:{slot:'head',name:'不屈战冠',desc:'最大生命+15%，防御+12%。',effects:{hpPct:.15,defPct:.12},score:1.19},
  armor_titan:{slot:'armor',name:'泰坦之躯',desc:'最大生命+25%，防御+8%。',effects:{hpPct:.25,defPct:.08},score:1.21},
  armor_fortress:{slot:'armor',name:'永固壁垒',desc:'防御+22%，最大生命+10%。',effects:{defPct:.22,hpPct:.10},score:1.21},
  armor_bloodshell:{slot:'armor',name:'血王之铠',desc:'最大生命+14%，全域吸血+8%。',effects:{hpPct:.14,lifesteal:.08},score:1.22},
  boots_starstep:{slot:'boots',name:'逐星',desc:'速度+22%，原始暴击+5。',effects:{speedPct:.22,crit:5},score:1.18},
  boots_predator:{slot:'boots',name:'猎影',desc:'攻击+10%，原始暴击+8。',effects:{atkPct:.10,crit:8},score:1.19},
  boots_windveil:{slot:'boots',name:'风界',desc:'速度+15%，技能触发率+5个百分点。',effects:{speedPct:.15,skillChance:.05},score:1.18},
  ring_redmoon:{slot:'ring',name:'红月',desc:'原始暴击+12，暴击伤害+35%。',effects:{crit:12,critDmg:.35},score:1.23},
  ring_sovereign:{slot:'ring',name:'统御',desc:'攻击+12%，技能触发率+5个百分点。',effects:{atkPct:.12,skillChance:.05},score:1.20},
  ring_hunt:{slot:'ring',name:'猎王印',desc:'对Boss伤害+22%，原始暴击+6。',effects:{bossDamage:.22,crit:6},score:1.21},
  amulet_eternity:{slot:'amulet',name:'永恒链',desc:'全技能冷却-1，技能触发率+4个百分点。',effects:{cooldown:1,skillChance:.04},score:1.23},
  amulet_fate:{slot:'amulet',name:'命运链',desc:'暴击转化效率+10%，技能触发率+6个百分点。',effects:{critEfficiency:.10,skillChance:.06},score:1.22},
  amulet_bloodking:{slot:'amulet',name:'血王链',desc:'全域吸血+10%，最大生命+12%。',effects:{lifesteal:.10,hpPct:.12},score:1.22}
 };
 window.MYTHIC_POWER_DEFS=MYTHIC_POWER_DEFS;

 const MUTATION_TRAITS={
  frenzy:{name:'狂暴异变',desc:'宠物造成的全部伤害+30%。'},
  colossus:{name:'巨躯异变',desc:'最大生命+35%，防御+15%。'},
  overdrive:{name:'超能异变',desc:'攻击与魔力+25%。'},
  regen:{name:'再生异变',desc:'每次行动后额外恢复4%最大生命。'},
  bossbane:{name:'猎王异变',desc:'对区域Boss造成的伤害+40%。'},
  carapace:{name:'硬壳异变',desc:'自身受到的伤害降低18%。'},
  symbiosis:{name:'共生护膜',desc:'存活出战时，玩家受到的直接伤害降低10%。'},
  resonance:{name:'战意共鸣',desc:'存活出战时，玩家攻击+12%。'}
 };
 window.MUTATION_TRAITS=MUTATION_TRAITS;

 function randomOf(arr){return arr[Math.floor(Math.random()*arr.length)]}
 function mythicPowerDef(it){
  const id=typeof it?.mythicPower==='string'?it.mythicPower:it?.mythicPower?.id;
  return id?MYTHIC_POWER_DEFS[id]||null:null;
 }
 function ensureMythicPower(it){
  if(!it||it.rarity!==5)return null;
  let def=mythicPowerDef(it);if(def)return def;
  const ids=Object.keys(MYTHIC_POWER_DEFS).filter(id=>MYTHIC_POWER_DEFS[id].slot===it.slot);
  const id=randomOf(ids);it.mythicPower=id;return MYTHIC_POWER_DEFS[id];
 }
 function ensureMutationTrait(p){
  if(!p?.mutant)return null;
  if(!p.mutationTrait||!MUTATION_TRAITS[p.mutationTrait])p.mutationTrait=randomOf(Object.keys(MUTATION_TRAITS));
  return MUTATION_TRAITS[p.mutationTrait];
 }
 function affixDef(stat){return (AFFIXES||[]).find(a=>a.stat===stat)||null}
 function maxAffixValue(a,tier,rarity=5){
  const q=QUALITY_STAT_MULT[rarity]||1,base=a.max;
  if(a.curve==='crit')return Math.max(1,Math.round(base*(1+.15*(tier-1))*Math.pow(q,.55)));
  return Math.max(1,Math.round(base*gearStatTierPower(tier)*q));
 }
 function rebuildMythicAffixes(it,concentrate=false){
  if(!it||it.rarity!==5)return it;
  const tier=inferItemTier(it),oldAff=Array.isArray(it.affixes)?it.affixes:[],baseStats={...(it.stats||{})};
  oldAff.forEach(a=>{if(a?.stat)baseStats[a.stat]=(baseStats[a.stat]||0)-Number(a.value||0)});
  Object.keys(baseStats).forEach(k=>{if(Math.abs(baseStats[k])<.0001||baseStats[k]<0)delete baseStats[k]});
  const count=Math.max(1,oldAff.length||1+(RARITIES[5]?.aff||5));
  let defs=[];
  if(concentrate){const chosen=randomOf(AFFIXES);defs=Array.from({length:count},()=>chosen);it.superConcentrated=true;}
  else{
   defs=oldAff.map(a=>affixDef(a.stat)).filter(Boolean);
   while(defs.length<count)defs.push(randomOf(AFFIXES));
  }
  it.affixes=defs.map(a=>({name:a.name,stat:a.stat,value:maxAffixValue(a,tier,5)}));
  it.stats=baseStats;
  it.affixes.forEach(a=>it.stats[a.stat]=(it.stats[a.stat]||0)+a.value);
  it.perfectRoll=true;it.qualityCurveVersion=Math.max(8,Number(it.qualityCurveVersion||0));
  return it;
 }

 // Every red affix is a max roll for its tier. The combination remains random.
 const oldRollAffixValue=rollAffixValue;
 rollAffixValue=function(a,tier,rarity){return Number(rarity)===5?maxAffixValue(a,tier,5):oldRollAffixValue(a,tier,rarity)};
 const oldMakeItem=makeItem;
 makeItem=function(...args){
  const it=oldMakeItem(...args);if(it?.rarity===5){
   rebuildMythicAffixes(it,Math.random()<SUPER_CONCENTRATION_CHANCE);
   ensureMythicPower(it);
  }return it;
 };

 // Mythic powers add real build strength regardless of profession.
 function mythicGearTotals(){
  const out={atkPct:0,hpPct:0,mpPct:0,defPct:0,speedPct:0,crit:0,critDmg:0,skillChance:0,bossDamage:0,lifesteal:0,cooldown:0,critEfficiency:0};
  Object.values(state.equipment||{}).forEach(it=>{const def=mythicPowerDef(it);if(!def)return;Object.entries(def.effects||{}).forEach(([k,v])=>out[k]=(out[k]||0)+Number(v||0))});
  return out;
 }
 window.mythicGearTotals=mythicGearTotals;
 const oldAmuletPowers=amuletPowers;
 amuletPowers=function(){
  const p=oldAmuletPowers(),m=mythicGearTotals();
  p.cooldown=(p.cooldown||0)+(m.cooldown||0);p.bossDamage=(p.bossDamage||0)+(m.bossDamage||0);p.lifesteal=(p.lifesteal||0)+(m.lifesteal||0);
  p.critEfficiency=(p.critEfficiency||0)+(m.critEfficiency||0);p.skillChance=(p.skillChance||0)+(m.skillChance||0);return p;
 };
 const oldStats=stats;
 stats=function(){
  const s=oldStats(),m=mythicGearTotals(),p=typeof activePet==='function'?activePet():null,t=p&&p.mutant?ensureMutationTrait(p):null;
  if(m.hpPct)s.maxHp=Math.round(s.maxHp*(1+m.hpPct));if(m.mpPct)s.maxMp=Math.round(s.maxMp*(1+m.mpPct));
  if(m.atkPct)s.atk=Math.round(s.atk*(1+m.atkPct));if(m.defPct)s.def=Math.round(s.def*(1+m.defPct));if(m.speedPct)s.speed=Math.round(s.speed*(1+m.speedPct));
  if(m.crit){s.rawCrit+=m.crit;s.crit=applyAmuletCritEfficiency(effectiveCritChance(s.rawCrit));}if(m.critDmg)s.critMult+=m.critDmg;
  if(t&&p?.mutationTrait==='resonance'&&petAlive(p))s.atk=Math.round(s.atk*1.12);
  return s;
 };

 // Mythic power has its own universal score component; profession fit remains secondary.
 const oldGearScoreBreakdown=gearScoreBreakdown;
 gearScoreBreakdown=function(it){
  const b=oldGearScoreBreakdown(it),def=mythicPowerDef(it);if(def){b.mythicPower=def;b.mythicPowerMult=def.score;b.score=Math.max(1,Math.round(b.score*def.score));}return b;
 };
 const oldGearScoreDetail=gearScoreDetail;
 gearScoreDetail=function(it){
  let t=oldGearScoreDetail(it),def=mythicPowerDef(it);if(def)t+=`｜神话特性【${def.name}】${def.desc}｜红装词条：满值`;
  if(it?.superConcentrated)t+='｜超级品：词条高度集中';return t;
 };
 const oldItemText=itemText;
 itemText=function(it){
  let t=oldItemText(it),def=mythicPowerDef(it);if(def)t+=` / <span class="r5">神话特性【${def.name}】：${def.desc}</span>`;
  if(it?.superConcentrated)t+=' / <span class="r5">超级品·同源词条集中</span>';return t;
 };
 if(typeof compactItemText==='function'){
  const oldCompactItemText=compactItemText;
  compactItemText=function(it){const def=mythicPowerDef(it);return oldCompactItemText(it)+(def?`｜<span class="r5">【${def.name}】</span>`:'')+(it?.superConcentrated?'｜<span class="r5">超级品</span>':'')};
 }
 const oldReceiveItem=receiveItem;
 receiveItem=function(it){
  if(it?.rarity===5){const def=ensureMythicPower(it);log(`【神话装备】${it.name}降临：全部词条满值${it.superConcentrated?' · 超级品词条集中':''} · 特性【${def.name}】${def.desc}`,'important','important');}
  return oldReceiveItem(it);
 };

 // ---- Mutant X: one persistent extra mutation trait on top of the existing X multiplier. ----
 const oldCreatePet=createPet;
 createPet=function(...args){const p=oldCreatePet(...args);if(p?.mutant)ensureMutationTrait(p);return p};
 const oldPetStats=petStats;
 petStats=function(p){
  const s=oldPetStats(p);if(!p?.mutant)return s;ensureMutationTrait(p);
  if(p.mutationTrait==='colossus'){s.maxHp=Math.round(s.maxHp*1.35);s.def=Math.round(s.def*1.15)}
  else if(p.mutationTrait==='overdrive'){s.atk=Math.round(s.atk*1.25);s.magic=Math.round(s.magic*1.25)}
  return s;
 };
 const oldPetSpeciesDamageMult=petSpeciesDamageMult;
 petSpeciesDamageMult=function(p,e){let m=oldPetSpeciesDamageMult(p,e);if(!p?.mutant)return m;ensureMutationTrait(p);if(p.mutationTrait==='frenzy')m*=1.30;if(p.mutationTrait==='bossbane'&&e?.boss)m*=1.40;return m};
 const oldPetDamageTakenMult=petDamageTakenMult;
 petDamageTakenMult=function(p){let m=oldPetDamageTakenMult(p);if(p?.mutant){ensureMutationTrait(p);if(p.mutationTrait==='carapace')m*=.82}return m};
 const oldPlayerDamageTakenPetMult=playerDamageTakenPetMult;
 playerDamageTakenPetMult=function(p){let m=oldPlayerDamageTakenPetMult(p);if(p?.mutant&&petAlive(p)){ensureMutationTrait(p);if(p.mutationTrait==='symbiosis')m*=.90}return m};
 const oldPetSpeciesAfterAction=petSpeciesAfterAction;
 petSpeciesAfterAction=function(p){oldPetSpeciesAfterAction(p);if(!p?.mutant||!petAlive(p))return;ensureMutationTrait(p);if(p.mutationTrait==='regen'){const ps=petStats(p),h=Math.max(1,Math.round(ps.maxHp*.04));p.hp=Math.min(ps.maxHp,p.hp+h)}};
 const oldPetScaledTraitText=petScaledTraitText;
 petScaledTraitText=function(p){const base=oldPetScaledTraitText(p);if(!p?.mutant)return base;const t=ensureMutationTrait(p);return `${base}<br><span class="mutant-x"><b>变异特性【${t.name}】</b>：${t.desc}</span>`};
 if(typeof petCombatPower==='function'){
  const oldPetCombatPower=petCombatPower;
  petCombatPower=function(p){let v=oldPetCombatPower(p);if(!p?.mutant)return v;ensureMutationTrait(p);const f={frenzy:1.22,regen:1.10,bossbane:1.10,carapace:1.12,symbiosis:1.08,resonance:1.08}[p.mutationTrait]||1;return Math.round(v*f)};
 }
 const oldReceivePet=receivePet;
 receivePet=function(p){if(p?.mutant){const t=ensureMutationTrait(p);log(`【变异X】${p.name}发生独特异变：特性【${t.name}】${t.desc}`,'important','important');}return oldReceivePet(p)};

 // Upgrade legacy red gear and legacy mutant pets without deleting their existing combinations/progress.
 let migrated=false;
 try{
  const allItems=[...(state.inventory||[]),...Object.values(state.equipment||{}).filter(Boolean)];
  allItems.forEach(it=>{if(it?.rarity===5){rebuildMythicAffixes(it,false);ensureMythicPower(it);migrated=true}});
  (state.pets||[]).forEach(p=>{if(p?.mutant&&!p.mutationTrait){ensureMutationTrait(p);migrated=true}});
  if(migrated&&typeof save==='function')save();
 }catch(err){console.warn('v14 jackpot migration skipped',err)}
})();

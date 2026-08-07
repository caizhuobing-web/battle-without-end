function amuletArcaneValue(id,rarity){
 const r=clamp(Number(rarity)||0,0,5);
 if(id==='chrono')return 1;
 if(id==='huntclock')return 1;
 if(id==='bloodpact')return [0,0,.04,.055,.075,.10][r]||.04;
 if(id==='overcrit')return [0,0,0,.06,.10,.15][r]||.06;
 if(id==='resonance')return [0,0,.02,.03,.04,.05][r]||.02;
 if(id==='bloodline')return [0,0,0,.10,.16,.24][r]||.10;
 if(id==='bossmark')return [0,0,.06,.08,.11,.15][r]||.06;
 return 0;
}
function amuletArcaneText(a){
 const def=AMULET_ARCANES[a?.id];if(!def)return'未知秘仪';
 const v=Number(a.value)||0;
 if(a.id==='chrono')return `秘仪【${def.name}】：全技能冷却-1`;
 if(a.id==='huntclock')return `秘仪【${def.name}】：Boss循环普通怪需求-1`;
 if(a.id==='bloodpact')return `秘仪【${def.name}】：全域吸血${Math.round(v*100)}%`;
 if(a.id==='overcrit')return `秘仪【${def.name}】：暴击转化效率+${Math.round(v*100)}%`;
 if(a.id==='resonance')return `秘仪【${def.name}】：技能触发率+${Math.round(v*100)}个百分点`;
 if(a.id==='bloodline')return `秘仪【${def.name}】：宠物专属技能效果+${Math.round(v*100)}%`;
 if(a.id==='bossmark')return `秘仪【${def.name}】：对区域Boss伤害+${Math.round(v*100)}%`;
 return `秘仪【${def.name}】`;
}
function rollAmuletArcanes(rarity){
 const chance=[0,.05,.12,.28,.55,1][rarity]||0;
 if(Math.random()>=chance)return[];
 let count=1;
 if(rarity>=5&&Math.random()<.08)count=2;
 else if(rarity===4&&Math.random()<.02)count=2;
 const pool=Object.entries(AMULET_ARCANES).filter(([,x])=>rarity>=x.minRarity).map(([id,x])=>({id,w:x.weight}));
 const out=[];
 for(let i=0;i<count&&pool.length;i++){
  const total=pool.reduce((n,x)=>n+x.w,0);let roll=Math.random()*total,chosen=pool[0];
  for(const x of pool){roll-=x.w;if(roll<=0){chosen=x;break}}
  const pi=pool.findIndex(x=>x.id===chosen.id);if(pi>=0)pool.splice(pi,1);
  out.push({id:chosen.id,value:amuletArcaneValue(chosen.id,rarity)});
 }
 return out;
}
function equippedAmuletArcanes(){const it=state.equipment?.amulet;return it&&Array.isArray(it.arcanes)?it.arcanes:[]}
function amuletPowers(){
 const p={cooldown:0,bossNeed:0,lifesteal:0,critEfficiency:0,skillChance:0,petSpecies:0,bossDamage:0};
 for(const a of equippedAmuletArcanes()){
  const v=Number(a.value)||0;
  if(a.id==='chrono')p.cooldown+=1;else if(a.id==='huntclock')p.bossNeed+=1;else if(a.id==='bloodpact')p.lifesteal+=v;else if(a.id==='overcrit')p.critEfficiency+=v;else if(a.id==='resonance')p.skillChance+=v;else if(a.id==='bloodline')p.petSpecies+=v;else if(a.id==='bossmark')p.bossDamage+=v;
 }
 return p;
}
function amuletArcaneScoreMultiplier(it){if(it?.slot!=='amulet'||!Array.isArray(it.arcanes)||!it.arcanes.length)return 1;let m=1;for(const a of it.arcanes){const def=AMULET_ARCANES[a.id];if(def)m*=def.score||1.08}if(it.arcanes.length>=2)m*=1.06;return m}
function applyAmuletCritEfficiency(actual){const e=clamp(amuletPowers().critEfficiency+(raceTraitPowers().critEfficiency||0),0,.50);return 100-(100-actual)*(1-e)}
function healFromGlobalLifesteal(damage,label=''){const pct=amuletPowers().lifesteal+(passiveSkillTotals().lifesteal||0);if(pct<=0||damage<=0||state.hp<=0)return 0;const s=stats(),h=Math.max(1,Math.round(damage*pct*(raceTraitPowers().drain||1))),before=state.hp;state.hp=Math.min(s.maxHp,state.hp+h);const healed=Math.max(0,state.hp-before);if(healed>0&&label)log(`从${label}中汲取${healed}生命。`,'skill','defense');return healed}
function gearStatTierPower(tier){return Math.pow(1.43,Math.max(0,tier-1))}
function rollAffixValue(a,tier,rarity){const q=QUALITY_STAT_MULT[rarity]||1,base=rnd(a.min,a.max);if(a.curve==='crit')return Math.max(1,Math.round(base*(1+.15*(tier-1))*Math.pow(q,.55)));return Math.max(1,Math.round(base*gearStatTierPower(tier)*q))}
function expectedAffixValue(stat,tier,rarity){const a=AFFIXES.find(x=>x.stat===stat);if(!a)return 1;const q=QUALITY_STAT_MULT[rarity]||1,base=(a.min+a.max)/2;if(a.curve==='crit')return Math.max(.5,base*(1+.15*(tier-1))*Math.pow(q,.55));return Math.max(.5,base*gearStatTierPower(tier)*q)}
const GEAR_STAT_NAMES={atk:'攻击',crit:'暴击',str:'力量',dex:'敏捷',int:'智力',will:'意志',luck:'幸运',hp:'生命',mp:'法力',def:'防御'};
const GEAR_SCORE_DEFAULTS={melee:['crit','str','atk'],ranged:['crit','dex','atk'],magic:['int','mp','atk']};
const GEAR_STYLE_WEIGHTS={melee:{atk:1.10,crit:1.20,str:1.20,dex:.55,int:.08,will:.55,luck:.40,hp:.65,mp:.12,def:.65},ranged:{atk:1.05,crit:1.40,str:.30,dex:1.15,int:.08,will:.40,luck:.55,hp:.55,mp:.12,def:.55},magic:{atk:1.05,crit:.65,str:.08,dex:.25,int:1.25,will:.70,luck:.40,hp:.50,mp:1.00,def:.50}};
const GEAR_AFFIX_AVG={str:3,int:3,dex:3,will:3,luck:3,hp:15,mp:11,crit:3,def:3};
const GEAR_PREF_BONUS={primary:.55,secondary:.30,tertiary:.15};
function defaultGearScorePrefs(style=state.style){const d=GEAR_SCORE_DEFAULTS[STYLES[style]?.archetype||style]||['atk','hp','def'];return{primary:d[0],secondary:d[1],tertiary:d[2]}}
function ensureGearScorePrefs(){const defaults=defaultGearScorePrefs(),current=state.gearScorePrefs||{},valid=new Set(Object.keys(GEAR_STAT_NAMES)),p={primary:valid.has(current.primary)?current.primary:defaults.primary,secondary:valid.has(current.secondary)?current.secondary:defaults.secondary,tertiary:valid.has(current.tertiary)?current.tertiary:defaults.tertiary},seen=new Set();['primary','secondary','tertiary'].forEach(k=>{if(seen.has(p[k]))p[k]=null;else if(p[k])seen.add(p[k])});state.gearScorePrefs=p;return p}
function setGearScorePref(rank,value){const p=ensureGearScorePrefs(),v=value||null;Object.keys(p).forEach(k=>{if(k!==rank&&p[k]===v)p[k]=null});p[rank]=v;state.gearScorePrefs=p;save();render()}
function resetGearScorePrefs(){state.gearScorePrefs=defaultGearScorePrefs();save();render()}
function gearScoreWeights(){const w={...(GEAR_STYLE_WEIGHTS[classArchetype()]||GEAR_STYLE_WEIGHTS.melee)},p=ensureGearScorePrefs();Object.entries(GEAR_PREF_BONUS).forEach(([rank,bonus])=>{const stat=p[rank];if(stat)w[stat]=(w[stat]??.2)+bonus});return w}
function gearAffixCounts(it){const c={};if(Array.isArray(it.affixes)&&it.affixes.length){it.affixes.forEach(a=>{if(a?.stat)c[a.stat]=(c[a.stat]||0)+1})}else{Object.keys(it.stats||{}).forEach(stat=>{if(stat!=='atk'||it.slot!=='weapon')c[stat]=(c[stat]||0)+1})}return c}
function gearFocusMultiplier(it){const prefs=ensureGearScorePrefs(),counts=gearAffixCounts(it),n=Math.max(1,(it.affixes||[]).length||Object.keys(counts).length);let bonus=1;const primary=counts[prefs.primary]||0,secondary=counts[prefs.secondary]||0,tertiary=counts[prefs.tertiary]||0;if(primary>=2)bonus+=Math.min(.24,(primary-1)*.05);if(secondary>=2)bonus+=Math.min(.10,(secondary-1)*.025);if(tertiary>=2)bonus+=Math.min(.05,(tertiary-1)*.0125);const maxCount=Math.max(0,...Object.values(counts));if(maxCount===n&&n>=4)bonus+=.08;return bonus}
function weaponScoreFactor(it){if(it.slot!=='weapon'||!it.weaponType)return 1;const wt=WEAPON_TYPES[it.weaponType];if(!wt)return 1;if(!wt.styles.includes(classArchetype()))return .66;return {sword:1.05,axe:1.07,bow:1.11,crossbow:1.10,staff:1.13,tome:1.10}[it.weaponType]||1.04}
function baseItemScore(it){return Math.round((it.score||gearTargetScore(inferItemLevel(it),it.rarity||0))*(1+(it.refine||0)*.08))}
function gearScoreBreakdown(it){const base=baseItemScore(it),tier=inferItemTier(it),rarity=it.rarity||0,weights=gearScoreWeights(),refineMult=1+(it.refine||0)*.08;let neutral=0,weighted=0,parts=0;const useful=[],weak=[];const addPart=(stat,value,expected)=>{const unit=Math.max(.05,value/Math.max(.25,expected)),w=weights[stat]??.2;neutral+=unit;weighted+=unit*w;parts++;if(w>=1.15)useful.push(stat);else if(w<=.30)weak.push(stat)};if(Array.isArray(it.affixes)&&it.affixes.length){it.affixes.forEach(a=>addPart(a.stat,(a.value||0)*refineMult,expectedAffixValue(a.stat,tier,rarity)));const q=QUALITY_STAT_MULT[rarity]||1,tp=gearStatTierPower(tier);if(it.slot==='weapon'){const affAtk=it.affixes.filter(a=>a.stat==='atk').reduce((n,a)=>n+(a.value||0),0),baseAtk=Math.max(0,(it.stats?.atk||0)-affAtk);if(baseAtk>0)addPart('atk',baseAtk*refineMult,(6+10*tp)*q)}if(it.slot==='armor'){const affDef=it.affixes.filter(a=>a.stat==='def').reduce((n,a)=>n+(a.value||0),0),baseDef=Math.max(0,(it.stats?.def||0)-affDef);if(baseDef>0)addPart('def',baseDef*refineMult,(3+4.5*tp)*q)}}else{Object.entries(it.stats||{}).forEach(([stat,raw])=>{let expected=expectedAffixValue(stat,tier,rarity);if(stat==='atk'&&it.slot==='weapon')expected=(6+10*gearStatTierPower(tier))*(QUALITY_STAT_MULT[rarity]||1);addPart(stat,raw*refineMult,expected)})}const avgFit=neutral>0?weighted/neutral:.75,expectedParts=Math.max(1,parts),rollQuality=clamp(neutral/expectedParts,.80,1.22);let fit=(.64+.36*avgFit)*(.91+.09*rollQuality);fit*=weaponScoreFactor(it)*gearFocusMultiplier(it)*amuletArcaneScoreMultiplier(it);fit=clamp(fit,.45,1.95);const score=Math.max(1,Math.round(base*fit)),prefs=ensureGearScorePrefs(),hits=['primary','secondary','tertiary'].filter(k=>prefs[k]&&Object.prototype.hasOwnProperty.call(it.stats||{},prefs[k])).map(k=>prefs[k]);return{base,fit,score,useful:[...new Set(useful)],weak:[...new Set(weak)],hits}}
function gearFitLabel(it){const b=gearScoreBreakdown(it);if(b.fit>=1.16)return['核心适配','risk-safe'];if(b.fit>=1)return['高度适配','risk-safe'];if(b.fit>=.84)return['一般适配','risk-even'];return['低适配','risk-hard']}

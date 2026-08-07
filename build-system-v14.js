/* Alpha 0.34 v14 - 4 active / 5 passive, universal weapon attack, soft profession fit. */
(()=>{
 'use strict';
 if(typeof SKILLS==='undefined'||typeof state==='undefined')return;
 const ACTIVE_LIMIT=4,PASSIVE_LIMIT=5;
 window.SKILL_SLOT_LIMITS=Object.freeze({active:ACTIVE_LIMIT,passive:PASSIVE_LIMIT});

 // ---- Skill slots: collection should be visible in the build, especially passives. ----
 syncSkills=function(){
  state.skills=state.skills||{};state.skillUse=state.skillUse||{};state.skillMastered=state.skillMastered||{};
  state.activeSkillSlots=Array.isArray(state.activeSkillSlots)?state.activeSkillSlots.filter(id=>SKILLS[id]?.type==='active'&&skillUsable(id)).slice(0,ACTIVE_LIMIT):[];
  state.passiveSkillSlots=Array.isArray(state.passiveSkillSlots)?state.passiveSkillSlots.filter(id=>SKILLS[id]?.type==='passive'&&skillUsable(id)).slice(0,PASSIVE_LIMIT):[];
  for(const id of unlockedSkills()){
   if(state.skillUse[id]===undefined)state.skillUse[id]=0;
   if(skillLevel(id)>=10)state.skillMastered[id]=true;
  }
  if(!state.activeSkillSlots.length)state.activeSkillSlots=nativeActiveSkills().slice(0,ACTIVE_LIMIT);
  if(!state.passiveSkillSlots.length)state.passiveSkillSlots=nativePassiveSkills().slice(0,PASSIVE_LIMIT);
  state.skillPriority={attack:state.activeSkillSlots.filter(id=>SKILLS[id]?.cat==='attack'),defense:state.activeSkillSlots.filter(id=>SKILLS[id]?.cat==='defense')};
  state.activeSkillSlots.forEach(id=>state.skills[id]=true);
 };
 toggleActiveSkill=function(id){
  if(!SKILLS[id]||SKILLS[id].type!=='active'||!skillUsable(id))return;
  state.activeSkillSlots=state.activeSkillSlots||[];const i=state.activeSkillSlots.indexOf(id);
  if(i>=0)state.activeSkillSlots.splice(i,1);else{if(state.activeSkillSlots.length>=ACTIVE_LIMIT)return alert(`主动技能槽最多${ACTIVE_LIMIT}个，请先卸下一个。`);state.activeSkillSlots.push(id)}
  syncSkills();save();render();
 };
 togglePassiveSkill=function(id){
  if(!SKILLS[id]||SKILLS[id].type!=='passive'||!skillUsable(id))return;
  state.passiveSkillSlots=state.passiveSkillSlots||[];const i=state.passiveSkillSlots.indexOf(id);
  if(i>=0)state.passiveSkillSlots.splice(i,1);else{if(state.passiveSkillSlots.length>=PASSIVE_LIMIT)return alert(`被动技能槽最多${PASSIVE_LIMIT}个，请先卸下一个。`);state.passiveSkillSlots.push(id)}
  syncSkills();save();render();
 };
 equipNativeClassSet=function(styleId=state.style){
  if(styleId!==state.style)return;
  state.activeSkillSlots=nativeActiveSkills(styleId).slice(0,ACTIVE_LIMIT);
  state.passiveSkillSlots=nativePassiveSkills(styleId).slice(0,PASSIVE_LIMIT);
  syncSkills();save();render();
 };
 const oldRenderSkills=typeof renderSkills==='function'?renderSkills:null;
 if(oldRenderSkills){
  renderSkills=function(){
   let html=oldRenderSkills();
   html=html.replace('最多装备3个主动、2个被动。','最多装备4个主动、5个被动。');
   html=html.replace(`主动槽 ${(state.activeSkillSlots||[]).length}/3｜被动槽 ${(state.passiveSkillSlots||[]).length}/2`,`主动槽 ${(state.activeSkillSlots||[]).length}/${ACTIVE_LIMIT}｜被动槽 ${(state.passiveSkillSlots||[]).length}/${PASSIVE_LIMIT}`);
   return html;
  };
 }

 // ---- One universal Attack stat. Weapons never lose their base attack after a class switch. ----
 if(typeof WEAPON_TYPES!=='undefined'){
  if(WEAPON_TYPES.bow){WEAPON_TYPES.bow.mods={atkMult:1.08,speed:4};WEAPON_TYPES.bow.desc='攻击+8%，速度+4。';}
  if(WEAPON_TYPES.staff){WEAPON_TYPES.staff.mods={atkMult:1.10,mp:10};WEAPON_TYPES.staff.desc='攻击+10%，最大法力+10。';}
 }
 attributeImpactText=function(k){
  const a=classArchetype(),d={
   str:`每+1力量：生命+5、防御+0.32${a==='melee'?'，并高效率转化为当前职业攻击':a==='ranged'?'，小幅转化为当前职业攻击':'。'}。`,
   int:`每+1智力：法力+5${a==='magic'?'，并高效率转化为当前职业攻击':'。'}。`,
   dex:`每+1敏捷：原始暴击+0.32、平衡+0.45个百分点、速度+0.75${a==='ranged'?'，并高效率转化为当前职业攻击':a==='melee'?'，小幅转化为当前职业攻击':'。'}。`,
   will:`每+1意志：生命+3、法力+2、防御+1.35${a==='magic'?'，并小幅转化为当前职业攻击':'。'}。`,
   luck:'每+1幸运：原始暴击+0.24，并提高装备品质、Boss宠物和身份掉落相关判定。'
  };return d[k];
 };
 styleGrowthText=function(styleId=state.style){
  const c=STYLES[styleId];return `${identityGrowthText(c)}｜所有武器与装备统一提供“攻击”；职业只改变基础属性的攻击转化效率，装备攻击始终100%生效。`;
 };

 // ---- Equipment score = mostly universal item strength, softly adjusted by current profession. ----
 const UNIVERSAL={atk:1.05,crit:.95,str:.82,dex:.82,int:.82,will:.82,luck:.78,hp:.92,mp:.78,def:.92};
 function profilePrefs(style=state.style){
  const p=window.CLASS_GEAR_PROFILES?.[style]?.prefs||window.CLASS_GEAR_PROFILES?.[classArchetype(style)]?.prefs;
  return Array.isArray(p)?p:['atk','hp','def'];
 }
 function preferredWeapons(style=state.style){
  const p=window.CLASS_GEAR_PROFILES?.[style]?.weapons||window.CLASS_GEAR_PROFILES?.[classArchetype(style)]?.weapons;
  return Array.isArray(p)?p:[];
 }
 gearScoreWeights=function(){
  const w={...UNIVERSAL},defaults=profilePrefs();
  [0.30,0.20,0.12].forEach((bonus,i)=>{const stat=defaults[i];if(stat)w[stat]=(w[stat]||.75)+bonus});
  const custom=ensureGearScorePrefs();
  [['primary',.18],['secondary',.10],['tertiary',.05]].forEach(([rank,bonus])=>{const stat=custom[rank];if(stat)w[stat]=(w[stat]||.75)+bonus});
  return w;
 };
 weaponScoreFactor=function(it){
  if(it?.slot!=='weapon'||!it.weaponType)return 1;
  return preferredWeapons().includes(it.weaponType)?1.08:1.00;
 };

 syncSkills();
})();

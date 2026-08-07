/* Alpha 0.35 - core gameplay: progression milestone, real threat and boss hunting UX. */
(()=>{
 'use strict';
 if(typeof MAPS==='undefined'||typeof SKILLS==='undefined')return;

 // ---- New Moon Meadow: explicit starter buffer ----
 const meadow=MAPS.find(m=>m.id==='meadow');
 if(meadow)meadow.levels=[1,5];
 const originalMakeEnemy=typeof makeEnemy==='function'?makeEnemy:null;
 if(originalMakeEnemy){
  makeEnemy=function(forceBoss=false){
   const e=originalMakeEnemy(forceBoss);
   if(!e||e.mapId!=='meadow')return e;
   if(e.boss){
    // Keep the first boss as a real progression check; only soften its burst slightly.
    e.atk=Math.max(1,Math.round(e.atk*.90));
    e.def=Math.max(0,Math.round(e.def*.95));
    e.cp=Math.max(1,Math.round(e.cp*.94));
   }else{
    e.maxHp=Math.max(1,Math.round(e.maxHp*.85));
    e.hp=e.maxHp;
    e.atk=Math.max(1,Math.round(e.atk*.80));
    e.def=Math.max(0,Math.round(e.def*.90));
    e.cp=Math.max(1,Math.round(e.cp*.84));
   }
   return e;
  };
 }

 // ---- Short skill-training curve ----
 // Focused active training target: about 180 proficiency points to Lv.10.
 // Passive target: 720 winning battles (12 min at 1 win/sec; ~24-36 min at 2-3 sec/win).
 const FAST_ACTIVE=[0,4,10,20,34,52,75,104,138,180];
 const FAST_PASSIVE=[0,20,50,95,155,230,320,430,560,720];
 window.FAST_SKILL_TRAINING={active:[...FAST_ACTIVE],passive:[...FAST_PASSIVE]};
 skillThresholds=function(id){return SKILLS[id]?.type==='passive'?FAST_PASSIVE:FAST_ACTIVE;};

 function activeMasteryWeight(id){
  const sk=SKILLS[id]||{},cd=Math.max(0,Number(sk.cooldown||0));
  if(sk.kind==='execute'||sk.kind==='mirror'||cd>=4)return 4;
  if(sk.kind==='heal'||sk.kind==='counter'||cd>=3||(sk.baseChance||1)<=.18)return 3;
  if(cd>=2||(sk.baseChance||1)<=.24)return 2;
  return 1;
 }
 registerSkillUse=function(id){
  const sk=SKILLS[id];if(!id||sk?.type!=='active')return;
  const oldLv=skillLevel(id),mult=(rebirthProfile().skillMastery||1)*activeMasteryWeight(id);
  let gain=Math.floor(mult),fraction=mult-gain;if(Math.random()<fraction)gain++;gain=Math.max(1,gain);
  state.skillUse[id]=(state.skillUse[id]||0)+gain;
  const newLv=skillLevel(id);
  if(newLv>oldLv)log(`${sk.name}提升至Lv.${newLv}。`,'sys','system');
  if(newLv>=10&&!state.skillMastered?.[id]){
   state.skillMastered[id]=true;
   log(`【技能传承】${sk.name}达到Lv.10，已永久录入人物档案，可跨职业装备。`,'important','important');
  }
 };

 // Any old save already above the new threshold should immediately resolve as mastered.
 try{
  if(state?.started&&typeof syncSkills==='function')syncSkills();
 }catch(_){}

 // ---- Automatic danger: boss win +1, any defeat -1 ----
 renderMaps=function(){return`${helpBlock('地图与危险度说明','所有地图始终可进入。危险度全自动运行：击败区域Boss后升1级，任意战斗失败后降1级，最低T0。T0的Boss基础周期为50只普通怪，每级危险度减少5只；时流法则和猎手罗盘继续缩短，最终可降至0只并进入连续Boss战。挑战失败后完成该次Boss原完整周期的一半（向上取整）再战。每张地图只掉落一种区域宠物。')}${MAPS.map(m=>{const effective=effectiveMapCp(m),ratio=effective/Math.max(1,cp()),risk=ratio<.75?['安全','risk-safe']:ratio<1.35?['适中','risk-even']:ratio<2.5?['高危','risk-hard']:['极危','risk-hard'],bp=state.bossProgress[m.id],metric=ensureMetric(m.id),actual=metric.battles?`${(metric.wins/metric.battles*100).toFixed(1)}%`:'—',cycle=ensureBossCycle(m.id),d=dangerDropProfile(m.id),w=worldCombatScale(m.id),selected=cycle.threatTier||0,unlocked=cycle.threatUnlocked||0;return`<div class="map-card ${state.mapId===m.id?'selected':''}"><div class="map-head"><b>${m.name} · 自动T${selected}｜历史最高T${unlocked}｜${threatCapText(m.id)}</b><span class="${risk[1]}">${risk[0]} · CP ${effective}</span></div><div class="compact-meta">Lv.${m.levels[0]}—${m.levels[1]} · 装备${m.gearTier}阶 · 区域宠物：${m.pet} · 预计胜率${estimatedWin(m)}% · 区域总胜率${actual}</div><div class="compact-meta">${bossEncounterText(m.id)}${bp?` · Boss ${Math.round(bp.hp)}/${bp.maxHp}`:''} · 已击败${cycle.bossWins}次</div><div class="compact-meta"><b>Boss机制：</b>${bossTacticalHint(m.id)}</div>${miniDetail('危险度与掉落详情',`自动规则：Boss胜利T+1｜任意失败T−1｜最低T0<br>敌人：生命×${w.hp.toFixed(2)}｜攻击×${w.atk.toFixed(2)}｜防御×${w.def.toFixed(2)}｜速度×${w.speed.toFixed(2)}<br>战斗收益：经验/金币×${w.reward.toFixed(2)}｜装备×${d.gearDrop.toFixed(2)}｜区域宠物×${d.petDrop.toFixed(2)}｜神话×${d.mythic.toFixed(2)}｜变异X×${d.mutation.toFixed(2)}｜身份×${d.identity.toFixed(2)}<br>怪物：${m.monsters.join('、')}｜Boss：${m.boss}｜唯一宠物：${m.pet}`)}<div class="controls"><button ${state.mapId===m.id?'disabled':''} onclick="changeMap('${m.id}')">前往</button></div></div>`}).join('')}`};

 // ---- First-boss profession result (randomized in core-11) ----
 function renderStarterProfessionChoice(){
  document.getElementById('starter-profession-overlay')?.remove();
 }
 function refreshAlpha035Branding(){const title='无尽战域：核心 Alpha 0.39';document.title=title;const h=document.querySelector('.topbar h1,.start h1');if(h)h.textContent=title;const footer=document.querySelector('.footer');if(footer)footer.textContent='Alpha 0.39：完整培养传承、六物种专属进化、三倍金币经济、星渊与转生重平衡。'}
 const renderBeforeAlpha035=render;
 render=function(...args){const out=renderBeforeAlpha035(...args);refreshAlpha035Branding();renderStarterProfessionChoice();return out};

 // Run once after all scripts finish loading so migrated saves and the final UI agree.
 setTimeout(()=>{try{render(false)}catch(err){console.warn('Alpha 0.35 UI refresh skipped',err)}},0);
})();

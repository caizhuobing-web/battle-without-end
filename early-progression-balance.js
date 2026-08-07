/* Alpha 0.34 v12 - smoother Farmer start + short, normalized skill training */
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
})();

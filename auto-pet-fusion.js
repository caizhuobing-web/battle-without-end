/* Alpha 0.34 - auto fuse newly dropped same-species ordinary pets into the active pet. */
(()=>{
 'use strict';
 if(typeof receivePet!=='function'||typeof renderPets!=='function')return;
 const originalReceivePet=receivePet;
 const originalRenderPets=renderPets;
 let lastGoldWarn=0;

 function ensureSetting(){
  if(typeof state!=='undefined'&&state.autoFuseActivePet===undefined)state.autoFuseActivePet=false;
  return !!state?.autoFuseActivePet;
 }
 function directFusionCost(target,donor,apt){
  return Math.round(80+(target.tier||1)*55+(donor.tier||1)*25+Math.pow(1.10,Math.max(0,(target.tier||1)-1))*35+(apt?.gap||0)*45);
 }
 function sameSpeciesTarget(p){
  const target=typeof activePet==='function'?activePet():null;
  return target&&p&&target.id!==p.id&&target.name===p.name?target:null;
 }
 function tryAutoFuseDrop(p){
  if(!ensureSetting()||!p||p.mutant)return false;
  const target=sameSpeciesTarget(p);if(!target)return false;
  const apt=bestAptitudeInheritance(target,p),evo=petEvolutionValue(p);
  if(!(evo>0||apt))return false;
  const cost=directFusionCost(target,p,apt);
  if(Number(state.gold||0)<cost){
   const now=Date.now();
   if(now-lastGoldWarn>15000){
    lastGoldWarn=now;
    log(`自动融合暂未执行：${p.name}需要${cost}金币，当前金币不足；该宠物按原掉落筛选规则处理。`,'sys','system');
   }
   return false;
  }
  const beforeTier=target.tier||1,beforeGrade=petOverallGrade(target);
  state.gold-=cost;
  if(apt)migratePetAptitudes(target)[apt.stat]=apt.to;
  const upgrades=applyPetEvolutionXp(target,evo);
  const ps=petStats(target);target.hp=Math.min(ps.maxHp,Math.max(1,target.hp||ps.maxHp));
  const afterGrade=petOverallGrade(target),tierText=upgrades.length?`，升至${target.tier}阶`:'',aptText=apt?`，${PET_APT_NAMES[apt.stat]} ${apt.from}→${apt.to}`:'';
  const major=upgrades.length>0||apt?.to==='SSS'||afterGrade!==beforeGrade;
  log(`【自动融合】掉落的${p.tier||1}阶 ${PET_TYPES[p.type].name}${p.name}已融合给出战宠物：进阶经验+${evo}${aptText}${tierText}，金币-${cost}。`,major?'important':'loot',major?'important':'loot');
  try{if(typeof refreshLiveUI==='function')refreshLiveUI('state')}catch(_){}
  return true;
 }

 receivePet=function(p){
  if(tryAutoFuseDrop(p))return true;
  return originalReceivePet(p);
 };

 window.toggleAutoFuseActivePet=function(on){
  state.autoFuseActivePet=!!on;
  try{save()}catch(_){}
  const status=document.getElementById('auto-fuse-pet-status');
  if(status)status.textContent=state.autoFuseActivePet?'已开启':'已关闭';
 };

 function autoFusePanel(){
  ensureSetting();
  const p=typeof activePet==='function'?activePet():null;
  return `<div class="notice auto-fuse-pet-panel" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>自动融合给出战宠物</b> · <span id="auto-fuse-pet-status">${state.autoFuseActivePet?'已开启':'已关闭'}</span><div class="compact-meta">${p?`当前目标：${p.tier||1}阶 ${p.name}｜`:''}新掉落普通同物种宠物自动融合；不要求攻击/防御/施法/平衡类型一致。变异X永不自动消耗，融合按正常规则消耗金币。</div></div><label style="white-space:nowrap"><input type="checkbox" ${state.autoFuseActivePet?'checked':''} onchange="toggleAutoFuseActivePet(this.checked)"> 自动融合</label></div>`;
 }
 renderPets=function(){return autoFusePanel()+originalRenderPets();};
 ensureSetting();
})();

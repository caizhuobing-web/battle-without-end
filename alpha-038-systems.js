/* Alpha 0.38 — shop, build depth, pet evolution and endless abyss. */
(()=>{
 'use strict';
 if(typeof state==='undefined'||typeof render!=='function')return;

 const SHOP_REFRESH_MS=30*60*1000;
 const SHOP_SIZE=6;
 const STARTER_JOBS=['melee','ranged','magic'];
 const SKILL_RULES={
  auto:'自动判断',boss:'仅Boss',normal:'仅普通怪',targetLow:'目标生命≤40%',selfLow:'自身生命≤60%',shield:'仅目标有护盾'
 };
 const NORMAL_PET_POOLS={
  meadow:['月角幼兔','青芽史莱姆'],hill:['风羽幼鹰','岩鳞幼蜥'],forest:['荧角幼鹿','苔甲幼兽'],
  shore:['冰壳幼蟹','霜鳍幼鱼'],ruins:['王城幼魂','黑甲幼侍'],abyss:['虚空幼犬','星蚀幼核']
 };
 const NORMAL_PET_MODS={
  '月角幼兔':{atk:1.08,speed:true},'青芽史莱姆':{hp:1.12},'风羽幼鹰':{atk:1.12},'岩鳞幼蜥':{def:1.13},
  '荧角幼鹿':{magic:1.12},'苔甲幼兽':{hp:1.08,def:1.08},'冰壳幼蟹':{def:1.15},'霜鳍幼鱼':{magic:1.13},
  '王城幼魂':{magic:1.10,atk:1.06},'黑甲幼侍':{hp:1.08,def:1.10},'虚空幼犬':{atk:1.15},'星蚀幼核':{magic:1.15}
 };
 const GROUP_BRANCHES={
  meadow:{three:['月影猎手','银鬃守卫'],six:['血月猎王','苍月共生']},
  hill:{three:['烈风尖牙','金鬃壁垒'],six:['风暴狮王','群山共生']},
  forest:{three:['荆棘猎枝','古木守心'],six:['噬魂古树','生命共鸣']},
  shore:{three:['霜刃猎手','冰甲守卫'],six:['极寒霸主','潮汐共生']},
  ruins:{three:['魂刃侍从','王盾守誓'],six:['不灭猎王','王魂共鸣']},
  abyss:{three:['星渊猎形','虚界守形'],six:['终焉猎王','星核共生']}
 };
 const ABYSS_VARIANTS=[
  {id:'hunger',name:'噬法',desc:'持续吞噬法力。'},
  {id:'regen',name:'再生',desc:'每4回合恢复生命。'},
  {id:'mirror',name:'镜界',desc:'每4回合生成护盾。'},
  {id:'frenzy',name:'狂星',desc:'半血后攻击与速度大幅提高。'}
 ];

 function petGroup(name){
  const boss=MAPS.find(m=>m.pet===name);if(boss)return boss.id;
  return Object.keys(NORMAL_PET_POOLS).find(id=>NORMAL_PET_POOLS[id].includes(name))||'meadow';
 }
 function ensureAlpha038State(){
  state.version=VERSION;
  state.shop={gearBuys:0,petTraining:0,inventoryUpgrades:0,petUpgrades:0,...(state.shop||{})};
  state.shop.stock=Array.isArray(state.shop.stock)?state.shop.stock:[];
  state.shop.nextRefreshAt=Number(state.shop.nextRefreshAt||0);
  state.shop.manualRefreshes=Number(state.shop.manualRefreshes||0);
  state.skillRules={...(state.skillRules||{})};
  state.buildPresets={...(state.buildPresets||{})};
  state.classBuilds={...(state.classBuilds||{})};
  state.petCodex={...(state.petCodex||{})};
  state.abyssDepth=Math.max(1,Math.round(Number(state.abyssDepth||1)));
  state.abyssHighest=Math.max(state.abyssDepth,Math.round(Number(state.abyssHighest||1)));
  state.autoFuseTargetId=state.pets?.some(p=>p.id===state.autoFuseTargetId)?state.autoFuseTargetId:null;
  if(state.starterProfessionPending||(state.started&&state.firstBossMilestoneClaimed&&state.style==='farmer'&&!STARTER_JOBS.some(id=>state.unlockedClasses.includes(id)))){
   const id=STARTER_JOBS[rnd(0,STARTER_JOBS.length-1)];
   state.starterProfessionPending=false;state.running=true;
   if(!state.unlockedClasses.includes(id))state.unlockedClasses.push(id);
   if(state.style==='farmer')state.style=id;
   syncSkills();log(`旧版待选职业印记已随机转化为${STYLES[id].icon}${STYLES[id].name}。`,'important','important');
  }
  if(!Object.keys(state.petCodex).length){
   (state.pets||[]).forEach(p=>state.petCodex[p.name]=(state.petCodex[p.name]||0)+1);
  }
 }

 // ----- Requested economy and 30-minute equipment market -----
 function rollShopRarity(){
  const weights=[450,280,160,75,28,7],total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total;
  for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<=0)return i}return 0;
 }
 function shopItemPrice(it){
  const rarity=Number(it.rarity||0),tier=inferItemTier(it);
  return Math.max(25,Math.round(itemSellValue(it)*(2.8+rarity*.35)+tier*22+rarity*rarity*18));
 }
 function shopRefreshCost(){return Math.round(90+state.level*5+MAPS.indexOf(map())*35+(state.shop.manualRefreshes||0)*30)}
 function generateShopStock(){
  state.shop.stock=Array.from({length:SHOP_SIZE},()=>{const it=makeItem(1.1,null,rollShopRarity(),false);it.shopPrice=shopItemPrice(it);return it});
  state.shop.nextRefreshAt=Date.now()+SHOP_REFRESH_MS;state.shop.manualRefreshes=0;
 }
 function ensureShopStock(){if(!state.shop.stock.length||Date.now()>=state.shop.nextRefreshAt)generateShopStock()}
 function shopTimeLeft(){const ms=Math.max(0,state.shop.nextRefreshAt-Date.now()),m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000);return `${m}:${String(s).padStart(2,'0')}`}
 window.refreshEquipmentShop=function(){
  const cost=shopRefreshCost();if(state.gold<cost)return alert(`金币不足，需要${cost}。`);
  if(!confirm(`花费${cost}金币立即刷新全部商品？`))return;
  state.gold-=cost;state.shop.manualRefreshes++;state.shop.stock=[];
  const count=state.shop.manualRefreshes;generateShopStock();state.shop.manualRefreshes=count;
  log(`装备商店已付费刷新，金币-${cost}。所有品质均可能出现。`,'loot','loot');save();render();
 };
 window.buyShopItem=function(id){
  ensureShopStock();const index=state.shop.stock.findIndex(it=>it.id===id);if(index<0)return alert('该商品已经售出或商店已刷新。');
  const it=state.shop.stock[index],cost=Number(it.shopPrice||shopItemPrice(it));if(state.gold<cost)return alert(`金币不足，需要${cost}。`);
  state.gold-=cost;state.shop.stock.splice(index,1);const oldAuto=state.autoSell;state.autoSell=0;receiveItem(it);state.autoSell=oldAuto;
  log(`商店购入${it.name}，金币-${cost}。`,'loot','loot');save();render();
 };
 function marketPanel(){
  ensureShopStock();
  return `<div class="card shop-market"><div class="map-head"><h3>定时装备商店</h3><b>免费刷新 ${shopTimeLeft()}</b></div><div class="compact-meta">每30分钟自动刷新6件装备；可花金币立即刷新。普通至神话均可出现，神话基础出现率0.7%。</div><div class="shop-grid">${state.shop.stock.map(it=>`<div class="item ${itemVisualClass(it)}"><div><b class="${RARITIES[it.rarity].cls}">${it.name}</b> · ${inferItemTier(it)}阶<div class="compact-meta">评分 ${itemScore(it)} · ${compactItemText(it)}</div>${miniDetail('装备详情',itemText(it))}</div><button onclick="buyShopItem('${it.id}')">${it.shopPrice}金币</button></div>`).join('')||'<div class="muted">本轮商品已售罄，等待免费刷新或付费刷新。</div>'}</div><button onclick="refreshEquipmentShop()">立即刷新 · ${shopRefreshCost()}金币</button></div>`;
 }
 const renderShopBefore038=renderShop;
 renderShop=function(){return marketPanel()+`<div style="margin-top:10px">${renderShopBefore038()}</div>`};

 // ----- Alpha 0.36: skill conditions, tag synergies and three loadouts -----
 function skillTags(id){
  const sk=SKILLS[id],tags=[];if(!sk)return tags;
  if(sk.kind==='debuff'||Number(sk.ignore||0)>=.20)tags.push('破甲');
  if(sk.kind==='execute')tags.push('处决');
  if((sk.hits||1)>=2)tags.push('连击');
  if(['drain','heal'].includes(sk.kind)||sk.effects?.lifesteal||sk.effects?.healing)tags.push('续航');
  if(['reduce','counter','mirror'].includes(sk.kind)||sk.effects?.defPct||sk.effects?.hpPct)tags.push('守御');
  if(sk.effects?.crit||sk.effects?.critDmg)tags.push('暴击');
  if(sk.effects?.skillChance||sk.effects?.cooldown)tags.push('节奏');
  if(sk.effects?.bossDamage)tags.push('猎王');
  if(!tags.length)tags.push(sk.cat==='attack'?'强攻':'战术');return tags;
 }
 function buildSynergies(){
  const ids=[...(state.activeSkillSlots||[]),...(state.passiveSkillSlots||[])],tags=new Set(ids.flatMap(skillTags)),out=[];
  if(tags.has('破甲')&&tags.has('处决'))out.push({id:'execution',name:'破势处决',desc:'攻击+8%，Boss伤害+12%。',effects:{atkPct:.08,bossDamage:.12}});
  if(tags.has('连击')&&tags.has('暴击'))out.push({id:'critChain',name:'连击暴流',desc:'原始暴击+6，暴伤+15%。',effects:{crit:6,critDmg:.15}});
  if(tags.has('续航')&&tags.has('守御'))out.push({id:'sustain',name:'不息阵线',desc:'生命+12%，防御+8%，治疗+10%。',effects:{hpPct:.12,defPct:.08,healing:.10}});
  if(tags.has('节奏')&&ids.filter(id=>skillTags(id).includes('节奏')).length>=2)out.push({id:'tempo',name:'时序共鸣',desc:'技能触发率+5个百分点。',effects:{skillChance:.05}});
  if(tags.has('猎王')&&tags.has('处决'))out.push({id:'bossHunt',name:'终局狩猎',desc:'Boss伤害+18%。',effects:{bossDamage:.18}});
  return out;
 }
 window.skillTags=skillTags;window.buildSynergies=buildSynergies;
 const passiveTotalsBefore038=passiveSkillTotals;
 passiveSkillTotals=function(){
  const out=passiveTotalsBefore038();
  buildSynergies().forEach(s=>Object.entries(s.effects).forEach(([k,v])=>out[k]=(out[k]||0)+v));return out;
 };
 function skillRulePass(id){
  const rule=state.skillRules?.[id]||'auto',e=state.enemy,s=stats();
  if(rule==='boss')return !!e?.boss;if(rule==='normal')return !!e&&!e.boss;
  if(rule==='targetLow')return !!e&&e.hp/e.maxHp<=.40;if(rule==='selfLow')return state.hp/s.maxHp<=.60;
  if(rule==='shield')return Number(e?.shield||0)>0;return true;
 }
 chooseSkill=function(cat){
  const s=stats();syncSkills();const eligible=(state.activeSkillSlots||[]).filter(id=>{const sk=SKILLS[id];if(!sk||sk.type!=='active'||sk.cat!==cat||!skillUsable(id)||!skillReady(id)||!skillRulePass(id))return false;if((sk.mp||0)>state.mp)return false;if(sk.kind==='heal'&&state.hp>=s.maxHp*(sk.threshold||.55))return false;if(sk.kind==='execute'&&state.enemy&&state.enemy.hp/state.enemy.maxHp>(sk.executeThreshold||.25))return false;return true});
  if(!eligible.length)return null;return eligible.find(id=>Math.random()<skillTriggerChance(id,s))||null;
 };
 window.setSkillRule=function(id,rule){if(!SKILL_RULES[rule])return;state.skillRules[id]=rule;save();render()};
 function snapshotEquipment(){const out={};Object.entries(state.equipment||{}).forEach(([slot,it])=>out[slot]=it?.id||null);return out}
 window.saveBuildPreset=function(slot){
  const n=clamp(Number(slot)||1,1,3);state.buildPresets[n]={name:`构筑${n}`,style:state.style,race:state.race,active:[...(state.activeSkillSlots||[])],passive:[...(state.passiveSkillSlots||[])],petId:state.activePetId,equipment:snapshotEquipment()};state.classBuilds[state.style]=n;save();log(`已保存构筑${n}，并绑定至${STYLES[state.style].name}。`,'important','important');render();
 };
 let applyingBuild=false;
 function restoreEquipment(snapshot){
  const all=[...(state.inventory||[]),...Object.values(state.equipment||{}).filter(Boolean)],byId=new Map(all.map(it=>[it.id,it])),used=new Set(),next={};
  SLOTS.forEach(slot=>{const desired=byId.get(snapshot?.[slot]);const fallback=state.equipment?.[slot];const chosen=desired||fallback||null;if(chosen&&!used.has(chosen.id)){next[slot]=chosen;used.add(chosen.id)}else next[slot]=null});
  state.equipment=next;state.inventory=all.filter(it=>!used.has(it.id));
 }
 function applyBuildPreset(slot,automatic=false){
  const p=state.buildPresets?.[slot];if(!p)return automatic?false:alert('该构筑槽尚未保存。');applyingBuild=true;
  try{
   if(p.race&&state.unlockedRaces.includes(p.race))state.race=p.race;
   if(p.style&&state.unlockedClasses.includes(p.style)&&p.style!==state.style)switchClassBefore038(p.style);
   restoreEquipment(p.equipment);state.activeSkillSlots=(p.active||[]).filter(id=>SKILLS[id]?.type==='active'&&skillUsable(id)).slice(0,4);state.passiveSkillSlots=(p.passive||[]).filter(id=>SKILLS[id]?.type==='passive'&&skillUsable(id)).slice(0,5);
   if(state.pets.some(x=>x.id===p.petId))state.activePetId=p.petId;syncSkills();prepareNewBattle();save();
  }finally{applyingBuild=false}
  if(!automatic)log(`已载入构筑${slot}。`,'important','important');render();return true;
 }
 window.loadBuildPreset=applyBuildPreset;
 const switchClassBefore038=switchClass;
 switchClass=function(id){
  const result=switchClassBefore038(id);if(!applyingBuild){const slot=state.classBuilds?.[id];if(slot)applyBuildPreset(slot,true)}return result;
 };
 function buildPanel(){
  const synergies=buildSynergies();return `<div class="card" style="margin-top:10px"><h3>Alpha 0.36 · 构筑预设</h3><div class="compact-meta">预设保存职业、种族、主动/被动技能、装备和出战宠物；切换到已绑定职业时自动载入。</div><div class="grid3">${[1,2,3].map(n=>{const p=state.buildPresets[n];return `<div class="loadout-card"><b>构筑${n}</b><div class="compact-meta">${p?`${STYLES[p.style]?.name||'?'} · 主动${p.active.length}/被动${p.passive.length}`:'空槽'}</div><button onclick="saveBuildPreset(${n})">保存当前</button><button onclick="loadBuildPreset(${n})" ${p?'':'disabled'}>载入</button></div>`}).join('')}</div><h3>当前联动</h3>${synergies.length?synergies.map(x=>`<div class="notice"><b>${x.name}</b> · ${x.desc}</div>`).join(''):'<div class="muted">组合带有对应标签的技能可激活联动。</div>'}</div>`;
 }
 const renderSkillsBefore038=renderSkills;
 renderSkills=function(){
  let html=renderSkillsBefore038();
  html=html.replace(/(<div class="compact-meta">主动 · 实际释放获得熟练[^<]*<\/div>)/g,'$1');
  const rules=(state.activeSkillSlots||[]).map(id=>`<div class="item"><div><b>${SKILLS[id].name}</b><div class="compact-meta">标签：${skillTags(id).join(' / ')}</div></div><select onchange="setSkillRule('${id}',this.value)">${Object.entries(SKILL_RULES).map(([v,n])=>`<option value="${v}" ${(state.skillRules[id]||'auto')===v?'selected':''}>${n}</option>`).join('')}</select></div>`).join('');
  return html+`<div class="card" style="margin-top:10px"><h3>主动技能使用条件</h3>${rules||'<div class="muted">装备主动技能后可设置。</div>'}</div>`+buildPanel();
 };

 // ----- Alpha 0.37: ordinary hatchlings, codex and branch evolution -----
 Object.entries(NORMAL_PET_POOLS).forEach(([group,names])=>names.forEach(name=>{
  if(!PET_SPECIES[name])PET_SPECIES[name]={archetype:'野生幼体',preferred:['Attack','Defense','Magic','Balance'],focus:'按类型培养',desc:`来自${MAPS.find(m=>m.id===group)?.name||'未知区域'}的普通怪幼体。`,trait:'野性适应',traitDesc:'拥有稳定的类型成长。',skill:'野性协击',skillDesc:'依靠宠物类型技能参与自动战斗。'};
 }));
 Object.assign(PET_SPECIES_ICONS,{'月角幼兔':'🐇','青芽史莱姆':'🟢','风羽幼鹰':'🦅','岩鳞幼蜥':'🦎','荧角幼鹿':'🦌','苔甲幼兽':'🦬','冰壳幼蟹':'🦀','霜鳍幼鱼':'🐟','王城幼魂':'👻','黑甲幼侍':'🛡️','虚空幼犬':'🐕','星蚀幼核':'☄️'});
 const petStatsBefore038=petStats;
 petStats=function(p){
  const s=petStatsBefore038(p),mods=NORMAL_PET_MODS[p?.name]||{};if(mods.hp)s.maxHp=Math.round(s.maxHp*mods.hp);if(mods.atk)s.atk=Math.round(s.atk*mods.atk);if(mods.def)s.def=Math.round(s.def*mods.def);if(mods.magic)s.magic=Math.round(s.magic*mods.magic);
  if(p?.evolutionBranches?.stage3==='assault'){s.atk=Math.round(s.atk*1.18);s.magic=Math.round(s.magic*1.18)}
  if(p?.evolutionBranches?.stage3==='guardian'){s.maxHp=Math.round(s.maxHp*1.18);s.def=Math.round(s.def*1.18)}
  if(p?.evolutionBranches?.stage6==='apex'){s.atk=Math.round(s.atk*1.15);s.magic=Math.round(s.magic*1.15)}
  if(p?.evolutionBranches?.stage6==='harmony'){s.maxHp=Math.round(s.maxHp*1.10);s.atk=Math.round(s.atk*1.10);s.def=Math.round(s.def*1.10);s.magic=Math.round(s.magic*1.10)}return s;
 };
 const petDamageBefore038=petSpeciesDamageMult;
 petSpeciesDamageMult=function(p,e){let v=petDamageBefore038(p,e);if(p?.evolutionBranches?.stage6==='apex'&&e?.boss)v*=1.25;return v};
 const playerPetMultBefore038=playerDamageTakenPetMult;
 playerDamageTakenPetMult=function(p){let v=playerPetMultBefore038(p);if(p?.evolutionBranches?.stage6==='harmony'&&petAlive(p))v*=.95;return v};
 const receivePetBefore038=receivePet;
 receivePet=function(p){state.petCodex[p.name]=(state.petCodex[p.name]||0)+1;return receivePetBefore038(p)};
 function evolutionNames(p){return GROUP_BRANCHES[petGroup(p.name)]||GROUP_BRANCHES.meadow}
 function evolutionRouteText(p){const n=evolutionNames(p),b=p.evolutionBranches||{},parts=[];if(b.stage3)parts.push(n.three[b.stage3==='assault'?0:1]);if(b.stage6)parts.push(n.six[b.stage6==='apex'?0:1]);return parts.length?parts.join(' → '):'尚未选择分支'}
 const petEvolutionTextBefore038=petEvolutionText;
 petEvolutionText=function(p){return `${petEvolutionTextBefore038(p)}｜分支：${evolutionRouteText(p)}`};
 window.choosePetEvolution=function(id,stage,choice){
  const p=state.pets.find(x=>x.id===id);if(!p)return;p.evolutionBranches=p.evolutionBranches||{};
  if(stage===3&&(p.tier||1)>=3&&!p.evolutionBranches.stage3&&['assault','guardian'].includes(choice))p.evolutionBranches.stage3=choice;
  if(stage===6&&(p.tier||1)>=6&&p.evolutionBranches.stage3&&!p.evolutionBranches.stage6&&['apex','harmony'].includes(choice))p.evolutionBranches.stage6=choice;
  const ps=petStats(p);p.hp=Math.min(ps.maxHp,Math.max(1,p.hp||ps.maxHp));log(`${p.name}完成分支进化：${evolutionRouteText(p)}。`,'important','important');save();render();
 };
 function petEvolutionChoices(){
  const pending=(state.pets||[]).filter(p=>((p.tier||1)>=3&&!p.evolutionBranches?.stage3)||((p.tier||1)>=6&&p.evolutionBranches?.stage3&&!p.evolutionBranches?.stage6));
  if(!pending.length)return '';
  return `<div class="card evolution-card"><h3>分支进化待选择</h3>${pending.map(p=>{const n=evolutionNames(p),stage=!p.evolutionBranches?.stage3?3:6,opts=stage===3?n.three:n.six,values=stage===3?['assault','guardian']:['apex','harmony'];return `<div class="item"><div><b>${p.tier}阶 ${p.name}</b><div class="compact-meta">当前：${evolutionRouteText(p)}｜Tier ${stage} 分支</div></div><div class="controls"><button onclick="choosePetEvolution('${p.id}',${stage},'${values[0]}')">${opts[0]}</button><button onclick="choosePetEvolution('${p.id}',${stage},'${values[1]}')">${opts[1]}</button></div></div>`}).join('')}</div>`;
 }
 function petCodexPanel(){
  const all=[...MAPS.map(m=>m.pet),...Object.values(NORMAL_PET_POOLS).flat()],seen=Object.keys(state.petCodex).filter(k=>state.petCodex[k]>0);
  return `<div class="card"><h3>宠物图鉴 ${seen.length}/${all.length}</h3><div class="codex-grid">${all.map(name=>`<span class="${state.petCodex[name]?'seen':'unseen'}">${state.petCodex[name]?`${PET_SPECIES_ICONS[name]||'🐾'}${name} ×${state.petCodex[name]}`:'？？？'}</span>`).join('')}</div></div>`;
 }
 const renderPetsBefore038=renderPets;
 renderPets=function(){return petEvolutionChoices()+renderPetsBefore038()+petCodexPanel()};

 // ----- Alpha 0.38: endless abyss and world tiers -----
 const worldScaleBefore038=worldCombatScale;
 worldCombatScale=function(id=state.mapId){
  const w=worldScaleBefore038(id),r=Math.max(0,Number(state.rebirths||0)),hp=1+.22*r,atk=1+.14*r,def=1+.10*r;
  return{...w,hp:w.hp*hp,atk:w.atk*atk,def:w.def*def,cpMult:w.cpMult*Math.sqrt(hp*atk*Math.sqrt(def)),reward:w.reward*(1+.10*r),worldTier:r};
 };
 const dangerDropBefore038=dangerDropProfile;
 dangerDropProfile=function(id=state.mapId){
  const d=dangerDropBefore038(id);if(id!=='abyss')return d;const depth=Math.max(1,state.abyssDepth||1),n=depth-1;
  return{...d,gearDrop:d.gearDrop*(1+Math.min(1.5,n*.018)),petDrop:d.petDrop*(1+Math.min(.8,n*.012)),mythic:d.mythic*(1+Math.min(3,n*.025)),mutation:d.mutation*(1+Math.min(2,n*.018)),identity:d.identity*(1+Math.min(.8,n*.01))};
 };
 const shouldBossBefore038=shouldEncounterBoss;
 shouldEncounterBoss=function(id=state.mapId){if(id!=='abyss')return shouldBossBefore038(id);if(state.bossProgress?.abyss?.active)return shouldBossBefore038(id);return Math.max(1,state.abyssDepth||1)%5===0};
 const makeEnemyBefore038=makeEnemy;
 makeEnemy=function(forceBoss=false){
  const e=makeEnemyBefore038(forceBoss);e.gold=Number(e.gold||1)*1.40;
  if(e.mapId==='abyss'){
   const depth=Math.max(1,state.abyssDepth||1),n=depth-1,hp=1+.16*n+.012*n*n,atk=1+.10*n+.006*n*n,def=1+.06*n+.003*n*n,speed=1+Math.min(.75,n*.006);
   e.abyssDepth=depth;e.maxHp=Math.round(e.maxHp*hp);e.hp=e.maxHp;e.huntStartHp=e.maxHp;e.atk=Math.round(e.atk*atk);e.def=Math.round(e.def*def);e.speed=Math.round(e.speed*speed);e.cp=Math.round(e.cp*Math.sqrt(hp*atk*Math.sqrt(def)));e.rewardMult=Number(e.rewardMult||1)*(1+n*.05);
   if(e.boss){const cycle=Math.max(1,Math.floor(depth/5)),variant=ABYSS_VARIANTS[(cycle-1)%ABYSS_VARIANTS.length];e.abyssVariant=variant.id;e.name=`第${depth}层·${variant.name}${MAPS[5].boss}`;e.variantName=variant.name;e.variantDesc=variant.desc;}
  }return e;
 };
 const enemyAttackBefore038=enemyAttack;
 enemyAttack=function(){
  const e=state.enemy;if(e?.boss&&e.mapId==='abyss'){
   const next=(e.round||0)+1;
   if(e.abyssVariant==='regen'&&next%4===0){const h=Math.max(1,Math.round(e.maxHp*.055));e.hp=Math.min(e.maxHp,e.hp+h);log(`${e.name}发动深层再生，恢复${h}生命。`,'lose','defense')}
   if(e.abyssVariant==='mirror'&&next%4===0){e.shield=1;log(`${e.name}展开星渊镜界，下一次受到的伤害降低。`,'lose','defense')}
   if(e.abyssVariant==='frenzy'&&!e.abyssFrenzied&&e.hp/e.maxHp<=.50){e.abyssFrenzied=true;e.atk=Math.round(e.atk*1.35);e.speed=Math.round(e.speed*1.20);log(`${e.name}进入狂星状态。`,'lose','important')}
  }return enemyAttackBefore038();
 };
 const winBattleBefore038=winBattle;
 winBattle=function(){
  const defeated=state.enemy?{...state.enemy}:null,mapId=state.mapId,wasAbyss=mapId==='abyss',depth=state.abyssDepth||1,retryFiller=wasAbyss&&!state.enemy?.boss&&!!state.bossProgress?.abyss?.active;
  const result=winBattleBefore038();
  if(defeated&&!defeated.boss&&Math.random()<.025){const pool=NORMAL_PET_POOLS[mapId]||[];if(pool.length){const name=pool[rnd(0,pool.length-1)],pet=createPet(name,rollPetType(),Math.max(0,MAPS.findIndex(m=>m.id===mapId)));receivePet(pet);log(`【幼体掉落】${defeated.name}留下了${name}。`,'loot','loot')}}
  if(wasAbyss&&defeated&&!retryFiller){state.abyssDepth=depth+1;state.abyssHighest=Math.max(state.abyssHighest||1,state.abyssDepth);state.enemy=null;prepareNewBattle();if(defeated.boss)log(`【星渊突破】击败第${depth}层机制Boss，检查点推进至第${state.abyssDepth}层。`,'important','important');save()}
  return result;
 };
 const loseBattleBefore038=loseBattle;
 loseBattle=function(){
  const e=state.enemy,wasAbyss=e?.mapId==='abyss',depth=state.abyssDepth||1,isBoss=!!e?.boss,result=loseBattleBefore038();
  if(wasAbyss&&!isBoss){const checkpoint=Math.max(1,Math.floor((depth-1)/5)*5+1);if(depth!==checkpoint){state.abyssDepth=checkpoint;log(`星渊普通层失败，退回最近检查点第${checkpoint}层；最高纪录${state.abyssHighest}层保留。`,'important','important')}}return result;
 };
 const rebirthBefore038=rebirth;
 rebirth=function(){const before=state.rebirths||0,result=rebirthBefore038();if((state.rebirths||0)>before){state.abyssDepth=1;log(`世界阶级提升至W${state.rebirths}：所有区域敌人与收益同步增强，星渊从第1层重新挑战。`,'important','important');save();render()}return result};
 const renderMapsBefore038=renderMaps;
 renderMaps=function(){
  let html=renderMapsBefore038();html=html.replace('危险度只影响掉落，不改变怪物战斗属性；打不过只会不断战败。','危险度真实强化敌人与收益：击败Boss自动升一级，任意战斗失败自动降一级。');
  const d=dangerDropProfile('abyss'),nextBoss=Math.ceil((state.abyssDepth||1)/5)*5;
  return `<div class="card abyss-card"><h3>Alpha 0.38 · 真正的无尽星渊</h3><div class="stat-table"><div class="stat"><b>${state.abyssDepth}</b>当前层</div><div class="stat"><b>${state.abyssHighest}</b>最高层</div><div class="stat"><b>W${state.rebirths||0}</b>世界阶级</div><div class="stat"><b>${nextBoss}</b>下个Boss层</div></div><div class="compact-meta">每5层出现轮换机制Boss；普通层失败退回最近检查点，Boss保留三次狩猎机会。深度持续提高装备、神话和变异X概率，不新增货币。当前星渊：装备×${d.gearDrop.toFixed(2)} · 神话×${d.mythic.toFixed(2)} · 变异X×${d.mutation.toFixed(2)}</div></div>`+html;
 };

 // Keep all visible version labels aligned with the final integrated build.
 const renderBefore038=render;
 render=function(...args){const result=renderBefore038(...args),heading=document.querySelector('.topbar h1,.start h1'),footer=document.querySelector('.footer');document.title='无尽战域：核心 Alpha 0.38';if(heading)heading.textContent='无尽战域：核心 Alpha 0.38';if(footer)footer.textContent='Alpha 0.38：定时装备商店、技能标签联动、三套构筑预设、宠物分支进化与真正的无尽星渊。';return result};

 // New games and legacy saves receive the 0.38 state shape after all legacy patches load.
 const startGameBefore038=startGame;
 startGame=function(){const result=startGameBefore038();ensureAlpha038State();save();render(false);return result};
 ensureAlpha038State();
 try{save();render(false)}catch(err){console.warn('Alpha 0.38 final initialization skipped',err)}
})();

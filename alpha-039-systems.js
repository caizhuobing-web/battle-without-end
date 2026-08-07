/* Alpha 0.39 — consolidated market, builds, pet evolution UI and endless progression. */
(()=>{
 'use strict';
 if(typeof state==='undefined'||typeof render!=='function')return;

 const SHOP_REFRESH_MS=30*60*1000;
 const SHOP_SIZE=6;
 const STARTER_JOBS=['melee','ranged','magic'];
 const SKILL_RULES={
  auto:'自动判断',boss:'仅Boss',normal:'仅普通怪',targetLow:'目标生命≤40%',selfLow:'自身生命≤60%',shield:'仅目标有护盾'
 };
 const BOSS_PET_BY_MAP=Object.fromEntries(MAPS.map(m=>[m.id,m.pet]));
 function ensureAlpha039State(){
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
  state.autoFuseActivePet=!!state.autoFuseActivePet;
  delete state.soul;
  (state.pets||[]).forEach(p=>{p.baseSpecies=petBaseSpecies(p);migratePetFusionInvestment(p)});
  if(state.starterProfessionPending||(state.started&&state.firstBossMilestoneClaimed&&state.style==='farmer'&&!STARTER_JOBS.some(id=>state.unlockedClasses.includes(id)))){
   const id=STARTER_JOBS[rnd(0,STARTER_JOBS.length-1)];
   state.starterProfessionPending=false;state.running=true;
   if(!state.unlockedClasses.includes(id))state.unlockedClasses.push(id);
   if(state.style==='farmer')state.style=id;
   syncSkills();log(`旧版待选职业印记已随机转化为${STYLES[id].icon}${STYLES[id].name}。`,'important','important');
  }
  if(!Object.keys(state.petCodex).length){
   (state.pets||[]).forEach(p=>{const species=petBaseSpecies(p);state.petCodex[species]=(state.petCodex[species]||0)+1});
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

 // ----- Alpha 0.39: complete lineage inheritance and species-specific evolution -----
 Object.entries(BOSS_PET_BY_MAP).forEach(([group,name])=>{
  if(!PET_SPECIES[name])PET_SPECIES[name]={archetype:'首领幼体',preferred:['Attack','Defense','Magic','Balance'],focus:'按类型培养',desc:`由${MAPS.find(m=>m.id===group)?.name||'未知区域'}的区域Boss掉落。`,trait:'首领血脉',traitDesc:'拥有稳定的类型成长。',skill:'血脉协击',skillDesc:'依靠宠物类型技能参与自动战斗。'};
 });
 const receivePetBefore038=receivePet;
 function selectedFusionTarget(){return state.pets?.find(x=>x.id===state.autoFuseTargetId)||activePet()}
 function autoFusionCost(target,donor,apt){return Math.round(80+(target.tier||1)*55+(donor.tier||1)*25+Math.pow(1.10,Math.max(0,(target.tier||1)-1))*35+(apt?.gap||0)*45)}
 function tryAutoFuseDrop(p){if(!state.autoFuseActivePet||!p||p.mutant)return false;const target=selectedFusionTarget();if(!target||target.id===p.id||!samePetSpecies(target,p))return false;const apt=bestAptitudeInheritance(target,p),cost=autoFusionCost(target,p,apt);if(state.gold<cost){log(`自动融合暂未执行：完整继承培养成果需要${cost}金币，当前金币不足。`,'sys','system');return false}const beforeTier=target.tier||1,beforeLevel=target.level||1;state.gold-=cost;if(apt)migratePetAptitudes(target)[apt.stat]=apt.to;const inherited=inheritPetEvolution(target,p),ps=petStats(target);target.hp=Math.min(ps.maxHp,Math.max(1,target.hp||ps.maxHp));log(`【自动融合】${p.name}的进阶经验+${inherited.evolutionXp}、等级经验+${inherited.levelXp}${target.tier>beforeTier?`，${beforeTier}阶→${target.tier}阶`:''}${target.level>beforeLevel?`，Lv.${beforeLevel}→Lv.${target.level}`:''}，金币-${cost}。`,'loot','loot');return true}
 receivePet=function(p){const species=petBaseSpecies(p);p.baseSpecies=species;state.petCodex[species]=(state.petCodex[species]||0)+1;if(tryAutoFuseDrop(p))return true;return receivePetBefore038(p)};
 window.toggleAutoFuseActivePet=function(on){state.autoFuseActivePet=!!on;save();render()};
 window.setAutoFuseTarget=function(id){state.autoFuseTargetId=id||null;save();render()};
 window.choosePetEvolution=function(id,stage,choice){
  const p=state.pets.find(x=>x.id===id);if(!p)return;p.evolutionBranches=p.evolutionBranches||{};
  if(stage===3&&(p.tier||1)>=3&&!p.evolutionBranches.stage3&&['assault','guardian'].includes(choice))p.evolutionBranches.stage3=choice;
  if(stage===6&&(p.tier||1)>=6&&p.evolutionBranches.stage3&&!p.evolutionBranches.stage6&&['apex','harmony'].includes(choice))p.evolutionBranches.stage6=choice;
  const ps=petStats(p);p.hp=Math.min(ps.maxHp,Math.max(1,p.hp||ps.maxHp));log(`${p.name}完成分支进化：${evolutionRouteText(p)}。`,'important','important');save();render();
 };
 function petEvolutionChoices(){
  const pending=(state.pets||[]).filter(p=>((p.tier||1)>=3&&!p.evolutionBranches?.stage3)||((p.tier||1)>=6&&p.evolutionBranches?.stage3&&!p.evolutionBranches?.stage6));
  if(!pending.length)return '';
  return `<div class="card evolution-card"><h3>分支进化待选择</h3>${pending.map(p=>{const stage=!p.evolutionBranches?.stage3?3:6,values=stage===3?['assault','guardian']:['apex','harmony'];return `<div class="item"><div><b>${p.tier}阶 ${p.name}</b><div class="compact-meta">当前：${evolutionRouteText(p)}｜Tier ${stage} 物种专属分支</div>${values.map(v=>{const d=petEvolutionChoiceDetail(p,stage,v);return `<div class="compact-meta"><b>${d.name}</b>：${d.desc}</div>`}).join('')}</div><div class="controls">${values.map(v=>{const d=petEvolutionChoiceDetail(p,stage,v);return `<button onclick="choosePetEvolution('${p.id}',${stage},'${v}')">${d.name}</button>`}).join('')}</div></div>`}).join('')}</div>`;
 }
 function petCodexPanel(){
  const all=[...new Set([...MAPS.map(m=>m.pet),...Object.values(BOSS_PET_BY_MAP)])],seen=all.filter(name=>state.petCodex[name]>0);
  return `<div class="card"><h3>宠物图鉴 ${seen.length}/${all.length}</h3><div class="codex-grid">${all.map(name=>`<span class="${state.petCodex[name]?'seen':'unseen'}">${state.petCodex[name]?`${PET_SPECIES_ICONS[name]||'🐾'}${name} ×${state.petCodex[name]}`:'？？？'}</span>`).join('')}</div></div>`;
 }
 function autoFusePanel(){const target=selectedFusionTarget();return `<div class="notice auto-fuse-pet-panel"><b>自动融合：</b>${state.autoFuseActivePet?'已开启':'已关闭'} · 仅保护变异X；同一进化谱系的普通宠物会把自身历次融合投入、当前进阶经验与等级经验全部传给目标。进化后的宠物仍可吞噬基础形态。<div class="controls"><select onchange="setAutoFuseTarget(this.value)"><option value="">当前出战宠物</option>${state.pets.map(p=>`<option value="${p.id}" ${state.autoFuseTargetId===p.id?'selected':''}>${p.tier||1}阶 Lv.${p.level||1} ${p.name}</option>`).join('')}</select><label><input type="checkbox" ${state.autoFuseActivePet?'checked':''} onchange="toggleAutoFuseActivePet(this.checked)">开启</label></div>${target?`<div class="compact-meta">当前目标：${target.tier||1}阶 Lv.${target.level||1} ${target.name}</div>`:''}</div>`}
 function petGuidePanel(){return `${helpBlock('四种宠物类型详解',Object.values(PET_TYPES).map(t=>`<b>${t.name}｜${t.role}</b><br>${t.desc}<br>优势：${t.strength}<br>短板：${t.weakness}`).join('<br><br>'))}${helpBlock('六种宠物进化路线',MAPS.map(m=>{const sample={name:m.pet,evolutionBranches:{}};const g=PET_EVOLUTION_ROUTES[m.id];return `<b>${m.pet}｜${PET_SPECIES[m.pet].archetype}</b><br>3阶：${Object.values(g.three).map(x=>`【${x.name}】${x.desc}`).join(' / ')}<br>6阶：${Object.values(g.six).map(x=>`【${x.name}】${x.desc}`).join(' / ')}`}).join('<br><br>'))}`}
 const renderPetsBefore038=renderPets;
 renderPets=function(){return petEvolutionChoices()+autoFusePanel()+petGuidePanel()+renderPetsBefore038()+petCodexPanel()};

 // ----- Alpha 0.39: endless abyss progression -----
 const winBattleBefore038=winBattle;
 winBattle=function(){
  const defeated=state.enemy?{...state.enemy}:null,mapId=state.mapId,wasAbyss=mapId==='abyss',depth=state.abyssDepth||1,retryFiller=wasAbyss&&!state.enemy?.boss&&!!state.bossProgress?.abyss?.active;
  const result=winBattleBefore038();
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
  const d=dangerDropProfile('abyss'),cycle=bossCycleConfig('abyss');
  return `<div class="card abyss-card"><h3>Alpha 0.39 · 无尽星渊重平衡</h3><div class="stat-table"><div class="stat"><b>${state.abyssDepth}</b>当前层</div><div class="stat"><b>${state.abyssHighest}</b>最高层</div><div class="stat"><b>W${state.rebirths||0}</b>世界阶级</div><div class="stat"><b>${cycle.period}</b>Boss周期</div></div><div class="compact-meta">入口基准CP已降至9,000；转生敌人成长调整为生命+12%/攻击+8%/防御+6%，玩家同步获得攻击+10%/生命+6%/防御+6%/宠物+10%与金币+8%。星渊深度仍持续提高难度、收益、神话与变异X概率。</div><div class="compact-meta">当前星渊：装备×${d.gearDrop.toFixed(2)} · 神话×${d.mythic.toFixed(2)} · 变异X×${d.mutation.toFixed(2)}</div></div>`+html;
 };

 // Keep all visible version labels aligned with the final integrated build.
 const renderBefore038=render;
 render=function(...args){const result=renderBefore038(...args),heading=document.querySelector('.topbar h1,.start h1'),footer=document.querySelector('.footer');document.title='无尽战域：核心 Alpha 0.39';if(heading)heading.textContent='无尽战域：核心 Alpha 0.39';if(footer)footer.textContent='Alpha 0.39：完整培养传承、六物种专属进化、三倍金币经济、星渊与转生重平衡。';return result};

 // New games and legacy saves receive the 0.39 state shape after all legacy patches load.
 const startGameBefore038=startGame;
 startGame=function(){const result=startGameBefore038();ensureAlpha039State();save();render(false);return result};
 ensureAlpha039State();
 try{save();render(false)}catch(err){console.warn('Alpha 0.39 final initialization skipped',err)}
})();

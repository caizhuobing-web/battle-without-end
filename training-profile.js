/* Alpha 0.34 - dedicated character training/proficiency archive */
(()=>{
 'use strict';
 const originalRenderCharacter=typeof renderCharacter==='function'?renderCharacter:null;
 if(!originalRenderCharacter)return;

 const style=document.createElement('style');
 style.textContent=`
 .training-archive{border:1px solid #5b4930;background:linear-gradient(180deg,#241e15,#19150f);padding:7px;margin-bottom:7px}
 .training-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px}
 .training-head h3{margin:0;color:#e7c271;font-size:14px}
 .training-summary{color:#aa9a80;font-size:10px;text-align:right}
 .training-list{display:grid;gap:5px}
 .training-skill{border:1px solid #403624;background:#15120e;padding:6px}
 .training-top{display:flex;justify-content:space-between;gap:7px;align-items:flex-start}
 .training-name{font-weight:700;font-size:12px;line-height:1.25}
 .training-tags{display:flex;gap:3px;flex-wrap:wrap;margin-top:2px}
 .training-tag{border:1px solid #4e412d;padding:1px 4px;font-size:8px;color:#bcae94;border-radius:3px}
 .training-tag.on{border-color:#7d653b;color:#e7c271}
 .training-tag.mastered{border-color:#9c7628;color:#ffd76f}
 .training-level{font-weight:800;color:#fff;font-size:12px;white-space:nowrap}
 .training-bar{height:7px;background:#0d0b08;border:1px solid #382f21;margin-top:5px;position:relative;overflow:hidden}
 .training-bar i{display:block;height:100%;background:linear-gradient(90deg,#71572a,#d1a64e)}
 .training-info{display:flex;justify-content:space-between;gap:8px;margin-top:4px;color:#a99a80;font-size:9px;line-height:1.35}
 .training-info b{color:#e5d4b4;font-weight:600}
 .training-max{color:#f0c86d;font-weight:700}
 .training-empty{color:#8f826e;font-size:10px;padding:5px 0}
 @media(max-width:850px){
  .training-archive{padding:5px;margin-bottom:5px}
  .training-head{margin-bottom:4px}
  .training-head h3{font-size:12px}
  .training-summary{font-size:8px}
  .training-list{gap:4px}
  .training-skill{padding:5px}
  .training-name,.training-level{font-size:10.5px}
  .training-tag{font-size:7.5px;padding:1px 3px}
  .training-bar{height:6px;margin-top:4px}
  .training-info{font-size:8px;margin-top:3px;gap:5px}
 }
 `;
 document.head.appendChild(style);

 function uniq(arr){return [...new Set(arr.filter(Boolean))]}
 function isEquipped(id){return (state.activeSkillSlots||[]).includes(id)||(state.passiveSkillSlots||[]).includes(id)}
 function trainingIds(){
  const native=typeof classNativeSkills==='function'?classNativeSkills(state.style):[];
  const equipped=[...(state.activeSkillSlots||[]),...(state.passiveSkillSlots||[])];
  return uniq([...native,...equipped]);
 }
 function masteryIds(){return Object.keys(state.skillMastered||{}).filter(id=>state.skillMastered[id]&&SKILLS[id])}
 function fmt(n){return Math.max(0,Math.floor(Number(n)||0)).toLocaleString('zh-CN')}
 function skillRow(id){
  const sk=SKILLS[id];if(!sk)return'';
  const lv=skillLevel(id),uses=Number(state.skillUse?.[id]||0),th=skillThresholds(id),maxNeed=Number(th[th.length-1]||0),next=skillNextUses(id);
  const remainingMax=Math.max(0,maxNeed-uses),remainingNext=next===null?0:Math.max(0,next-uses),pct=maxNeed?Math.min(100,uses/maxNeed*100):100;
  const mastered=!!state.skillMastered?.[id]||lv>=10,native=sk.classId===state.style,equipped=isEquipped(id),passive=sk.type==='passive';
  const cls=STYLES[sk.classId],rarity=RARITIES[cls?.rarity||0];
  const source=native?'当前职业':mastered?'已传承':'跨职业';
  const trainUnit=passive?'胜利':'释放';
  return `<div class="training-skill" data-training-skill="${id}"><div class="training-top"><div><div class="training-name ${rarity?.cls||''}">${sk.name}</div><div class="training-tags"><span class="training-tag ${native?'on':''}">${source}</span><span class="training-tag">${passive?'被动':'主动'}</span><span class="training-tag ${equipped?'on':''}">${equipped?'已装备':'未装备'}</span>${mastered?'<span class="training-tag mastered">永久传承</span>':''}</div></div><div class="training-level">Lv.${lv}/10</div></div><div class="training-bar"><i style="width:${pct.toFixed(1)}%"></i></div>${mastered?`<div class="training-info"><span class="training-max">MAX · 已录入人物档案</span><span>累计${trainUnit} ${fmt(uses)}</span></div>`:`<div class="training-info"><span><b>下一级</b> 还差 ${fmt(remainingNext)} 次${trainUnit}</span><span><b>Lv.10</b> 还差 ${fmt(remainingMax)} 次${trainUnit}</span></div>`}${!equipped&&!mastered?`<div class="training-info"><span>未装备：当前不会获得熟练度</span><span>累计 ${fmt(uses)}/${fmt(maxNeed)}</span></div>`:`<div class="training-info"><span>累计 ${fmt(uses)}/${fmt(maxNeed)}</span><span>${passive?'装备后每场胜利成长':'实际触发后成长'}</span></div>`}</div>`;
 }
 function renderTrainingArchive(){
  const ids=trainingIds(),mastered=masteryIds(),training=ids.filter(id=>skillLevel(id)<10&&isEquipped(id)).length;
  return `<div class="training-archive" id="training-archive"><div class="training-head"><h3>修炼档案</h3><div class="training-summary">修炼中 ${training} · 永久传承 ${mastered.length}</div></div><div class="training-list">${ids.length?ids.map(skillRow).join(''):'<div class="training-empty">当前没有可显示的职业技能。</div>'}</div>${mastered.length?`<details class="mini"><summary>已永久录入人物档案 ${mastered.length} 项</summary><div class="help-body">${mastered.map(id=>`${SKILLS[id].type==='passive'?'被动':'主动'}【${SKILLS[id].name}】Lv.10`).join('<br>')}</div></details>`:''}</div>`;
 }

 renderCharacter=function(){return renderTrainingArchive()+originalRenderCharacter();};

 function refreshTrainingArchive(){
  if(!state?.started||state.tab!=='character')return;
  const el=document.getElementById('training-archive');if(!el)return;
  const wrapper=document.createElement('div');wrapper.innerHTML=renderTrainingArchive();
  const fresh=wrapper.firstElementChild;if(fresh)el.replaceWith(fresh);
 }
 setInterval(refreshTrainingArchive,900);
 window.refreshTrainingArchive=refreshTrainingArchive;
})();

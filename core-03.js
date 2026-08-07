function gearScoreDetail(it){
 const b=gearScoreBreakdown(it),label=gearFitLabel(it),parts=[`${label[0]} ${(b.fit*100).toFixed(0)}%`,`基础${b.base}`],counts=gearAffixCounts(it),prefs=ensureGearScorePrefs();
 if(b.hits.length)parts.push(`命中偏好：${b.hits.map(x=>GEAR_STAT_NAMES[x]).join('、')}`);
 const pc=counts[prefs.primary]||0;if(pc>=2)parts.push(`核心词条集中×${pc}`);
 const maxEntry=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];if(maxEntry&&maxEntry[1]>=4)parts.push(`极品专精：${GEAR_STAT_NAMES[maxEntry[0]]||maxEntry[0]}×${maxEntry[1]}`);
 if(Array.isArray(it.arcanes)&&it.arcanes.length)parts.push(`项链秘仪：${it.arcanes.map(amuletArcaneText).join('、')}`);
 if(b.weak.length)parts.push(`低价值词条：${b.weak.map(x=>GEAR_STAT_NAMES[x]).join('、')}`);return parts.join('｜');
}
const SKILLS={
 warrior_slash:{name:'裂甲重斩',classId:'melee',type:'active',cat:'attack',baseChance:.26,cooldown:2,kind:'damage',mult:1.85,desc:'稳定的高倍率近战斩击。'},
 warrior_focus:{name:'战意',classId:'melee',type:'passive',effects:{atkPct:.07},desc:'装备后提高攻击；随胜利战斗成长。'},
 ranger_volley:{name:'疾风连射',classId:'ranged',type:'active',cat:'attack',baseChance:.29,cooldown:2,kind:'damage',mult:.88,hits:2,desc:'连续两次远程攻击。'},
 ranger_eye:{name:'鹰眼',classId:'ranged',type:'passive',effects:{crit:4,speedPct:.04},desc:'提高原始暴击和速度。'},
 mage_fireball:{name:'灼星火球',classId:'magic',type:'active',cat:'attack',baseChance:.30,cooldown:2,kind:'damage',mult:2.05,mp:8,desc:'基础但可靠的高伤害法术。'},
 mage_flow:{name:'魔力潮汐',classId:'magic',type:'passive',effects:{mpPct:.12,skillChance:.025},desc:'提高法力上限和技能触发率。'},
 guard_wall:{name:'钢铁壁垒',classId:'guardian',type:'active',cat:'defense',baseChance:.27,cooldown:2,kind:'reduce',reduce:.52,desc:'受击前显著降低本次伤害。'},
 guard_bastion:{name:'不动堡垒',classId:'guardian',type:'passive',effects:{defPct:.12,hpPct:.08},desc:'提高防御和生命上限。'},
 warlock_drain:{name:'血蚀',classId:'warlock',type:'active',cat:'attack',baseChance:.24,cooldown:3,kind:'drain',mult:1.55,drain:.32,mp:7,desc:'造成伤害并吸取生命。'},
 warlock_pact:{name:'黑血契约',classId:'warlock',type:'passive',effects:{lifesteal:.05,hpPct:.04},desc:'所有直接伤害获得额外吸血。'},
 hunter_pierce:{name:'穿心箭',classId:'hunter',type:'active',cat:'attack',baseChance:.24,cooldown:2,kind:'damage',mult:2.10,ignore:.52,desc:'高伤害并无视大量防御。'},
 hunter_execute:{name:'猎杀标记',classId:'hunter',type:'active',cat:'attack',baseChance:.14,cooldown:4,kind:'execute',mult:1.45,executeThreshold:.35,executeMult:3.15,desc:'目标生命较低时造成巨额伤害。'},
 hunter_instinct:{name:'猎手本能',classId:'hunter',type:'passive',effects:{bossDamage:.10,crit:2},desc:'提高对Boss伤害和原始暴击。'},
 paladin_strike:{name:'圣裁',classId:'paladin',type:'active',cat:'attack',baseChance:.22,cooldown:2,kind:'damage',mult:2.05,desc:'稳定的圣光重击。'},
 paladin_heal:{name:'圣愈',classId:'paladin',type:'active',cat:'defense',baseChance:.19,cooldown:4,kind:'heal',threshold:.62,healPct:.30,intScale:.85,mp:10,desc:'低生命时自动治疗。'},
 paladin_oath:{name:'守誓',classId:'paladin',type:'passive',effects:{hpPct:.10,healing:.15},desc:'提高生命上限和所有治疗效果。'},
 assassin_shadow:{name:'影袭',classId:'assassin',type:'active',cat:'attack',baseChance:.25,cooldown:2,kind:'damage',mult:2.45,ignore:.22,desc:'快速而致命的高倍率攻击。'},
 assassin_corrosion:{name:'蚀骨刃',classId:'assassin',type:'active',cat:'attack',baseChance:.16,cooldown:4,kind:'debuff',mult:1.45,debuffTurns:4,debuffArmor:.28,desc:'造成伤害并降低敌人防御。'},
 assassin_instinct:{name:'杀意',classId:'assassin',type:'passive',effects:{crit:6,critDmg:.12,speedPct:.05},desc:'提高暴击、暴伤和速度。'},
 element_burst:{name:'元素爆裂',classId:'elementalist',type:'active',cat:'attack',baseChance:.24,cooldown:2,kind:'damage',mult:.92,hits:3,mp:14,desc:'三段元素伤害。'},
 element_storm:{name:'灾变风暴',classId:'elementalist',type:'active',cat:'attack',baseChance:.14,cooldown:4,kind:'damage',mult:3.20,mp:24,ignore:.18,desc:'高耗魔的强力元素爆发。'},
 element_resonance:{name:'元素共鸣',classId:'elementalist',type:'passive',effects:{skillChance:.04,mpPct:.10},desc:'提高技能触发率与法力上限。'},
 saint_slash:{name:'天隙一闪',classId:'swordsaint',type:'active',cat:'attack',baseChance:.22,cooldown:2,kind:'damage',mult:3.05,ignore:.25,desc:'传说级单体斩击。'},
 saint_counter:{name:'无想反击',classId:'swordsaint',type:'active',cat:'defense',baseChance:.18,cooldown:3,kind:'counter',counterMult:1.65,desc:'受击后立即进行强力反击。'},
 saint_heart:{name:'剑心',classId:'swordsaint',type:'passive',effects:{atkPct:.10,speedPct:.07},desc:'提高攻击与速度。'},
 chrono_fracture:{name:'时隙断层',classId:'chronomancer',type:'active',cat:'attack',baseChance:.22,cooldown:3,kind:'damage',mult:2.75,mp:18,ignore:.20,desc:'切开时间造成高额法术伤害。'},
 chrono_rewind:{name:'回溯',classId:'chronomancer',type:'active',cat:'defense',baseChance:.18,cooldown:4,kind:'heal',threshold:.68,healPct:.38,intScale:1.05,mp:16,desc:'将生命状态回溯到更安全的位置。'},
 chrono_flow:{name:'时间流',classId:'chronomancer',type:'passive',effects:{cooldown:1,skillChance:.03},desc:'所有主动技能冷却-1，技能触发率提高。'},
 star_fall:{name:'星陨连矢',classId:'starwalker',type:'active',cat:'attack',baseChance:.22,cooldown:2,kind:'damage',mult:.92,hits:4,ignore:.28,desc:'四段星陨穿透攻击。'},
 star_hunt:{name:'终星狩猎',classId:'starwalker',type:'active',cat:'attack',baseChance:.13,cooldown:4,kind:'execute',mult:1.80,executeThreshold:.40,executeMult:4.10,ignore:.20,desc:'神话级终结技能。'},
 star_constellation:{name:'猎星座',classId:'starwalker',type:'passive',effects:{bossDamage:.15,skillChance:.05,crit:4},desc:'大幅强化Boss战和技能触发。'},
 night_feast:{name:'永夜血宴',classId:'nightking',type:'active',cat:'attack',baseChance:.22,cooldown:3,kind:'drain',mult:2.55,drain:.42,desc:'高伤害并大量吸血。'},
 night_mirror:{name:'暗夜王镜',classId:'nightking',type:'active',cat:'defense',baseChance:.17,cooldown:4,kind:'mirror',reduce:.58,reflect:.58,desc:'减伤并反射大量实际伤害。'},
 night_throne:{name:'黑王座',classId:'nightking',type:'passive',effects:{atkPct:.12,hpPct:.12,defPct:.08},desc:'同时提高攻击、生命和防御。'}
};
const SPECIAL_SKILL_IDS=[];
const ACTIVE_SKILL_LEVEL_THRESHOLDS=[0,25,70,150,280,460,700,1050,1500,2200];
const PASSIVE_SKILL_LEVEL_THRESHOLDS=[0,18,55,120,220,360,540,780,1100,1500];
const SKILL_LEVEL_THRESHOLDS=ACTIVE_SKILL_LEVEL_THRESHOLDS;
function skillThresholds(id){return SKILLS[id]?.type==='passive'?PASSIVE_SKILL_LEVEL_THRESHOLDS:ACTIVE_SKILL_LEVEL_THRESHOLDS}
function skillLevel(id){const uses=state.skillUse?.[id]||0,th=skillThresholds(id);let lv=1;for(let i=1;i<th.length;i++){if(uses>=th[i])lv=i+1;else break}return clamp(lv,1,10)}
function skillNextUses(id){const lv=skillLevel(id),th=skillThresholds(id);return lv>=10?null:th[lv]}
function isNativeSkill(id){return SKILLS[id]?.classId===state.style}
function skillPower(id){const lv=skillLevel(id),base=1+(lv-1)*.06;return base*(isNativeSkill(id)?1.15:1)}
function passiveScale(id){const lv=skillLevel(id);return (.55+lv*.05)*(isNativeSkill(id)?1.10:1)}
function skillTriggerChance(id,s=null){const sk=SKILLS[id],lv=skillLevel(id),ctx=s||stats(),bonus=ctx?.skillChance||0;return clamp((sk.baseChance||0)+(lv-1)*.025+bonus,.01,1)}
function skillProgressPct(id){const lv=skillLevel(id),uses=state.skillUse?.[id]||0,th=skillThresholds(id);if(lv>=10)return 100;const lo=th[lv-1],hi=th[lv];return clamp(Math.round((uses-lo)/(hi-lo)*100),0,100)}
function masteryBonusText(id){return '永久录入人物档案，可跨职业装备'}
function skillMasteryTotals(){return{hpPct:0,mpPct:0,atkPct:0,defPct:0,speedPct:0,crit:0,critDmg:0,skillChance:0}}
function passiveSkillTotals(){const out={hpPct:0,mpPct:0,atkPct:0,defPct:0,speedPct:0,crit:0,critDmg:0,skillChance:0,bossDamage:0,lifesteal:0,cooldown:0,healing:0,ignoreDef:0};for(const id of state.passiveSkillSlots||[]){const sk=SKILLS[id];if(!sk||sk.type!=='passive'||!skillUsable(id))continue;const scale=passiveScale(id);Object.entries(sk.effects||{}).forEach(([k,v])=>{if(k==='cooldown')out[k]=Math.max(out[k],Math.round(v));else out[k]=(out[k]||0)+v*scale})}return out}
function classNativeSkills(styleId=state.style){return (STYLES[styleId]?.skills||[]).filter(id=>SKILLS[id])}
function skillUsable(id){const sk=SKILLS[id];if(!sk)return false;return sk.classId===state.style||!!state.skillMastered?.[id]}
function unlockedSkills(){return Object.keys(SKILLS).filter(skillUsable)}
function nativeActiveSkills(styleId=state.style){return classNativeSkills(styleId).filter(id=>SKILLS[id].type==='active')}
function nativePassiveSkills(styleId=state.style){return classNativeSkills(styleId).filter(id=>SKILLS[id].type==='passive')}
function syncSkills(){state.skills=state.skills||{};state.skillUse=state.skillUse||{};state.skillMastered=state.skillMastered||{};state.activeSkillSlots=Array.isArray(state.activeSkillSlots)?state.activeSkillSlots.filter(id=>SKILLS[id]?.type==='active'&&skillUsable(id)).slice(0,3):[];state.passiveSkillSlots=Array.isArray(state.passiveSkillSlots)?state.passiveSkillSlots.filter(id=>SKILLS[id]?.type==='passive'&&skillUsable(id)).slice(0,2):[];for(const id of unlockedSkills()){if(state.skillUse[id]===undefined)state.skillUse[id]=0;if(skillLevel(id)>=10)state.skillMastered[id]=true}if(!state.activeSkillSlots.length)state.activeSkillSlots=nativeActiveSkills().slice(0,3);if(!state.passiveSkillSlots.length)state.passiveSkillSlots=nativePassiveSkills().slice(0,2);state.skillPriority={attack:state.activeSkillSlots.filter(id=>SKILLS[id]?.cat==='attack'),defense:state.activeSkillSlots.filter(id=>SKILLS[id]?.cat==='defense')};state.activeSkillSlots.forEach(id=>state.skills[id]=true)}
function registerSkillUse(id){if(!id||SKILLS[id]?.type!=='active')return;const oldLv=skillLevel(id),mult=rebirthProfile().skillMastery;let gain=Math.floor(mult),fraction=mult-gain;if(Math.random()<fraction)gain++;gain=Math.max(1,gain);state.skillUse[id]=(state.skillUse[id]||0)+gain;const newLv=skillLevel(id);if(newLv>oldLv)log(`${SKILLS[id].name}提升至Lv.${newLv}。`,'sys','system');if(newLv>=10&&!state.skillMastered?.[id]){state.skillMastered[id]=true;log(`【技能传承】${SKILLS[id].name}达到Lv.10，已永久录入人物档案，可跨职业装备。`,'important','important')}}

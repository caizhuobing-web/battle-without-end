'use strict';
const VERSION='0.39.0';
const SAVE_KEY='bwe-core-alpha-039';
const ALPHA038_SAVE_KEY='bwe-core-alpha-038';
const ALPHA035_SAVE_KEY='bwe-core-alpha-035';
const ALPHA034_SAVE_KEY='bwe-core-alpha-034';
const ALPHA033_SAVE_KEY='bwe-core-alpha-033';
const ALPHA032_SAVE_KEY='bwe-core-alpha-032';
const ALPHA031_SAVE_KEY='bwe-core-alpha-031';
const ALPHA030_SAVE_KEY='bwe-core-alpha-030';
const ALPHA029_SAVE_KEY='bwe-core-alpha-029';
const ALPHA028_SAVE_KEY='bwe-core-alpha-028';
const ALPHA027_SAVE_KEY='bwe-core-alpha-027';
const ALPHA026_SAVE_KEY='bwe-core-alpha-026';
const ALPHA025_SAVE_KEY='bwe-core-alpha-025';
const ALPHA024_SAVE_KEY='bwe-core-alpha-024';
const ALPHA023_SAVE_KEY='bwe-core-alpha-023';
const ALPHA022_SAVE_KEY='bwe-core-alpha-022';
const ALPHA021_SAVE_KEY='bwe-core-alpha-021';
const ALPHA020_SAVE_KEY='bwe-core-alpha-020';
const ALPHA019_SAVE_KEY='bwe-core-alpha-019';
const ALPHA018_SAVE_KEY='bwe-core-alpha-018';
const ALPHA017_SAVE_KEY='bwe-core-alpha-017';
const ALPHA016_SAVE_KEY='bwe-core-alpha-016';
const ALPHA015_SAVE_KEY='bwe-core-alpha-015';
const ALPHA014_SAVE_KEY='bwe-core-alpha-014';
const ALPHA013_SAVE_KEY='bwe-core-alpha-013';
const ALPHA012_SAVE_KEY='bwe-core-alpha-012';
const ALPHA011_SAVE_KEY='bwe-core-alpha-011';
const ALPHA010_SAVE_KEY='bwe-core-alpha-010';
const ALPHA09_SAVE_KEY='bwe-core-alpha-09';
const PREVIOUS_SAVE_KEY='bwe-core-alpha-08';
const LEGACY_SAVE_KEY='bwe-core-alpha-07';
const OLDER_SAVE_KEY='bwe-core-alpha-06';
const OLDEST_SAVE_KEY='bwe-core-alpha-05';
const ANCIENT_SAVE_KEY='bwe-core-alpha-04';
const PRIMITIVE_SAVE_KEY='bwe-core-alpha-03';

const IDENTITY_STAT_NAMES={str:'力量',int:'智力',dex:'敏捷',will:'意志',luck:'幸运'};
const STARTER_RACES=['human','orc','forestfolk'];
const STARTER_CLASSES=['melee','ranged','magic'];
const RACES={
 human:{name:'人类',icon:'🧑',rarity:0,starter:true,growth:{str:1,int:1,dex:1,will:1,luck:1},trait:{xp:1.08},traitName:'适应者',traitDesc:'经验获取+8%。',desc:'没有明显短板的均衡种族。'},
 orc:{name:'兽人',icon:'👹',rarity:0,starter:true,growth:{str:1.16,int:.82,dex:.90,will:1.07,luck:.84},trait:{hp:1.10},traitName:'战血',traitDesc:'最大生命+10%。',desc:'力量与生存偏高，智力与幸运偏低。'},
 forestfolk:{name:'林民',icon:'🌿',rarity:0,starter:true,growth:{str:.88,int:1,dex:1.14,will:.98,luck:1.07},trait:{speed:1.06},traitName:'林间步',traitDesc:'最终速度+6%。',desc:'灵活、幸运的基础种族。'},
 dwarf:{name:'矮人',icon:'⛏️',rarity:1,growth:{str:1.08,int:.86,dex:.90,will:1.22,luck:.96},trait:{def:1.12},traitName:'石肤',traitDesc:'最终防御+12%。',desc:'防御和意志显著提高。'},
 beastkin:{name:'兽裔',icon:'🐾',rarity:1,growth:{str:1.10,int:.88,dex:1.10,will:.94,luck:1.08},trait:{petPower:1.12},traitName:'群猎血脉',traitDesc:'出战宠物攻击与魔力+12%。',desc:'自身均衡，并强化宠物。'},
 elf:{name:'精灵',icon:'🧝',rarity:2,growth:{str:.88,int:1.18,dex:1.25,will:1.05,luck:1.12},trait:{critEfficiency:.07,speed:1.05},traitName:'风之血脉',traitDesc:'速度+5%，原始暴击转化效率+7%。',desc:'敏捷、智力和幸运突出。'},
 undead:{name:'亡灵',icon:'💀',rarity:2,growth:{str:1.02,int:1.08,dex:.91,will:1.25,luck:.96},trait:{drain:1.25,hp:1.05},traitName:'不息之躯',traitDesc:'最大生命+5%，所有吸血效果+25%。',desc:'高意志的持续作战种族。'},
 dragonkin:{name:'龙裔',icon:'🐲',rarity:3,growth:{str:1.24,int:1.08,dex:.98,will:1.16,luck:1},trait:{damage:1.10,bossDamage:.08},traitName:'龙威',traitDesc:'最终攻击+10%，对Boss伤害额外+8%。',desc:'直接、强势的进攻型史诗种族。'},
 spiritborn:{name:'灵裔',icon:'🪷',rarity:3,growth:{str:.90,int:1.30,dex:1.05,will:1.18,luck:1.12},trait:{skillChance:.05,healing:1.15},traitName:'灵脉共鸣',traitDesc:'技能触发率+5个百分点，治疗效果+15%。',desc:'法术与技能循环能力很强。'},
 celestial:{name:'天裔',icon:'✨',rarity:4,growth:{str:1.08,int:1.27,dex:1.12,will:1.28,luck:1.12},trait:{def:1.10,healing:1.25},traitName:'圣序',traitDesc:'最终防御+10%，治疗效果+25%。',desc:'高总属性预算的传说防御/法术种族。'},
 voidborn:{name:'虚空裔',icon:'🕳️',rarity:4,growth:{str:1.20,int:1.22,dex:1.20,will:1.05,luck:1.13},trait:{ignoreDef:.10,skillChance:.03},traitName:'裂界',traitDesc:'玩家攻击额外无视10%防御，技能触发率+3个百分点。',desc:'高攻击覆盖面的传说种族。'},
 titan:{name:'太古泰坦',icon:'🗿',rarity:5,growth:{str:1.42,int:.88,dex:.96,will:1.40,luck:1.05},trait:{hp:1.22,damage:1.12},traitName:'原初巨躯',traitDesc:'最大生命+22%，最终攻击+12%。',desc:'极高生命与力量预算的神话种族。'},
 starborn:{name:'星命者',icon:'🌌',rarity:5,growth:{str:1.12,int:1.32,dex:1.33,will:1.17,luck:1.43},trait:{critEfficiency:.12,skillChance:.05},traitName:'命星',traitDesc:'原始暴击转化效率+12%，技能触发率+5个百分点。',desc:'幸运、敏捷和智力都极高的神话种族。'}
};
const STYLES={
 melee:{name:'战士',icon:'⚔️',rarity:0,starter:true,archetype:'melee',growth:{str:1.22,int:.72,dex:.92,will:1.04,luck:.90},skills:['warrior_slash','warrior_focus'],desc:'基础近战职业，稳定的直接输出。'},
 ranged:{name:'游侠',icon:'🏹',rarity:0,starter:true,archetype:'ranged',growth:{str:.88,int:.75,dex:1.28,will:.95,luck:1.06},skills:['ranger_volley','ranger_eye'],desc:'基础远程职业，强调速度与暴击。'},
 magic:{name:'法师',icon:'🔮',rarity:0,starter:true,archetype:'magic',growth:{str:.70,int:1.30,dex:.90,will:1.08,luck:.96},skills:['mage_fireball','mage_flow'],desc:'基础施法职业，强调智力与技能循环。'},
 guardian:{name:'守卫',icon:'🛡️',rarity:1,archetype:'melee',growth:{str:1.14,int:.78,dex:.90,will:1.25,luck:.92},skills:['guard_wall','guard_bastion'],desc:'用防御换稳定性的优秀职业。'},
 warlock:{name:'术士',icon:'🩸',rarity:1,archetype:'magic',growth:{str:.82,int:1.27,dex:.88,will:1.12,luck:1.02},skills:['warlock_drain','warlock_pact'],desc:'依赖吸血维持战斗的优秀职业。'},
 hunter:{name:'猎人',icon:'🎯',rarity:2,archetype:'ranged',growth:{str:.92,int:.80,dex:1.34,will:1.02,luck:1.12},skills:['hunter_pierce','hunter_execute','hunter_instinct'],desc:'针对Boss和残血目标的稀有职业。'},
 paladin:{name:'圣骑士',icon:'☀️',rarity:2,archetype:'melee',growth:{str:1.16,int:1.04,dex:.88,will:1.27,luck:.98},skills:['paladin_strike','paladin_heal','paladin_oath'],desc:'攻击、治疗和生存兼备的稀有职业。'},
 assassin:{name:'刺客',icon:'🗡️',rarity:3,archetype:'melee',growth:{str:1.08,int:.82,dex:1.38,will:.96,luck:1.18},skills:['assassin_shadow','assassin_corrosion','assassin_instinct'],desc:'高暴击、高速度的史诗职业。'},
 elementalist:{name:'元素使',icon:'🔥',rarity:3,archetype:'magic',growth:{str:.78,int:1.42,dex:1.02,will:1.13,luck:1.06},skills:['element_burst','element_storm','element_resonance'],desc:'多段法术与高技能频率的史诗职业。'},
 swordsaint:{name:'剑圣',icon:'🗡️',rarity:4,archetype:'melee',growth:{str:1.38,int:.78,dex:1.25,will:1.08,luck:1.10},skills:['saint_slash','saint_counter','saint_heart'],desc:'纯粹进攻与反击结合的传说职业。'},
 chronomancer:{name:'时咏者',icon:'⏳',rarity:4,archetype:'magic',growth:{str:.82,int:1.38,dex:1.12,will:1.22,luck:1.18},skills:['chrono_fracture','chrono_rewind','chrono_flow'],desc:'利用冷却和恢复控制节奏的传说职业。'},
 starwalker:{name:'星渊行者',icon:'🌠',rarity:5,archetype:'ranged',growth:{str:1.02,int:1.26,dex:1.45,will:1.18,luck:1.34},skills:['star_fall','star_hunt','star_constellation'],desc:'多段穿透与Boss猎杀能力极强的神话职业。'},
 nightking:{name:'永夜君王',icon:'👑',rarity:5,archetype:'melee',growth:{str:1.36,int:1.22,dex:1.12,will:1.30,luck:1.16},skills:['night_feast','night_mirror','night_throne'],desc:'吸血、镜返和高综合战斗力结合的神话职业。'}
};
function classArchetype(styleId=state.style){return STYLES[styleId]?.archetype||'melee'}
function identityRarityLabel(x){const r=RARITIES[x?.rarity||0];return `<span class="${r.cls}">${r.name}</span>`}
function identityGrowthText(x){return Object.entries(x.growth).map(([k,v])=>`${IDENTITY_STAT_NAMES[k]}×${Number(v).toFixed(2)}`).join(' · ')}
function raceTraitPowers(){return RACES[state.race]?.trait||{}}
const MAPS=[
 {id:'meadow',name:'新月草原',cp:117,mod:0.0,gearTier:1,petTier:1,threatCap:3,levels:[1,7],monsters:['幼角兔','灰尾狸','草原史莱姆'],boss:'月背巨狼',pet:'灰尾幼狼'},
 {id:'hill',name:'裂风丘陵',cp:313,mod:0.25,gearTier:2,petTier:2,threatCap:4,levels:[8,17],monsters:['岩皮蜥','狂风鹰','丘陵鬣狗'],boss:'裂风狮王',pet:'裂风幼狮'},
 {id:'forest',name:'魂木森林',cp:771,mod:0.6,gearTier:3,petTier:3,threatCap:5,levels:[18,30],monsters:['毒牙蛛','苔甲兽','幽光鹿'],boss:'千年树灵',pet:'树灵幼芽'},
 {id:'shore',name:'霜蚀海岸',cp:1695,mod:1.0,gearTier:4,petTier:4,threatCap:6,levels:[31,47],monsters:['冰壳蟹','冻原狼人','霜鳍鱼人'],boss:'极寒海兽',pet:'霜鳍幼兽'},
 {id:'ruins',name:'失落王城',cp:3795,mod:1.55,gearTier:5,petTier:5,threatCap:8,levels:[48,68],monsters:['王城亡魂','黑甲守卫','诅咒法师'],boss:'不灭王魂',pet:'王魂侍从'},
 {id:'abyss',name:'星渊尽头',cp:9000,mod:2.2,gearTier:6,petTier:6,threatCap:Infinity,levels:[58,100],monsters:['虚空猎犬','星蚀魔像','深渊观测者'],boss:'终焉星龙',pet:'星核幼龙'}
];
const MONSTER_TITLES=[
 {name:'虚弱的',w:18,atkMul:.8,hpMul:.8,defMul:1,xp:.5,gold:.5,drop:.7},
 {name:'',w:45,atkMul:1,hpMul:1,defMul:1,xp:1,gold:1,drop:1},
 {name:'危险的',w:18,atkMul:2,hpMul:2,defMul:1,xp:1.6,gold:1.5,drop:1.5},
 {name:'精锐的',w:10,atkMul:3,hpMul:3,defMul:2,xp:2.5,gold:3,drop:2.2},
 {name:'古老的',w:6,atkMul:3,hpMul:10,defMul:1.5,xp:4,gold:10,drop:2.8},
 {name:'未知的',w:3,atkMul:2,hpMul:3,defMul:5,xp:3,gold:5,drop:1.8}
];
const QUALITY_SCORE_MULT=[1,1.32,1.75,2.15,2.65,4.15];
function equipmentTier(mapDef=map(),sourceThreat=null){return mapDef.gearTier||1}
function gearTierScore(tier,rarity=0){return Math.round(32*Math.pow(1.75,Math.max(0,tier-1))*(QUALITY_SCORE_MULT[rarity]||1))}
function inferItemTier(it){if(Number.isFinite(it.tier))return Math.max(1,Math.round(it.tier));const src=MAPS.find(m=>m.id===it.sourceMap);if(src)return equipmentTier(src,it.sourceThreat||0);return Math.max(1,Math.round(it.itemLevel||1))}
function inferItemLevel(it){return inferItemTier(it)}
function gearTargetScore(level,rarity=0){return gearTierScore(Math.max(1,Math.round(level)),rarity)}
const RARITIES=[
 {name:'普通',cls:'r0',mult:1,aff:0,sell:3},
 {name:'优秀',cls:'r1',mult:1.18,aff:1,sell:8},
 {name:'稀有',cls:'r2',mult:1.38,aff:2,sell:20},
 {name:'史诗',cls:'r3',mult:1.62,aff:3,sell:55},
 {name:'传说',cls:'r4',mult:1.92,aff:4,sell:150},
 {name:'神话',cls:'r5',mult:3.10,aff:5,sell:650}
];
const SLOTS=['weapon','head','armor','boots','ring','amulet'];
const AMULET_ARCANES={
 chrono:{name:'时间折叠',minRarity:4,weight:5,desc:'所有技能基础冷却-1回合。不会让冷却低于0。',score:1.22},
 huntclock:{name:'猎手罗盘',minRarity:2,weight:13,desc:'每轮遇见区域Boss所需普通怪数量-1，与时流法则共同生效；最终可降至0只，进入连续Boss战。',score:1.11},
 bloodpact:{name:'血契',minRarity:2,weight:16,desc:'玩家与出战宠物造成直接伤害时，按一定比例为玩家回复生命。',score:1.14},
 overcrit:{name:'超限视界',minRarity:3,weight:12,desc:'提高“原始暴击→实际暴击率”的转化效率，越接近100%收益越小。',score:1.13},
 resonance:{name:'咒术共鸣',minRarity:2,weight:15,desc:'所有技能触发率额外提高若干个百分点。',score:1.12},
 bloodline:{name:'血脉共振',minRarity:3,weight:12,desc:'宠物物种专属技能的伤害与治疗效果提高。',score:1.10},
 bossmark:{name:'首领猎印',minRarity:2,weight:17,desc:'区域Boss战中，玩家与宠物造成的伤害提高。',score:1.10}
};

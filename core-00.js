const SLOT_NAMES={weapon:'武器',head:'头部',armor:'护甲',boots:'靴子',ring:'戒指',amulet:'项链'};
const WEAPON_TYPES={
 sword:{name:'剑',styles:['melee'],desc:'原始暴击+6，稳定近战。',mods:{crit:6}},
 axe:{name:'斧',styles:['melee'],desc:'攻击+14%，平衡-10。',mods:{atkMult:1.14,balance:-10}},
 bow:{name:'弓',styles:['ranged'],desc:'远程攻击+12%，速度+4。',mods:{rangedMult:1.12,speed:4}},
 crossbow:{name:'弩',styles:['ranged'],desc:'暴击伤害+35%，速度-2。',mods:{critMult:.35,speed:-2}},
 staff:{name:'法杖',styles:['magic'],desc:'魔法攻击+15%，最大法力+10。',mods:{magicMult:1.15,mp:10}},
 tome:{name:'法书',styles:['magic'],desc:'技能触发率+8%，攻击略低。',mods:{skillChance:.08,atkMult:.94}}
};
const WEAPON_NAMES={sword:['短剑','长剑','符文剑'],axe:['战斧','巨斧','骨斧'],bow:['长弓','猎弓','风纹弓'],crossbow:['轻弩','重弩','机括弩'],staff:['法杖','星辉杖','古木杖'],tome:['法书','秘典','咒文书']};
const BASE_NAMES={weapon:['武器'],head:['皮帽','铁盔','法冠','狼首盔'],armor:['旅者衣','锁子甲','灵纹袍','重甲'],boots:['皮靴','战靴','疾风鞋'],ring:['铜戒','银戒','星纹戒'],amulet:['兽牙链','护符','灵魂坠饰']};
const AFFIXES=[
 {name:'强壮',stat:'str',min:1,max:4,curve:'attr'},{name:'睿智',stat:'int',min:1,max:4,curve:'attr'},
 {name:'敏锐',stat:'dex',min:1,max:4,curve:'attr'},{name:'坚定',stat:'will',min:1,max:4,curve:'attr'},
 {name:'幸运',stat:'luck',min:1,max:4,curve:'attr'},{name:'活力',stat:'hp',min:8,max:24,curve:'resource'},
 {name:'法力',stat:'mp',min:6,max:18,curve:'resource'},{name:'暴烈',stat:'crit',min:1,max:3,curve:'crit'},
 {name:'守护',stat:'def',min:1,max:4,curve:'attr'}
];
const QUALITY_STAT_MULT=[1,1.10,1.22,1.38,1.60,2.05];
const PET_TIER_GROWTH_STEP=.12;
const PET_TIER_MAX_UI=20;
const PET_TIER_INSTINCTS={
 1:{name:'旺盛生命',desc:'最大生命+5%。'},
 2:{name:'角色本能',desc:'根据宠物类型提高核心战斗属性5%。'},
 3:{name:'硬化',desc:'防御+5%。'},
 4:{name:'血脉觉醒',desc:'物种专属技能效果+5%。'},
 5:{name:'战意',desc:'全部伤害+5%。'},
 6:{name:'深层血脉',desc:'物种专属技能效果再+10%。'},
 7:{name:'坚韧',desc:'受到伤害降低6%。'},
 8:{name:'首领猎手',desc:'对区域Boss伤害+8%。'},
 9:{name:'再生',desc:'每次行动后恢复1.5%最大生命。'},
 10:{name:'完全体',desc:'基础生命、攻击、防御与魔力+8%。'}
};

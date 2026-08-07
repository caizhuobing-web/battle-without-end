/* Battle Without End — consolidated core. Source order preserved for classic-script globals. */

/* ===== core-00.js ===== */
const SLOT_NAMES = {
  weapon: "武器",
  head: "头部",
  armor: "护甲",
  boots: "靴子",
  ring: "戒指",
  amulet: "项链",
};
const WEAPON_TYPES = {
  sword: {
    name: "剑",
    styles: ["melee"],
    desc: "原始暴击+6，稳定近战。",
    mods: { crit: 6 },
  },
  axe: {
    name: "斧",
    styles: ["melee"],
    desc: "攻击+14%，平衡-10。",
    mods: { atkMult: 1.14, balance: -10 },
  },
  bow: {
    name: "弓",
    styles: ["ranged"],
    desc: "远程攻击+12%，速度+4。",
    mods: { rangedMult: 1.12, speed: 4 },
  },
  crossbow: {
    name: "弩",
    styles: ["ranged"],
    desc: "暴击伤害+35%，速度-2。",
    mods: { critMult: 0.35, speed: -2 },
  },
  staff: {
    name: "法杖",
    styles: ["magic"],
    desc: "魔法攻击+15%，最大法力+10。",
    mods: { magicMult: 1.15, mp: 10 },
  },
  tome: {
    name: "法书",
    styles: ["magic"],
    desc: "技能触发率+8%，攻击略低。",
    mods: { skillChance: 0.08, atkMult: 0.94 },
  },
};
const WEAPON_NAMES = {
  sword: ["短剑", "长剑", "符文剑"],
  axe: ["战斧", "巨斧", "骨斧"],
  bow: ["长弓", "猎弓", "风纹弓"],
  crossbow: ["轻弩", "重弩", "机括弩"],
  staff: ["法杖", "星辉杖", "古木杖"],
  tome: ["法书", "秘典", "咒文书"],
};
const BASE_NAMES = {
  weapon: ["武器"],
  head: ["皮帽", "铁盔", "法冠", "狼首盔"],
  armor: ["旅者衣", "锁子甲", "灵纹袍", "重甲"],
  boots: ["皮靴", "战靴", "疾风鞋"],
  ring: ["铜戒", "银戒", "星纹戒"],
  amulet: ["兽牙链", "护符", "灵魂坠饰"],
};
const AFFIXES = [
  { name: "强壮", stat: "str", min: 1, max: 4, curve: "attr" },
  { name: "睿智", stat: "int", min: 1, max: 4, curve: "attr" },
  { name: "敏锐", stat: "dex", min: 1, max: 4, curve: "attr" },
  { name: "坚定", stat: "will", min: 1, max: 4, curve: "attr" },
  { name: "幸运", stat: "luck", min: 1, max: 4, curve: "attr" },
  { name: "活力", stat: "hp", min: 8, max: 24, curve: "resource" },
  { name: "法力", stat: "mp", min: 6, max: 18, curve: "resource" },
  { name: "暴烈", stat: "crit", min: 1, max: 3, curve: "crit" },
  { name: "守护", stat: "def", min: 1, max: 4, curve: "attr" },
];
const QUALITY_STAT_MULT = [1, 1.1, 1.22, 1.38, 1.6, 2.05];
const PET_TIER_GROWTH_STEP = 0.12;
const PET_TIER_MAX_UI = 20;
const PET_TIER_INSTINCTS = {
  1: { name: "旺盛生命", desc: "最大生命+5%。" },
  2: { name: "角色本能", desc: "根据宠物类型提高核心战斗属性5%。" },
  3: { name: "硬化", desc: "防御+5%。" },
  4: { name: "血脉觉醒", desc: "物种专属技能效果+5%。" },
  5: { name: "战意", desc: "全部伤害+5%。" },
  6: { name: "深层血脉", desc: "物种专属技能效果再+10%。" },
  7: { name: "坚韧", desc: "受到伤害降低6%。" },
  8: { name: "首领猎手", desc: "对区域Boss伤害+8%。" },
  9: { name: "再生", desc: "每次行动后恢复1.5%最大生命。" },
  10: { name: "完全体", desc: "基础生命、攻击、防御与魔力+8%。" },
};

/* ===== core-01.js ===== */
("use strict");
const VERSION = "0.40.0";
const SAVE_KEY = "bwe-core-alpha-040";
const ALPHA039_SAVE_KEY = "bwe-core-alpha-039";
const ALPHA038_SAVE_KEY = "bwe-core-alpha-038";
const ALPHA035_SAVE_KEY = "bwe-core-alpha-035";
const ALPHA034_SAVE_KEY = "bwe-core-alpha-034";
const ALPHA033_SAVE_KEY = "bwe-core-alpha-033";
const ALPHA032_SAVE_KEY = "bwe-core-alpha-032";
const ALPHA031_SAVE_KEY = "bwe-core-alpha-031";
const ALPHA030_SAVE_KEY = "bwe-core-alpha-030";
const ALPHA029_SAVE_KEY = "bwe-core-alpha-029";
const ALPHA028_SAVE_KEY = "bwe-core-alpha-028";
const ALPHA027_SAVE_KEY = "bwe-core-alpha-027";
const ALPHA026_SAVE_KEY = "bwe-core-alpha-026";
const ALPHA025_SAVE_KEY = "bwe-core-alpha-025";
const ALPHA024_SAVE_KEY = "bwe-core-alpha-024";
const ALPHA023_SAVE_KEY = "bwe-core-alpha-023";
const ALPHA022_SAVE_KEY = "bwe-core-alpha-022";
const ALPHA021_SAVE_KEY = "bwe-core-alpha-021";
const ALPHA020_SAVE_KEY = "bwe-core-alpha-020";
const ALPHA019_SAVE_KEY = "bwe-core-alpha-019";
const ALPHA018_SAVE_KEY = "bwe-core-alpha-018";
const ALPHA017_SAVE_KEY = "bwe-core-alpha-017";
const ALPHA016_SAVE_KEY = "bwe-core-alpha-016";
const ALPHA015_SAVE_KEY = "bwe-core-alpha-015";
const ALPHA014_SAVE_KEY = "bwe-core-alpha-014";
const ALPHA013_SAVE_KEY = "bwe-core-alpha-013";
const ALPHA012_SAVE_KEY = "bwe-core-alpha-012";
const ALPHA011_SAVE_KEY = "bwe-core-alpha-011";
const ALPHA010_SAVE_KEY = "bwe-core-alpha-010";
const ALPHA09_SAVE_KEY = "bwe-core-alpha-09";
const PREVIOUS_SAVE_KEY = "bwe-core-alpha-08";
const LEGACY_SAVE_KEY = "bwe-core-alpha-07";
const OLDER_SAVE_KEY = "bwe-core-alpha-06";
const OLDEST_SAVE_KEY = "bwe-core-alpha-05";
const ANCIENT_SAVE_KEY = "bwe-core-alpha-04";
const PRIMITIVE_SAVE_KEY = "bwe-core-alpha-03";

const IDENTITY_STAT_NAMES = {
  str: "力量",
  int: "智力",
  dex: "敏捷",
  will: "意志",
  luck: "幸运",
};
const STARTER_RACES = ["human", "orc", "forestfolk"];
const STARTER_CLASSES = ["melee", "ranged", "magic"];
const RACES = {
  human: {
    name: "人类",
    icon: "🧑",
    rarity: 0,
    starter: true,
    growth: { str: 1, int: 1, dex: 1, will: 1, luck: 1 },
    trait: { xp: 1.08 },
    traitName: "适应者",
    traitDesc: "经验获取+8%。",
    desc: "没有明显短板的均衡种族。",
  },
  orc: {
    name: "兽人",
    icon: "👹",
    rarity: 0,
    starter: true,
    growth: { str: 1.16, int: 0.82, dex: 0.9, will: 1.07, luck: 0.84 },
    trait: { hp: 1.1 },
    traitName: "战血",
    traitDesc: "最大生命+10%。",
    desc: "力量与生存偏高，智力与幸运偏低。",
  },
  forestfolk: {
    name: "林民",
    icon: "🌿",
    rarity: 0,
    starter: true,
    growth: { str: 0.88, int: 1, dex: 1.14, will: 0.98, luck: 1.07 },
    trait: { speed: 1.06 },
    traitName: "林间步",
    traitDesc: "最终速度+6%。",
    desc: "灵活、幸运的基础种族。",
  },
  dwarf: {
    name: "矮人",
    icon: "⛏️",
    rarity: 1,
    growth: { str: 1.08, int: 0.86, dex: 0.9, will: 1.22, luck: 0.96 },
    trait: { def: 1.12 },
    traitName: "石肤",
    traitDesc: "最终防御+12%。",
    desc: "防御和意志显著提高。",
  },
  beastkin: {
    name: "兽裔",
    icon: "🐾",
    rarity: 1,
    growth: { str: 1.1, int: 0.88, dex: 1.1, will: 0.94, luck: 1.08 },
    trait: { petPower: 1.12 },
    traitName: "群猎血脉",
    traitDesc: "出战宠物攻击与魔力+12%。",
    desc: "自身均衡，并强化宠物。",
  },
  elf: {
    name: "精灵",
    icon: "🧝",
    rarity: 2,
    growth: { str: 0.88, int: 1.18, dex: 1.25, will: 1.05, luck: 1.12 },
    trait: { critEfficiency: 0.07, speed: 1.05 },
    traitName: "风之血脉",
    traitDesc: "速度+5%，原始暴击转化效率+7%。",
    desc: "敏捷、智力和幸运突出。",
  },
  undead: {
    name: "亡灵",
    icon: "💀",
    rarity: 2,
    growth: { str: 1.02, int: 1.08, dex: 0.91, will: 1.25, luck: 0.96 },
    trait: { drain: 1.25, hp: 1.05 },
    traitName: "不息之躯",
    traitDesc: "最大生命+5%，所有吸血效果+25%。",
    desc: "高意志的持续作战种族。",
  },
  dragonkin: {
    name: "龙裔",
    icon: "🐲",
    rarity: 3,
    growth: { str: 1.24, int: 1.08, dex: 0.98, will: 1.16, luck: 1 },
    trait: { damage: 1.1, bossDamage: 0.08 },
    traitName: "龙威",
    traitDesc: "最终攻击+10%，对Boss伤害额外+8%。",
    desc: "直接、强势的进攻型史诗种族。",
  },
  spiritborn: {
    name: "灵裔",
    icon: "🪷",
    rarity: 3,
    growth: { str: 0.9, int: 1.3, dex: 1.05, will: 1.18, luck: 1.12 },
    trait: { skillChance: 0.05, healing: 1.15 },
    traitName: "灵脉共鸣",
    traitDesc: "技能触发率+5个百分点，治疗效果+15%。",
    desc: "法术与技能循环能力很强。",
  },
  celestial: {
    name: "天裔",
    icon: "✨",
    rarity: 4,
    growth: { str: 1.08, int: 1.27, dex: 1.12, will: 1.28, luck: 1.12 },
    trait: { def: 1.1, healing: 1.25 },
    traitName: "圣序",
    traitDesc: "最终防御+10%，治疗效果+25%。",
    desc: "高总属性预算的传说防御/法术种族。",
  },
  voidborn: {
    name: "虚空裔",
    icon: "🕳️",
    rarity: 4,
    growth: { str: 1.2, int: 1.22, dex: 1.2, will: 1.05, luck: 1.13 },
    trait: { ignoreDef: 0.1, skillChance: 0.03 },
    traitName: "裂界",
    traitDesc: "玩家攻击额外无视10%防御，技能触发率+3个百分点。",
    desc: "高攻击覆盖面的传说种族。",
  },
  titan: {
    name: "太古泰坦",
    icon: "🗿",
    rarity: 5,
    growth: { str: 1.42, int: 0.88, dex: 0.96, will: 1.4, luck: 1.05 },
    trait: { hp: 1.22, damage: 1.12 },
    traitName: "原初巨躯",
    traitDesc: "最大生命+22%，最终攻击+12%。",
    desc: "极高生命与力量预算的神话种族。",
  },
  starborn: {
    name: "星命者",
    icon: "🌌",
    rarity: 5,
    growth: { str: 1.12, int: 1.32, dex: 1.33, will: 1.17, luck: 1.43 },
    trait: { critEfficiency: 0.12, skillChance: 0.05 },
    traitName: "命星",
    traitDesc: "原始暴击转化效率+12%，技能触发率+5个百分点。",
    desc: "幸运、敏捷和智力都极高的神话种族。",
  },
};
const STYLES = {
  melee: {
    name: "战士",
    icon: "⚔️",
    rarity: 0,
    starter: true,
    archetype: "melee",
    growth: { str: 1.22, int: 0.72, dex: 0.92, will: 1.04, luck: 0.9 },
    skills: ["warrior_slash", "warrior_focus"],
    desc: "基础近战职业，稳定的直接输出。",
  },
  ranged: {
    name: "游侠",
    icon: "🏹",
    rarity: 0,
    starter: true,
    archetype: "ranged",
    growth: { str: 0.88, int: 0.75, dex: 1.28, will: 0.95, luck: 1.06 },
    skills: ["ranger_volley", "ranger_eye"],
    desc: "基础远程职业，强调速度与暴击。",
  },
  magic: {
    name: "法师",
    icon: "🔮",
    rarity: 0,
    starter: true,
    archetype: "magic",
    growth: { str: 0.7, int: 1.3, dex: 0.9, will: 1.08, luck: 0.96 },
    skills: ["mage_fireball", "mage_flow"],
    desc: "基础施法职业，强调智力与技能循环。",
  },
  guardian: {
    name: "守卫",
    icon: "🛡️",
    rarity: 1,
    archetype: "melee",
    growth: { str: 1.14, int: 0.78, dex: 0.9, will: 1.25, luck: 0.92 },
    skills: ["guard_wall", "guard_bastion"],
    desc: "用防御换稳定性的优秀职业。",
  },
  warlock: {
    name: "术士",
    icon: "🩸",
    rarity: 1,
    archetype: "magic",
    growth: { str: 0.82, int: 1.27, dex: 0.88, will: 1.12, luck: 1.02 },
    skills: ["warlock_drain", "warlock_pact"],
    desc: "依赖吸血维持战斗的优秀职业。",
  },
  hunter: {
    name: "猎人",
    icon: "🎯",
    rarity: 2,
    archetype: "ranged",
    growth: { str: 0.92, int: 0.8, dex: 1.34, will: 1.02, luck: 1.12 },
    skills: ["hunter_pierce", "hunter_execute", "hunter_instinct"],
    desc: "针对Boss和残血目标的稀有职业。",
  },
  paladin: {
    name: "圣骑士",
    icon: "☀️",
    rarity: 2,
    archetype: "melee",
    growth: { str: 1.16, int: 1.04, dex: 0.88, will: 1.27, luck: 0.98 },
    skills: ["paladin_strike", "paladin_heal", "paladin_oath"],
    desc: "攻击、治疗和生存兼备的稀有职业。",
  },
  assassin: {
    name: "刺客",
    icon: "🗡️",
    rarity: 3,
    archetype: "melee",
    growth: { str: 1.08, int: 0.82, dex: 1.38, will: 0.96, luck: 1.18 },
    skills: ["assassin_shadow", "assassin_corrosion", "assassin_instinct"],
    desc: "高暴击、高速度的史诗职业。",
  },
  elementalist: {
    name: "元素使",
    icon: "🔥",
    rarity: 3,
    archetype: "magic",
    growth: { str: 0.78, int: 1.42, dex: 1.02, will: 1.13, luck: 1.06 },
    skills: ["element_burst", "element_storm", "element_resonance"],
    desc: "多段法术与高技能频率的史诗职业。",
  },
  swordsaint: {
    name: "剑圣",
    icon: "🗡️",
    rarity: 4,
    archetype: "melee",
    growth: { str: 1.38, int: 0.78, dex: 1.25, will: 1.08, luck: 1.1 },
    skills: ["saint_slash", "saint_counter", "saint_heart"],
    desc: "纯粹进攻与反击结合的传说职业。",
  },
  chronomancer: {
    name: "时咏者",
    icon: "⏳",
    rarity: 4,
    archetype: "magic",
    growth: { str: 0.82, int: 1.38, dex: 1.12, will: 1.22, luck: 1.18 },
    skills: ["chrono_fracture", "chrono_rewind", "chrono_flow"],
    desc: "利用冷却和恢复控制节奏的传说职业。",
  },
  starwalker: {
    name: "星渊行者",
    icon: "🌠",
    rarity: 5,
    archetype: "ranged",
    growth: { str: 1.02, int: 1.26, dex: 1.45, will: 1.18, luck: 1.34 },
    skills: ["star_fall", "star_hunt", "star_constellation"],
    desc: "多段穿透与Boss猎杀能力极强的神话职业。",
  },
  nightking: {
    name: "永夜君王",
    icon: "👑",
    rarity: 5,
    archetype: "melee",
    growth: { str: 1.36, int: 1.22, dex: 1.12, will: 1.3, luck: 1.16 },
    skills: ["night_feast", "night_mirror", "night_throne"],
    desc: "近战谱系终点：吸血、镜返和高综合战斗力结合的神话职业。",
  },
  arcanesovereign: {
    name: "奥术主宰",
    icon: "🜲",
    rarity: 5,
    archetype: "magic",
    growth: { str: 0.76, int: 1.52, dex: 1.08, will: 1.34, luck: 1.26 },
    skills: ["arcane_cataclysm", "arcane_reversal", "arcane_authority"],
    desc: "法术谱系终点：以多段穿透、回溯治疗和法则掌控取代所有低阶法术。",
  },
};
const CLASS_LINEAGES = {
  melee: [
    "melee",
    "guardian",
    "paladin",
    "assassin",
    "swordsaint",
    "nightking",
  ],
  ranged: ["ranged", "hunter", "starwalker"],
  magic: [
    "magic",
    "warlock",
    "elementalist",
    "chronomancer",
    "arcanesovereign",
  ],
};
function classLineage(styleId) {
  return (
    Object.entries(CLASS_LINEAGES).find(([, ids]) =>
      ids.includes(styleId),
    )?.[0] || null
  );
}
function classLineageRank(styleId) {
  const line = classLineage(styleId);
  return line ? CLASS_LINEAGES[line].indexOf(styleId) : -1;
}
function coveredClassIds(styleId = state.style) {
  const line = classLineage(styleId),
    rank = classLineageRank(styleId);
  return line && rank >= 0
    ? CLASS_LINEAGES[line].slice(0, rank + 1)
    : [styleId];
}
function coveredClassSkills(styleId = state.style) {
  return coveredClassIds(styleId)
    .flatMap((id) => STYLES[id]?.skills || [])
    .filter((id) => SKILLS[id]);
}
function classArchetype(styleId = state.style) {
  return STYLES[styleId]?.archetype || "melee";
}
function identityRarityLabel(x) {
  const r = RARITIES[x?.rarity || 0];
  return `<span class="${r.cls}">${r.name}</span>`;
}
function identityGrowthText(x) {
  return Object.entries(x.growth)
    .map(([k, v]) => `${IDENTITY_STAT_NAMES[k]}×${Number(v).toFixed(2)}`)
    .join(" · ");
}
function raceTraitPowers() {
  return RACES[state.race]?.trait || {};
}
const MAPS = [
  {
    id: "meadow",
    name: "新月草原",
    cp: 117,
    mod: 0.0,
    gearTier: 1,
    petTier: 1,
    threatCap: 3,
    levels: [1, 7],
    monsters: ["幼角兔", "灰尾狸", "草原史莱姆"],
    boss: "月背巨狼",
    pet: "灰尾幼狼",
  },
  {
    id: "hill",
    name: "裂风丘陵",
    cp: 313,
    mod: 0.25,
    gearTier: 2,
    petTier: 2,
    threatCap: 4,
    levels: [8, 17],
    monsters: ["岩皮蜥", "狂风鹰", "丘陵鬣狗"],
    boss: "裂风狮王",
    pet: "裂风幼狮",
  },
  {
    id: "forest",
    name: "魂木森林",
    cp: 771,
    mod: 0.6,
    gearTier: 3,
    petTier: 3,
    threatCap: 5,
    levels: [18, 30],
    monsters: ["毒牙蛛", "苔甲兽", "幽光鹿"],
    boss: "千年树灵",
    pet: "树灵幼芽",
  },
  {
    id: "shore",
    name: "霜蚀海岸",
    cp: 1695,
    mod: 1.0,
    gearTier: 4,
    petTier: 4,
    threatCap: 6,
    levels: [31, 47],
    monsters: ["冰壳蟹", "冻原狼人", "霜鳍鱼人"],
    boss: "极寒海兽",
    pet: "霜鳍幼兽",
  },
  {
    id: "ruins",
    name: "失落王城",
    cp: 3795,
    mod: 1.55,
    gearTier: 5,
    petTier: 5,
    threatCap: 8,
    levels: [48, 68],
    monsters: ["王城亡魂", "黑甲守卫", "诅咒法师"],
    boss: "不灭王魂",
    pet: "王魂侍从",
  },
  {
    id: "abyss",
    name: "星渊尽头",
    cp: 9000,
    mod: 2.2,
    gearTier: 6,
    petTier: 6,
    threatCap: Infinity,
    levels: [58, 100],
    monsters: ["虚空猎犬", "星蚀魔像", "深渊观测者"],
    boss: "终焉星龙",
    pet: "星核幼龙",
  },
];
const MONSTER_TITLES = [
  {
    name: "虚弱的",
    w: 18,
    atkMul: 0.8,
    hpMul: 0.8,
    defMul: 1,
    xp: 0.5,
    gold: 0.5,
    drop: 0.7,
  },
  { name: "", w: 45, atkMul: 1, hpMul: 1, defMul: 1, xp: 1, gold: 1, drop: 1 },
  {
    name: "危险的",
    w: 18,
    atkMul: 2,
    hpMul: 2,
    defMul: 1,
    xp: 1.6,
    gold: 1.5,
    drop: 1.5,
  },
  {
    name: "精锐的",
    w: 10,
    atkMul: 3,
    hpMul: 3,
    defMul: 2,
    xp: 2.5,
    gold: 3,
    drop: 2.2,
  },
  {
    name: "古老的",
    w: 6,
    atkMul: 3,
    hpMul: 10,
    defMul: 1.5,
    xp: 4,
    gold: 10,
    drop: 2.8,
  },
  {
    name: "未知的",
    w: 3,
    atkMul: 2,
    hpMul: 3,
    defMul: 5,
    xp: 3,
    gold: 5,
    drop: 1.8,
  },
];
const TREASURE_MONSTER_CHANCE = 0.005;
const TREASURE_MONSTER_TITLE = {
  name: "",
  atkMul: 1.2,
  hpMul: 2,
  defMul: 1.15,
  xp: 2,
  gold: 100,
  drop: 3,
};
const BOSS_PREFIXES = [
  {
    id: "none",
    name: "",
    w: 58,
    hp: 1,
    atk: 1,
    def: 1,
    gold: 1,
    loot: 1,
    mechanic: "none",
    desc: "普通区域首领。",
  },
  {
    id: "hoarder",
    name: "藏珍",
    w: 25,
    hp: 1.05,
    atk: 1.03,
    def: 1,
    gold: 1.25,
    loot: 1.25,
    mechanic: "ward",
    desc: "掉宝×1.25；每4回合展开一次藏宝护盾。",
  },
  {
    id: "gilded",
    name: "镀金",
    w: 12,
    hp: 1.12,
    atk: 1.08,
    def: 1.04,
    gold: 1.75,
    loot: 1.5,
    mechanic: "armor",
    desc: "掉宝×1.50；前4回合拥有40%镀金减伤。",
  },
  {
    id: "blessed",
    name: "天眷",
    w: 4,
    hp: 1.22,
    atk: 1.15,
    def: 1.08,
    gold: 2.5,
    loot: 2,
    mechanic: "renewal",
    desc: "掉宝×2.00；每4回合恢复5%最大生命。",
  },
  {
    id: "astral",
    name: "星辉",
    w: 1,
    hp: 1.4,
    atk: 1.25,
    def: 1.12,
    gold: 5,
    loot: 3,
    mechanic: "ascension",
    desc: "掉宝×3.00；半血后升华，强化攻击、速度并获得护盾。",
  },
];
const QUALITY_SCORE_MULT = [1, 1.32, 1.75, 2.15, 2.65, 4.15];
function equipmentTier(mapDef = map(), sourceThreat = null) {
  return mapDef.gearTier || 1;
}
function gearTierScore(tier, rarity = 0) {
  return Math.round(
    32 *
      Math.pow(1.75, Math.max(0, tier - 1)) *
      (QUALITY_SCORE_MULT[rarity] || 1),
  );
}
function inferItemTier(it) {
  if (Number.isFinite(it.tier)) return Math.max(1, Math.round(it.tier));
  const src = MAPS.find((m) => m.id === it.sourceMap);
  if (src) return equipmentTier(src, it.sourceThreat || 0);
  return Math.max(1, Math.round(it.itemLevel || 1));
}
function inferItemLevel(it) {
  return inferItemTier(it);
}
function gearTargetScore(level, rarity = 0) {
  return gearTierScore(Math.max(1, Math.round(level)), rarity);
}
const RARITIES = [
  { name: "普通", cls: "r0", mult: 1, aff: 0, sell: 3 },
  { name: "优秀", cls: "r1", mult: 1.18, aff: 1, sell: 8 },
  { name: "稀有", cls: "r2", mult: 1.38, aff: 2, sell: 20 },
  { name: "史诗", cls: "r3", mult: 1.62, aff: 3, sell: 55 },
  { name: "传说", cls: "r4", mult: 1.92, aff: 4, sell: 150 },
  { name: "神话", cls: "r5", mult: 3.1, aff: 5, sell: 650 },
];
const SLOTS = ["weapon", "head", "armor", "boots", "ring", "amulet"];
const AMULET_ARCANES = {
  chrono: {
    name: "时间折叠",
    minRarity: 4,
    weight: 5,
    desc: "所有技能基础冷却-1回合。不会让冷却低于0。",
    score: 1.22,
  },
  huntclock: {
    name: "猎手罗盘",
    minRarity: 2,
    weight: 13,
    desc: "每轮遇见区域Boss所需普通怪数量-1，与时流法则共同生效；最终可降至0只，进入连续Boss战。",
    score: 1.11,
  },
  bloodpact: {
    name: "血契",
    minRarity: 2,
    weight: 16,
    desc: "玩家与出战宠物造成直接伤害时，按一定比例为玩家回复生命。",
    score: 1.14,
  },
  overcrit: {
    name: "超限视界",
    minRarity: 3,
    weight: 12,
    desc: "提高“原始暴击→实际暴击率”的转化效率，越接近100%收益越小。",
    score: 1.13,
  },
  resonance: {
    name: "咒术共鸣",
    minRarity: 2,
    weight: 15,
    desc: "所有技能触发率额外提高若干个百分点。",
    score: 1.12,
  },
  bloodline: {
    name: "血脉共振",
    minRarity: 3,
    weight: 12,
    desc: "宠物物种专属技能的伤害与治疗效果提高。",
    score: 1.1,
  },
  bossmark: {
    name: "首领猎印",
    minRarity: 2,
    weight: 17,
    desc: "区域Boss战中，玩家与宠物造成的伤害提高。",
    score: 1.1,
  },
};

/* ===== core-02.js ===== */
function amuletArcaneValue(id, rarity) {
  const r = clamp(Number(rarity) || 0, 0, 5);
  if (id === "chrono") return 1;
  if (id === "huntclock") return 1;
  if (id === "bloodpact") return [0, 0, 0.04, 0.055, 0.075, 0.1][r] || 0.04;
  if (id === "overcrit") return [0, 0, 0, 0.06, 0.1, 0.15][r] || 0.06;
  if (id === "resonance") return [0, 0, 0.02, 0.03, 0.04, 0.05][r] || 0.02;
  if (id === "bloodline") return [0, 0, 0, 0.1, 0.16, 0.24][r] || 0.1;
  if (id === "bossmark") return [0, 0, 0.06, 0.08, 0.11, 0.15][r] || 0.06;
  return 0;
}
function amuletArcaneText(a) {
  const def = AMULET_ARCANES[a?.id];
  if (!def) return "未知秘仪";
  const v = Number(a.value) || 0;
  if (a.id === "chrono") return `秘仪【${def.name}】：全技能冷却-1`;
  if (a.id === "huntclock") return `秘仪【${def.name}】：Boss循环普通怪需求-1`;
  if (a.id === "bloodpact")
    return `秘仪【${def.name}】：全域吸血${Math.round(v * 100)}%`;
  if (a.id === "overcrit")
    return `秘仪【${def.name}】：暴击转化效率+${Math.round(v * 100)}%`;
  if (a.id === "resonance")
    return `秘仪【${def.name}】：技能触发率+${Math.round(v * 100)}个百分点`;
  if (a.id === "bloodline")
    return `秘仪【${def.name}】：宠物专属技能效果+${Math.round(v * 100)}%`;
  if (a.id === "bossmark")
    return `秘仪【${def.name}】：对区域Boss伤害+${Math.round(v * 100)}%`;
  return `秘仪【${def.name}】`;
}
function rollAmuletArcanes(rarity) {
  const chance = [0, 0.05, 0.12, 0.28, 0.55, 1][rarity] || 0;
  if (Math.random() >= chance) return [];
  let count = 1;
  if (rarity >= 5 && Math.random() < 0.08) count = 2;
  else if (rarity === 4 && Math.random() < 0.02) count = 2;
  const pool = Object.entries(AMULET_ARCANES)
    .filter(([, x]) => rarity >= x.minRarity)
    .map(([id, x]) => ({ id, w: x.weight }));
  const out = [];
  for (let i = 0; i < count && pool.length; i++) {
    const total = pool.reduce((n, x) => n + x.w, 0);
    let roll = Math.random() * total,
      chosen = pool[0];
    for (const x of pool) {
      roll -= x.w;
      if (roll <= 0) {
        chosen = x;
        break;
      }
    }
    const pi = pool.findIndex((x) => x.id === chosen.id);
    if (pi >= 0) pool.splice(pi, 1);
    out.push({ id: chosen.id, value: amuletArcaneValue(chosen.id, rarity) });
  }
  return out;
}
function equippedAmuletArcanes() {
  const it = state.equipment?.amulet;
  return it && Array.isArray(it.arcanes) ? it.arcanes : [];
}
function amuletPowers() {
  const p = {
    cooldown: 0,
    bossNeed: 0,
    lifesteal: 0,
    critEfficiency: 0,
    skillChance: 0,
    petSpecies: 0,
    bossDamage: 0,
  };
  for (const a of equippedAmuletArcanes()) {
    const v = Number(a.value) || 0;
    if (a.id === "chrono") p.cooldown += 1;
    else if (a.id === "huntclock") p.bossNeed += 1;
    else if (a.id === "bloodpact") p.lifesteal += v;
    else if (a.id === "overcrit") p.critEfficiency += v;
    else if (a.id === "resonance") p.skillChance += v;
    else if (a.id === "bloodline") p.petSpecies += v;
    else if (a.id === "bossmark") p.bossDamage += v;
  }
  return p;
}
function amuletArcaneScoreMultiplier(it) {
  if (it?.slot !== "amulet" || !Array.isArray(it.arcanes) || !it.arcanes.length)
    return 1;
  let m = 1;
  for (const a of it.arcanes) {
    const def = AMULET_ARCANES[a.id];
    if (def) m *= def.score || 1.08;
  }
  if (it.arcanes.length >= 2) m *= 1.06;
  return m;
}
function applyAmuletCritEfficiency(actual) {
  const e = clamp(
    amuletPowers().critEfficiency + (raceTraitPowers().critEfficiency || 0),
    0,
    0.5,
  );
  return 100 - (100 - actual) * (1 - e);
}
function healFromGlobalLifesteal(damage, label = "") {
  const pct = amuletPowers().lifesteal + (passiveSkillTotals().lifesteal || 0);
  if (pct <= 0 || damage <= 0 || state.hp <= 0) return 0;
  const s = stats(),
    h = Math.max(1, Math.round(damage * pct * (raceTraitPowers().drain || 1))),
    before = state.hp;
  state.hp = Math.min(s.maxHp, state.hp + h);
  const healed = Math.max(0, state.hp - before);
  if (healed > 0 && label)
    log(`从${label}中汲取${healed}生命。`, "skill", "defense");
  return healed;
}
function gearStatTierPower(tier) {
  return Math.pow(1.43, Math.max(0, tier - 1));
}
function rollAffixValue(a, tier, rarity) {
  const q = QUALITY_STAT_MULT[rarity] || 1,
    base = rnd(a.min, a.max);
  if (a.curve === "crit")
    return Math.max(
      1,
      Math.round(base * (1 + 0.15 * (tier - 1)) * Math.pow(q, 0.55)),
    );
  return Math.max(1, Math.round(base * gearStatTierPower(tier) * q));
}
function expectedAffixValue(stat, tier, rarity) {
  const a = AFFIXES.find((x) => x.stat === stat);
  if (!a) return 1;
  const q = QUALITY_STAT_MULT[rarity] || 1,
    base = (a.min + a.max) / 2;
  if (a.curve === "crit")
    return Math.max(0.5, base * (1 + 0.15 * (tier - 1)) * Math.pow(q, 0.55));
  return Math.max(0.5, base * gearStatTierPower(tier) * q);
}
const GEAR_STAT_NAMES = {
  atk: "攻击",
  crit: "暴击",
  str: "力量",
  dex: "敏捷",
  int: "智力",
  will: "意志",
  luck: "幸运",
  hp: "生命",
  mp: "法力",
  def: "防御",
};
const GEAR_SCORE_DEFAULTS = {
  melee: ["crit", "str", "atk"],
  ranged: ["crit", "dex", "atk"],
  magic: ["int", "mp", "atk"],
};
const GEAR_STYLE_WEIGHTS = {
  melee: {
    atk: 1.1,
    crit: 1.2,
    str: 1.2,
    dex: 0.55,
    int: 0.08,
    will: 0.55,
    luck: 0.4,
    hp: 0.65,
    mp: 0.12,
    def: 0.65,
  },
  ranged: {
    atk: 1.05,
    crit: 1.4,
    str: 0.3,
    dex: 1.15,
    int: 0.08,
    will: 0.4,
    luck: 0.55,
    hp: 0.55,
    mp: 0.12,
    def: 0.55,
  },
  magic: {
    atk: 1.05,
    crit: 0.65,
    str: 0.08,
    dex: 0.25,
    int: 1.25,
    will: 0.7,
    luck: 0.4,
    hp: 0.5,
    mp: 1.0,
    def: 0.5,
  },
};
const GEAR_AFFIX_AVG = {
  str: 3,
  int: 3,
  dex: 3,
  will: 3,
  luck: 3,
  hp: 15,
  mp: 11,
  crit: 3,
  def: 3,
};
const GEAR_PREF_BONUS = { primary: 0.55, secondary: 0.3, tertiary: 0.15 };
function defaultGearScorePrefs(style = state.style) {
  const d = GEAR_SCORE_DEFAULTS[STYLES[style]?.archetype || style] || [
    "atk",
    "hp",
    "def",
  ];
  return { primary: d[0], secondary: d[1], tertiary: d[2] };
}
function ensureGearScorePrefs() {
  const defaults = defaultGearScorePrefs(),
    current = state.gearScorePrefs || {},
    valid = new Set(Object.keys(GEAR_STAT_NAMES)),
    p = {
      primary: valid.has(current.primary) ? current.primary : defaults.primary,
      secondary: valid.has(current.secondary)
        ? current.secondary
        : defaults.secondary,
      tertiary: valid.has(current.tertiary)
        ? current.tertiary
        : defaults.tertiary,
    },
    seen = new Set();
  ["primary", "secondary", "tertiary"].forEach((k) => {
    if (seen.has(p[k])) p[k] = null;
    else if (p[k]) seen.add(p[k]);
  });
  state.gearScorePrefs = p;
  return p;
}
function setGearScorePref(rank, value) {
  const p = ensureGearScorePrefs(),
    v = value || null;
  Object.keys(p).forEach((k) => {
    if (k !== rank && p[k] === v) p[k] = null;
  });
  p[rank] = v;
  state.gearScorePrefs = p;
  save();
  render();
}
function resetGearScorePrefs() {
  state.gearScorePrefs = defaultGearScorePrefs();
  save();
  render();
}
function gearScoreWeights() {
  const w = {
      ...(GEAR_STYLE_WEIGHTS[classArchetype()] || GEAR_STYLE_WEIGHTS.melee),
    },
    p = ensureGearScorePrefs();
  Object.entries(GEAR_PREF_BONUS).forEach(([rank, bonus]) => {
    const stat = p[rank];
    if (stat) w[stat] = (w[stat] ?? 0.2) + bonus;
  });
  return w;
}
function gearAffixCounts(it) {
  const c = {};
  if (Array.isArray(it.affixes) && it.affixes.length) {
    it.affixes.forEach((a) => {
      if (a?.stat) c[a.stat] = (c[a.stat] || 0) + 1;
    });
  } else {
    Object.keys(it.stats || {}).forEach((stat) => {
      if (stat !== "atk" || it.slot !== "weapon") c[stat] = (c[stat] || 0) + 1;
    });
  }
  return c;
}
function gearFocusMultiplier(it) {
  const prefs = ensureGearScorePrefs(),
    counts = gearAffixCounts(it),
    n = Math.max(1, (it.affixes || []).length || Object.keys(counts).length);
  let bonus = 1;
  const primary = counts[prefs.primary] || 0,
    secondary = counts[prefs.secondary] || 0,
    tertiary = counts[prefs.tertiary] || 0;
  if (primary >= 2) bonus += Math.min(0.24, (primary - 1) * 0.05);
  if (secondary >= 2) bonus += Math.min(0.1, (secondary - 1) * 0.025);
  if (tertiary >= 2) bonus += Math.min(0.05, (tertiary - 1) * 0.0125);
  const maxCount = Math.max(0, ...Object.values(counts));
  if (maxCount === n && n >= 4) bonus += 0.08;
  return bonus;
}
function weaponScoreFactor(it) {
  if (it.slot !== "weapon" || !it.weaponType) return 1;
  const wt = WEAPON_TYPES[it.weaponType];
  if (!wt) return 1;
  if (!wt.styles.includes(classArchetype())) return 0.66;
  return (
    {
      sword: 1.05,
      axe: 1.07,
      bow: 1.11,
      crossbow: 1.1,
      staff: 1.13,
      tome: 1.1,
    }[it.weaponType] || 1.04
  );
}
function baseItemScore(it) {
  return Math.round(
    (it.score || gearTargetScore(inferItemLevel(it), it.rarity || 0)) *
      (1 + (it.refine || 0) * 0.08),
  );
}
function gearScoreBreakdown(it) {
  const base = baseItemScore(it),
    tier = inferItemTier(it),
    rarity = it.rarity || 0,
    weights = gearScoreWeights(),
    refineMult = 1 + (it.refine || 0) * 0.08;
  let neutral = 0,
    weighted = 0,
    parts = 0;
  const useful = [],
    weak = [];
  const addPart = (stat, value, expected) => {
    const unit = Math.max(0.05, value / Math.max(0.25, expected)),
      w = weights[stat] ?? 0.2;
    neutral += unit;
    weighted += unit * w;
    parts++;
    if (w >= 1.15) useful.push(stat);
    else if (w <= 0.3) weak.push(stat);
  };
  if (Array.isArray(it.affixes) && it.affixes.length) {
    it.affixes.forEach((a) =>
      addPart(
        a.stat,
        (a.value || 0) * refineMult,
        expectedAffixValue(a.stat, tier, rarity),
      ),
    );
    const q = QUALITY_STAT_MULT[rarity] || 1,
      tp = gearStatTierPower(tier);
    if (it.slot === "weapon") {
      const affAtk = it.affixes
          .filter((a) => a.stat === "atk")
          .reduce((n, a) => n + (a.value || 0), 0),
        baseAtk = Math.max(0, (it.stats?.atk || 0) - affAtk);
      if (baseAtk > 0) addPart("atk", baseAtk * refineMult, (6 + 10 * tp) * q);
    }
    if (it.slot === "armor") {
      const affDef = it.affixes
          .filter((a) => a.stat === "def")
          .reduce((n, a) => n + (a.value || 0), 0),
        baseDef = Math.max(0, (it.stats?.def || 0) - affDef);
      if (baseDef > 0) addPart("def", baseDef * refineMult, (3 + 4.5 * tp) * q);
    }
  } else {
    Object.entries(it.stats || {}).forEach(([stat, raw]) => {
      let expected = expectedAffixValue(stat, tier, rarity);
      if (stat === "atk" && it.slot === "weapon")
        expected =
          (6 + 10 * gearStatTierPower(tier)) * (QUALITY_STAT_MULT[rarity] || 1);
      addPart(stat, raw * refineMult, expected);
    });
  }
  const avgFit = neutral > 0 ? weighted / neutral : 0.75,
    expectedParts = Math.max(1, parts),
    rollQuality = clamp(neutral / expectedParts, 0.8, 1.22);
  let fit = (0.64 + 0.36 * avgFit) * (0.91 + 0.09 * rollQuality);
  fit *=
    weaponScoreFactor(it) *
    gearFocusMultiplier(it) *
    amuletArcaneScoreMultiplier(it);
  fit = clamp(fit, 0.45, 1.95);
  const score = Math.max(1, Math.round(base * fit)),
    prefs = ensureGearScorePrefs(),
    hits = ["primary", "secondary", "tertiary"]
      .filter(
        (k) =>
          prefs[k] &&
          Object.prototype.hasOwnProperty.call(it.stats || {}, prefs[k]),
      )
      .map((k) => prefs[k]);
  return {
    base,
    fit,
    score,
    useful: [...new Set(useful)],
    weak: [...new Set(weak)],
    hits,
  };
}
function gearFitLabel(it) {
  const b = gearScoreBreakdown(it);
  if (b.fit >= 1.16) return ["核心适配", "risk-safe"];
  if (b.fit >= 1) return ["高度适配", "risk-safe"];
  if (b.fit >= 0.84) return ["一般适配", "risk-even"];
  return ["低适配", "risk-hard"];
}

/* ===== core-03.js ===== */
function gearScoreDetail(it) {
  const b = gearScoreBreakdown(it),
    label = gearFitLabel(it),
    parts = [`${label[0]} ${(b.fit * 100).toFixed(0)}%`, `基础${b.base}`],
    counts = gearAffixCounts(it),
    prefs = ensureGearScorePrefs();
  if (b.hits.length)
    parts.push(`命中偏好：${b.hits.map((x) => GEAR_STAT_NAMES[x]).join("、")}`);
  const pc = counts[prefs.primary] || 0;
  if (pc >= 2) parts.push(`核心词条集中×${pc}`);
  const maxEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (maxEntry && maxEntry[1] >= 4)
    parts.push(
      `极品专精：${GEAR_STAT_NAMES[maxEntry[0]] || maxEntry[0]}×${maxEntry[1]}`,
    );
  if (Array.isArray(it.arcanes) && it.arcanes.length)
    parts.push(`项链秘仪：${it.arcanes.map(amuletArcaneText).join("、")}`);
  if (b.weak.length)
    parts.push(
      `低价值词条：${b.weak.map((x) => GEAR_STAT_NAMES[x]).join("、")}`,
    );
  return parts.join("｜");
}
const SKILLS = {
  warrior_slash: {
    name: "裂甲重斩",
    classId: "melee",
    type: "active",
    cat: "attack",
    baseChance: 0.26,
    cooldown: 2,
    kind: "damage",
    mult: 1.85,
    desc: "稳定的高倍率近战斩击。",
  },
  warrior_focus: {
    name: "战意",
    classId: "melee",
    type: "passive",
    effects: { atkPct: 0.07 },
    desc: "装备后提高攻击；随胜利战斗成长。",
  },
  ranger_volley: {
    name: "疾风连射",
    classId: "ranged",
    type: "active",
    cat: "attack",
    baseChance: 0.29,
    cooldown: 2,
    kind: "damage",
    mult: 0.88,
    hits: 2,
    desc: "连续两次远程攻击。",
  },
  ranger_eye: {
    name: "鹰眼",
    classId: "ranged",
    type: "passive",
    effects: { crit: 4, speedPct: 0.04 },
    desc: "提高原始暴击和速度。",
  },
  mage_fireball: {
    name: "灼星火球",
    classId: "magic",
    type: "active",
    cat: "attack",
    baseChance: 0.3,
    cooldown: 2,
    kind: "damage",
    mult: 2.05,
    mp: 8,
    desc: "基础但可靠的高伤害法术。",
  },
  mage_flow: {
    name: "魔力潮汐",
    classId: "magic",
    type: "passive",
    effects: { mpPct: 0.12, skillChance: 0.025 },
    desc: "提高法力上限和技能触发率。",
  },
  guard_wall: {
    name: "钢铁壁垒",
    classId: "guardian",
    type: "active",
    cat: "defense",
    baseChance: 0.27,
    cooldown: 2,
    kind: "reduce",
    reduce: 0.52,
    desc: "受击前显著降低本次伤害。",
  },
  guard_bastion: {
    name: "不动堡垒",
    classId: "guardian",
    type: "passive",
    effects: { defPct: 0.12, hpPct: 0.08 },
    desc: "提高防御和生命上限。",
  },
  warlock_drain: {
    name: "血蚀",
    classId: "warlock",
    type: "active",
    cat: "attack",
    baseChance: 0.24,
    cooldown: 3,
    kind: "drain",
    mult: 1.55,
    drain: 0.32,
    mp: 7,
    desc: "造成伤害并吸取生命。",
  },
  warlock_pact: {
    name: "黑血契约",
    classId: "warlock",
    type: "passive",
    effects: { lifesteal: 0.05, hpPct: 0.04 },
    desc: "所有直接伤害获得额外吸血。",
  },
  hunter_pierce: {
    name: "穿心箭",
    classId: "hunter",
    type: "active",
    cat: "attack",
    baseChance: 0.24,
    cooldown: 2,
    kind: "damage",
    mult: 2.1,
    ignore: 0.52,
    desc: "高伤害并无视大量防御。",
  },
  hunter_execute: {
    name: "猎杀标记",
    classId: "hunter",
    type: "active",
    cat: "attack",
    baseChance: 0.14,
    cooldown: 4,
    kind: "execute",
    mult: 1.45,
    executeThreshold: 0.35,
    executeMult: 3.15,
    desc: "目标生命较低时造成巨额伤害。",
  },
  hunter_instinct: {
    name: "猎手本能",
    classId: "hunter",
    type: "passive",
    effects: { bossDamage: 0.1, crit: 2 },
    desc: "提高对Boss伤害和原始暴击。",
  },
  paladin_strike: {
    name: "圣裁",
    classId: "paladin",
    type: "active",
    cat: "attack",
    baseChance: 0.22,
    cooldown: 2,
    kind: "damage",
    mult: 2.05,
    desc: "稳定的圣光重击。",
  },
  paladin_heal: {
    name: "圣愈",
    classId: "paladin",
    type: "active",
    cat: "defense",
    baseChance: 0.19,
    cooldown: 4,
    kind: "heal",
    threshold: 0.62,
    healPct: 0.3,
    intScale: 0.85,
    mp: 10,
    desc: "低生命时自动治疗。",
  },
  paladin_oath: {
    name: "守誓",
    classId: "paladin",
    type: "passive",
    effects: { hpPct: 0.1, healing: 0.15 },
    desc: "提高生命上限和所有治疗效果。",
  },
  assassin_shadow: {
    name: "影袭",
    classId: "assassin",
    type: "active",
    cat: "attack",
    baseChance: 0.25,
    cooldown: 2,
    kind: "damage",
    mult: 2.45,
    ignore: 0.22,
    desc: "快速而致命的高倍率攻击。",
  },
  assassin_corrosion: {
    name: "蚀骨刃",
    classId: "assassin",
    type: "active",
    cat: "attack",
    baseChance: 0.16,
    cooldown: 4,
    kind: "debuff",
    mult: 1.45,
    debuffTurns: 4,
    debuffArmor: 0.28,
    desc: "造成伤害并降低敌人防御。",
  },
  assassin_instinct: {
    name: "杀意",
    classId: "assassin",
    type: "passive",
    effects: { crit: 6, critDmg: 0.12, speedPct: 0.05 },
    desc: "提高暴击、暴伤和速度。",
  },
  element_burst: {
    name: "元素爆裂",
    classId: "elementalist",
    type: "active",
    cat: "attack",
    baseChance: 0.24,
    cooldown: 2,
    kind: "damage",
    mult: 0.92,
    hits: 3,
    mp: 14,
    desc: "三段元素伤害。",
  },
  element_storm: {
    name: "灾变风暴",
    classId: "elementalist",
    type: "active",
    cat: "attack",
    baseChance: 0.14,
    cooldown: 4,
    kind: "damage",
    mult: 3.2,
    mp: 24,
    ignore: 0.18,
    desc: "高耗魔的强力元素爆发。",
  },
  element_resonance: {
    name: "元素共鸣",
    classId: "elementalist",
    type: "passive",
    effects: { skillChance: 0.04, mpPct: 0.1 },
    desc: "提高技能触发率与法力上限。",
  },
  saint_slash: {
    name: "天隙一闪",
    classId: "swordsaint",
    type: "active",
    cat: "attack",
    baseChance: 0.22,
    cooldown: 2,
    kind: "damage",
    mult: 3.05,
    ignore: 0.25,
    desc: "传说级单体斩击。",
  },
  saint_counter: {
    name: "无想反击",
    classId: "swordsaint",
    type: "active",
    cat: "defense",
    baseChance: 0.18,
    cooldown: 3,
    kind: "counter",
    counterMult: 1.65,
    desc: "受击后立即进行强力反击。",
  },
  saint_heart: {
    name: "剑心",
    classId: "swordsaint",
    type: "passive",
    effects: { atkPct: 0.1, speedPct: 0.07 },
    desc: "提高攻击与速度。",
  },
  chrono_fracture: {
    name: "时隙断层",
    classId: "chronomancer",
    type: "active",
    cat: "attack",
    baseChance: 0.22,
    cooldown: 3,
    kind: "damage",
    mult: 2.75,
    mp: 18,
    ignore: 0.2,
    desc: "切开时间造成高额法术伤害。",
  },
  chrono_rewind: {
    name: "回溯",
    classId: "chronomancer",
    type: "active",
    cat: "defense",
    baseChance: 0.18,
    cooldown: 4,
    kind: "heal",
    threshold: 0.68,
    healPct: 0.38,
    intScale: 1.05,
    mp: 16,
    desc: "将生命状态回溯到更安全的位置。",
  },
  chrono_flow: {
    name: "时间流",
    classId: "chronomancer",
    type: "passive",
    effects: { cooldown: 1, skillChance: 0.03 },
    desc: "所有主动技能冷却-1，技能触发率提高。",
  },
  star_fall: {
    name: "星陨连矢",
    classId: "starwalker",
    type: "active",
    cat: "attack",
    baseChance: 0.22,
    cooldown: 2,
    kind: "damage",
    mult: 0.92,
    hits: 4,
    ignore: 0.28,
    desc: "四段星陨穿透攻击。",
  },
  star_hunt: {
    name: "终星狩猎",
    classId: "starwalker",
    type: "active",
    cat: "attack",
    baseChance: 0.13,
    cooldown: 4,
    kind: "execute",
    mult: 1.8,
    executeThreshold: 0.4,
    executeMult: 4.1,
    ignore: 0.2,
    desc: "神话级终结技能。",
  },
  star_constellation: {
    name: "猎星座",
    classId: "starwalker",
    type: "passive",
    effects: { bossDamage: 0.15, skillChance: 0.05, crit: 4 },
    desc: "大幅强化Boss战和技能触发。",
  },
  night_feast: {
    name: "永夜血宴",
    classId: "nightking",
    type: "active",
    cat: "attack",
    baseChance: 0.22,
    cooldown: 3,
    kind: "drain",
    mult: 2.55,
    drain: 0.42,
    desc: "高伤害并大量吸血。",
  },
  night_mirror: {
    name: "暗夜王镜",
    classId: "nightking",
    type: "active",
    cat: "defense",
    baseChance: 0.17,
    cooldown: 4,
    kind: "mirror",
    reduce: 0.58,
    reflect: 0.58,
    desc: "减伤并反射大量实际伤害。",
  },
  night_throne: {
    name: "黑王座",
    classId: "nightking",
    type: "passive",
    effects: { atkPct: 0.12, hpPct: 0.12, defPct: 0.08 },
    desc: "同时提高攻击、生命和防御。",
  },
  arcane_cataclysm: {
    name: "万象崩解",
    classId: "arcanesovereign",
    type: "active",
    cat: "attack",
    baseChance: 0.23,
    cooldown: 3,
    kind: "damage",
    mult: 0.88,
    hits: 5,
    mp: 28,
    ignore: 0.3,
    desc: "五段神话法术，贯穿高防御目标。",
  },
  arcane_reversal: {
    name: "命轨逆转",
    classId: "arcanesovereign",
    type: "active",
    cat: "defense",
    baseChance: 0.2,
    cooldown: 4,
    kind: "heal",
    threshold: 0.72,
    healPct: 0.45,
    intScale: 1.2,
    mp: 20,
    desc: "在危险时回溯生命，取代低阶治疗与防护法术。",
  },
  arcane_authority: {
    name: "奥术权柄",
    classId: "arcanesovereign",
    type: "passive",
    effects: { cooldown: 1, skillChance: 0.06, mpPct: 0.2 },
    desc: "冷却-1，显著提高技能触发率与法力上限。",
  },
};
const SPECIAL_SKILL_IDS = [];
const ACTIVE_SKILL_LEVEL_THRESHOLDS = [
  0, 25, 70, 150, 280, 460, 700, 1050, 1500, 2200,
];
const PASSIVE_SKILL_LEVEL_THRESHOLDS = [
  0, 18, 55, 120, 220, 360, 540, 780, 1100, 1500,
];
const SKILL_LEVEL_THRESHOLDS = ACTIVE_SKILL_LEVEL_THRESHOLDS;
function skillThresholds(id) {
  return SKILLS[id]?.type === "passive"
    ? PASSIVE_SKILL_LEVEL_THRESHOLDS
    : ACTIVE_SKILL_LEVEL_THRESHOLDS;
}
function skillLevel(id) {
  const uses = state.skillUse?.[id] || 0,
    th = skillThresholds(id);
  let lv = 1;
  for (let i = 1; i < th.length; i++) {
    if (uses >= th[i]) lv = i + 1;
    else break;
  }
  return clamp(lv, 1, 10);
}
function skillNextUses(id) {
  const lv = skillLevel(id),
    th = skillThresholds(id);
  return lv >= 10 ? null : th[lv];
}
function isNativeSkill(id) {
  return coveredClassIds(state.style).includes(SKILLS[id]?.classId);
}
function skillPower(id) {
  const lv = skillLevel(id),
    base = 1 + (lv - 1) * 0.06;
  return base * (isNativeSkill(id) ? 1.15 : 1);
}
function passiveScale(id) {
  const lv = skillLevel(id);
  return (0.55 + lv * 0.05) * (isNativeSkill(id) ? 1.1 : 1);
}
function skillTriggerChance(id, s = null) {
  const sk = SKILLS[id],
    lv = skillLevel(id),
    ctx = s || stats(),
    bonus = ctx?.skillChance || 0;
  return clamp((sk.baseChance || 0) + (lv - 1) * 0.025 + bonus, 0.01, 1);
}
function skillProgressPct(id) {
  const lv = skillLevel(id),
    uses = state.skillUse?.[id] || 0,
    th = skillThresholds(id);
  if (lv >= 10) return 100;
  const lo = th[lv - 1],
    hi = th[lv];
  return clamp(Math.round(((uses - lo) / (hi - lo)) * 100), 0, 100);
}
function masteryBonusText(id) {
  return "技能已满级；职业解锁时就已永久可用";
}
function skillMasteryTotals() {
  return {
    hpPct: 0,
    mpPct: 0,
    atkPct: 0,
    defPct: 0,
    speedPct: 0,
    crit: 0,
    critDmg: 0,
    skillChance: 0,
  };
}
function passiveSkillTotals() {
  const out = {
    hpPct: 0,
    mpPct: 0,
    atkPct: 0,
    defPct: 0,
    speedPct: 0,
    crit: 0,
    critDmg: 0,
    skillChance: 0,
    bossDamage: 0,
    lifesteal: 0,
    cooldown: 0,
    healing: 0,
    ignoreDef: 0,
  };
  for (const id of state.passiveSkillSlots || []) {
    const sk = SKILLS[id];
    if (!sk || sk.type !== "passive" || !skillUsable(id)) continue;
    const scale = passiveScale(id);
    Object.entries(sk.effects || {}).forEach(([k, v]) => {
      if (k === "cooldown") out[k] = Math.max(out[k], Math.round(v));
      else out[k] = (out[k] || 0) + v * scale;
    });
  }
  if (
    typeof window !== "undefined" &&
    typeof window.buildSynergies === "function"
  )
    window
      .buildSynergies()
      .forEach((s) =>
        Object.entries(s.effects || {}).forEach(
          ([k, v]) => (out[k] = (out[k] || 0) + v),
        ),
      );
  return out;
}
function classNativeSkills(styleId = state.style) {
  return (STYLES[styleId]?.skills || []).filter((id) => SKILLS[id]);
}
function skillUsable(id) {
  const sk = SKILLS[id];
  if (!sk) return false;
  return (state.unlockedClasses || []).includes(sk.classId);
}
function unlockedSkills() {
  return Object.keys(SKILLS).filter(skillUsable);
}
function nativeActiveSkills(styleId = state.style) {
  return classNativeSkills(styleId).filter(
    (id) => SKILLS[id].type === "active",
  );
}
function nativePassiveSkills(styleId = state.style) {
  return classNativeSkills(styleId).filter(
    (id) => SKILLS[id].type === "passive",
  );
}
function syncSkills() {
  state.skills = state.skills || {};
  state.skillUse = state.skillUse || {};
  state.skillMastered = state.skillMastered || {};
  state.activeSkillSlots = Array.isArray(state.activeSkillSlots)
    ? state.activeSkillSlots
        .filter((id) => SKILLS[id]?.type === "active" && skillUsable(id))
        .slice(0, 3)
    : [];
  state.passiveSkillSlots = Array.isArray(state.passiveSkillSlots)
    ? state.passiveSkillSlots
        .filter((id) => SKILLS[id]?.type === "passive" && skillUsable(id))
        .slice(0, 2)
    : [];
  for (const id of unlockedSkills()) {
    if (state.skillUse[id] === undefined) state.skillUse[id] = 0;
    if (skillLevel(id) >= 10) state.skillMastered[id] = true;
  }
  if (!state.activeSkillSlots.length)
    state.activeSkillSlots = nativeActiveSkills().slice(0, 3);
  if (!state.passiveSkillSlots.length)
    state.passiveSkillSlots = nativePassiveSkills().slice(0, 2);
  state.skillPriority = {
    attack: state.activeSkillSlots.filter((id) => SKILLS[id]?.cat === "attack"),
    defense: state.activeSkillSlots.filter(
      (id) => SKILLS[id]?.cat === "defense",
    ),
  };
  state.activeSkillSlots.forEach((id) => (state.skills[id] = true));
}
function registerSkillUse(id) {
  if (!id || SKILLS[id]?.type !== "active") return;
  const oldLv = skillLevel(id),
    mult = rebirthProfile().skillMastery;
  let gain = Math.floor(mult),
    fraction = mult - gain;
  if (Math.random() < fraction) gain++;
  gain = Math.max(1, gain);
  state.skillUse[id] = (state.skillUse[id] || 0) + gain;
  const newLv = skillLevel(id);
  if (newLv > oldLv)
    log(`${SKILLS[id].name}提升至Lv.${newLv}。`, "sys", "system");
  if (newLv >= 10 && !state.skillMastered?.[id]) {
    state.skillMastered[id] = true;
    log(
      `【技能满级】${SKILLS[id].name}达到Lv.10，效果成长完成。`,
      "important",
      "important",
    );
  }
}

/* ===== core-04.js ===== */
function registerPassiveBattleWin() {
  for (const id of state.passiveSkillSlots || []) {
    const sk = SKILLS[id];
    if (!sk || sk.type !== "passive" || !skillUsable(id)) continue;
    const oldLv = skillLevel(id),
      mult = rebirthProfile().skillMastery;
    let gain = Math.floor(mult),
      fraction = mult - gain;
    if (Math.random() < fraction) gain++;
    gain = Math.max(1, gain);
    state.skillUse[id] = (state.skillUse[id] || 0) + gain;
    const newLv = skillLevel(id);
    if (newLv > oldLv)
      log(`${sk.name}随实战提升至Lv.${newLv}。`, "sys", "system");
    if (newLv >= 10 && !state.skillMastered?.[id]) {
      state.skillMastered[id] = true;
      log(
        `【被动满级】${sk.name}达到Lv.10，效果成长完成。`,
        "important",
        "important",
      );
    }
  }
}
function skillReady(id) {
  return (state.skillReadyAt?.[id] || 0) <= (state.combatTurn || 0);
}
function skillCooldownRemaining(id) {
  const ready = state.skillReadyAt?.[id] || 0,
    now = state.combatTurn || 0;
  if (ready <= now) return 0;
  return Math.max(0, ready - now - 1);
}
function setSkillCooldown(id) {
  state.skillReadyAt = state.skillReadyAt || {};
  const passive = passiveSkillTotals(),
    cd = Math.max(
      0,
      (SKILLS[id]?.cooldown || 0) -
        amuletPowers().cooldown -
        (passive.cooldown || 0),
    );
  state.skillReadyAt[id] = (state.combatTurn || 0) + cd + 1;
}
function syncSkillPriority() {
  syncSkills();
}
function moveSkillPriority(id, dir) {
  const arr = state.activeSkillSlots || [],
    i = arr.indexOf(id),
    j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  syncSkills();
  save();
  render();
}
function skillPriorityRank(id) {
  const i = (state.activeSkillSlots || []).indexOf(id);
  return i < 0 ? 999 : i;
}
function toggleActiveSkill(id) {
  if (!SKILLS[id] || SKILLS[id].type !== "active" || !skillUsable(id)) return;
  state.activeSkillSlots = state.activeSkillSlots || [];
  const i = state.activeSkillSlots.indexOf(id);
  if (i >= 0) state.activeSkillSlots.splice(i, 1);
  else {
    if (state.activeSkillSlots.length >= 3)
      return alert("主动技能槽最多3个，请先卸下一个。");
    state.activeSkillSlots.push(id);
  }
  syncSkills();
  save();
  render();
}
function togglePassiveSkill(id) {
  if (!SKILLS[id] || SKILLS[id].type !== "passive" || !skillUsable(id)) return;
  state.passiveSkillSlots = state.passiveSkillSlots || [];
  const i = state.passiveSkillSlots.indexOf(id);
  if (i >= 0) state.passiveSkillSlots.splice(i, 1);
  else {
    if (state.passiveSkillSlots.length >= 2)
      return alert("被动技能槽最多2个，请先卸下一个。");
    state.passiveSkillSlots.push(id);
  }
  syncSkills();
  save();
  render();
}
function equipNativeClassSet(styleId = state.style) {
  if (styleId !== state.style) return;
  state.activeSkillSlots = nativeActiveSkills(styleId).slice(0, 3);
  state.passiveSkillSlots = nativePassiveSkills(styleId).slice(0, 2);
  syncSkills();
  save();
  render();
}
function skillEffectText(id) {
  const sk = SKILLS[id],
    lv = skillLevel(id),
    p = skillPower(id),
    pct = (n) => Math.round(n * 100);
  if (sk.type === "passive") {
    const names = {
        hpPct: "生命",
        mpPct: "法力",
        atkPct: "攻击",
        defPct: "防御",
        speedPct: "速度",
        crit: "原始暴击",
        critDmg: "暴击伤害",
        skillChance: "技能触发",
        bossDamage: "Boss伤害",
        lifesteal: "吸血",
        cooldown: "冷却",
        healing: "治疗",
        ignoreDef: "无视防御",
      },
      scale = passiveScale(id);
    return Object.entries(sk.effects || {})
      .map(([k, v]) => {
        if (k === "cooldown") return `${names[k]}-${Math.round(v)}`;
        if (k === "crit") return `${names[k]}+${(v * scale).toFixed(1)}`;
        return `${names[k]}+${Math.round(v * scale * 100)}%`;
      })
      .join(" · ");
  }
  if (sk.kind === "damage")
    return `${sk.hits || 1}段，单段${pct(sk.mult * p)}%伤害${sk.ignore ? `，无视${pct(sk.ignore)}%防御` : ""}`;
  if (sk.kind === "drain")
    return `造成${pct(sk.mult * p)}%伤害，吸血${pct(sk.drain * (1 + (lv - 1) * 0.03))}%`;
  if (sk.kind === "execute")
    return `常规${pct(sk.mult * p)}%伤害；敌人≤${pct(sk.executeThreshold)}%生命时${pct(sk.executeMult * p)}%`;
  if (sk.kind === "debuff")
    return `${pct(sk.mult * p)}%伤害，并降低敌人${pct(sk.debuffArmor)}%防御${sk.debuffTurns}回合`;
  if (sk.kind === "reduce")
    return `本次伤害降低${Math.min(85, pct(sk.reduce * p))}%`;
  if (sk.kind === "counter")
    return `受击后反击，造成${pct(sk.counterMult * p)}%攻击伤害`;
  if (sk.kind === "heal")
    return `生命低于${pct(sk.threshold)}%时治疗，效果×${p.toFixed(2)}${sk.mp ? `，法力${sk.mp}` : ""}`;
  if (sk.kind === "mirror")
    return `减伤${Math.min(85, pct(sk.reduce * p))}%，反射${pct(sk.reflect * p)}%实际伤害`;
  return `效果×${p.toFixed(2)}`;
}
function tryDropSpecialSkill() {
  return false;
}
const TITLES = {
  novice: {
    name: "初入无尽",
    desc: "经验+5%。",
    unlock: (s) => s.totalKills >= 10,
    mods: { xp: 1.05 },
  },
  hunter: {
    name: "百兽猎手",
    desc: "装备掉率+12%，金币-8%。",
    unlock: (s) => s.totalKills >= 100,
    mods: { drop: 1.12, gold: 0.92 },
  },
  challenger: {
    name: "越级者",
    desc: "挑战高CP怪物时经验+20%。",
    unlock: (s) => s.highRiskWins >= 20,
    mods: { riskXp: 1.2 },
  },
  breeder: {
    name: "灵宠培育者",
    desc: "Boss宠物掉率+15%，自身攻击-5%。",
    unlock: (s) => s.pets.length >= 3,
    mods: { pet: 1.15, atk: 0.95 },
  },
  reborn: {
    name: "轮回者",
    desc: "所有基础属性+3%。",
    unlock: (s) => s.rebirths >= 1,
    mods: { all: 1.03 },
  },
};
const PROGRESSION_GOALS = [
  {
    id: "first_boss",
    name: "击破首领",
    desc: "首次击败月背巨狼",
    done: (s) => !!s.firstBossMilestoneClaimed,
    reward: { gold: 500, rarity: 2 },
  },
  {
    id: "threat_3",
    name: "危险猎手",
    desc: "任一区域历史最高危险度达到T3",
    done: (s) =>
      Object.values(s.bossCycles || {}).some(
        (cycle) => Number(cycle.threatUnlocked || 0) >= 3,
      ),
    reward: { gold: 1800, rarity: 3 },
  },
  {
    id: "mythic_class",
    name: "终局职业",
    desc: "解锁任意神话职业",
    done: (s) =>
      (s.unlockedClasses || []).some((id) => STYLES[id]?.rarity === 5),
    reward: { gold: 3500, rarity: 4 },
  },
  {
    id: "six_tier_six",
    name: "六兽完全体",
    desc: "六个区域物种都拥有一只6阶宠物",
    done: (s) =>
      MAPS.every((m) =>
        (s.pets || []).some(
          (p) => petBaseSpecies(p) === m.pet && Number(p.tier || 1) >= 6,
        ),
      ),
    reward: { gold: 8000, rarity: 5 },
  },
  ...[10, 25, 50].map((depth, index) => ({
    id: `abyss_${depth}`,
    name: `星渊${depth}层`,
    desc: `最高抵达星渊第${depth}层`,
    done: (s) => Number(s.abyssHighest || 1) >= depth,
    reward: { gold: [2500, 6000, 15000][index], rarity: [3, 4, 5][index] },
  })),
];
function claimProgressionGoal(id) {
  const goal = PROGRESSION_GOALS.find((x) => x.id === id);
  state.goalsClaimed = state.goalsClaimed || {};
  if (!goal || state.goalsClaimed[id] || !goal.done(state)) return false;
  state.goalsClaimed[id] = true;
  state.gold += goal.reward.gold;
  const item = makeItem(1, null, goal.reward.rarity, false);
  item.name = `里程碑·${item.name}`;
  receiveItem(item);
  log(
    `【阶段目标】${goal.name}完成：金币+${goal.reward.gold}，获得${RARITIES[goal.reward.rarity].name}装备。`,
    "important",
    "important",
  );
  save();
  render(false);
  return true;
}
function renderProgressionBoard() {
  state.goalsClaimed = state.goalsClaimed || {};
  const complete = PROGRESSION_GOALS.filter((goal) => goal.done(state)).length;
  return `<div class="card progression-board"><div class="map-head"><h3>阶段目标 ${complete}/${PROGRESSION_GOALS.length}</h3><b>只奖励金币与装备，不新增货币</b></div><div class="goal-grid">${PROGRESSION_GOALS.map(
    (goal) => {
      const done = goal.done(state),
        claimed = !!state.goalsClaimed[goal.id],
        reward = `${goal.reward.gold}金币 + ${RARITIES[goal.reward.rarity].name}装备`;
      return `<div class="goal ${done ? "done" : ""}"><div><b>${done ? "✓ " : "○ "}${goal.name}</b><div class="compact-meta">${goal.desc}｜${reward}</div></div><button onclick="claimProgressionGoal('${goal.id}')" ${!done || claimed ? "disabled" : ""}>${claimed ? "已领取" : done ? "领取" : "未完成"}</button></div>`;
    },
  ).join("")}</div></div>`;
}
const PET_TYPE_IDS = ["Attack", "Defense", "Magic", "Balance"];
const PET_TYPES = {
  Attack: {
    name: "攻击型",
    growth: { hp: 7, atk: 3.2, def: 0.65, magic: 0.5 },
    desc: "力量成长最高、生命与防御较低。每3次行动发动【撕裂】，造成高额物理伤害并施加2回合破甲；适合速杀、Boss输出与处决路线。",
    role: "主输出 / 破甲",
    strength: "单体伤害最高，能稳定制造破甲窗口。",
    weakness: "承伤能力最低，长战容易先倒下。",
  },
  Defense: {
    name: "防御型",
    growth: { hp: 14, atk: 1.3, def: 2.1, magic: 0.5 },
    desc: "体魄和守护成长最高，敌人更容易攻击它。会主动替玩家分担伤害，每4次行动展开【守护领域】，使玩家接下来2次受击降低20%。",
    role: "承伤 / 护主",
    strength: "显著提高全队容错，最适合越级与高压Boss。",
    weakness: "清怪较慢，遇到恢复型Boss可能输出不足。",
  },
  Magic: {
    name: "施法型",
    growth: { hp: 8, atk: 1, def: 0.8, magic: 2.8 },
    desc: "灵性成长最高。每3次行动判断战况：低血量时治疗玩家或自身，否则施加【衰弱咒】降低敌人攻击与防御。",
    role: "治疗 / 减益",
    strength: "自动补血与减益兼顾，持久战最稳定。",
    weakness: "物理输出与直接承伤能力较弱。",
  },
  Balance: {
    name: "平衡型",
    growth: { hp: 10, atk: 2, def: 1.25, magic: 1.4 },
    desc: "四项成长均衡。每4次行动发动【协同鼓舞】，同时回复双方并强化玩家接下来2次攻击。",
    role: "混合输出 / 增益",
    strength: "无明显短板，能够直接放大角色构筑。",
    weakness: "任何单项能力都不如专精类型极致。",
  },
};
const PET_SPECIES = {
  灰尾幼狼: {
    archetype: "迅捷猎手",
    preferred: ["Attack", "Balance"],
    focus: "力量 ＞ 体魄 ＞ 守护",
    desc: "来自新月草原的群猎幼狼，擅长追击残血目标。适合培养为持续物理输出或协同输出。",
    trait: "猎杀本能",
    traitDesc: "敌人生命低于35%时，自身造成的伤害提高25%。",
    skill: "月影扑杀",
    skillDesc: "每5次行动追加一次强力扑杀，并短暂撕开敌人防御。",
  },
  裂风幼狮: {
    archetype: "首领猎手",
    preferred: ["Attack", "Defense"],
    focus: "力量 / 体魄 ＞ 守护",
    desc: "裂风丘陵狮群的幼崽，对大型目标具有天然压迫力。适合Boss战、强攻或前排路线。",
    trait: "王兽本能",
    traitDesc: "面对区域Boss时，自身伤害提高12%。",
    skill: "裂风咆哮",
    skillDesc: "每5次行动造成额外伤害，并使敌人攻击降低20%，持续2回合。",
  },
  树灵幼芽: {
    archetype: "续航核心",
    preferred: ["Magic", "Defense"],
    focus: "灵性 ＞ 体魄 ＞ 守护",
    desc: "魂木森林孕育的幼生树灵，恢复能力突出。适合治疗、续航与持久Boss战。",
    trait: "根系再生",
    traitDesc: "每次行动后恢复自身2%最大生命。",
    skill: "萌芽回春",
    skillDesc: "每4次行动同时治疗玩家和自身，低血量战斗价值很高。",
  },
  霜鳍幼兽: {
    archetype: "控制守护",
    preferred: ["Defense", "Magic"],
    focus: "守护 / 灵性 ＞ 体魄",
    desc: "霜蚀海岸的耐寒幼兽，能够削弱敌人攻势。适合防御、减益和稳定推进。",
    trait: "寒霜皮甲",
    traitDesc: "自身受到的伤害降低12%。",
    skill: "寒霜吐息",
    skillDesc: "每4次行动造成灵能伤害，并使敌人攻击降低10%，持续2回合。",
  },
  王魂侍从: {
    archetype: "契约护卫",
    preferred: ["Defense", "Balance"],
    focus: "体魄 / 守护 ＞ 灵性",
    desc: "失落王城残存的守誓灵体，擅长保护契约者。适合护主、减伤和平衡辅助。",
    trait: "王魂守誓",
    traitDesc: "存活出战时，玩家受到的直接伤害降低5%。",
    skill: "王魂庇护",
    skillDesc: "每5次行动赋予玩家2次强化防护，使受到的伤害额外降低20%。",
  },
  星核幼龙: {
    archetype: "终局爆发",
    preferred: ["Attack", "Magic", "Balance"],
    focus: "力量 / 灵性 ＞ 体魄",
    desc: "星渊孕育的幼龙，拥有极高的混合输出潜力。适合终局攻击、施法或平衡构筑。",
    trait: "星核共鸣",
    traitDesc: "自身所有伤害提高10%。",
    skill: "星核吐息",
    skillDesc: "每4次行动追加一次高额混合伤害，并无视60%敌人防御。",
  },
};
function petSpeciesData(p) {
  return (
    PET_SPECIES[petBaseSpecies(p)] || {
      archetype: "未知生态",
      preferred: [],
      focus: "按当前类型培养",
      desc: "尚未记录该物种生态。",
      trait: "未知特性",
      traitDesc: "无",
      skill: "未知技能",
      skillDesc: "无",
    }
  );
}
function petBuildFit(p) {
  const d = petSpeciesData(p),
    type = PET_TYPES[p.type],
    fit = d.preferred.includes(p.type);
  return `${fit ? "契合" : "偏门"}｜${type.name}：${type.role}｜优势：${type.strength}｜短板：${type.weakness}｜推荐资质 ${d.focus}`;
}
const PET_EVOLUTION_ROUTES = {
  meadow: {
    three: {
      assault: {
        name: "月影追猎",
        desc: "目标生命≤50%时额外增伤18%，专注收割。",
      },
      guardian: {
        name: "银鬃协猎",
        desc: "存活时玩家减伤5%；每4次行动提供协同攻击增益。",
      },
    },
    six: {
      apex: {
        name: "血月猎王",
        desc: "目标生命≤35%时再增伤35%，月影扑杀追加一次无视防御的追击。",
      },
      harmony: {
        name: "苍月共生",
        desc: "协同增益强化为15%，并同时回复玩家3%最大生命。",
      },
    },
  },
  hill: {
    three: {
      assault: {
        name: "裂风统御",
        desc: "对Boss伤害提高18%，咆哮额外施加破甲。",
      },
      guardian: {
        name: "金鬃壁垒",
        desc: "宠物受到伤害降低18%，存活时玩家减伤7%。",
      },
    },
    six: {
      apex: {
        name: "风暴狮王",
        desc: "每5次行动发动风暴震击，造成额外伤害并延长压制。",
      },
      harmony: {
        name: "群山守誓",
        desc: "每5次行动为玩家提供2次25%减伤的群山屏障。",
      },
    },
  },
  forest: {
    three: {
      assault: {
        name: "荆棘噬魂",
        desc: "每4次行动以灵性发动荆棘反噬，并按伤害恢复自身。",
      },
      guardian: {
        name: "古木守心",
        desc: "萌芽回春效果提高40%，每次行动额外回复玩家少量生命。",
      },
    },
    six: {
      apex: {
        name: "噬魂古树",
        desc: "对Boss伤害提高20%，并使敌方恢复效果降低60%。",
      },
      harmony: {
        name: "生命共鸣",
        desc: "每4次行动同时治疗双方并赋予玩家1次20%减伤。",
      },
    },
  },
  shore: {
    three: {
      assault: {
        name: "极寒蚀骨",
        desc: "寒霜吐息叠加霜印；每层使宠物对目标伤害提高6%。",
      },
      guardian: {
        name: "冰甲守卫",
        desc: "宠物受到伤害降低22%，存活时玩家减伤5%。",
      },
    },
    six: {
      apex: {
        name: "绝对零域",
        desc: "霜印达到3层时引爆，造成高额灵能伤害并重置层数。",
      },
      harmony: {
        name: "潮汐共生",
        desc: "每4次行动回复玩家生命与法力，并强化寒霜减益。",
      },
    },
  },
  ruins: {
    three: {
      assault: {
        name: "魂刃侍从",
        desc: "每5次行动发动无视60%防御的魂刃追击。",
      },
      guardian: {
        name: "王盾守誓",
        desc: "王魂守誓的玩家减伤效果额外提高7%。",
      },
    },
    six: {
      apex: {
        name: "不灭猎王",
        desc: "每场战斗首次倒下时以30%生命复起，并立即发动魂刃。",
      },
      harmony: {
        name: "王魂共鸣",
        desc: "王魂庇护同时强化玩家接下来2次攻击15%。",
      },
    },
  },
  abyss: {
    three: {
      assault: { name: "星渊猎形", desc: "全部伤害提高15%，对Boss再提高10%。" },
      guardian: {
        name: "虚界守形",
        desc: "宠物受到伤害降低18%，每4次行动为玩家恢复法力。",
      },
    },
    six: {
      apex: {
        name: "终焉猎王",
        desc: "目标生命≤40%时额外增伤30%，星核吐息追加一次终焉穿透。",
      },
      harmony: {
        name: "星核共生",
        desc: "每4次行动回复双方生命与玩家法力，并强化玩家攻击。",
      },
    },
  },
};
function petBaseSpecies(p) {
  const raw =
      typeof p === "string" ? p : p?.baseSpecies || p?.species || p?.name,
    base = MAPS.find((m) => m.pet === raw)?.pet;
  if (base) return base;
  for (const [group, routes] of Object.entries(PET_EVOLUTION_ROUTES)) {
    const names = [
      ...Object.values(routes.three),
      ...Object.values(routes.six),
    ].map((x) => x.name);
    if (names.includes(raw))
      return MAPS.find((m) => m.id === group)?.pet || raw;
  }
  return raw || "";
}
function samePetSpecies(a, b) {
  return !!petBaseSpecies(a) && petBaseSpecies(a) === petBaseSpecies(b);
}
function petGroup(p) {
  return MAPS.find((m) => m.pet === petBaseSpecies(p))?.id || "meadow";
}
function petEvolutionRoute(p, stage) {
  const group =
      PET_EVOLUTION_ROUTES[petGroup(p)] || PET_EVOLUTION_ROUTES.meadow,
    choice = p?.evolutionBranches?.[stage === 3 ? "stage3" : "stage6"];
  return group[stage === 3 ? "three" : "six"]?.[choice] || null;
}
function evolutionNames(p) {
  const group =
    PET_EVOLUTION_ROUTES[petGroup(p)] || PET_EVOLUTION_ROUTES.meadow;
  return {
    three: Object.values(group.three).map((x) => x.name),
    six: Object.values(group.six).map((x) => x.name),
  };
}
function evolutionRouteText(p) {
  const parts = [
    petEvolutionRoute(p, 3)?.name,
    petEvolutionRoute(p, 6)?.name,
  ].filter(Boolean);
  return parts.length ? parts.join(" → ") : "尚未选择分支";
}
function evolutionRouteDetail(p) {
  const parts = [petEvolutionRoute(p, 3), petEvolutionRoute(p, 6)].filter(
    Boolean,
  );
  return parts.length
    ? parts.map((x) => `【${x.name}】${x.desc}`).join("<br>")
    : "达到3阶与6阶时各选择一条物种专属路线。";
}
function petEvolutionChoiceDetail(p, stage, choice) {
  const group =
    PET_EVOLUTION_ROUTES[petGroup(p)] || PET_EVOLUTION_ROUTES.meadow;
  return group[stage === 3 ? "three" : "six"]?.[choice] || null;
}
function petCombatPower(p) {
  const s = petStats(p),
    ib = petTierInstincts(p),
    species = petBaseSpecies(p);
  let raw = s.maxHp * 0.28 + s.atk * 4.2 + s.def * 4.5 + s.magic * 4.0;
  let factor =
    ib.damage *
    (1 + (ib.speciesSkill - 1) * 0.35) *
    (1 + (1 / ib.damageTaken - 1) * 0.45) *
    (1 + ib.regen * 4) *
    (1 + (ib.bossDamage - 1) * 0.25);
  if (species === "灰尾幼狼") factor *= 1.05;
  else if (species === "裂风幼狮") factor *= 1.04;
  else if (species === "树灵幼芽") factor *= 1.08;
  else if (species === "霜鳍幼兽") factor *= 1.07;
  else if (species === "王魂侍从") factor *= 1.08;
  else if (species === "星核幼龙") factor *= 1.1;
  return Math.round(raw * factor);
}
function petInstinctScale(p) {
  return 1 + 0.02 * Math.max(0, (p?.tier || 1) - 1);
}
function petTraitScale(p) {
  return 1 + 0.03 * Math.max(0, (p?.tier || 1) - 1);
}
function petExclusiveSkillScale(p) {
  return 1 + 0.04 * Math.max(0, (p?.tier || 1) - 1);
}
function petScaledTraitText(p) {
  const x = petTraitScale(p),
    d = petSpeciesData(p),
    species = petBaseSpecies(p);
  if (species === "灰尾幼狼")
    return `敌人生命≤35%时伤害+${Math.round(25 * x)}%。`;
  if (species === "裂风幼狮") return `对区域Boss伤害+${Math.round(12 * x)}%。`;
  if (species === "树灵幼芽")
    return `每次行动后恢复${(2 * x).toFixed(1)}%最大生命。`;
  if (species === "霜鳍幼兽")
    return `受到伤害降低${Math.min(45, 12 * x).toFixed(1)}%。`;
  if (species === "王魂侍从")
    return `存活时玩家受到直接伤害降低${Math.min(25, 5 * x).toFixed(1)}%。`;
  if (species === "星核幼龙") return `自身全部伤害+${Math.round(10 * x)}%。`;
  return d.traitDesc;
}
function petScaledSkillText(p) {
  const x = petExclusiveSkillScale(p),
    d = petSpeciesData(p);
  return `${d.skillDesc}｜当前阶级技能强度×${x.toFixed(2)}`;
}
function petScaledInstinctText(p) {
  return `${petTierInstinctText(p)}｜阶级本能强度×${petInstinctScale(p).toFixed(2)}`;
}
function petSpeciesDamageMult(p, e) {
  let m = 1,
    ts = petTraitScale(p),
    b = p?.evolutionBranches || {},
    species = petBaseSpecies(p);
  if (species === "灰尾幼狼" && e && e.hp / e.maxHp <= 0.35) m *= 1 + 0.25 * ts;
  if (species === "裂风幼狮" && e?.boss) m *= 1 + 0.12 * ts;
  if (species === "星核幼龙") m *= 1 + 0.1 * ts;
  if (
    species === "灰尾幼狼" &&
    b.stage3 === "assault" &&
    e &&
    e.hp / e.maxHp <= 0.5
  )
    m *= 1.18;
  if (
    species === "灰尾幼狼" &&
    b.stage6 === "apex" &&
    e &&
    e.hp / e.maxHp <= 0.35
  )
    m *= 1.35;
  if (species === "裂风幼狮" && b.stage3 === "assault" && e?.boss) m *= 1.18;
  if (species === "树灵幼芽" && b.stage6 === "apex" && e?.boss) m *= 1.2;
  if (species === "霜鳍幼兽" && b.stage3 === "assault")
    m *= 1 + 0.06 * Math.min(3, e?.frostMark || 0);
  if (species === "星核幼龙" && b.stage3 === "assault")
    m *= e?.boss ? 1.265 : 1.15;
  if (
    species === "星核幼龙" &&
    b.stage6 === "apex" &&
    e &&
    e.hp / e.maxHp <= 0.4
  )
    m *= 1.3;
  const ib = petTierInstincts(p);
  m *= ib.damage;
  if (e?.boss) m *= ib.bossDamage * (1 + amuletPowers().bossDamage);
  return m;
}
function petDamageTakenMult(p) {
  const ts = petTraitScale(p),
    b = p?.evolutionBranches || {},
    name = petBaseSpecies(p);
  let species = name === "霜鳍幼兽" ? 1 - Math.min(0.45, 0.12 * ts) : 1;
  if (name === "裂风幼狮" && b.stage3 === "guardian") species *= 0.82;
  if (name === "霜鳍幼兽" && b.stage3 === "guardian") species *= 0.78;
  if (name === "星核幼龙" && b.stage3 === "guardian") species *= 0.82;
  return species * petTierInstincts(p).damageTaken;
}
function playerDamageTakenPetMult(p) {
  if (!petAlive(p)) return 1;
  const b = p?.evolutionBranches || {},
    species = petBaseSpecies(p);
  let m =
    species === "王魂侍从" ? 1 - Math.min(0.25, 0.05 * petTraitScale(p)) : 1;
  if (species === "灰尾幼狼" && b.stage3 === "guardian") m *= 0.95;
  if (species === "裂风幼狮" && b.stage3 === "guardian") m *= 0.93;
  if (species === "霜鳍幼兽" && b.stage3 === "guardian") m *= 0.95;
  if (species === "王魂侍从" && b.stage3 === "guardian") m *= 0.93;
  return m;
}
function petSpeciesAfterAction(p) {
  if (!p || !petAlive(p)) return;
  const ps = petStats(p),
    ib = petTierInstincts(p),
    is = petInstinctScale(p),
    ts = petTraitScale(p),
    b = p.evolutionBranches || {},
    s = stats(),
    species = petBaseSpecies(p);
  let pct = ib.regen * is;
  if (species === "树灵幼芽") pct += 0.02 * ts;
  if (pct > 0) {
    const h = Math.max(1, Math.round(ps.maxHp * pct));
    p.hp = Math.min(ps.maxHp, p.hp + h);
  }
  if (species === "树灵幼芽" && b.stage3 === "guardian" && playerAlive())
    state.hp = Math.min(
      s.maxHp,
      state.hp + Math.max(1, Math.round(s.maxHp * 0.012)),
    );
  if (
    species === "星核幼龙" &&
    b.stage3 === "guardian" &&
    p.battleTurns % 4 === 0
  )
    state.mp = Math.min(
      s.maxMp,
      state.mp + Math.max(3, Math.round(s.maxMp * 0.06)),
    );
}

/* ===== core-05.js ===== */
function petSpeciesSpecial(p, e, ps, s) {
  if (!p || !e) return;
  const species = petBaseSpecies(p),
    n = p.battleTurns || 0,
    dm = petSpeciesDamageMult(p, e),
    skill =
      petTierInstincts(p).speciesSkill *
      (1 + amuletPowers().petSpecies) *
      petExclusiveSkillScale(p);
  if (species === "灰尾幼狼" && n % 5 === 0) {
    const dmg = Math.max(
      1,
      Math.round(
        ps.atk * 1.45 * dm * skill - enemyDefenseAgainstCompanion(e) * 0.25,
      ),
    );
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    e.petArmorBreakTurns = Math.max(e.petArmorBreakTurns || 0, 2);
    e.petArmorBreakPower = Math.min(0.55, 0.22 * petExclusiveSkillScale(p));
    log(`${p.name}发动【月影扑杀】，造成${dmg}伤害并撕开防御。`, "skill");
  }
  if (species === "裂风幼狮" && n % 5 === 0) {
    const dmg = Math.max(
      1,
      Math.round(
        ps.atk * 0.82 * dm * skill - enemyDefenseAgainstCompanion(e) * 0.2,
      ),
    );
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    e.speciesWeakenTurns = 2;
    e.speciesWeakenPower = Math.min(0.48, 0.2 * petExclusiveSkillScale(p));
    log(`${p.name}发动【裂风咆哮】，造成${dmg}伤害并压制敌人攻击。`, "skill");
  }
  if (species === "树灵幼芽" && n % 4 === 0) {
    const ph = Math.max(
        2,
        Math.round((s.maxHp * 0.06 + ps.magic * 0.35) * skill),
      ),
      self = Math.max(
        2,
        Math.round((ps.maxHp * 0.08 + ps.magic * 0.28) * skill),
      );
    if (state.hp > 0) state.hp = Math.min(s.maxHp, state.hp + ph);
    p.hp = Math.min(ps.maxHp, p.hp + self);
    log(
      `${p.name}发动【萌芽回春】，玩家恢复${state.hp > 0 ? ph : 0}，自身恢复${self}生命。`,
      "skill",
    );
  }
  if (species === "霜鳍幼兽" && n % 4 === 0) {
    const dmg = Math.max(
      1,
      Math.round(
        (ps.magic * 1.05 + ps.atk * 0.32) * dm * skill -
          enemyDefenseAgainstCompanion(e) * 0.24,
      ),
    );
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    e.frostbiteTurns = 2;
    e.frostbitePower = Math.min(0.35, 0.1 * petExclusiveSkillScale(p));
    log(`${p.name}发动【寒霜吐息】，造成${dmg}伤害并削弱敌人攻势。`, "skill");
  }
  if (species === "王魂侍从" && n % 5 === 0) {
    state.temp.speciesGuardTurns = 2;
    state.temp.speciesGuardPower = Math.min(
      0.5,
      0.2 * petExclusiveSkillScale(p),
    );
    log(`${p.name}发动【王魂庇护】，玩家接下来2次受击获得额外减伤。`, "skill");
  }
  if (species === "星核幼龙" && n % 4 === 0) {
    const raw =
        (Math.max(ps.atk, ps.magic) * 1.65 * dm +
          Math.min(ps.atk, ps.magic) * 0.35) *
        skill,
      dmg = Math.max(1, Math.round(raw - e.def * 0.4));
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    log(`${p.name}发动【星核吐息】，造成${dmg}穿透伤害。`, "skill");
  }
  const b = p.evolutionBranches || {};
  if (species === "灰尾幼狼" && b.stage3 === "guardian" && n % 4 === 0) {
    state.temp.petAtkBuff = Math.max(state.temp.petAtkBuff || 0, 0.1);
    state.temp.petAtkBuffTurns = Math.max(state.temp.petAtkBuffTurns || 0, 2);
  }
  if (species === "灰尾幼狼" && b.stage6 === "harmony" && n % 4 === 0) {
    state.temp.petAtkBuff = Math.max(state.temp.petAtkBuff || 0, 0.15);
    state.temp.petAtkBuffTurns = Math.max(state.temp.petAtkBuffTurns || 0, 2);
    if (playerAlive())
      state.hp = Math.min(
        s.maxHp,
        state.hp + Math.max(1, Math.round(s.maxHp * 0.03)),
      );
  }
  if (species === "灰尾幼狼" && b.stage6 === "apex" && n % 5 === 0) {
    const extra = Math.max(1, Math.round(ps.atk * 0.75 * dm - e.def * 0.1));
    e.hp -= extra;
    log(`${p.name}发动血月追击，追加${extra}穿透伤害。`, "skill");
  }
  if (species === "裂风幼狮" && b.stage3 === "assault" && n % 5 === 0) {
    e.petArmorBreakTurns = Math.max(e.petArmorBreakTurns || 0, 3);
    e.petArmorBreakPower = Math.max(e.petArmorBreakPower || 0, 0.28);
  }
  if (species === "裂风幼狮" && b.stage6 === "apex" && n % 5 === 0) {
    const extra = Math.max(1, Math.round(ps.atk * 1.1 * dm - e.def * 0.18));
    e.hp -= extra;
    e.speciesWeakenTurns = Math.max(e.speciesWeakenTurns || 0, 3);
    log(`${p.name}引发风暴震击，追加${extra}伤害。`, "skill");
  }
  if (species === "裂风幼狮" && b.stage6 === "harmony" && n % 5 === 0) {
    state.temp.speciesGuardTurns = 2;
    state.temp.speciesGuardPower = Math.max(
      state.temp.speciesGuardPower || 0,
      0.25,
    );
  }
  if (species === "树灵幼芽" && b.stage3 === "assault" && n % 4 === 0) {
    const extra = Math.max(1, Math.round(ps.magic * 1.15 - e.def * 0.18));
    e.hp -= extra;
    p.hp = Math.min(ps.maxHp, p.hp + Math.round(extra * 0.25));
    log(`${p.name}发动荆棘噬魂，造成${extra}伤害并恢复自身。`, "skill");
  }
  if (species === "树灵幼芽" && b.stage6 === "harmony" && n % 4 === 0) {
    state.temp.speciesGuardTurns = Math.max(
      state.temp.speciesGuardTurns || 0,
      1,
    );
    state.temp.speciesGuardPower = Math.max(
      state.temp.speciesGuardPower || 0,
      0.2,
    );
  }
  if (
    species === "霜鳍幼兽" &&
    (b.stage3 === "assault" || b.stage6 === "apex") &&
    n % 4 === 0
  ) {
    e.frostMark = Math.min(3, (e.frostMark || 0) + 1);
    if (b.stage6 === "apex" && e.frostMark >= 3) {
      const extra = Math.max(
        1,
        Math.round(ps.magic * 2.25 + ps.atk * 0.55 - e.def * 0.2),
      );
      e.hp -= extra;
      e.frostMark = 0;
      log(`${p.name}引爆【绝对零域】，造成${extra}伤害。`, "skill");
    }
  }
  if (
    species === "霜鳍幼兽" &&
    b.stage6 === "harmony" &&
    n % 4 === 0 &&
    playerAlive()
  ) {
    state.hp = Math.min(
      s.maxHp,
      state.hp + Math.max(2, Math.round(s.maxHp * 0.04)),
    );
    state.mp = Math.min(
      s.maxMp,
      state.mp + Math.max(3, Math.round(s.maxMp * 0.08)),
    );
    e.frostbitePower = Math.max(e.frostbitePower || 0, 0.18);
  }
  if (species === "王魂侍从" && b.stage3 === "assault" && n % 5 === 0) {
    const extra = Math.max(
      1,
      Math.round(ps.atk * 1.2 + ps.magic * 0.55 - e.def * 0.4),
    );
    e.hp -= extra;
    log(`${p.name}发动魂刃追击，造成${extra}穿透伤害。`, "skill");
  }
  if (species === "王魂侍从" && b.stage6 === "harmony" && n % 5 === 0) {
    state.temp.petAtkBuff = Math.max(state.temp.petAtkBuff || 0, 0.15);
    state.temp.petAtkBuffTurns = Math.max(state.temp.petAtkBuffTurns || 0, 2);
  }
  if (species === "星核幼龙" && b.stage6 === "apex" && n % 4 === 0) {
    const extra = Math.max(
      1,
      Math.round(Math.max(ps.atk, ps.magic) * 1.1 * dm - e.def * 0.2),
    );
    e.hp -= extra;
    log(`${p.name}追加终焉穿透，造成${extra}伤害。`, "skill");
  }
  if (species === "星核幼龙" && b.stage6 === "harmony" && n % 4 === 0) {
    p.hp = Math.min(ps.maxHp, p.hp + Math.max(2, Math.round(ps.maxHp * 0.05)));
    if (playerAlive())
      state.hp = Math.min(
        s.maxHp,
        state.hp + Math.max(2, Math.round(s.maxHp * 0.04)),
      );
    state.mp = Math.min(
      s.maxMp,
      state.mp + Math.max(3, Math.round(s.maxMp * 0.08)),
    );
    state.temp.petAtkBuff = Math.max(state.temp.petAtkBuff || 0, 0.12);
    state.temp.petAtkBuffTurns = Math.max(state.temp.petAtkBuffTurns || 0, 2);
  }
}
function petTierMult(tier) {
  return 1 + PET_TIER_GROWTH_STEP * Math.max(0, Math.round(tier || 1) - 1);
}
function petTierInstincts(p) {
  const t = Math.max(1, Math.round(p?.tier || 1)),
    k = petInstinctScale(p),
    b = {
      hp: 1,
      atk: 1,
      def: 1,
      magic: 1,
      damage: 1,
      speciesSkill: 1,
      damageTaken: 1,
      bossDamage: 1,
      regen: 0,
      all: 1,
    };
  if (t >= 1) b.hp *= 1 + 0.05 * k;
  if (t >= 2) {
    if (p?.type === "Attack") b.atk *= 1 + 0.05 * k;
    else if (p?.type === "Magic") b.magic *= 1 + 0.05 * k;
    else if (p?.type === "Defense") b.def *= 1 + 0.05 * k;
    else {
      b.atk *= 1 + 0.03 * k;
      b.magic *= 1 + 0.03 * k;
    }
  }
  if (t >= 3) b.def *= 1 + 0.05 * k;
  if (t >= 4) b.speciesSkill *= 1 + 0.05 * k;
  if (t >= 5) b.damage *= 1 + 0.05 * k;
  if (t >= 6) b.speciesSkill *= 1 + 0.1 * k;
  if (t >= 7) b.damageTaken *= 1 - Math.min(0.35, 0.06 * k);
  if (t >= 8) b.bossDamage *= 1 + 0.08 * k;
  if (t >= 9) b.regen += 0.015 * k;
  if (t >= 10) b.all *= 1 + 0.08 * k;
  return b;
}
function petTierInstinctText(p) {
  const t = Math.max(1, Math.round(p?.tier || 1));
  const unlocked = Object.entries(PET_TIER_INSTINCTS)
    .filter(([tier]) => t >= Number(tier))
    .map(([tier, x]) => `${tier}阶【${x.name}】${x.desc}`);
  const next = Object.entries(PET_TIER_INSTINCTS).find(
    ([tier]) => Number(tier) > t,
  );
  return `${unlocked.join("｜")}${next ? `｜下一特性：${next[0]}阶【${next[1].name}】` : "｜10阶后只继续固定+12%基础全域倍率，不再新增机制。"}`;
}
function petEvolutionSameTierCount(tier) {
  return Math.max(
    10,
    Math.round(10 * Math.pow(1.25, Math.max(0, Math.round(tier || 1) - 1))),
  );
}
function petEvolutionNeed(p) {
  const t = Math.max(1, Math.round(p?.tier || 1));
  return t * petEvolutionSameTierCount(t);
}
function petEvolutionSpentXp(p) {
  let total = 0,
    tier = Math.max(1, Math.round(p?.tier || 1));
  for (let t = 1; t < tier; t++) total += t * petEvolutionSameTierCount(t);
  return total;
}
function migratePetFusionInvestment(p) {
  if (!p) return 0;
  const base = p.mutant ? 100 : 1,
    reconstructed =
      base +
      petEvolutionSpentXp(p) +
      Math.max(0, Math.round(p.evolutionXp || 0));
  p.fusionInvestedXp = Math.max(
    base,
    Math.round(
      Number.isFinite(Number(p.fusionInvestedXp))
        ? Number(p.fusionInvestedXp)
        : reconstructed,
    ),
  );
  delete p.fusionLineage;
  return p.fusionInvestedXp;
}
function petEvolutionValue(donor) {
  return migratePetFusionInvestment(donor);
}
function petEvolutionProgress(p) {
  return clamp((p?.evolutionXp || 0) / Math.max(1, petEvolutionNeed(p)), 0, 1);
}
function petEvolutionText(p) {
  const t = Math.max(1, Math.round(p?.tier || 1)),
    need = petEvolutionNeed(p),
    xp = Math.max(0, Math.round(p?.evolutionXp || 0));
  return `进阶经验 ${xp}/${need}｜${t}→${t + 1}阶约需${petEvolutionSameTierCount(t)}只同阶普通宠物｜基础全域倍率×${petTierMult(t).toFixed(2)} → ×${petTierMult(t + 1).toFixed(2)}｜分支：${evolutionRouteText(p)}`;
}
function applyPetEvolutionXp(p, amount) {
  if (!p || amount <= 0) return [];
  p.evolutionXp =
    Math.max(0, Math.round(p.evolutionXp || 0)) + Math.round(amount);
  const upgrades = [];
  let guard = 0;
  while (guard++ < 1000) {
    const need = petEvolutionNeed(p);
    if (p.evolutionXp < need) break;
    p.evolutionXp -= need;
    const from = Math.max(1, Math.round(p.tier || 1));
    p.tier = from + 1;
    upgrades.push([from, p.tier]);
  }
  return upgrades;
}
function petLevelSpentXp(p) {
  let total = 0,
    level = Math.max(1, Math.round(p?.level || 1));
  for (let l = 1; l < level; l++) total += petXpNeed(l);
  return total;
}
function petLevelInvestment(p) {
  return petLevelSpentXp(p) + Math.max(0, Math.round(p?.xp || 0));
}
function applyPetLevelXpRaw(p, amount) {
  const before = p.level || 1;
  p.xp = Math.max(0, Math.round(p.xp || 0)) + Math.max(0, Math.round(amount));
  while (p.level < PET_LEVEL_MAX && p.xp >= petXpNeed(p.level)) {
    p.xp -= petXpNeed(p.level);
    p.level++;
  }
  if (p.level >= PET_LEVEL_MAX) {
    p.level = PET_LEVEL_MAX;
    p.xp = 0;
  }
  return { from: before, to: p.level };
}
function inheritPetEvolution(target, donor) {
  const evolutionXp = petEvolutionValue(donor),
    levelXp = petLevelInvestment(donor);
  migratePetFusionInvestment(target);
  target.fusionInvestedXp += evolutionXp;
  const upgrades = applyPetEvolutionXp(target, evolutionXp),
    levels = applyPetLevelXpRaw(target, levelXp);
  return { value: evolutionXp, evolutionXp, levelXp, upgrades, levels };
}
function rollPetTier(mapDef = map()) {
  return Math.min(6, mapDef.petTier || 1);
}
const PET_GRADES = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
const PET_GRADE_MULT = {
  F: 0.72,
  E: 0.82,
  D: 0.91,
  C: 1,
  B: 1.1,
  A: 1.22,
  S: 1.36,
  SS: 1.52,
  SSS: 1.72,
};
const PET_X_EQUIV_MULT = 2.2;
const PET_MUTANT_MULT = PET_X_EQUIV_MULT / PET_GRADE_MULT.SSS;
const PET_GRADE_WEIGHTS = [5, 10, 18, 26, 20, 12, 6, 2.5, 0.5];
const PET_APT_NAMES = { hp: "体魄", atk: "力量", def: "守护", magic: "灵性" };
const PET_DUST_VALUES = {
  F: 1,
  E: 2,
  D: 3,
  C: 4,
  B: 6,
  A: 9,
  S: 14,
  SS: 22,
  SSS: 35,
};
function gradeIndex(g) {
  const i = PET_GRADES.indexOf(g);
  return i < 0 ? 3 : i;
}
function gradeFromIndex(i) {
  return PET_GRADES[clamp(Math.round(i), 0, PET_GRADES.length - 1)];
}
function rollPetGrade(mapIndex = 0) {
  const weights = PET_GRADE_WEIGHTS.slice(),
    boost = Math.max(0, mapIndex * 0.16 + stats().luck * 0.003);
  let total = weights.reduce((a, b) => a + b, 0),
    r = Math.random() * total,
    idx = 0;
  for (; idx < weights.length; idx++) {
    r -= weights[idx];
    if (r <= 0) break;
  }
  while (idx < 8 && Math.random() < boost) idx++;
  return gradeFromIndex(idx);
}
function rollPetAptitudes(type, mapIndex) {
  const apt = {
    hp: rollPetGrade(mapIndex),
    atk: rollPetGrade(mapIndex),
    def: rollPetGrade(mapIndex),
    magic: rollPetGrade(mapIndex),
  };
  if (type === "Attack") apt.atk = gradeFromIndex(gradeIndex(apt.atk) + 1);
  if (type === "Defense") {
    apt.hp = gradeFromIndex(gradeIndex(apt.hp) + 1);
    apt.def = gradeFromIndex(gradeIndex(apt.def) + 1);
  }
  if (type === "Magic") apt.magic = gradeFromIndex(gradeIndex(apt.magic) + 1);
  return apt;
}
function migratePetAptitudes(p) {
  if (p.aptitudes) return p.aptitudes;
  const q = Number(p.quality || 1),
    base = clamp(Math.round((q - 0.82) / 0.045), 0, 8);
  p.aptitudes = {
    hp: gradeFromIndex(base),
    atk: gradeFromIndex(base),
    def: gradeFromIndex(base),
    magic: gradeFromIndex(base),
  };
  if (p.type === "Attack") p.aptitudes.atk = gradeFromIndex(base + 1);
  if (p.type === "Defense") {
    p.aptitudes.hp = gradeFromIndex(base + 1);
    p.aptitudes.def = gradeFromIndex(base + 1);
  }
  if (p.type === "Magic") p.aptitudes.magic = gradeFromIndex(base + 1);
  delete p.quality;
  return p.aptitudes;
}
function petOverallScore(p) {
  const a = migratePetAptitudes(p);
  return Math.round(
    (gradeIndex(a.hp) +
      gradeIndex(a.atk) +
      gradeIndex(a.def) +
      gradeIndex(a.magic)) /
      4,
  );
}
function petOverallGrade(p) {
  return gradeFromIndex(petOverallScore(p));
}
function petHasHighAptitude(p, min = "S") {
  const a = migratePetAptitudes(p),
    n = gradeIndex(min);
  return Object.values(a).some((g) => gradeIndex(g) >= n);
}
function aptitudeText(p) {
  const a = migratePetAptitudes(p);
  return Object.entries(a)
    .map(([k, g]) => `${PET_APT_NAMES[k]}<span class="grade-${g}">${g}</span>`)
    .join(" / ");
}
function fresh() {
  return {
    version: VERSION,
    started: false,
    race: null,
    style: null,
    name: "旅者",
    unlockedRaces: [],
    unlockedClasses: [],
    identityPity: 0,
    firstBossMilestoneClaimed: false,
    starterProfessionPending: false,
    level: 1,
    xp: 0,
    gold: 20,
    rebirths: 0,
    rebirthLaws: { war: 0, time: 0, hunt: 0 },
    pendingRebirthLaw: "war",
    base: { str: 6, int: 6, dex: 6, will: 6, luck: 6 },
    growthCarry: { str: 0, int: 0, dex: 0, will: 0, luck: 0 },
    hp: 1,
    mp: 1,
    equipment: {
      weapon: null,
      head: null,
      armor: null,
      boots: null,
      ring: null,
      amulet: null,
    },
    inventory: [],
    autoSell: 0,
    gearScorePrefs: null,
    skills: {},
    skillUse: {},
    skillMastered: {},
    skillPriority: { attack: [], defense: [] },
    skillReadyAt: {},
    combatTurn: 0,
    activeSkillSlots: [],
    passiveSkillSlots: [],
    mapId: "meadow",
    enemy: null,
    bossProgress: {},
    bossCycles: {},
    bossBuildPreset: null,
    preBossBuildSnapshot: null,
    lastDefeatReport: null,
    goalsClaimed: {},
    killsByMap: {},
    totalKills: 0,
    totalWins: 0,
    totalLosses: 0,
    highRiskWins: 0,
    pets: [],
    activePetId: null,
    nextId: 1,
    nextItemId: 1,
    petDust: 0,
    petCapacity: 12,
    inventoryCapacity: 40,
    titlesUnlocked: [],
    equippedTitle: null,
    log: [],
    logFilters: {
      damage: false,
      defense: false,
      loot: true,
      important: true,
      system: true,
    },
    lastSave: Date.now(),
    running: true,
    tab: "character",
    metrics: {
      startedAt: Date.now(),
      xp: 0,
      gold: 0,
      drops: 0,
      battles: 0,
      wins: 0,
      losses: 0,
      byMap: {},
    },
    petFilter: { minGrade: "F", minTier: 1, action: "release", keepAnyS: true },
    shop: { gearBuys: 0, petTraining: 0, inventoryUpgrades: 0, petUpgrades: 0 },
  };
}
let state = fresh();
let tickTimer = null,
  saveTimer = null;
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function rnd(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function sanitizePlayerName(value) {
  return (
    String(value ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/[<>&"'`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20) || "旅者"
  );
}
function pickWeighted(arr) {
  const total = arr.reduce((n, x) => n + x.w, 0);
  let r = Math.random() * total;
  for (const x of arr) {
    r -= x.w;
    if (r <= 0) return x;
  }
  return arr[arr.length - 1];
}
function inferLogCategory(msg, cls = "") {
  if (cls === "important") return "important";
  if (/神话|永久解锁|技能传承|被动传承|变异 X|变异X|极稀有|身份/.test(msg))
    return "important";
  if (cls === "loot") return "loot";
  if (cls === "lose") return "defense";
  if (cls === "skill")
    return /恢复|减轻|护|治疗|吸收|防御|衰弱|守护|镜返/.test(msg)
      ? "defense"
      : "damage";
  if (cls === "sys" || cls === "win") return "system";
  return "damage";
}
function log(msg, cls = "", category = null) {
  const cat = category || inferLogCategory(msg, cls);
  state.log.unshift({ msg, cls, category: cat, t: Date.now() });
  state.log = state.log.slice(0, 180);
  renderLogOnly();
}
function ensureLogFilters() {
  state.logFilters = {
    damage: false,
    defense: false,
    loot: true,
    important: true,
    system: true,
    ...(state.logFilters || {}),
  };
  return state.logFilters;
}
function filteredLogs() {
  const f = ensureLogFilters();
  return (state.log || []).filter(
    (x) => f[x.category || inferLogCategory(x.msg, x.cls)] !== false,
  );
}
function toggleLogFilter(k) {
  const f = ensureLogFilters();
  f[k] = !f[k];
  save();
  renderLogOnly();
}
function setImportantLogMode() {
  state.logFilters = {
    damage: false,
    defense: false,
    loot: false,
    important: true,
    system: false,
  };
  save();
  renderLogOnly();
}
function setAllLogMode() {
  state.logFilters = {
    damage: true,
    defense: true,
    loot: true,
    important: true,
    system: true,
  };
  save();
  renderLogOnly();
}
function renderLogControls() {
  const f = ensureLogFilters(),
    labels = {
      damage: "伤害",
      defense: "防御/治疗",
      loot: "掉落",
      important: "重要",
      system: "系统",
    };
  return `<div class="log-toolbar"><b>战斗日志</b><div class="log-filter-row">${Object.entries(
    labels,
  )
    .map(
      ([k, n]) =>
        `<button class="${f[k] ? "active" : ""}" onclick="toggleLogFilter('${k}')">${n}</button>`,
    )
    .join(
      "",
    )}<button onclick="setImportantLogMode()">只看重要</button><button onclick="setAllLogMode()">全部</button></div></div>`;
}

/* ===== core-06.js ===== */
function renderLogOnly() {
  const dock = document.getElementById("log-dock");
  if (!dock) return;
  dock.innerHTML =
    renderLogControls() +
    `<div class="log-stream">${
      filteredLogs()
        .map(
          (x) =>
            `<div class="${x.cls} cat-${x.category || inferLogCategory(x.msg, x.cls)}">${x.msg}</div>`,
        )
        .join("") || '<div class="muted">当前筛选没有日志。</div>'
    }</div>`;
}
function map() {
  return MAPS.find((x) => x.id === state.mapId);
}
function titleMods() {
  return state.equippedTitle ? TITLES[state.equippedTitle].mods : {};
}
function equippedBonuses() {
  const b = {
    str: 0,
    int: 0,
    dex: 0,
    will: 0,
    luck: 0,
    hp: 0,
    mp: 0,
    crit: 0,
    def: 0,
    atk: 0,
  };
  Object.values(state.equipment)
    .filter(Boolean)
    .forEach((it) => {
      const mult = 1 + (it.refine || 0) * 0.08;
      Object.entries(it.stats).forEach(
        ([k, v]) => (b[k] = (b[k] || 0) + Math.round(v * mult)),
      );
    });
  return b;
}
function weaponProfile() {
  const w = state.equipment.weapon;
  return w && w.weaponType ? WEAPON_TYPES[w.weaponType] : null;
}
function ensureMetric(id = state.mapId) {
  state.metrics = state.metrics || {
    startedAt: Date.now(),
    xp: 0,
    gold: 0,
    drops: 0,
    battles: 0,
    wins: 0,
    losses: 0,
    byMap: {},
  };
  state.metrics.byMap = state.metrics.byMap || {};
  state.metrics.byMap[id] = state.metrics.byMap[id] || {
    startedAt: Date.now(),
    xp: 0,
    gold: 0,
    drops: 0,
    battles: 0,
    wins: 0,
    losses: 0,
  };
  return state.metrics.byMap[id];
}
function metricRate(metric, key) {
  const mins = Math.max(
    1 / 60,
    (Date.now() - (metric.startedAt || Date.now())) / 60000,
  );
  return (metric[key] || 0) / mins;
}
function prepareNewBattle() {
  const s = stats();
  state.hp = s.maxHp;
  state.mp = s.maxMp;
  state.temp = {
    petGuardTurns: 0,
    petAtkBuffTurns: 0,
    petAtkBuff: 0,
    speciesGuardTurns: 0,
    speciesGuardPower: 0,
    playerFallenLogged: false,
  };
  const p = activePet();
  if (p) {
    const ps = petStats(p);
    p.hp = ps.maxHp;
    p.battleTurns = 0;
    p.fallen = false;
    p.apexRevived = false;
  }
}
function expectedDamage(s = stats()) {
  const critMult = s.critMult || 1.7;
  return (
    s.atk *
    (s.balance / 100 + (1 - s.balance / 100) * 0.5) *
    (1 + (s.crit / 100) * (critMult - 1))
  );
}
function representativeEnemy(mapDef) {
  const region = Math.max(1, mapDef.cp / MAPS[0].cp),
    w = threatScale(mapDef.id),
    lv = Math.round((mapDef.levels[0] + mapDef.levels[1]) / 2) + w.levelBonus;
  return {
    level: lv,
    maxHp: Math.round((72 + lv * 11) * Math.pow(region, 0.65) * w.hp),
    atk: Math.round((11 + lv * 1.45) * Math.pow(region, 0.33) * w.atk),
    def: Math.round((2.5 + lv * 0.5) * Math.pow(region, 0.22) * w.def),
    speed: Math.round((7 + lv * 0.42) * Math.pow(region, 0.07) * w.speed),
    boss: false,
    hp: 1,
  };
}
function expectedPetRoundDamageAgainst(e) {
  const p = activePet();
  if (!p) return 0;
  const ps = petStats(p),
    m = petSpeciesDamageMult(p, { ...e, hp: e.maxHp }),
    species = petBaseSpecies(p);
  let d = 0;
  if (p.type === "Attack")
    d = Math.max(1, ps.atk * 1.25 * m + ps.magic * 0.22 - e.def * 0.38);
  else if (p.type === "Defense")
    d = Math.max(1, ps.atk * 0.66 * m + ps.def * 0.18 - e.def * 0.3);
  else if (p.type === "Magic")
    d = Math.max(1, ps.magic * 0.79 * m + ps.atk * 0.19 - e.def * 0.22);
  else d = Math.max(1, (ps.atk * 0.78 + ps.magic * 0.58) * m - e.def * 0.34);
  const sp = petSpeciesData(p);
  if (sp?.skill && species === "星核幼龙")
    d += (Math.max(ps.atk, ps.magic) * 1.65 * m) / 4;
  else if (species === "灰尾幼狼") d += (ps.atk * 1.45 * m) / 5;
  else if (species === "裂风幼狮") d += (ps.atk * 0.82 * m) / 5;
  else if (species === "霜鳍幼兽")
    d += ((ps.magic * 1.05 + ps.atk * 0.32) * m) / 4;
  return Math.max(0, d);
}
function expectedDefenseFactor(s = stats()) {
  let incoming = 1,
    healEhp = 0;
  const ids = (state.activeSkillSlots || []).filter(
    (id) =>
      SKILLS[id]?.type === "active" &&
      SKILLS[id].cat === "defense" &&
      skillUsable(id),
  );
  let remain = 1;
  for (const id of ids) {
    const sk = SKILLS[id],
      chance =
        skillTriggerChance(id, s) /
        (1 + skillTriggerChance(id, s) * (sk.cooldown || 0) * 0.65),
      use = remain * chance,
      p = skillPower(id);
    if (sk.kind === "reduce" || sk.kind === "mirror")
      incoming *= 1 - use * Math.min(0.8, (sk.reduce || 0.45) * p) * 0.55;
    else if (sk.kind === "heal")
      healEhp +=
        use *
        (s.maxHp * (sk.healPct || 0.23) + s.int * (sk.intScale || 0.8)) *
        p *
        0.35;
    remain *= 1 - chance;
    if (remain < 0.08) break;
  }
  return { incoming: clamp(incoming, 0.55, 1), healEhp };
}
function estimatedWin(mapDef) {
  const s = stats(),
    e = representativeEnemy(mapDef),
    skillFactor = expectedAttackSkillFactor(s),
    playerHit = Math.max(1, expectedDamage(s) * skillFactor - e.def * 0.68),
    petHit = expectedPetRoundDamageAgainst(e),
    out = Math.max(1, playerHit + petHit),
    defx = expectedDefenseFactor(s),
    p = activePet();
  let incoming = Math.max(1, e.atk - s.def * 0.65) * defx.incoming;
  if (p && petAlive(p)) {
    const target =
      { Attack: 0.22, Defense: 0.42, Magic: 0.28, Balance: 0.26 }[p.type] ||
      0.25;
    incoming *= 1 - target * 0.75;
    if (p.type === "Defense") incoming *= 0.82;
    if (p.type === "Magic") defx.healEhp += petStats(p).magic * 0.3;
  }
  const ttk = e.maxHp / out,
    ttd = (s.maxHp + defx.healEhp) / Math.max(1, incoming),
    speedAdj = s.speed >= e.speed ? 1.08 : 0.92,
    ratio = (ttd / Math.max(0.25, ttk)) * speedAdj;
  return clamp(Math.round(50 + 36 * Math.log2(Math.max(0.12, ratio))), 2, 98);
}
function ensureIdentityState() {
  state.unlockedRaces = Array.isArray(state.unlockedRaces)
    ? state.unlockedRaces.filter((id) => RACES[id])
    : [];
  state.unlockedClasses = Array.isArray(state.unlockedClasses)
    ? state.unlockedClasses.filter((id) => STYLES[id])
    : [];
  if (
    state.race &&
    RACES[state.race] &&
    !state.unlockedRaces.includes(state.race)
  )
    state.unlockedRaces.push(state.race);
  if (
    state.style &&
    STYLES[state.style] &&
    !state.unlockedClasses.includes(state.style)
  )
    state.unlockedClasses.push(state.style);
  state.identityPity = Math.max(0, Number(state.identityPity || 0));
}
function inheritProfessionProgress(styleId) {
  const rank = classLineageRank(styleId);
  if (rank <= 0) return [];
  state.skillUse = state.skillUse || {};
  state.skillMastered = state.skillMastered || {};
  const prior = coveredClassIds(styleId)
    .slice(0, -1)
    .flatMap((id) => STYLES[id]?.skills || [])
    .filter((id) => SKILLS[id]);
  const upgraded = [];
  for (const id of classNativeSkills(styleId)) {
    const sk = SKILLS[id];
    let pool = prior.filter(
      (x) =>
        SKILLS[x]?.type === sk.type &&
        (sk.type === "passive" || SKILLS[x]?.cat === sk.cat),
    );
    if (!pool.length) pool = prior.filter((x) => SKILLS[x]?.type === sk.type);
    const best = pool.reduce(
      (n, x) => Math.max(n, Number(state.skillUse[x] || 0)),
      0,
    );
    if (best > Number(state.skillUse[id] || 0)) {
      state.skillUse[id] = best;
      upgraded.push(id);
    }
    if (skillLevel(id) >= 10) state.skillMastered[id] = true;
  }
  return upgraded;
}
function classProgressionText(styleId) {
  const line = classLineage(styleId);
  if (!line) return "独立职业";
  return CLASS_LINEAGES[line]
    .map((id) => `${STYLES[id].icon}${STYLES[id].name}`)
    .join(" → ");
}
function switchRace(id) {
  ensureIdentityState();
  if (!state.unlockedRaces.includes(id) || !RACES[id]) return;
  if (id === state.race) return;
  const old = RACES[state.race]?.name || "未知";
  state.race = id;
  state.enemy = null;
  prepareNewBattle();
  save();
  render();
  log(
    `种族切换：${old} → ${RACES[id].name}。种族特性随当前种族变化，不会被传承。`,
    "important",
    "important",
  );
}
function switchClass(id) {
  ensureIdentityState();
  if (!state.unlockedClasses.includes(id) || !STYLES[id]) return;
  if (id === state.style) return;
  if (typeof window.beforeClassSwitch === "function")
    window.beforeClassSwitch(id);
  const oldId = state.style,
    old = STYLES[oldId]?.name || "未知",
    advanced =
      classLineage(oldId) === classLineage(id) &&
      classLineageRank(id) > classLineageRank(oldId);
  state.style = id;
  const inherited = inheritProfessionProgress(id);
  state.enemy = null;
  state.skillReadyAt = {};
  if (advanced) {
    state.activeSkillSlots = nativeActiveSkills(id).slice(
      0,
      window.SKILL_SLOT_LIMITS?.active || 4,
    );
    state.passiveSkillSlots = nativePassiveSkills(id).slice(
      0,
      window.SKILL_SLOT_LIMITS?.passive || 5,
    );
  }
  syncSkills();
  prepareNewBattle();
  save();
  render();
  log(
    `职业切换：${old} → ${STYLES[id].name}。${advanced ? "已自动用高阶原生技能取代低阶装备技能。" : "所有已解锁职业技能仍可直接使用。"}${inherited.length ? ` ${inherited.map((x) => SKILLS[x].name).join("、")}继承了同谱系熟练成果。` : ""}`,
    "important",
    "important",
  );
  if (typeof window.onClassSwitched === "function") window.onClassSwitched(id);
}
function identityMaxRarityForMap(m = map()) {
  return [1, 2, 3, 3, 4, 5][Math.max(0, MAPS.indexOf(m))] ?? 1;
}
function rollIdentityRarity(maxR) {
  const w = [42, 27, 16, 9, 4.5, 1.5],
    pool = [];
  for (let r = 0; r <= maxR; r++) pool.push({ r, w: w[r] });
  return pickWeighted(pool).r;
}
function identityDropChance(lootMult = 1) {
  const mult = Math.max(1, lootMult),
    luck = stats().luck,
    hunt = rebirthProfile().special || 1,
    danger = dangerDropProfile().identity || 1,
    pity = Math.min(0.1, (state.identityPity || 0) * 0.004);
  return clamp(
    (0.052 + Math.min(0.025, luck / 6000)) * hunt * danger * mult + pity,
    0.035,
    Math.min(0.72, 0.24 * mult),
  );
}
function identityDuplicateReward(rarity) {
  return Math.round(90 * Math.pow(rarity + 1, 1.65));
}
function tryDropIdentity(e, m) {
  if (!e?.boss) return false;
  ensureIdentityState();
  if (Math.random() >= identityDropChance(e.bossLootMult || 1)) {
    state.identityPity = (state.identityPity || 0) + 1;
    return false;
  }
  const maxR = identityMaxRarityForMap(m),
    rarity = rollIdentityRarity(maxR),
    racePool = Object.keys(RACES).filter((id) => RACES[id].rarity === rarity),
    classPool = Object.keys(STYLES).filter(
      (id) => STYLES[id].rarity === rarity,
    );
  let kind = Math.random() < 0.5 ? "race" : "class",
    pool = kind === "race" ? racePool : classPool,
    unlocked = kind === "race" ? state.unlockedRaces : state.unlockedClasses;
  if (!pool.length) {
    kind = kind === "race" ? "class" : "race";
    pool = kind === "race" ? racePool : classPool;
    unlocked = kind === "race" ? state.unlockedRaces : state.unlockedClasses;
  }
  if (!pool.length) {
    state.identityPity++;
    return false;
  }
  const locked = pool.filter((id) => !unlocked.includes(id)),
    chosenPool = locked.length && Math.random() < 0.85 ? locked : pool,
    id = chosenPool[rnd(0, chosenPool.length - 1)],
    def = kind === "race" ? RACES[id] : STYLES[id],
    r = RARITIES[def.rarity];
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    if (kind === "class") inheritProfessionProgress(id);
    state.identityPity = 0;
    log(
      `【身份掉落】${r.name}${kind === "race" ? "种族" : "职业"}【${def.name}】永久解锁！${kind === "class" ? " 职业技能已立即永久开放，无需回头修炼低阶职业。" : ""}`,
      "important",
      "important",
    );
  } else {
    const reward = identityDuplicateReward(def.rarity);
    state.gold += reward;
    state.identityPity = Math.max(0, (state.identityPity || 0) - 2);
    log(
      `Boss再次掉落已解锁的${r.name}${kind === "race" ? "种族" : "职业"}【${def.name}】，转化为${reward}金币。`,
      "loot",
      "loot",
    );
  }
  return true;
}
const REBIRTH_LAW_MAX = 3;
const REBIRTH_LAWS = {
  war: {
    name: "破军法则",
    desc: "强化战斗。每级：玩家最终攻击+10%，宠物攻击/魔力+8%。最高Lv.3。",
  },
  time: {
    name: "时流法则",
    desc: "强化周回。每级：经验+12%、技能熟练+15%、宠物经验+12%，Boss周期减少2只普通怪；可与猎手罗盘叠加至0只并进入连续Boss战。最高Lv.3。",
  },
  hunt: {
    name: "猎命法则",
    desc: "强化收获。每级：装备/宠物掉落+8%，神话概率+6%，变异X概率+5%，Boss身份掉落判定+5%。最高Lv.3。",
  },
};
function ensureRebirthLaws() {
  state.rebirthLaws = {
    war: 0,
    time: 0,
    hunt: 0,
    ...(state.rebirthLaws || {}),
  };
  if (!REBIRTH_LAWS[state.pendingRebirthLaw]) state.pendingRebirthLaw = "war";
  return state.rebirthLaws;
}
function rebirthProfile() {
  const r = Math.max(0, state.rebirths || 0),
    laws = ensureRebirthLaws(),
    damage =
      (1 + 0.1 * r) * (1 + 0.1 * Math.min(REBIRTH_LAW_MAX, laws.war || 0)),
    hp = 1 + 0.06 * r,
    def = 1 + 0.06 * r,
    petPower =
      (1 + 0.1 * r) * (1 + 0.08 * Math.min(REBIRTH_LAW_MAX, laws.war || 0)),
    xp =
      (1 + 0.25 * r) * (1 + 0.12 * Math.min(REBIRTH_LAW_MAX, laws.time || 0)),
    skillMastery =
      (1 + 0.2 * r) * (1 + 0.15 * Math.min(REBIRTH_LAW_MAX, laws.time || 0)),
    petXp =
      (1 + 0.2 * r) * (1 + 0.12 * Math.min(REBIRTH_LAW_MAX, laws.time || 0)),
    gold = 1 + 0.08 * r,
    bossCycle = 1,
    hunt = Math.min(REBIRTH_LAW_MAX, laws.hunt || 0),
    gearDrop = 1 + 0.08 * hunt,
    petDrop = 1 + 0.08 * hunt,
    mythic = 1 + 0.06 * hunt,
    mutation = 1 + 0.05 * hunt,
    special = 1 + 0.05 * hunt;
  return {
    r,
    damage,
    hp,
    def,
    petPower,
    xp,
    skillMastery,
    petXp,
    gold,
    bossCycle,
    gearDrop,
    petDrop,
    mythic,
    mutation,
    special,
  };
}
function rebirthUnlockText() {
  return (state.rebirths || 0) > 0
    ? "你已经经历过轮回：后续周目会更快，但所有地图始终都可自由进入。"
    : "尚未转生：所有地图仍可进入；高阶地图不会拦你，只会用实际战斗强度把你击败。";
}
function effectiveCritChance(raw) {
  raw = Math.max(0, Number(raw) || 0);
  if (raw <= 25) return raw;
  if (raw <= 100) return 25 + (raw - 25) * (50 / 75);
  if (raw <= 200) return 75 + (raw - 100) * 0.1;
  if (raw <= 500) return 85 + (raw - 200) / 30;
  return 100 - 2500 / raw;
}
function critCurveText(raw) {
  const actual = effectiveCritChance(raw);
  return `原始暴击 ${raw.toFixed(1)} → 实际暴击率 ${actual.toFixed(1)}%`;
}

/* ===== core-07.js ===== */
function stats() {
  const b = equippedBonuses(),
    tm = titleMods(),
    wp = weaponProfile(),
    wm = wp?.mods || {},
    sm = skillMasteryTotals(),
    psv = passiveSkillTotals(),
    rp = rebirthProfile(),
    rt = raceTraitPowers(),
    ib = identityBaseAttributes();
  let str = ib.str + b.str,
    int = ib.int + b.int,
    dex = ib.dex + b.dex,
    will = ib.will + b.will,
    luck = ib.luck + b.luck;
  const all = tm.all || 1;
  str *= all;
  int *= all;
  dex *= all;
  will *= all;
  luck *= all;
  let maxHp = Math.round(
      (55 + state.level * 8 + str * 5 + will * 3 + b.hp) *
        (rt.hp || 1) *
        (1 + sm.hpPct + psv.hpPct) *
        rp.hp,
    ),
    maxMp = Math.round(
      (25 + state.level * 3 + int * 5 + will * 2 + b.mp + (wm.mp || 0)) *
        (1 + sm.mpPct + psv.mpPct),
    );
  const a = classArchetype();
  let baseAtk;
  if (a === "melee") baseAtk = str * 2.35 + dex * 0.3 + state.level * 2;
  else if (a === "ranged") baseAtk = dex * 2.25 + str * 0.35 + state.level * 2;
  else baseAtk = int * 2.25 + will * 0.25 + state.level * 1.9;
  let atk = Math.round(
    (baseAtk + (b.atk || 0)) *
      (1 + sm.atkPct + psv.atkPct) *
      rp.damage *
      (rt.damage || 1),
  );
  if (a === "ranged") atk *= wm.rangedMult || 1;
  if (a === "magic") atk *= wm.magicMult || 1;
  atk *= wm.atkMult || 1;
  let def = Math.round(
      (will * 1.35 + str * 0.32 + state.level * 0.7 + (b.def || 0)) *
        (1 + sm.defPct + psv.defPct) *
        rp.def *
        (rt.def || 1),
    ),
    rawCrit = Math.max(
      0,
      5 +
        dex * 0.32 +
        luck * 0.24 +
        (b.crit || 0) +
        (wm.crit || 0) +
        sm.crit +
        psv.crit,
    ),
    crit = applyAmuletCritEfficiency(effectiveCritChance(rawCrit)),
    balance = clamp(67 + dex * 0.45 + (wm.balance || 0), 55, 98),
    speed = Math.round(
      (10 + dex * 0.75 + (wm.speed || 0)) *
        (1 + sm.speedPct + psv.speedPct) *
        (rt.speed || 1),
    ),
    critMult = 1.7 + (wm.critMult || 0) + sm.critDmg + psv.critDmg,
    skillChance =
      (wm.skillChance || 0) +
      sm.skillChance +
      psv.skillChance +
      amuletPowers().skillChance +
      (rt.skillChance || 0);
  atk = Math.round(atk * (tm.atk || 1));
  return {
    str: Math.round(str),
    int: Math.round(int),
    dex: Math.round(dex),
    will: Math.round(will),
    luck: Math.round(luck),
    maxHp,
    maxMp,
    atk,
    def,
    rawCrit,
    crit,
    balance,
    speed,
    critMult,
    skillChance,
  };
}
function expectedAttackSkillFactor(s = stats()) {
  const ordered = (state.activeSkillSlots || []).filter(
    (id) =>
      SKILLS[id]?.type === "active" &&
      SKILLS[id].cat === "attack" &&
      skillUsable(id),
  );
  let remaining = 1,
    factor = 1;
  for (const id of ordered) {
    const sk = SKILLS[id],
      chance = skillTriggerChance(id, s),
      availability = chance / (1 + chance * (sk.cooldown || 0) * 0.65);
    let use = remaining * availability,
      eff = (sk.mult || 1) * (sk.hits || 1) * skillPower(id);
    if (sk.kind === "execute") use *= 0.25;
    const ignore = clamp(
      (sk.ignore || 0) + (skillLevel(id) - 1) * (sk.ignoreGrowth || 0),
      0,
      0.9,
    );
    eff *= 1 + ignore * 0.25;
    factor += use * Math.max(0, eff - 1);
    remaining *= 1 - availability;
    if (remaining < 0.05) break;
  }
  return clamp(factor, 1, 3.2);
}
function cp() {
  const s = stats(),
    p = activePet(),
    ps = p ? petStats(p) : null,
    ehp = s.maxHp * (1 + s.def / 75),
    dps = expectedDamage(s) * expectedAttackSkillFactor(s) * (1 + s.speed / 55),
    sustain = s.maxMp * 0.12 + s.will * 0.55;
  let petValue = 0;
  if (ps && p) {
    if (p.type === "Attack") petValue = ps.atk * 1.55 + ps.maxHp * 0.05;
    else if (p.type === "Defense")
      petValue = ps.maxHp * 0.16 + ps.def * 1.35 + ps.atk * 0.45;
    else if (p.type === "Magic")
      petValue = ps.magic * 1.55 + ps.maxHp * 0.1 + ps.def * 0.45;
    else
      petValue = ps.atk * 0.95 + ps.magic * 0.9 + ps.maxHp * 0.1 + ps.def * 0.6;
  }
  return Math.round(ehp * 0.34 + dps * 2.15 + sustain + petValue);
}
function xpNeed(l = state.level) {
  return Math.round(30 + l * l * 6.3);
}
function growthShares(raceId = state.race, styleId = state.style) {
  const r = RACES[raceId]?.growth || RACES.human.growth,
    c = STYLES[styleId]?.growth || STYLES.melee.growth,
    keys = ["str", "int", "dex", "will", "luck"],
    raw = {};
  let sum = 0;
  keys.forEach((k) => {
    raw[k] = r[k] * c[k];
    sum += raw[k];
  });
  const out = {};
  keys.forEach((k) => (out[k] = raw[k] / sum));
  return out;
}
function identityBaseAttributes() {
  const race = RACES[state.race] || RACES.human,
    job = STYLES[state.style] || STYLES.melee,
    base = 6 + Math.max(0, state.level - 1) * 0.6,
    out = {};
  ["str", "int", "dex", "will", "luck"].forEach(
    (k) => (out[k] = base * (race.growth[k] || 1) * (job.growth[k] || 1)),
  );
  return out;
}
function attributeImpactText(k) {
  const a = classArchetype(),
    d = {
      str: `每+1力量：生命+5、防御+0.32、${a === "melee" ? "近战攻击+2.35" : a === "ranged" ? "远程攻击+0.35" : "不直接提高魔法攻击"}。`,
      int: `每+1智力：法力+5、${a === "magic" ? "魔法攻击+2.25" : "不直接提高当前职业攻击"}。`,
      dex: `每+1敏捷：原始暴击+0.32、平衡+0.45个百分点、速度+0.75、${a === "ranged" ? "远程攻击+2.25" : a === "melee" ? "近战攻击+0.30" : "不直接提高魔法攻击"}。`,
      will: `每+1意志：生命+3、法力+2、防御+1.35${a === "magic" ? "、魔法攻击+0.25" : ""}。`,
      luck: "每+1幸运：原始暴击+0.24，并提高装备品质、Boss宠物和身份掉落相关判定。",
    };
  return d[k];
}
function raceGrowthText(raceId = state.race) {
  const r = RACES[raceId];
  return `${identityGrowthText(r)}｜种族特性【${r.traitName}】${r.traitDesc}`;
}
function styleGrowthText(styleId = state.style, raceId = state.race) {
  const c = STYLES[styleId],
    a = c.archetype,
    formula =
      a === "melee"
        ? "近战攻击 = 力量×2.35 + 敏捷×0.30 + 等级×2.00 + 装备攻击"
        : a === "ranged"
          ? "远程攻击 = 敏捷×2.25 + 力量×0.35 + 等级×2.00 + 装备攻击"
          : "魔法攻击 = 智力×2.25 + 意志×0.25 + 等级×1.90 + 装备攻击";
  return `${identityGrowthText(c)}｜${formula}`;
}
function autoGrowth() {}
function gainXp(amount) {
  const rp = rebirthProfile();
  amount = Math.round(
    amount * (raceTraitPowers().xp || 1) * (titleMods().xp || 1) * rp.xp,
  );
  state.xp += amount;
  while (state.xp >= xpNeed()) {
    state.xp -= xpNeed();
    state.level++;
    autoGrowth();
    syncSkills();
    const s = stats();
    state.hp = s.maxHp;
    state.mp = s.maxMp;
    log(
      `升级至Lv.${state.level}。当前属性按种族×职业模板实时重算。`,
      "sys",
      "system",
    );
  }
}
function rarityRoll(luckBoost = 0, useDanger = true) {
  const luck = stats().luck + luckBoost,
    d = useDanger ? dangerDropProfile(map().id) : { progress: 0, mythic: 1 },
    roll = Math.random() * 100,
    baseMythic = Math.min(0.16, 0.025 + luck * 0.0005),
    mythic = Math.min(0.24, baseMythic * d.mythic),
    legendary =
      Math.max(0.05, 0.55 + luck * 0.012 - baseMythic) *
      (1 + 0.45 * d.progress),
    epic =
      Math.max(0.2, 3 + luck * 0.042 - (0.55 + luck * 0.012)) *
      (1 + 0.3 * d.progress),
    rare =
      Math.max(1, 12 + luck * 0.1 - (3 + luck * 0.042)) *
      (1 + 0.2 * d.progress),
    uncommon =
      Math.max(5, 35 + luck * 0.18 - (12 + luck * 0.1)) *
      (1 + 0.1 * d.progress);
  let t = mythic;
  if (roll < t) return 5;
  t += legendary;
  if (roll < t) return 4;
  t += epic;
  if (roll < t) return 3;
  t += rare;
  if (roll < t) return 2;
  t += uncommon;
  if (roll < t) return 1;
  return 0;
}
function makeItem(
  dropMult = 1,
  forcedWeaponType = null,
  forcedRarity = null,
  useDanger = true,
) {
  const rarity =
      forcedRarity === null
        ? rarityRoll((dropMult - 1) * 18, useDanger)
        : clamp(Number(forcedRarity) || 0, 0, RARITIES.length - 1),
    rd = RARITIES[rarity],
    slot = forcedWeaponType ? "weapon" : SLOTS[rnd(0, SLOTS.length - 1)],
    sourceMap = map(),
    sourceThreat = threatTier(sourceMap.id),
    tier = equipmentTier(sourceMap, sourceThreat);
  let weaponType = null,
    base;
  if (slot === "weapon") {
    if (forcedWeaponType) weaponType = forcedWeaponType;
    else {
      const preferred = Object.entries(WEAPON_TYPES)
          .filter(([, w]) => w.styles.includes(classArchetype()))
          .map(([id]) => id),
        all = Object.keys(WEAPON_TYPES);
      weaponType =
        Math.random() < 0.68
          ? preferred[rnd(0, preferred.length - 1)]
          : all[rnd(0, all.length - 1)];
    }
    base =
      WEAPON_NAMES[weaponType][rnd(0, WEAPON_NAMES[weaponType].length - 1)];
  } else base = BASE_NAMES[slot][rnd(0, BASE_NAMES[slot].length - 1)];
  const count = forcedWeaponType ? 1 : 1 + rd.aff,
    statsObj = {},
    affixes = [],
    focusChance =
      rarity >= 5 ? 0.16 : rarity === 4 ? 0.08 : rarity === 3 ? 0.03 : 0,
    focusAffix =
      Math.random() < focusChance ? AFFIXES[rnd(0, AFFIXES.length - 1)] : null,
    repeatChance = rarity >= 5 ? 0.62 : rarity === 4 ? 0.52 : 0.42;
  for (let i = 0; i < count; i++) {
    const a =
        focusAffix && Math.random() < repeatChance
          ? focusAffix
          : AFFIXES[rnd(0, AFFIXES.length - 1)],
      value = rollAffixValue(a, tier, rarity);
    statsObj[a.stat] = (statsObj[a.stat] || 0) + value;
    affixes.push({ name: a.name, stat: a.stat, value });
  }
  const tp = gearStatTierPower(tier),
    q = QUALITY_STAT_MULT[rarity] || 1;
  if (slot === "weapon")
    statsObj.atk = (statsObj.atk || 0) + Math.round((6 + 10 * tp) * q);
  if (slot === "armor")
    statsObj.def = (statsObj.def || 0) + Math.round((3 + 4.5 * tp) * q);
  const score = gearTierScore(tier, rarity),
    sell = Math.round((8 + score * 0.18) * (1 + rarity * 0.35)),
    arcanes = slot === "amulet" ? rollAmuletArcanes(rarity) : [];
  return {
    id: "i" + state.nextItemId++,
    name: `${rd.name}${base}`,
    slot,
    rarity,
    stats: statsObj,
    affixes,
    arcanes,
    score,
    tier,
    itemLevel: tier,
    sourceMap: sourceMap.id,
    sourceMapName: sourceMap.name,
    sourceThreat,
    sell,
    locked: false,
    weaponType,
    refine: 0,
    qualityCurveVersion: 7,
  };
}
function itemScore(it) {
  return gearScoreBreakdown(it).score;
}
function inventoryUpgradeDelta(it) {
  const current = state.equipment[it.slot];
  return itemScore(it) - (current ? itemScore(current) : 0);
}
function sortedInventory() {
  return state.inventory.slice().sort((a, b) => {
    const da = inventoryUpgradeDelta(a),
      db = inventoryUpgradeDelta(b),
      pa = da > 0,
      pb = db > 0;
    if (pa !== pb) return Number(pb) - Number(pa);
    if (da !== db) return db - da;
    const fa = gearScoreBreakdown(a).fit,
      fb = gearScoreBreakdown(b).fit;
    if (fa !== fb) return fb - fa;
    if (inferItemLevel(a) !== inferItemLevel(b))
      return inferItemLevel(b) - inferItemLevel(a);
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return itemScore(b) - itemScore(a);
  });
}
function sellNonUpgradeItems() {
  const candidates = state.inventory.filter(
    (it) => !it.locked && inventoryUpgradeDelta(it) <= 0,
  );
  if (!candidates.length)
    return alert(
      "按当前角色适配评分，没有可出售的无提升装备。锁定装备不会被处理。",
    );
  const total = candidates.reduce((n, it) => n + itemSellValue(it), 0);
  if (
    !confirm(
      `按当前评分偏好一键出售${candidates.length}件没有角色适配评分提升的装备？\n获得${total}金币。\n\n改变评分偏好会改变“提升/无提升”的判断；锁定装备不会出售。`,
    )
  )
    return;
  const ids = new Set(candidates.map((it) => it.id));
  state.inventory = state.inventory.filter((it) => !ids.has(it.id));
  state.gold += total;
  log(
    `按角色适配评分出售${candidates.length}件无提升装备，金币+${total}。`,
    "loot",
  );
  render();
}
function itemSellValue(it) {
  return Math.max(
    1,
    Math.round((it.sell || 1) * (1 + (it.refine || 0) * 0.12) * 0.35),
  );
}
function findItem(id) {
  const inv = state.inventory.find((x) => x.id === id);
  if (inv) return inv;
  return Object.values(state.equipment).find((x) => x && x.id === id) || null;
}
function refineCost(it) {
  return Math.round(
    (40 + state.level * 5) *
      (it.rarity + 1) *
      Math.pow((it.refine || 0) + 1, 2),
  );
}

/* ===== core-08.js ===== */
function itemText(it) {
  const mult = 1 + (it.refine || 0) * 0.08,
    tier = inferItemTier(it),
    names = {
      str: "力量",
      int: "智力",
      dex: "敏捷",
      will: "意志",
      luck: "幸运",
      hp: "生命",
      mp: "法力",
      crit: "暴击",
      def: "防御",
      atk: "攻击",
    };
  let parts = [];
  if (Array.isArray(it.affixes) && it.affixes.length) {
    parts = it.affixes.map(
      (a) => `${names[a.stat] || a.stat}+${Math.round((a.value || 0) * mult)}`,
    );
    if (it.slot === "weapon" && (it.stats?.atk || 0) > 0)
      parts.unshift(`攻击+${Math.round((it.stats.atk || 0) * mult)}`);
    if (it.slot === "armor" && (it.stats?.def || 0) > 0) {
      const affDef = it.affixes
          .filter((a) => a.stat === "def")
          .reduce((n, a) => n + (a.value || 0), 0),
        baseDef = Math.max(0, (it.stats.def || 0) - affDef);
      if (baseDef > 0) parts.unshift(`基础防御+${Math.round(baseDef * mult)}`);
    }
  } else
    parts = Object.entries(it.stats || {}).map(
      ([k, v]) => `${names[k] || k}+${Math.round(v * mult)}`,
    );
  return `${tier}阶${it.sourceMapName ? ` · ${it.sourceMapName}` : ""}${it.sourceThreat ? `T${it.sourceThreat}` : ""}${it.refine ? ` / 精炼+${it.refine}` : ""} / ${parts.join(" / ")}${it.weaponType ? ` / ${WEAPON_TYPES[it.weaponType].desc}` : ""}${Array.isArray(it.arcanes) && it.arcanes.length ? ` / ${it.arcanes.map(amuletArcaneText).join(" / ")}` : ""}`;
}
function receiveItem(it) {
  if (it.rarity < state.autoSell) {
    state.gold += itemSellValue(it);
    log(`自动出售 ${it.name}，金币+${itemSellValue(it)}。`, "loot");
    return;
  }
  if (state.inventory.length >= state.inventoryCapacity) {
    const low = state.inventory
      .filter((x) => !x.locked)
      .sort(
        (a, b) =>
          inventoryUpgradeDelta(a) - inventoryUpgradeDelta(b) ||
          itemScore(a) - itemScore(b),
      )[0];
    if (low && inventoryUpgradeDelta(it) > inventoryUpgradeDelta(low)) {
      sellItem(low.id, false);
      state.inventory.push(it);
      log(`背包已满，出售提升价值更低的装备并保留 ${it.name}。`, "loot");
    } else {
      state.gold += itemSellValue(it);
      log(`背包已满，自动出售 ${it.name}。`, "loot");
    }
  } else {
    state.inventory.push(it);
    log(`获得 ${it.name}：${itemText(it)}。`, "loot");
  }
}
function ensureBossCycle(id = state.mapId) {
  state.bossCycles = state.bossCycles || {};
  const c = state.bossCycles[id] || {
    normalSinceBoss: 0,
    retryCountdown: 0,
    bossEncounters: 0,
    bossWins: 0,
    threatTier: 0,
    threatUnlocked: 0,
    dangerFail: 0,
    warningIssued: false,
  };
  const cap = threatCap(id),
    limit = Number.isFinite(cap) ? cap : 999;
  if (c.threatTier === undefined) c.threatTier = 0;
  if (c.threatUnlocked === undefined)
    c.threatUnlocked = Math.max(
      Number(c.threatTier || 0),
      Math.min(limit, Number(c.bossWins || 0)),
    );
  c.threatUnlocked = clamp(Math.round(Number(c.threatUnlocked) || 0), 0, limit);
  c.threatTier = clamp(
    Math.round(Number(c.threatTier) || 0),
    0,
    c.threatUnlocked,
  );
  c.dangerFail = Math.max(0, Number(c.dangerFail) || 0);
  c.warningIssued = !!c.warningIssued;
  state.bossCycles[id] = c;
  return c;
}
function threatCap(id = state.mapId) {
  const m = MAPS.find((x) => x.id === id);
  return m?.threatCap ?? 0;
}
function threatTier(id = state.mapId) {
  return ensureBossCycle(id).threatTier || 0;
}
function threatUnlocked(id = state.mapId) {
  return ensureBossCycle(id).threatUnlocked || 0;
}
function threatCapText(id = state.mapId) {
  const cap = threatCap(id);
  return Number.isFinite(cap) ? `上限T${cap}` : "无限危险度";
}
function dangerEffectiveCap(id = state.mapId) {
  const cap = threatCap(id);
  return Number.isFinite(cap) ? Math.max(1, cap) : 12;
}
function dangerProgress(id = state.mapId) {
  return clamp(threatTier(id) / dangerEffectiveCap(id), 0, 1);
}
function dangerDropProfile(id = state.mapId) {
  const t = threatTier(id),
    p = dangerProgress(id),
    rp = rebirthProfile(),
    depth = id === "abyss" ? Math.max(1, state.abyssDepth || 1) : 1,
    n = depth - 1,
    base = {
      progress: p,
      maxed: Number.isFinite(threatCap(id)) && t >= threatCap(id),
      gearDrop: Math.min(2, 1 + (0.18 * t) / (1 + 0.06 * t)) * rp.gearDrop,
      petDrop: Math.min(1.8, 1 + (0.1 * t) / (1 + 0.05 * t)) * rp.petDrop,
      mythic: Math.min(3.2, 1 + 0.22 * t) * rp.mythic,
      mutation: Math.min(2.2, 1 + 0.12 * t) * rp.mutation,
      identity: Math.min(1.75, 1 + 0.08 * t),
    };
  if (id === "abyss") {
    base.gearDrop *= 1 + Math.min(1.5, n * 0.018);
    base.petDrop *= 1 + Math.min(0.8, n * 0.012);
    base.mythic *= 1 + Math.min(3, n * 0.025);
    base.mutation *= 1 + Math.min(2, n * 0.018);
    base.identity *= 1 + Math.min(0.8, n * 0.01);
  }
  return base;
}
function worldCombatScale(id = state.mapId) {
  const t = threatTier(id),
    r = Math.max(0, Number(state.rebirths || 0)),
    thp = 1 + 0.19 * t + 0.06 * t * t,
    tatk = 1 + 0.115 * t + 0.035 * t * t,
    tdef = 1 + 0.08 * t + 0.02 * t * t,
    hp = thp * (1 + 0.12 * r),
    atk = tatk * (1 + 0.08 * r),
    def = tdef * (1 + 0.06 * r);
  return {
    tier: t,
    cpMult: Math.sqrt(hp * atk * Math.sqrt(def)),
    hp,
    atk,
    def,
    speed: (1 + 0.025 * t) * (1 + 0.015 * r),
    reward: (1 + 0.12 * t) * (1 + 0.12 * r),
    levelBonus: Math.floor(t / 3),
    worldTier: r,
  };
}
function threatScale(id = state.mapId) {
  return { ...worldCombatScale(id), ...dangerDropProfile(id) };
}
function effectiveMapCp(mapDef) {
  return Math.round(mapDef.cp * worldCombatScale(mapDef.id).cpMult);
}
function rollMonsterTitle(tier = 0) {
  return pickWeighted(MONSTER_TITLES);
}
function bossPrefixById(id) {
  return BOSS_PREFIXES.find((x) => x.id === id) || BOSS_PREFIXES[0];
}
function rollBossPrefix() {
  return pickWeighted(BOSS_PREFIXES);
}
function bossPrefixForEncounter(id = state.mapId) {
  const stored = state.bossProgress?.[id]?.prefixId;
  return stored ? bossPrefixById(stored) : rollBossPrefix();
}
function bossPrefixText(e) {
  return e?.bossPrefixId && e.bossPrefixId !== "none"
    ? `${e.bossPrefixName}：${e.bossPrefixDesc} 金币×${Number(e.bossGoldMult || 1).toFixed(2)}。`
    : "";
}
function bossCycleConfig(id = state.mapId) {
  const threat = threatTier(id),
    timeLv = Math.min(REBIRTH_LAW_MAX, ensureRebirthLaws().time || 0),
    base = Math.max(0, 50 - threat * 5),
    timeReduce = timeLv * 2,
    amuletReduce = amuletPowers().bossNeed || 0,
    period = Math.max(0, base - timeReduce - amuletReduce);
  return {
    threat,
    timeLv,
    base,
    timeReduce,
    period,
    retry: Math.ceil(period / 2),
    amuletReduce,
  };
}
function bossEncounterChance(id = state.mapId) {
  const c = ensureBossCycle(id),
    cfg = bossCycleConfig(id);
  if (state.bossProgress?.[id]?.active) return c.retryCountdown <= 0 ? 1 : 0;
  return c.normalSinceBoss >= cfg.period ? 1 : 0;
}
function shouldEncounterBoss(id = state.mapId) {
  const c = ensureBossCycle(id),
    progress = state.bossProgress?.[id],
    cfg = bossCycleConfig(id);
  if (progress?.active) return c.retryCountdown <= 0;
  return c.normalSinceBoss >= cfg.period;
}
function bossTacticalHint(id = state.mapId) {
  return (
    {
      meadow: "低于35%生命后狂暴：需要稳定生存或尽快收尾。",
      hill: "每4回合发动裂风扑杀：防御宠物和减伤技能更有效。",
      forest: "每4回合恢复生命：需要爆发、破甲或处决。",
      shore: "拥有额外高防御：优先穿透、破甲和魔法爆发。",
      ruins: "每5回合生成王魂护盾：多段攻击可先破盾。",
      abyss: "每3回合吞噬法力：降低技能耗魔或提高普通攻击强度。",
    }[id] || "观察首领机制并调整构筑。"
  );
}
function bossEncounterText(id) {
  const c = ensureBossCycle(id),
    progress = state.bossProgress?.[id],
    cfg = bossCycleConfig(id);
  if (progress?.active) {
    const tries = Number(progress.attempts || 0);
    return c.retryCountdown > 0
      ? `狩猎挑战${tries}/3：再击败${c.retryCountdown}只普通怪后重遇`
      : `狩猎挑战${tries}/3：受伤Boss将在下一场重现`;
  }
  return `Boss周期 ${cfg.period}只｜进度 ${Math.min(c.normalSinceBoss, cfg.period)}/${cfg.period}｜还需${Math.max(0, cfg.period - c.normalSinceBoss)}只`;
}
const ABYSS_VARIANTS = [
  { id: "hunger", name: "噬法", desc: "持续吞噬法力。" },
  { id: "regen", name: "再生", desc: "每4回合恢复生命。" },
  { id: "mirror", name: "镜界", desc: "每4回合生成护盾。" },
  { id: "frenzy", name: "狂星", desc: "半血后攻击与速度大幅提高。" },
];
function makeEnemy(forceBoss = false) {
  const m = map(),
    boss = forceBoss,
    treasure = !boss && Math.random() < TREASURE_MONSTER_CHANCE,
    prefix = boss ? bossPrefixForEncounter(m.id) : BOSS_PREFIXES[0],
    w = worldCombatScale(m.id),
    region = Math.max(1, m.cp / MAPS[0].cp),
    title = boss
      ? {
          name: "区域首领：",
          atkMul: 1.7,
          hpMul: 16,
          defMul: 1.25,
          xp: 5,
          gold: 7,
          drop: 4.5,
        }
      : treasure
        ? TREASURE_MONSTER_TITLE
        : rollMonsterTitle(),
    baseLevel = boss ? m.levels[1] + 2 : rnd(m.levels[0], m.levels[1]),
    lv = baseLevel + w.levelBonus,
    rawHp = (72 + lv * 11) * Math.pow(region, 0.65),
    rawAtk = (11 + lv * 1.45) * Math.pow(region, 0.33),
    rawDef = (2.5 + lv * 0.5) * Math.pow(region, 0.22),
    rawSpeed = (7 + lv * 0.42) * Math.pow(region, 0.07),
    prefixHp = prefix.hp || 1,
    prefixAtk = prefix.atk || 1,
    prefixDef = prefix.def || 1,
    maxHp = Math.round(rawHp * (title.hpMul || 1) * w.hp * prefixHp),
    atk = Math.round(rawAtk * (title.atkMul || 1) * w.atk * prefixAtk),
    def = Math.round(rawDef * (title.defMul || 1) * w.def * prefixDef),
    speed = Math.round(rawSpeed * w.speed),
    titleCp =
      Math.sqrt((title.hpMul || 1) * (title.atkMul || 1)) *
      Math.pow(title.defMul || 1, 0.25),
    prefixCp = Math.sqrt(prefixHp * prefixAtk * Math.sqrt(prefixDef)),
    prefixLabel = prefix.name ? `${prefix.name}·` : "";
  let enemy = {
    id: "e" + Date.now() + Math.random(),
    name: treasure
      ? "宝箱怪"
      : `${title.name}${boss ? prefixLabel + m.boss : m.monsters[rnd(0, m.monsters.length - 1)]}`,
    boss,
    treasure,
    title,
    level: lv,
    mapId: m.id,
    round: 0,
    enraged: false,
    shield: 0,
    threatTier: threatTier(m.id),
    bossCyclePeriod: boss ? bossCycleConfig(m.id).period : 0,
    bossPrefixId: boss ? prefix.id : null,
    bossPrefixName: boss ? prefix.name : "",
    bossPrefixDesc: boss ? prefix.desc : "",
    bossPrefixMechanic: boss ? prefix.mechanic || "none" : "none",
    bossLootMult: boss ? prefix.loot || 1 : 1,
    bossGoldMult: boss ? prefix.gold || 1 : 1,
    maxHp,
    hp: maxHp,
    huntStartHp: maxHp,
    atk,
    def,
    speed,
    cp: Math.round(m.cp * w.cpMult * titleCp * prefixCp),
    xp: title.xp,
    gold: title.gold * 3.2 * (boss ? prefix.gold || 1 : 1),
    drop: title.drop,
    rewardMult: w.reward,
  };
  if (boss && m.id === "shore") enemy.def = Math.round(enemy.def * 1.32);
  if (m.id === "abyss") {
    const depth = Math.max(1, state.abyssDepth || 1),
      n = depth - 1,
      dhp = 1 + 0.1 * n + 0.007 * n * n,
      datk = 1 + 0.065 * n + 0.0035 * n * n,
      ddef = 1 + 0.04 * n + 0.0018 * n * n,
      dspeed = 1 + Math.min(0.6, n * 0.005);
    enemy.abyssDepth = depth;
    enemy.maxHp = Math.round(enemy.maxHp * dhp);
    enemy.hp = enemy.maxHp;
    enemy.huntStartHp = enemy.maxHp;
    enemy.atk = Math.round(enemy.atk * datk);
    enemy.def = Math.round(enemy.def * ddef);
    enemy.speed = Math.round(enemy.speed * dspeed);
    enemy.cp = Math.round(enemy.cp * Math.sqrt(dhp * datk * Math.sqrt(ddef)));
    enemy.rewardMult *= 1 + n * 0.05;
    if (boss) {
      const cycle = Math.max(1, Math.floor(depth / 5)),
        variant = ABYSS_VARIANTS[(cycle - 1) % ABYSS_VARIANTS.length];
      enemy.abyssVariant = variant.id;
      enemy.name = `第${depth}层·${variant.name}·${prefixLabel}${MAPS[5].boss}`;
      enemy.variantName = variant.name;
      enemy.variantDesc = variant.desc;
    }
  }
  return enemy;
}
function ensureEnemy() {
  if (state.enemy) return;
  prepareNewBattle();
  const m = map(),
    cycle = ensureBossCycle(m.id),
    progress = state.bossProgress[m.id],
    boss = shouldEncounterBoss(m.id);
  if (boss) {
    if (typeof window.applyBossBuildForEncounter === "function")
      window.applyBossBuildForEncounter();
    state.enemy = makeEnemy(true);
    if (progress?.active) {
      if (!progress.prefixId) progress.prefixId = state.enemy.bossPrefixId;
      const storedPeriod = Number(progress.encounterPeriod);
      state.enemy.bossCyclePeriod = Math.max(
        0,
        Number.isFinite(storedPeriod)
          ? storedPeriod
          : Number(state.enemy.bossCyclePeriod || 0),
      );
      if (Number.isFinite(progress.hpRatio)) {
        state.enemy.hp = Math.max(
          1,
          Math.round(state.enemy.maxHp * clamp(progress.hpRatio, 0, 1)),
        );
      } else {
        state.enemy.maxHp = progress.maxHp;
        state.enemy.hp = progress.hp;
      }
      state.enemy.huntStartHp = state.enemy.hp;
      progress.hp = state.enemy.hp;
      progress.maxHp = state.enemy.maxHp;
      log(
        `再次遭遇受伤的区域首领 ${state.enemy.name}，挑战${Number(progress.attempts || 0) + 1}/3，剩余生命${Math.round(state.enemy.hp)}/${state.enemy.maxHp}。${bossPrefixText(state.enemy)}`,
        "important",
        "important",
      );
    } else {
      cycle.bossEncounters++;
      cycle.warningIssued = false;
      log(
        `区域首领 ${state.enemy.name} 出现。${bossPrefixText(state.enemy)} 机制：${bossTacticalHint(m.id)}`,
        "important",
        "important",
      );
    }
  } else {
    state.enemy = makeEnemy(false);
    if (state.enemy.treasure)
      log(
        "【稀有遭遇】宝箱怪出现：击败后获得约100倍基础金币！",
        "important",
        "important",
      );
  }
}
function activePet() {
  return state.pets.find((p) => p.id === state.activePetId) || null;
}
function setActivePet(id) {
  const p = state.pets.find((x) => x.id === id);
  if (!p) return;
  if (state.running && state.enemy)
    return alert("请先暂停战斗，再更换出战宠物。");
  state.activePetId = id;
  const ps = petStats(p);
  p.hp = ps.maxHp;
  p.battleTurns = 0;
  p.fallen = false;
  state.temp = state.temp || {};
  state.temp.petGuardTurns = 0;
  state.temp.petAtkBuffTurns = 0;
  state.temp.petAtkBuff = 0;
  log(`${p.name}成为新的出战宠物。`, "sys");
  render();
}
function petAlive(p = activePet()) {
  return !!p && Number(p.hp) > 0 && !p.fallen;
}
function petRoleStatus(p = activePet()) {
  if (!p) return "";
  const type = PET_TYPES[p.type],
    sp = petSpeciesData(p);
  if (!petAlive(p)) return `${sp.archetype} / ${type.role}｜本场已倒下`;
  if (p.type === "Defense" && state.temp?.petGuardTurns > 0)
    return `${sp.archetype} / ${type.role}｜守护剩余${state.temp.petGuardTurns}次受击`;
  if (p.type === "Balance" && state.temp?.petAtkBuffTurns > 0)
    return `${sp.archetype} / ${type.role}｜协同增益剩余${state.temp.petAtkBuffTurns}次攻击`;
  return `${sp.archetype} / ${type.role}`;
}
function enemyDefenseAgainstCompanion(e) {
  let mult = 1;
  if ((e.petArmorBreakTurns || 0) > 0) mult *= 0.78;
  if ((e.petWeakenTurns || 0) > 0) mult *= 0.9;
  return e.def * mult;
}
function markPetFallen(p) {
  if (!p || p.fallen) return;
  if (
    petBaseSpecies(p) === "王魂侍从" &&
    p.evolutionBranches?.stage6 === "apex" &&
    !p.apexRevived
  ) {
    p.apexRevived = true;
    const ps = petStats(p);
    p.hp = Math.max(1, Math.round(ps.maxHp * 0.3));
    log(`${p.name}触发【不灭猎王】，以30%生命复起。`, "important", "important");
    return;
  }
  p.hp = 0;
  p.fallen = true;
  log(`${p.name}生命归零，本场暂时无法继续行动；下一场会自动复活。`, "lose");
}
function tickCompanionEffects(e) {
  if (!e) return;
  [
    "petArmorBreakTurns",
    "petWeakenTurns",
    "skillArmorBreakTurns",
    "speciesWeakenTurns",
    "frostbiteTurns",
  ].forEach((k) => {
    if ((e[k] || 0) > 0) e[k]--;
  });
}
function petStats(p) {
  const g = PET_TYPES[p.type].growth,
    a = migratePetAptitudes(p),
    tm = petTierMult(p.tier || 1),
    xm = p.mutant ? PET_MUTANT_MULT : 1,
    rp = rebirthProfile(),
    ib = petTierInstincts(p),
    all = ib.all,
    b = p.evolutionBranches || {},
    species = petBaseSpecies(p);
  let s = {
    maxHp: Math.round(
      (p.baseHp + g.hp * p.level) *
        PET_GRADE_MULT[a.hp] *
        tm *
        xm *
        ib.hp *
        all,
    ),
    atk: Math.round(
      (p.baseAtk + g.atk * p.level) *
        PET_GRADE_MULT[a.atk] *
        tm *
        xm *
        rp.petPower *
        (raceTraitPowers().petPower || 1) *
        ib.atk *
        all,
    ),
    def: Math.round(
      (p.baseDef + g.def * p.level) *
        PET_GRADE_MULT[a.def] *
        tm *
        xm *
        ib.def *
        all,
    ),
    magic: Math.round(
      (p.baseMagic + g.magic * p.level) *
        PET_GRADE_MULT[a.magic] *
        tm *
        xm *
        rp.petPower *
        (raceTraitPowers().petPower || 1) *
        ib.magic *
        all,
    ),
  };
  if (b.stage3 === "assault") {
    if (species === "树灵幼芽" || species === "霜鳍幼兽")
      s.magic = Math.round(s.magic * 1.18);
    else s.atk = Math.round(s.atk * 1.18);
  }
  if (b.stage3 === "guardian") {
    s.maxHp = Math.round(s.maxHp * 1.18);
    s.def = Math.round(s.def * 1.18);
  }
  if (b.stage6 === "apex") {
    if (["树灵幼芽", "霜鳍幼兽"].includes(species))
      s.magic = Math.round(s.magic * 1.15);
    else s.atk = Math.round(s.atk * 1.15);
  }
  if (b.stage6 === "harmony") {
    s.maxHp = Math.round(s.maxHp * 1.1);
    s.atk = Math.round(s.atk * 1.08);
    s.def = Math.round(s.def * 1.1);
    s.magic = Math.round(s.magic * 1.08);
  }
  return s;
}
function rollPetType() {
  return PET_TYPE_IDS[Math.floor(Math.random() * PET_TYPE_IDS.length)];
}
const PET_SPECIES_ICONS = {
  灰尾幼狼: "🐺",
  裂风幼狮: "🦁",
  树灵幼芽: "🌱",
  霜鳍幼兽: "🐬",
  王魂侍从: "👻",
  星核幼龙: "🐉",
};
function petSpeciesIcon(p) {
  return PET_SPECIES_ICONS[petBaseSpecies(p)] || "🐾";
}
function petPortrait(p) {
  if (!p) return "";
  return `<div class="pet-portrait ${p.mutant ? "mutant" : ""}" title="${p.name}">${petSpeciesIcon(p)}<small>${p.tier || 1}阶</small></div>`;
}
function itemVisualClass(it) {
  return it?.rarity === 5 ? "mythic-item" : "";
}
function petTypeIcon(type) {
  return type === "Attack"
    ? "🐺"
    : type === "Defense"
      ? "🐢"
      : type === "Magic"
        ? "🦉"
        : "🦊";
}
function petTypeCounts() {
  const counts = { Attack: 0, Defense: 0, Magic: 0, Balance: 0 };
  state.pets.forEach((p) => (counts[p.type] = (counts[p.type] || 0) + 1));
  return counts;
}
function rollPetMutation(mapDef = map(), lootMult = 1) {
  const mult = Math.max(1, lootMult),
    luck = stats().luck,
    d = dangerDropProfile(mapDef.id),
    base = Math.min(0.009, 0.0025 + luck * 0.000012);
  return (
    Math.random() < Math.min(0.042, 0.014 * mult, base * d.mutation * mult)
  );
}
function petVariantLabel(p) {
  return p?.mutant ? '<span class="mutant-x">变异 X</span>' : "普通种";
}
function petKeepScore(p) {
  return (
    (p?.mutant ? 1000000 : 0) +
    petCombatPower(p) * 10 +
    petOverallScore(p) * 100 +
    (p?.level || 1) * 5 +
    Math.round(petEvolutionProgress(p) * 3000)
  );
}

/* ===== core-09.js ===== */
function createPet(name, type, mapIndex, lootMult = 1) {
  const m = MAPS[mapIndex] || map(),
    tier = rollPetTier(m),
    mutant = rollPetMutation(m, lootMult),
    p = {
      id: "p" + state.nextId++,
      name,
      baseSpecies: petBaseSpecies(name),
      type,
      tier,
      mutant,
      mutationGrade: mutant ? "X" : null,
      level: 1,
      xp: 0,
      evolutionXp: 0,
      fusionInvestedXp: mutant ? 100 : 1,
      aptitudes: rollPetAptitudes(type, mapIndex),
      baseHp: 34,
      baseAtk: 5,
      baseDef: 2,
      baseMagic: 3,
      hp: 1,
      locked: false,
      battleTurns: 0,
      fallen: false,
    };
  p.hp = petStats(p).maxHp;
  return p;
}
function petDustValue(p) {
  const base =
    (PET_DUST_VALUES[petOverallGrade(p)] || 4) +
    Math.floor(p.level / 5) +
    (p.tier || 1) * 2;
  return p.mutant ? base * 8 : base;
}
function bestReplacementPet(excludeId = null) {
  return (
    state.pets
      .filter((p) => p.id !== excludeId && !p.locked)
      .sort((a, b) => petKeepScore(b) - petKeepScore(a))[0] ||
    state.pets
      .filter((p) => p.id !== excludeId)
      .sort((a, b) => petKeepScore(b) - petKeepScore(a))[0] ||
    null
  );
}
function activateReplacement(excludeId = null) {
  const next = bestReplacementPet(excludeId);
  state.activePetId = next ? next.id : null;
  if (next) {
    const ps = petStats(next);
    next.hp = ps.maxHp;
    next.fallen = false;
    next.battleTurns = 0;
  }
  return next;
}
function removePet(id) {
  const i = state.pets.findIndex((p) => p.id === id);
  if (i < 0) return null;
  return state.pets.splice(i, 1)[0];
}
function releasePet(id, ask = true) {
  const p = state.pets.find((x) => x.id === id);
  if (!p) return alert("找不到这只宠物。");
  if (p.locked) return alert("该宠物已锁定，请先解锁后再放归。");
  const wasActive = p.id === state.activePetId,
    value = petDustValue(p),
    warning = p.mutant ? "\n\n【警告】这是红色变异X宠物，掉落极低。" : "";
  if (
    ask &&
    !confirm(
      `放归${p.tier || 1}阶${p.mutant ? "变异X " : ""}${p.name}[${petOverallGrade(p)}]？\n宠物会永久消失，并获得${value}灵宠精华。${wasActive ? "\n这是当前出战宠物，放归后会自动选择其他宠物出战。" : ""}${warning}`,
    )
  )
    return false;
  removePet(id);
  state.petDust += value;
  const next = wasActive ? activateReplacement(id) : activePet();
  log(
    `放归${p.mutant ? "变异X " : ""}${p.name}[${petOverallGrade(p)}]，灵宠精华+${value}${wasActive ? (next ? `，${next.name}自动接替出战` : "，当前没有出战宠物") : ""}。`,
    "loot",
  );
  render();
  return true;
}
function feedPet(id, ask = true) {
  const material = state.pets.find((x) => x.id === id);
  if (!material) return alert("找不到经验素材宠物。");
  if (material.locked) return alert("该宠物已锁定，请先解锁后再进行经验转化。");
  let target = activePet();
  if (!target || target.id === material.id)
    target = bestReplacementPet(material.id);
  if (!target)
    return alert(
      "至少需要另一只宠物作为经验接收目标。当前只有这一只宠物，不能转化。",
    );
  const xp =
      16 +
      petOverallScore(material) * 8 +
      material.level * 4 +
      (material.tier || 1) * 8,
    wasActive = material.id === state.activePetId,
    warning = material.mutant
      ? "\n\n【警告】素材是红色变异X宠物，掉落极低。"
      : "";
  if (
    ask &&
    !confirm(
      `经验转化预览：\n素材：${material.tier || 1}阶 ${material.mutant ? "变异X " : ""}${material.name}[${petOverallGrade(material)}]\n目标：${target.tier || 1}阶 ${target.mutant ? "变异X " : ""}${target.name}[${petOverallGrade(target)}]\n获得经验：${xp}\n\n素材宠物会永久消失。${warning}`,
    )
  )
    return false;
  removePet(id);
  petGainXp(target, xp);
  if (wasActive) {
    state.activePetId = target.id;
    const ps = petStats(target);
    target.hp = ps.maxHp;
    target.fallen = false;
    target.battleTurns = 0;
  }
  log(
    `${material.mutant ? "变异X " : ""}${material.name}[${petOverallGrade(material)}]已转化为经验，${target.name}经验+${xp}${wasActive ? "并接替出战" : ""}。`,
    "loot",
  );
  render();
  return true;
}
function bestAptitudeInheritance(target, donor) {
  if (!target || !donor || !samePetSpecies(target, donor)) return null;
  const ta = migratePetAptitudes(target),
    da = migratePetAptitudes(donor),
    gains = [];
  Object.keys(ta).forEach((stat) => {
    const gap = gradeIndex(da[stat]) - gradeIndex(ta[stat]);
    if (gap > 0) gains.push({ stat, from: ta[stat], to: da[stat], gap });
  });
  gains.sort((a, b) => b.gap - a.gap || gradeIndex(b.to) - gradeIndex(a.to));
  return gains[0] || null;
}
function sameSpeciesDonors(target, mutant = false) {
  return state.pets.filter(
    (p) =>
      p.id !== target.id &&
      samePetSpecies(p, target) &&
      !p.locked &&
      p.id !== state.activePetId &&
      !!p.mutant === !!mutant,
  );
}
function fusionPlan(target) {
  if (!target) return null;
  const donors = sameSpeciesDonors(target, false);
  if (!donors.length) return null;
  const plans = donors
    .map((donor) => {
      const apt = bestAptitudeInheritance(target, donor),
        evo = petEvolutionValue(donor);
      return { target, donor, apt, evo, keep: petKeepScore(donor) };
    })
    .filter((x) => x.evo > 0 || x.apt);
  if (!plans.length) return null;
  plans.sort(
    (a, b) =>
      Number(!!b.apt) - Number(!!a.apt) ||
      (b.apt?.gap || 0) - (a.apt?.gap || 0) ||
      a.keep - b.keep,
  );
  const best = plans[0];
  best.cost = Math.round(
    80 +
      (target.tier || 1) * 55 +
      (best.donor.tier || 1) * 25 +
      Math.pow(1.1, Math.max(0, (target.tier || 1) - 1)) * 35 +
      (best.apt?.gap || 0) * 45,
  );
  return best;
}
function mutantFusionPlan(target) {
  if (!target) return null;
  const donors = sameSpeciesDonors(target, true);
  if (!donors.length) return null;
  const plans = donors
    .map((donor) => ({
      target,
      donor,
      apt: bestAptitudeInheritance(target, donor),
      evo: petEvolutionValue(donor),
      keep: petKeepScore(donor),
    }))
    .filter((x) => x.evo > 0 || x.apt);
  if (!plans.length) return null;
  plans.sort(
    (a, b) => a.keep - b.keep || (b.apt?.gap || 0) - (a.apt?.gap || 0),
  );
  const best = plans[0];
  best.cost = Math.round(
    160 +
      (target.tier || 1) * 80 +
      (best.donor.tier || 1) * 40 +
      Math.pow(1.1, Math.max(0, (target.tier || 1) - 1)) * 55,
  );
  return best;
}
function fusionPreviewText(plan) {
  return plan.apt
    ? `资质继承：${PET_APT_NAMES[plan.apt.stat]} ${plan.apt.from} → ${plan.apt.to}\n`
    : "";
}
function mergePet(id) {
  const target = state.pets.find((x) => x.id === id);
  if (!target) return alert("找不到融合目标。");
  const plan = fusionPlan(target);
  if (!plan) {
    const ordinary = sameSpeciesDonors(target, false);
    if (!ordinary.length)
      return alert(
        "没有可用的普通同类素材。融合进阶只要求同物种；若素材任一资质更高，会自动继承差距最大的一项。",
      );
    return alert(
      "当前普通同类素材既不能提供有效进阶经验，也没有可继承的更高资质。",
    );
  }
  if (state.gold < plan.cost) return alert(`金币不足，需要${plan.cost}金币。`);
  const beforeTier = target.tier || 1,
    beforeLevel = target.level || 1,
    levelXp = petLevelInvestment(plan.donor);
  if (
    !confirm(
      `同类融合预览：\n目标：${beforeTier}阶 Lv.${beforeLevel} ${PET_TYPES[target.type].name} ${target.name}\n素材：${plan.donor.tier || 1}阶 Lv.${plan.donor.level || 1} ${PET_TYPES[plan.donor.type].name} ${plan.donor.name}\n继承进阶经验：+${plan.evo}（包含素材历次融合已经消耗的经验）\n继承等级经验：+${levelXp}\n${fusionPreviewText(plan)}消耗：${plan.cost}金币\n\n素材已有的阶级经验、等级经验和更高资质都会保留；素材会永久消失。`,
    )
  )
    return;
  state.gold -= plan.cost;
  if (plan.apt) migratePetAptitudes(target)[plan.apt.stat] = plan.apt.to;
  const inherited = inheritPetEvolution(target, plan.donor),
    upgrades = inherited.upgrades;
  removePet(plan.donor.id);
  const ps = petStats(target);
  target.hp = Math.min(ps.maxHp, Math.max(1, target.hp || ps.maxHp));
  const tierLog = upgrades.length ? `，进化至${target.tier}阶` : "",
    levelLog =
      target.level > beforeLevel
        ? `，Lv.${beforeLevel}→Lv.${target.level}`
        : "";
  log(
    `融合完成：进阶经验+${inherited.evolutionXp}，等级经验+${inherited.levelXp}${plan.apt ? `，${PET_APT_NAMES[plan.apt.stat]}提升至${plan.apt.to}` : ""}${tierLog}${levelLog}。`,
    "loot",
  );
  render();
}
function mergeMutantPet(id) {
  const target = state.pets.find((x) => x.id === id);
  if (!target) return alert("找不到融合目标。");
  const plan = mutantFusionPlan(target);
  if (!plan)
    return alert(
      "没有可消耗的变异X同类素材。出战宠物和锁定宠物不会被自动选作素材。",
    );
  if (state.gold < plan.cost) return alert(`金币不足，需要${plan.cost}金币。`);
  const donor = plan.donor,
    beforeLevel = target.level || 1,
    warning = target.mutant
      ? "目标本身已经是变异X。"
      : "注意：素材的“变异X”不会转移给普通目标，但其全部阶级与等级培养成果会保留。";
  if (
    !confirm(
      `【变异X进阶】\n目标：${target.tier || 1}阶 Lv.${beforeLevel} ${target.mutant ? "变异X " : ""}${target.name}\n素材：${donor.tier || 1}阶 Lv.${donor.level || 1} 变异X ${donor.name}\n继承进阶经验：+${plan.evo}\n继承等级经验：+${petLevelInvestment(donor)}\n${plan.apt ? `额外继承：${PET_APT_NAMES[plan.apt.stat]} ${plan.apt.from} → ${plan.apt.to}\n` : ""}消耗：${plan.cost}金币\n\n${warning}\n\n素材极其稀有且会永久消失，确定继续？`,
    )
  )
    return;
  if (!confirm("再次确认：永久消耗这只变异X宠物作为进阶素材？")) return;
  state.gold -= plan.cost;
  if (plan.apt) migratePetAptitudes(target)[plan.apt.stat] = plan.apt.to;
  const inherited = inheritPetEvolution(target, donor),
    upgrades = inherited.upgrades;
  removePet(donor.id);
  const ps = petStats(target);
  target.hp = Math.min(ps.maxHp, Math.max(1, target.hp || ps.maxHp));
  log(
    `变异融合完成：进阶经验+${inherited.evolutionXp}，等级经验+${inherited.levelXp}${upgrades.length ? `，连续进化至${target.tier}阶` : ""}${target.level > beforeLevel ? `，Lv.${beforeLevel}→Lv.${target.level}` : ""}。`,
    "loot",
  );
  render();
}
function togglePetLock(id) {
  const p = state.pets.find((x) => x.id === id);
  if (!p) return;
  p.locked = !p.locked;
  render();
}
function shouldAutoProcessPet(p) {
  const f = state.petFilter || {
    minGrade: "F",
    minTier: 1,
    action: "release",
    keepAnyS: true,
  };
  if (p.mutant) return false;
  const belowTier = (p.tier || 1) < Number(f.minTier || 1),
    belowGrade = gradeIndex(petOverallGrade(p)) < gradeIndex(f.minGrade || "F");
  if (!belowTier && !belowGrade) return false;
  if (f.keepAnyS && petHasHighAptitude(p, "S")) return false;
  return true;
}
function receivePet(p) {
  if (typeof window.onPetReceivedCandidate === "function")
    window.onPetReceivedCandidate(p);
  if (typeof window.beforeReceivePet === "function") {
    const hook = window.beforeReceivePet(p);
    if (hook?.handled) return hook.result;
  }
  const grade = petOverallGrade(p),
    filter = state.petFilter || {
      minGrade: "F",
      minTier: 1,
      action: "release",
      keepAnyS: true,
    };
  if (shouldAutoProcessPet(p)) {
    if (filter.action === "feed" && activePet()) {
      const xp = 16 + petOverallScore(p) * 8 + (p.tier || 1) * 8;
      petGainXp(activePet(), xp);
      log(
        `自动筛选：${p.name}[${grade}]未达保留阈值，作为素材转化为${xp}宠物经验。`,
        "loot",
      );
    } else {
      const value = petDustValue(p);
      state.petDust += value;
      log(
        `自动筛选：${p.name}[${grade}]未达保留阈值，放归获得${value}灵宠精华。`,
        "loot",
      );
    }
    return false;
  }
  if (state.pets.length >= state.petCapacity) {
    const candidates = state.pets
        .filter((x) => x.id !== state.activePetId && !x.locked && !x.mutant)
        .sort((a, b) => petKeepScore(a) - petKeepScore(b)),
      worst = candidates[0];
    if (worst && petKeepScore(p) > petKeepScore(worst)) {
      const value = petDustValue(worst);
      removePet(worst.id);
      state.petDust += value;
      state.pets.push(p);
      log(
        `宠物仓已满，放归较弱的${worst.name}并保留${p.mutant ? "红色变异X " : ""}${p.name}。`,
        "loot",
      );
    } else if (p.mutant) {
      state.pets.push(p);
      state.petCapacity += 1;
      log(`获得红色变异X宠物：仓库临时扩展1格以避免自动丢失。`, "sys");
    } else {
      const value = petDustValue(p);
      state.petDust += value;
      log(
        `宠物仓已满，${p.name}[${grade}]自动放归，灵宠精华+${value}。`,
        "loot",
      );
      return false;
    }
  } else state.pets.push(p);
  if (!state.activePetId) state.activePetId = p.id;
  log(
    `区域首领掉落宠物：${p.tier || 1}阶 ${p.mutant ? '<span class="mutant-x">变异 X</span> ' : ""}${p.name}（${PET_TYPES[p.type].name}）｜综合<span class="grade-${grade}">${grade}</span>｜${aptitudeText(p)}。`,
    "loot",
  );
  return true;
}
const PET_LEVEL_MAX = 100;
function petXpNeed(level) {
  return Math.round(20 + 2.5 * Math.pow(Math.max(1, level), 2));
}
function petGainXp(p, n) {
  if ((p.level || 1) >= PET_LEVEL_MAX) {
    p.level = PET_LEVEL_MAX;
    p.xp = 0;
    return;
  }
  n = Math.max(1, Math.round(n * rebirthProfile().petXp));
  p.xp += n;
  while (p.level < PET_LEVEL_MAX && p.xp >= petXpNeed(p.level)) {
    p.xp -= petXpNeed(p.level);
    p.level++;
    p.hp = petStats(p).maxHp;
  }
  if (p.level >= PET_LEVEL_MAX) {
    p.level = PET_LEVEL_MAX;
    p.xp = 0;
  }
}

/* ===== core-10.js ===== */
function chooseSkill(cat) {
  const s = stats();
  syncSkills();
  const eligible = (state.activeSkillSlots || []).filter((id) => {
    const sk = SKILLS[id];
    if (
      !sk ||
      sk.type !== "active" ||
      sk.cat !== cat ||
      !skillUsable(id) ||
      !skillReady(id) ||
      (typeof window.skillRulePass === "function" && !window.skillRulePass(id))
    )
      return false;
    if ((sk.mp || 0) > state.mp) return false;
    if (sk.kind === "heal" && state.hp >= s.maxHp * (sk.threshold || 0.55))
      return false;
    if (
      sk.kind === "execute" &&
      state.enemy &&
      state.enemy.hp / state.enemy.maxHp > (sk.executeThreshold || 0.25)
    )
      return false;
    return true;
  });
  if (!eligible.length) return null;
  return (
    eligible.find((id) => Math.random() < skillTriggerChance(id, s)) || null
  );
}
function bossPrefixDamageTakenMult(e) {
  return e?.bossPrefixMechanic === "armor" && (e.round || 0) < 4 ? 0.6 : 1;
}
function playerAttack() {
  const s = stats(),
    e = state.enemy;
  if (!e) return;
  const psv = passiveSkillTotals(),
    rt = raceTraitPowers(),
    sid = chooseSkill("attack"),
    extraBoss = e.boss
      ? 1 +
        (amuletPowers().bossDamage || 0) +
        (psv.bossDamage || 0) +
        (rt.bossDamage || 0)
      : 1,
    baseIgnore = clamp((psv.ignoreDef || 0) + (rt.ignoreDef || 0), 0, 0.55);
  if (!sid) {
    const companionBuff =
      (state.temp?.petAtkBuffTurns || 0) > 0
        ? 1 + (state.temp.petAtkBuff || 0)
        : 1;
    let raw =
        s.atk *
        companionBuff *
        (s.balance / 100 + (1 - s.balance / 100) * Math.random()) *
        extraBoss,
      crit = Math.random() * 100 < s.crit;
    if (crit) raw *= s.critMult;
    let targetDef = e.def * (1 - baseIgnore);
    if ((e.petArmorBreakTurns || 0) > 0) targetDef *= 0.78;
    if ((e.petWeakenTurns || 0) > 0) targetDef *= 0.9;
    if ((e.skillArmorBreakTurns || 0) > 0)
      targetDef *= 1 - (e.skillArmorBreak || 0.25);
    let dmg = Math.max(
      1,
      Math.round((raw - targetDef) * bossPrefixDamageTakenMult(e)),
    );
    if (e.shield > 0) {
      dmg = Math.max(1, Math.round(dmg * 0.55));
      e.shield = 0;
      log(`${e.name}的护盾吸收了部分伤害。`, "lose", "defense");
    }
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, "普通攻击");
    if ((state.temp?.petAtkBuffTurns || 0) > 0) state.temp.petAtkBuffTurns--;
    log(
      `普通攻击造成${dmg}伤害${companionBuff > 1 ? "（宠物增益）" : ""}。`,
      "",
      "damage",
    );
    return;
  }
  const sk = SKILLS[sid],
    lv = skillLevel(sid),
    power = skillPower(sid),
    hits = sk.hits || 1;
  state.mp -= sk.mp || 0;
  let mult = (sk.mult || 1) * power,
    ignore = clamp((sk.ignore || 0) + baseIgnore, 0, 0.9),
    drain = 0;
  if (sk.kind === "execute" && e.hp / e.maxHp <= (sk.executeThreshold || 0.25))
    mult = (sk.executeMult || sk.mult || 1) * power;
  if (sk.kind === "drain") drain = (sk.drain || 0) * (1 + (lv - 1) * 0.03);
  const companionBuff =
    (state.temp?.petAtkBuffTurns || 0) > 0
      ? 1 + (state.temp.petAtkBuff || 0)
      : 1;
  let total = 0;
  for (let i = 0; i < hits; i++) {
    let raw =
        s.atk *
        mult *
        companionBuff *
        (s.balance / 100 + (1 - s.balance / 100) * Math.random()) *
        extraBoss,
      crit = Math.random() * 100 < s.crit;
    if (crit) raw *= s.critMult;
    let targetDef = e.def * (1 - ignore);
    if ((e.petArmorBreakTurns || 0) > 0) targetDef *= 0.78;
    if ((e.petWeakenTurns || 0) > 0) targetDef *= 0.9;
    if ((e.skillArmorBreakTurns || 0) > 0)
      targetDef *= 1 - (e.skillArmorBreak || 0.25);
    let dmg = Math.max(
      1,
      Math.round((raw - targetDef) * bossPrefixDamageTakenMult(e)),
    );
    if (e.shield > 0) {
      dmg = Math.max(1, Math.round(dmg * 0.55));
      e.shield = 0;
    }
    e.hp -= dmg;
    total += dmg;
  }
  if ((state.temp?.petAtkBuffTurns || 0) > 0) state.temp.petAtkBuffTurns--;
  if (drain && state.hp > 0) {
    const h = Math.round(total * drain * (rt.drain || 1));
    state.hp = Math.min(s.maxHp, state.hp + h);
  }
  healFromGlobalLifesteal(total, sk.name);
  if (sk.kind === "debuff") {
    e.skillArmorBreakTurns = Math.max(
      e.skillArmorBreakTurns || 0,
      sk.debuffTurns || 3,
    );
    e.skillArmorBreak = sk.debuffArmor || 0.25;
  }
  registerSkillUse(sid);
  setSkillCooldown(sid);
  log(
    `${sk.name} Lv.${lv}造成${total}伤害${drain ? `，恢复${Math.round(total * drain * (rt.drain || 1))}生命` : ""}${sk.kind === "debuff" ? `，敌人防御降低${Math.round((sk.debuffArmor || 0.25) * 100)}%` : ""}。`,
    "skill",
    drain ? "defense" : "damage",
  );
}
function playerAlive() {
  return state.hp > 0;
}
function partyDefeated() {
  const p = activePet();
  return !playerAlive() && (!p || !petAlive(p));
}
function markPlayerFallen() {
  if (state.hp > 0) return;
  state.hp = 0;
  if (!state.temp) state.temp = {};
  if (!state.temp.playerFallenLogged) {
    state.temp.playerFallenLogged = true;
    log(
      `${state.name}已经倒下，但宠物仍可继续战斗；只有双方都倒下才算失败。`,
      "lose",
    );
  }
}
function enemyAttack() {
  const e = state.enemy,
    s = stats(),
    p = activePet(),
    ps = p ? petStats(p) : null;
  if (!e) return;
  e.round = (e.round || 0) + 1;
  if (e.bossPrefixMechanic === "ward" && e.round % 4 === 0) {
    e.shield = 1;
    log(`${e.name}展开藏宝护盾，下一次受到的伤害降低。`, "lose", "defense");
  }
  if (e.bossPrefixMechanic === "renewal" && e.round % 4 === 0) {
    const h = Math.max(1, Math.round(e.maxHp * 0.05));
    e.hp = Math.min(e.maxHp, e.hp + h);
    log(`${e.name}获得天眷，恢复${h}生命。`, "lose", "defense");
  }
  if (
    e.bossPrefixMechanic === "ascension" &&
    !e.prefixAscended &&
    e.hp / e.maxHp <= 0.5
  ) {
    e.prefixAscended = true;
    e.atk = Math.round(e.atk * 1.3);
    e.speed = Math.round(e.speed * 1.15);
    e.shield = 1;
    log(
      `${e.name}完成星辉升华：攻击与速度提高，并获得护盾。`,
      "important",
      "important",
    );
  }
  if (e.boss && e.mapId === "meadow" && !e.enraged && e.hp < e.maxHp * 0.35) {
    e.enraged = true;
    e.atk = Math.round(e.atk * 1.25);
    e.speed = Math.round(e.speed * 1.2);
    log(`${e.name}进入狂暴，攻击与速度提高。`, "lose");
  }
  if (e.boss && e.mapId === "forest" && e.round % 4 === 0) {
    const suppressed =
        petBaseSpecies(p) === "树灵幼芽" &&
        p.evolutionBranches?.stage6 === "apex",
      h = Math.round(e.maxHp * 0.045 * (suppressed ? 0.4 : 1));
    e.hp = Math.min(e.maxHp, e.hp + h);
    log(
      `${e.name}汲取魂木，恢复${h}生命${suppressed ? "（噬魂古树压制）" : ""}。`,
      "lose",
    );
  }
  if (e.boss && e.mapId === "ruins" && e.round % 5 === 0) {
    e.shield = 1;
    log(`${e.name}展开王魂护盾，下一次受到的伤害降低。`, "lose");
  }
  if (e.boss && e.mapId === "abyss" && e.round % 3 === 0 && playerAlive()) {
    const drain = Math.min(6, state.mp);
    state.mp -= drain;
    log(`${e.name}吞噬${drain}点法力。`, "lose");
  }
  if (e?.boss && e.mapId === "abyss") {
    if (e.abyssVariant === "regen" && e.round % 4 === 0) {
      const h = Math.max(1, Math.round(e.maxHp * 0.055));
      e.hp = Math.min(e.maxHp, e.hp + h);
      log(`${e.name}发动深层再生，恢复${h}生命。`, "lose", "defense");
    }
    if (e.abyssVariant === "mirror" && e.round % 4 === 0) {
      e.shield = 1;
      log(`${e.name}展开星渊镜界，下一次受到的伤害降低。`, "lose", "defense");
    }
    if (
      e.abyssVariant === "frenzy" &&
      !e.abyssFrenzied &&
      e.hp / e.maxHp <= 0.5
    ) {
      e.abyssFrenzied = true;
      e.atk = Math.round(e.atk * 1.35);
      e.speed = Math.round(e.speed * 1.2);
      log(`${e.name}进入狂星状态。`, "lose", "important");
    }
  }
  const genericWeak = (e.petWeakenTurns || 0) > 0 ? 0.85 : 1,
    speciesWeak =
      (e.speciesWeakenTurns || 0) > 0 ? 1 - (e.speciesWeakenPower || 0.2) : 1,
    frostWeak = (e.frostbiteTurns || 0) > 0 ? 1 - (e.frostbitePower || 0.1) : 1,
    enemyAtk = e.atk * genericWeak * speciesWeak * frostWeak,
    pAlive = petAlive(p),
    heroAlive = playerAlive();
  let petTargetChance = 0;
  if (pAlive && !heroAlive) petTargetChance = 1;
  else if (pAlive && heroAlive)
    petTargetChance =
      { Attack: 0.22, Defense: 0.42, Magic: 0.28, Balance: 0.26 }[p.type] ||
      0.25;
  if (pAlive && Math.random() < petTargetChance) {
    const bossMult =
      e.boss && e.mapId === "hill" && e.round % 4 === 0 ? 1.65 : 1;
    if (bossMult > 1) log(`${e.name}发动裂风扑杀，目标是${p.name}。`, "lose");
    const dmg = Math.max(
      1,
      Math.round(
        (enemyAtk * bossMult - ps.def * 0.72) *
          (0.88 + Math.random() * 0.24) *
          petDamageTakenMult(p),
      ),
    );
    p.hp -= dmg;
    log(`${e.name}攻击${p.name}，造成${dmg}伤害。`, "lose");
    if (p.hp <= 0) markPetFallen(p);
    return;
  }
  if (!heroAlive) return;
  let reduction = playerDamageTakenPetMult(p),
    reflect = 0,
    counterMult = 0,
    defSkill = chooseSkill("defense"),
    defLv = defSkill ? skillLevel(defSkill) : 1;
  if (defSkill) {
    const sk = SKILLS[defSkill],
      power = skillPower(defSkill);
    if (sk.kind === "heal") {
      state.mp -= sk.mp || 0;
      const h = Math.round(
        (s.maxHp * (sk.healPct || 0.23) + s.int * (sk.intScale || 0.8)) *
          power *
          (raceTraitPowers().healing || 1) *
          (1 + (passiveSkillTotals().healing || 0)),
      );
      state.hp = Math.min(s.maxHp, state.hp + h);
      log(`${sk.name} Lv.${defLv}恢复${h}生命。`, "skill");
    } else if (sk.kind === "reduce") {
      const reducePct = Math.min(0.85, (sk.reduce || 0.45) * power);
      reduction *= 1 - reducePct;
      log(
        `${sk.name} Lv.${defLv}减轻${Math.round(reducePct * 100)}%本次伤害。`,
        "skill",
      );
    } else if (sk.kind === "counter") {
      counterMult = (sk.counterMult || 0.72) * power;
      log(`${sk.name} Lv.${defLv}进入反击姿态。`, "skill");
    } else if (sk.kind === "mirror") {
      const reducePct = Math.min(0.85, (sk.reduce || 0.55) * power);
      reduction *= 1 - reducePct;
      reflect = (sk.reflect || 0.45) * power;
      log(`${sk.name} Lv.${defLv}展开镜返。`, "skill");
    }
    registerSkillUse(defSkill);
    setSkillCooldown(defSkill);
  }
  if ((state.temp?.petGuardTurns || 0) > 0) {
    reduction *= 0.8;
    state.temp.petGuardTurns--;
  }
  if ((state.temp?.speciesGuardTurns || 0) > 0) {
    reduction *= 1 - (state.temp.speciesGuardPower || 0.2);
    state.temp.speciesGuardTurns--;
  }
  const bossMult = e.boss && e.mapId === "hill" && e.round % 4 === 0 ? 1.65 : 1;
  if (bossMult > 1) log(`${e.name}发动裂风扑杀。`, "lose");
  let dmg = Math.max(
      1,
      Math.round(
        (enemyAtk * bossMult - s.def * 0.65) *
          reduction *
          (0.88 + Math.random() * 0.24),
      ),
    ),
    actualPlayerDmg = 0;
  if (pAlive && p.type === "Defense" && Math.random() < 0.58) {
    const redirected = Math.max(1, Math.round(dmg * 0.58)),
      petDamage = Math.max(1, Math.round(redirected - ps.def * 0.16)),
      playerDamage = Math.max(1, dmg - redirected);
    p.hp -= petDamage;
    state.hp -= playerDamage;
    actualPlayerDmg = playerDamage;
    log(
      `${p.name}发动护主，分担${petDamage}伤害；${state.name}受到${playerDamage}伤害。`,
      "skill",
    );
    if (p.hp <= 0) markPetFallen(p);
  } else {
    state.hp -= dmg;
    actualPlayerDmg = dmg;
    log(`${e.name}造成${dmg}伤害。`, "lose");
  }
  if (state.hp <= 0) markPlayerFallen();
  if (reflect > 0 && actualPlayerDmg > 0) {
    const r = Math.max(1, Math.round(actualPlayerDmg * reflect));
    e.hp -= r;
    healFromGlobalLifesteal(r, "镜返");
    log(`镜返反射${r}伤害。`, "skill");
  }
  if (counterMult > 0 && playerAlive()) {
    const c = Math.max(1, Math.round(s.atk * counterMult - e.def * 0.35));
    e.hp -= c;
    healFromGlobalLifesteal(c, "反击");
    log(`反击造成${c}伤害。`, "skill");
  }
}
function petTurn() {
  const p = activePet(),
    e = state.enemy;
  if (!p || !e || !petAlive(p)) return;
  const ps = petStats(p),
    s = stats();
  p.battleTurns = (p.battleTurns || 0) + 1;
  const speciesMult = petSpeciesDamageMult(p, e);
  petSpeciesSpecial(p, e, ps, s);
  if (e.hp <= 0) return;
  if (p.type === "Attack") {
    const special = p.battleTurns % 3 === 0,
      mult = (special ? 1.65 : 1.05) * speciesMult,
      dmg = Math.max(
        1,
        Math.round(
          ps.atk * mult +
            ps.magic * 0.22 -
            enemyDefenseAgainstCompanion(e) * 0.38,
        ),
      );
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    if (special) {
      e.petArmorBreakTurns = 2;
      log(
        `${p.name}发动类型技能【撕裂】，造成${dmg}伤害并降低敌人防御。`,
        "skill",
      );
    } else log(`${p.name}攻击造成${dmg}伤害。`, "skill");
  } else if (p.type === "Defense") {
    const dmg = Math.max(
      1,
      Math.round(
        ps.atk * 0.66 * speciesMult +
          ps.def * 0.18 -
          enemyDefenseAgainstCompanion(e) * 0.3,
      ),
    );
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    if (p.battleTurns % 4 === 0 && playerAlive()) {
      state.temp.petGuardTurns = 2;
      log(
        `${p.name}发动类型技能【守护领域】：接下来两次玩家受击降低20%。`,
        "skill",
      );
    } else log(`${p.name}牵制敌人，造成${dmg}伤害。`, "skill");
  } else if (p.type === "Magic") {
    if (p.battleTurns % 3 === 0) {
      const playerRatio = playerAlive() ? state.hp / s.maxHp : 1,
        petRatio = p.hp / ps.maxHp;
      if (Math.min(playerRatio, petRatio) < 0.72) {
        const heal = Math.max(3, Math.round(ps.magic * 1.35 + ps.maxHp * 0.08));
        if (playerAlive() && playerRatio <= petRatio) {
          state.hp = Math.min(s.maxHp, state.hp + heal);
          log(
            `${p.name}施放【灵愈】，为${state.name}恢复${heal}生命。`,
            "skill",
          );
        } else {
          p.hp = Math.min(ps.maxHp, p.hp + heal);
          log(`${p.name}施放【自愈】，恢复${heal}生命。`, "skill");
        }
      } else {
        e.petWeakenTurns = 2;
        log(`${p.name}施放【衰弱咒】：敌人攻击降低15%、防御降低10%。`, "skill");
      }
    } else {
      const dmg = Math.max(
        1,
        Math.round(
          ps.magic * 1.18 * speciesMult +
            ps.atk * 0.28 -
            enemyDefenseAgainstCompanion(e) * 0.32,
        ),
      );
      e.hp -= dmg;
      healFromGlobalLifesteal(dmg, p.name);
      log(`${p.name}释放灵能，造成${dmg}伤害。`, "skill");
    }
  } else {
    const dmg = Math.max(
      1,
      Math.round(
        ps.atk * 0.78 * speciesMult +
          ps.magic * 0.58 * speciesMult -
          enemyDefenseAgainstCompanion(e) * 0.34,
      ),
    );
    e.hp -= dmg;
    healFromGlobalLifesteal(dmg, p.name);
    if (p.battleTurns % 4 === 0) {
      const petHeal = Math.max(2, Math.round(ps.maxHp * 0.07));
      p.hp = Math.min(ps.maxHp, p.hp + petHeal);
      if (playerAlive()) {
        const playerHeal = Math.max(2, Math.round(s.maxHp * 0.055));
        state.hp = Math.min(s.maxHp, state.hp + playerHeal);
        state.temp.petAtkBuff = 0.12;
        state.temp.petAtkBuffTurns = 2;
        log(`${p.name}发动【协同鼓舞】：双方恢复生命并强化玩家攻击。`, "skill");
      } else
        log(`${p.name}发动【协同鼓舞】：自身恢复${petHeal}生命。`, "skill");
    } else log(`${p.name}协同攻击造成${dmg}伤害。`, "skill");
  }
  petSpeciesAfterAction(p);
}

/* ===== core-11.js ===== */
function dangerRise(m, cycle) {
  const cap = threatCap(m.id),
    current = cycle.threatTier || 0,
    limit = Number.isFinite(cap) ? cap : 999;
  cycle.dangerFail = Math.max(0, (cycle.dangerFail || 0) - 1.5);
  if (current < limit) {
    cycle.threatTier = current + 1;
    cycle.threatUnlocked = Math.max(
      cycle.threatUnlocked || 0,
      cycle.threatTier,
    );
    log(
      `击败${m.boss}，${m.name}危险度自动升至T${cycle.threatTier}。敌人和掉落同步增强。`,
      "important",
      "important",
    );
  } else log(`${m.name}已完成最高危险度T${cap}。`, "important", "important");
}
function dangerRecordWin(cycle, boss = false) {
  cycle.dangerFail = Math.max(0, (cycle.dangerFail || 0) - (boss ? 1.5 : 0.35));
}
function dangerRecordLoss(e, m, cycle) {
  cycle.dangerFail = (cycle.dangerFail || 0) + (e?.boss ? 2 : 1);
  const current = cycle.threatTier || 0;
  if (current > 0) {
    cycle.threatTier = current - 1;
    log(
      `战斗失败，${m.name}危险度自动降至T${cycle.threatTier}；历史最高仍为T${cycle.threatUnlocked || current}。`,
      "important",
      "important",
    );
  }
}
function maybeWarnBoss(m, cycle) {
  if (cycle.warningIssued || state.bossProgress?.[m.id]?.active) return;
  const cfg = bossCycleConfig(m.id),
    remaining = cfg.period - cycle.normalSinceBoss;
  if (remaining > 0 && remaining <= 3) {
    cycle.warningIssued = true;
    log(
      `【Boss预告】再击败${remaining}只普通怪后必定遭遇${m.boss}。机制：${bossTacticalHint(m.id)}`,
      "important",
      "important",
    );
  }
}
function grantFirstBossMilestone(m) {
  state.firstBossMilestoneClaimed = true;
  state.starterProfessionPending = false;
  if (!state.pets.some((p) => petBaseSpecies(p) === m.pet)) {
    const pet = createPet(m.pet, "Balance", 0);
    pet.locked = true;
    if (state.pets.length >= state.petCapacity) state.petCapacity++;
    state.pets.push(pet);
    state.petCodex = state.petCodex || {};
    state.petCodex[m.pet] = (state.petCodex[m.pet] || 0) + 1;
    if (!state.activePetId) state.activePetId = pet.id;
    log(
      `【首领里程碑】${m.boss}留下了已锁定的${m.pet}，它已成为你的第一只伙伴。`,
      "important",
      "important",
    );
  }
  const pool = ["melee", "ranged", "magic"],
    id = pool[rnd(0, pool.length - 1)],
    job = STYLES[id];
  if (!state.unlockedClasses.includes(id)) state.unlockedClasses.push(id);
  state.style = id;
  inheritProfessionProgress(id);
  state.activeSkillSlots = nativeActiveSkills(id).slice(0, 4);
  state.passiveSkillSlots = nativePassiveSkills(id).slice(0, 5);
  syncSkills();
  log(
    `【初阶职业印记】随机显现为${job.icon}${job.name}，职业已永久解锁并自动启用。`,
    "important",
    "important",
  );
  return false;
}
function claimStarterProfession(id) {
  if (
    !state.starterProfessionPending ||
    !["melee", "ranged", "magic"].includes(id)
  )
    return;
  state.starterProfessionPending = false;
  if (!state.unlockedClasses.includes(id)) state.unlockedClasses.push(id);
  state.running = true;
  switchClass(id);
  save();
  render(false);
}
function winBattle() {
  const e = state.enemy,
    m = map(),
    ratio = e.cp / Math.max(1, cp()),
    tm = titleMods(),
    globalMetric = state.metrics,
    mapMetric = ensureMetric(m.id),
    cycle = ensureBossCycle(m.id),
    danger = dangerDropProfile(m.id),
    reward = Number(e.rewardMult || 1),
    lootMult = Math.max(1, Number(e.bossLootMult || 1)),
    firstMilestone =
      e.boss && m.id === "meadow" && !state.firstBossMilestoneClaimed;
  state.totalWins++;
  state.lastDefeatReport = null;
  state.totalKills++;
  registerPassiveBattleWin();
  state.killsByMap[m.id] = (state.killsByMap[m.id] || 0) + 1;
  if (ratio > 1.35) state.highRiskWins++;
  const over = Math.max(0, state.level - (m.levels[1] + 2)),
    levelPenalty = clamp(1 - over * 0.08, 0.12, 1);
  let xp = Math.max(
    1,
    Math.round(
      (5 + e.level * 2.2) *
        clamp(ratio + m.mod, 0.65, 2.2) *
        e.xp *
        ((ratio > 1.25 ? tm.riskXp : 1) || 1) *
        0.61 *
        levelPenalty *
        reward,
    ),
  );
  let gold = Math.max(
    1,
    Math.round(
      (2 + e.level * 0.75) *
        clamp(ratio + m.mod * 0.45, 0.55, 2.6) *
        e.gold *
        (tm.gold || 1) *
        0.15 *
        rebirthProfile().gold *
        reward,
    ),
  );
  gainXp(xp);
  state.gold += gold;
  globalMetric.battles++;
  globalMetric.wins++;
  globalMetric.xp += xp;
  globalMetric.gold += gold;
  mapMetric.battles++;
  mapMetric.wins++;
  mapMetric.xp += xp;
  mapMetric.gold += gold;
  const dropChance = clamp(
    0.18 *
      e.drop *
      (tm.drop || 1) *
      (1 + stats().luck / 300) *
      danger.gearDrop *
      lootMult,
    0.05,
    Math.min(0.98, 0.9 * lootMult),
  );
  if (Math.random() < dropChance) {
    receiveItem(makeItem(e.drop * lootMult));
    globalMetric.drops++;
    mapMetric.drops++;
  }
  if (e.boss && !firstMilestone) tryDropIdentity(e, m);
  const p = activePet();
  if (p) petGainXp(p, Math.max(1, Math.round(xp * 0.35)));
  log(
    `击败 ${e.name}，经验+${xp}，金币+${gold}${e.treasure ? "（宝箱怪100倍基础金币）" : ""}${lootMult > 1 ? `（全域掉宝×${lootMult.toFixed(2)}）` : reward > 1 ? `（危险度收益×${reward.toFixed(2)}）` : ""}。`,
    e.treasure ? "important" : "win",
    e.treasure ? "important" : null,
  );
  let milestoneShown = false;
  if (e.boss) {
    delete state.bossProgress[m.id];
    cycle.normalSinceBoss = 0;
    cycle.retryCountdown = 0;
    cycle.warningIssued = false;
    cycle.bossWins++;
    dangerRise(m, cycle);
    if (firstMilestone) milestoneShown = grantFirstBossMilestone(m);
    else {
      const after = dangerDropProfile(m.id),
        petChance = clamp(
          (0.2 + stats().luck / 500) * (tm.pet || 1) * after.petDrop * lootMult,
          0.12,
          Math.min(0.95, 0.7 * lootMult),
        );
      if (Math.random() < petChance) {
        const pet = createPet(m.pet, rollPetType(), MAPS.indexOf(m), lootMult);
        receivePet(pet);
      }
    }
  } else {
    cycle.normalSinceBoss++;
    dangerRecordWin(cycle, false);
    if (cycle.retryCountdown > 0) cycle.retryCountdown--;
    maybeWarnBoss(m, cycle);
  }
  if (typeof window.onBattleWon === "function") window.onBattleWon(e, m);
  state.enemy = null;
  if (e.boss && typeof window.restoreAfterBossBuild === "function")
    window.restoreAfterBossBuild();
  prepareNewBattle();
  checkTitles();
  save();
  if (milestoneShown) render(false);
  else refreshLiveUI("result");
}
function buildDefeatReport(e) {
  const s = stats(),
    hpLeft = clamp(
      Number(e?.hp || 0) / Math.max(1, Number(e?.maxHp || 1)),
      0,
      1,
    ),
    cpGap = Number(e?.cp || 0) / Math.max(1, cp()),
    skills = (state.activeSkillSlots || [])
      .map((id) => SKILLS[id])
      .filter(Boolean),
    hasPierce = skills.some(
      (sk) => sk.kind === "debuff" || Number(sk.ignore || 0) >= 0.2,
    ),
    hasDefense = skills.some((sk) =>
      ["heal", "reduce", "counter", "mirror"].includes(sk.kind),
    ),
    p = activePet(),
    reasons = [];
  if (e?.bossPrefixMechanic === "armor" && (e.round || 0) < 5)
    reasons.push([
      "镀金开场压制",
      "前4回合减伤40%，需要更稳定的穿透、多段或先承受其开场窗口。",
    ]);
  if (e?.bossPrefixMechanic === "renewal" && hpLeft > 0.45)
    reasons.push([
      "恢复压过输出",
      "天眷前缀与区域恢复正在抵消伤害，优先破甲、处决和爆发技能。",
    ]);
  if (e?.bossPrefixMechanic === "ascension" && e.prefixAscended)
    reasons.push([
      "星辉升华爆发",
      "半血后的攻击与速度突增击穿了构筑，需要减伤、治疗或更快终结。",
    ]);
  if (!hasPierce && e && e.def > s.atk * 0.28)
    reasons.push([
      "破甲不足",
      "当前技能没有可靠穿透或减防，换上破甲技能或攻击型宠物。",
    ]);
  if (!hasDefense && e && e.atk > s.def * 1.45)
    reasons.push([
      "生存不足",
      "没有装备减伤/治疗技能，敌方攻击明显超过当前防御承受区间。",
    ]);
  if (!p || !petAlive(p))
    reasons.push([
      "宠物过早倒下",
      "提高宠物体魄/守护，或改用防御型、施法型宠物分担压力。",
    ]);
  if (hpLeft > 0.6)
    reasons.push([
      "输出不足",
      "失败时敌人仍有大量生命；优先攻击、暴击、技能联动与Boss伤害。",
    ]);
  else if (hpLeft <= 0.18)
    reasons.push([
      "终结能力不足",
      "已经接近击杀；处决技能、速度或一次小幅伤害提升即可突破。",
    ]);
  if (cpGap > 1.75)
    reasons.push([
      "战力跨度过大",
      `敌方CP约为你的${cpGap.toFixed(1)}倍，先刷当前区域装备或降低危险度更有效。`,
    ]);
  const unique = reasons
    .filter(
      (entry, index, all) => all.findIndex((x) => x[0] === entry[0]) === index,
    )
    .slice(0, 3);
  if (!unique.length)
    unique.push([
      "构筑临界",
      "双方战力接近；优先检查技能条件、技能优先级和装备评分偏好。",
    ]);
  return {
    at: Date.now(),
    enemy: e?.name || "未知敌人",
    boss: !!e?.boss,
    enemyHpPct: Math.round(hpLeft * 100),
    rounds: Number(e?.round || 0),
    cpGap: Number(cpGap.toFixed(2)),
    primary: unique[0][0],
    reasons: unique.map(([name, advice]) => ({ name, advice })),
  };
}
function renderDefeatReport() {
  const report = state.lastDefeatReport;
  if (!report) return "";
  return `<div class="defeat-report"><div class="defeat-report-head"><b>上次战败诊断：${report.primary}</b><span>${report.enemy} · 剩余${report.enemyHpPct}% · ${report.rounds}回合</span></div>${report.reasons.map((x) => `<div><b>${x.name}</b>：${x.advice}</div>`).join("")}</div>`;
}
function loseBattle() {
  state.totalLosses++;
  const e = state.enemy,
    m = map(),
    globalMetric = state.metrics,
    mapMetric = ensureMetric(m.id),
    cycle = ensureBossCycle(m.id),
    old = state.bossProgress[m.id],
    storedPeriod = Number(old?.encounterPeriod),
    enemyPeriod = Number(e?.bossCyclePeriod),
    encounterPeriod = e?.boss
      ? Math.max(
          0,
          Number.isFinite(storedPeriod)
            ? storedPeriod
            : Number.isFinite(enemyPeriod)
              ? enemyPeriod
              : bossCycleConfig(m.id).period,
        )
      : 0;
  globalMetric.battles++;
  globalMetric.losses++;
  mapMetric.battles++;
  mapMetric.losses++;
  state.lastDefeatReport = buildDefeatReport(e);
  log(`败给 ${e.name}。下一场战斗开始前恢复满状态。`, "lose");
  log(
    `【战败诊断】${state.lastDefeatReport.primary}：${state.lastDefeatReport.reasons[0].advice}`,
    "important",
    "important",
  );
  dangerRecordLoss(e, m, cycle);
  if (e && e.boss) {
    const attempts = Number(old?.attempts || 0) + 1;
    if (attempts >= 3) {
      delete state.bossProgress[m.id];
      cycle.retryCountdown = 0;
      cycle.normalSinceBoss = 0;
      cycle.warningIssued = false;
      log(
        `【狩猎失败】3次挑战均未击败${m.boss}，首领已完全恢复并离开。${bossTacticalHint(m.id)}`,
        "important",
        "important",
      );
    } else {
      const startHp = Math.max(1, Number(e.huntStartHp || old?.hp || e.maxHp)),
        damage = Math.max(0, startHp - Math.max(0, e.hp)),
        keptHp = Math.max(1, Math.round(startHp - damage * 0.5)),
        hpRatio = clamp(keptHp / Math.max(1, e.maxHp), 0, 1),
        retry = Math.ceil(encounterPeriod * 0.5);
      state.bossProgress[m.id] = {
        active: true,
        hp: keptHp,
        maxHp: e.maxHp,
        hpRatio,
        attempts,
        encounterPeriod,
        prefixId: e.bossPrefixId || old?.prefixId || "none",
      };
      cycle.retryCountdown = retry;
      log(
        `Boss挑战${attempts}/3失败：本次伤害保留50%；本轮完整周期为${encounterPeriod}只，击败其50%（向上取整）即${retry}只普通怪后再战。危险度下降不会改写本轮重遇周期，Boss前缀保持不变。`,
        "important",
        "important",
      );
    }
  }
  if (typeof window.onBattleLost === "function") window.onBattleLost(e, m);
  state.enemy = null;
  if (e?.boss && typeof window.restoreAfterBossBuild === "function")
    window.restoreAfterBossBuild();
  prepareNewBattle();
  refreshLiveUI("result");
}
function battleTick() {
  if (!state.started || !state.running) return;
  state.combatTurn = (state.combatTurn || 0) + 1;
  ensureEnemy();
  const s = stats(),
    e = state.enemy;
  if (!e) return;
  const heroFirst = s.speed >= e.speed;
  if (heroFirst) {
    if (playerAlive()) {
      playerAttack();
      if (e.hp <= 0) return winBattle();
    }
    petTurn();
    if (e.hp <= 0) return winBattle();
    enemyAttack();
    if (e.hp <= 0) return winBattle();
    if (partyDefeated()) return loseBattle();
  } else {
    enemyAttack();
    if (e.hp <= 0) return winBattle();
    if (partyDefeated()) return loseBattle();
    if (playerAlive()) {
      playerAttack();
      if (e.hp <= 0) return winBattle();
    }
    petTurn();
    if (e.hp <= 0) return winBattle();
  }
  if (partyDefeated()) return loseBattle();
  if (playerAlive())
    state.mp = Math.min(
      s.maxMp,
      state.mp + Math.max(1, Math.round(1 + s.will * 0.025)),
    );
  tickCompanionEffects(e);
  renderBattleOnly();
}
function challengeBoss() {
  alert(
    "Alpha 0.40采用自动Boss狩猎：T0每50只普通怪出现一次Boss，每级危险度使周期减少5只；时流法则与猎手罗盘可继续缩短，最低0只，即连续Boss战。失败后完成该次Boss原完整周期的50%（向上取整）再战。每轮最多3次挑战，三次失败后Boss完全恢复。",
  );
}
function changeMap(id) {
  state.mapId = id;
  state.enemy = null;
  prepareNewBattle();
  const m = map(),
    ratio = effectiveMapCp(m) / Math.max(1, cp());
  log(
    `前往 ${m.name}。地图没有进入门槛${ratio > 2 ? "，但当前战力明显不足，预计会频繁战败" : ""}。下一场以满生命和满法力开始。`,
    "sys",
  );
  render();
}
function equipItem(id) {
  const it = state.inventory.find((x) => x.id === id);
  if (!it) return;
  const old = state.equipment[it.slot];
  if (old) state.inventory.push(old);
  state.inventory = state.inventory.filter((x) => x.id !== id);
  state.equipment[it.slot] = it;
  const s = stats();
  state.hp = Math.min(state.hp, s.maxHp);
  state.mp = Math.min(state.mp, s.maxMp);
  render();
}
function sellItem(id, doRender = true) {
  const i = state.inventory.findIndex((x) => x.id === id);
  if (i < 0) return;
  const it = state.inventory[i];
  if (it.locked) return;
  state.inventory.splice(i, 1);
  state.gold += itemSellValue(it);
  if (doRender) render();
  else refreshLiveUI("state");
}
function unequip(slot) {
  const it = state.equipment[slot];
  if (!it) return;
  if (state.inventory.length >= state.inventoryCapacity)
    return alert("背包已满");
  state.inventory.push(it);
  state.equipment[slot] = null;
  render();
}
function toggleSkill(id) {
  state.skills[id] = !state.skills[id];
  save();
  render();
}
function checkTitles() {
  Object.entries(TITLES).forEach(([id, t]) => {
    if (!state.titlesUnlocked.includes(id) && t.unlock(state)) {
      state.titlesUnlocked.push(id);
      log(`解锁称号：${t.name}。`, "loot");
    }
  });
}
function rebirth() {
  if (state.level < 100) return alert("达到Lv.100后才能转生。");
  const laws = ensureRebirthLaws(),
    selected = state.pendingRebirthLaw || "war",
    available = Object.keys(REBIRTH_LAWS).filter(
      (id) => (laws[id] || 0) < REBIRTH_LAW_MAX,
    ),
    law = available.includes(selected) ? selected : available[0] || null,
    lawDef = law ? REBIRTH_LAWS[law] : null,
    next = state.rebirths + 1;
  if (
    !confirm(
      `执行第${next}次转生？\n\n当前身份：${RACES[state.race].name} · ${STYLES[state.style].name}\n${lawDef ? `本次刻印：${lawDef.name}\n${lawDef.desc}` : "三项法则均已Lv.3，本次只获得轮回共鸣。"}\n\n种族/职业已改为永久解锁并可随时切换；转生不会删除任何身份、技能档案、装备或宠物。`,
    )
  )
    return;
  state.rebirths++;
  if (law) state.rebirthLaws[law] = (state.rebirthLaws[law] || 0) + 1;
  state.level = 1;
  state.xp = 0;
  state.base = { str: 6, int: 6, dex: 6, will: 6, luck: 6 };
  state.growthCarry = { str: 0, int: 0, dex: 0, will: 0, luck: 0 };
  state.mapId = "meadow";
  state.enemy = null;
  state.killsByMap = {};
  state.bossProgress = {};
  state.bossCycles = {};
  state.skillReadyAt = {};
  state.combatTurn = 0;
  syncSkills();
  const s = stats();
  state.hp = s.maxHp;
  state.mp = s.maxMp;
  checkTitles();
  log(
    `完成第${state.rebirths}次转生${law ? `，刻印【${lawDef.name}】Lv.${state.rebirthLaws[law]}` : ""}。所有身份与技能档案均保留。`,
    "important",
    "important",
  );
  if (typeof window.onRebirthCompleted === "function")
    window.onRebirthCompleted();
  save();
  render();
}
function merchantGearCost() {
  return Math.round(
    70 +
      state.level * 16 +
      MAPS.indexOf(map()) * 35 +
      (state.shop?.gearBuys || 0) * 3,
  );
}
function buyMerchantGear() {
  const cost = merchantGearCost();
  if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
  state.gold -= cost;
  state.shop.gearBuys++;
  receiveItem(makeItem(1.12, null, null, false));
  log(`向行商购买一件当前区域装备，金币-${cost}。`, "loot");
  render();
}
function activePetTrainingCost() {
  const p = activePet();
  return p ? 50 + p.level * 22 + Math.round((p.tier || 1) * 12) : 0;
}
function trainActivePet() {
  const p = activePet();
  if (!p) return alert("尚无出战宠物。");
  const cost = activePetTrainingCost();
  if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
  state.gold -= cost;
  state.shop.petTraining++;
  const xp = 22 + p.level * 8;
  petGainXp(p, xp);
  log(
    `${p.name}完成训练，获得宠物经验，金币-${cost}。阶级进化只能通过同类融合完成。`,
    "loot",
  );
  render();
}
function lowestPetAptitude(p) {
  const a = migratePetAptitudes(p);
  return Object.keys(a).sort((x, y) => gradeIndex(a[x]) - gradeIndex(a[y]))[0];
}
function aptitudeTrainingCosts(p) {
  const key = lowestPetAptitude(p),
    score = gradeIndex(migratePetAptitudes(p)[key]);
  return { key, gold: 120 + score * 55 + p.level * 10, dust: 4 + score * 3 };
}
function trainPetAptitude() {
  const p = activePet();
  if (!p) return alert("尚无出战宠物。");
  const c = aptitudeTrainingCosts(p),
    a = migratePetAptitudes(p);
  if (gradeIndex(a[c.key]) >= 8) return alert("该宠物四项资质均已达到SSS。");
  if (state.gold < c.gold || state.petDust < c.dust)
    return alert(`需要${c.gold}金币和${c.dust}灵宠精华。`);
  state.gold -= c.gold;
  state.petDust -= c.dust;
  a[c.key] = gradeFromIndex(gradeIndex(a[c.key]) + 1);
  log(
    `${p.name}的${PET_APT_NAMES[c.key]}提升至${a[c.key]}，消耗${c.gold}金币和${c.dust}灵宠精华。`,
    "loot",
  );
  render();
}
function expandInventory() {
  const cost = 300 + (state.inventoryCapacity - 40) * 45;
  if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
  state.gold -= cost;
  state.inventoryCapacity += 5;
  state.shop.inventoryUpgrades++;
  log(`装备背包扩建至${state.inventoryCapacity}格，金币-${cost}。`, "loot");
  render();
}
function expandPetCapacity() {
  const cost = 500 + (state.petCapacity - 12) * 120;
  if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
  state.gold -= cost;
  state.petCapacity += 2;
  state.shop.petUpgrades++;
  log(`宠物仓扩建至${state.petCapacity}格，金币-${cost}。`, "loot");
  render();
}
function refineItem(id) {
  const it = findItem(id);
  if (!it) return;
  if ((it.refine || 0) >= 5) return alert("Alpha阶段精炼上限为+5。");
  const cost = refineCost(it);
  if (state.gold < cost) return alert(`金币不足，需要${cost}。`);
  state.gold -= cost;
  it.refine = (it.refine || 0) + 1;
  log(`${it.name}精炼至+${it.refine}，金币-${cost}。`, "loot");
  render();
}
function save() {
  try {
    state.lastSave = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {}
}
const SAVE_SLOT_PREFIX = "bwe-core-manual-slot-";
function saveSlot(n) {
  save();
  localStorage.setItem(SAVE_SLOT_PREFIX + n, JSON.stringify(state));
  alert(`已保存到本地槽位${n}。`);
  updateResourceBar();
}
function loadSlot(n) {
  const raw = localStorage.getItem(SAVE_SLOT_PREFIX + n);
  if (!raw) return alert(`槽位${n}为空。`);
  if (!confirm(`读取槽位${n}？当前自动存档会被覆盖。`)) return;
  localStorage.setItem(SAVE_KEY, raw);
  location.reload();
}
function slotInfo(n) {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_SLOT_PREFIX + n) || "null");
    return d
      ? `${RACES[d.race]?.name || "?"}·${STYLES[d.style]?.name || "?"} Lv.${d.level || 1} R${d.rebirths || 0}｜${new Date(d.lastSave || 0).toLocaleString()}`
      : "空";
  } catch {
    return "损坏";
  }
}
function exportSave() {
  save();
  const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bwe-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ===== core-12.js ===== */
function importSaveFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!d || !d.version) throw new Error("格式错误");
      if (!confirm("导入这个存档并覆盖当前自动存档？")) return;
      d.version = VERSION;
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      location.reload();
    } catch (e) {
      alert("无法导入：" + e.message);
    }
  };
  reader.readAsText(file);
}
function compactItemText(it) {
  const mult = 1 + (it.refine || 0) * 0.08,
    names = {
      str: "力",
      int: "智",
      dex: "敏",
      will: "意",
      luck: "幸",
      hp: "生命",
      mp: "法力",
      crit: "暴击",
      def: "防御",
      atk: "攻击",
    };
  const stats = Object.entries(it.stats || {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${names[k] || k}+${Math.round(v * mult)}`),
    arc = (it.arcanes || []).map(
      (a) => `【${AMULET_ARCANES[a.id]?.name || a.id}】`,
    );
  return [...stats, ...arc].join(" · ") || "无额外属性";
}
function helpBlock(title, body) {
  return `<details class="help"><summary>${title}</summary><div class="help-body">${body}</div></details>`;
}
function miniDetail(title, body) {
  const plain = String(body)
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
    isShort =
      !String(body).includes("<br") &&
      !String(body).includes("<button") &&
      !String(body).includes("<table") &&
      plain.length <= 72;
  return isShort
    ? `<div class="compact-meta">${body}</div>`
    : `<details class="mini"><summary>${title}</summary><div class="help-body">${body}</div></details>`;
}
function renderSaves() {
  return `<div class="card"><h3>存档</h3><p>最后保存：${new Date(state.lastSave || Date.now()).toLocaleString()}</p><button onclick="save();alert('已保存。');render()">立即保存</button></div><div class="card" style="margin-top:10px"><h3>本地槽位</h3>${[1, 2, 3].map((n) => `<div class="item"><div><b>槽位${n}</b><div class="compact-meta">${slotInfo(n)}</div></div><div class="controls"><button onclick="saveSlot(${n})">保存</button><button onclick="loadSlot(${n})">读取</button></div></div>`).join("")}</div><div class="card" style="margin-top:10px"><h3>备份</h3><button onclick="exportSave()">导出JSON</button><label class="button" style="display:inline-block;margin-left:8px">导入JSON <input type="file" accept="application/json,.json" onchange="importSaveFile(this)" style="display:none"></label></div>${helpBlock("PWA与存档说明", `<b>${pwaInstallStatus()}</b><br>游戏每10秒自动保存到当前浏览器/主屏幕App。换手机、清理Safari数据或换浏览器前建议导出JSON。<br><br><button onclick="installPwa()">安装到主屏幕 / 查看方法</button>`)}`;
}
function load() {
  try {
    const raw =
      localStorage.getItem(SAVE_KEY) ||
      localStorage.getItem(ALPHA033_SAVE_KEY) ||
      localStorage.getItem(ALPHA032_SAVE_KEY) ||
      localStorage.getItem(ALPHA031_SAVE_KEY) ||
      localStorage.getItem(ALPHA030_SAVE_KEY) ||
      localStorage.getItem(ALPHA029_SAVE_KEY) ||
      localStorage.getItem(ALPHA028_SAVE_KEY) ||
      localStorage.getItem(ALPHA027_SAVE_KEY) ||
      localStorage.getItem(ALPHA026_SAVE_KEY) ||
      localStorage.getItem(ALPHA025_SAVE_KEY) ||
      localStorage.getItem(ALPHA024_SAVE_KEY) ||
      localStorage.getItem(ALPHA023_SAVE_KEY) ||
      localStorage.getItem(ALPHA022_SAVE_KEY) ||
      localStorage.getItem(ALPHA021_SAVE_KEY) ||
      localStorage.getItem(ALPHA020_SAVE_KEY) ||
      localStorage.getItem(ALPHA019_SAVE_KEY) ||
      localStorage.getItem(ALPHA018_SAVE_KEY) ||
      localStorage.getItem(ALPHA017_SAVE_KEY) ||
      localStorage.getItem(ALPHA016_SAVE_KEY) ||
      localStorage.getItem(ALPHA015_SAVE_KEY) ||
      localStorage.getItem(ALPHA014_SAVE_KEY) ||
      localStorage.getItem(ALPHA013_SAVE_KEY) ||
      localStorage.getItem(ALPHA012_SAVE_KEY) ||
      localStorage.getItem(ALPHA011_SAVE_KEY) ||
      localStorage.getItem(ALPHA010_SAVE_KEY) ||
      localStorage.getItem(ALPHA09_SAVE_KEY) ||
      localStorage.getItem(PREVIOUS_SAVE_KEY) ||
      localStorage.getItem(LEGACY_SAVE_KEY) ||
      localStorage.getItem(OLDER_SAVE_KEY) ||
      localStorage.getItem(OLDEST_SAVE_KEY) ||
      localStorage.getItem(ANCIENT_SAVE_KEY) ||
      localStorage.getItem(PRIMITIVE_SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (
      ![
        "0.3.0",
        "0.4.0",
        "0.5.0",
        "0.6.0",
        "0.7.0",
        "0.8.0",
        "0.9.0",
        "0.10.0",
        "0.11.0",
        "0.12.0",
        "0.13.0",
        "0.14.0",
        "0.15.0",
        "0.16.0",
        "0.17.0",
        "0.18.0",
        "0.19.0",
        "0.20.0",
        "0.21.0",
        "0.22.0",
        "0.23.0",
        "0.24.0",
        "0.25.0",
        "0.26.0",
        "0.27.0",
        "0.28.0",
        "0.29.0",
        "0.30.0",
        "0.31.0",
        "0.32.0",
        "0.33.0",
        VERSION,
      ].includes(d.version)
    )
      return false;
    state = d;
    state.version = VERSION;
    state.name = sanitizePlayerName(state.name);
    state.running = true;
    if (!RACES[state.race]) state.race = "human";
    if (!STYLES[state.style]) state.style = "melee";
    state.unlockedRaces = Array.isArray(state.unlockedRaces)
      ? state.unlockedRaces
      : [state.race];
    state.unlockedClasses = Array.isArray(state.unlockedClasses)
      ? state.unlockedClasses
      : [state.style];
    state.identityPity = Number(state.identityPity || 0);
    state.activeSkillSlots = Array.isArray(state.activeSkillSlots)
      ? state.activeSkillSlots
      : [];
    state.passiveSkillSlots = Array.isArray(state.passiveSkillSlots)
      ? state.passiveSkillSlots
      : [];
    state.logFilters = {
      damage: false,
      defense: false,
      loot: true,
      important: true,
      system: true,
      ...(state.logFilters || {}),
    };
    (state.log || []).forEach((x) => {
      if (!x.category) x.category = inferLogCategory(x.msg, x.cls);
    });
    ensureIdentityState();
    state.metrics = state.metrics || {
      startedAt: Date.now(),
      xp: 0,
      gold: 0,
      drops: 0,
      battles: 0,
      wins: 0,
      losses: 0,
      byMap: {},
    };
    state.metrics.byMap = state.metrics.byMap || {};
    state.bossCycles = state.bossCycles || {};
    state.skillUse = state.skillUse || {};
    state.skills = state.skills || {};
    state.skillMastered = state.skillMastered || {};
    state.skillPriority = state.skillPriority || { attack: [], defense: [] };
    state.skillReadyAt = state.skillReadyAt || {};
    state.combatTurn = Number(state.combatTurn || 0);
    Object.keys(SKILLS).forEach((id) => {
      if ((state.skillUse[id] || 0) >= skillThresholds(id)[9])
        state.skillMastered[id] = true;
    });
    state.petDust = state.petDust || 0;
    state.petCapacity = state.petCapacity || 12;
    state.inventoryCapacity = state.inventoryCapacity || 40;
    state.gearScorePrefs = state.gearScorePrefs || null;
    ensureGearScorePrefs();
    state.rebirthLaws = {
      war: 0,
      time: 0,
      hunt: 0,
      ...(state.rebirthLaws || {}),
    };
    Object.keys(state.rebirthLaws).forEach(
      (k) =>
        (state.rebirthLaws[k] = clamp(
          Number(state.rebirthLaws[k] || 0),
          0,
          REBIRTH_LAW_MAX,
        )),
    );
    state.pendingRebirthLaw = REBIRTH_LAWS[state.pendingRebirthLaw]
      ? state.pendingRebirthLaw
      : "war";
    state.petFilter = {
      minGrade: "F",
      minTier: 1,
      action: "release",
      keepAnyS: true,
      ...(state.petFilter || {}),
    };
    state.shop = {
      gearBuys: 0,
      petTraining: 0,
      inventoryUpgrades: 0,
      petUpgrades: 0,
      ...(state.shop || {}),
    };
    state.pets = state.pets || [];
    state.pets.forEach((p) => {
      if (!PET_TYPE_IDS.includes(p.type)) p.type = "Balance";
      migratePetAptitudes(p);
      p.locked = !!p.locked;
      if (!Number.isFinite(p.tier)) {
        const pm = MAPS.find((m) => m.pet === p.name);
        p.tier = pm?.petTier || 1;
      }
      p.mutant = !!p.mutant;
      p.mutationGrade = p.mutant ? "X" : null;
      p.level = clamp(Math.round(Number(p.level || 1)), 1, PET_LEVEL_MAX);
      if (!Number.isFinite(p.evolutionXp)) {
        const legacyHours = { 1: 1000, 2: 400, 3: 160, 4: 60, 5: 25, 6: 10 },
          t = Math.min(6, Math.max(1, Math.round(p.tier || 1))),
          need = petEvolutionNeed({ tier: t }),
          legacyProgress = need
            ? clamp(
                Number(p.trainingSeconds || 0) / (legacyHours[t] * 3600),
                0,
                1,
              )
            : 0;
        p.evolutionXp = Math.round(need * legacyProgress);
      }
      delete p.trainingSeconds;
      p.battleTurns = 0;
      p.fallen = false;
      const ps = petStats(p);
      p.hp = ps.maxHp;
    });
    const migrateItem = (i) => {
      i.refine = i.refine || 0;
      i.rarity = clamp(Number(i.rarity) || 0, 0, RARITIES.length - 1);
      const sourceMap = MAPS.find((m) => m.id === i.sourceMap),
        oldScore = Math.max(1, i.score || 1);
      i.tier = sourceMap
        ? sourceMap.gearTier || 1
        : Math.max(1, Number(i.tier || i.itemLevel || 1));
      i.itemLevel = i.tier;
      i.score = gearTierScore(i.tier, i.rarity);
      if (i.qualityCurveVersion !== 4) {
        const ratio = Math.max(0.55, i.score / oldScore);
        Object.keys(i.stats || {}).forEach(
          (k) => (i.stats[k] = Math.max(1, Math.round(i.stats[k] * ratio))),
        );
      }
      i.sourceMapName = i.sourceMapName || "旧版装备";
      i.sell = Math.max(
        i.sell || 0,
        Math.round((8 + i.score * 0.18) * (1 + i.rarity * 0.45)),
      );
      i.qualityCurveVersion = 5;
    };
    state.inventory = state.inventory || [];
    state.inventory.forEach(migrateItem);
    Object.values(state.equipment || {})
      .filter(Boolean)
      .forEach(migrateItem);
    MAPS.forEach((m) => {
      const c = ensureBossCycle(m.id);
      c.dangerFail = c.dangerFail || 0;
    });
    syncSkills();
    prepareNewBattle();
    save();
    return true;
  } catch {
    return false;
  }
}
function resetGame() {
  if (confirm("确定删除当前重制版存档？")) {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(ALPHA035_SAVE_KEY);
    localStorage.removeItem(ALPHA034_SAVE_KEY);
    localStorage.removeItem(ALPHA033_SAVE_KEY);
    localStorage.removeItem(ALPHA032_SAVE_KEY);
    localStorage.removeItem(ALPHA031_SAVE_KEY);
    localStorage.removeItem(ALPHA030_SAVE_KEY);
    localStorage.removeItem(ALPHA029_SAVE_KEY);
    localStorage.removeItem(ALPHA028_SAVE_KEY);
    localStorage.removeItem(ALPHA027_SAVE_KEY);
    localStorage.removeItem(ALPHA026_SAVE_KEY);
    localStorage.removeItem(ALPHA025_SAVE_KEY);
    localStorage.removeItem(ALPHA024_SAVE_KEY);
    localStorage.removeItem(ALPHA023_SAVE_KEY);
    localStorage.removeItem(ALPHA022_SAVE_KEY);
    localStorage.removeItem(ALPHA021_SAVE_KEY);
    localStorage.removeItem(ALPHA020_SAVE_KEY);
    localStorage.removeItem(ALPHA019_SAVE_KEY);
    localStorage.removeItem(ALPHA018_SAVE_KEY);
    localStorage.removeItem(ALPHA017_SAVE_KEY);
    localStorage.removeItem(ALPHA016_SAVE_KEY);
    localStorage.removeItem(ALPHA015_SAVE_KEY);
    localStorage.removeItem(ALPHA014_SAVE_KEY);
    localStorage.removeItem(ALPHA013_SAVE_KEY);
    localStorage.removeItem(ALPHA012_SAVE_KEY);
    localStorage.removeItem(ALPHA011_SAVE_KEY);
    localStorage.removeItem(ALPHA010_SAVE_KEY);
    localStorage.removeItem(ALPHA09_SAVE_KEY);
    localStorage.removeItem(PREVIOUS_SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
    localStorage.removeItem(OLDER_SAVE_KEY);
    localStorage.removeItem(OLDEST_SAVE_KEY);
    localStorage.removeItem(ANCIENT_SAVE_KEY);
    localStorage.removeItem(PRIMITIVE_SAVE_KEY);
    state = fresh();
    render();
  }
}
function startGame() {
  const race = document.querySelector(".choice.race.selected")?.dataset.id,
    style = document.querySelector(".choice.style.selected")?.dataset.id;
  if (!race || !style) return alert("请选择初始种族和职业。");
  if (!STARTER_RACES.includes(race) || !STARTER_CLASSES.includes(style))
    return alert("初始只能选择普通种族和普通职业。");
  state = fresh();
  state.started = true;
  state.race = race;
  state.style = style;
  state.unlockedRaces = [race];
  state.unlockedClasses = [style];
  state.name = sanitizePlayerName(document.getElementById("hero-name").value);
  state.gearScorePrefs = defaultGearScorePrefs(style);
  const archetype = classArchetype(style),
    starterType = { melee: "sword", ranged: "bow", magic: "staff" }[archetype],
    starter = makeItem(1, starterType, 0, false);
  starter.name = `练习${WEAPON_TYPES[starterType].name}`;
  starter.locked = true;
  state.equipment.weapon = starter;
  syncSkills();
  prepareNewBattle();
  log(
    `无尽战斗开始：${RACES[race].name} · ${STYLES[style].name}。更高品质种族与职业只能由Boss永久解锁。`,
    "important",
    "important",
  );
  if (typeof window.onGameStarted === "function") window.onGameStarted();
  save();
  render();
}

// Alpha 0.40 migration runs before startup while keeping older migrations intact.
const loadBeforeAlpha035 = load;
load = function () {
  try {
    if (!localStorage.getItem(SAVE_KEY)) {
      const previous =
        localStorage.getItem(ALPHA039_SAVE_KEY) ||
        localStorage.getItem(ALPHA038_SAVE_KEY) ||
        localStorage.getItem(ALPHA035_SAVE_KEY) ||
        localStorage.getItem(ALPHA034_SAVE_KEY);
      if (previous) {
        const d = JSON.parse(previous);
        d.version = VERSION;
        delete d.soul;
        localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      }
    }
    const candidate = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (
      ["0.34.0", "0.35.0", "0.36.0", "0.37.0", "0.38.0", "0.39.0"].includes(
        candidate?.version,
      )
    ) {
      candidate.version = VERSION;
      delete candidate.soul;
      localStorage.setItem(SAVE_KEY, JSON.stringify(candidate));
    }
    if (candidate?.style === "farmer" && !STYLES.farmer) {
      STYLES.farmer = {
        name: "农民",
        icon: "🌾",
        rarity: 0,
        starter: true,
        archetype: "melee",
        growth: { str: 1, int: 0.86, dex: 0.92, will: 1.02, luck: 1.02 },
        skills: ["farmer_swing"],
        desc: "最普通的起点。没有职业优势，真正的职业需要从Boss身上获得。",
      };
      SKILLS.farmer_swing = {
        name: "挥锄",
        classId: "farmer",
        type: "active",
        cat: "attack",
        baseChance: 0.3,
        cooldown: 1,
        kind: "damage",
        mult: 1.45,
        desc: "朴素的基础攻击技能。",
      };
    }
  } catch (err) {
    console.warn("Alpha 0.40 save preparation skipped", err);
  }
  const ok = loadBeforeAlpha035();
  if (!ok) return false;
  state.firstBossMilestoneClaimed =
    state.firstBossMilestoneClaimed === undefined
      ? Number(state.bossCycles?.meadow?.bossWins || 0) > 0
      : !!state.firstBossMilestoneClaimed;
  state.starterProfessionPending = false;
  delete state.soul;
  delete state.age;
  delete state.nextRace;
  delete state.nextStyle;
  delete state.specialSkillsUnlocked;
  delete state.activeSkills;
  (state.pets || []).forEach((p) => {
    p.baseSpecies = petBaseSpecies(p);
    migratePetFusionInvestment(p);
  });
  Object.values(state.bossProgress || {}).forEach((p) => {
    if (p && p.active) p.attempts = clamp(Number(p.attempts || 0), 0, 2);
  });
  MAPS.forEach((m) => ensureBossCycle(m.id));
  save();
  return true;
};

resetGame = function () {
  if (!confirm("确定删除当前重制版存档？")) return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && /^bwe-core-alpha-/.test(key)) localStorage.removeItem(key);
  }
  localStorage.removeItem("bwe-background-battle-v1");
  state = fresh();
  render();
};

/* ===== core-13.js ===== */
function renderStart() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="start"><h1>无尽战域：核心 Alpha 0.40</h1><p class="subtitle">纵向职业进阶 · 刷怪打宝 · Boss构筑 · 宠物养成</p><label>角色名称 <input id="hero-name" value="旅者" style="margin-left:8px;background:#12100c;color:#fff;border:1px solid #51442f;padding:7px"></label><h2>选择普通种族</h2><div class="choice-grid">${STARTER_RACES.map(
    (id) => {
      const r = RACES[id];
      return `<div class="choice race" data-id="${id}" onclick="selectStart('race','${id}')"><h3>${r.icon}${r.name} · ${identityRarityLabel(r)}</h3><div class="compact-meta">${r.traitName}：${r.traitDesc}</div>${miniDetail("属性倍率", identityGrowthText(r))}</div>`;
    },
  ).join(
    "",
  )}</div><h2>选择普通职业</h2><div class="choice-grid">${STARTER_CLASSES.map(
    (id) => {
      const c = STYLES[id];
      return `<div class="choice style" data-id="${id}" onclick="selectStart('style','${id}')"><h3>${c.icon}${c.name} · ${identityRarityLabel(c)}</h3><div class="compact-meta">${c.desc}</div><div class="compact-meta">标志技能：${c.skills.map((s) => SKILLS[s].name).join(" / ")}</div></div>`;
    },
  ).join(
    "",
  )}</div>${helpBlock("核心规则", "普通身份用于开局。区域Boss掉落并永久解锁进阶职业；职业一经解锁，其技能立即可用。切换到同路线高级职业时，会自动换上高级技能并继承已有熟练度，不需要回头修炼低级职业。种族特性不能传承。")}<div class="controls" style="margin-top:12px"><button onclick="startGame()">开始无尽战斗</button></div></div>`;
}
function selectStart(group, id) {
  document
    .querySelectorAll(".choice." + group)
    .forEach((x) => x.classList.toggle("selected", x.dataset.id === id));
}
let mainContentDirty = false;
function updateResourceBar() {
  const values = {
    "live-level": state.level,
    "live-cp": cp(),
    "live-gold": state.gold,
    "live-petdust": state.petDust,
    "live-xp": `${state.xp}/${xpNeed()}`,
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
  const fill = document.getElementById("live-xp-fill");
  if (fill)
    fill.style.width = `${clamp((state.xp / Math.max(1, xpNeed())) * 100, 0, 100)}%`;
}
function captureMainUiState() {
  const content = document.getElementById("main-content");
  if (!content) return null;
  const details = [...content.querySelectorAll("details")];
  return {
    tab: state.tab,
    windowY: window.scrollY,
    contentY: content.scrollTop,
    open: details.map((d, i) => (d.open ? i : -1)).filter((i) => i >= 0),
  };
}
function restoreMainUiState(snap) {
  if (!snap || snap.tab !== state.tab) return;
  const content = document.getElementById("main-content");
  if (!content) return;
  const details = [...content.querySelectorAll("details")];
  snap.open.forEach((i) => {
    if (details[i]) details[i].open = true;
  });
  content.scrollTop = snap.contentY || 0;
  window.scrollTo(0, snap.windowY || 0);
}
function setMainDirty(on = true) {
  mainContentDirty = !!on;
  const bar = document.getElementById("main-dirty");
  if (bar) bar.classList.toggle("show", mainContentDirty);
}
function refreshMainContent(preserve = true) {
  const content = document.getElementById("main-content");
  if (!content) return;
  const snap = preserve ? captureMainUiState() : null;
  content.innerHTML = renderTab();
  setMainDirty(false);
  if (snap) requestAnimationFrame(() => restoreMainUiState(snap));
}
function refreshLiveUI(reason = "tick") {
  if (!state.started) return;
  updateResourceBar();
  renderBattleOnly();
  if (reason === "result" || reason === "state") setMainDirty(true);
}
let deferredInstallPrompt = null;
function isStandalonePwa() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}
function isIosSafari() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    /safari/i.test(navigator.userAgent) &&
    !/crios|fxios|edgios/i.test(navigator.userAgent)
  );
}
function pwaInstallStatus() {
  if (isStandalonePwa()) return "已作为主屏幕App运行";
  if (isIosSafari()) return "Safari：点“分享” → “添加到主屏幕”即可安装";
  if (deferredInstallPrompt) return "浏览器支持一键安装";
  return "请使用Safari/Chrome打开部署后的HTTPS网址";
}
async function installPwa() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    render();
    return;
  }
  if (isIosSafari()) {
    alert("iPhone安装：Safari底部“分享”按钮 → 向下找到“添加到主屏幕” → 添加。");
    return;
  }
  alert("请先把PWA部署到HTTPS网址，再用Safari或Chrome打开。");
}
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
});
let mobileMenuOpen = false;
function isMobileLayout() {
  return window.matchMedia && window.matchMedia("(max-width:850px)").matches;
}
function mobileNavigate(tab = null) {
  mobileMenuOpen = false;
  if (tab) state.tab = tab;
  render(false);
  requestAnimationFrame(() => {
    const el = tab
      ? document.querySelector(".main-panel")
      : document.querySelector(".battle-panel-wrap");
    if (el && isMobileLayout())
      el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  render();
}
function mobileQuickSave() {
  save();
  mobileMenuOpen = false;
  render();
  alert("已保存到当前浏览器。");
}
function render(preserveUi = true) {
  if (!state.started) return renderStart();
  const uiSnap = preserveUi ? captureMainUiState() : null,
    s = stats(),
    m = map(),
    e = state.enemy,
    p = activePet();
  document.getElementById("app").innerHTML =
    `<div class="shell"><div class="topbar"><div><h1>无尽战域：核心 Alpha 0.40</h1><div class="subtitle">职业纵向进阶 · 战败诊断 · Boss专属构筑 · 阶段目标</div></div><div class="resources"><span>等级 <b id="live-level">${state.level}</b></span><span class="xp-chip">经验 <b id="live-xp">${state.xp}/${xpNeed()}</b><span class="xp-mini"><i id="live-xp-fill" style="width:${clamp((state.xp / Math.max(1, xpNeed())) * 100, 0, 100)}%"></i></span></span><span>CP <b id="live-cp">${cp()}</b></span><span>金币 <b id="live-gold">${state.gold}</b></span><span>灵宠精华 <b id="live-petdust">${state.petDust}</b></span></div></div><div class="log-dock" id="log-dock">${renderLogControls()}<div class="log-stream">${filteredLogs()
      .map(
        (x) =>
          `<div class="${x.cls} cat-${x.category || inferLogCategory(x.msg, x.cls)}">${x.msg}</div>`,
      )
      .join(
        "",
      )}</div></div><div class="layout"><div class="panel battle-panel-wrap"><div class="panel-title">战斗永不停歇</div><div id="battle-panel"></div><div class="controls" style="padding:0 7px 7px"><button onclick="state.running=!state.running;render()">${state.running ? "暂停战斗" : "继续战斗"}</button></div></div><div class="panel main-panel"><div class="tabs">${[
      ["character", "角色"],
      ["skills", "技能"],
      ["inventory", "装备"],
      ["pets", "宠物"],
      ["shop", "商店"],
      ["maps", "地图"],
      ["titles", "称号"],
      ["rebirth", "转生"],
      ["saves", "存档"],
    ]
      .map(
        ([id, n]) =>
          `<button class="tab ${state.tab === id ? "active" : ""}" onclick="state.tab='${id}';render(false)">${n}</button>`,
      )
      .join(
        "",
      )}<button class="tab" onclick="save();alert('已立即保存。')">快速保存</button><button class="tab" onclick="resetGame()">重开</button></div><div id="main-dirty" class="main-dirty ${mainContentDirty ? "show" : ""}"><span>战斗产生了新数据；当前页面保持不动。</span><button onclick="refreshMainContent(true)">刷新当前页</button></div><div class="content" id="main-content">${renderTab()}</div></div></div>${mobileMenuOpen ? `<div class="mobile-backdrop" onclick="toggleMobileMenu()"></div><div class="mobile-sheet"><h3>更多功能</h3><div class="mobile-sheet-grid"><button onclick="mobileNavigate('skills')">⚔️ 技能</button><button onclick="mobileNavigate('shop')">🛒 商店</button><button onclick="mobileNavigate('titles')">🏅 称号</button><button onclick="mobileNavigate('rebirth')">♻️ 转生</button><button onclick="mobileNavigate('saves')">💾 存档</button><button onclick="mobileQuickSave()">✅ 快速保存</button><button class="danger" onclick="resetGame()">⚠️ 重开游戏</button><button onclick="toggleMobileMenu()">关闭</button></div></div>` : ""}<div class="mobile-nav"><button onclick="mobileNavigate()"><b>⚔️</b>战斗</button><button onclick="mobileNavigate('character')" class="${state.tab === "character" ? "active" : ""}"><b>👤</b>角色</button><button onclick="mobileNavigate('inventory')" class="${state.tab === "inventory" ? "active" : ""}"><b>🎒</b>装备</button><button onclick="mobileNavigate('pets')" class="${state.tab === "pets" ? "active" : ""}"><b>🐾</b>宠物</button><button onclick="mobileNavigate('maps')" class="${state.tab === "maps" ? "active" : ""}"><b>🗺️</b>地图</button><button onclick="toggleMobileMenu()" class="${mobileMenuOpen || ["skills", "shop", "titles", "rebirth", "saves"].includes(state.tab) ? "active" : ""}"><b>☰</b>更多</button></div><div class="footer">Alpha 0.40：高级职业覆盖低阶技能、战败诊断、Boss专属构筑、机制前缀与阶段目标。</div></div>`;
  mainContentDirty = false;
  updateResourceBar();
  renderBattleOnly();
  if (uiSnap) requestAnimationFrame(() => restoreMainUiState(uiSnap));
}
function renderBattleOnly() {
  if (!state.started) return;
  const el = document.getElementById("battle-panel");
  if (!el) return;
  ensureEnemy();
  const s = stats(),
    e = state.enemy,
    p = activePet(),
    ps = p ? petStats(p) : null;
  el.innerHTML = `<div class="battle"><div class="combatant ${playerAlive() ? "" : "party-down"}"><div class="name-row"><span class="big-name">${RACES[state.race].icon}${state.name} Lv.${state.level}</span><span class="badge">${STYLES[state.style].name}</span></div><div class="bar"><div class="fill hp" style="width:${clamp((state.hp / s.maxHp) * 100, 0, 100)}%"></div><span>${Math.max(0, Math.round(state.hp))}/${s.maxHp}</span></div><div class="bar"><div class="fill mp" style="width:${clamp((state.mp / s.maxMp) * 100, 0, 100)}%"></div><span>${Math.max(0, Math.round(state.mp))}/${s.maxMp}</span></div><div class="stats-mini"><div>攻击 ${s.atk}</div><div>防御 ${s.def}</div><div>速度 ${s.speed}</div></div></div>${p ? `<div class="combatant ${petAlive(p) ? "" : "party-down"}"><div class="name-row"><span class="big-name">${petSpeciesIcon(p)}${p.tier || 1}阶 ${p.mutant ? '<span class="mutant-x">变异 X</span> ' : ""}${p.name} Lv.${p.level}</span><span class="badge">${PET_TYPES[p.type].name} · ${petOverallGrade(p)}</span></div><div class="bar"><div class="fill hp" style="width:${clamp(((p.hp || 0) / ps.maxHp) * 100, 0, 100)}%"></div><span>${Math.max(0, Math.round(p.hp || 0))}/${ps.maxHp}</span></div><div class="stats-mini"><div>攻击 ${ps.atk}</div><div>防御 ${ps.def}</div><div>魔力 ${ps.magic}</div></div><div class="muted" style="margin-top:6px">${petRoleStatus(p)}</div></div>` : '<div class="combatant"><div class="muted">尚未获得出战宠物。区域Boss可能掉落宠物。</div></div>'}<div class="combatant"><div class="name-row"><span class="big-name">${e ? e.name : "寻找敌人"} ${e ? "Lv." + e.level : ""}</span><span class="badge">${e ? `CP ${e.cp} · 威胁T${e.threatTier || 0}` : ""}</span></div><div class="bar"><div class="fill hp" style="width:${e ? clamp((e.hp / e.maxHp) * 100, 0, 100) : 0}%"></div><span>${e ? Math.max(0, Math.round(e.hp)) + "/" + e.maxHp : ""}</span></div><div class="stats-mini"><div>攻击 ${e?.atk || 0}</div><div>防御 ${e?.def || 0}</div><div>速度 ${e?.speed || 0}</div></div>${e?.treasure ? '<div class="compact-meta" style="margin-top:6px"><b>稀有宝箱怪：</b>基础金币×100</div>' : e?.bossPrefixId && e.bossPrefixId !== "none" ? `<div class="compact-meta" style="margin-top:6px"><b>${e.bossPrefixName}前缀：</b>${e.bossPrefixDesc} 金币×${Number(e.bossGoldMult || 1).toFixed(2)}</div>` : ""}${(e?.petArmorBreakTurns || 0) > 0 || (e?.petWeakenTurns || 0) > 0 || (e?.skillArmorBreakTurns || 0) > 0 ? `<div class="muted" style="margin-top:6px">${(e.petArmorBreakTurns || 0) > 0 ? "宠物破甲 " : ""}${(e.petWeakenTurns || 0) > 0 ? "衰弱 " : ""}${(e.skillArmorBreakTurns || 0) > 0 ? "蚀骨破甲" : ""}</div>` : ""}</div>${renderDefeatReport()}</div>`;
  renderLogOnly();
}

/* ===== core-14.js ===== */
function renderTab() {
  if (state.tab === "character")
    return renderProgressionBoard() + renderCharacter();
  if (state.tab === "skills") return renderSkills();
  if (state.tab === "inventory") return renderInventory();
  if (state.tab === "pets") return renderPets();
  if (state.tab === "shop") return renderShop();
  if (state.tab === "maps") return renderMaps();
  if (state.tab === "titles") return renderTitles();
  if (state.tab === "rebirth") return renderRebirth();
  return renderSaves();
}
function renderCharacter() {
  ensureIdentityState();
  syncSkills();
  const s = stats(),
    gm = state.metrics || fresh().metrics,
    mm = ensureMetric(state.mapId),
    weapon = weaponProfile(),
    mastered = Object.keys(state.skillMastered || {}).filter(
      (id) => state.skillMastered[id] && SKILLS[id],
    ),
    n = IDENTITY_STAT_NAMES;
  const identityCard = (id, kind) => {
    const d = kind === "race" ? RACES[id] : STYLES[id],
      current = (kind === "race" ? state.race : state.style) === id,
      unlocked = (
        kind === "race" ? state.unlockedRaces : state.unlockedClasses
      ).includes(id),
      rar = RARITIES[d.rarity],
      extra =
        kind === "race"
          ? `<div class="compact-meta">特性【${d.traitName}】${d.traitDesc}</div>`
          : `<div class="compact-meta">${d.skills.map((s) => `${SKILLS[s].type === "passive" ? "被动" : "主动"}【${SKILLS[s].name}】`).join(" · ")}</div><div class="compact-meta">谱系：${classProgressionText(id)}</div>`;
    return `<div class="identity-card ${d.rarity === 5 ? "mythic-identity" : ""} ${current ? "selected" : ""}"><div><b class="${rar.cls}">${d.icon}${d.name}</b> · <span class="${rar.cls}">${rar.name}</span>${current ? " · <b>当前</b>" : ""}<div class="compact-meta">${identityGrowthText(d)}</div>${extra}</div><button ${!unlocked || current ? "disabled" : ""} onclick="${kind === "race" ? "switchRace" : "switchClass"}('${id}')">${unlocked ? (current ? "使用中" : "切换") : "未解锁"}</button></div>`;
  };
  return `<div class="grid2"><div class="card"><h3>${RACES[state.race].icon}${state.name}</h3><div>${identityRarityLabel(RACES[state.race])} ${RACES[state.race].name} · ${identityRarityLabel(STYLES[state.style])} ${STYLES[state.style].name}</div><p>Lv.${state.level}｜击杀 ${state.totalKills}｜胜/负 ${state.totalWins}/${state.totalLosses}</p><div class="compact-meta">种族特性【${RACES[state.race].traitName}】${RACES[state.race].traitDesc}</div><div class="compact-meta">职业原生技能效果额外获得15%职业共鸣。</div>${weapon ? `<div class="compact-meta">武器：${weapon.name} — ${weapon.desc}</div>` : ""}</div><div class="card"><h3>战斗属性</h3><div class="stat-table">${[
    ["生命", s.maxHp],
    ["法力", s.maxMp],
    ["攻击", s.atk],
    ["防御", s.def],
    ["暴击", s.crit.toFixed(1) + "%"],
    ["暴伤", s.critMult.toFixed(2) + "×"],
    ["速度", s.speed],
    ["CP", cp()],
  ]
    .map((x) => `<div class="stat"><b>${x[1]}</b>${x[0]}</div>`)
    .join(
      "",
    )}</div>${miniDetail("暴击计算", `${critCurveText(s.rawCrit)}。暴击无硬上限，递减后无限趋近100%。`)}</div></div><div class="card" style="margin-top:7px"><h3>基础属性 · 实时身份倍率</h3><div class="stat-table">${["str", "int", "dex", "will", "luck"].map((k) => `<div class="stat"><b>${s[k]}</b>${n[k]}<div class="compact-meta">${RACES[state.race].growth[k].toFixed(2)}×种族 · ${STYLES[state.style].growth[k].toFixed(2)}×职业</div></div>`).join("")}</div>${miniDetail("属性作用", ["str", "int", "dex", "will", "luck"].map((k) => `<b>${n[k]}</b>：${attributeImpactText(k)}`).join("<br>"))}</div><div class="grid2" style="margin-top:7px"><div class="card"><h3>种族收藏 ${state.unlockedRaces.length}/${Object.keys(RACES).length}</h3>${Object.keys(
    RACES,
  )
    .sort((a, b) => RACES[b].rarity - RACES[a].rarity)
    .map((id) => identityCard(id, "race"))
    .join(
      "",
    )}</div><div class="card"><h3>职业收藏 ${state.unlockedClasses.length}/${Object.keys(STYLES).length}</h3>${Object.keys(
    STYLES,
  )
    .sort((a, b) => STYLES[b].rarity - STYLES[a].rarity)
    .map((id) => identityCard(id, "class"))
    .join(
      "",
    )}</div></div><div class="grid2" style="margin-top:7px"><div class="card"><h3>人物档案</h3><p>永久技能：<b>${mastered.length}</b></p><div class="compact-meta">${mastered.length ? mastered.map((id) => `${SKILLS[id].type === "passive" ? "被动" : "主动"}【${SKILLS[id].name}】`).join(" · ") : "尚无Lv.10传承技能。"}</div></div><div class="card"><h3>实时效率</h3><div class="stat-table">${[
    ["经验/分", metricRate(gm, "xp").toFixed(1)],
    ["金币/分", metricRate(gm, "gold").toFixed(1)],
    ["装备/分", metricRate(gm, "drops").toFixed(2)],
    [
      "总胜率",
      gm.battles ? `${((gm.wins / gm.battles) * 100).toFixed(1)}%` : "—",
    ],
    [`${map().name}经验/分`, metricRate(mm, "xp").toFixed(1)],
    [
      `${map().name}胜率`,
      mm.battles ? `${((mm.wins / mm.battles) * 100).toFixed(1)}%` : "—",
    ],
  ]
    .map((x) => `<div class="stat"><b>${x[1]}</b>${x[0]}</div>`)
    .join("")}</div></div></div>`;
}
function renderSkills() {
  syncSkills();
  const all = Object.keys(SKILLS).filter(skillUsable),
    native = new Set(coveredClassSkills()),
    activeEquipped = new Set(state.activeSkillSlots || []),
    passiveEquipped = new Set(state.passiveSkillSlots || []);
  const row = (id) => {
    const sk = SKILLS[id],
      lv = skillLevel(id),
      next = skillNextUses(id),
      uses = state.skillUse[id] || 0,
      pct = skillProgressPct(id),
      mastered = !!state.skillMastered[id],
      eq =
        sk.type === "passive"
          ? passiveEquipped.has(id)
          : activeEquipped.has(id),
      rar = RARITIES[STYLES[sk.classId]?.rarity || 0];
    return `<div class="skill-row ${eq ? "on" : ""}"><div><b class="${rar.cls}">${sk.name}</b> · Lv.${lv}/10 ${native.has(id) ? "· 当前谱系" : ""}${mastered ? ' · <span class="r4">已满级</span>' : ""}<div class="compact-meta">${sk.type === "passive" ? "被动 · 每场胜利获得熟练" : "主动 · 实际释放获得熟练"}${sk.type === "active" ? ` · CD${Math.max(0, (sk.cooldown || 0) - amuletPowers().cooldown - (passiveSkillTotals().cooldown || 0))}` : ""}</div><div class="bar" style="margin-top:4px"><div class="fill mp" style="width:${pct}%"></div><span>${lv >= 10 ? "MAX" : pct + "%"}</span></div><div class="compact-meta">${skillEffectText(id)}</div>${miniDetail("训练详情", `${sk.desc}<br>熟练${uses}${next !== null ? `｜下一级${next}` : "｜已满级"}<br>职业一经解锁即可永久装备；Lv.10只代表技能满级，不再控制跨职业使用。`)}</div><div class="controls"><button onclick="${sk.type === "passive" ? "togglePassiveSkill" : "toggleActiveSkill"}('${id}')">${eq ? "卸下" : "装备"}</button>${sk.type === "active" && eq ? `<button onclick="moveSkillPriority('${id}',-1)">↑</button><button onclick="moveSkillPriority('${id}',1)">↓</button>` : ""}</div></div>`;
  };
  const active = all.filter((id) => SKILLS[id].type === "active"),
    passive = all.filter((id) => SKILLS[id].type === "passive");
  const activeLimit = window.SKILL_SLOT_LIMITS?.active || 4,
    passiveLimit = window.SKILL_SLOT_LIMITS?.passive || 5;
  return `${helpBlock("职业纵向进阶", `职业一经解锁，其全部技能立即永久可用，不再要求先练到Lv.10。高级职业覆盖同谱系低阶职业；向上切换时自动装备高级技能，并继承低阶技能的同类熟练成果。Lv.10现在只代表技能满级。<br><br>当前谱系：${classProgressionText(state.style)}<br>最多装备${activeLimit}个主动、${passiveLimit}个被动。同谱系技能获得15%职业共鸣。种族特性不能传承。`)}<div class="notice">当前：${identityRarityLabel(STYLES[state.style])} ${STYLES[state.style].name}｜主动槽 ${(state.activeSkillSlots || []).length}/${activeLimit}｜被动槽 ${(state.passiveSkillSlots || []).length}/${passiveLimit} <button onclick="equipNativeClassSet()">套用当前高级技能</button></div><div class="card"><h3>主动技能</h3>${active.map(row).join("") || '<div class="muted">暂无可用主动技能。</div>'}</div><div class="card" style="margin-top:7px"><h3>被动技能</h3>${passive.map(row).join("") || '<div class="muted">暂无可用被动技能。</div>'}</div>${helpBlock(
    "人物档案",
    Object.keys(state.skillMastered || {})
      .filter((id) => state.skillMastered[id] && SKILLS[id])
      .map(
        (id) =>
          `${SKILLS[id].type === "passive" ? "被动" : "主动"}【${SKILLS[id].name}】— ${SKILLS[id].desc}`,
      )
      .join("<br>") || "尚无满级技能。",
  )}${typeof window.renderSkillSystemsPanel === "function" ? window.renderSkillSystemsPanel() : ""}`;
}
function renderInventory() {
  const ordered = sortedInventory(),
    prefs = ensureGearScorePrefs(),
    statOptions = (selected) =>
      `<option value="">不指定</option>${Object.entries(GEAR_STAT_NAMES)
        .map(
          ([id, n]) =>
            `<option value="${id}" ${selected === id ? "selected" : ""}>${n}</option>`,
        )
        .join("")}`;
  return `<div class="grid2"><div class="card"><h3>评分偏好</h3><p>核心 <select onchange="setGearScorePref('primary',this.value)">${statOptions(prefs.primary)}</select></p><p>次要 <select onchange="setGearScorePref('secondary',this.value)">${statOptions(prefs.secondary)}</select></p><p>辅助 <select onchange="setGearScorePref('tertiary',this.value)">${statOptions(prefs.tertiary)}</select></p><button onclick="resetGearScorePrefs()">恢复职业默认</button></div><div class="card"><h3>背包处理</h3><select onchange="state.autoSell=Number(this.value);save()">${RARITIES.map((r, i) => `<option value="${i}" ${state.autoSell === i ? "selected" : ""}>保留${r.name}及以上</option>`).join("")}</select><p>背包 ${state.inventory.length}/${state.inventoryCapacity}</p><button onclick="sellNonUpgradeItems()">出售无提升装备</button></div></div>${helpBlock("装备评分与项链秘仪说明", `装备允许重复普通词条，因此可能出现全暴击、全敏捷等极品。评分按当前职业与偏好判断适配度。<br><br><b>项链秘仪：</b>时间折叠、猎手罗盘、血契、超限视界、咒术共鸣、血脉共振、首领猎印。秘仪只出现在项链。`)}<div class="card"><h3>当前装备</h3>${SLOTS.map(
    (slot) => {
      const it = state.equipment[slot],
        fit = it ? gearFitLabel(it) : null;
      return `<div class="item ${itemVisualClass(it)}"><div><b class="equip-slot-label">${SLOT_NAMES[slot]}</b>：${it ? `<span class="${RARITIES[it.rarity].cls}">${inferItemTier(it)}阶 ${it.name}</span> · <b>${itemScore(it)}</b> <span class="${fit[1]}">${fit[0]}</span><div class="compact-meta">${compactItemText(it)}</div>${miniDetail("详细属性 / 评分", `${itemText(it)}<br>${gearScoreDetail(it)}`)}` : "空"}</div>${it ? `<div class="controls"><button onclick="refineItem('${it.id}')" ${(it.refine || 0) >= 5 ? "disabled" : ""}>精炼</button><button onclick="unequip('${slot}')">卸下</button></div>` : ""}</div>`;
    },
  ).join("")}</div><div class="card" style="margin-top:10px"><h3>背包</h3>${
    ordered
      .map((it) => {
        const old = state.equipment[it.slot],
          delta = inventoryUpgradeDelta(it),
          positive = delta > 0,
          fit = gearFitLabel(it);
        return `<div class="item ${itemVisualClass(it)}"><div><span class="item-name ${RARITIES[it.rarity].cls}">${inferItemTier(it)}阶 ${it.name}</span> · ${SLOT_NAMES[it.slot]} · <b>${itemScore(it)}</b> <span class="${fit[1]}">${fit[0]}</span><div class="compact-meta">${compactItemText(it)}</div><div class="compare ${positive ? "risk-safe" : "muted"}">${positive ? `提升 +${delta}` : `无提升 ${delta}`}${old ? `｜当前${itemScore(old)}` : ""}</div>${miniDetail("详细属性 / 评分", `${itemText(it)}<br>${gearScoreDetail(it)}`)}</div><div class="controls"><button onclick="equipItem('${it.id}')">装备</button><button onclick="refineItem('${it.id}')" ${(it.refine || 0) >= 5 ? "disabled" : ""}>精炼</button><button onclick="state.inventory.find(x=>x.id==='${it.id}').locked=!state.inventory.find(x=>x.id==='${it.id}').locked;render()">${it.locked ? "解锁" : "锁定"}</button><button ${it.locked ? "disabled" : ""} onclick="sellItem('${it.id}')">出售${itemSellValue(it)}</button></div></div>`;
      })
      .join("") || '<div class="muted">尚无装备。</div>'
  }</div>`;
}

/* ===== core-15.js ===== */
function renderPets() {
  const f = state.petFilter || {
      minGrade: "F",
      minTier: 1,
      action: "release",
      keepAnyS: true,
    },
    counts = petTypeCounts(),
    mutants = state.pets.filter((p) => p.mutant).length;
  return `${typeof window.renderPetSystemsBefore === "function" ? window.renderPetSystemsBefore() : ""}${helpBlock(
    "宠物进阶规则",
    `阶级没有上限，每升1阶固定增加12%基础倍率（线性）。自然掉落最高6阶，7阶以上只能融合。变异X提供100倍同阶进阶经验。<br><br>${Array.from(
      { length: 10 },
      (_, i) => {
        const t = i + 1;
        return `${t}→${t + 1}约${petEvolutionSameTierCount(t)}只`;
      },
    ).join("｜")}<br><br><b>1—10阶本能：</b><br>${Object.entries(
      PET_TIER_INSTINCTS,
    )
      .map(([t, x]) => `${t}阶【${x.name}】${x.desc}`)
      .join("<br>")}`,
  )}<div class="grid2"><div class="card"><h3>自动筛选</h3><label>最低阶级 <select onchange="state.petFilter.minTier=Number(this.value);save()">${Array.from(
    { length: PET_TIER_MAX_UI },
    (_, i) => i + 1,
  )
    .map(
      (t) =>
        `<option value="${t}" ${Number(f.minTier || 1) === t ? "selected" : ""}>${t}阶</option>`,
    )
    .join(
      "",
    )}</select></label><p><label>最低资质 <select onchange="state.petFilter.minGrade=this.value;save()">${PET_GRADES.map((g) => `<option value="${g}" ${f.minGrade === g ? "selected" : ""}>${g}</option>`).join("")}</select></label></p><p><label>处理 <select onchange="state.petFilter.action=this.value;save()"><option value="release" ${f.action === "release" ? "selected" : ""}>放归换精华</option><option value="feed" ${f.action === "feed" ? "selected" : ""}>转化经验</option></select></label></p><label><input type="checkbox" ${f.keepAnyS ? "checked" : ""} onchange="state.petFilter.keepAnyS=this.checked;save()"> 单项S以上保留</label></div><div class="card"><h3>仓库</h3><p>攻击 ${counts.Attack}｜防御 ${counts.Defense}｜施法 ${counts.Magic}｜平衡 ${counts.Balance}</p><p>变异X：<span class="mutant-x">${mutants}</span>｜总数 ${state.pets.length}/${state.petCapacity}</p></div></div><div class="card" style="margin-top:10px"><h3>宠物</h3>${
    state.pets
      .slice()
      .sort((a, b) => petKeepScore(b) - petKeepScore(a))
      .map((p) => {
        const ps = petStats(p),
          grade = petOverallGrade(p),
          sp = petSpeciesData(p),
          plan = fusionPlan(p),
          xplan = mutantFusionPlan(p),
          hp = clamp(Number(p.hp || ps.maxHp), 0, ps.maxHp),
          power = petCombatPower(p),
          ordinaryCount = sameSpeciesDonors(p, false).length,
          mutantCount = sameSpeciesDonors(p, true).length,
          fusionButton = plan
            ? `<button onclick="mergePet('${p.id}')">融合 +${plan.evo}${plan.apt ? ` · ${PET_APT_NAMES[plan.apt.stat]}→${plan.apt.to}` : ""}</button>`
            : "",
          mutantButton = xplan
            ? `<button class="danger" onclick="mergeMutantPet('${p.id}')">消耗X +${xplan.evo}</button>`
            : "";
        return `<div class="pet-row ${p.mutant ? "mutant-card" : ""}">${petPortrait(p)}<div><b>${p.tier || 1}阶 ${p.mutant ? '<span class="mutant-x">X</span> ' : ""}${p.name} Lv.${p.level}</b> · ${PET_TYPES[p.type].name}${p.id === state.activePetId ? " · 出战中" : ""}${p.locked ? " · 已锁定" : ""}<div class="compact-meta">战力 <b>${power}</b> · 综合<span class="grade-${grade}">${grade}</span> · HP ${Math.round(hp)}/${ps.maxHp} · 攻${ps.atk} 防${ps.def} 魔${ps.magic}</div><div class="compact-meta">${petEvolutionText(p)}｜普通素材${ordinaryCount}｜X素材${mutantCount}</div>${miniDetail("宠物详情", `${sp.archetype}｜${sp.desc}<br><b>培养：</b>${petBuildFit(p)}<br><b>阶级本能：</b>${petScaledInstinctText(p)}<br><b>特性【${sp.trait}】：</b>${petScaledTraitText(p)}（×${petTraitScale(p).toFixed(2)}）<br><b>专属技能【${sp.skill}】：</b>${petScaledSkillText(p)}<br><b>类型能力：</b>${PET_TYPES[p.type].desc}<br>${aptitudeText(p)}`)}</div><div class="controls"><button ${p.id === state.activePetId ? "disabled" : ""} onclick="setActivePet('${p.id}')">出战</button><button onclick="togglePetLock('${p.id}')">${p.locked ? "解锁" : "锁定"}</button><button onclick="feedPet('${p.id}')">经验</button>${fusionButton}${mutantButton}<button onclick="releasePet('${p.id}')">放归</button></div></div>`;
      })
      .join("") || '<div class="muted">尚无宠物。</div>'
  }</div>${typeof window.renderPetSystemsAfter === "function" ? window.renderPetSystemsAfter() : ""}`;
}
function renderShop() {
  const p = activePet(),
    apt = p ? aptitudeTrainingCosts(p) : null;
  return `${typeof window.marketPanel === "function" ? window.marketPanel() + '<div style="margin-top:10px">' : ""}<div class="card"><h3>仓库扩建</h3><p>装备 ${state.inventory.length}/${state.inventoryCapacity}</p><button onclick="expandInventory()">装备+5 · ${300 + (state.inventoryCapacity - 40) * 45}</button><p>宠物 ${state.pets.length}/${state.petCapacity}</p><button onclick="expandPetCapacity()">宠物+2 · ${500 + (state.petCapacity - 12) * 120}</button></div><div class="grid2" style="margin-top:10px"><div class="card"><h3>宠物训练</h3>${p ? `<p>${p.tier || 1}阶 ${p.name} Lv.${p.level}</p><button onclick="trainActivePet()">经验训练 · ${activePetTrainingCost()}金币</button>${miniDetail("进阶说明", `宠物等级上限Lv.100；长期成长主要依靠无限融合阶级与资质。${petEvolutionText(p)}`)}` : '<div class="muted">选择出战宠物后开放。</div>'}</div><div class="card"><h3>资质训练</h3>${p ? `<p>${PET_APT_NAMES[apt.key]} ${migratePetAptitudes(p)[apt.key]} → ${gradeFromIndex(gradeIndex(migratePetAptitudes(p)[apt.key]) + 1)}</p><button onclick="trainPetAptitude()" ${gradeIndex(migratePetAptitudes(p)[apt.key]) >= 8 ? "disabled" : ""}>训练 · ${apt.gold}金币 + ${apt.dust}精华</button>` : '<div class="muted">选择出战宠物后开放。</div>'}</div></div>${helpBlock("商店说明", "随机装备行商已删除；装备获取集中到刷怪掉落与30分钟定时商店，避免重复且低价值的购买入口。装备精炼仍在“装备”页面进行。")}${typeof window.marketPanel === "function" ? "</div>" : ""}`;
}
function renderMaps() {
  return `${typeof window.renderMapSystemsBefore === "function" ? window.renderMapSystemsBefore() : ""}${helpBlock("地图与危险度说明", "所有地图始终可进入，没有等级或转生硬门槛。危险度真实强化敌人与收益：击败Boss自动升一级，任意战斗失败自动降一级。")}${MAPS.map(
    (m) => {
      const effective = effectiveMapCp(m),
        ratio = effective / Math.max(1, cp()),
        risk =
          ratio < 0.75
            ? ["安全", "risk-safe"]
            : ratio < 1.35
              ? ["适中", "risk-even"]
              : ratio < 2.5
                ? ["高危", "risk-hard"]
                : ["极危", "risk-hard"],
        bp = state.bossProgress[m.id],
        metric = ensureMetric(m.id),
        actual = metric.battles
          ? `${((metric.wins / metric.battles) * 100).toFixed(1)}%`
          : "—",
        cycle = ensureBossCycle(m.id),
        d = dangerDropProfile(m.id);
      return `<div class="map-card ${state.mapId === m.id ? "selected" : ""}"><div class="map-head"><b>${m.name} · T${cycle.threatTier || 0}/${threatCapText(m.id)}</b><span class="${risk[1]}">${risk[0]} · CP ${effective}</span></div><div class="compact-meta">Lv.${m.levels[0]}—${m.levels[1]} · 装备${m.gearTier}阶 · 宠物${m.petTier}阶 · 预计胜率${estimatedWin(m)}% · 实际${actual}</div><div class="compact-meta">${bossEncounterText(m.id)}${bp ? ` · Boss ${Math.round(bp.hp)}/${bp.maxHp}` : ""} · 击败${cycle.bossWins}次</div>${miniDetail("地图详情", `基准CP ${m.cp}｜角色/地图CP比×${ratio.toFixed(2)}｜失败压力 ${(cycle.dangerFail || 0).toFixed(1)}/3<br>怪物：${m.monsters.join("、")}｜Boss：${m.boss}<br>掉落：装备×${d.gearDrop.toFixed(2)}｜Boss宠物×${d.petDrop.toFixed(2)}｜神话×${d.mythic.toFixed(2)}｜变异X×${d.mutation.toFixed(2)}`)}<div class="controls"><button ${state.mapId === m.id ? "disabled" : ""} onclick="changeMap('${m.id}')">前往</button></div></div>`;
    },
  ).join("")}`;
}
function renderTitles() {
  return `${helpBlock("称号说明", "一次只能装备一个称号；部分称号有取舍，不一定是纯正向加成。")}${Object.entries(
    TITLES,
  )
    .map(([id, t]) => {
      const unlocked = state.titlesUnlocked.includes(id);
      return `<div class="item"><div><b>${t.name}</b>${state.equippedTitle === id ? " · 已装备" : ""}<div class="compact-meta">${unlocked ? "已解锁" : "未解锁"} · ${t.desc}</div></div><button ${!unlocked ? "disabled" : ""} onclick="state.equippedTitle=state.equippedTitle==='${id}'?null:'${id}';render()">${state.equippedTitle === id ? "卸下" : "装备"}</button></div>`;
    })
    .join("")}`;
}
function renderRebirth() {
  const rp = rebirthProfile(),
    laws = ensureRebirthLaws(),
    can = state.level >= 100,
    next = state.rebirths + 1;
  return `${helpBlock("转生说明", "转生回到Lv.1，但永久保留装备、宠物、已解锁种族/职业和所有技能熟练度。身份已经可以在角色页随时切换，不再绑定转生；技能随职业解锁，无需练满低阶技能。")}<div class="grid2"><div class="card law-card"><h3>轮回共鸣 · R${state.rebirths}</h3><p class="rebirth-power">攻击×${rp.damage.toFixed(2)}｜宠物×${rp.petPower.toFixed(2)}｜经验×${rp.xp.toFixed(2)}</p>${miniDetail("其他轮回效果", `技能熟练×${rp.skillMastery.toFixed(2)}｜宠物经验×${rp.petXp.toFixed(2)}。`)}</div><div class="card"><h3>当前身份</h3><p>${RACES[state.race].icon}${identityRarityLabel(RACES[state.race])} ${RACES[state.race].name} · ${STYLES[state.style].icon}${identityRarityLabel(STYLES[state.style])} ${STYLES[state.style].name}</p><div class="compact-meta">身份切换请到“角色”页。转生不会改变当前身份。</div></div></div><div class="card" style="margin-top:7px"><h3>第${next}次转生 · 法则</h3>${Object.entries(
    REBIRTH_LAWS,
  )
    .map(([id, l]) => {
      const maxed = (laws[id] || 0) >= REBIRTH_LAW_MAX;
      return `<label class="skill-row ${state.pendingRebirthLaw === id ? "on" : ""}" style="cursor:${maxed ? "default" : "pointer"};opacity:${maxed ? 0.65 : 1}"><input type="radio" name="rebirth-law" value="${id}" ${state.pendingRebirthLaw === id ? "checked" : ""} ${maxed ? "disabled" : ""} onchange="state.pendingRebirthLaw='${id}';save()"><div><b class="law-name">${l.name} Lv.${laws[id] || 0}${maxed ? " MAX" : ` → Lv.${(laws[id] || 0) + 1}`}</b><div class="compact-meta">${l.desc}</div></div></label>`;
    })
    .join(
      "",
    )}<button ${can ? "" : "disabled"} onclick="rebirth()">执行第${next}次转生</button></div>`;
}

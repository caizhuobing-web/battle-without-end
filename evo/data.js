/* 万变之种：纯数据表。此文件不得包含逻辑。 */
(function (G) {
  const TAGS = {
    phys: { n: "物理", c: "#e6dcc8" },
    poison: { n: "剧毒", c: "#8fd44a" },
    fire: { n: "火焰", c: "#ff8a3c" },
    light: { n: "雷电", c: "#6fd8ff" },
    cold: { n: "冰霜", c: "#a9bcff" },
    blood: { n: "鲜血", c: "#ee4c66" },
    brood: { n: "虫群", c: "#c79bff" },
    armor: { n: "甲壳", c: "#d0a858" },
  };

  /* 技能：cd 冷却秒，b 基础伤害。每级伤害 +35%，3 级与 5 级各 +1 数量。 */
  const SKILLS = {
    claw: { n: "撕裂利爪", tag: "phys", ic: "🐾", cd: 0.7, b: 13, d: "撕咬身边最近的 2 个敌人" },
    spike: { n: "骨刺射击", tag: "phys", ic: "🦴", cd: 1.1, b: 16, d: "向最近的敌人射出可穿透的骨刺" },
    orbit: { n: "环绕骨环", tag: "phys", ic: "💫", cd: 0, b: 9, d: "2 枚骨环绕身旋转，持续切割触碰的敌人" },
    spore: { n: "剧毒孢子", tag: "poison", ic: "🍄", cd: 2.0, b: 3.4, d: "投出毒云，范围内敌人不断叠加中毒" },
    flame: { n: "烈焰吐息", tag: "fire", ic: "🔥", cd: 1.4, b: 16, d: "向最近的敌人喷出扇形火焰并点燃" },
    arc: { n: "连锁电弧", tag: "light", ic: "⚡", cd: 1.2, b: 21, d: "电弧在 3 个敌人之间弹跳" },
    nova: { n: "冰霜新星", tag: "cold", ic: "❄️", cd: 2.6, b: 18, d: "冰环冲击周围所有敌人并减速" },
    drain: { n: "血噬触须", tag: "blood", ic: "🩸", cd: 1.0, b: 12, d: "吸取生命最高的敌人，回复自身生命" },
    brood: { n: "孵化虫群", tag: "brood", ic: "🪲", cd: 0, b: 8, d: "孵化 2 只幼虫，自动追咬敌人" },
    thorn: { n: "棘刺甲壳", tag: "armor", ic: "🛡️", cd: 2.5, b: 11, d: "护甲提升并反伤近战敌人，周期性释放棘刺" },
  };

  /* 变异：rar 1 普通 2 稀有 3 史诗；max 可叠层数；req 需要已拥有对应标签的技能或形态亲和。 */
  const MUTS = {
    hp: { n: "强健体魄", rar: 1, max: 5, st: [["hpPct", 18]], d: "最大生命 +18%" },
    dmg: { n: "锐化", rar: 1, max: 5, st: [["dmg", 10]], d: "全部伤害 +10%" },
    spd: { n: "亢奋", rar: 1, max: 5, st: [["atkSpd", 9]], d: "攻击速度 +9%" },
    regen: { n: "再生组织", rar: 1, max: 5, st: [["regen", 1.5]], d: "每秒回复 +1.5 生命" },
    armor: { n: "角质硬化", rar: 1, max: 5, st: [["armor", 9]], d: "护甲 +9" },
    crit: { n: "敏锐感官", rar: 1, max: 5, st: [["crit", 6]], d: "暴击率 +6%" },
    critd: { n: "残暴", rar: 1, max: 5, st: [["critDmg", 25]], d: "暴击伤害 +25%" },
    area: { n: "延展", rar: 1, max: 4, st: [["area", 12]], d: "范围 +12%" },
    xp: { n: "贪食", rar: 1, max: 3, st: [["xp", 12]], d: "经验获取 +12%" },
    leech: { n: "汲取", rar: 1, max: 4, st: [["leech", 2]], d: "直接伤害的 2% 转为生命" },

    physInc: { n: "骨质增生", tag: "phys", rar: 2, max: 3, req: "phys", st: [["physInc", 25]], d: "物理伤害 +25%" },
    poisonInc: { n: "毒腺", tag: "poison", rar: 2, max: 3, req: "poison", st: [["poisonInc", 25]], d: "剧毒伤害 +25%" },
    fireInc: { n: "燃素囊", tag: "fire", rar: 2, max: 3, req: "fire", st: [["fireInc", 25]], d: "火焰伤害 +25%" },
    lightInc: { n: "电容器官", tag: "light", rar: 2, max: 3, req: "light", st: [["lightInc", 25]], d: "雷电伤害 +25%" },
    coldInc: { n: "霜核", tag: "cold", rar: 2, max: 3, req: "cold", st: [["coldInc", 25]], d: "冰霜伤害 +25%" },
    bloodInc: { n: "血髓", tag: "blood", rar: 2, max: 3, req: "blood", st: [["bloodInc", 25]], d: "鲜血伤害 +25%" },
    broodInc: { n: "信息素", tag: "brood", rar: 2, max: 3, req: "brood", st: [["broodInc", 25]], d: "虫群伤害 +25%" },
    armorInc: { n: "倒刺", tag: "armor", rar: 2, max: 3, req: "armor", st: [["armorInc", 25], ["thorns", 5]], d: "甲壳伤害 +25%，反伤 +5" },
    elem: { n: "元素亲和", rar: 2, max: 3, st: [["fireInc", 12], ["lightInc", 12], ["coldInc", 12]], d: "火焰、雷电、冰霜伤害各 +12%" },
    dur: { n: "持久毒性", rar: 2, max: 2, st: [["dur", 30]], d: "中毒与点燃持续时间 +30%" },
    shield: { n: "能量护膜", rar: 2, max: 3, st: [["shield", 25]], d: "获得 25 点可自动回复的护盾" },
    frenzy: { n: "嗜杀", rar: 2, max: 2, st: [["frenzy", 1]], d: "每次击杀攻速 +1%，持续 5 秒，最多 40%" },
    heavy: { n: "迟缓巨力", rar: 2, max: 2, st: [["dmg", 28], ["atkSpd", -8]], d: "伤害 +28%，攻速 -8%" },
    dodge: { n: "滑腻表皮", rar: 2, max: 3, st: [["dodge", 7]], d: "闪避率 +7%" },

    multi: { n: "多重分裂", rar: 3, max: 2, st: [["proj", 1]], d: "所有技能的目标数、弹数、弹跳数 +1" },
    psnCap: { n: "腐蚀叠层", tag: "poison", rar: 2, max: 3, req: "poison", st: [["poisonCap", 5]], d: "中毒层数上限 +5" },
    psnSpread: { n: "传染", tag: "poison", rar: 3, max: 2, req: "poison", st: [["poisonSpread", 50]], d: "中毒敌人死亡时，把 50% 毒层传给附近敌人" },
    burnExp: { n: "爆燃", tag: "fire", rar: 3, max: 2, req: "fire", st: [["burnExplode", 2]], d: "被点燃的敌人死亡时爆炸，伤害为其最大生命的 2%" },
    overload: { n: "过载", tag: "light", rar: 3, max: 2, req: "light", st: [["overload", 60]], d: "雷电命中被点燃的敌人时引发爆炸，伤害为该次命中的 60%" },
    chain: { n: "导体", tag: "light", rar: 2, max: 3, req: "light", st: [["chain", 1]], d: "电弧弹跳次数 +1" },
    shatter: { n: "碎冰", tag: "cold", rar: 2, max: 3, req: "cold", st: [["shatter", 30]], d: "对减速或冻结的敌人伤害 +30%" },
    freeze: { n: "深寒", tag: "cold", rar: 2, max: 3, req: "cold", st: [["freeze", 12]], d: "冰霜命中有 12% 概率冻结敌人" },
    iceShard: { n: "冰爆", tag: "cold", rar: 3, max: 2, req: "cold", st: [["iceShard", 100]], d: "减速或冻结的敌人死亡时迸发冰片" },
    nest: { n: "巢穴扩张", tag: "brood", rar: 2, max: 3, req: "brood", st: [["minions", 1]], d: "幼虫数量 +1" },
    acid: { n: "酸液虫", tag: "brood", rar: 3, max: 1, req: "brood", st: [["minionPoison", 1]], d: "幼虫每次撕咬附加 1 层中毒" },
    rage: { n: "濒死狂怒", tag: "blood", rar: 2, max: 2, st: [["lowHp", 40]], d: "生命越低伤害越高，最多 +40%" },
    bshield: { n: "血盾", tag: "blood", rar: 3, max: 1, req: "blood", st: [["overheal", 30]], d: "溢出的治疗转为护盾，上限为最大生命的 30%" },
    giant: { n: "巨化", rar: 3, max: 2, st: [["hpPct", 25], ["hpToDmg", 2]], d: "最大生命 +25%，每 100 点最大生命使伤害 +2%" },
    exec: { n: "处决本能", tag: "phys", rar: 3, max: 1, req: "phys", st: [["execute", 12]], d: "暴击会直接处决生命低于 12% 的非首领敌人" },
    heart: { n: "第二心脏", rar: 3, max: 1, st: [["revive", 1]], d: "本局首次死亡时以 50% 生命复活并震开敌人" },
    tpsn: { n: "毒棘", tag: "armor", rar: 3, max: 1, req: "armor", st: [["thornPoison", 2]], d: "近战攻击你的敌人被附加 2 层中毒" },
    glass: { n: "玻璃大炮", rar: 3, max: 1, st: [["dmg", 45], ["hpPct", -25]], d: "伤害 +45%，最大生命 -25%" },
    kheal: { n: "噬尸", rar: 2, max: 3, st: [["killHeal", 1]], d: "每次击杀回复 1 点生命" },
  };

  /* 进化形态：p 父形态，tier 阶，aff 亲和标签（提高对应变异出现率）。 */
  const FORMS = {
    A: { n: "猎牙兽", tier: 1, fam: "A", c: "#ff8f5a", aff: ["phys", "blood"], st: [["physInc", 25], ["crit", 10], ["atkSpd", 10]], d: "掠食系。物理 +25%，暴击 +10%，攻速 +10%" },
    B: { n: "灵焰水母", tier: 1, fam: "B", c: "#7fd0ff", aff: ["fire", "light", "cold"], st: [["fireInc", 20], ["lightInc", 20], ["coldInc", 20], ["area", 15], ["shield", 40]], d: "元素系。火、雷、冰 +20%，范围 +15%，护盾 40" },
    C: { n: "孢母", tier: 1, fam: "C", c: "#9bd65a", aff: ["poison", "brood", "armor"], st: [["poisonInc", 20], ["broodInc", 20], ["hpPct", 20], ["armor", 10]], d: "群殖系。剧毒与虫群 +20%，生命 +20%，护甲 +10" },

    A1: { n: "影爪豹", tier: 2, p: "A", fam: "A", c: "#ffb347", aff: ["phys"], st: [["atkSpd", 20], ["crit", 10], ["critDmg", 30], ["dodge", 10]], d: "攻速 +20%，暴击 +10%，暴伤 +30%，闪避 +10%" },
    A2: { n: "血颚鳄", tier: 2, p: "A", fam: "A", c: "#e8506a", aff: ["blood"], st: [["hpPct", 40], ["leech", 4], ["bloodInc", 30], ["regen", 3]], d: "生命 +40%，吸血 +4%，鲜血 +30%，回复 +3" },
    B1: { n: "熔核体", tier: 2, p: "B", fam: "B", c: "#ff7a2e", aff: ["fire"], st: [["fireInc", 40], ["dur", 30], ["burnExplode", 2]], d: "火焰 +40%，持续 +30%，点燃的敌人死亡时爆炸" },
    B2: { n: "霜雷体", tier: 2, p: "B", fam: "B", c: "#9fb4ff", aff: ["cold", "light"], st: [["coldInc", 30], ["lightInc", 30], ["freeze", 10]], d: "冰霜与雷电 +30%，冻结概率 +10%" },
    C1: { n: "瘟疫母巢", tier: 2, p: "C", fam: "C", c: "#b4e03c", aff: ["poison", "armor"], st: [["poisonInc", 40], ["poisonCap", 5], ["dur", 25]], d: "剧毒 +40%，毒层上限 +5，持续 +25%" },
    C2: { n: "虫巢女王", tier: 2, p: "C", fam: "C", c: "#c79bff", aff: ["brood"], st: [["minions", 2], ["broodInc", 40]], d: "幼虫 +2，虫群伤害 +40%" },

    A1a: { n: "瞬杀之影", tier: 3, p: "A1", fam: "A", c: "#ffe08a", aff: ["phys"], st: [["execute", 20], ["critDmg", 50], ["crit", 10]], d: "暴击处决 20% 以下的敌人，暴伤 +50%，暴击 +10%" },
    A1b: { n: "千刃风暴", tier: 3, p: "A1", fam: "A", c: "#ffd0a0", aff: ["phys"], st: [["proj", 2], ["frenzy", 2]], d: "所有技能目标数 +2，击杀叠加攻速" },
    A2a: { n: "猩红暴君", tier: 3, p: "A2", fam: "A", c: "#ff3050", aff: ["blood"], st: [["hpToDmg", 3], ["overheal", 40], ["hpPct", 30]], d: "每 100 生命伤害 +3%，溢出治疗转护盾，生命 +30%" },
    A2b: { n: "噬魂者", tier: 3, p: "A2", fam: "A", c: "#b03cff", aff: ["blood"], st: [["soul", 0.4], ["leech", 3]], d: "每次击杀本局永久伤害 +0.4%（上限 200%），吸血 +3%" },
    B1a: { n: "炎狱之心", tier: 3, p: "B1", fam: "B", c: "#ff4a1c", aff: ["fire"], st: [["burnExplode", 4], ["fireInc", 40], ["area", 20]], d: "死亡爆炸大幅强化，火焰 +40%，范围 +20%" },
    B1b: { n: "雷火共鸣体", tier: 3, p: "B1", fam: "B", c: "#ffd23c", aff: ["fire", "light"], st: [["overload", 120], ["lightInc", 40], ["chain", 1]], d: "雷电命中点燃目标引发过载爆炸，雷电 +40%，弹跳 +1" },
    B2a: { n: "永冻君主", tier: 3, p: "B2", fam: "B", c: "#d6e4ff", aff: ["cold"], st: [["shatter", 60], ["iceShard", 150], ["freeze", 15]], d: "对受冻敌人伤害 +60%，死亡迸发冰片，冻结 +15%" },
    B2b: { n: "风暴之眼", tier: 3, p: "B2", fam: "B", c: "#5ad0ff", aff: ["light"], st: [["chain", 3], ["dblLight", 35], ["atkSpd", 15]], d: "弹跳 +3，雷电 35% 概率再次命中，攻速 +15%" },
    C1a: { n: "腐化之源", tier: 3, p: "C1", fam: "C", c: "#7dff3c", aff: ["poison"], st: [["poisonCap", 30], ["poisonSpread", 100], ["poisonInc", 30]], d: "毒层上限 +30，死亡时毒层全额传染，剧毒 +30%" },
    C1b: { n: "毒甲巨虫", tier: 3, p: "C1", fam: "C", c: "#c8b040", aff: ["armor", "poison"], st: [["armor", 40], ["thorns", 15], ["thornPoison", 3], ["hpPct", 30]], d: "护甲 +40，反伤 +15，攻击你的敌人中毒，生命 +30%" },
    C2a: { n: "万虫之母", tier: 3, p: "C2", fam: "C", c: "#e07bff", aff: ["brood"], st: [["minions", 4], ["minionSplash", 60]], d: "幼虫 +4，撕咬造成 60% 溅射" },
    C2b: { n: "共生主宰", tier: 3, p: "C2", fam: "C", c: "#7be0c0", aff: ["brood", "poison"], st: [["symb", 1], ["broodInc", 40], ["regen", 4]], d: "幼虫撕咬为你回血，并附加中毒、点燃、减速" },
  };

  /* 敌人：hp 生命，sp 速度，dm 伤害，r 半径，xp 经验，w 起始波次，wt 权重。 */
  const ENEMIES = {
    grunt: { n: "游荡体", hp: 20, sp: 38, dm: 5, r: 9, xp: 1, w: 1, wt: 10, c: "#c85a6a" },
    fast: { n: "迅捷体", hp: 10, sp: 78, dm: 3, r: 7, xp: 1, w: 2, wt: 5, c: "#e8c04a" },
    spit: { n: "喷吐体", hp: 16, sp: 34, dm: 6, r: 9, xp: 2, w: 4, wt: 3, c: "#5ac8a0", ranged: 1 },
    tank: { n: "重甲体", hp: 75, sp: 24, dm: 10, r: 13, xp: 3, w: 6, wt: 3, c: "#8a8fa8", arm: 0.3 },
    split: { n: "分裂体", hp: 34, sp: 34, dm: 5, r: 11, xp: 2, w: 8, wt: 3, c: "#d070c8", split: 1 },
    bomb: { n: "自爆体", hp: 14, sp: 62, dm: 16, r: 8, xp: 2, w: 11, wt: 3, c: "#ff6030", bomb: 1 },
    mite: { n: "碎片", hp: 8, sp: 60, dm: 3, r: 5, xp: 0.5, w: 99, wt: 0, c: "#d070c8" },
    boss: { n: "领主", hp: 340, sp: 18, dm: 12, r: 24, xp: 30, w: 99, wt: 0, c: "#ff3c6e", boss: 1 },
  };

  /* 永久基因强化：c 起始价格，g 价格增长，max 上限。 */
  const META = {
    vit: { n: "体质", st: [["hpPct", 8]], c: 8, g: 1.5, max: 10, d: "最大生命 +8%" },
    fang: { n: "利齿", st: [["dmg", 6]], c: 8, g: 1.5, max: 10, d: "全部伤害 +6%" },
    meta: { n: "代谢", st: [["regen", 0.6]], c: 6, g: 1.5, max: 10, d: "每秒回复 +0.6" },
    shell: { n: "外骨骼", st: [["armor", 4]], c: 6, g: 1.5, max: 10, d: "护甲 +4" },
    sense: { n: "感知", st: [["xp", 6]], c: 10, g: 1.55, max: 10, d: "经验获取 +6%" },
    greed: { n: "基因采集", st: [["dna", 10]], c: 12, g: 1.6, max: 10, d: "DNA 获取 +10%" },
    reroll: { n: "基因重组", st: [["rerolls", 1]], c: 20, g: 2, max: 5, d: "每局重抽次数 +1" },
    heir: { n: "遗传记忆", st: [["startLv", 1]], c: 40, g: 2.5, max: 3, d: "开局额外获得 1 次变异" },
    fourth: { n: "第四选项", st: [["choices", 1]], c: 150, g: 1, max: 1, d: "每次变异多一个选项" },
  };

  const DIFFS = [
    { n: "浅滩", hp: 1, dm: 1, dna: 1 },
    { n: "沼泽", hp: 1.7, dm: 1.35, dna: 1.6 },
    { n: "深林", hp: 2.9, dm: 1.8, dna: 2.4 },
    { n: "熔窟", hp: 5, dm: 2.4, dna: 3.4 },
    { n: "深渊", hp: 8.5, dm: 3.2, dna: 4.8 },
    { n: "虚空", hp: 15, dm: 4.3, dna: 6.5 },
  ];

  G.EvoData = { TAGS, SKILLS, MUTS, FORMS, ENEMIES, META, DIFFS, WAVES: 30, WAVE_T: 20 };
})(typeof window !== "undefined" ? window : globalThis);

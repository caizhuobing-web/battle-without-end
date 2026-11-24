/* 万变之种：纯数据表。此文件不得包含逻辑。 */
(function (G) {
  const TAGS = {
    phys: { n: "物理", c: "#f4ead2" },
    poison: { n: "剧毒", c: "#8fd44a" },
    fire: { n: "火焰", c: "#ff7a2e" },
    light: { n: "雷电", c: "#5fd8f5" },
    cold: { n: "冰霜", c: "#a9bcff" },
    blood: { n: "鲜血", c: "#f0566a" },
    brood: { n: "虫群", c: "#c58bff" },
    armor: { n: "甲壳", c: "#c9a04e" },
  };

  /* 技能：rg 攻击距离（近身、中程、全场），cd 冷却秒，b 基础伤害。每级伤害 +35%，3 级与 5 级各 +1 数量。 */
  const SKILLS = {
    claw: { n: "撕裂利爪", tag: "phys", rg: "近身", cd: 0.7, b: 13, d: "撕咬身边最近的 2 个敌人" },
    spike: { n: "骨刺射击", tag: "phys", rg: "全场", cd: 1.1, b: 16, d: "向最近的敌人射出骨刺，可穿透 2 个敌人" },
    orbit: { n: "环绕骨环", tag: "phys", rg: "近身", cd: 0, b: 9, d: "2 枚骨环绕身旋转，切割碰到的敌人" },
    spore: { n: "剧毒孢子", tag: "poison", rg: "全场", cd: 2.0, b: 3.4, d: "在敌人脚下生成毒云，云中的敌人每 0.5 秒中毒 1 层" },
    flame: { n: "烈焰吐息", tag: "fire", rg: "中程", cd: 1.2, b: 20, d: "向最近的敌人喷出扇形火焰，并点燃命中的敌人" },
    arc: { n: "连锁电弧", tag: "light", rg: "全场", cd: 0.9, b: 27, d: "电弧在 4 个敌人之间弹跳，每次弹跳伤害 -8%。没有新目标时弹回第一个敌人" },
    nova: { n: "冰霜新星", tag: "cold", rg: "近身", cd: 2.3, b: 21, d: "冰环冲击周围所有敌人，并使其减速 2.5 秒" },
    drain: { n: "血噬触须", tag: "blood", rg: "全场", cd: 1.0, b: 12, d: "吸取生命最高的敌人，伤害的 35% 转为生命" },
    brood: { n: "孵化虫群", tag: "brood", rg: "全场", cd: 0, b: 11, d: "孵化 3 只幼虫，幼虫自动追咬敌人" },
    thorn: { n: "棘刺甲壳", tag: "armor", rg: "近身", cd: 2.0, b: 13, d: "每级护甲 +6，反伤近战敌人，并周期性向四周释放棘刺" },
  };

  /* 变异：rar 1 普通 2 稀有 3 史诗；max 可叠层数；req 需要已拥有对应标签的技能或形态亲和。 */
  const MUTS = {
    hp: { n: "厚壁组织", rar: 1, max: 5, st: [["hpPct", 18]], d: "生命上限 +18%" },
    dmg: { n: "锋利齿列", rar: 1, max: 5, st: [["dmg", 10]], d: "伤害 +10%" },
    spd: { n: "活跃代谢", rar: 1, max: 5, st: [["atkSpd", 9]], d: "攻击速度 +9%" },
    regen: { n: "再生组织", rar: 1, max: 5, st: [["regen", 1.5]], d: "每秒回复 +1.5 生命" },
    armor: { n: "角质硬化", rar: 1, max: 5, st: [["armor", 9]], d: "护甲 +9" },
    crit: { n: "敏锐感官", rar: 1, max: 5, st: [["crit", 6]], d: "暴击率 +6%" },
    critd: { n: "致命咬合", rar: 1, max: 5, st: [["critDmg", 25]], d: "暴击伤害 +25%" },
    area: { n: "延展触突", rar: 1, max: 4, st: [["area", 12]], d: "范围 +12%" },
    xp: { n: "贪食胞", rar: 1, max: 3, st: [["xp", 12]], d: "经验获取 +12%" },
    leech: { n: "汲取口器", rar: 1, max: 4, st: [["leech", 2]], d: "吸血 +2%" },

    physInc: { n: "骨质增生", tag: "phys", rar: 2, max: 3, req: "phys", st: [["physInc", 25]], d: "物理伤害 +25%" },
    poisonInc: { n: "毒腺", tag: "poison", rar: 2, max: 3, req: "poison", st: [["poisonInc", 25]], d: "剧毒伤害 +25%" },
    fireInc: { n: "燃素囊", tag: "fire", rar: 2, max: 3, req: "fire", st: [["fireInc", 25]], d: "火焰伤害 +25%" },
    lightInc: { n: "放电器官", tag: "light", rar: 2, max: 3, req: "light", st: [["lightInc", 25]], d: "雷电伤害 +25%" },
    coldInc: { n: "霜核", tag: "cold", rar: 2, max: 3, req: "cold", st: [["coldInc", 25]], d: "冰霜伤害 +25%" },
    bloodInc: { n: "血髓", tag: "blood", rar: 2, max: 3, req: "blood", st: [["bloodInc", 25]], d: "鲜血伤害 +25%" },
    broodInc: { n: "信息素", tag: "brood", rar: 2, max: 3, req: "brood", st: [["broodInc", 25]], d: "虫群伤害 +25%" },
    armorInc: { n: "倒刺", tag: "armor", rar: 2, max: 3, req: "armor", st: [["armorInc", 25], ["thorns", 5]], d: "甲壳伤害 +25%，反伤 +5" },
    elem: { n: "三相腺体", rar: 2, max: 3, st: [["fireInc", 12], ["lightInc", 12], ["coldInc", 12]], d: "火焰、雷电、冰霜伤害 +12%" },
    dur: { n: "缓释毒素", rar: 2, max: 2, st: [["dur", 30]], d: "中毒与点燃的持续时间 +30%" },
    shield: { n: "护膜", rar: 2, max: 3, st: [["shield", 25]], d: "护盾 +25，3 秒未受伤后自动回复" },
    frenzy: { n: "嗜杀反射", rar: 2, max: 2, st: [["frenzy", 1]], d: "击杀敌人时，攻击速度 +1%，持续 5 秒，最多 +40%" },
    heavy: { n: "粗壮肌束", rar: 2, max: 2, st: [["dmg", 28], ["atkSpd", -8]], d: "伤害 +28%，攻击速度 -8%" },
    dodge: { n: "滑腻表皮", rar: 2, max: 3, st: [["dodge", 7]], d: "闪避率 +7%" },

    multi: { n: "增殖器官", rar: 3, max: 2, st: [["proj", 1]], d: "所有技能的目标数、弹数、弹跳数 +1" },
    psnCap: { n: "浓缩毒囊", tag: "poison", rar: 2, max: 3, req: "poison", st: [["poisonCap", 5]], d: "中毒层数上限 +5" },
    psnSpread: { n: "传染孢子", tag: "poison", rar: 3, max: 2, req: "poison", st: [["poisonSpread", 50]], d: "中毒的敌人死亡时，把 50% 的中毒层数传给附近 3 个敌人" },
    burnExp: { n: "爆燃体液", tag: "fire", rar: 3, max: 2, req: "fire", st: [["burnExplode", 2]], d: "点燃的敌人死亡时爆炸，伤害为其生命上限的 2%" },
    overload: { n: "过载神经", tag: "light", rar: 3, max: 2, req: "light", req2: "fire", st: [["overload", 60]], d: "雷电命中点燃的敌人时引发爆炸，伤害为该次命中的 60%" },
    chain: { n: "导电黏液", tag: "light", rar: 2, max: 3, req: "light", st: [["chain", 1]], d: "电弧弹跳次数 +1" },
    shatter: { n: "碎冰颚", tag: "cold", rar: 2, max: 3, req: "cold", st: [["shatter", 30]], d: "对减速或冻结的敌人，伤害 +30%" },
    freeze: { n: "深寒腺", tag: "cold", rar: 2, max: 3, req: "cold", st: [["freeze", 12]], d: "冰霜命中时，12% 概率冻结敌人 1.4 秒" },
    iceShard: { n: "冰晶血", tag: "cold", rar: 3, max: 2, req: "cold", st: [["iceShard", 100]], d: "减速或冻结的敌人死亡时，向四周迸发冰片" },
    nest: { n: "扩张卵巢", tag: "brood", rar: 2, max: 3, req: "brood", st: [["minions", 1]], d: "幼虫数量 +1" },
    acid: { n: "酸液幼虫", tag: "brood", rar: 3, max: 1, req: "brood", st: [["minionPoison", 1]], d: "幼虫每次撕咬附加 1 层中毒" },
    rage: { n: "应激激素", tag: "blood", rar: 2, max: 2, st: [["lowHp", 40]], d: "生命越低伤害越高，濒死时最多 +40%" },
    bshield: { n: "凝血外膜", tag: "blood", rar: 3, max: 1, req: "blood", st: [["overheal", 30]], d: "溢出的治疗转为护盾，上限为生命上限的 30%" },
    giant: { n: "巨型化", rar: 3, max: 2, st: [["hpPct", 25], ["hpToDmg", 2]], d: "生命上限 +25%，每 100 点生命上限使伤害 +2%" },
    exec: { n: "猎杀本能", tag: "phys", rar: 3, max: 1, req: "phys", st: [["execute", 12]], d: "暴击时，直接杀死生命低于 12% 的非领主敌人" },
    heart: { n: "第二心脏", rar: 3, max: 1, st: [["revive", 1]], d: "本局第一次死亡时，以 50% 生命复活并击退敌人" },
    tpsn: { n: "毒棘", tag: "armor", rar: 3, max: 1, req: "armor", st: [["thornPoison", 2]], d: "近战攻击你的敌人中毒 2 层" },
    glass: { n: "薄壁增压", rar: 3, max: 1, st: [["dmg", 45], ["hpPct", -25]], d: "伤害 +45%，生命上限 -25%" },
    kheal: { n: "食腐消化", rar: 2, max: 3, st: [["killHeal", 1]], d: "击杀敌人时回复 1 点生命" },
  };

  /* 进化形态：p 父形态，tier 阶，aff 亲和标签（提高对应变异出现率）。 */
  const FORMS = {
    A: { n: "猎牙兽", tier: 1, fam: "A", c: "#ff8f5a", aff: ["phys", "blood"], st: [["physInc", 25], ["crit", 10], ["atkSpd", 10]], d: "掠食系。物理伤害 +25%，暴击率 +10%，攻击速度 +10%" },
    B: { n: "灵焰水母", tier: 1, fam: "B", c: "#7fd0ff", aff: ["fire", "light", "cold"], st: [["fireInc", 20], ["lightInc", 20], ["coldInc", 20], ["area", 15], ["shield", 40]], d: "元素系。火焰、雷电、冰霜伤害 +20%，范围 +15%，护盾 +40" },
    C: { n: "孢母", tier: 1, fam: "C", c: "#9bd65a", aff: ["poison", "brood", "armor"], st: [["poisonInc", 20], ["broodInc", 20], ["hpPct", 20], ["armor", 10]], d: "群殖系。剧毒与虫群伤害 +20%，生命上限 +20%，护甲 +10" },

    A1: { n: "影爪豹", tier: 2, p: "A", fam: "A", c: "#ffb347", aff: ["phys"], st: [["atkSpd", 20], ["crit", 10], ["critDmg", 30], ["dodge", 10]], d: "攻击速度 +20%，暴击率 +10%，暴击伤害 +30%，闪避率 +10%" },
    A2: { n: "血颚鳄", tier: 2, p: "A", fam: "A", c: "#e8506a", aff: ["blood"], st: [["hpPct", 40], ["leech", 4], ["bloodInc", 30], ["regen", 3]], d: "生命上限 +40%，吸血 +4%，鲜血伤害 +30%，每秒回复 +3 生命" },
    B1: { n: "熔核体", tier: 2, p: "B", fam: "B", c: "#ff7a2e", aff: ["fire"], st: [["fireInc", 40], ["dur", 30], ["burnExplode", 2]], d: "火焰伤害 +40%，点燃持续时间 +30%，点燃的敌人死亡时爆炸" },
    B2: { n: "霜雷体", tier: 2, p: "B", fam: "B", c: "#9fb4ff", aff: ["cold", "light"], st: [["coldInc", 30], ["lightInc", 30], ["freeze", 10]], d: "冰霜与雷电伤害 +30%，冻结概率 +10%" },
    C1: { n: "瘟疫母巢", tier: 2, p: "C", fam: "C", c: "#b4e03c", aff: ["poison", "armor"], st: [["poisonInc", 40], ["poisonCap", 5], ["dur", 25]], d: "剧毒伤害 +40%，中毒层数上限 +5，中毒持续时间 +25%" },
    C2: { n: "虫巢女王", tier: 2, p: "C", fam: "C", c: "#c79bff", aff: ["brood"], st: [["minions", 2], ["broodInc", 40]], d: "幼虫数量 +2，虫群伤害 +40%" },

    A1a: { n: "瞬杀之影", tier: 3, p: "A1", fam: "A", c: "#ffe08a", aff: ["phys"], st: [["execute", 20], ["critDmg", 50], ["crit", 10]], d: "暴击时直接杀死生命低于 20% 的非领主敌人，暴击伤害 +50%，暴击率 +10%" },
    A1b: { n: "千刃风暴", tier: 3, p: "A1", fam: "A", c: "#ffd0a0", aff: ["phys"], st: [["proj", 2], ["frenzy", 2]], d: "所有技能的目标数 +2，击杀敌人时攻击速度 +2%，最多 +40%" },
    A2a: { n: "猩红暴君", tier: 3, p: "A2", fam: "A", c: "#ff3050", aff: ["blood"], st: [["hpToDmg", 3], ["overheal", 40], ["hpPct", 30]], d: "每 100 点生命上限使伤害 +3%，溢出的治疗转为护盾，生命上限 +30%" },
    A2b: { n: "噬魂者", tier: 3, p: "A2", fam: "A", c: "#b03cff", aff: ["blood"], st: [["soul", 0.4], ["leech", 3]], d: "击杀敌人时本局伤害永久 +0.4%，最多 +200%，吸血 +3%" },
    B1a: { n: "炎狱之心", tier: 3, p: "B1", fam: "B", c: "#ff4a1c", aff: ["fire"], st: [["burnExplode", 4], ["fireInc", 40], ["area", 20]], d: "点燃的敌人死亡时的爆炸伤害提高到生命上限的 6%，火焰伤害 +40%，范围 +20%" },
    B1b: { n: "雷火共鸣体", tier: 3, p: "B1", fam: "B", c: "#ffd23c", aff: ["fire", "light"], st: [["overload", 120], ["lightInc", 40], ["chain", 1]], d: "雷电命中点燃的敌人时引发爆炸，雷电伤害 +40%，电弧弹跳次数 +1" },
    B2a: { n: "永冻君主", tier: 3, p: "B2", fam: "B", c: "#d6e4ff", aff: ["cold"], st: [["shatter", 60], ["iceShard", 150], ["freeze", 15]], d: "对减速或冻结的敌人伤害 +60%，其死亡时迸发冰片，冻结概率 +15%" },
    B2b: { n: "风暴之眼", tier: 3, p: "B2", fam: "B", c: "#5ad0ff", aff: ["light"], st: [["chain", 3], ["dblLight", 35], ["atkSpd", 15]], d: "电弧弹跳次数 +3，雷电命中时 35% 概率再命中一次，攻击速度 +15%" },
    C1a: { n: "腐化之源", tier: 3, p: "C1", fam: "C", c: "#7dff3c", aff: ["poison"], st: [["poisonCap", 30], ["poisonSpread", 100], ["poisonInc", 30]], d: "中毒层数上限 +30，中毒的敌人死亡时传出全部层数，剧毒伤害 +30%" },
    C1b: { n: "毒甲巨虫", tier: 3, p: "C1", fam: "C", c: "#c8b040", aff: ["armor", "poison"], st: [["armor", 40], ["thorns", 15], ["thornPoison", 3], ["hpPct", 30]], d: "护甲 +40，反伤 +15，近战攻击你的敌人中毒 3 层，生命上限 +30%" },
    C2a: { n: "万虫之母", tier: 3, p: "C2", fam: "C", c: "#e07bff", aff: ["brood"], st: [["minions", 4], ["minionSplash", 60]], d: "幼虫数量 +4，幼虫撕咬时对周围造成 60% 溅射伤害" },
    C2b: { n: "共生主宰", tier: 3, p: "C2", fam: "C", c: "#7be0c0", aff: ["brood", "poison"], st: [["symb", 1], ["broodInc", 40], ["regen", 4]], d: "幼虫撕咬时为你回复生命，并使敌人中毒、点燃、减速" },
  };

  /* 敌人：hp 生命，sp 速度，dm 伤害，r 半径，xp 经验，w 起始波次，wt 权重。 */
  const ENEMIES = {
    grunt: { n: "游荡体", hp: 20, sp: 38, dm: 5, r: 9, xp: 0.3, w: 1, wt: 10, c: "#c85a6a" },
    fast: { n: "迅捷体", hp: 10, sp: 78, dm: 3, r: 7, xp: 0.3, w: 2, wt: 5, c: "#e8c04a" },
    spit: { n: "喷吐体", hp: 16, sp: 34, dm: 6, r: 9, xp: 0.6, w: 4, wt: 3, c: "#5ac8a0", ranged: 1 },
    tank: { n: "重甲体", hp: 75, sp: 24, dm: 10, r: 13, xp: 0.9, w: 6, wt: 3, c: "#8a8fa8", arm: 0.3 },
    split: { n: "分裂体", hp: 34, sp: 34, dm: 5, r: 11, xp: 0.6, w: 8, wt: 3, c: "#d070c8", split: 1 },
    bomb: { n: "自爆体", hp: 14, sp: 62, dm: 16, r: 8, xp: 0.6, w: 11, wt: 3, c: "#ff6030", bomb: 1 },
    mite: { n: "碎片", hp: 8, sp: 60, dm: 3, r: 5, xp: 0.15, w: 99, wt: 0, c: "#d070c8" },
    boss: { n: "领主", hp: 340, sp: 18, dm: 12, r: 24, xp: 30, w: 99, wt: 0, c: "#ff3c6e", boss: 1 },
  };

  /* 营地强化：c 起始价格，g 价格增长，max 上限。cur 为 sp 时用样本点购买，否则用 DNA。 */
  const META = {
    vit: { n: "体质", st: [["hpPct", 8]], c: 8, g: 1.5, max: 10, d: "生命上限 +8%" },
    fang: { n: "利齿", st: [["dmg", 6]], c: 8, g: 1.5, max: 10, d: "伤害 +6%" },
    meta: { n: "代谢", st: [["regen", 0.6]], c: 6, g: 1.5, max: 10, d: "每秒回复 +0.6 生命" },
    shell: { n: "外骨骼", st: [["armor", 4]], c: 6, g: 1.5, max: 10, d: "护甲 +4" },
    sense: { n: "感知", st: [["xp", 6]], c: 10, g: 1.55, max: 10, d: "经验获取 +6%" },
    greed: { n: "基因采集", st: [["dna", 10]], c: 12, g: 1.6, max: 10, d: "DNA 获取 +10%" },
    reroll: { n: "基因重组", st: [["rerolls", 1]], c: 20, g: 2, max: 5, d: "每局可重抽变异的次数 +1" },
    heir: { n: "遗传记忆", st: [["startLv", 1]], c: 40, g: 2.5, max: 3, d: "开局额外获得 1 个变异" },
    fourth: { n: "第四选项", st: [["choices", 1]], c: 150, g: 1, max: 1, d: "每次选择变异时多 1 个选项" },
    keep: { n: "回收囊", st: [["keep", 10]], c: 25, g: 2, max: 4, d: "死在井里时，多带回 10% 的 DNA" },
    /* 第二层：用样本点购买。req 为需要到达过的最深层。 */
    decomp: { n: "减压腺", st: [["decomp", 10]], cur: "sp", c: 2, g: 1.6, max: 5, req: 2, d: "上浮时的减压伤害 -10%" },
    twin: { n: "双生技能", st: [["startSkill", 1]], cur: "sp", c: 8, g: 1, max: 1, req: 3, d: "开局多选 1 个技能" },
    vit2: { n: "进阶体质", st: [["hpPct", 6]], cur: "sp", c: 3, g: 1.25, max: 10, req: 3, d: "生命上限 +6%" },
    fang2: { n: "进阶利齿", st: [["dmg", 5]], cur: "sp", c: 3, g: 1.25, max: 10, req: 3, d: "伤害 +5%" },
    shell2: { n: "进阶外骨骼", st: [["armor", 4]], cur: "sp", c: 4, g: 1.25, max: 10, req: 4, d: "护甲 +4" },
    meta2: { n: "进阶代谢", st: [["regen", 0.8]], cur: "sp", c: 4, g: 1.25, max: 10, req: 4, d: "每秒回复 +0.8 生命" },
    apex: { n: "终极适应", st: [["apex", 12]], cur: "sp", c: 15, g: 1.5, max: 5, req: 5, d: "进化到终极形态后，伤害与生命上限 +12%" },
  };

  /* 深井只有一口，难度只来自深度。保留数组形式是为了兼容旧存档字段。 */
  const DIFFS = [{ n: "深井", hp: 1, dm: 1, dna: 1 }];

  /* 环境带：每两层换一种。c 为培养液的暗、中、亮三色。 */
  const ZONES = [
    { n: "浅水带", c: ["#123440", "#1c4f57", "#2d7a72"] },
    { n: "暗流带", c: ["#101c3c", "#1b2f66", "#3558a8"] },
    { n: "热泉带", c: ["#2a1430", "#4a2050", "#8a3f7a"] },
    { n: "酸蚀带", c: ["#1c2410", "#33451c", "#6a8a2c"] },
    { n: "无光带", c: ["#0e0a16", "#1a1326", "#3a2c52"] },
  ];

  /* 样本：领主与精英掉落，越深等级越高。v 为带回营地后折算的样本点。 */
  const SAMPLES = [
    { n: "残片", v: 1 },
    { n: "腺体", v: 3 },
    { n: "核心", v: 8 },
    { n: "原质", v: 20 },
  ];

  G.EvoData = { TAGS, SKILLS, MUTS, FORMS, ENEMIES, META, DIFFS, ZONES, SAMPLES, LAYER: 5, WAVES: 30, WAVE_T: 20 };
})(typeof window !== "undefined" ? window : globalThis);

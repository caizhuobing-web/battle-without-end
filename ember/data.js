/* 万丈深渊：数据表。只放数据，不放逻辑。
   玩法结构（v6）：每波先拉 3×3 的拨盘，连成线才召来帮手；帮手可以互相吸收升级、继承印记；灯油在铺子买全队加成；然后全队自动守一波。 */
(function (G) {
  /* 兵种。line：front 前排（靠右，先接敌）、back 后排。数值是 1 级的，每升一级生命和攻击各 +45%（不封顶）。 */
  const UNITS = {
    shield: { name: "盾手", line: "front", hp: 110, atk: 3, cd: 1.1, range: 10, note: "站最前，血厚，挡路" },
    spear: { name: "矛手", line: "front", hp: 55, atk: 7, cd: 0.8, range: 15, note: "站前排，捅最近的敌人" },
    hound: { name: "驯鬣", line: "front", hp: 40, atk: 4, cd: 0.45, range: 10, spd: 60, note: "冲上去咬，出手很快" },
    bow: { name: "弩手", line: "back", hp: 26, atk: 9, cd: 1.1, range: 125, note: "站后排，射最近的敌人，够得着飞的" },
    fire: { name: "炉工", line: "back", hp: 26, atk: 5, cd: 1.4, range: 100, splash: 14, note: "扔火罐，烧一小片" },
    drum: { name: "鼓手", line: "back", hp: 26, atk: 0, cd: 5, range: 0, heal: 6, note: "每 5 秒给全队回血" },
    relic: { name: "古件卫", line: "front", hp: 260, atk: 16, cd: 0.9, range: 16, splash: 12, note: "九格全中才会醒来的旧机关" },
  };
  /* 5 级晋升：二选一。每个分支只改一样东西。 */
  const SUBS = {
    shield: [{ id: "wall", name: "壁垒", note: "生命再 +60%" }, { id: "thorn", name: "荆盾", note: "挨打时把一半伤害弹回去" }],
    spear: [{ id: "pike", name: "长戟", note: "一下捅穿两个敌人" }, { id: "rush", name: "突击", note: "出手快 50%" }],
    hound: [{ id: "alpha", name: "头鬣", note: "每第三口咬出三倍伤害" }, { id: "pack", name: "群鬣", note: "开打时多带一只同级的" }],
    bow: [{ id: "heavy", name: "重弩", note: "伤害翻倍，出手慢三成" }, { id: "twin", name: "连弩", note: "每次射两箭" }],
    fire: [{ id: "blast", name: "烈炉", note: "烧的范围大一倍" }, { id: "oil", name: "燃油", note: "被烧到的敌人持续掉血 3 秒" }],
    drum: [{ id: "war", name: "战鼓", note: "不再回血，改成全队出手快 25%" }, { id: "medic", name: "药师", note: "回血量翻倍" }],
  };
  /* 拨盘上的符号。开局只有前四种，后两种在聚落解锁。joker 是百搭。 */
  const SYMBOLS = ["shield", "spear", "bow", "fire", "hound", "drum"];
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  /* 核心：第 5 次拉拨盘给第一个，之后每 10 次给一个，三选一，最多带 8 个。整局生效。纯加属性的不放这里，归铺子。 */
  const CORES = {
    ledger: { name: "连账", note: "中线的格子会清掉再补一次，可能再中" },
    push: { name: "活轴", note: "每波可以多推一次" },
    cheap: { name: "省油", note: "每次拉拨盘便宜 3 个能核" },
    camp: { name: "扩营", note: "队伍上限 +1" },
    back: { name: "回手", note: "每波第一次拉拨盘没中，这次不收能核" },
    lend: { name: "借力", note: "每波第一次吸收之后，下一次拉拨盘半价" },
    bounty: { name: "猎核钩", note: "杀敌掉的能核 +50%" },
    wild: { name: "百搭签", note: "百搭符号常见三倍" },
    drill: { name: "老兵", note: "新召来的帮手直接 2 级" },
    mend: { name: "补给", note: "每守住一波，回一条命（最多回到上限）" },
  };

  /* 印记：吸收时按被吃掉的兵种得到一枚，最多三阶。v 是一、二、三阶的数值。古件卫没有印记。 */
  const TIER = ["", "I", "II", "III"];
  const IMPRINTS = {
    shield: { name: "厚甲", v: [0.2, 0.4, 0.6], note: "生命 +20% / 40% / 60%" },
    spear: { name: "透甲", v: [0.3, 0.5, 0.7], note: "普攻多打穿 1 个敌人，造成 30% / 50% / 70% 伤害" },
    bow: { name: "追射", v: [0.2, 0.35, 0.5], note: "每次出手有 20% / 35% / 50% 机会再打一下" },
    fire: { name: "余火", v: [0.1, 0.2, 0.3], note: "普攻让目标烧 3 秒，每秒掉攻击力的 10% / 20% / 30%" },
    hound: { name: "急性", v: [0.12, 0.24, 0.36], note: "出手快 12% / 24% / 36%" },
    drum: { name: "自愈", v: [0.06, 0.12, 0.18], note: "每 6 秒回自己 6% / 12% / 18% 的最大生命" },
  };
  /* 天生特性：每个新召来的帮手随机带一条。跟着帮手走，被吸收就没了。 */
  const TRAITS = {
    bone: { name: "硬骨", note: "生命 +15%" },
    edge: { name: "利刃", note: "攻击 +15%" },
    quick: { name: "快手", note: "出手快 10%" },
    scav: { name: "拾荒", note: "它杀的敌人多掉 1 个能核" },
    first: { name: "先手", note: "开战第一下伤害翻倍" },
    reap: { name: "收割", note: "打生命低于一半的敌人，伤害 +20%" },
    gate: { name: "守门", note: "只剩 2 条命以下时，攻击 +25%" },
    tough: { name: "结实", note: "开战带 20% 生命的护盾" },
  };
  /* 铺子里的货：花灯油买，全队生效，同一件可以再买来升级。 */
  const ITEMS = {
    whet: { name: "磨刀石", note: "全队攻击 +8% / 级" },
    door: { name: "门板", note: "开战时全队得到 10% / 级最大生命的护盾" },
    salve: { name: "药包", note: "每场一次：第一个生命掉到 30% 以下的队友，立刻回 20% + 10% × 级的最大生命" },
    boots: { name: "快靴", note: "全队出手快 6% / 级" },
    rug: { name: "厚毯", note: "全队生命 +10% / 级" },
  };

  /* 敌人：hp 生命，atk 攻击，cd 出手间隔，spd 每秒走多少像素，range 攻击距离，core 掉的能核。fly 飞行，越过前排直扑最后面的人。 */
  const ENEMIES = {
    frostRat: { name: "冻鼠", hp: 20, atk: 5, cd: 0.9, spd: 34, range: 9, core: 1 },
    chorusBat: { name: "群鸣蝠", hp: 14, atk: 5, cd: 0.8, spd: 48, range: 8, core: 1, fly: 1 },
    whiteHyena: { name: "白鬣", hp: 120, atk: 14, cd: 1.1, spd: 20, range: 12, core: 4, big: 1, lunge: 1 },
    hyenaMatron: { name: "老鬣首", hp: 1300, atk: 24, cd: 1.2, spd: 12, range: 16, core: 30, big: 1, boss: 1 },
  };
  /* 十波。kind：judge 审判波、boss 首领波，这两种漏一个就输；其余的波漏一个扣一条命。敌人每过一波变强多少见 RULES.waveGrow / lateGrow。 */
  const WAVES = [
    { foes: [["frostRat", 4]] },
    { foes: [["frostRat", 7]] },
    { foes: [["whiteHyena", 1], ["frostRat", 4]] },
    { foes: [["frostRat", 8], ["chorusBat", 4]] },
    { kind: "judge", foes: [["whiteHyena", 3], ["frostRat", 10]] },
    { foes: [["chorusBat", 8], ["frostRat", 8]] },
    { foes: [["whiteHyena", 3], ["chorusBat", 5]] },
    { foes: [["frostRat", 16], ["whiteHyena", 2]] },
    { foes: [["whiteHyena", 4], ["chorusBat", 8], ["frostRat", 6]] },
    { kind: "boss", foes: [["hyenaMatron", 1], ["frostRat", 8], ["chorusBat", 6]] },
  ];

  const RULES = {
    startCores: 45, spinBase: 10, spinStep: 5, spinsPerWave: 6, // 每波第一次拉 10 能核，之后每次贵 5，一波最多 6 次
    cap: 5, hearts: 5, nudges: 1, jokerRate: 0.04, promoteAt: 5, lvGrow: 0.45,
    coreFirst: 5, coreEvery: 10, coreMax: 8, // 第 5 次拉拨盘给第一个核心，之后每 10 次一个，最多 8 个
    waveBonus: 14, // 守住一波的能核
    waveGrow: 0.26, lateGrow: 0.68, // 每过一波敌人生命和攻击 +26%；过了审判波，每波再多 +68%
    oilWave: 1, oilBig: 3, // 守住一波 1 灯油；审判波和首领波再 +3
    itemCost: 2, itemMax: 5, rerollCost: 1, // 铺子：每件 2 灯油，最高 5 级；重摆、重抽核心各 1 灯油
    slot3At: 12, // 印记格：1 格，晋升后 2 格，12 级起 3 格
  };
  /* 聚落里的永久升级，花余烬（每局结束都会得到，输了也有）。 */
  const META = {
    cap: { name: "加一顶帐篷", note: "队伍上限 +1", cost: 30, max: 3 },
    purse: { name: "多带些能核", note: "开局能核 +15", cost: 20, max: 3 },
    heart: { name: "加固门栅", note: "多一条命", cost: 40, max: 2 },
    hound: { name: "驯一窝鬣", note: "拨盘里多出「驯鬣」", cost: 25, max: 1 },
    drum: { name: "请来鼓手", note: "拨盘里多出「鼓手」", cost: 25, max: 1 },
  };

  G.EmberData = { UNITS, SUBS, SYMBOLS, LINES, CORES, IMPRINTS, TIER, TRAITS, ITEMS, ENEMIES, WAVES, RULES, META };
})(typeof globalThis !== "undefined" ? globalThis : window);

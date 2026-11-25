/* 万丈深渊：数据表。只放数据，不放逻辑。
   玩法结构（v5）：每波先拉 3×3 的拨盘，连成线才召来帮手；帮手可以互相吸收升级；然后全队自动守一波。 */
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

  /* 核心：每拉满 5 次拨盘，三选一。整局生效。 */
  const CORES = {
    ledger: { name: "连账", note: "中线的格子会清掉再补一次，可能再中" },
    push: { name: "活轴", note: "每波可以多推一次" },
    cheap: { name: "省油", note: "每次拉拨盘便宜 3 个能核" },
    camp: { name: "扩营", note: "队伍上限 +1" },
    war: { name: "战旗", note: "全队攻击 +25%" },
    wall: { name: "厚盾", note: "前排生命 +50%" },
    swift: { name: "快弦", note: "后排出手快 25%" },
    bounty: { name: "猎核钩", note: "杀敌掉的能核 +50%" },
    wild: { name: "百搭签", note: "百搭符号常见三倍" },
    drill: { name: "老兵", note: "新召来的帮手直接 2 级" },
    mend: { name: "补给", note: "每守住一波，回一条命（最多回到上限）" },
  };

  /* 敌人：hp 生命，atk 攻击，cd 出手间隔，spd 每秒走多少像素，range 攻击距离，core 掉的能核。fly 飞行，越过前排直扑最后面的人。 */
  const ENEMIES = {
    frostRat: { name: "冻鼠", hp: 20, atk: 5, cd: 0.9, spd: 34, range: 9, core: 1 },
    chorusBat: { name: "群鸣蝠", hp: 14, atk: 5, cd: 0.8, spd: 48, range: 8, core: 1, fly: 1 },
    whiteHyena: { name: "白鬣", hp: 120, atk: 14, cd: 1.1, spd: 20, range: 12, core: 4, big: 1, lunge: 1 },
    hyenaMatron: { name: "老鬣首", hp: 1300, atk: 24, cd: 1.2, spd: 12, range: 16, core: 30, big: 1, boss: 1 },
  };
  /* 十波。kind：judge 审判波、boss 首领波，这两种漏一个就输；其余的波漏一个扣一条命。每过一波敌人生命和攻击 +24%。 */
  const WAVES = [
    { foes: [["frostRat", 4]] },
    { foes: [["frostRat", 7]] },
    { foes: [["whiteHyena", 1], ["frostRat", 4]] },
    { foes: [["frostRat", 8], ["chorusBat", 4]] },
    { kind: "judge", foes: [["whiteHyena", 2], ["frostRat", 8]] },
    { foes: [["chorusBat", 8], ["frostRat", 8]] },
    { foes: [["whiteHyena", 3], ["chorusBat", 5]] },
    { foes: [["frostRat", 16], ["whiteHyena", 2]] },
    { foes: [["whiteHyena", 4], ["chorusBat", 8], ["frostRat", 6]] },
    { kind: "boss", foes: [["hyenaMatron", 1], ["frostRat", 8], ["chorusBat", 6]] },
  ];

  const RULES = {
    startCores: 45, spinBase: 10, spinStep: 5, spinsPerWave: 6, // 每波第一次拉 10 能核，之后每次贵 5，一波最多 6 次
    cap: 5, hearts: 5, nudges: 1, jokerRate: 0.04, coreEvery: 5, promoteAt: 5, lvGrow: 0.45,
    waveBonus: 14, // 守住一波的能核
  };
  /* 聚落里的永久升级，花余烬（每局结束都会得到，输了也有）。 */
  const META = {
    cap: { name: "加一顶帐篷", note: "队伍上限 +1", cost: 30, max: 3 },
    purse: { name: "多带些能核", note: "开局能核 +15", cost: 20, max: 3 },
    heart: { name: "加固门栅", note: "多一条命", cost: 40, max: 2 },
    hound: { name: "驯一窝鬣", note: "拨盘里多出「驯鬣」", cost: 25, max: 1 },
    drum: { name: "请来鼓手", note: "拨盘里多出「鼓手」", cost: 25, max: 1 },
  };

  G.EmberData = { UNITS, SUBS, SYMBOLS, LINES, CORES, ENEMIES, WAVES, RULES, META };
})(typeof globalThis !== "undefined" ? globalThis : window);

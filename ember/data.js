/* 万丈深渊：数据表。只放数据，不放逻辑。字段说明见 ember/docs/design.md。 */
(function (G) {
  const LAYERS = [
    { id: 1, name: "霜根廊", o2Step: 1, steps: 4, mat: "frostSinew", enemies: ["whiteHyena", "frostRat"], boss: "hyenaMatron", special: "frozen" },
    { id: 2, name: "回声井", o2Step: 2, steps: 5, mat: "plateBone", enemies: ["chorusBat", "cliffLizard"], boss: "wellWarden", special: "cliff" },
    { id: 3, name: "沸雾窟", o2Step: 2, steps: 4, mat: "redCore", enemies: ["mimicWorm", "emberMoth"], boss: "fumeTyrant", special: "fog" },
  ];

  /* 敌人：hp 生命，atk 攻击，core 能核掉落，n 一群的数量范围，trait 行为。每层的普通敌人只在该层出现。 */
  const ENEMIES = {
    frostRat: { name: "冻鼠群", hp: 20, atk: 6, core: 4, n: [3, 5], trait: "" },
    whiteHyena: { name: "白鬣", hp: 55, atk: 11, core: 8, n: [1, 2], trait: "ambush" },
    chorusBat: { name: "群鸣蝠", hp: 16, atk: 6, core: 4, n: [4, 7], trait: "track" },
    cliffLizard: { name: "攀壁蜥", hp: 36, atk: 9, core: 6, n: [2, 3], trait: "cling" },
    emberMoth: { name: "灼雾蛾", hp: 14, atk: 7, core: 5, n: [4, 7], trait: "" },
    mimicWorm: { name: "拟岩虫", hp: 95, atk: 14, core: 12, n: [1, 1], trait: "mimic" },
    hyenaMatron: { name: "老鬣首", hp: 180, atk: 11, core: 18, n: [1, 1], trait: "boss", drop: { frostSinew: 2 } },
    wellWarden: { name: "井口守兽", hp: 330, atk: 14, core: 28, n: [1, 1], trait: "boss", drop: { plateBone: 2, toughPlate: 2 } },
    fumeTyrant: { name: "雾窟巨兽", hp: 460, atk: 16, core: 40, n: [1, 1], trait: "boss", drop: { redCore: 1, heatWire: 2 } },
  };

  const MATS = {
    frostSinew: { name: "冻筋", w: 1 },
    plateBone: { name: "层甲骨", w: 1 },
    toughPlate: { name: "韧骨板", w: 2 },
    redCore: { name: "赤核", w: 1 },
    heatWire: { name: "导热丝", w: 1 },
  };

  /* 行装：主角只有一个人，穿哪套行装就是哪种打法。hp 生命，atk 攻击，arm 护甲，trait 自带特性，adv 关键进阶。 */
  const OUTFITS = {
    hunter: { name: "猎核装", hp: 120, atk: 14, arm: 3, trait: "追猎：只打最强的敌人；对大型敌人（生命 40 以上）伤害 +60%；敌人多于 2 个时伤害 -20%", good: "单个的大型敌人和据点首领", adv: { name: "定向破甲", need: { frostSinew: 3 } } },
    guard: { name: "护卫装", hp: 150, atk: 7, arm: 5, trait: "坚守：生命和护甲最高；每次被打都反击，伤害为攻击的 40%。出手慢，战斗拖得久，久战耗氧", good: "没把握的硬仗，和成群的敌人", adv: { name: "姿态切换", need: { plateBone: 2, frostSinew: 2 } } },
    stoker: { name: "御炉装", hp: 110, atk: 8, arm: 2, trait: "炉罐：每轮打全部敌人。出发时炉罐里有 4 份底火，烧完后每 2 轮烧 1 个随身能核；都没有时伤害只有四成", good: "成群的敌人，清得最快", adv: { name: "模式切换", need: { plateBone: 3 } } },
  };
  const STANCES = { counter: { name: "机动反击" }, cover: { name: "架盾" } };
  const MODES = { lance: { name: "投射" }, blanket: { name: "压制" }, plating: { name: "装甲" } };

  /* 配件：打怪掉落，带回聚落才算数，最多装 3 件。k 词条键，v 普通品质在第一层的数值，fit 最配的行装。
     词条键：atk hp arm 加法；o2 氧气上限；cap 负重上限；其余是百分比或点数，含义见 STATS。 */
  const ITEMS = {
    blade: { name: "猎刃", k: "atk", v: 10 },
    plate: { name: "骨甲片", k: "arm", v: 2 },
    felt: { name: "裹毡", k: "hp", v: 12 },
    filter: { name: "滤芯", k: "o2", v: 2 },
    strap: { name: "背带", k: "cap", v: 4 },
    awl: { name: "破甲锥", k: "hunt", v: 25, fit: "hunter" },
    nail: { name: "穿骨钉", k: "big", v: 20, fit: "hunter" },
    nozzle: { name: "散射嘴", k: "stoke", v: 25, fit: "stoker" },
    valve: { name: "节核阀", k: "fuel", v: 35, fit: "stoker" },
    barb: { name: "回击刺", k: "counter", v: 60, fit: "guard" },
    rim: { name: "盾缘", k: "block", v: 12, fit: "guard" },
    hook: { name: "猎核钩", k: "loot", v: 15 },
    salve: { name: "止血膏", k: "regen", v: 7 },
    sight: { name: "准星", k: "crit", v: 12 },
  };
  const STATS = {
    atk: ["攻击", "+", "%"], hp: ["生命", "+", "%"], arm: ["护甲", "+", ""], o2: ["氧气上限", "+", ""], cap: ["负重上限", "+", ""],
    hunt: ["穿猎核装时的伤害", "+", "%"], big: ["对大型敌人的伤害", "+", "%"], stoke: ["穿御炉装时的伤害", "+", "%"], fuel: ["烧能核时不消耗的机会", "", "%"],
    counter: ["反击伤害", "+", "%"], block: ["穿护卫装时受到的伤害", "-", "%"], loot: ["能核掉落", "+", "%"], regen: ["每场战斗后回复生命", "+", ""], crit: ["双倍伤害的机会", "", "%"],
  };
  const RARITY = [
    { name: "普通", mul: 1, salvage: 2 },
    { name: "精良", mul: 1.4, salvage: 5 },
    { name: "稀有", mul: 1.9, salvage: 10 },
  ];
  const EQUIP_SLOTS = 3, BAG = 12, ITEM_W = 1; // 同名配件只能装一件
  const PILOT = 4; // 御炉装出发时自带的底火
  const SPARE_W = 1; // 备用行装占的负重
  const ROUNDS_PER_O2 = 3; // 久战耗氧：每打 3 轮氧气 -1

  /* 技艺：首领首次击倒必掉一个，深层的普通敌人偶尔掉。最多带 2 个。 */
  const SKILLS = {
    spear: { name: "投矛", desc: "每 2 轮，对最强的敌人追加一击，伤害为攻击的 150%" },
    quake: { name: "震地", desc: "每 3 轮，对全部敌人造成攻击 120% 的伤害" },
    smoke: { name: "烟幕", desc: "每场战斗前 3 轮，受到的伤害 -50%" },
    aid: { name: "急救", desc: "每场战斗一次，生命低于 40% 时回复 35%" },
    brand: { name: "引燃", desc: "每轮，全部敌人受到攻击 40% 的灼烧" },
    still: { name: "屏息", desc: "久战不耗氧，每打赢一场氧气再 +1" },
  };
  const SKILL_SLOTS = 2;
  const BOSS_SKILL = { 1: "spear", 2: "smoke", 3: "quake" };

  /* 装备：每级占负重 w。 */
  const GEAR = {
    tank: { name: "氧罐", levels: [{ o2: 16, w: 2 }, { o2: 24, w: 3, cost: { core: 20 } }, { o2: 34, w: 4, cost: { core: 45, plateBone: 2 } }] },
    armor: { name: "护具", levels: [{ arm: 0, w: 0 }, { arm: 2, w: 2, cost: { core: 16, frostSinew: 2 } }, { arm: 4, w: 3, cost: { core: 40, toughPlate: 2 } }] },
    frame: { name: "背架", levels: [{ cap: 18, w: 1 }, { cap: 26, w: 1, cost: { core: 24 } }, { cap: 36, w: 2, cost: { core: 50, plateBone: 1 } }] },
  };

  /* 补给线三段。rate 为常规队伍每分钟能核产出。 */
  const ROUTE = [
    { layer: 1, need: { core: 45, frostSinew: 4 }, rate: 0.5 }, // 救了苇：能核 -15、冻筋 -2
    { layer: 2, need: { core: 90, plateBone: 3 }, rate: 1 },
    { layer: 3, need: { core: 140, redCore: 2, heatWire: 2 }, rate: 1.5 },
  ];

  const CORE_W = 0.5; // 每个能核点数占负重
  const HEARTH = { max: 10, start: 5, perDive: 1, fuelCost: 4 }; // 炉温；续燃一格需能核 fuelCost
  const IDLE_CAP_SEC = 8 * 3600;

  G.EmberData = { LAYERS, ENEMIES, MATS, OUTFITS, STANCES, MODES, ITEMS, STATS, RARITY, EQUIP_SLOTS, BAG, ITEM_W, PILOT, SPARE_W, ROUNDS_PER_O2, SKILLS, SKILL_SLOTS, BOSS_SKILL, GEAR, ROUTE, CORE_W, HEARTH, IDLE_CAP_SEC };
})(typeof globalThis !== "undefined" ? globalThis : window);

/* 万丈深渊：数据表。只放数据，不放逻辑。字段说明见 ember/docs/design.md。 */
(function (G) {
  const LAYERS = [
    { id: 1, name: "霜根廊", o2Step: 1, steps: 4, mat: "frostSinew", enemies: ["whiteHyena", "frostRat"], boss: "hyenaMatron", special: "frozen" },
    { id: 2, name: "回声井", o2Step: 2, steps: 5, mat: "plateBone", enemies: ["chorusBat", "frostRat"], boss: "wellWarden", special: "cliff" },
    { id: 3, name: "沸雾窟", o2Step: 2, steps: 4, mat: "redCore", enemies: ["mimicWorm", "chorusBat"], boss: "fumeTyrant", special: "fog" },
  ];

  /* 敌人：hp 生命，atk 攻击，core 碎核掉落，trait 行为。 */
  const ENEMIES = {
    frostRat: { name: "冻鼠群", hp: 18, atk: 8, core: 3, n: 3, trait: "" },
    whiteHyena: { name: "白鬣", hp: 45, atk: 14, core: 6, n: 1, trait: "ambush" },
    chorusBat: { name: "群鸣蝠", hp: 14, atk: 8, core: 3, n: 4, trait: "track" },
    mimicWorm: { name: "拟岩虫", hp: 80, atk: 17, core: 9, n: 1, trait: "mimic" },
    hyenaMatron: { name: "老鬣首", hp: 160, atk: 18, core: 14, n: 1, trait: "boss", drop: { frostSinew: 2 } },
    wellWarden: { name: "井口守兽", hp: 300, atk: 22, core: 22, n: 1, trait: "boss", drop: { plateBone: 2, toughPlate: 2 } },
    fumeTyrant: { name: "雾窟巨兽", hp: 420, atk: 26, core: 32, n: 1, trait: "boss", drop: { redCore: 1, heatWire: 2 } },
  };

  const MATS = {
    frostSinew: { name: "冻筋", w: 1 },
    plateBone: { name: "层甲骨", w: 1 },
    toughPlate: { name: "韧骨板", w: 2 },
    redCore: { name: "赤核", w: 1 },
    heatWire: { name: "导热丝", w: 1 },
  };

  /* 职业：hp 生命，atk 攻击，arm 护甲。adv 为关键进阶所需材料。 */
  const CLASSES = {
    hunter: { name: "猎核者", hp: 60, atk: 9, arm: 1, adv: { name: "定向破甲", need: { plateBone: 3 } } },
    guard: { name: "护卫者", hp: 90, atk: 5, arm: 4, adv: { name: "姿态切换", need: { toughPlate: 2, frostSinew: 2 } } },
    stoker: { name: "御炉者", hp: 55, atk: 7, arm: 1, adv: { name: "模式切换", need: { redCore: 1, heatWire: 2 } } },
  };
  const STANCES = { counter: { name: "机动反击" }, cover: { name: "展开掩护" } };
  const MODES = { lance: { name: "投射" }, blanket: { name: "压制" }, plating: { name: "装甲" } };

  /* 装备：每级占负重 w，效果 fx。 */
  const GEAR = {
    tank: { name: "氧罐", levels: [{ o2: 12, w: 2 }, { o2: 18, w: 3, cost: { core: 20 } }, { o2: 26, w: 4, cost: { core: 45, plateBone: 2 } }] },
    armor: { name: "护具", levels: [{ arm: 0, w: 0 }, { arm: 2, w: 2, cost: { core: 16, frostSinew: 2 } }, { arm: 4, w: 3, cost: { core: 40, plateBone: 2 } }] },
    frame: { name: "背架", levels: [{ cap: 14 }, { cap: 20, cost: { core: 24 } }, { cap: 28, cost: { core: 50, plateBone: 1 } }] },
  };

  /* 补给线三段。rate 为常规队伍每分钟能核产出。 */
  const ROUTE = [
    { layer: 1, need: { core: 30, frostSinew: 4 }, rate: 0.5 },
    { layer: 2, need: { core: 50, plateBone: 2 }, rate: 1 },
    { layer: 3, need: { core: 70, redCore: 2 }, rate: 1.5 },
  ];

  const CORE_W = 0.5; // 每个能核点数占负重
  const HEARTH = { max: 10, start: 5, perDive: 1, fuelCost: 4 }; // 炉温；续燃一格需能核 fuelCost
  const IDLE_CAP_SEC = 8 * 3600;

  G.EmberData = { LAYERS, ENEMIES, MATS, CLASSES, STANCES, MODES, GEAR, ROUTE, CORE_W, HEARTH, IDLE_CAP_SEC };
})(typeof globalThis !== "undefined" ? globalThis : window);

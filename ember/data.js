/* 万丈深渊：数据表。只放数据，不放逻辑。玩法见 ember/docs/design-v4.md。 */
(function (G) {
  /* 行装：你怎么打、一个大招、拨盘里什么出得多（bias 里的种类权重 ×3）。 */
  const OUTFITS = {
    hunter: { name: "猎核装", hp: 110, atk: 12, cd: 0.7, range: 150, note: "长枪，一次打一个，专挑最壮的。对大家伙伤害加倍", ult: "贯穿", ultNote: "一枪穿透整条线上的所有敌人", ultCd: 16, bias: ["crossbow", "torch"] },
    stoker: { name: "御炉装", hp: 95, atk: 6, cd: 0.3, range: 92, note: "喷火，烧到身前一片的所有敌人", ult: "倾炉", ultNote: "在身前留一片火，烧 4 秒", ultCd: 16, bias: ["blade", "wire"] },
  };

  /* 敌人：hp 生命，atk 攻击，cd 出手间隔，spd 每秒走多少像素，range 攻击距离，core 掉的能核，big 大家伙。 */
  const ENEMIES = {
    frostRat: { name: "冻鼠", hp: 14, atk: 4, cd: 0.9, spd: 34, range: 9, core: 1 },
    whiteHyena: { name: "白鬣", hp: 90, atk: 13, cd: 1.1, spd: 20, range: 12, core: 4, big: 1, lunge: 1 },
    hyenaMatron: { name: "老鬣首", hp: 1100, atk: 26, cd: 1.2, spd: 13, range: 16, core: 30, big: 1, boss: 1 },
  };

  /* 第一层十波。每项 [敌人, 数量]。每过一波，敌人的生命和攻击 +14%。 */
  const WAVES = [
    [["frostRat", 4]],
    [["frostRat", 7]],
    [["whiteHyena", 1], ["frostRat", 3]],
    [["frostRat", 11]],
    [["whiteHyena", 2], ["frostRat", 5]],
    [["frostRat", 15]],
    [["whiteHyena", 3], ["frostRat", 5]],
    [["frostRat", 12], ["whiteHyena", 2]],
    [["whiteHyena", 4], ["frostRat", 8]],
    [["hyenaMatron", 1], ["frostRat", 6]],
  ];

  /* 帮手：line 站位（front 前排、back 后排、fix 固定在路上）。数值是一星的，二星 ×1.8，三星 ×3。 */
  const UNITS = {
    spear: { name: "矛手", line: "front", hp: 40, atk: 5, cd: 0.8, range: 12, note: "站前排，捅最近的敌人" },
    shield: { name: "盾手", line: "front", hp: 110, atk: 2, cd: 1.2, range: 10, note: "站最前，血厚，挡住去路" },
    hound: { name: "驯鬣", line: "front", hp: 30, atk: 4, cd: 0.45, range: 10, spd: 60, note: "冲上去咬，出手很快" },
    crossbow: { name: "弩手", line: "back", hp: 22, atk: 8, cd: 1.1, range: 120, note: "站后排，射最近的敌人" },
    torch: { name: "投炬手", line: "back", hp: 22, atk: 4, cd: 1.5, range: 100, splash: 16, note: "扔火把，烧一小片" },
    snare: { name: "绊索", line: "fix", note: "铺在路上，最先踩到的几个敌人定住 2 秒" },
    lamp: { name: "旧炉灯", line: "fix", note: "立在身边，全队出手加快" },
    drum: { name: "鼓手", line: "back", hp: 22, atk: 0, cd: 5, range: 0, note: "每 5 秒给全队回一点血" },
  };
  /* 装备：穿在你身上。 */
  const GEAR = {
    blade: { name: "猎刃", note: "你的攻击 +30%" },
    felt: { name: "裹毡", note: "你的生命 +30%" },
    grip: { name: "快扣", note: "你出手快 20%" },
    wire: { name: "导热丝", note: "大招冷却短 20%" },
    horn: { name: "号角", note: "帮手的攻击 +25%" },
    hook: { name: "猎核钩", note: "掉的能核 +20%" },
  };
  /* 技艺：自动触发，最多两个。 */
  const SKILLS = {
    javelin: { name: "投矛", note: "每 3 秒朝最壮的敌人扔一支矛" },
    smoke: { name: "烟幕", note: "每波开头 3 秒，全队少挨一半打" },
    aid: { name: "急救", note: "每波一次，你快倒下时回一口血" },
  };
  const STAR = [0, 1, 1.8, 3]; // 星级倍率
  const BAG = 6, SKILL_SLOTS = 2;
  const SPIN_COST = 4; // 每波第一次免费，之后第 n 次加拉花 4×n 能核
  const UPGRADE = 25; // 升一级行装花 25 × 当前等级，生命和攻击各 +10%

  G.EmberData = { OUTFITS, ENEMIES, WAVES, UNITS, GEAR, SKILLS, STAR, BAG, SKILL_SLOTS, SPIN_COST, UPGRADE };
})(typeof globalThis !== "undefined" ? globalThis : window);

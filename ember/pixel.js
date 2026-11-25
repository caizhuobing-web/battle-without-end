/* 万丈深渊：像素渲染层。遵循 docs/art-bible.md：180×112 画布、统一色板、1 像素描边、手工三段明暗、无渐变无半透明。
   背景按层预渲染成可横向循环的一张图，走路时滚动；灯光暗角、环境粒子、人物和敌人逐帧叠加。 */
(function (G) {
  const W = 180, H = 112, FLOOR = 94;
  const PAL = {
    coal: "#0f0d12", night: "#1b1c24", iron: "#2b2d38", hi: "#4a4d5e", rust: "#3c3a46", frost: "#8b93a6", snow: "#e8ecf2",
    ember: "#ff8a3d", emberHi: "#ffc07a", hearth: "#c8442c", o2: "#6fd3e0", load: "#b08a5a", blood: "#e0505a",
    foe: "#7a6f80", foeD: "#4e4456", hunter: "#e8c45a", guard: "#7fa8d8", stoker: "#e0704a", wei: "#9ec07a", skin: "#d9a988",
  };
  const BANDS = {
    0: ["#2a2f3c", "#5a6274", "#c9d2de"],
    1: ["#14202c", "#25405a", "#5a8bb0"],
    2: ["#16141f", "#2c2840", "#5c5478"],
    3: ["#221418", "#4a2a28", "#8a5a3e"],
  };

  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  /* 派生色：两种色板色按固定比例混合。 */
  const mixh = (a, b, k) => hex([0, 1, 2].map((i) => rgb(a)[i] + (rgb(b)[i] - rgb(a)[i]) * k));
  const lite = (c) => mixh(c, PAL.snow, 0.4), dark = (c) => mixh(c, PAL.coal, 0.4);
  function mk(w, h) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    return cv;
  }
  function hash(n) {
    n = Math.imul((n | 0) ^ ((n | 0) >>> 13), 0x5bd1e995);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 13)) >>> 0) / 4294967296;
  }

  /* 字符串精灵：字母查色表，"." 透明。明暗由字母手工指定，这里只加 1 像素描边。
     返回 {cv 正常, fl 受击闪白}，尺寸比网格各大 2。 */
  function bake(rows, cmap, rim) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const at = (x, y) => (x >= 0 && y >= 0 && y < h && x < rows[y].length && rows[y][x] !== "." ? rows[y][x] : null);
    const cv = mk(w + 2, h + 2), fl = mk(w + 2, h + 2);
    const ca = cv.getContext("2d"), cb = fl.getContext("2d");
    for (let y = -1; y <= h; y++)
      for (let x = -1; x <= w; x++) {
        const k = at(x, y);
        if (!k) {
          if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
            ca.fillStyle = cb.fillStyle = rim || PAL.coal;
            ca.fillRect(x + 1, y + 1, 1, 1);
            cb.fillRect(x + 1, y + 1, 1, 1);
          }
          continue;
        }
        ca.fillStyle = cmap[k] || PAL.snow;
        ca.fillRect(x + 1, y + 1, 1, 1);
        cb.fillStyle = PAL.snow;
        cb.fillRect(x + 1, y + 1, 1, 1);
      }
    return { cv, fl, w: w + 2, h: h + 2 };
  }

  /* 小队。a 亮面 b 本色 c 暗面（职业色）；s 皮肤 C 眼睛；k 头发；g 裤 f 靴；w 亮金属 m 金属；o p 炉罐；E e 灯火。 */
  const TEAM = {
    hunter: [
      "...........w.",
      "....aab....w.",
      "...aabbc...m.",
      "...abbbc...m.",
      "...bsssc...m.",
      "...bsCsc...m.",
      "....sss....m.",
      "...aabbc..sm.",
      "..aabbbbccsm.",
      "..abbbbbc..m.",
      "..abbEbbc..m.",
      "..abbbbbc..m.",
      "...bbbbc...m.",
      "...gg.gg...m.",
      "...gg.gg...m.",
      "...gg.gg...m.",
      "...ff.ff...m.",
      "..fff.fff....",
    ],
    guard: [
      "....mmmm.....",
      "...mwwmmm....",
      "...mwmmmm....",
      "...mssCsm....",
      "....ssss.....",
      "..aabbbc.wwm.",
      ".aabbbbcwwmmm",
      ".abbbbbcwbbmm",
      ".abbbbbcwbbmm",
      ".abbbEbcwbbmm",
      "..bbbbbcwmmmm",
      "..bbbbbc.mmm.",
      "...gg.gg.mm..",
      "...gg.gg.....",
      "...gg.gg.....",
      "...ff.ff.....",
      "..fff.fff....",
    ],
    stoker: [
      ".E...........",
      ".p..kkkk.....",
      "opo.kkkkk....",
      "ooo.ssCs.....",
      "oEo.ssss.....",
      "ooo.aabbc....",
      "ooobabbbbc...",
      "opobabbbbcsmm",
      "ooo.abbbbc..e",
      ".p..abbbbc...",
      "....abbbbc...",
      ".....bbbb....",
      "....gg.gg....",
      "....gg.gg....",
      "....gg.gg....",
      "....ff.ff....",
      "...fff.fff...",
    ],
    wei: [
      "....kkkk.....",
      "...kkkkkk....",
      "...kssCsk....",
      "...kssssk....",
      "....sss.k....",
      "...aabbc.....",
      "..aabbbbc....",
      "..abbbbbc....",
      "..abbbbbc....",
      "..abbbbbc....",
      "..abbbbbc....",
      "...bbbbbc....",
      "...bbbbb.....",
      "....g.g......",
      "....g.g......",
      "...ff.ff.....",
    ],
  };
  function teamMap(col) {
    return { a: lite(col), b: col, c: dark(col), s: PAL.skin, C: PAL.coal, k: PAL.rust, g: mixh(PAL.frost, PAL.coal, 0.35), f: PAL.rust, w: PAL.snow, m: PAL.frost, o: PAL.frost, p: PAL.hi, E: PAL.ember, e: PAL.emberHi };
  }
  const TEAMC = { hunter: teamMap(PAL.hunter), guard: teamMap(PAL.guard), stoker: teamMap(PAL.stoker), wei: teamMap(PAL.wei) };

  /* 敌人，头朝左。l 亮面 x 本色 y 暗面 z 最暗；W 眼 T 牙 C 口。会飞的有两帧。 */
  const FOES = {
    frostRat: [
      "..l.l........",
      ".lxxxll......",
      "lxWxxxxxl....",
      "Txxxxxxxxxy..",
      ".yxxxxxxxyyyz",
      "..y.y..y.y...",
    ],
    whiteHyena: [
      "...l.l................",
      "..lxlxl......lll......",
      ".lxxxxxllllllxxxll....",
      "lxWxxxxxxxxxxxxxxxl...",
      "xxxxxxxxxxxxxxxxxxxl..",
      "TCTxxxxxxxxxxxxxxxxxy.",
      ".yyyxxxxxxxxxxxxxxxyyz",
      "...yxxxyyyyyyyxxxxy..z",
      "...xx.xy.....yx.xx....",
      "...xy.xy.....xy.xy....",
      "...y..y......y..y.....",
      "..yy.yy.....yy.yy.....",
    ],
    chorusBat: [
      ["l.........l", "xl..l.l..lx", "xxl.xxx.lxx", "yxxxWxWxxxy", ".yyxxTxxyy.", "....yxy...."],
      ["....l.l....", "...lxxxl...", ".llxWxWxll.", "lxxxxTxxxxl", "xyyyxxxyyyx", "y...yxy...y"],
    ],
    cliffLizard: [
      "..lll............",
      ".lxxxlllll.......",
      "lWxxxxxxxxlll....",
      "Txxxxxxxxxxxxll..",
      ".yyxxxxxxxxxxxxyy",
      "..x.yxxxxxxy.x.yz",
      ".xy..x....x..xy..",
      ".y...y....y..y...",
    ],
    emberMoth: [
      ["ll.....ll", "xxl...lxx", "xxxlxlxxx", ".yxxWxxy.", "..yxxxy..", "...yWy..."],
      [".........", "...lxl...", ".llxWxll.", "lxxxxxxxl", "xxyyxyyxx", "y..yWy..y"],
    ],
    mimicWorm: [
      ".....lllll........",
      "...llxxxxxll......",
      "..lxxxxxxxxxll....",
      ".lxxWxxxxWxxxxl...",
      ".lxxxxxxxxxxxxxl..",
      "lxxCCCCCCCCxxxxxl.",
      "lxCTCTCTCTCCxxxxxy",
      "xxxCCCCCCCCxxxxxyy",
      "yxxxxxxxxxxxxxxyyz",
      ".yyxxxxxxxxxxyyyz.",
      "..zzyyyyyyyyyzzz..",
    ],
    hyenaMatron: [
      "......l.l.l.l..................",
      ".....lxlxlxlxl.................",
      "..l.lxxxxxxxxxl.l.l............",
      ".lxlxxxxxxxxxxxlxlxl....ll.....",
      "lxxxxxxxxxxxxxxxxxxxllllxxl....",
      "xWWxxxxxxxxxxxxxxxxxxxxxxxxl...",
      "xWCxxxxxxxxxxxxxxxxxxxxxxxxxl..",
      "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxy.",
      "TCTCTxxxxxxxxxxxxxxxxxxxxxxxyyz",
      ".CCCCyxxxxxxxxxxxxxxxxxxxxxyy.z",
      "..yyyyxxxxxyyyyyyyyyxxxxxxyy..z",
      ".....xxxxxy.........yxxxxx.....",
      ".....xxyxxy.........xxyxxy.....",
      ".....xy.xy..........xy.xy......",
      ".....xy.xy..........xy.xy......",
      "....yyy.yyy........yyy.yyy.....",
    ],
    wellWarden: [
      "l..........................l",
      "xl........l....l..........lx",
      "xxl.......xl..lx.........lxx",
      "xxxl......xxllxx........lxxx",
      "xxxxl....lxxxxxxl......lxxxx",
      "xxxxxl..lxxxxxxxxl....lxxxxx",
      "xxxxxxllxxWWxxWWxxl..lxxxxxx",
      "yxxxxxxxxxWCxxCWxxxllxxxxxxy",
      ".yxxxxxxxxxxxxxxxxxxxxxxxxy.",
      ".yxxyxxxxxTCTCTCxxxxxxyxxxy.",
      "..yy.yxxxxCCCCCCxxxxxy.yyy..",
      "......yxxxxxxxxxxxxxy.......",
      ".......yxxxxxxxxxxxy........",
      "........yxxxxxxxxxy.........",
      "........yxxyyyyxxxy.........",
      ".........xxy..yxx...........",
      ".........xy....xy...........",
      "........yyy....yyy..........",
    ],
    fumeTyrant: [
      "...........l..l..l..............",
      "..........lxl.xl.xl.............",
      "........llxxxlxxlxxll...........",
      "......llxxxxxxxxxxxxxll.........",
      "....llxxxxxxxxxxxxxxxxxll.......",
      "...lxxxxxxxxxxxxxxxxxxxxxl......",
      "..lxxWWxxxxxxxxxxxxxxxxxxxl.....",
      ".lxxxWCxxxxxxxxxxxxxxxxxxxxl....",
      "lxxxxxxxxxxxxxxxxxxxxxxxxxxxl...",
      "xxCCCCCCCxxxxxxxxxxxxxxxxxxxxl..",
      "xCTCTCTCCxxxxxxxxxxxxxxxxxxxxxy.",
      "xxCCCCCCxxxxxxxxxxxxxxxxxxxxxxyz",
      "yxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyz",
      ".yyxxxxxxyyyyyyyyyyyxxxxxxxxyyz.",
      "...xxxxxy...........yxxxxxxy....",
      "...xxyxxy...........xxxyxxxy....",
      "...xy.xxy...........xy..xxy.....",
      "..yyy.yyy..........yyy..yyy.....",
    ],
  };
  const FOEC = { l: lite(PAL.foe), x: PAL.foe, y: PAL.foeD, z: dark(PAL.foeD), W: PAL.snow, T: PAL.frost, C: PAL.coal };
  const FLY = { chorusBat: 1, emberMoth: 1 };

  /* 节点与资源图标 8×8，平涂。 */
  const ICONS = {
    fight: ["X.....X.", ".X...X..", "..X.X...", "...X....", "..X.X...", ".X...X..", "XX...XX.", "........"],
    boss: ["X..X..X.", "XXXXXXX.", "X.XXX.X.", "XXXXXXX.", ".XX.XX..", ".XXXXX..", ".X.X.X..", "........"],
    crate: ["XXXXXXX.", "X..X..X.", "XXXXXXX.", "X..X..X.", "X..X..X.", "XXXXXXX.", "........", "........"],
    anchor: ["...X....", "..XXX...", "...X....", "...X....", "X..X..X.", ".X.X.X..", "..XXX...", "........"],
    spring: ["..X..X..", ".X..X...", "..X..X..", "........", "XXXXXXX.", ".XXXXX..", "..XXX...", "........"],
    cache: ["..XXX...", ".X...X..", "XXXXXXX.", "X..X..X.", "X.XXX.X.", "X.....X.", "XXXXXXX.", "........"],
    unknown: [".XXXX...", "X....X..", ".....X..", "...XX...", "...X....", "........", "...X....", "........"],
    core: ["...X....", "..XXX...", ".XXOXX..", "XXOOOXX.", ".XXOXX..", "..XXX...", "...X....", "........"],
    o2: ["..XXX...", ".X...X..", "X..X..X.", "X.XXX.X.", "X..X..X.", ".X...X..", "..XXX...", "........"],
    load: ["..XXX...", "..X.X...", "XXXXXXX.", "X.....X.", "X.....X.", "X.....X.", "XXXXXXX.", "........"],
    fire: ["...X....", "..XX.X..", ".XXX.X..", ".XXXXX..", "XXOOXXX.", "XXOOOXX.", ".XXXXX..", "........"],
  };
  const ICONC = { fight: PAL.blood, boss: PAL.blood, crate: PAL.frost, anchor: PAL.snow, spring: PAL.o2, cache: PAL.snow, unknown: PAL.frost, core: PAL.ember, o2: PAL.o2, load: PAL.load, fire: PAL.hearth };

  /* 3×5 像素数字。 */
  const DIG = {
    0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
    5: "111100111001111", 6: "111100111101111", 7: "111001001010010", 8: "111101111101111", 9: "111101111001111", "-": "000000111000000", "+": "000010111010000",
  };

  const cache = {};
  const get = (key, fn) => cache[key] || (cache[key] = fn());
  const teamSpr = (id) => get("t" + id, () => bake(TEAM[id], TEAMC[id]));
  function foeSpr(id, br, fr) {
    const rows = Array.isArray(FOES[id][0]) ? FOES[id][fr ? 1 : 0] : FOES[id];
    return get("f" + id + (br ? "b" : "") + (fr ? 1 : 0), () => bake(rows, FOEC, br ? PAL.hunter : null));
  }
  function iconCanvas(id, col) {
    return get("i" + id + (col || ""), () => {
      const rows = ICONS[id], cv = mk(8, 8), c = cv.getContext("2d");
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          const k = rows[y][x];
          if (k === ".") continue;
          c.fillStyle = k === "O" ? PAL.emberHi : col || ICONC[id];
          c.fillRect(x, y, 1, 1);
        }
      return cv;
    });
  }
  function iconURL(id, col) {
    return get("u" + id + (col || ""), () => {
      const src = iconCanvas(id, col), cv = mk(16, 16), c = cv.getContext("2d");
      c.imageSmoothingEnabled = false;
      c.drawImage(src, 0, 0, 16, 16);
      return cv.toDataURL();
    });
  }
  function num(c, str, x, y, col) {
    c.fillStyle = PAL.coal;
    c.fillRect(x - 1, y - 1, str.length * 4 + 1, 7);
    c.fillStyle = col;
    for (let i = 0; i < str.length; i++) {
      const g = DIG[str[i]];
      if (!g) continue;
      for (let p = 0; p < 15; p++) if (g[p] === "1") c.fillRect(x + i * 4 + (p % 3), y + ((p / 3) | 0), 1, 1);
    }
  }

  /* 可横向循环的画笔：每个矩形同时画在 x、x-W、x+W。 */
  function pen(c) {
    const r = (x, y, w, h, col) => {
      c.fillStyle = col;
      x = Math.round(x);
      y = Math.round(y);
      c.fillRect(x, y, w, h);
      if (x + w > W) c.fillRect(x - W, y, w, h);
      if (x < 0) c.fillRect(x + W, y, w, h);
    };
    const dith = (x, y, w, h, col, ph) => {
      for (let j = 0; j < h; j++) for (let i = (j + (ph || 0)) & 1; i < w; i += 2) r(x + i, y + j, 1, 1, col);
    };
    return { r, dith };
  }

  /* 远景：Foozle 的地下视差背景（CC0，见 CREDITS.md），灰度图按每层的三色重新上色。图没加载好时用程序画的剪影。 */
  let farImg = null;
  if (G.EmberAssets && typeof Image !== "undefined") {
    const im = new Image();
    im.onload = () => {
      farImg = im;
      for (const k in cache) if (k.startsWith("bg")) delete cache[k];
    };
    im.src = G.EmberAssets.caveFar;
  }
  const FARW = 256;
  function farBG(layer) {
    return get("far" + layer, () => {
      const cv = mk(FARW, H), c = cv.getContext("2d");
      c.drawImage(farImg, 0, 0);
      const img = c.getImageData(0, 0, FARW, H), px = img.data;
      const lv = [...new Set(Array.from({ length: px.length / 4 }, (_, i) => px[i * 4]))].sort((a, b) => a - b);
      const [d, m, l] = BANDS[layer];
      const ramp = [mixh(d, PAL.coal, 0.55), mixh(d, PAL.coal, 0.3), d, mixh(d, m, 0.2), mixh(d, m, 0.4), mixh(d, m, 0.75), mixh(m, l, 0.35)].map(rgb);
      for (let i = 0; i < px.length; i += 4) {
        const k = ramp[Math.min(ramp.length - 1, Math.round((lv.indexOf(px[i]) / Math.max(1, lv.length - 1)) * (ramp.length - 1)))];
        px[i] = k[0];
        px[i + 1] = k[1];
        px[i + 2] = k[2];
      }
      c.putImageData(img, 0, 0);
      return cv;
    });
  }

  /* 洞穴近景：顶、地面、旧补给线的桩和绳，再加每层自己的东西。repaired 为真时桩上亮灯。 */
  function caveBG(layer, repaired) {
    return get("bg" + layer + (repaired ? 1 : 0) + (farImg ? "f" : ""), () => {
      const cv = mk(W, H), c = cv.getContext("2d"), { r, dith } = pen(c);
      const [d, m, l] = BANDS[layer];
      const far = mixh(d, m, 0.45), deep = mixh(d, PAL.coal, 0.5), lo = mixh(m, l, 0.4);
      if (!farImg) r(0, 0, W, H, d);
      // 没有远景图时：程序画的石笋剪影
      for (let i = 0; i < (farImg ? 0 : 9); i++) {
        const x = Math.floor(hash(i * 71 + layer * 13) * W), bw = 8 + Math.floor(hash(i * 29 + layer) * 14), bh = 14 + Math.floor(hash(i * 43 + layer * 7) * 30);
        for (let k = 0; k < bh; k++) {
          const ww = Math.max(2, Math.round(bw * (0.35 + 0.65 * (k / bh))));
          r(x - ww / 2, FLOOR - bh + k, ww, 1, far);
        }
      }
      if (!farImg) dith(0, FLOOR - 8, W, 8, far, 0);
      // 顶：起伏的岩层，下沿一条亮线
      for (let x = 0; x < W; x += 3) {
        const h = 7 + Math.floor((hash(Math.floor(x / 3) * 7 + layer * 101) + hash(Math.floor(x / 9) * 3 + layer)) * 6);
        r(x, 0, 3, h, m);
        r(x, h, 3, 1, lo);
        r(x, 0, 3, 3, deep);
      }
      // 地面：亮沿、纹理、碎石
      r(0, FLOOR, W, H - FLOOR, m);
      r(0, FLOOR, W, 1, l);
      dith(0, FLOOR + 1, W, 1, lo, 0);
      r(0, FLOOR + 9, W, H - FLOOR - 9, mixh(m, d, 0.5));
      dith(0, FLOOR + 8, W, 2, mixh(m, d, 0.5), 1);
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(hash(i * 91 + layer * 3) * W), y = FLOOR + 3 + Math.floor(hash(i * 57 + layer) * 12);
        r(x, y, 2 + Math.floor(hash(i * 5) * 3), 1, hash(i * 11) < 0.5 ? d : lo);
      }
      if (layer === 1) {
        // 霜根廊：冰棱、冻住的根须、地上的冰晶
        for (let i = 0; i < 16; i++) {
          const x = Math.floor(hash(i * 31 + 4) * W), len = 5 + Math.floor(hash(i * 17) * 14);
          for (let k = 0; k < len; k++) r(x, 9 + k, k < len * 0.5 ? 3 : k < len - 2 ? 2 : 1, 1, k < 2 ? lo : l);
          r(x, 9, 1, Math.max(2, len - 4), PAL.snow);
        }
        for (let i = 0; i < 5; i++) {
          const x = Math.floor(hash(i * 53 + 5) * W);
          for (let k = 0; k < 44; k++) r(x + Math.round(Math.sin(k / 6 + i * 2) * 3), 12 + k, k % 9 === 4 ? 2 : 1, 1, lo);
        }
        for (let i = 0; i < 7; i++) {
          const x = Math.floor(hash(i * 67 + 9) * W), hgt = 3 + Math.floor(hash(i * 13 + 2) * 5);
          for (let k = 0; k < hgt; k++) r(x - (k >> 1), FLOOR - hgt + k, 1 + k, 1, l);
          r(x, FLOOR - hgt, 1, hgt, PAL.snow);
        }
      } else if (layer === 2) {
        // 回声井：竖向的岩层、岩架、垂下的旧绳、暗处的眼睛
        for (let i = 0; i < 8; i++) {
          const x = Math.floor(hash(i * 37 + 8) * W);
          r(x, 14, 1, FLOOR - 14, far);
          r(x + 1, 14 + Math.floor(hash(i * 3) * 30), 1, 20, lo);
        }
        for (let i = 0; i < 5; i++) {
          const x = Math.floor(hash(i * 83 + 1) * W), y = 30 + Math.floor(hash(i * 19) * 34), w2 = 12 + Math.floor(hash(i * 7) * 14);
          r(x, y, w2, 2, m);
          r(x, y, w2, 1, lo);
          dith(x + 1, y + 2, w2 - 2, 2, far, 0);
        }
        for (let i = 0; i < 3; i++) {
          const x = Math.floor(hash(i * 59 + 6) * W), len = 30 + Math.floor(hash(i * 23) * 40);
          for (let k = 0; k < len; k++) r(x + (k % 13 === 0 ? -1 : 0), 10 + k, k % 13 === 0 ? 3 : 1, 1, PAL.frost);
        }
        for (let i = 0; i < 4; i++) {
          const x = Math.floor(hash(i * 41 + 3) * W), y = 22 + Math.floor(hash(i * 97) * 30);
          r(x, y, 1, 1, PAL.frost);
          r(x + 2, y, 1, 1, PAL.frost);
        }
      } else if (layer === 3) {
        // 沸雾窟：矿物烟囱、地面的气孔和裂缝
        for (let i = 0; i < 6; i++) {
          const x = Math.floor(hash(i * 47 + 2) * W), hgt = 8 + Math.floor(hash(i * 61) * 16);
          for (let k = 0; k < hgt; k++) r(x - 2 - (k >> 3), FLOOR - hgt + k, 5 + (k >> 2), 1, k % 5 === 0 ? lo : m);
          r(x - 1, FLOOR - hgt, 3, 1, l);
          r(x, FLOOR - hgt - 1, 1, 1, lite(l));
        }
        for (let i = 0; i < 8; i++) {
          const x = Math.floor(hash(i * 73 + 7) * W), y = FLOOR + 4 + Math.floor(hash(i * 31) * 10);
          r(x, y, 5, 1, d);
          r(x + 1, y, 3, 1, l);
          r(x + 2, y, 1, 1, lite(l));
        }
      }
      // 旧补给线：每 45 像素一根桩，绳子垂在中间
      const rope = repaired ? PAL.frost : PAL.rust;
      for (let i = 0; i < 4; i++) {
        const x = 22 + i * 45;
        for (let k = 1; k < 45; k++) r(x + k, FLOOR - 13 + Math.round(5 * (1 - Math.pow((k - 22.5) / 22.5, 2))), 1, 1, rope);
        r(x, FLOOR - 15, 2, 15, PAL.rust);
        r(x, FLOOR - 15, 1, 15, PAL.hi);
        r(x - 1, FLOOR - 16, 4, 1, PAL.frost);
        if (repaired) {
          r(x, FLOOR - 19, 2, 3, PAL.ember);
          r(x, FLOOR - 18, 1, 1, PAL.emberHi);
        } else if (i % 2 === 0) {
          r(x - 1, FLOOR - 9, 1, 3, PAL.rust); // 断掉的绳头
        }
      }
      return cv;
    });
  }
  /* 灯光暗角：离小队越远越暗，用抖动点阵，不用半透明。 */
  function vignette() {
    return get("vig", () => {
      const cv = mk(W, H), c = cv.getContext("2d");
      c.fillStyle = PAL.coal;
      const cx = 46, cy = FLOOR - 12;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const dx = x - cx, dy = (y - cy) * 1.5, q = Math.sqrt(dx * dx + dy * dy);
          if (q > 150 ? (x + y) % 2 === 0 : q > 112 ? x % 2 === 0 && y % 2 === 0 : q > 84 ? x % 4 === (y % 4 === 0 ? 0 : 2) && y % 2 === 0 : false) c.fillRect(x, y, 1, 1);
        }
      return cv;
    });
  }

  /* 聚落：夜空、雪山、屋子、雪地、补给线入口。炉火与雪逐帧画。 */
  function townBG(hearth, route) {
    return get("town" + hearth + "_" + route, () => {
      const cv = mk(W, H), c = cv.getContext("2d");
      const r = (x, y, w, h, col) => {
        c.fillStyle = col;
        c.fillRect(Math.round(x), Math.round(y), w, h);
      };
      const [d, m, l] = BANDS[0];
      const sky2 = mixh(PAL.night, d, 0.5), roofSnow = l, wall = mixh(d, m, 0.45), wallD = mixh(d, PAL.coal, 0.3);
      r(0, 0, W, H, PAL.night);
      for (let y = 26; y < 52; y++) for (let x = (y & 1) * 2; x < W; x += y < 36 ? 4 : 2) r(x, y, 1, 1, sky2);
      r(0, 52, W, 20, sky2);
      for (let i = 0; i < 26; i++) r(Math.floor(hash(i * 97 + 1) * W), Math.floor(hash(i * 61 + 3) * 34), 1, 1, hash(i * 7) < 0.3 ? PAL.snow : PAL.frost);
      // 雪山
      for (let x = 0; x < W; x++) {
        const hgt = 14 + Math.round(10 * Math.abs(Math.sin(x / 23 + 1)) + 7 * Math.abs(Math.sin(x / 9 + 2)));
        r(x, 62 - hgt, 1, hgt, d);
        if (hgt > 22) r(x, 62 - hgt, 1, Math.min(4, hgt - 21), m);
      }
      // 屋子：越靠近炉火的先亮窗
      const order = [2, 3, 1, 4, 0];
      for (let i = 0; i < 5; i++) {
        const x = 6 + i * 35, bw = 24, bh = 15 + Math.floor(hash(i * 13 + 5) * 6), top = 70 - bh;
        r(x, top, bw, bh, wall);
        r(x + bw - 5, top, 5, bh, wallD);
        for (let k = 0; k < 8; k++) {
          r(x - 2 + k * 1.5, top - k - 1, bw + 4 - k * 3, 1, wallD);
          r(x - 2 + k * 1.5, top - k - 2, bw + 4 - k * 3, 1, roofSnow);
        }
        r(x + bw - 8, top - 12, 3, 7, wallD);
        r(x + bw - 9, top - 13, 5, 1, roofSnow);
        const lit = order.indexOf(i) < Math.ceil(hearth / 2);
        r(x + 4, top + 5, 5, 5, PAL.coal);
        r(x + 5, top + 6, 3, 3, lit ? PAL.emberHi : PAL.rust);
        if (lit) r(x + 5, top + 8, 3, 1, PAL.ember);
        r(x + 13, top + bh - 8, 5, 8, PAL.coal);
        r(x + 14, top + bh - 7, 3, 7, wallD);
      }
      // 雪地
      r(0, 70, W, H - 70, l);
      r(0, 70, W, 1, PAL.snow);
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(hash(i * 33 + 2) * W), y = 73 + Math.floor(hash(i * 71 + 4) * (H - 75));
        r(x, y, 3 + Math.floor(hash(i * 3) * 6), 1, hash(i * 9) < 0.6 ? m : PAL.snow);
      }
      for (let y = H - 12; y < H; y++) for (let x = y & 1; x < W; x += 2) r(x, y, 1, 1, m);
      // 补给线入口：一道木门架，修好一段亮一盏灯
      const gx = W - 30;
      r(gx, 58, 2, 24, PAL.rust);
      r(gx + 20, 58, 2, 24, PAL.rust);
      r(gx - 2, 56, 26, 2, PAL.rust);
      r(gx - 2, 55, 26, 1, roofSnow);
      r(gx + 3, 60, 16, 22, PAL.coal);
      for (let y = 60; y < 82; y++) for (let x = gx + 3 + (y & 1); x < gx + 19; x += 2) r(x, y, 1, 1, BANDS[1][0]);
      for (let i = 0; i < 3; i++) {
        r(gx + 3 + i * 7, 51, 3, 4, i < route ? PAL.ember : PAL.rust);
        if (i < route) r(gx + 4 + i * 7, 52, 1, 1, PAL.emberHi);
      }
      return cv;
    });
  }
  function drawHearth(c, s, t) {
    const cx = 84, by = 92, lv = s.hearth;
    // 火光映在雪地上：炉温越高范围越大
    const glow = mixh(BANDS[0][2], PAL.ember, 0.35), R = 6 + lv * 3;
    c.fillStyle = glow;
    for (let y = -6; y <= 8; y++)
      for (let x = -R; x <= R; x++) {
        const q = (x * x) / (R * R) + (y * y) / 49;
        if (q < 1 && (q < 0.45 || (x + y) % 2 === 0)) c.fillRect(cx + x, by + 4 + y, 1, 1);
      }
    // 石头火塘
    c.fillStyle = PAL.rust;
    c.fillRect(cx - 12, by, 24, 6);
    c.fillStyle = PAL.hi;
    c.fillRect(cx - 12, by, 24, 1);
    c.fillStyle = PAL.coal;
    for (let i = 0; i < 4; i++) c.fillRect(cx - 7 + i * 6, by + 1, 1, 5);
    c.fillRect(cx - 9, by - 1, 18, 1);
    // 火焰：高度是炉温的读数
    for (let k = 0; k < 8; k++) {
      const fh = Math.max(0, Math.round(lv * 2.2 * (1 - Math.abs(k - 3.5) / 5) + Math.sin(t * 9 + k * 1.7) * 1.3));
      for (let y = 0; y < fh; y++) {
        c.fillStyle = y < fh * 0.35 ? PAL.emberHi : y < fh * 0.75 ? PAL.ember : PAL.hearth;
        c.fillRect(cx - 8 + k * 2, by - 2 - y, 2, 1);
      }
    }
    // 火星
    c.fillStyle = PAL.emberHi;
    for (let i = 0; i < Math.min(6, lv); i++) {
      const ph = (t * 0.6 + i * 0.37) % 1;
      c.fillRect(cx - 6 + Math.round(hash(i * 5 + 1) * 12 + Math.sin(t * 2 + i) * 2), Math.round(by - 6 - ph * (10 + lv * 2)), 1, 1);
    }
    if (lv <= 0) {
      c.fillStyle = PAL.frost;
      c.fillRect(cx - 2, by - 5 - (Math.floor(t * 2) % 3), 1, 2);
      c.fillRect(cx + 3, by - 8 - (Math.floor(t * 2 + 1) % 3), 1, 2);
    }
  }
  function snow(c, t) {
    c.fillStyle = PAL.snow;
    for (let i = 0; i < 34; i++) {
      const sp = 5 + hash(i * 3) * 9;
      c.fillRect(Math.round((hash(i * 17) * W + Math.sin(t * 0.8 + i) * 4 + W) % W), Math.round((hash(i * 29) * H + t * sp) % H), 1, 1);
    }
  }
  function town(c, s, t) {
    // 炉火随行装等级变旺，亮窗随最好成绩变多
    const hearth = Math.min(10, 2 + s.lv), route = Math.min(3, Math.floor((s.best || 0) / 4));
    c.drawImage(townBG(hearth, route), 0, 0);
    drawHearth(c, { hearth }, t);
    const sp0 = teamSpr(s.wear);
    c.drawImage(sp0.cv, 58, 100 - sp0.h + (Math.floor(t * 1.5) % 2));
    snow(c, t);
  }

  /* 每层的环境粒子。 */
  function ambient(c, layer, t) {
    if (layer === 1) {
      c.fillStyle = PAL.snow;
      for (let i = 0; i < 10; i++) c.fillRect(Math.round((hash(i * 19) * W + Math.sin(t * 0.6 + i) * 5 + W) % W), Math.round(14 + ((hash(i * 23) * 70 + t * (2 + hash(i) * 3)) % 76)), 1, 1);
    } else if (layer === 2) {
      c.fillStyle = BANDS[2][2];
      for (let i = 0; i < 5; i++) {
        const ph = (t * (0.5 + hash(i * 7) * 0.4) + hash(i * 13)) % 1;
        c.fillRect(Math.floor(hash(i * 31 + 2) * W), Math.round(14 + ph * ph * (FLOOR - 14)), 1, 2);
      }
    } else if (layer === 3) {
      const [, m, l] = BANDS[3];
      const off = Math.floor(t * 6);
      for (let j = 0; j < 10; j++) {
        c.fillStyle = j < 6 ? m : l;
        const y = 46 + j;
        for (let x = ((j + off) & 1) + ((off >> 1) % 4); x < W; x += j === 0 || j === 9 ? 4 : 2) c.fillRect(x, y, 1, 1);
      }
      c.fillStyle = lite(l);
      for (let i = 0; i < 8; i++) {
        const ph = (t * 0.5 + i * 0.29) % 1;
        c.fillRect(Math.round(hash(i * 47 + 2) * W + Math.sin(t * 2 + i) * 2), Math.round(FLOOR - ph * 34), 1, 1);
      }
    }
  }

  function bar(c, x, y, w, k, col) {
    c.fillStyle = PAL.coal;
    c.fillRect(x - 1, y - 1, w + 2, 4);
    c.fillStyle = PAL.rust;
    c.fillRect(x, y, w, 2);
    c.fillStyle = col;
    c.fillRect(x, y, Math.max(0, Math.round(w * Math.min(1, k))), 2);
  }

  /* 帮手：小一号的人和机关。a 亮面 b 本色 c 暗面（各自的标志色）；s 皮肤；m w 金属；g 裤；E e 火。 */
  const ALLY = {
    spear: ["......w", "..ss..m", "..ss..m", ".abbc.m", ".abbcsm", ".abbc.m", "..gg..m", "..g.g..", ".gg.gg."],
    shield: ["..mm...", ".mssm..", "..ss.ww", ".abbwmm", ".abbwbm", ".abbwmm", "..gg.m.", "..g.g..", ".gg.gg."],
    hound: ["........", "ll....l.", "lCxxxxxl", "Txxxxxxx", ".yxxxxy.", ".y.y.y.y"],
    crossbow: ["..ss...", "..ss...", ".abbc.w", ".abbsmm", ".abbc.w", "..gg...", "..g.g..", ".gg.gg."],
    torch: ["....E..", "..ss.e.", "..ss.m.", ".abbcs.", ".abbc..", ".abbc..", "..gg...", "..g.g..", ".gg.gg."],
    drum: ["..ss...", "..ss...", ".abbc..", ".abbmmm", ".abbmwm", "..ggmm.", "..g.g..", ".gg.gg."],
    lamp: [".mmm.", ".mEm.", ".mem.", ".mmm.", "..m..", "..m..", ".mmm."],
    snare: ["m.......m", "mwwwwwwwm", "m.......m"],
  };
  const ALLYC = { spear: PAL.hunter, shield: PAL.guard, crossbow: PAL.wei, torch: PAL.stoker, drum: PAL.snow };
  function allySpr(k) {
    return get("a" + k, () => {
      const col = ALLYC[k] || PAL.frost;
      return bake(ALLY[k], { a: lite(col), b: col, c: dark(col), s: PAL.skin, m: PAL.frost, w: PAL.snow, g: mixh(PAL.frost, PAL.coal, 0.35), E: PAL.ember, e: PAL.emberHi, l: lite(PAL.load), x: PAL.load, y: dark(PAL.load), C: PAL.coal, T: PAL.snow });
    });
  }
  /* 给拨盘和清单用的图标：帮手直接用它的精灵，装备和技艺用 8×8 图标。 */
  const GLYPH = {
    blade: ["......X.", ".....XX.", "....XX..", "...XX...", "X.XX....", ".XX.....", "X.X.....", "........"],
    felt: [".XXXXX..", "XXXXXXX.", "XX.X.XX.", "XXXXXXX.", "XXXXXXX.", ".XXXXX..", "........", "........"],
    grip: ["..XXX...", ".X...X..", ".X.X.X..", ".X..XX..", ".X...X..", "..XXX...", "........", "........"],
    wire: ["X.......", ".X..X...", "..XX.X..", "..X..X..", ".X..XX..", "...X..X.", "......X.", "........"],
    horn: ["......X.", "....XXX.", "XXXXXXX.", "XXXXXXX.", "....XXX.", "......X.", "........", "........"],
    hook: ["..XXX...", ".X...X..", ".....X..", "....X...", "...X....", "X..X....", ".XX.....", "........"],
    javelin: ["......XX", ".....XX.", "....X...", "...X....", "..X.....", ".X......", "X.......", "........"],
    smoke: ["..XX....", ".XXXX.X.", "XXXXXXXX", "XXXXXXX.", ".XXXXX..", "..X.XX..", "........", "........"],
    aid: ["...XX...", "...XX...", ".XXXXXX.", ".XXXXXX.", "...XX...", "...XX...", "........", "........"],
  };
  function glyphURL(it) {
    return get("g" + it.t + it.k, () => {
      const cv = mk(16, 16), c = cv.getContext("2d");
      c.imageSmoothingEnabled = false;
      if (it.t === "u") {
        const sp = allySpr(it.k), k = Math.min(16 / sp.w, 16 / sp.h) >= 2 ? 2 : 1;
        c.drawImage(sp.cv, Math.floor((16 - sp.w * k) / 2), Math.floor((16 - sp.h * k) / 2), sp.w * k, sp.h * k);
      } else {
        c.fillStyle = it.t === "g" ? PAL.snow : PAL.emberHi;
        const rows = GLYPH[it.k];
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (rows[y][x] === "X") c.fillRect(x * 2, y * 2, 2, 2);
      }
      return cv.toDataURL();
    });
  }

  const HX = G.EmberSim ? G.EmberSim.HERO_X : 16, GROUND = FLOOR + 3;
  /* 画一个站在地上的东西：x 是脚下的中点。 */
  function stand(c, sp, x, yOff, flash) {
    c.drawImage(flash ? sp.fl : sp.cv, Math.round(x - sp.w / 2), GROUND - sp.h + (yOff || 0));
  }

  /* view 由界面维护：{flash:{序号:到期时间}, fx:[{k,...,t0}], floats, shake, ultT}。 */
  function draw(c, s, view, t) {
    c.imageSmoothingEnabled = false;
    const shake = view.shake > 0 ? Math.round((hash((t * 60) | 0) - 0.5) * view.shake * 4) : 0;
    c.save();
    c.translate(shake, 0);
    const r = s.run;
    if (!r) {
      town(c, s, t);
      c.restore();
      return;
    }
    const bg = caveBG(1, false);
    if (farImg) c.drawImage(farBG(1), 0, 0);
    c.drawImage(bg, 0, 0);
    c.drawImage(vignette(), 0, 0);
    ambient(c, 1, t);
    const f = r.fight, D = G.EmberData;
    const bob = (i) => Math.floor(t * 1.5 + i * 0.7) % 2;
    // 路上的机关
    const has = (k) => r.items.find((x) => x.t === "u" && x.k === k);
    if (has("snare") && (!f || f.snare > 0)) stand(c, allySpr("snare"), G.EmberSim.SNARE_X, 0);
    if (has("lamp")) stand(c, allySpr("lamp"), HX + 12, 0);
    // 倾炉留下的火
    if (f && f.fire > 0) {
      for (let x = HX + 10; x < HX + 110; x++) {
        const hh = 2 + Math.floor(hash(x * 3 + Math.floor(t * 12)) * 5);
        for (let y = 0; y < hh; y++) if ((x + y) % 2 === 0) {
          c.fillStyle = y < 2 ? PAL.emberHi : PAL.ember;
          c.fillRect(x, GROUND - 1 - y, 1, 1);
        }
      }
    }
    if (f) {
      // 敌人在后，自己人在前
      f.ents.forEach((e, i) => {
        if (e.side !== 1 || e.hp <= 0) return;
        const sp = foeSpr(e.k, 0, 0);
        c.drawImage(view.flash[i] > t ? sp.fl : sp.cv, Math.round(e.x), GROUND - sp.h - (i % 3) * 2 + (e.stun > 0 ? 0 : bob(i)));
        if (D.ENEMIES[e.k].big) bar(c, Math.round(e.x) + 1, GROUND - sp.h - 5 - (i % 3) * 2, sp.w - 2, e.hp / e.max, PAL.blood);
      });
      f.ents.forEach((e, i) => {
        if (e.side !== 0 || e.hp <= 0) return;
        const sp = e.hero ? teamSpr(e.k) : allySpr(e.k);
        stand(c, sp, e.x, (i % 2) * 2 + bob(i), view.flash[i] > t);
        if (e.hero || e.hp < e.max) bar(c, Math.round(e.x - sp.w / 2) + 1, GROUND - sp.h - 4, sp.w - 2, e.hp / e.max, e.hero ? PAL.blood : PAL.wei);
      });
    } else {
      // 两波之间：队伍站在原地
      stand(c, teamSpr(r.wear), HX, bob(0));
      let nf = 0, nb = 0;
      for (const it of r.items) {
        if (it.t !== "u" || D.UNITS[it.k].line === "fix") continue;
        stand(c, allySpr(it.k), D.UNITS[it.k].line === "front" ? 74 - 9 * nf++ : 40 - 7 * nb++, bob(nf + nb));
      }
    }
    // 出手的效果
    for (const e of view.fx) {
      const age = t - e.t0;
      if (age < 0 || age > 0.25) continue;
      if (e.k === "shot") {
        c.fillStyle = PAL.snow;
        c.fillRect(HX + 6, GROUND - 10, Math.max(2, Math.round(e.x - HX - 4)), 1);
        c.fillStyle = PAL.hunter;
        c.fillRect(Math.round(e.x), GROUND - 11, 3, 3);
      } else if (e.k === "flame") {
        const R0 = D.OUTFITS.stoker.range;
        for (let i = 0; i < R0 - 8; i++) {
          const hh = 1 + Math.round((i / R0) * 6);
          for (let j = -hh; j <= hh; j++) if ((i + j + Math.floor(t * 30)) % 2 === 0) {
            c.fillStyle = Math.abs(j) < hh / 2 ? PAL.emberHi : i % 3 ? PAL.ember : PAL.hearth;
            c.fillRect(HX + 8 + i, GROUND - 9 + j, 1, 1);
          }
        }
      } else if (e.k === "bolt") {
        c.fillStyle = PAL.snow;
        const x = e.x0 + (e.x - e.x0) * Math.min(1, age / 0.12);
        c.fillRect(Math.round(x), GROUND - 8, 4, 1);
      } else if (e.k === "lob" || e.k === "jav") {
        const k = Math.min(1, age / 0.22), x0 = e.k === "jav" ? HX : e.x0, x = x0 + (e.x - x0) * k, y = GROUND - 8 - Math.sin(k * Math.PI) * (e.k === "jav" ? 14 : 22);
        c.fillStyle = e.k === "jav" ? PAL.snow : PAL.ember;
        c.fillRect(Math.round(x), Math.round(y), e.k === "jav" ? 5 : 2, e.k === "jav" ? 1 : 2);
      } else if (e.k === "die") {
        c.fillStyle = e.side ? PAL.foe : PAL.frost;
        for (let i = 0; i < 6; i++) c.fillRect(Math.round(e.x + 4 + Math.cos(i * 1.05) * age * 40), Math.round(GROUND - 6 + Math.sin(i * 1.05) * age * 30), 1, 1);
      } else if (e.k === "heal") {
        c.fillStyle = PAL.wei;
        c.fillRect(Math.round(e.x) - 1, Math.round(GROUND - 22 - age * 20), 3, 1);
        c.fillRect(Math.round(e.x), Math.round(GROUND - 23 - age * 20), 1, 3);
      } else if (e.k === "snare") {
        c.fillStyle = PAL.snow;
        c.fillRect(Math.round(e.x) - 2, GROUND - 2, 10, 1);
      }
    }
    // 大招：猎核装是一道贯穿全屏的亮线
    if (view.ultT > t && view.ultWear === "hunter") {
      c.fillStyle = PAL.emberHi;
      c.fillRect(HX + 6, GROUND - 11, W, 3);
      c.fillStyle = PAL.snow;
      c.fillRect(HX + 6, GROUND - 10, W, 1);
    }
    // 伤害数字：只显示大的，免得满屏都是
    for (const fl of view.floats) {
      const age = t - fl.t0;
      if (age < 0 || age > 0.7) continue;
      num(c, fl.s, Math.round(fl.x), Math.round(fl.y - age * 16), fl.c);
    }
    c.restore();
  }

  G.EmberPixel = { W, H, PAL, draw, iconURL, glyphURL };
})(typeof globalThis !== "undefined" ? globalThis : window);

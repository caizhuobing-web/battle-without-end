/* 万丈深渊：像素渲染层。遵循 docs/art-bible.md：144×96 画布、统一色板、1 像素描边、左上打光三段明暗、无渐变无半透明。 */
(function (G) {
  const W = 144, H = 96, FLOOR = 84;
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
  const mix = (a, b, k) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k));
  const COAL = rgb(PAL.coal), SNOW = rgb(PAL.snow);
  function mk(w, h) {
    const cv = typeof document !== "undefined" ? document.createElement("canvas") : null;
    cv.width = w;
    cv.height = h;
    return cv;
  }

  /* 字符串精灵：字母查色表，"." 透明。自动加 1 像素煤色描边和左上打光三段明暗。
     返回 {cv 正常, fl 受击闪白}，尺寸比网格各大 2。 */
  function bake(rows, cmap) {
    const h = rows.length, w = rows[0].length;
    const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== "." ? rows[y][x] : null);
    const cv = mk(w + 2, h + 2), fl = mk(w + 2, h + 2);
    const ca = cv.getContext("2d"), cb = fl.getContext("2d");
    const A = ca.createImageData(w + 2, h + 2), B = cb.createImageData(w + 2, h + 2);
    const put = (img, x, y, c) => {
      const i = ((y + 1) * (w + 2) + x + 1) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = 255;
    };
    for (let y = -1; y <= h; y++)
      for (let x = -1; x <= w; x++) {
        const k = at(x, y);
        if (!k) {
          if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
            put(A, x, y, COAL);
            put(B, x, y, COAL);
          }
          continue;
        }
        const base = rgb(cmap[k] || PAL.snow);
        let c = base;
        if (!/[A-Z]/.test(k)) {
          if (!at(x - 1, y) || !at(x, y - 1)) c = mix(base, SNOW, 0.35);
          else if (!at(x + 1, y) || !at(x, y + 1)) c = mix(base, COAL, 0.4);
        }
        put(A, x, y, c);
        put(B, x, y, SNOW);
      }
    ca.putImageData(A, 0, 0);
    cb.putImageData(B, 0, 0);
    return { cv, fl, w: w + 2, h: h + 2 };
  }
  const flip = (rows) => rows.map((r) => r.split("").reverse().join(""));

  /* 小写字母参与明暗，大写字母是平涂（眼睛、灯、发光）。 */
  const TEAM = {
    hunter: [
      "..........W.",
      "....kk....w.",
      "...kkkk...w.",
      "...kssk...w.",
      "...ssss...w.",
      "....ss....w.",
      "...hhhh..sw.",
      "..hhhhhhhsw.",
      "..s.hhhh..w.",
      "....hhhE..w.",
      "....ggg...w.",
      "....g.g.....",
      "....g.g.....",
      "....g.g.....",
      "...gg.gg....",
    ],
    guard: [
      "............",
      "....kk......",
      "...kkkk.....",
      "...kssk.....",
      "...ssss.....",
      "....ss......",
      "..hhhhhmmm..",
      ".hhhhhhmhhm.",
      ".hhhhhhmhhm.",
      ".s.hhhhmhhm.",
      "...hhhEmhhm.",
      "...gg.gmmm..",
      "...gg.gg....",
      "...gg.gg....",
      "..ggg.ggg...",
    ],
    stoker: [
      "........E...",
      "....kk..o...",
      "...kkkk.o...",
      "...kssk.o...",
      "...ssss.oo..",
      "....ss.oooo.",
      "...hhhhoooo.",
      "..hhhhhoEoo.",
      "..s.hhhoooo.",
      "....hhhooo..",
      "....hhh.....",
      "....g.g.....",
      "....g.g.....",
      "....g.g.....",
      "...gg.gg....",
    ],
    wei: [
      "............",
      "....vv......",
      "...vvvv.....",
      "...vssv.....",
      "...ssss.....",
      "....ss......",
      "...vvvv.....",
      "..vvvvvv....",
      "..vvvvvv....",
      "..svvvvs....",
      "...vvvv.....",
      "...vvvv.....",
      "....g.g.....",
      "....g.g.....",
      "...gg.gg....",
    ],
  };
  const TEAMC = {
    hunter: { h: PAL.hunter, k: "#8a7434", s: PAL.skin, g: PAL.frost, w: PAL.snow, W: PAL.hunter, E: PAL.ember },
    guard: { h: PAL.guard, k: "#456080", s: PAL.skin, g: PAL.frost, m: PAL.snow, E: PAL.ember },
    stoker: { h: PAL.stoker, k: "#7a3a28", s: PAL.skin, g: PAL.frost, o: PAL.load, E: PAL.ember },
    wei: { v: PAL.wei, s: PAL.skin, g: PAL.frost },
  };

  const FOES = {
    frostRat: [
      "..........",
      "...xx.....",
      "..xxxxx...",
      ".xxxxxxxx.",
      "xWxxxxxxxx",
      ".xxxxxxxyy",
      "..y..y....",
    ],
    whiteHyena: [
      "..xx................",
      ".xxxx...............",
      "xWxxxxxxxxxxxxx.....",
      "xxxxxxxxxxxxxxxxx...",
      ".xxxxxxxxxxxxxxxxxx.",
      "...xxxxxxxxxxxxx..xx",
      "...y.y......y.y.....",
      "...y.y......y.y.....",
      "..yy.yy....yy.yy....",
    ],
    chorusBat: [
      "x.......x",
      "xx.x.x.xx",
      "xxxxxxxxx",
      ".xxWxWxx.",
      "..xxxxx..",
      "...y.y...",
    ],
    mimicWorm: [
      "....xxxxx.....",
      "..xxxxxxxxx...",
      ".xxxxxCxxxxx..",
      ".xxxxxxCxxxxx.",
      "xxxxxWCxWxxxxx",
      "xxxxxxCxxxxxxx",
      "xxxxxCxxxxxxxx",
      ".xxxxxxxxxxxx.",
      "..yyyyyyyyyy..",
    ],
    rock: [
      "....xxxxx.....",
      "..xxxxxxxxx...",
      ".xxxxxxxxxxx..",
      ".xxxxxxxxxxxx.",
      "xxxxxxxxxxxxxx",
      "xxxxxxxxxxxxxx",
      "xxxxxxxxxxxxxx",
      ".xxxxxxxxxxxx.",
      "..yyyyyyyyyy..",
    ],
  };
  const BOSS = { hyenaMatron: "whiteHyena", wellWarden: "chorusBat", fumeTyrant: "mimicWorm" };
  const FOEC = { x: PAL.foe, y: PAL.foeD, W: PAL.snow, C: PAL.coal };
  const BOSSC = { x: PAL.foe, y: PAL.foeD, W: PAL.snow, C: PAL.coal };

  /* 节点图标 8×8，平涂。 */
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
  const ICONC = { fight: PAL.blood, boss: PAL.hearth, crate: PAL.o2, anchor: PAL.snow, spring: PAL.o2, cache: PAL.load, unknown: PAL.frost, core: PAL.ember, o2: PAL.o2, load: PAL.load, fire: PAL.hearth };

  /* 3×5 像素数字。 */
  const DIG = {
    0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
    5: "111100111001111", 6: "111100111101111", 7: "111001001010010", 8: "111101111101111", 9: "111101111001111", "-": "000000111000000", "+": "000010111010000",
  };

  const cache = {};
  function get(key, fn) {
    return cache[key] || (cache[key] = fn());
  }
  const teamSpr = (id) => get("t" + id, () => bake(TEAM[id], TEAMC[id]));
  const foeSpr = (id, boss) => get("f" + id + boss, () => bake(flip(FOES[id]), boss ? BOSSC : FOEC));
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
  /* 给 <img> 用的放大图标。 */
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
    const w = str.length * 4;
    c.fillRect(x - 1, y - 1, w + 1, 7);
    c.fillStyle = col;
    for (let i = 0; i < str.length; i++) {
      const g = DIG[str[i]];
      if (!g) continue;
      for (let p = 0; p < 15; p++) if (g[p] === "1") c.fillRect(x + i * 4 + (p % 3), y + ((p / 3) | 0), 1, 1);
    }
  }
  function dither(c, x, y, w, h, col, phase) {
    c.fillStyle = col;
    for (let j = 0; j < h; j++) for (let i = (j + (phase || 0)) & 1; i < w; i += 2) c.fillRect(x + i, y + j, 1, 1);
  }
  /* 固定种子的伪随机，背景装饰每帧一致。 */
  function hash(n) {
    n = Math.imul(n ^ (n >>> 13), 0x5bd1e995);
    return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
  }

  function cave(c, layer) {
    const [d, m, l] = BANDS[layer];
    c.fillStyle = d;
    c.fillRect(0, 0, W, H);
    // 岩壁：上沿起伏
    c.fillStyle = m;
    for (let x = 0; x < W; x += 4) {
      const h = 6 + Math.floor(hash(x * 7 + layer) * 10);
      c.fillRect(x, 0, 4, h);
    }
    dither(c, 0, 16, W, 3, m, 0);
    // 地面
    c.fillStyle = m;
    c.fillRect(0, FLOOR, W, H - FLOOR);
    c.fillStyle = l;
    c.fillRect(0, FLOOR, W, 1);
    dither(c, 0, FLOOR + 3, W, 2, d, 1);
    if (layer === 1) {
      // 霜根廊：冰棱与冻住的根须
      c.fillStyle = l;
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(hash(i * 31) * W), len = 4 + Math.floor(hash(i * 17) * 10);
        for (let k = 0; k < len; k++) c.fillRect(x, 10 + k, k < len - 3 ? 2 : 1, 1);
      }
      c.fillStyle = m;
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(hash(i * 53 + 5) * W);
        for (let k = 0; k < 34; k++) c.fillRect(x + Math.round(Math.sin(k / 5 + i) * 2), 14 + k, 1, 1);
      }
    } else if (layer === 2) {
      // 回声井：纵向峭壁、垂下的旧绳
      c.fillStyle = m;
      for (let x = 6; x < W; x += 20) c.fillRect(x + Math.floor(hash(x) * 6), 18, 2, FLOOR - 18);
      c.fillStyle = l;
      c.fillRect(W - 40, 0, 1, FLOOR - 10);
      c.fillRect(W - 42, FLOOR - 10, 5, 2);
      dither(c, 66, FLOOR - 24, 30, 24, d, 0);
    } else if (layer === 3) {
      // 沸雾窟：低垂的雾带与热泉气孔
      dither(c, 0, 44, W, 10, m, 0);
      dither(c, 0, 54, W, 5, l, 1);
      c.fillStyle = PAL.hearth;
      for (let i = 0; i < 4; i++) c.fillRect(14 + i * 34, FLOOR, 3, 1);
    }
  }

  function town(c, s, t) {
    const [d, m, l] = BANDS[0];
    c.fillStyle = PAL.night;
    c.fillRect(0, 0, W, H);
    // 远处的雪原与屋子
    c.fillStyle = d;
    c.fillRect(0, 44, W, 24);
    // 雪：固定位置的雪点
    c.fillStyle = PAL.frost;
    for (let i = 0; i < 40; i++) c.fillRect(Math.floor(hash(i * 97) * W), Math.floor(hash(i * 61 + 3) * 44), 1, 1);
    for (let i = 0; i < 5; i++) {
      const x = 4 + i * 28, h = 10 + Math.floor(hash(i * 13) * 8);
      c.fillStyle = m;
      c.fillRect(x, 66 - h, 20, h);
      for (let k = 0; k < 11; k++) c.fillRect(x - 1 + k, 66 - h - k, 22 - k * 2, 1);
      // 亮着的窗：炉温越低，亮的窗越少
      c.fillStyle = i < s.hearth / 2 ? PAL.emberHi : PAL.coal;
      c.fillRect(x + 8, 66 - h + 4, 3, 3);
    }
    c.fillStyle = l;
    c.fillRect(0, 66, W, H - 66);
    dither(c, 0, 66, W, 3, m, 0);
    // 炉火：火焰高度是炉温的读数
    const cx = 72, by = 80;
    c.fillStyle = PAL.rust;
    c.fillRect(cx - 14, by, 28, 6);
    c.fillStyle = PAL.iron;
    c.fillRect(cx - 12, by + 1, 24, 4);
    const lv = s.hearth;
    for (let k = 0; k < 9; k++) {
      const fh = Math.max(0, Math.round(lv * 2.4 * (1 - Math.abs(k - 4) / 6) + Math.sin(t * 9 + k * 1.7) * 1.2));
      for (let y = 0; y < fh; y++) {
        c.fillStyle = y < fh * 0.4 ? PAL.emberHi : y < fh * 0.75 ? PAL.ember : PAL.hearth;
        c.fillRect(cx - 9 + k * 2, by - y, 2, 1);
      }
    }
    if (lv <= 0) {
      c.fillStyle = PAL.frost;
      c.fillRect(cx - 2, by - 6, 1, 3);
      c.fillRect(cx + 2, by - 9, 1, 3);
    }
    // 小队站在炉边
    const ids = ["hunter", "guard", "stoker"];
    ids.forEach((id, i) => {
      const sp = teamSpr(id);
      c.drawImage(sp.cv, [28, 44, 92][i], by + 8 - sp.h);
    });
    if (s.flags.wei) {
      const sp = teamSpr("wei");
      c.drawImage(sp.cv, 110, by + 8 - sp.h);
    }
    // 补给线方向的灯：修好一段亮一盏
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i < s.route ? PAL.ember : PAL.rust;
      c.fillRect(W - 24 + i * 7, 46, 3, 3);
    }
  }

  /* view：{fight:{fx,i}, flash:{}, floats:[], walk} 由界面维护。 */
  function draw(c, s, view, t) {
    c.imageSmoothingEnabled = false;
    const shake = view.shake > 0 ? Math.round((hash((t * 60) | 0) - 0.5) * view.shake * 4) : 0;
    c.save();
    c.translate(shake, 0);
    const fx = view.fight && view.fight.fx;
    if (!s.dive && !fx) {
      town(c, s, t);
      c.restore();
      return;
    }
    const layer = fx ? fx.layer : s.dive.layer;
    cave(c, layer);
    const frame = fx ? fx.frames[Math.min(view.fight.i, fx.frames.length - 1)] : null;
    const team = s.dive ? s.dive.team : null;
    const ids = ["hunter", "guard", "stoker"];
    const bob = view.walk > 0 ? (Math.floor(t * 8) & 1) : 0;
    ids.forEach((id, i) => {
      const sp = teamSpr(id);
      const hp = frame ? frame.t[i] : team ? team[i].hp : 1;
      const max = fx ? fx.max[i] : team ? team[i].max : 1;
      const x = 10 + i * 18, y = FLOOR - sp.h + 1 - (i === 1 ? 0 : bob);
      if (hp <= 0) {
        c.globalAlpha = 1;
        dither(c, x, FLOOR - 3, sp.w, 3, PAL.foeD, 0);
        return;
      }
      c.drawImage(view.flash && view.flash["t" + i] > t ? sp.fl : sp.cv, x, y);
      bar(c, x + 1, y - 4, sp.w - 2, hp / max, PAL.blood);
      // 头灯
      c.fillStyle = PAL.ember;
      c.fillRect(x + 5, y + 1, 1, 1);
    });
    if (s.dive && s.dive.event === "rescue") {
      const sp = teamSpr("wei");
      c.drawImage(sp.cv, 104, FLOOR - sp.h + 1);
      dither(c, 116, FLOOR - 6, 16, 6, PAL.frost, 0);
    }
    // 敌人
    const enc = s.dive && s.dive.enc;
    const eid = fx ? fx.e : enc ? enc.e : null;
    if (eid) {
      const E = G.EmberData.ENEMIES[eid];
      const boss = E.trait === "boss";
      const base = boss ? BOSS[eid] : eid;
      const sp = foeSpr(base, boss);
      const hps = frame ? frame.f : enc.foes.map((f) => f.hp);
      const br = frame ? frame.b : enc.foes.map((f) => (f.breached ? 1 : 0));
      const n = hps.length, sc = boss ? 2 : 1;
      for (let k = 0; k < n; k++) {
        if (hps[k] <= 0) continue;
        const col = k % 4, row = Math.floor(k / 4);
        const x = W - 16 - sp.w * sc - col * (sp.w * sc * 0.6 + 4) - row * 8;
        const y = FLOOR - sp.h * sc + 1 - row * 10 - (base === "chorusBat" ? 18 + ((k * 7) % 10) : 0);
        const img = view.flash && view.flash["f" + k] > t ? sp.fl : sp.cv;
        c.drawImage(img, x, y, sp.w * sc, sp.h * sc);
        if (br[k]) {
          c.fillStyle = PAL.hunter;
          c.fillRect(x, y - 1, sp.w * sc, 1);
        }
        bar(c, x + 1, y - 4, sp.w * sc - 2, hps[k] / (E.hp || 1), PAL.blood);
      }
    }
    // 飘字
    if (view.floats)
      for (const f of view.floats) {
        const age = t - f.t0;
        if (age < 0 || age > 0.8) continue;
        num(c, f.s, Math.round(f.x), Math.round(f.y - age * 14), f.c);
      }
    c.restore();
  }
  function bar(c, x, y, w, k, col) {
    c.fillStyle = PAL.coal;
    c.fillRect(x - 1, y - 1, w + 2, 4);
    c.fillStyle = PAL.iron;
    c.fillRect(x, y, w, 2);
    c.fillStyle = col;
    c.fillRect(x, y, Math.max(0, Math.round(w * Math.min(1, k))), 2);
  }
  /* 战斗回放中各单位的屏幕位置，给飘字用。 */
  function slot(kind, i, n, eid) {
    if (kind === "t") return { x: 14 + i * 18, y: FLOOR - 24 };
    const E = G.EmberData.ENEMIES[eid], boss = E.trait === "boss";
    const base = boss ? BOSS[eid] : eid, sp = foeSpr(base, boss), sc = boss ? 2 : 1;
    const col = i % 4, row = Math.floor(i / 4);
    return { x: W - 16 - sp.w * sc - col * (sp.w * sc * 0.6 + 4) - row * 8 + 4, y: FLOOR - sp.h * sc - row * 10 - (base === "chorusBat" ? 18 + ((i * 7) % 10) : 0) - 4 };
  }

  G.EmberPixel = { W, H, PAL, draw, iconURL, slot };
})(typeof globalThis !== "undefined" ? globalThis : window);

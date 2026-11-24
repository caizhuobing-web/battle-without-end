/* 万变之种：像素渲染层。遵循 docs/art-bible.md：192×192 画布、统一色板、1 像素描边、左上打光三段明暗、无渐变无半透明。 */
(function (G) {
  const D = G.EvoData, TAU = Math.PI * 2;
  const RES = 192, C = RES / 2, K = 0.64, DISH = 94;
  const PAL = {
    ink: "#120c1c", night: "#1f1730", plum: "#33254a", bruise: "#4b3a66", mist: "#8a7aa6", bone: "#f4ead2",
    dishD: "#123440", dish: "#1c4f57", dishL: "#2d7a72", amber: "#ffb347", coral: "#f0566a", rose: "#b8475f", pink: "#ff9aa8",
    sprout: "#8fd44a", fire: "#ff7a2e", volt: "#5fd8f5", frost: "#a9bcff", swarm: "#c58bff", shell: "#c9a04e",
  };
  const TAGC = { phys: PAL.bone, poison: PAL.sprout, fire: PAL.fire, light: PAL.volt, cold: PAL.frost, blood: PAL.coral, brood: PAL.swarm, armor: PAL.shell };

  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k));
  const INK = rgb(PAL.ink), BONE = rgb(PAL.bone), FROST = rgb(PAL.frost);
  const tri = (h) => {
    const b = rgb(h);
    return [mix(b, [255, 255, 255], 0.45), b, mix(b, INK, 0.42)];
  };
  function mk(w, h) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    return cv;
  }

  /* 精灵烘焙：先用纯色矢量画出各区域，再按透明度取阈值，统一加描边和明暗。
     区域色：红=身体 绿=附属物 品红=第二附属物 蓝=眼白 黄=瞳孔 青=发光核心 */
  function bake(S, paint, cols) {
    const src = mk(S, S), sc = src.getContext("2d");
    paint(sc);
    const d = sc.getImageData(0, 0, S, S).data, reg = new Uint8Array(S * S);
    for (let i = 0; i < S * S; i++) if (d[i * 4 + 3] >= 128) reg[i] = 1 + ((d[i * 4] > 127 ? 4 : 0) | (d[i * 4 + 1] > 127 ? 2 : 0) | (d[i * 4 + 2] > 127 ? 1 : 0));
    const at = (x, y) => (x >= 0 && y >= 0 && x < S && y < S ? reg[y * S + x] : 0);
    const T = { 5: tri(cols.body), 3: tri(cols.feat || cols.body), 6: tri(cols.feat2 || cols.body) };
    const flat = { 2: BONE, 7: INK, 4: rgb(cols.core || PAL.bone), 1: INK, 8: BONE };
    const deep = S >= 30;
    const outs = [mk(S, S), mk(S, S), mk(S, S)];
    const imgs = outs.map((o) => o.getContext("2d").createImageData(S, S));
    const put = (img, i, c) => {
      img.data[i * 4] = c[0];
      img.data[i * 4 + 1] = c[1];
      img.data[i * 4 + 2] = c[2];
      img.data[i * 4 + 3] = 255;
    };
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const i = y * S + x, r = reg[i];
        if (!r) {
          if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) for (const img of imgs) put(img, i, INK);
          continue;
        }
        let c;
        if (T[r]) {
          const lit = !at(x - 1, y - 1) || (deep && !at(x - 2, y - 2)), drk = !at(x + 1, y + 1) || (deep && !at(x + 2, y + 2));
          c = T[r][lit ? 0 : drk ? 2 : 1];
        } else c = flat[r];
        put(imgs[0], i, c);
        put(imgs[1], i, BONE);
        put(imgs[2], i, T[r] ? mix(c, FROST, 0.7) : c);
      }
    outs.forEach((o, k) => o.getContext("2d").putImageData(imgs[k], 0, 0));
    return { cv: outs[0], flash: outs[1], ice: outs[2], s: S };
  }

  const RED = "#ff0000", GRN = "#00ff00", MAG = "#ff00ff", BLU = "#0000ff", YEL = "#ffff00", CYN = "#00ffff", BLK = "#000000";
  function blob(c, R, ph, amp) {
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * TAU, rr = R * (1 + amp * Math.sin(a * 3 + ph) + amp * 0.6 * Math.sin(a * 5 - ph * 1.3));
      i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }
  function dot(c, x, y, r, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }

  /* 玩家生物：按系别决定轮廓语言，按阶数放大，亚种换色。 */
  function paintCreature(c, S, forms, ph) {
    const last = forms.length ? D.FORMS[forms[forms.length - 1]] : null, fam = last ? last.fam : "", tier = forms.length;
    const R = [6.5, 8, 9.5, 11][tier];
    c.translate(S / 2, S / 2);
    if (fam === "A") {
      const n = 5 + tier * 2;
      c.fillStyle = GRN;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU - Math.PI / 2, L = R * (1.5 + tier * 0.08) + Math.sin(ph + i * 2) * 0.6;
        c.beginPath();
        c.moveTo(Math.cos(a - 0.3) * R * 0.8, Math.sin(a - 0.3) * R * 0.8);
        c.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        c.lineTo(Math.cos(a + 0.3) * R * 0.8, Math.sin(a + 0.3) * R * 0.8);
        c.fill();
      }
    } else if (fam === "B") {
      const n = 5 + tier;
      c.strokeStyle = GRN;
      c.lineWidth = 2;
      c.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.3;
        c.beginPath();
        for (let k = 0; k <= 5; k++) {
          const dd = R * (0.8 + k * (0.17 + tier * 0.015)), aa = a + Math.sin(ph + i * 1.7 + k * 0.9) * 0.2 * (k / 5);
          k ? c.lineTo(Math.cos(aa) * dd, Math.sin(aa) * dd) : c.moveTo(Math.cos(aa) * dd, Math.sin(aa) * dd);
        }
        c.stroke();
      }
    } else if (fam === "C") {
      const n = 4 + tier * 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.3;
        dot(c, Math.cos(a) * R, Math.sin(a) * R, R * (0.36 + 0.05 * Math.sin(ph + i * 1.3)), i % 2 ? MAG : GRN);
      }
    }
    c.fillStyle = RED;
    blob(c, R, ph, tier ? 0.05 : 0.08);
    if (fam === "B") {
      dot(c, 0, 0, R * 0.5, CYN);
      dot(c, 0, 0, R * 0.2, BLK);
    } else if (fam === "C") {
      for (const [x, y, s] of [[-0.42, -0.15, 0.24], [0.08, -0.4, 0.28], [0.45, 0, 0.2], [-0.02, 0.3, 0.18]]) {
        dot(c, x * R, y * R, s * R, BLU);
        dot(c, x * R, y * R, Math.max(0.7, s * R * 0.45), YEL);
      }
    } else {
      for (const sx of [-1, 1]) {
        c.save();
        c.translate(sx * R * 0.38, -R * 0.1);
        c.rotate(fam === "A" ? sx * 0.5 : 0);
        c.fillStyle = BLU;
        c.beginPath();
        c.ellipse(0, 0, R * 0.26, R * (fam === "A" ? 0.17 : 0.28), 0, 0, TAU);
        c.fill();
        c.restore();
        dot(c, sx * R * 0.38, -R * 0.08, Math.max(0.8, R * 0.1), YEL);
      }
      if (fam === "A") {
        c.fillStyle = BLU;
        for (const sx of [-1, 1]) {
          c.beginPath();
          c.moveTo(sx * R * 0.08, R * 0.3);
          c.lineTo(sx * R * 0.34, R * 0.3);
          c.lineTo(sx * R * 0.2, R * 0.75);
          c.fill();
        }
      }
    }
  }

  const FORM_FEAT = { A: PAL.bone, B: null, C: null };
  const formCache = {};
  function formFrames(forms) {
    const key = forms.join(">") || "seed";
    if (formCache[key]) return formCache[key];
    const last = forms.length ? D.FORMS[forms[forms.length - 1]] : null, tier = forms.length;
    const S = [22, 30, 36, 42][tier];
    const body = last ? last.c : PAL.bone;
    const cols = { body, feat: last ? FORM_FEAT[last.fam] || rgbHex(mix(rgb(body), [255, 255, 255], 0.3)) : body, feat2: last ? rgbHex(mix(rgb(body), INK, 0.3)) : body, core: PAL.bone };
    const fr = [];
    for (let i = 0; i < 4; i++) fr.push(bake(S, (c) => paintCreature(c, S, forms, (i / 4) * TAU), cols));
    return (formCache[key] = fr);
  }
  function rgbHex(a) {
    return "#" + a.map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  /* 敌人：只用珊瑚红与冷灰色系，靠轮廓区分种类。 */
  const ENEMY_COL = { grunt: PAL.coral, fast: PAL.pink, spit: PAL.rose, tank: PAL.mist, split: "#d06a9a", bomb: PAL.coral, mite: "#d06a9a", boss: "#c2304e" };
  function paintEnemy(c, S, type, r, ph) {
    c.translate(S / 2, S / 2);
    const w = 1 + 0.07 * Math.sin(ph);
    c.fillStyle = RED;
    if (type === "boss") {
      c.fillStyle = GRN;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + ph * 0.25;
        c.beginPath();
        c.moveTo(Math.cos(a - 0.2) * r * 0.9, Math.sin(a - 0.2) * r * 0.9);
        c.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
        c.lineTo(Math.cos(a + 0.2) * r * 0.9, Math.sin(a + 0.2) * r * 0.9);
        c.fill();
      }
      c.fillStyle = RED;
      blob(c, r, ph, 0.04);
      c.fillStyle = BLK;
      c.beginPath();
      c.ellipse(0, 0, r * 0.6, r * 0.34, 0, 0, TAU);
      c.fill();
      dot(c, Math.sin(ph) * r * 0.15, 0, r * 0.2, CYN);
    } else if (type === "fast") {
      c.beginPath();
      c.moveTo(0, -r * 1.2);
      c.lineTo(r, 0);
      c.lineTo(0, r * 1.2);
      c.lineTo(-r, 0);
      c.fill();
      dot(c, 0, 0, 1, YEL);
    } else if (type === "tank") {
      c.beginPath();
      for (let i = 0; i < 6; i++) c.lineTo(Math.cos((i / 6) * TAU + 0.52) * r * 1.05, Math.sin((i / 6) * TAU + 0.52) * r * 1.05);
      c.fill();
      c.fillStyle = GRN;
      c.beginPath();
      for (let i = 0; i < 6; i++) c.lineTo(Math.cos((i / 6) * TAU + 0.52) * r * 0.55, Math.sin((i / 6) * TAU + 0.52) * r * 0.55);
      c.fill();
      dot(c, -r * 0.2, 0, 1, YEL);
      dot(c, r * 0.25, 0, 1, YEL);
    } else if (type === "bomb") {
      c.fillStyle = GRN;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + ph;
        c.beginPath();
        c.moveTo(Math.cos(a - 0.4) * r * 0.7, Math.sin(a - 0.4) * r * 0.7);
        c.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
        c.lineTo(Math.cos(a + 0.4) * r * 0.7, Math.sin(a + 0.4) * r * 0.7);
        c.fill();
      }
      dot(c, 0, 0, r * 0.85, RED);
      dot(c, 0, 0, r * (0.35 + 0.15 * Math.sin(ph * 2)), BLU);
    } else if (type === "split") {
      dot(c, -r * 0.42, 0, r * 0.72 * w, RED);
      dot(c, r * 0.42, 0, (r * 0.72) / w, RED);
      dot(c, -r * 0.42, -1, 1, YEL);
      dot(c, r * 0.42, -1, 1, YEL);
    } else {
      c.beginPath();
      c.ellipse(0, 0, r * w, r / w, 0, 0, TAU);
      c.fill();
      if (type === "spit") dot(c, 0, r * 0.35, r * 0.34, BLU);
      if (r > 2.6) {
        dot(c, -r * 0.36, -r * 0.2, Math.max(0.8, r * 0.16), YEL);
        dot(c, r * 0.36, -r * 0.2, Math.max(0.8, r * 0.16), YEL);
      }
    }
  }
  const enemyCache = {};
  function enemyFrames(type, elite) {
    const key = type + (elite ? "E" : "");
    if (enemyCache[key]) return enemyCache[key];
    const r = D.ENEMIES[type].r * (elite ? 1.35 : 1) * K, S = Math.ceil(r * (type === "boss" || type === "bomb" ? 3.1 : 2.6)) + 4;
    const cols = { body: ENEMY_COL[type], feat: type === "tank" ? PAL.bruise : type === "boss" ? PAL.amber : PAL.amber, core: PAL.amber };
    const fr = [];
    for (let i = 0; i < 4; i++) fr.push(bake(S, (c) => paintEnemy(c, S, type, r, (i / 4) * TAU), cols));
    if (elite) for (const f of fr) goldRim(f);
    return (enemyCache[key] = fr);
  }
  function goldRim(f) {
    for (const cv of [f.cv, f.ice]) {
      const c = cv.getContext("2d"), img = c.getImageData(0, 0, f.s, f.s), d = img.data, ink = INK, a = rgb(PAL.amber);
      for (let i = 0; i < f.s * f.s; i++) if (d[i * 4 + 3] && d[i * 4] === ink[0] && d[i * 4 + 1] === ink[1] && d[i * 4 + 2] === ink[2]) {
        const x = i % f.s, y = (i / f.s) | 0;
        const edge = !x || !y || x === f.s - 1 || y === f.s - 1 || !d[(i - 1) * 4 + 3] || !d[(i + 1) * 4 + 3] || !d[(i - f.s) * 4 + 3] || !d[(i + f.s) * 4 + 3];
        if (edge) (d[i * 4] = a[0]), (d[i * 4 + 1] = a[1]), (d[i * 4 + 2] = a[2]);
      }
      c.putImageData(img, 0, 0);
    }
  }

  /* 字符串图标：c 主色 w 骨白 d 暗面，自动加 1 像素描边。 */
  const ICONS = {
    claw: ["..w...w...", "..c...c..w", ".cc..cc..c", ".c...c..cc", "cc..cc..c.", "c...c..cc.", "c..cc..c..", "...c..cc..", "...c..c...", "......d..."],
    spike: [".......ww.", "......www.", ".....wcww.", "....wcw...", "...wcw....", "..wcw.....", ".wwc......", "wwww......", ".ww.......", ".........."],
    orbit: ["...cccc...", "..c....c..", ".c......c.", "ww......c.", "ww......c.", ".c......ww", ".c......ww", "..c....c..", "...cccc...", ".........."],
    spore: ["...cccc...", "..cwcccc..", ".cccccwcc.", ".cwcccccc.", ".dddddddd.", "....ww....", "....ww....", "....ww....", "...wwww...", ".........."],
    flame: ["....c.....", "....cc....", "...ccc....", "..cccc.c..", "..cwccccc.", ".ccwwcccc.", ".cwwwwccc.", ".cwwwwwcc.", "..cwwwcc..", "...cccc..."],
    arc: [".....ccc..", "....ccc...", "...ccc....", "..cccccc..", "....ccc...", "...ccc....", "..ccc.....", ".cc.......", ".c........", ".........."],
    nova: ["....c.....", ".c..c..c..", "..c.c.c...", "...ccc....", "cccwwwccc.", "...ccc....", "..c.c.c...", ".c..c..c..", "....c.....", ".........."],
    drain: ["....c.....", "....c.....", "...ccc....", "...ccc....", "..ccccc...", ".cwccccc..", ".cwccccc..", ".ccccccc..", "..ccccc...", "...ddd...."],
    brood: [".c......c.", "..c....c..", "...cccc...", "c.cwccwc.c", ".cccccccc.", "c.cccccc.c", ".cccccccc.", "c.cdccdc.c", "...cddc...", ".........."],
    thorn: [".cccccccc.", ".cwwccccc.", ".cwccccdc.", ".cccccddc.", ".ccccdddc.", "..cccddc..", "..ccdddc..", "...cddc...", "....dc....", ".........."],
    dna: [".cc....cc.", "..cc..cc..", "...cwwc...", "..cc..cc..", ".cc....cc.", ".cwwwwwwc.", ".cc....cc.", "..cc..cc..", "...cwwc...", "..cc..cc.."],
    cell: ["...cccc...", "..cwwccc..", ".cwwccccc.", ".cwccccdc.", ".ccccdddc.", ".cccdwwdc.", ".cccdwwdc.", "..ccdddc..", "...cccc...", ".........."],
    up: ["....cc....", "...cccc...", "..cccccc..", ".cccccccc.", "cccccccccc", "...cccc...", "...cccc...", "...cccc...", "...dddd...", ".........."],
    down: ["...cccc...", "...cccc...", "...cccc...", "...cccc...", "cccccccccc", ".cccccccc.", "..cccccc..", "...cccc...", "....dd....", ".........."],
    sample: ["...wwww...", "...w..w...", "...w..w...", "..cw..wc..", "..cccccc..", ".cccwcccc.", ".ccccccwc.", ".cccccccc.", "..dddddd..", ".........."],
    lock: ["...wwww...", "..w....w..", "..w....w..", ".cccccccc.", ".cccccccc.", ".cccwwccc.", ".cccwwccc.", ".cccccccc.", ".dddddddd.", ".........."],
  };
  const iconCache = {};
  function icon(id, col) {
    const key = id + col;
    if (iconCache[key]) return iconCache[key];
    const rows = ICONS[id] || ICONS.cell, n = rows.length + 2, cv = mk(n, n), c = cv.getContext("2d");
    const t = tri(col), map = { c: t[1], w: BONE, d: t[2] };
    const at = (x, y) => (rows[y] && rows[y][x] && rows[y][x] !== "." ? rows[y][x] : null);
    for (let y = -1; y <= rows.length; y++)
      for (let x = -1; x <= rows.length; x++) {
        const ch = at(x, y);
        if (ch) c.fillStyle = rgbHex(map[ch]);
        else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) c.fillStyle = PAL.ink;
        else continue;
        c.fillRect(x + 1, y + 1, 1, 1);
      }
    return (iconCache[key] = cv.toDataURL());
  }

  /* 3×5 像素数字 */
  const GLY = { 0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001001010010", 8: "111101111101111", 9: "111101111001111", k: "100101110101101", m: "000111111101101", ".": "000000000000010" };
  const numCache = {};
  function numSprite(str, col, big) {
    const key = str + col + (big ? 1 : 0);
    if (numCache[key]) return numCache[key];
    const sc = big ? 2 : 1, w = (str.length * 4 - 1) * sc + 2, h = 5 * sc + 2, cv = mk(w, h), c = cv.getContext("2d");
    const pass = (ox, oy, fill) => {
      c.fillStyle = fill;
      for (let i = 0; i < str.length; i++) {
        const g = GLY[str[i]] || GLY[0];
        for (let p = 0; p < 15; p++) if (g[p] === "1") c.fillRect(1 + ox + (i * 4 + (p % 3)) * sc, 1 + oy + ((p / 3) | 0) * sc, sc, sc);
      }
    };
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pass(ox, oy, PAL.ink);
    pass(0, 0, col);
    const keys = Object.keys(numCache);
    if (keys.length > 600) for (const k2 of keys.slice(0, 300)) delete numCache[k2];
    return (numCache[key] = cv);
  }
  const fmt = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "m" : v >= 1e4 ? Math.round(v / 1e3) + "k" : v >= 1e3 ? (v / 1e3).toFixed(1) + "k" : String(Math.max(1, Math.round(v))));

  /* 像素图元 */
  function line(c, x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy, n = 0;
    while (n++ < 400) {
      c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) (e += dy), (x0 += sx);
      if (e2 <= dx) (e += dx), (y0 += sy);
    }
  }
  function ring(c, cx, cy, r) {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    let x = r, y = 0, e = 1 - r;
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-x, y], [-y, x], [x, -y], [y, -x], [-x, -y], [-y, -x]]) c.fillRect(cx + a, cy + b, 1, 1);
      y++;
      if (e < 0) e += 2 * y + 1;
      else (x--), (e += 2 * (y - x) + 1);
    }
  }
  function dither(c, cx, cy, r, phase) {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -w; x <= w; x++) if ((x + y * 2 + phase) % 3 === 0) c.fillRect(cx + x, cy + y, 1, 1);
    }
  }

  /* 培养皿底图 */
  const dishCache = {};
  function dish(zone) {
    if (dishCache[zone]) return dishCache[zone];
    const [cD, cM, cL] = D.ZONES[zone].c;
    const cv = (dishCache[zone] = mk(RES, RES)), c = cv.getContext("2d");
    c.fillStyle = PAL.night;
    c.fillRect(0, 0, RES, RES);
    for (let y = 0; y < RES; y++)
      for (let x = 0; x < RES; x++) {
        const dx = x - C + 0.5, dy = y - C + 0.5, d = Math.sqrt(dx * dx + dy * dy);
        if (d > DISH + 3) continue;
        let col;
        if (d > DISH + 1) col = PAL.ink;
        else if (d > DISH - 1) col = cL;
        else if (d > DISH - 3) col = PAL.ink;
        else {
          const k = d / DISH, ch = (x + y) & 1;
          col = k > 0.86 ? cD : k > 0.7 ? (ch ? cD : cM) : k < 0.22 ? (ch ? cL : cM) : cM;
        }
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    c.fillStyle = cL;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU, L = i % 3 ? 2 : 5;
      for (let k = 0; k < L; k++) c.fillRect(Math.round(C + Math.cos(a) * (DISH - 4 - k)), Math.round(C + Math.sin(a) * (DISH - 4 - k)), 1, 1);
    }
    c.fillStyle = PAL.bruise;
    for (const [x, y] of [[6, 6], [RES - 8, 6], [6, RES - 8], [RES - 8, RES - 8]]) c.fillRect(x, y, 2, 2);
    return cv;
  }

  const parts = [], motes = [];
  let shake = 0, flash = 0, hurtT = 0, numSkip = 0, calm = false;
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * (DISH - 8);
    motes.push({ x: C + Math.cos(a) * d, y: C + Math.sin(a) * d, s: 0.5 + Math.random(), p: Math.random() * TAU });
  }

  function consume(run) {
    const snd = {};
    for (const f of run.fx) {
      const x = C + (f.x || 0) * K, y = C + (f.y || 0) * K;
      if (f.t === "num") {
        snd[f.crit ? "crit" : "hit"] = 1;
        if (parts.length > 150) continue;
        if (f.dot && numSkip++ % 4) continue;
        if (!f.crit && !f.dot && parts.length > 70 && numSkip++ % 2) continue;
        parts.push({ k: "num", x: x + ((Math.random() * 7) | 0) - 3, y: y - 3, cv: numSprite(fmt(f.v), f.crit ? PAL.amber : TAGC[f.tag], f.crit), life: f.crit ? 0.8 : 0.55, max: 0.8 });
      } else if (f.t === "die") {
        snd.kill = 1;
        const n = f.boss ? 36 : 5;
        for (let i = 0; i < n && parts.length < 260; i++) {
          const a = Math.random() * TAU, s = (f.boss ? 90 : 40) * (0.3 + Math.random());
          parts.push({ k: "bit", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: i % 3 ? PAL.coral : PAL.rose, life: 0.3 + Math.random() * 0.2, max: 0.5, big: f.boss && i % 2 });
        }
        if (f.boss) {
          flash = 0.3;
          shake = 0.5;
          parts.push({ k: "ring", x, y, r: 90, c: PAL.bone, life: 0.5, max: 0.5 });
        }
      } else if (f.t === "boom") {
        snd.boom = 1;
        shake = Math.max(shake, 0.12);
        parts.push({ k: "boom", x, y, r: f.r * K, c: TAGC[f.tag], life: 0.24, max: 0.24 });
      } else if (f.t === "bolt") {
        const x1 = C + f.x1 * K, y1 = C + f.y1 * K, x2 = C + f.x2 * K, y2 = C + f.y2 * K, pts = [[x1, y1]];
        for (let i = 1; i < 3; i++) pts.push([x1 + ((x2 - x1) * i) / 3 + (Math.random() - 0.5) * 9, y1 + ((y2 - y1) * i) / 3 + (Math.random() - 0.5) * 9]);
        pts.push([x2, y2]);
        parts.push({ k: "bolt", pts, life: 0.12, max: 0.12 });
      } else if (f.t === "beam") parts.push({ k: "beam", x, y, life: 0.14, max: 0.14 });
      else if (f.t === "slash") parts.push({ k: "slash", x, y, d: Math.random() < 0.5 ? 1 : -1, life: 0.1, max: 0.1 });
      else if (f.t === "cone") {
        for (let i = 0; i < 16 && parts.length < 260; i++) {
          const a = f.a + (Math.random() * 2 - 1) * f.half, s = f.r * K * (2.2 + Math.random() * 2);
          parts.push({ k: "fire", x: C, y: C, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.28, max: 0.28 });
        }
      } else if (f.t === "txt") parts.push({ k: "txt", x, y, v: f.v, big: f.big, life: f.big ? 1.5 : 0.7, max: f.big ? 1.5 : 0.7 });
      else if (f.t === "lvl") {
        snd.lvl = 1;
        parts.push({ k: "ring", x: C, y: C, r: 40, c: PAL.sprout, life: 0.4, max: 0.4 });
      } else if (f.t === "hurt") {
        snd.hurt = 1;
        shake = Math.max(shake, 0.14);
        hurtT = 0.14;
      }
    }
    run.fx.length = 0;
    return snd;
  }

  function spr(c, cv, x, y) {
    c.drawImage(cv, Math.round(x - cv.width / 2), Math.round(y - cv.height / 2));
  }

  function draw(c, run, t, dt) {
    c.imageSmoothingEnabled = false;
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (calm) shake = flash = hurtT = 0;
    shake = Math.max(0, shake - dt);
    const sx = shake > 0 ? ((Math.random() * 3) | 0) - 1 : 0, sy = shake > 0 ? ((Math.random() * 3) | 0) - 1 : 0;
    const zone = run ? Math.min(D.ZONES.length - 1, Math.floor((Math.floor((run.wave - 1) / D.LAYER)) / 2)) : 0, rising = run && run.asc > 0;
    c.drawImage(dish(zone), sx, sy);
    c.translate(sx, sy);
    const fi = Math.floor(t * 5) & 3;

    c.fillStyle = D.ZONES[zone].c[2];
    for (const m of motes) {
      m.y -= m.s * dt * (rising ? -90 : 3);
      m.x += Math.sin(t * 0.6 + m.p) * dt * 2;
      const dx = m.x - C, dy = m.y - C;
      if (dx * dx + dy * dy > (DISH - 6) * (DISH - 6)) (m.y = C + (rising ? -Math.abs(dy) + 2 : Math.abs(dy) - 2)), (m.x = C + dx * 0.9);
      if (rising) c.fillRect(Math.round(m.x), Math.round(m.y) - 4, 1, 5);
      else if (Math.sin(t * 1.3 + m.p) > -0.2) c.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }

    if (run) {
      c.fillStyle = PAL.sprout;
      for (const cl of run.clouds) dither(c, C + cl.x * K, C + cl.y * K, cl.r * K * (cl.life < 0.4 ? 0.7 : 1), Math.floor(t * 4) & 1);
      for (const e of run.enemies) {
        if (e.dead) continue;
        const f = enemyFrames(e.type, e.elite)[(fi + e.id) & 3], x = C + e.x * K, y = C + e.y * K;
        const hit = e.ht !== undefined && run.t - e.ht < 0.06;
        spr(c, hit ? f.flash : e.frz > 0 ? f.ice : f.cv, x, y);
        const rr = e.r * K;
        if (e.psn > 0) {
          c.fillStyle = PAL.sprout;
          const n = Math.min(4, Math.ceil(e.psn / 4));
          for (let i = 0; i < n; i++) {
            const a = run.t * 3 + (i / n) * TAU;
            c.fillRect(Math.round(x + Math.cos(a) * (rr + 2)), Math.round(y + Math.sin(a) * (rr + 2)), 1, 1);
          }
        }
        if (e.burnT > 0) {
          const fl = (Math.floor(run.t * 12) + e.id) & 1;
          c.fillStyle = fl ? PAL.amber : PAL.fire;
          c.fillRect(Math.round(x) - 1 + fl, Math.round(y - rr) - 3, 2, 2);
          c.fillRect(Math.round(x) - fl, Math.round(y - rr) - 4 - fl, 1, 1);
        }
        if (e.chill > 0 && e.frz <= 0) {
          c.fillStyle = PAL.frost;
          c.fillRect(Math.round(x) - 2, Math.round(y + rr) + 1, 1, 1);
          c.fillRect(Math.round(x) + 1, Math.round(y + rr) + 2, 1, 1);
        }
        if ((e.elite || e.type === "tank") && e.hp < e.max) {
          const w = Math.round(rr * 2);
          c.fillStyle = PAL.ink;
          c.fillRect(Math.round(x - rr) - 1, Math.round(y - rr) - 5, w + 2, 3);
          c.fillStyle = e.elite ? PAL.amber : PAL.coral;
          c.fillRect(Math.round(x - rr), Math.round(y - rr) - 4, Math.max(1, Math.round(w * (e.hp / e.max))), 1);
        }
      }
      for (const mn of run.minions) {
        const x = Math.round(C + mn.x * K), y = Math.round(C + mn.y * K), leg = Math.floor(t * 10 + mn.a) & 1;
        c.fillStyle = PAL.ink;
        c.fillRect(x - 2, y - 2, 5, 4);
        c.fillRect(x - 3 + leg, y - 1, 7 - leg * 2, 2);
        c.fillStyle = PAL.swarm;
        c.fillRect(x - 1, y - 1, 3, 2);
        c.fillStyle = PAL.bone;
        c.fillRect(x - 1, y - 1, 1, 1);
      }
      for (const p of run.projs) {
        const x = C + p.x * K, y = C + p.y * K;
        c.fillStyle = PAL.ink;
        line(c, x + 1, y + 1, x - p.vx * 0.016 + 1, y - p.vy * 0.016 + 1);
        c.fillStyle = PAL.bone;
        line(c, x, y, x - p.vx * 0.016, y - p.vy * 0.016);
      }
      for (const p of run.eprojs) {
        const x = Math.round(C + p.x * K), y = Math.round(C + p.y * K);
        c.fillStyle = PAL.ink;
        c.fillRect(x - 2, y - 1, 4, 2);
        c.fillRect(x - 1, y - 2, 2, 4);
        c.fillStyle = PAL.pink;
        c.fillRect(x - 1, y - 1, 2, 2);
      }
      for (let i = 0; i < (run.orbN || 0); i++) {
        const a = run.orbA + (i * TAU) / run.orbN, x = Math.round(C + Math.cos(a) * run.orbR * K), y = Math.round(C + Math.sin(a) * run.orbR * K);
        c.fillStyle = PAL.mist;
        c.fillRect(Math.round(C + Math.cos(a - 0.25) * run.orbR * K), Math.round(C + Math.sin(a - 0.25) * run.orbR * K), 1, 1);
        c.fillStyle = PAL.ink;
        c.fillRect(x - 2, y - 3, 5, 7);
        c.fillRect(x - 3, y - 2, 7, 5);
        c.fillStyle = PAL.bone;
        c.fillRect(x - 1, y - 2, 3, 5);
        c.fillRect(x - 2, y - 1, 5, 3);
      }
      if (!run.over || run.over === "win") {
        const fr = formFrames(run.forms)[fi];
        if (run.sh > 1) {
          c.fillStyle = PAL.frost;
          const R = fr.s / 2 + 2;
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * TAU + t;
            c.fillRect(Math.round(C + Math.cos(a) * R), Math.round(C + Math.sin(a) * R), 1, 1);
          }
        }
        if (run.forms.length >= 3) {
          c.fillStyle = D.FORMS[run.forms[2]].c;
          const R = fr.s / 2 + 4;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU - t * 1.5;
            c.fillRect(Math.round(C + Math.cos(a) * R) - 1, Math.round(C + Math.sin(a) * R) - 1, 2, 2);
          }
        }
        spr(c, run.hurtT > 0 ? fr.flash : fr.cv, C, C);
      }
    } else spr(c, formFrames([])[fi].cv, C, C);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        parts[i] = parts[parts.length - 1];
        parts.pop();
        continue;
      }
      const k = p.life / p.max;
      if (p.k === "num") {
        p.y -= dt * 16;
        spr(c, p.cv, p.x, p.y);
      } else if (p.k === "bit") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.9;
        p.vy *= 0.9;
        c.fillStyle = p.c;
        const s = p.big ? 2 : 1;
        c.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      } else if (p.k === "fire") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.86;
        p.vy *= 0.86;
        c.fillStyle = k > 0.7 ? PAL.bone : k > 0.45 ? PAL.amber : k > 0.2 ? PAL.fire : PAL.rose;
        const s = k > 0.4 ? 2 : 1;
        c.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      } else if (p.k === "boom") {
        c.fillStyle = p.c;
        if (k > 0.6) dither(c, p.x, p.y, p.r * 0.7, 0);
        ring(c, p.x, p.y, p.r * (1 - k * 0.5));
        if (k > 0.3) ring(c, p.x, p.y, p.r * (1 - k * 0.5) - 1);
      } else if (p.k === "ring") {
        c.fillStyle = p.c;
        ring(c, p.x, p.y, p.r * (1 - k));
      } else if (p.k === "bolt") {
        c.fillStyle = k > 0.5 ? PAL.bone : PAL.volt;
        for (let j = 1; j < p.pts.length; j++) line(c, p.pts[j - 1][0], p.pts[j - 1][1], p.pts[j][0], p.pts[j][1]);
      } else if (p.k === "beam") {
        c.fillStyle = PAL.coral;
        line(c, C, C, p.x, p.y);
        c.fillStyle = PAL.bone;
        c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
      } else if (p.k === "slash") {
        c.fillStyle = PAL.bone;
        for (const o of [-3, 0, 3]) line(c, p.x - 4 + o, p.y - 4 * p.d, p.x + 2 + o, p.y + 4 * p.d);
      } else if (p.k === "txt") {
        p.y -= dt * (p.big ? 3 : 10);
        c.font = (p.big ? 24 : 12) + "px EvoPixel, monospace";
        c.textAlign = "center";
        c.fillStyle = PAL.ink;
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.fillText(p.v, Math.round(p.x) + ox, Math.round(p.y) + oy);
        c.fillStyle = p.big ? PAL.coral : PAL.bone;
        c.fillText(p.v, Math.round(p.x), Math.round(p.y));
      }
    }

    c.setTransform(1, 0, 0, 1, 0, 0);
    const low = run && !run.over && run.hp / run.maxHp < 0.3 && (calm || Math.floor(t * 3) & 1);
    if (hurtT > 0 || low) {
      hurtT -= dt;
      c.fillStyle = PAL.coral;
      for (let i = 0; i < 180; i++) {
        const a = (i / 180) * TAU;
        for (const d of [DISH - 4, DISH - 6]) if ((i + d) & 1) c.fillRect(Math.round(C + Math.cos(a) * d), Math.round(C + Math.sin(a) * d), 1, 1);
      }
    }
    if (flash > 0) {
      flash -= dt;
      c.fillStyle = PAL.bone;
      if (flash > 0.18) c.fillRect(0, 0, RES, RES);
      else for (let y = 0; y < RES; y += 1) for (let x = y & 1; x < RES; x += 2) c.fillRect(x, y, 1, 1);
    }
  }

  function clear() {
    parts.length = 0;
    shake = flash = hurtT = 0;
  }
  /* 界面用：把形态精灵画进一个小画布 */
  function preview(el, forms) {
    const f = formFrames(forms)[0];
    el.width = el.height = 44;
    const c = el.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.drawImage(f.cv, Math.round((44 - f.s) / 2), Math.round((44 - f.s) / 2));
  }
  G.EvoRender = { draw, consume, clear, preview, icon, PAL, TAGC, RES, pulse: () => (flash = 0.3), setCalm: (v) => (calm = !!v) };
})(window);

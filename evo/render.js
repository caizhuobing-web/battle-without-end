/* 万变之种：Canvas 渲染。只读取模拟状态，不修改战斗结果。 */
(function (G) {
  const D = G.EvoData, TAU = Math.PI * 2;
  const parts = [];
  let trauma = 0, flash = 0, vign = 0, numSkip = 0;
  const motes = [];
  for (let i = 0; i < 46; i++) motes.push({ x: Math.random() * 440 - 220, y: Math.random() * 440 - 220, r: 0.6 + Math.random() * 1.6, s: 0.3 + Math.random(), p: Math.random() * TAU });

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
    return "rgb(" + f(n >> 16) + "," + f((n >> 8) & 255) + "," + f(n & 255) + ")";
  }

  /* 程序化绘制玩家生物。forms 为进化路径数组。 */
  function creature(c, forms, t, r, hurt) {
    const last = forms.length ? D.FORMS[forms[forms.length - 1]] : null;
    const fam = last ? last.fam : "", tier = forms.length, col = last ? last.c : "#bfe9dc";
    const R = r * (1 + tier * 0.13), dark = shade(col, -0.55);
    c.save();
    c.lineJoin = "round";
    if (tier >= 3) {
      c.strokeStyle = col;
      c.globalAlpha = 0.5;
      c.lineWidth = 1.5;
      c.setLineDash([5, 7]);
      c.lineDashOffset = -t * 14;
      c.beginPath();
      c.arc(0, 0, R * 1.75, 0, TAU);
      c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
    }
    const g0 = c.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 2.3);
    g0.addColorStop(0, col + "55");
    g0.addColorStop(1, col + "00");
    c.fillStyle = g0;
    c.beginPath();
    c.arc(0, 0, R * 2.3, 0, TAU);
    c.fill();

    if (fam === "A") {
      const n = 5 + tier * 2;
      c.fillStyle = shade(col, 0.35);
      c.strokeStyle = dark;
      c.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.sin(t * 2 + i) * 0.05, L = R * (1.35 + tier * 0.12 + Math.sin(t * 5 + i * 2) * 0.05);
        c.beginPath();
        c.moveTo(Math.cos(a - 0.2) * R * 0.85, Math.sin(a - 0.2) * R * 0.85);
        c.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        c.lineTo(Math.cos(a + 0.2) * R * 0.85, Math.sin(a + 0.2) * R * 0.85);
        c.closePath();
        c.fill();
        c.stroke();
      }
    } else if (fam === "B") {
      const n = 5 + tier * 2;
      c.strokeStyle = col;
      c.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + t * 0.25;
        c.lineWidth = 2.6;
        c.globalAlpha = 0.75;
        c.beginPath();
        for (let k = 0; k <= 6; k++) {
          const d = R * (0.8 + k * (0.16 + tier * 0.02)), aa = a + Math.sin(t * 3 + i * 1.7 + k * 0.8) * 0.16 * (k / 6);
          k ? c.lineTo(Math.cos(aa) * d, Math.sin(aa) * d) : c.moveTo(Math.cos(aa) * d, Math.sin(aa) * d);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
    } else if (fam === "C") {
      const n = 4 + tier * 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.3, pr = R * (0.3 + 0.06 * Math.sin(t * 3 + i * 1.3));
        c.fillStyle = shade(col, i % 2 ? 0.25 : -0.15);
        c.strokeStyle = dark;
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(Math.cos(a) * R * 0.98, Math.sin(a) * R * 0.98, pr, 0, TAU);
        c.fill();
        c.stroke();
      }
    }

    /* 身体：带蠕动的团块 */
    c.beginPath();
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * TAU, rr = R * (1 + 0.055 * Math.sin(a * 3 + t * 2.4) + 0.035 * Math.sin(a * 5 - t * 3.1));
      i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    const g = c.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1);
    g.addColorStop(0, hurt ? "#ffffff" : shade(col, 0.6));
    g.addColorStop(0.55, hurt ? "#ff9a9a" : col);
    g.addColorStop(1, shade(col, -0.45));
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = dark;
    c.lineWidth = 2;
    c.stroke();

    /* 眼睛 */
    const blink = Math.sin(t * 0.9) > 0.985 ? 0.15 : 1;
    c.fillStyle = "#0b1014";
    if (fam === "B") {
      const p = 0.5 + 0.1 * Math.sin(t * 4);
      c.fillStyle = "#ffffff";
      c.globalAlpha = 0.9;
      c.beginPath();
      c.arc(0, 0, R * p * 0.6, 0, TAU);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = shade(col, -0.3);
      c.beginPath();
      c.arc(0, 0, R * 0.22, 0, TAU);
      c.fill();
    } else if (fam === "C") {
      for (const [x, y, s] of [[-0.4, -0.15, 0.2], [0.05, -0.38, 0.24], [0.42, -0.05, 0.17], [0, 0.2, 0.14]]) {
        c.fillStyle = "#f4ffe0";
        c.beginPath();
        c.ellipse(x * R, y * R, s * R, s * R * blink, 0, 0, TAU);
        c.fill();
        c.fillStyle = "#0b1014";
        c.beginPath();
        c.arc(x * R, y * R, s * R * 0.5, 0, TAU);
        c.fill();
      }
    } else {
      const slant = fam === "A" ? 0.45 : 0;
      for (const sx of [-1, 1]) {
        c.save();
        c.translate(sx * R * 0.36, -R * 0.12);
        c.rotate(sx * slant);
        c.fillStyle = fam === "A" ? "#fff4c8" : "#ffffff";
        c.beginPath();
        c.ellipse(0, 0, R * 0.24, R * (fam === "A" ? 0.14 : 0.26) * blink, 0, 0, TAU);
        c.fill();
        c.fillStyle = "#0b1014";
        c.beginPath();
        c.arc(0, 0, R * 0.1, 0, TAU);
        c.fill();
        c.restore();
      }
      if (fam === "A") {
        c.fillStyle = "#fff";
        for (const sx of [-1, 1]) {
          c.beginPath();
          c.moveTo(sx * R * 0.12, R * 0.3);
          c.lineTo(sx * R * 0.26, R * 0.3);
          c.lineTo(sx * R * 0.19, R * 0.62);
          c.fill();
        }
      }
    }
    c.restore();
  }

  function poly(c, n, r, rot) {
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
  }

  function enemy(c, e, t) {
    const hitF = e.ht !== undefined && t - e.ht < 0.05, hitC = e.boss ? shade(e.c, 0.45) : "#ffffff";
    const a = Math.atan2(-e.y, -e.x), wob = 1 + 0.06 * Math.sin(t * 6 + e.id);
    c.save();
    c.translate(e.x, e.y);
    let col = e.c;
    if (e.frz > 0) col = "#cfe6ff";
    else if (e.chill > 0) col = shade(e.c, 0.35);
    c.fillStyle = hitF ? hitC : col;
    c.strokeStyle = e.elite ? "#ffcf5a" : shade(e.c, -0.6);
    c.lineWidth = e.elite ? 2.2 : 1.4;
    if (e.boss) {
      poly(c, 10, e.r * 1.25, t * 0.4);
      c.fillStyle = shade(e.c, -0.5);
      c.fill();
      c.fillStyle = hitF ? hitC : col;
      for (let i = 0; i < 10; i++) {
        const sa = t * 0.4 + (i / 10) * TAU;
        c.beginPath();
        c.moveTo(Math.cos(sa - 0.16) * e.r, Math.sin(sa - 0.16) * e.r);
        c.lineTo(Math.cos(sa) * e.r * 1.5, Math.sin(sa) * e.r * 1.5);
        c.lineTo(Math.cos(sa + 0.16) * e.r, Math.sin(sa + 0.16) * e.r);
        c.fill();
      }
      c.beginPath();
      c.arc(0, 0, e.r * wob, 0, TAU);
      c.fill();
      c.stroke();
    } else if (e.type === "fast") {
      c.rotate(a);
      c.beginPath();
      c.moveTo(e.r * 1.3, 0);
      c.lineTo(-e.r, e.r * 0.85);
      c.lineTo(-e.r * 0.5, 0);
      c.lineTo(-e.r, -e.r * 0.85);
      c.closePath();
      c.fill();
      c.stroke();
      c.rotate(-a);
    } else if (e.type === "tank") {
      poly(c, 6, e.r * 1.08, 0.5);
      c.fill();
      c.stroke();
      c.strokeStyle = shade(e.c, 0.4);
      poly(c, 6, e.r * 0.6, 0.5);
      c.stroke();
    } else if (e.type === "bomb") {
      const p = 1 + 0.18 * Math.sin(t * 14 + e.id);
      poly(c, 8, e.r * p, t * 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#fff2a0";
      c.beginPath();
      c.arc(0, 0, e.r * 0.4 * p, 0, TAU);
      c.fill();
    } else if (e.type === "split") {
      c.beginPath();
      c.arc(-e.r * 0.4, 0, e.r * 0.72 * wob, 0, TAU);
      c.arc(e.r * 0.4, 0, e.r * 0.72 / wob, 0, TAU);
      c.fill();
      c.stroke();
    } else {
      c.beginPath();
      c.ellipse(0, 0, e.r * wob, e.r / wob, 0, 0, TAU);
      c.fill();
      c.stroke();
    }
    if (!e.boss && e.type !== "bomb") {
      c.fillStyle = "#12080c";
      const ex = Math.cos(a) * e.r * 0.35, ey = Math.sin(a) * e.r * 0.35;
      c.beginPath();
      c.arc(ex - Math.sin(a) * e.r * 0.3, ey + Math.cos(a) * e.r * 0.3, e.r * 0.17, 0, TAU);
      c.arc(ex + Math.sin(a) * e.r * 0.3, ey - Math.cos(a) * e.r * 0.3, e.r * 0.17, 0, TAU);
      c.fill();
      if (e.type === "spit") {
        c.fillStyle = "#c8ffe0";
        c.beginPath();
        c.arc(Math.cos(a) * e.r * 0.8, Math.sin(a) * e.r * 0.8, e.r * 0.22, 0, TAU);
        c.fill();
      }
    } else if (e.boss) {
      c.fillStyle = "#1a0008";
      c.beginPath();
      c.ellipse(0, 0, e.r * 0.55, e.r * 0.3, a, 0, TAU);
      c.fill();
      c.fillStyle = "#ffe14a";
      c.beginPath();
      c.arc(Math.cos(a) * e.r * 0.2, Math.sin(a) * e.r * 0.2, e.r * 0.16, 0, TAU);
      c.fill();
    }
    /* 状态标记 */
    if (e.psn > 0) {
      c.fillStyle = "#8fd44a";
      const n = Math.min(6, Math.ceil(e.psn / 3));
      for (let i = 0; i < n; i++) {
        const pa = t * 2 + (i / n) * TAU;
        c.beginPath();
        c.arc(Math.cos(pa) * (e.r + 3), Math.sin(pa) * (e.r + 3), 1.7, 0, TAU);
        c.fill();
      }
    }
    if (e.burnT > 0) {
      c.globalCompositeOperation = "lighter";
      c.fillStyle = "rgba(255,130,40,0.5)";
      c.beginPath();
      c.arc(Math.sin(t * 20 + e.id) * 2, -e.r * 0.6 + Math.cos(t * 17 + e.id) * 2, e.r * 0.55, 0, TAU);
      c.fill();
      c.globalCompositeOperation = "source-over";
    }
    if (e.frz > 0) {
      c.strokeStyle = "#e8f4ff";
      c.lineWidth = 1.5;
      poly(c, 6, e.r * 1.3, 0);
      c.stroke();
    }
    if ((e.elite || e.type === "tank") && e.hp < e.max) {
      c.fillStyle = "#000a";
      c.fillRect(-e.r, -e.r - 6, e.r * 2, 3);
      c.fillStyle = e.elite ? "#ffcf5a" : "#ff6a7c";
      c.fillRect(-e.r, -e.r - 6, e.r * 2 * Math.max(0, e.hp / e.max), 3);
    }
    c.restore();
  }

  function fmt(v) {
    return v >= 1e6 ? (v / 1e6).toFixed(1) + "m" : v >= 1e4 ? (v / 1e3).toFixed(1) + "k" : Math.round(v);
  }

  /* 把模拟层的事件转成粒子。返回需要播放的音效标记。 */
  function consume(run) {
    const snd = {};
    for (const f of run.fx) {
      if (f.t === "num") {
        snd[f.crit ? "crit" : "hit"] = 1;
        if (parts.length > 220) continue;
        if (f.dot && numSkip++ % 3) continue;
        if (!f.crit && !f.dot && parts.length > 110 && numSkip++ % 2) continue;
        parts.push({ k: "num", x: f.x + (Math.random() - 0.5) * 10, y: f.y, v: fmt(f.v), c: f.crit ? "#ffe14a" : D.TAGS[f.tag].c, crit: f.crit, dot: f.dot, life: 0.7, max: 0.7 });
      } else if (f.t === "die") {
        snd.kill = 1;
        const n = f.boss ? 40 : 6;
        for (let i = 0; i < n && parts.length < 320; i++) {
          const a = Math.random() * TAU, s = (f.boss ? 180 : 80) * (0.3 + Math.random());
          parts.push({ k: "bit", x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: f.c, r: f.r * (0.15 + Math.random() * 0.2), life: 0.45, max: 0.45 });
        }
        if (f.boss) {
          flash = 0.5;
          trauma = 1;
          parts.push({ k: "ring", x: f.x, y: f.y, r: 160, c: "#ffffff", life: 0.6, max: 0.6 });
        }
      } else if (f.t === "boom") {
        snd.boom = 1;
        trauma = Math.min(1, trauma + 0.12);
        parts.push({ k: "boom", x: f.x, y: f.y, r: f.r, c: D.TAGS[f.tag].c, life: 0.3, max: 0.3 });
      } else if (f.t === "bolt") {
        const pts = [[f.x1, f.y1]], n = 4;
        for (let i = 1; i < n; i++) pts.push([f.x1 + ((f.x2 - f.x1) * i) / n + (Math.random() - 0.5) * 16, f.y1 + ((f.y2 - f.y1) * i) / n + (Math.random() - 0.5) * 16]);
        pts.push([f.x2, f.y2]);
        parts.push({ k: "bolt", pts, life: 0.14, max: 0.14 });
      } else if (f.t === "beam") parts.push({ k: "beam", x: f.x, y: f.y, life: 0.18, max: 0.18 });
      else if (f.t === "slash") parts.push({ k: "slash", x: f.x, y: f.y, a: Math.random() * TAU, life: 0.14, max: 0.14 });
      else if (f.t === "cone") parts.push({ k: "cone", a: f.a, half: f.half, r: f.r, life: 0.25, max: 0.25 });
      else if (f.t === "txt") parts.push({ k: "txt", x: f.x, y: f.y, v: f.v, big: f.big, life: f.big ? 1.6 : 0.8, max: f.big ? 1.6 : 0.8 });
      else if (f.t === "lvl") {
        snd.lvl = 1;
        parts.push({ k: "ring", x: 0, y: 0, r: 70, c: "#4fe0b0", life: 0.5, max: 0.5 });
      } else if (f.t === "hurt") {
        snd.hurt = 1;
        trauma = Math.min(1, trauma + 0.18);
        vign = 0.35;
      }
    }
    run.fx.length = 0;
    return snd;
  }

  function draw(c, size, run, t, dt) {
    const sc = size / 400;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#070b0f";
    c.fillRect(0, 0, size, size);
    trauma = Math.max(0, trauma - dt * 2.2);
    const sh = trauma * trauma * 7;
    c.setTransform(sc, 0, 0, sc, size / 2 + (Math.random() - 0.5) * sh * sc, size / 2 + (Math.random() - 0.5) * sh * sc);

    const bg = c.createRadialGradient(0, 0, 10, 0, 0, 280);
    bg.addColorStop(0, "#13212b");
    bg.addColorStop(0.6, "#0b131a");
    bg.addColorStop(1, "#05080b");
    c.fillStyle = bg;
    c.fillRect(-220, -220, 440, 440);
    c.strokeStyle = "rgba(120,170,190,0.06)";
    c.lineWidth = 1;
    for (let r = 50; r <= 250; r += 50) {
      c.beginPath();
      c.arc(0, 0, r + Math.sin(t * 0.6 + r) * 3, 0, TAU);
      c.stroke();
    }
    c.fillStyle = "rgba(160,220,210,0.22)";
    for (const m of motes) {
      m.y -= m.s * dt * 6;
      m.x += Math.sin(t * 0.5 + m.p) * dt * 4;
      if (m.y < -220) m.y = 220;
      c.globalAlpha = 0.25 + 0.25 * Math.sin(t + m.p);
      c.beginPath();
      c.arc(m.x, m.y, m.r, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;

    if (run) {
      for (const cl of run.clouds) {
        const g = c.createRadialGradient(cl.x, cl.y, 2, cl.x, cl.y, cl.r);
        const al = Math.min(1, cl.life) * 0.4;
        g.addColorStop(0, "rgba(150,230,80," + al + ")");
        g.addColorStop(1, "rgba(90,180,40,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(cl.x, cl.y, cl.r * (1 + 0.05 * Math.sin(t * 5 + cl.x)), 0, TAU);
        c.fill();
      }
      for (const e of run.enemies) if (!e.dead) enemy(c, e, run.t);
      for (const mn of run.minions) {
        c.fillStyle = "#c79bff";
        c.strokeStyle = "#3a2060";
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(mn.x, mn.y, 4.6, 3.4, t * 3 + mn.a, 0, TAU);
        c.fill();
        c.stroke();
        c.fillStyle = "#fff";
        c.fillRect(mn.x - 1, mn.y - 1, 2, 2);
      }
      c.strokeStyle = "#f0e6d0";
      c.lineWidth = 2.5;
      c.lineCap = "round";
      for (const p of run.projs) {
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
        c.stroke();
      }
      for (const p of run.eprojs) {
        c.fillStyle = "#7dffb0";
        c.beginPath();
        c.arc(p.x, p.y, 3.5, 0, TAU);
        c.fill();
        c.fillStyle = "rgba(125,255,176,0.25)";
        c.beginPath();
        c.arc(p.x, p.y, 7, 0, TAU);
        c.fill();
      }
      for (let i = 0; i < (run.orbN || 0); i++) {
        const a = run.orbA + (i * TAU) / run.orbN, x = Math.cos(a) * run.orbR, y = Math.sin(a) * run.orbR;
        c.strokeStyle = "rgba(240,230,208,0.25)";
        c.lineWidth = 5;
        c.beginPath();
        c.arc(0, 0, run.orbR, a - 0.5, a);
        c.stroke();
        c.fillStyle = "#f6eeda";
        c.strokeStyle = "#6a5a40";
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(x, y, 6, 0, TAU);
        c.fill();
        c.stroke();
      }
      if (run.sh > 1) {
        c.strokeStyle = "rgba(140,200,255," + (0.35 + 0.2 * Math.sin(t * 4)) + ")";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, 30, 0, TAU);
        c.stroke();
      }
      if (!run.over || run.over === "win") creature(c, run.forms, t, 17, run.hurtT > 0);
    } else creature(c, [], t, 22, false);

    /* 粒子 */
    c.textAlign = "center";
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
        p.y -= dt * 34;
        c.globalAlpha = Math.min(1, k * 2);
        c.font = (p.crit ? "bold 15px" : p.dot ? "9px" : "bold 11px") + " sans-serif";
        c.lineWidth = 2.5;
        c.strokeStyle = "rgba(0,0,0,0.75)";
        c.strokeText(p.v, p.x, p.y);
        c.fillStyle = p.c;
        c.fillText(p.v, p.x, p.y);
      } else if (p.k === "bit") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        c.globalAlpha = k;
        c.fillStyle = p.c;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (0.5 + k), 0, TAU);
        c.fill();
      } else if (p.k === "boom") {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = k * 0.45;
        c.fillStyle = p.c;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, TAU);
        c.fill();
        c.globalAlpha = k;
        c.strokeStyle = p.c;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (1 - k * 0.3), 0, TAU);
        c.stroke();
        c.globalCompositeOperation = "source-over";
      } else if (p.k === "ring") {
        c.globalAlpha = k;
        c.strokeStyle = p.c;
        c.lineWidth = 3 * k + 1;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (1 - k), 0, TAU);
        c.stroke();
      } else if (p.k === "bolt") {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = k;
        for (const [w, col] of [[5, "rgba(80,180,255,0.5)"], [1.6, "#e8faff"]]) {
          c.strokeStyle = col;
          c.lineWidth = w;
          c.beginPath();
          p.pts.forEach((q, j) => (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
          c.stroke();
        }
        c.globalCompositeOperation = "source-over";
      } else if (p.k === "beam") {
        c.globalAlpha = k;
        c.strokeStyle = "#ee4c66";
        c.lineWidth = 3 * k + 1;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(p.x * 0.5 + p.y * 0.15, p.y * 0.5 - p.x * 0.15, p.x, p.y);
        c.stroke();
      } else if (p.k === "slash") {
        c.globalAlpha = k;
        c.strokeStyle = "#fff6e0";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(p.x, p.y, 11, p.a, p.a + 2.2 * (1.2 - k));
        c.stroke();
      } else if (p.k === "cone") {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = k * 0.6;
        const g = c.createRadialGradient(0, 0, 8, 0, 0, p.r);
        g.addColorStop(0, "#fff0a0");
        g.addColorStop(0.5, "#ff8a3c");
        g.addColorStop(1, "rgba(255,60,20,0)");
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, p.r * (1.15 - k * 0.3), p.a - p.half, p.a + p.half);
        c.closePath();
        c.fill();
        c.globalCompositeOperation = "source-over";
      } else if (p.k === "txt") {
        p.y -= dt * (p.big ? 8 : 22);
        c.globalAlpha = Math.min(1, k * 2);
        c.font = (p.big ? "bold 26px" : "bold 12px") + " sans-serif";
        c.lineWidth = 3;
        c.strokeStyle = "rgba(0,0,0,0.8)";
        c.strokeText(p.v, p.x, p.y);
        c.fillStyle = p.big ? "#ff6a8a" : "#e4efe9";
        c.fillText(p.v, p.x, p.y);
      }
      c.globalAlpha = 1;
    }

    c.setTransform(1, 0, 0, 1, 0, 0);
    if (vign > 0) {
      vign -= dt;
      const g = c.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.72);
      g.addColorStop(0, "rgba(255,40,60,0)");
      g.addColorStop(1, "rgba(255,40,60," + Math.max(0, vign) * 1.2 + ")");
      c.fillStyle = g;
      c.fillRect(0, 0, size, size);
    }
    if (run && run.hp / run.maxHp < 0.3 && !run.over) {
      const g = c.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.72);
      g.addColorStop(0, "rgba(255,0,30,0)");
      g.addColorStop(1, "rgba(255,0,30," + (0.18 + 0.1 * Math.sin(t * 6)) + ")");
      c.fillStyle = g;
      c.fillRect(0, 0, size, size);
    }
    if (flash > 0) {
      flash -= dt;
      c.fillStyle = "rgba(255,255,255," + Math.max(0, flash) + ")";
      c.fillRect(0, 0, size, size);
    }
  }

  function clear() {
    parts.length = 0;
    trauma = flash = vign = 0;
  }
  G.EvoRender = { draw, consume, creature, clear, pulse: () => (flash = 0.35) };
})(window);

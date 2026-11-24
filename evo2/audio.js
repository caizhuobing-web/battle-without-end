/* 万变之种：程序化音效与环境音乐（WebAudio 实时合成，无音频文件）。 */
(function (G) {
  let ac = null, master = null, on = true, last = {}, musicT = 0, step = 0;
  /* 音效表：w 波形，f 起始频率，t 结束频率，d 时长，v 音量，n 噪声比例 */
  const SFX = {
    hit: { w: "triangle", f: 420, t: 180, d: 0.05, v: 0.05, gap: 70 },
    crit: { w: "square", f: 900, t: 300, d: 0.08, v: 0.05, gap: 90 },
    kill: { w: "sine", f: 260, t: 90, d: 0.1, v: 0.07, gap: 60 },
    boom: { w: "sawtooth", f: 140, t: 40, d: 0.22, v: 0.09, gap: 110 },
    hurt: { w: "sawtooth", f: 160, t: 70, d: 0.12, v: 0.08, gap: 160 },
    pick: { w: "triangle", f: 520, t: 1040, d: 0.14, v: 0.09, gap: 0 },
    buy: { w: "square", f: 660, t: 990, d: 0.09, v: 0.06, gap: 0 },
    deny: { w: "square", f: 180, t: 140, d: 0.1, v: 0.05, gap: 0 },
    boss: { w: "sawtooth", f: 70, t: 55, d: 0.9, v: 0.12, gap: 0 },
  };
  const SEQ = { lvl: [523, 659, 784, 1047], evo: [262, 330, 392, 523, 659, 784, 1047], win: [392, 523, 659, 784, 1047, 1319], dead: [330, 262, 220, 165] };
  /* 环境琶音：小调五声，每步 0.42 秒 */
  const SCALE = [110, 130.8, 146.8, 164.8, 196, 220, 261.6, 293.7];
  const PAT = [0, 4, 2, 5, 1, 4, 3, 6, 0, 5, 2, 7, 1, 4, 3, 5];

  function ensure() {
    if (ac || !on) return ac;
    const AC = G.AudioContext || G.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);
    } catch (e) {
      ac = null;
    }
    return ac;
  }
  function tone(w, f, t, d, v, at) {
    const o = ac.createOscillator(), g = ac.createGain(), s = at || ac.currentTime;
    o.type = w;
    o.frequency.setValueAtTime(f, s);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, t), s + d);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(v, s + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.connect(g);
    g.connect(master);
    o.start(s);
    o.stop(s + d + 0.02);
  }
  function sfx(id) {
    if (!on || !ensure() || ac.state !== "running") return;
    const now = performance.now();
    if (SEQ[id]) {
      SEQ[id].forEach((f, i) => tone("triangle", f, f, 0.22, 0.07, ac.currentTime + i * (id === "dead" ? 0.16 : 0.07)));
      return;
    }
    const s = SFX[id];
    if (!s || now - (last[id] || 0) < s.gap) return;
    last[id] = now;
    tone(s.w, s.f * (0.94 + Math.random() * 0.12), s.t, s.d, s.v);
  }
  /* 每帧调用，按节拍排入下一音符；intensity 0..1 决定音量与高音层 */
  function music(dt, intensity) {
    if (!on || !ac || ac.state !== "running") return;
    musicT -= dt;
    if (musicT > 0) return;
    musicT += 0.42;
    const n = SCALE[PAT[step % PAT.length]];
    tone("sine", n, n, 0.9, 0.035);
    if (step % 4 === 0) tone("triangle", n / 2, n / 2, 1.6, 0.04);
    if (intensity > 0.5 && step % 2 === 1) tone("triangle", n * 2, n * 2, 0.3, 0.018);
    step++;
  }
  function unlock() {
    if (ensure() && ac.state === "suspended") ac.resume();
  }
  function setOn(v) {
    on = v;
    if (master) master.gain.value = v ? 0.9 : 0;
    if (v) unlock();
  }
  G.EvoAudio = { sfx, music, unlock, setOn, isOn: () => on };
})(window);

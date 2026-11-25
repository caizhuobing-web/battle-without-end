/* 万丈深渊：音效。WebAudio 实时合成，没有音频文件。
   每个音效是几层叠在一起：低频的「咚」、中频的「啪」、高频的「嘶」。每层：[波形, 起始频率, 结束频率, 时长, 音量, 延后几秒]。
   波形写 noise 的是过滤过的白噪声，频率是滤波的中心。每次播放整体音高随机浮动一成，免得连着听像复读。 */
(function (G) {
  const SFX = {
    step: [["square", 220, 180, 0.05, 0.04]],
    miss: [["square", 200, 140, 0.08, 0.035]],
    hit: [["sine", 120, 48, 0.09, 0.09], ["noise", 1600, 900, 0.04, 0.045], ["noise", 5200, 3600, 0.05, 0.018]],
    hitBig: [["sine", 95, 36, 0.16, 0.14], ["noise", 1300, 600, 0.07, 0.07], ["noise", 5200, 3000, 0.08, 0.03]],
    hurt: [["sawtooth", 120, 50, 0.12, 0.05], ["noise", 900, 500, 0.05, 0.03]],
    die: [["sine", 140, 40, 0.14, 0.08], ["noise", 2200, 700, 0.09, 0.05]],
    dieBig: [["sine", 80, 28, 0.4, 0.16], ["noise", 1200, 300, 0.25, 0.09], ["noise", 4800, 2000, 0.12, 0.03]],
    win: [["sine", 110, 55, 0.14, 0.12], ["noise", 4200, 6000, 0.06, 0.03], ["triangle", 660, 990, 0.14, 0.08], ["triangle", 990, 1320, 0.14, 0.06, 0.09]],
    jack: [["sine", 80, 30, 0.45, 0.16], ["noise", 1500, 400, 0.3, 0.08], ["triangle", 523, 523, 0.12, 0.08], ["triangle", 659, 659, 0.12, 0.08, 0.1], ["triangle", 784, 784, 0.12, 0.08, 0.2], ["triangle", 1047, 1568, 0.3, 0.08, 0.3]],
    core: [["triangle", 660, 990, 0.12, 0.08]],
    ok: [["sine", 130, 70, 0.1, 0.08], ["triangle", 440, 660, 0.1, 0.08], ["noise", 3600, 5200, 0.05, 0.02]],
    warn: [["square", 300, 200, 0.2, 0.05], ["sine", 90, 40, 0.2, 0.1]],
    fire: [["triangle", 200, 420, 0.25, 0.08]],
  };
  const TUNED = { win: 1, jack: 1, core: 1, ok: 1 }; // 带旋律的不变调
  let ctx = null, on = true, out = null, noise = null;
  function boot() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createDynamicsCompressor(); // 很多声音叠在一起时压一下，免得爆音
    out.connect(ctx.destination);
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate / 2), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function layer(p, k) {
    const t = ctx.currentTime + (p[5] || 0), g = ctx.createGain();
    let src;
    if (p[0] === "noise") {
      src = ctx.createBufferSource();
      src.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(p[1] * k, t);
      f.frequency.exponentialRampToValueAtTime(p[2] * k, t + p[3]);
      src.connect(f).connect(g);
    } else {
      src = ctx.createOscillator();
      src.type = p[0];
      src.frequency.setValueAtTime(p[1] * k, t);
      src.frequency.exponentialRampToValueAtTime(p[2] * k, t + p[3]);
      src.connect(g);
    }
    g.gain.setValueAtTime(p[4], t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + p[3]);
    g.connect(out);
    src.start(t);
    src.stop(t + p[3] + 0.02);
  }
  function play(name) {
    if (!on) return;
    const L = SFX[name];
    if (!L) return;
    try {
      if (!ctx) boot();
      if (ctx.state === "suspended") ctx.resume();
      const k = TUNED[name] ? 1 : 0.9 + Math.random() * 0.2;
      for (const p of L) layer(p, k);
    } catch (e) {
      on = false;
    }
  }
  G.EmberAudio = { play, set: (v) => (on = !!v), get: () => on, SFX };
})(window);

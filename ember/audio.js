/* 万丈深渊：音效。WebAudio 实时合成，没有音频文件。参数表：波形、起止频率、时长、音量。 */
(function (G) {
  const SFX = {
    step: ["square", 220, 180, 0.05, 0.04],
    hit: ["square", 160, 60, 0.08, 0.07],
    hurt: ["sawtooth", 120, 50, 0.12, 0.06],
    core: ["triangle", 660, 990, 0.12, 0.08],
    ok: ["triangle", 440, 660, 0.1, 0.08],
    warn: ["square", 300, 200, 0.2, 0.05],
    fire: ["triangle", 200, 420, 0.25, 0.08],
  };
  let ctx = null, on = true;
  function play(name) {
    if (!on) return;
    const p = SFX[name];
    if (!p) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = p[0];
      o.frequency.setValueAtTime(p[1], t);
      o.frequency.exponentialRampToValueAtTime(p[2], t + p[3]);
      g.gain.setValueAtTime(p[4], t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p[3]);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + p[3] + 0.02);
    } catch (e) {
      on = false;
    }
  }
  G.EmberAudio = { play, set: (v) => (on = !!v), get: () => on };
})(window);

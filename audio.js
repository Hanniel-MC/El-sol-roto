'use strict';
/* ===== AUDIO procedural (sin archivos, funciona offline) ===== */
const Snd = (() => {
  let ac = null, master, mus, sfx, noiseBuf, timer = null, step = 0, nextT = 0, theme = null, want = '';
  const cfg = { music:true, sfx:true, vol:0.7 };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const THEMES = {
    menu: { root:57, sc:[0,3,5,7,10], bpm:78,  wave:'triangle', bass:[0,-4,-2,-5], kick:false },
    w0:   { root:52, sc:[0,2,4,7,9],  bpm:104, wave:'triangle', bass:[0,-3,-5,-2], kick:true },
    w1:   { root:50, sc:[0,3,5,7,10], bpm:96,  wave:'sine',     bass:[0,-2,-5,-7], kick:true },
    w2:   { root:55, sc:[0,2,3,7,8],  bpm:108, wave:'triangle', bass:[0,-4,-7,-2], kick:true },
    w3:   { root:48, sc:[0,1,5,7,8],  bpm:120, wave:'sawtooth', bass:[0,-2,-4,-5], kick:true },
    w4:   { root:50, sc:[0,3,5,7,10], bpm:126, wave:'square',   bass:[0,-5,-2,-7], kick:true },
    boss: { root:45, sc:[0,1,3,7,8],  bpm:144, wave:'sawtooth', bass:[0,0,-2,-5], kick:true },
    boss0: { root:45, sc:[0,2,3,7,9],  bpm:138, wave:'sawtooth', bass:[0,0,-2,-5], kick:true, lead:'square' },
    boss1: { root:47, sc:[0,3,5,6,10], bpm:132, wave:'square',   bass:[0,-2,-5,-7], kick:true, lead:'triangle' },
    boss2: { root:43, sc:[0,1,5,7,8],  bpm:128, wave:'sawtooth', bass:[0,-4,-7,-2], kick:true, lead:'square' },
    boss3: { root:41, sc:[0,1,3,6,7],  bpm:150, wave:'sawtooth', bass:[0,0,-1,-5], kick:true, lead:'square' },
    boss4: { root:45, sc:[0,3,5,7,10], bpm:156, wave:'sawtooth', bass:[0,-5,-2,-7], kick:true, lead:'sawtooth' },
    shop:  { root:60, sc:[0,2,4,7,9],  bpm:92,  wave:'triangle', bass:[0,-5,-3,-7], kick:false, lead:'sine' }
  };
  for (const k of ['w0', 'w1', 'w2', 'w3', 'w4']) THEMES[k].lead = 'triangle';
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.connect(ac.destination);
    mus = ac.createGain(); mus.connect(master);
    sfx = ac.createGain(); sfx.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    apply();
    if (want) music(want, true);
  }
  function apply() {
    if (!ac) return;
    master.gain.value = cfg.vol * 0.8;
    mus.gain.value = cfg.music ? 0.45 : 0;
    sfx.gain.value = cfg.sfx ? 0.9 : 0;
  }
  function tone(f, t, dur, type, vol, dest, f2) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, f1, f2, dest, type) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = type || 'bandpass';
    fl.frequency.setValueAtTime(f1, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }
  function sched() {
    if (!ac || !theme) return;
    const sd = 60 / theme.bpm / 4;
    while (nextT < ac.currentTime + 0.2) {
      const s = step % 16, bar = ((step / 16) | 0) % 4, bo = theme.bass[bar];
      if (s === 0 || s === 6 || s === 8 || s === 14) tone(mtof(theme.root - 12 + bo), nextT, sd * 3, theme.wave === 'sine' ? 'sine' : 'triangle', 0.5, mus);
      if (s % 2 === 0) {
        const idx = (s * 3 + bar * 2 + ((step / 16 / 4) | 0)) % 5;
        const oct = (s % 8 === 6) ? 12 : 0;
        if ((s * 7 + bar * 5) % 5 !== 1) tone(mtof(theme.root + bo + theme.sc[idx] + oct), nextT, sd * 1.8, theme.wave, 0.16, mus);
      }
      if (theme.lead && s % 4 === 0 && (bar + (s >> 2)) % 3 !== 1) tone(mtof(theme.root + 12 + bo + theme.sc[(s + bar * 3) % 5]), nextT, sd * 3, theme.lead, 0.1, mus);
      if (theme.kick && s % 4 === 0) tone(120, nextT, 0.12, 'sine', 0.7, mus, 40);
      if (s % 4 === 2) noise(nextT, 0.04, 0.12, 7000, 5000, mus, 'highpass');
      if (theme.kick && s === 12) noise(nextT, 0.1, 0.18, 1800, 900, mus);
      nextT += sd; step++;
    }
  }
  function music(name, force) {
    if (name === want && !force && timer) return;
    want = name;
    if (!ac) return;
    theme = THEMES[name] || THEMES.menu; step = 0; nextT = ac.currentTime + 0.05;
    if (!timer) timer = setInterval(sched, 40);
  }
  function stop() { want = ''; theme = null; }
  function play(n) {
    if (!ac || !cfg.sfx) return;
    const t = ac.currentTime, d = sfx;
    switch (n) {
      case 'click': tone(660, t, 0.07, 'square', 0.1, d, 880); break;
      case 'jump': tone(300, t, 0.16, 'square', 0.1, d, 700); break;
      case 'swing': noise(t, 0.12, 0.35, 3000, 900, d); break;
      case 'hit': noise(t, 0.09, 0.6, 2200, 500, d); tone(180, t, 0.09, 'square', 0.18, d, 70); break;
      case 'hit2': noise(t, 0.18, 0.8, 1800, 200, d); tone(110, t, 0.2, 'sawtooth', 0.3, d, 40); break;
      case 'dash': noise(t, 0.2, 0.4, 1200, 4000, d, 'bandpass'); break;
      case 'throw': tone(900, t, 0.1, 'triangle', 0.15, d, 500); break;
      case 'coin': tone(988, t, 0.07, 'square', 0.09, d); tone(1319, t + 0.07, 0.18, 'square', 0.09, d); break;
      case 'heal': [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.15, 'triangle', 0.2, d)); break;
      case 'hurt': tone(400, t, 0.28, 'sawtooth', 0.22, d, 90); noise(t, 0.15, 0.4, 1500, 300, d); break;
      case 'special': tone(150, t, 0.7, 'sawtooth', 0.3, d, 900); noise(t, 0.6, 0.5, 400, 6000, d); break;
      case 'boss': tone(90, t, 0.8, 'sawtooth', 0.4, d, 45); noise(t, 0.6, 0.4, 500, 100, d); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.13, 0.3, 'square', 0.12, d)); break;
      case 'swingH': noise(t, 0.22, 0.55, 1800, 300, d); tone(95, t, 0.2, 'sawtooth', 0.2, d, 50); break;
      case 'swingM': tone(500, t, 0.25, 'sine', 0.18, d, 1300); noise(t, 0.2, 0.2, 3000, 6000, d, 'highpass'); break;
      case 'swingK': noise(t, 0.1, 0.4, 5000, 1500, d); tone(2200, t, 0.05, 'triangle', 0.06, d, 1800); break;
      case 'step': noise(t, 0.04, 0.12, 700, 300, d, 'lowpass'); break;
      case 'buy': [880, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.06, 0.14, 'square', 0.1, d)); break;
      case 'equip': tone(400, t, 0.08, 'square', 0.1, d, 800); tone(600, t + 0.09, 0.1, 'square', 0.1, d, 1000); break;
      case 'blorp': tone(220, t, 0.14, 'sine', 0.3, d, 80); tone(330, t + 0.04, 0.1, 'sine', 0.15, d, 130); break;
      case 'growl': tone(120, t, 0.32, 'sawtooth', 0.22, d, 70); noise(t, 0.3, 0.3, 500, 150, d); break;
      case 'flap': noise(t, 0.07, 0.3, 800, 2200, d); noise(t + 0.1, 0.07, 0.3, 800, 2200, d); break;
      case 'ghost': tone(700, t, 0.45, 'sine', 0.18, d, 280); noise(t, 0.35, 0.2, 2500, 5000, d, 'highpass'); break;
      case 'rumble': tone(60, t, 0.45, 'sawtooth', 0.4, d, 35); noise(t, 0.4, 0.45, 300, 80, d, 'lowpass'); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.2, 0.4, 'triangle', 0.25, d)); break;
    }
  }
  return { cfg, init, apply, music, stop, play };
})();

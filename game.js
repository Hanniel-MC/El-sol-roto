'use strict';
/* ===== MOTOR DEL JUEGO: física, combate, niveles, dibujo ===== */
const GW = 960, GH = 540, GROUND = 450, GRAV = 2200;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let Q = 1, Mode = 'menu', W = null;
const scene = { world: 0, t: 0, big: false, f: { x: 230, y: GROUND - 62, w: 28, h: 62, face: 1, vx: 0, onG: true, t: 0, anim: 'idle', atkP: 0 } };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = (a, b) => a + Math.random() * (b - a);
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const CH = id => CHARS.find(c => c.id === id) || CHARS[0];
const vib = ms => { try { if (Save.set.vib && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
function setQuality(q) { Q = q; cv.width = GW * Q; cv.height = GH * Q; }
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ---------- tipos de enemigo ---------- */
const ET = {
  grunt:  { hp: 42,  spd: 80,  dmg: 9,  w: 28, h: 60, range: 58, wind: 0.5,  cd: 1.3, coin: 2, weapon: 'sword', pal: { body: '#3a1d1d', acc: '#c0392b', skin: '#caa07a', blade: '#bbb', hair: '#161010', eye: '#ff5a4a' } },
  archer: { hp: 30,  spd: 60,  dmg: 8,  w: 28, h: 60, range: 520, wind: 0.65, cd: 2.0, coin: 2, weapon: 'bow', pal: { body: '#1f3a24', acc: '#8bc34a', skin: '#caa07a', blade: '#8d6e63', hair: '#10180f', eye: '#d4ff6a' } },
  brute:  { hp: 120, spd: 52,  dmg: 20, w: 40, h: 76, range: 80, wind: 0.75, cd: 1.9, coin: 4, weapon: 'club', armor: true, pal: { body: '#33261c', acc: '#ff9800', skin: '#b98760', blade: '#6d4c41', hair: '#120c08', eye: '#ffb347' } },
  shadow: { hp: 54,  spd: 120, dmg: 11, w: 28, h: 60, range: 54, wind: 0.32, cd: 1.0, coin: 3, weapon: 'sword', pal: { body: '#241238', acc: '#a64bf4', skin: '#4a3566', blade: '#d9b3ff', hair: '#0c0616', eye: '#ff6bf0' } }
};
const POOLS = [['grunt'], ['grunt', 'archer'], ['grunt', 'archer', 'brute'], ['grunt', 'shadow', 'archer', 'brute'], ['grunt', 'shadow', 'archer', 'brute', 'shadow']];

/* ---------- generación procedural de niveles ---------- */
function buildLevel(idx) {
  const w = (idx / 3) | 0, n = idx % 3, boss = n === 2, R = mulberry(7919 * (idx + 3)), D = idx / 14;
  const L = { idx, w, n, boss, pl: [], en: [], coins: [], width: 0, gate: 0, arenaX: 0 };
  const addPl = (x, y, pw) => L.pl.push({ x, y, w: pw, h: GH - y });
  const target = boss ? 2000 : 3300 + n * 450 + w * 250;
  let x = 0, first = true;
  while (x < target) {
    if (!first) { const gw = 90 + R() * (45 + D * 45); const gx = x; for (let k = 0; k < 4; k++) L.coins.push({ x: gx + gw * (k + 0.5) / 4, y: GROUND - 70 - Math.sin((k + 0.5) / 4 * Math.PI) * 90 }); x += gw; }
    const cw = first ? 780 : 380 + R() * 420, gx = x;
    addPl(gx, GROUND, cw);
    if (first) { for (let k = 0; k < 5; k++) L.coins.push({ x: gx + 300 + k * 40, y: GROUND - 36 }); }
    else {
      const np = R() < 0.72 ? 1 + (R() < 0.4 ? 1 : 0) : 0;
      for (let i = 0; i < np; i++) {
        const pw = 130 + R() * 110, px = gx + 20 + R() * Math.max(10, cw - pw - 40), lv = R() < 0.62 ? 1 : 2, py = GROUND - (lv === 1 ? 112 : 220);
        addPl(px, py, pw);
        for (let k = 0; k < 3; k++) L.coins.push({ x: px + pw / 2 - 30 + k * 30, y: py - 34 });
        if (w >= 1 && R() < 0.4 + D * 0.3) L.en.push({ type: R() < 0.7 ? 'archer' : POOLS[w][0], x: px + pw / 2, y: py });
      }
      const ne = Math.min(5, Math.floor(1 + D * 2.6 + R() * 1.6 + w * 0.3));
      for (let i = 0; i < ne; i++) { const pool = POOLS[w], ex = gx + 90 + (cw - 180) * (i + R() * 0.7) / ne; L.en.push({ type: pool[(R() * pool.length) | 0], x: ex, y: GROUND }); }
      for (let k = 0; k < 3; k++) L.coins.push({ x: gx + cw * 0.3 + k * 36, y: GROUND - 36 });
    }
    x = gx + cw; first = false;
  }
  if (boss) {
    x += 110; L.arenaX = x; addPl(x, GROUND, GW + 220);
    addPl(x + 110, GROUND - 112, 170); addPl(x + GW - 280, GROUND - 112, 170); addPl(x + 400, GROUND - 220, 160);
    L.width = x + GW + 220;
    for (let k = 0; k < 4; k++) L.coins.push({ x: x + 420 + k * 34, y: GROUND - 256 });
  } else {
    x += 100; addPl(x, GROUND, 760); L.gate = x + 540; L.width = x + 760;
    L.en.push({ type: POOLS[w][0], x: x + 200, y: GROUND });
  }
  return L;
}

/* ---------- entidades ---------- */
function mkEnemy(type, x, y, idx) {
  const T = ET[type], dm = Save.set.diff;
  const hp = T.hp * (1 + idx * 0.09) * (dm < 1 ? 0.8 : dm > 1 ? 1.2 : 1);
  return { type, T, x: x - T.w / 2, y: y - T.h, w: T.w, h: T.h, vx: 0, vy: 0, face: -1, onG: false, hp, maxHp: hp, dmg: T.dmg * (1 + idx * 0.05) * dm,
    st: 'idle', stT: 0, cd: rand(0.3, 1), t: rand(0, 5), flash: 0, stun: 0, anim: 'idle', atkP: 0, dead: false, boss: false, didHit: false };
}
function mkBoss(w, x, idx) {
  const B = WORLDS[w].boss, dm = Save.set.diff, hp = B.hp * (dm < 1 ? 0.8 : dm > 1 ? 1.2 : 1);
  const T = { hp, spd: B.spd, dmg: B.dmg, w: 28 * B.sc, h: 62 * B.sc, range: 130, coin: 30, weapon: B.weapon, pal: B.pal, name: B.name };
  return { type: 'boss', T, x, y: GROUND - T.h, w: T.w, h: T.h, vx: 0, vy: 0, face: -1, onG: false, hp, maxHp: hp, dmg: B.dmg * dm,
    st: 'idle', stT: 0, stT0: 1, cd: 1.5, t: 0, flash: 0, stun: 0, anim: 'idle', atkP: 0, dead: false, boss: true, atks: B.atks, atk: '', didHit: false, p2: false };
}
function mkPlayer() {
  const c = CH(Save.sel), u = Save.up, maxHp = Math.round(c.hp * (1 + u.hp * 0.12)), mx = c.ammo + u.star;
  return { x: 80, y: GROUND - 62, w: 28, h: 62, vx: 0, vy: 0, face: 1, onG: false, hp: maxHp, maxHp, en: 0, ammo: mx, maxAmmo: mx, ammoT: 0, c,
    dmgMul: c.dmg * (1 + u.dmg * 0.12), enGain: 1 + u.en * 0.2, jumps: c.air, coyote: 0, jcut: false, atk: 0, atkD: 0.3, atkP: 0, combo: 0, comboT: 0,
    hitSet: new Set(), dash: 0, dashCD: 0, airDash: true, mdash: 0, mhit: new Set(), inv: 0, hurt: 0, thr: 0, spec: 0, t: 0, anim: 'idle', dead: false, sx: 80, sy: GROUND - 62 };
}
function startLevel(idx) {
  const L = buildLevel(idx);
  W = { L, idx, player: mkPlayer(), en: L.en.map(s => mkEnemy(s.type, s.x, s.y, idx)), pr: [], pk: L.coins.map(c => ({ x: c.x - 7, y: c.y - 7, w: 14, h: 14, vx: 0, vy: 0, k: 'coin', st: true })),
    parts: [], texts: [], ghosts: [], cam: 0, time: 0, shake: 0, hitstop: 0, state: 'play', lock: false, bossOn: false, kills: 0, coinsGot: 0, totalCoins: L.coins.length,
    banner: { t: 2.6, a: 'MUNDO ' + (L.w + 1) + '-' + (L.n + 1), b: WORLDS[L.w].name }, flash: 0, red: 0, endT: 0, winT: 0, frag: null, boss: null };
  if (L.boss) { W.boss = mkBoss(L.w, L.arenaX + GW - 230, idx); W.en.push(W.boss); }
  Input.reset(); Snd.music(WORLDS[L.w].music); if (window.syncButtons) syncButtons(true);
}

/* ---------- física ---------- */
function phys(b, dt) {
  b.x += b.vx * dt; const pb = b.y + b.h; b.y += b.vy * dt; b.onG = false;
  if (b.vy >= 0) {
    const nb = b.y + b.h;
    for (const pl of W.L.pl) if (b.x + b.w > pl.x && b.x < pl.x + pl.w && pb <= pl.y + 5 && nb >= pl.y) { b.y = pl.y - b.h; b.vy = 0; b.onG = true; break; }
  }
}
function support(x, fy) { for (const pl of W.L.pl) if (x > pl.x && x < pl.x + pl.w && pl.y >= fy - 6 && pl.y < fy + 130) return true; return false; }
function bounds() { const L = W.L; return W.lock ? [L.arenaX + 6, L.arenaX + GW - 6] : [0, L.width]; }
function moveE(e, dt) {
  phys(e, dt); const [a, b] = bounds(); let hitB = false;
  if (e.x < a) { e.x = a; hitB = true; } if (e.x + e.w > b) { e.x = b - e.w; hitB = true; }
  if (hitB) e.vx = 0;
  if (e.y > GH + 120 && !e.dead) { e.dead = true; e.fell = true; }
  return hitB;
}

/* ---------- efectos ---------- */
function spark(x, y, col, n = 6, sp = 260) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = rand(0.3, 1) * sp; W.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: rand(0.25, 0.5), max: 0.5, col, s: rand(2, 4.5) }); } }
function ftext(x, y, txt, col = '#fff') { W.texts.push({ x, y, txt, col, life: 0.8 }); }
function ghost(f, pal, weapon, life = 0.22) { W.ghosts.push({ f: { x: f.x, y: f.y, w: f.w, h: f.h, face: f.face, anim: f.anim, atkP: f.atkP, vx: f.vx, onG: f.onG, t: f.t }, pal, weapon, life, max: life, mode: 'after' }); }
function banner(a, b) { W.banner = { t: 2.4, a, b: b || '' }; }

/* ---------- combate ---------- */
function hurtPlayer(dmg, srcX, kb = 320) {
  const p = W.player; if (p.inv > 0 || p.dead || W.state !== 'play') return;
  p.hp -= dmg; p.inv = 0.9; p.hurt = 0.22; p.atk = 0; p.dash = 0; p.mdash = 0; p.vx = (p.x + p.w / 2 < srcX ? -1 : 1) * kb; p.vy = -320;
  W.shake = Math.max(W.shake, 0.25); W.red = 0.25; Snd.play('hurt'); vib(45); ftext(p.x + 10, p.y, '-' + Math.round(dmg), '#ff6b5a');
  spark(p.x + 14, p.y + 26, '#ff5a4a', 8);
  if (p.hp <= 0) { p.hp = 0; p.dead = true; p.vy = -520; p.vx = -p.face * 120; W.state = 'lose'; W.endT = 1.3; Snd.play('lose'); Save.deaths++; persist(); }
}
function damageEnemy(e, dmg, dirX, kb = 230, heavy = false) {
  if (e.dead) return; const p = W.player; dmg = Math.round(dmg); e.hp -= dmg; e.flash = 0.12;
  if (!e.boss) {
    if (!e.T.armor) { e.stun = heavy ? 0.45 : 0.25; e.vx = dirX * kb; e.vy = -170; e.st = 'chase'; e.cd = Math.max(e.cd, 0.5); } else e.vx = dirX * kb * 0.25;
  } else if (!e.p2 && e.hp < e.maxHp * 0.5) { e.p2 = true; banner('¡' + e.T.name + ' se enfurece!'); W.shake = 0.5; Snd.play('boss'); spark(e.x + e.w / 2, e.y + e.h / 2, '#ff6b5a', 24, 400); }
  spark(e.x + e.w / 2, e.y + e.h * 0.4, '#fff3c0', heavy ? 12 : 6); ftext(e.x + e.w / 2, e.y - 6, dmg, heavy ? '#ffd24a' : '#fff');
  p.en = Math.min(100, p.en + (e.boss ? 3 : 7) * p.enGain); W.hitstop = heavy ? 0.075 : 0.04; Snd.play(heavy ? 'hit2' : 'hit');
  if (e.hp <= 0) killEnemy(e, dirX);
}
function killEnemy(e, dirX) {
  e.dead = true; W.kills++; const T = e.T, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  W.ghosts.push({ f: { x: e.x, y: e.y, w: e.w, h: e.h, face: e.face, anim: 'hurt', atkP: 0, vx: 0, onG: false, t: e.t }, pal: T.pal, weapon: T.weapon, life: 0.7, max: 0.7, mode: 'die', vx: dirX * 260, vy: -380, rot: 0 });
  spark(cx, cy, T.pal.acc, e.boss ? 40 : 14, e.boss ? 500 : 300);
  for (let i = 0; i < T.coin; i++) W.pk.push({ x: cx - 7, y: cy - 7, w: 14, h: 14, vx: rand(-160, 160), vy: rand(-420, -200), k: 'coin', st: false });
  if (!e.boss && Math.random() < 0.13) W.pk.push({ x: cx - 9, y: cy - 9, w: 18, h: 18, vx: rand(-60, 60), vy: -300, k: 'heart', st: false });
  if (e.boss) {
    W.bossOn = false; W.winT = 2.6; W.hitstop = 0.25; W.shake = 0.8; W.flash = 0.8; Snd.play('win'); W.frag = { x: cx, y: cy - 20 }; W.player.inv = 999;
    for (const q of W.en) if (!q.dead && q !== e) { q.dead = true; spark(q.x + q.w / 2, q.y + q.h / 2, '#fff', 10); }
    W.pr = W.pr.filter(b => b.own !== 'e'); banner('¡' + e.T.name + ' derrotado!', 'Has recuperado un fragmento del Cristal');
  }
}
function aoe(x, y, r, dmg, kb, heavy) {
  for (const e of W.en) if (!e.dead && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < r + e.w / 2) { damageEnemy(e, dmg, e.x + e.w / 2 > x ? 1 : -1, kb, heavy); if (heavy && !e.boss) e.stun = 1.1; }
  W.pr = W.pr.filter(b => !(b.own === 'e' && b.kind !== 'wave' && Math.hypot(b.x - x, b.y - y) < r));
}
function addProj(o) { W.pr.push(Object.assign({ life: 3, hit: null, vy: 0 }, o)); }
function playerStrike(p) {
  const reach = p.c.id === 'ryu' ? 82 : 66, box = { x: p.face > 0 ? p.x + p.w - 6 : p.x + 6 - reach, y: p.y - 6, w: reach, h: p.h + 12 };
  const last = p.combo === 3;
  for (const e of W.en) if (!e.dead && !p.hitSet.has(e) && hit(box, e)) { p.hitSet.add(e); damageEnemy(e, (last ? 28 : 18) * p.dmgMul, p.face, last ? 420 : 230, last); }
  W.pr = W.pr.filter(b => { if (b.own === 'e' && b.kind !== 'wave' && hit(box, { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 })) { spark(b.x, b.y, '#fff', 5); Snd.play('hit'); p.en = Math.min(100, p.en + 4); return false; } return true; });
}
function doSpecial(p) {
  p.en = 0; p.spec = 0.5; W.flash = 0.35; W.shake = 0.5; Snd.play('special'); vib(120); const cx = p.x + p.w / 2, cy = p.y + 30, d = p.dmgMul;
  switch (p.c.id) {
    case 'kai': aoe(cx, cy, 330, 62 * d, 520, true); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; W.parts.push({ x: cx, y: cy, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 0.5, max: 0.5, col: '#fff2b0', s: 4 }); } break;
    case 'mei': p.mdash = 0.38; p.inv = 0.6; p.mhit = new Set(); p.atk = 0; break;
    case 'ryu': aoe(cx, GROUND - 20, 360, 78 * d, 420, true); for (const s of [-1, 1]) addProj({ own: 'p', kind: 'wave', x: cx, y: GROUND - 14, vx: s * 420, r: 20, dmg: 45 * d, life: 1.6, pierce: true }); spark(cx, GROUND, '#c9a27a', 30, 420); break;
    case 'sora': for (let i = -4; i <= 4; i++) { const a = (p.face > 0 ? 0 : Math.PI) + i * 0.16; addProj({ own: 'p', kind: 'star', x: cx, y: cy, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, r: 10, dmg: 30 * d, life: 1.4, pierce: true }); } break;
  }
}

/* ---------- jugador ---------- */
function updPlayer(p, dt) {
  const c = p.c; p.t += dt;
  if (p.dead) { p.vy += GRAV * dt; p.y += p.vy * dt; p.x += p.vx * dt; p.vx *= 0.97; p.anim = 'hurt'; return; }
  for (const k of ['inv', 'hurt', 'dashCD', 'thr', 'spec', 'comboT']) p[k] = Math.max(0, p[k] - dt);
  if (p.ammo < p.maxAmmo) { p.ammoT += dt; if (p.ammoT >= c.reg) { p.ammoT = 0; p.ammo++; } }
  const dir = (Input.held.right ? 1 : 0) - (Input.held.left ? 1 : 0), ctrl = p.hurt <= 0 && p.dash <= 0 && p.mdash <= 0;
  if (p.dash > 0) { p.dash -= dt; p.vx = p.face * 720; p.vy = 0; if (Math.random() < 0.8) ghost(p, c.pal, c.weapon, 0.18); if (p.dash <= 0) p.vx *= 0.3; }
  else if (p.mdash > 0) {
    p.mdash -= dt; p.vx = p.face * 1500; p.vy = 0; ghost(p, c.pal, c.weapon, 0.25);
    const box = { x: p.x - 20, y: p.y - 10, w: p.w + 40, h: p.h + 20 };
    for (const e of W.en) if (!e.dead && !p.mhit.has(e) && hit(box, e)) { p.mhit.add(e); damageEnemy(e, 55 * p.dmgMul, p.face, 300, true); }
    if (p.mdash <= 0) p.vx *= 0.15;
  } else if (ctrl) {
    const slow = p.atk > 0 ? 0.35 : 1, tgt = dir * 300 * c.spd * slow, acc = p.onG ? 3400 : 2100;
    p.vx += clamp(tgt - p.vx, -acc * dt, acc * dt);
    if (dir && p.atk <= 0) p.face = dir;
    if ((p.coyote > 0 || p.jumps > 0) && Input.take('jump')) { if (p.coyote <= 0) p.jumps--; p.vy = -830 * c.jump; p.coyote = 0; p.jcut = false; p.onG = false; Snd.play('jump'); spark(p.x + 14, p.y + p.h, '#ddd', 4, 120); }
    if (p.vy < -280 && !Input.held.jump && !p.jcut) { p.vy *= 0.5; p.jcut = true; }
    if (p.dashCD <= 0 && (p.onG || p.airDash) && Input.take('dash')) { p.dash = 0.18; p.dashCD = 1.0; p.inv = Math.max(p.inv, 0.28); if (!p.onG) p.airDash = false; if (dir) p.face = dir; p.atk = 0; Snd.play('dash'); }
    else if (p.atk <= 0 && Input.take('attack')) {
      p.combo = p.comboT > 0 ? (p.combo % 3) + 1 : 1; p.atkD = p.atk = (p.combo === 3 ? 0.4 : 0.28) / c.rate; p.hitSet = new Set();
      if (dir) p.face = dir; p.vx += p.face * (p.onG ? 130 + p.combo * 40 : 60); Snd.play('swing');
    }
    else if (p.thr <= 0 && p.ammo > 0 && Input.take('throw')) { p.ammo--; p.thr = 0.28; p.ammoT = 0; addProj({ own: 'p', kind: 'star', x: p.x + p.w / 2 + p.face * 16, y: p.y + 24, vx: p.face * 780, r: 9, dmg: 16 * p.dmgMul, life: 1.1 }); Snd.play('throw'); }
    else if (p.en >= 100 && Input.take('special')) doSpecial(p);
  }
  if (p.atk > 0) { p.atk -= dt; const pr = 1 - p.atk / p.atkD; p.atkP = clamp(pr, 0, 1); if (pr > 0.22 && pr < 0.72) playerStrike(p); if (p.atk <= 0) { p.comboT = 0.5; p.atkP = 0; } }
  if (p.dash <= 0 && p.mdash <= 0) p.vy = Math.min(1150, p.vy + GRAV * dt);
  phys(p, dt);
  if (p.onG) { p.coyote = 0.1; p.jumps = c.air; p.airDash = true; for (const pl of W.L.pl) if (p.y + p.h === pl.y && p.x > pl.x + 30 && p.x + p.w < pl.x + pl.w - 30) { p.sx = p.x; p.sy = p.y; break; } }
  else p.coyote = Math.max(0, p.coyote - dt);
  const [a, b] = bounds(); p.x = clamp(p.x, a, b - p.w);
  if (p.y > GH + 80) { p.x = p.sx; p.y = p.sy - 4; p.vx = p.vy = 0; p.inv = 0; hurtPlayer(14, p.x + 14, 0); p.inv = 1.4; }
  p.anim = p.hurt > 0 ? 'hurt' : p.dash > 0 || p.mdash > 0 ? 'dash' : p.atk > 0 ? 'atk' : !p.onG ? 'air' : Math.abs(p.vx) > 40 ? 'run' : 'idle';
}

/* ---------- enemigos ---------- */
function updEnemy(e, dt) {
  const p = W.player, T = e.T; e.t += dt; e.flash = Math.max(0, e.flash - dt); e.cd -= dt; e.vy = Math.min(1150, e.vy + GRAV * dt);
  const dx = p.x + p.w / 2 - (e.x + e.w / 2), ad = Math.abs(dx), dir = dx >= 0 ? 1 : -1;
  if (e.stun > 0) { e.stun -= dt; e.vx *= Math.pow(0.02, dt); moveE(e, dt); e.anim = 'hurt'; return; }
  if (e.boss) return updBoss(e, dt, dx, ad, dir);
  let want = 0;
  switch (e.st) {
    case 'idle': e.vx = 0; e.anim = 'idle'; if (ad < 640 && !p.dead && Math.abs(p.y - e.y) < 320) e.st = 'chase'; break;
    case 'chase':
      e.face = dir; e.anim = 'run';
      if (e.type === 'archer') { if (ad < 230) want = -dir; else if (ad > 400) want = dir; else e.anim = 'idle'; if (e.cd <= 0 && ad < 540) { e.st = 'wind'; e.stT = T.wind; } }
      else {
        want = dir;
        if (e.type === 'shadow' && ad > 200 && ad < 430 && e.cd <= 0) { e.st = 'dash'; e.stT = 0.4; e.didHit = false; }
        else if (ad < T.range && Math.abs(p.y + p.h - (e.y + e.h)) < 60 && e.cd <= 0) { e.st = 'wind'; e.stT = T.wind; }
        else if (ad < T.range * 0.8) { want = 0; e.anim = 'idle'; }
      }
      e.vx = want * T.spd; if (want && e.onG && !support(e.x + e.w / 2 + want * 28, e.y + e.h)) e.vx = 0; break;
    case 'wind':
      e.vx = 0; e.anim = 'wind'; e.face = dir; e.stT -= dt; e.atkP = 1 - e.stT / T.wind;
      if (e.stT <= 0) {
        if (e.type === 'archer') { addProj({ own: 'e', kind: 'arrow', x: e.x + e.w / 2 + e.face * 20, y: e.y + 24, vx: e.face * 390, r: 7, dmg: e.dmg, life: 2.4 }); Snd.play('throw'); e.st = 'rec'; e.stT = 0.4; e.cd = T.cd; }
        else { e.st = 'strike'; e.stT = 0.16; e.didHit = false; e.atkP = 0; Snd.play('swing'); }
      } break;
    case 'strike': {
      e.anim = 'atk'; e.stT -= dt; e.atkP = 1 - e.stT / 0.16; const reach = T.range + 8;
      if (!e.didHit && hit({ x: e.face > 0 ? e.x + e.w : e.x - reach, y: e.y, w: reach, h: e.h }, p)) { e.didHit = true; hurtPlayer(e.dmg, e.x + e.w / 2); }
      if (e.stT <= 0) { e.st = 'rec'; e.stT = 0.35; e.cd = T.cd; } break; }
    case 'dash':
      e.vx = e.face * 440; e.anim = 'run'; e.stT -= dt; if (!e.didHit && hit(e, p)) { e.didHit = true; hurtPlayer(e.dmg, e.x + e.w / 2); }
      if (e.stT <= 0 || (e.onG && !support(e.x + e.w / 2 + e.face * 30, e.y + e.h))) { e.st = 'rec'; e.stT = 0.35; e.cd = T.cd * 1.3; } break;
    case 'rec': e.vx = 0; e.anim = 'idle'; e.stT -= dt; if (e.stT <= 0) e.st = 'chase'; break;
  }
  moveE(e, dt);
}
function updBoss(e, dt, dx, ad, dir) {
  const p = W.player, T = e.T, ph = e.hp < e.maxHp * 0.5 ? 1 : 0, sp = 1 + ph * 0.25;
  if (!W.bossOn || p.dead) { e.vx = 0; e.anim = 'idle'; e.face = dir; moveE(e, dt); return; }
  switch (e.st) {
    case 'idle': case 'chase':
      e.st = 'chase'; e.face = dir; e.anim = ad > 140 ? 'run' : 'idle'; e.vx = ad > 140 ? dir * T.spd * sp : 0;
      if (e.cd <= 0) { e.atk = (ad < 160 && Math.random() < 0.5) ? 'swing' : e.atks[(Math.random() * e.atks.length) | 0]; e.st = 'wind'; e.stT = e.stT0 = (e.atk === 'swing' ? 0.4 : 0.75) / sp; e.vx = 0; }
      break;
    case 'wind': e.vx = 0; e.anim = 'wind'; e.face = dir; e.stT -= dt; e.atkP = 1 - e.stT / e.stT0; if (e.stT <= 0) bossGo(e, dir, ph); break;
    case 'strike': {
      e.anim = 'atk'; e.stT -= dt; e.atkP = 1 - e.stT / e.stT0; const reach = 140;
      if (!e.didHit && hit({ x: e.face > 0 ? e.x + e.w - 10 : e.x - reach + 10, y: e.y, w: reach, h: e.h }, p)) { e.didHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, 420); }
      if (e.stT <= 0) { e.st = 'rec'; e.stT = 0.6; } break; }
    case 'charge': e.anim = 'run'; e.stT -= dt; if (!e.didHit && hit(e, p)) { e.didHit = true; hurtPlayer(e.dmg * 1.1, e.x + e.w / 2, 480); } if (e.stT <= 0 || e.vx === 0) { e.st = 'rec'; e.stT = 0.7; e.vx = 0; } break;
    case 'air': e.anim = 'air'; e.stT += dt; if (e.onG && e.stT > 0.2) { e.vx = 0; W.shake = 0.5; Snd.play('hit2'); for (const s of [-1, 1]) addProj({ own: 'e', kind: 'wave', x: e.x + e.w / 2, y: GROUND - 14, vx: s * 330, r: 20, dmg: e.dmg * 0.8, life: 2.6 }); spark(e.x + e.w / 2, GROUND, '#ddd', 16, 360); e.st = 'rec'; e.stT = 0.8; } break;
    case 'rec': e.vx *= Math.pow(0.01, dt); e.anim = 'idle'; e.stT -= dt; if (e.stT <= 0) { e.st = 'chase'; e.cd = (1.3 - ph * 0.4) * rand(0.8, 1.2); } break;
  }
  if (moveE(e, dt) && e.st === 'charge') { e.st = 'rec'; e.stT = 0.7; W.shake = 0.3; }
}
function bossGo(e, dir, ph) {
  const p = W.player;
  switch (e.atk) {
    case 'swing': e.st = 'strike'; e.stT = e.stT0 = 0.22; e.didHit = false; Snd.play('swing'); break;
    case 'charge': e.st = 'charge'; e.stT = 0.8; e.vx = dir * (480 + ph * 120); e.didHit = false; Snd.play('dash'); break;
    case 'fan': { const n = 3 + ph * 2, a0 = Math.atan2(p.y + 30 - (e.y + e.h * 0.4), p.x - e.x); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.3; addProj({ own: 'e', kind: 'orb', x: e.x + e.w / 2, y: e.y + e.h * 0.4, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 11, dmg: e.dmg * 0.6, life: 3 }); } Snd.play('boss'); e.st = 'rec'; e.stT = 0.7; break; }
    case 'slam': e.vy = -900; e.vx = clamp(p.x - e.x, -380, 380) * 1.1; e.st = 'air'; e.stT = 0; break;
    case 'summon': { const cnt = W.en.filter(q => !q.dead && !q.boss).length; if (cnt < 4) for (const s of [-1, 1]) { const m = mkEnemy('shadow', clamp(e.x + e.w / 2 + s * 140, W.L.arenaX + 40, W.L.arenaX + GW - 40), GROUND, W.idx); m.st = 'chase'; W.en.push(m); spark(m.x + 14, m.y + 30, '#c86bff', 14); } Snd.play('boss'); e.st = 'rec'; e.stT = 0.9; break; }
    case 'blink': { spark(e.x + e.w / 2, e.y + e.h / 2, '#c86bff', 18); const nx = clamp(p.x - p.face * 110, W.L.arenaX + 20, W.L.arenaX + GW - 20 - e.w); e.x = nx; e.y = GROUND - e.h; e.face = p.x > e.x ? 1 : -1; spark(e.x + e.w / 2, e.y + e.h / 2, '#c86bff', 18); e.st = 'strike'; e.stT = e.stT0 = 0.3; e.didHit = false; Snd.play('swing'); break; }
  }
}
function updProj(dt) {
  const p = W.player;
  for (const b of W.pr) {
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.kind === 'wave') b.y = GROUND - 14;
    if (b.own === 'e') {
      if (!p.dead && p.inv <= 0) {
        const near = Math.abs(b.x - (p.x + p.w / 2)) < b.r + p.w / 2 && (b.kind === 'wave' ? p.y + p.h > GROUND - 28 : Math.abs(b.y - (p.y + p.h / 2)) < b.r + p.h / 2);
        if (near) { hurtPlayer(b.dmg, b.x); if (b.kind !== 'wave') b.life = 0; }
      }
    } else for (const e of W.en) {
      if (e.dead || (b.hit && b.hit.has(e))) continue;
      const near = Math.abs(b.x - (e.x + e.w / 2)) < b.r + e.w / 2 && (b.kind === 'wave' ? e.y + e.h > GROUND - 28 : Math.abs(b.y - (e.y + e.h / 2)) < b.r + e.h / 2);
      if (near) { damageEnemy(e, b.dmg, b.vx > 0 ? 1 : -1, 200, b.kind === 'wave'); if (b.pierce) { if (!b.hit) b.hit = new Set(); b.hit.add(e); } else { b.life = 0; break; } }
    }
  }
  W.pr = W.pr.filter(b => b.life > 0 && b.x > -200 && b.x < W.L.width + 200);
}
function updPickups(dt) {
  const p = W.player;
  for (const c of W.pk) {
    if (!c.st) { c.vy += GRAV * 0.7 * dt; phys(c, dt); if (c.onG) { c.vx *= 0.9; } }
    const dx = p.x + p.w / 2 - (c.x + c.w / 2), dy = p.y + p.h / 2 - (c.y + c.h / 2), d = Math.hypot(dx, dy);
    if (!p.dead && d < 120 && (c.st || c.onG || c.vy > -50)) { c.st = true; c.x += dx / d * 520 * dt; c.y += dy / d * 520 * dt; }
    if (!p.dead && hit(p, c)) {
      c.got = true;
      if (c.k === 'coin') { Save.coins++; W.coinsGot++; Snd.play('coin'); } else { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25); Snd.play('heal'); ftext(p.x, p.y - 6, '+HP', '#7dff9a'); spark(p.x + 14, p.y + 30, '#7dff9a', 8); }
    }
    if (c.y > GH + 100) c.got = true;
  }
  W.pk = W.pk.filter(c => !c.got);
}

/* ---------- actualización general ---------- */
function update(dt) {
  const w = W, p = w.player, L = w.L;
  if (w.hitstop > 0) { w.hitstop -= dt; return; }
  w.time += dt; w.shake = Math.max(0, w.shake - dt); w.flash = Math.max(0, w.flash - dt); w.red = Math.max(0, w.red - dt); if (w.banner.t > 0) w.banner.t -= dt;
  updPlayer(p, dt);
  if (w.state !== 'lose') {
    if (L.boss && !w.lock && p.x > L.arenaX + 150) { w.lock = true; w.bossOn = true; banner(w.boss.T.name.toUpperCase(), WORLDS[L.w].boss.title); Snd.play('boss'); Snd.music('boss'); w.shake = 0.4; }
    for (const e of w.en) if (!e.dead && Math.abs(e.x - p.x) < 1500) updEnemy(e, dt);
    w.en = w.en.filter(e => !e.dead || false);
  }
  updProj(dt); updPickups(dt);
  for (const q of w.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 700 * dt; } w.parts = w.parts.filter(q => q.life > 0);
  for (const t of w.texts) { t.life -= dt; t.y -= 40 * dt; } w.texts = w.texts.filter(t => t.life > 0);
  for (const g of w.ghosts) { g.life -= dt; if (g.mode === 'die') { g.vy += 1500 * dt; g.f.x += g.vx * dt; g.f.y += g.vy * dt; g.rot += dt * 8 * Math.sign(g.vx || 1); } } w.ghosts = w.ghosts.filter(g => g.life > 0);
  const tgt = w.lock ? L.arenaX : clamp(p.x + p.w / 2 - GW * 0.42, 0, L.width - GW);
  w.cam += (tgt - w.cam) * Math.min(1, dt * 7);
  if (w.state === 'play') {
    if (!L.boss && p.x + p.w > L.gate && !p.dead) { w.state = 'win'; w.endT = 0.9; p.inv = 999; Snd.play('win'); spark(L.gate + 20, GROUND - 60, '#ffe08a', 30, 400); w.flash = 0.4; }
    if (L.boss && w.winT > 0) { w.winT -= dt; if (w.winT <= 0) { w.state = 'win'; w.endT = 0.5; } }
  }
  if (w.state === 'win' || w.state === 'lose') { w.endT -= dt; if (w.endT <= 0) { const s = w.state; w.state = 'ended'; if (s === 'win') winLevel(); else loseLevel(); } }
}

/* ===================== DIBUJO ===================== */
function ridge(par, base, amp, col, f, off, cam) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, GH);
  for (let x = 0; x <= GW + 16; x += 16) { const wx = x + cam * par; ctx.lineTo(x, base - (Math.sin(wx * f + off) * 0.5 + Math.sin(wx * f * 2.3 + off * 2) * 0.3 + Math.sin(wx * f * 0.4) * 0.4 + 1) * amp); }
  ctx.lineTo(GW, GH); ctx.fill();
}
function drawDeco(wi, cam, t) {
  const par = 0.5, step = 170, i0 = Math.floor(cam * par / step) - 1;
  for (let i = i0; i < i0 + 8; i++) {
    const x = i * step - cam * par, r = hash(i + wi * 50), r2 = hash(i * 3 + wi);
    ctx.save();
    switch (wi) {
      case 0: ctx.strokeStyle = '#1a5a45'; ctx.lineWidth = 9; { const hh = 160 + r * 190, sw = Math.sin(t + i) * 5; ctx.beginPath(); ctx.moveTo(x, GROUND + 10); ctx.quadraticCurveTo(x + sw, GROUND - hh / 2, x + sw * 1.8, GROUND - hh); ctx.stroke(); ctx.strokeStyle = '#0f3a2c'; ctx.lineWidth = 3; for (let k = 1; k < 5; k++) { const yy = GROUND - hh * k / 5; ctx.beginPath(); ctx.moveTo(x - 6 + sw * k / 3, yy); ctx.lineTo(x + 6 + sw * k / 3, yy); ctx.stroke(); } } break;
      case 1: { const hw = 80 + r * 40, hh = 60 + r2 * 40; ctx.fillStyle = '#17123a'; ctx.fillRect(x, GROUND - hh, hw, hh + 10); ctx.beginPath(); ctx.moveTo(x - 12, GROUND - hh); ctx.lineTo(x + hw / 2, GROUND - hh - 38); ctx.lineTo(x + hw + 12, GROUND - hh); ctx.fill(); ctx.fillStyle = '#ffd36b'; ctx.globalAlpha = 0.65 + Math.sin(t * 3 + i) * 0.2; ctx.fillRect(x + hw * 0.25, GROUND - hh * 0.65, 14, 16); ctx.fillRect(x + hw * 0.6, GROUND - hh * 0.65, 14, 16); } break;
      case 2: { const hh = 90 + r * 150; ctx.fillStyle = r2 > 0.5 ? '#2fb9c9' : '#8a6bf0'; ctx.globalAlpha = 0.6 + Math.sin(t * 2 + i) * 0.15; ctx.beginPath(); ctx.moveTo(x - 26, GROUND + 10); ctx.lineTo(x - 6, GROUND - hh); ctx.lineTo(x + 8, GROUND - hh * 0.8); ctx.lineTo(x + 30, GROUND + 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(x - 6, GROUND - hh); ctx.lineTo(x + 8, GROUND - hh * 0.8); ctx.lineTo(x, GROUND); ctx.fill(); } break;
      case 3: { const hh = 110 + r * 160; ctx.fillStyle = '#1c0a08'; ctx.beginPath(); ctx.moveTo(x - 40, GROUND + 10); ctx.lineTo(x - 8 + r2 * 16, GROUND - hh); ctx.lineTo(x + 44, GROUND + 10); ctx.fill(); ctx.fillStyle = '#ff6a2a'; ctx.globalAlpha = 0.5 + Math.sin(t * 4 + i) * 0.2; ctx.fillRect(x - 6, GROUND - hh * 0.4, 3, hh * 0.4); } break;
      case 4: { const yy = 150 + r * 200 + Math.sin(t * 0.8 + i) * 8; ctx.fillStyle = '#3c2f7a'; ctx.beginPath(); ctx.ellipse(x, yy, 70, 18, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = '#251d55'; ctx.beginPath(); ctx.moveTo(x - 50, yy + 4); ctx.lineTo(x, yy + 50); ctx.lineTo(x + 50, yy + 4); ctx.fill(); ctx.fillStyle = '#4b3c96'; ctx.fillRect(x - 10, yy - 38, 20, 38); ctx.beginPath(); ctx.moveTo(x - 16, yy - 38); ctx.lineTo(x, yy - 58); ctx.lineTo(x + 16, yy - 38); ctx.fill(); } break;
    }
    ctx.restore();
  }
}
function drawFX(wi, cam, t) {
  const kind = WORLDS[wi].fx; ctx.save();
  for (let k = 0; k < 26; k++) {
    const r = hash(k + wi * 31), r2 = hash(k * 7 + 3); let x = ((r * GW * 2 - cam * (0.7 + r2 * 0.5) + t * (kind === 'ember' ? 10 : 25 * r2)) % (GW + 40) + (GW + 40)) % (GW + 40) - 20, y;
    switch (kind) {
      case 'petal': y = (r2 * GH + t * (30 + r * 30)) % GH; x += Math.sin(t * 2 + k) * 14; ctx.fillStyle = 'rgba(255,190,200,.7)'; ctx.beginPath(); ctx.ellipse(x, y, 4, 2, t + k, 0, 6.3); ctx.fill(); break;
      case 'firefly': y = 200 + r2 * 250 + Math.sin(t + k) * 18; ctx.fillStyle = 'rgba(255,240,140,' + (0.4 + Math.sin(t * 3 + k) * 0.35) + ')'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 6.3); ctx.fill(); break;
      case 'mote': y = (r2 * GH - t * (12 + r * 14) + GH * 4) % GH; ctx.fillStyle = 'rgba(150,240,255,' + (0.3 + r * 0.4) + ')'; ctx.fillRect(x, y, 3, 3); break;
      case 'ember': y = (GH - ((r2 * GH + t * (40 + r * 50)) % GH)); ctx.fillStyle = 'rgba(255,' + (120 + r * 80 | 0) + ',40,.8)'; ctx.fillRect(x + Math.sin(t * 2 + k) * 8, y, 3, 3); break;
      case 'cloud': y = 40 + r2 * 420; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(x, y, 60 + r * 40, 10, 0, 0, 6.3); ctx.fill(); break;
    }
  }
  ctx.restore();
}
function drawBG(wi, cam, t) {
  const Wd = WORLDS[wi], g = ctx.createLinearGradient(0, 0, 0, GH); g.addColorStop(0, Wd.sky[0]); g.addColorStop(1, Wd.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH);
  if (wi === 1 || wi === 2 || wi === 4) { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.25; ctx.fillRect(hash(i) * GW, hash(i + 9) * 260, 2, 2); } ctx.globalAlpha = 1; }
  const sx = 700 - cam * 0.02 % 300, sy = 140; const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 130); sg.addColorStop(0, Wd.sun); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.globalAlpha = 0.55; ctx.fillRect(sx - 140, sy - 140, 280, 280); ctx.globalAlpha = 1;
  ctx.fillStyle = Wd.sun; ctx.beginPath(); ctx.arc(sx, sy, 48, 0, 6.3); ctx.fill();
  ctx.strokeStyle = Wd.sky[0]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 10, sy - 48); ctx.lineTo(sx + 4, sy - 20); ctx.lineTo(sx - 8, sy - 2); ctx.lineTo(sx + 12, sy + 22); ctx.lineTo(sx + 2, sy + 48); ctx.stroke();
  ridge(0.08, 380, 110, Wd.far, 0.006, 1, cam); ridge(0.18, 430, 80, Wd.mid, 0.009, 4, cam);
  drawDeco(wi, cam, t); ridge(0.3, 500, 50, Wd.near, 0.014, 8, cam); drawFX(wi, cam, t);
}
function limb(x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function drawFighter(f, pal, weapon, alpha, flash) {
  const s = f.h / 62, cx = f.x + f.w / 2, fy = f.y + f.h, t = f.t || 0, an = f.anim || 'idle', body = flash ? '#fff' : pal.body, acc = flash ? '#fff' : pal.acc;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = 'rgba(0,0,0,.25)'; if (f.onG) { ctx.beginPath(); ctx.ellipse(cx, fy, 18 * s, 4 * s, 0, 0, 6.3); ctx.fill(); }
  ctx.translate(cx, fy); ctx.scale(f.face * s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const moving = an === 'run', air = an === 'air', ph = t * 12, bob = an === 'idle' ? Math.sin(t * 3) * 1.3 : 0, hipY = -27 + bob;
  let sh = [moving ? 4 : an === 'atk' ? 4 : 0, -47 + bob]; if (an === 'dash') sh = [10, -42]; if (an === 'hurt') sh = [-5, -46];
  const legs = a => { const kx = Math.sin(a) * 13 + 2, ky = hipY + Math.cos(a) * 13; return [kx, ky, Math.sin(a) * 26, Math.min(0, hipY + Math.cos(a) * 26)]; };
  const a1 = air ? 0.6 : moving ? Math.sin(ph) * 0.9 : an === 'dash' ? 1.0 : 0.14, a2 = air ? -0.4 : moving ? -Math.sin(ph) * 0.9 : an === 'dash' ? -0.9 : -0.14;
  let l = legs(a2); ctx.globalAlpha = alpha * 0.8; ctx.strokeStyle = body; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke(); ctx.globalAlpha = alpha;
  limb(0, hipY, sh[0], sh[1], 11, body); limb(-5, hipY - 2, 5, hipY - 2, 4, acc);
  l = legs(a1); ctx.strokeStyle = body; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke();
  const bx = sh[0] - 6 + (moving ? Math.sin(ph) * 5 : 0); ctx.globalAlpha = alpha * 0.8; limb(sh[0], sh[1], bx, sh[1] + 15, 6, body); ctx.globalAlpha = alpha;
  const hx = sh[0] + 2, hy = sh[1] - 10;
  ctx.strokeStyle = acc; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sh[0] - 2, sh[1] - 3); for (let i = 1; i <= 6; i++) ctx.lineTo(sh[0] - 2 - i * 6 - ((moving || air || an === 'dash') ? i * 2.5 : 0), sh[1] - 3 + Math.sin(t * 9 - i * 0.9) * (2 + i * 0.6) + (air ? i * 1.3 : 0)); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : pal.hair; ctx.beginPath(); ctx.arc(hx - 1, hy, 9, 0, 6.3); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : pal.skin; ctx.beginPath(); ctx.ellipse(hx + 3.5, hy + 1.5, 5.6, 4, 0, 0, 6.3); ctx.fill();
  limb(hx - 9, hy - 3, hx + 9, hy - 4, 3, acc);
  ctx.fillStyle = pal.eye || '#fff'; ctx.fillRect(hx + 3, hy - 0.5, 3.5, 3); ctx.fillStyle = '#111'; ctx.fillRect(hx + 5, hy, 1.8, 2.4);
  let wang, aang;
  if (an === 'atk') { const pr = f.atkP, e = pr < 0.5 ? 2 * pr * pr : 1 - 2 * (1 - pr) * (1 - pr); wang = -2.5 + 3.5 * e; aang = wang; }
  else if (an === 'wind') { wang = -2.3; aang = -2.0; } else if (an === 'dash') { wang = -0.15; aang = -0.1; } else if (weapon === 'bow') { wang = 0; aang = 0; } else { wang = moving ? -0.9 + Math.sin(ph) * 0.15 : -0.7; aang = 0.9; }
  const hdx = sh[0] + Math.cos(aang) * 15, hdy = sh[1] + Math.sin(aang) * 15;
  if (an === 'atk' && f.atkP > 0.15 && f.atkP < 0.8) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(sh[0], sh[1], weapon === 'hammer' ? 54 : 44, wang - 1.4, wang); ctx.stroke(); }
  limb(sh[0], sh[1], hdx, hdy, 6, body); ctx.fillStyle = flash ? '#fff' : pal.skin; ctx.beginPath(); ctx.arc(hdx, hdy, 3.4, 0, 6.3); ctx.fill();
  const ux = Math.cos(wang), uy = Math.sin(wang);
  if (weapon === 'sword' || weapon === 'blade') { const L = weapon === 'blade' ? 48 : 36; limb(hdx - ux * 4, hdy - uy * 4, hdx + ux * L, hdy + uy * L, weapon === 'blade' ? 6 : 4, flash ? '#fff' : pal.blade); limb(hdx + ux * 2 - uy * 5, hdy + uy * 2 + ux * 5, hdx + ux * 2 + uy * 5, hdy + uy * 2 - ux * 5, 3, acc); }
  else if (weapon === 'club' || weapon === 'hammer') { const L = weapon === 'hammer' ? 40 : 32; limb(hdx - ux * 5, hdy - uy * 5, hdx + ux * L, hdy + uy * L, 5, '#6d4c41'); limb(hdx + ux * (L - 4), hdy + uy * (L - 4), hdx + ux * (L + 12), hdy + uy * (L + 12), weapon === 'hammer' ? 17 : 12, flash ? '#fff' : pal.blade); }
  else if (weapon === 'bow') { ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hdx + 2, hdy, 17, -1.25, 1.25); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; const pull = an === 'wind' ? 8 * f.atkP : 0; ctx.beginPath(); ctx.moveTo(hdx + 2 + 17 * Math.cos(-1.25), hdy + 17 * Math.sin(-1.25)); ctx.lineTo(hdx - pull, hdy); ctx.lineTo(hdx + 2 + 17 * Math.cos(1.25), hdy + 17 * Math.sin(1.25)); ctx.stroke(); }
  ctx.restore();
  if (an === 'wind' && f.type !== undefined) { ctx.save(); ctx.fillStyle = '#ff4b3a'; ctx.font = 'bold ' + (20 * s | 0) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', cx, f.y - 8); ctx.restore(); }
}
function drawProj(b) {
  ctx.save(); ctx.translate(b.x, b.y);
  switch (b.kind) {
    case 'star': ctx.rotate(W.time * 20); ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 11, a = i / 8 * 6.28; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); break;
    case 'arrow': ctx.rotate(b.vx < 0 ? Math.PI : 0); ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(19, 0); ctx.lineTo(12, 4); ctx.fill(); break;
    case 'orb': { const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 16); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#ff6bd6'); g.addColorStop(1, 'rgba(255,60,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.3); ctx.fill(); break; }
    case 'wave': ctx.scale(Math.sign(b.vx) || 1, 1); { const g = ctx.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(1, 'rgba(255,230,160,.95)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-26, 14); ctx.quadraticCurveTo(10, 14, 18, -22); ctx.quadraticCurveTo(22, 4, 22, 14); ctx.fill(); } break;
  }
  ctx.restore();
}
function drawPlatforms(cam) {
  const Wd = WORLDS[W.L.w];
  for (const pl of W.L.pl) {
    if (pl.x + pl.w < cam - 20 || pl.x > cam + GW + 20) continue;
    if (pl.y >= GROUND) { const g = ctx.createLinearGradient(0, pl.y, 0, GH); g.addColorStop(0, Wd.plat[0]); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); ctx.fillStyle = Wd.plat[1]; ctx.fillRect(pl.x, pl.y, pl.w, 7); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(pl.x, pl.y + 7, pl.w, 2); }
    else { ctx.fillStyle = Wd.plat[0]; ctx.fillRect(pl.x, pl.y, pl.w, 16); ctx.fillStyle = Wd.plat[1]; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, 6); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(pl.x + 6, pl.y + 16, 8, 8); ctx.fillRect(pl.x + pl.w - 14, pl.y + 16, 8, 8); }
  }
}
function drawGate(cam) {
  const L = W.L; if (L.boss) return; const x = L.gate, t = W.time;
  const g = ctx.createLinearGradient(0, GROUND - 150, 0, GROUND); g.addColorStop(0, 'rgba(255,230,150,0)'); g.addColorStop(1, 'rgba(255,230,150,' + (0.5 + Math.sin(t * 3) * 0.15) + ')'); ctx.fillStyle = g; ctx.fillRect(x - 48, GROUND - 150, 96, 150);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 56, GROUND - 160, 10, 160); ctx.fillRect(x + 46, GROUND - 160, 10, 160); ctx.fillRect(x - 74, GROUND - 170, 148, 12); ctx.fillRect(x - 62, GROUND - 146, 124, 7);
}
function drawHUD() {
  const p = W.player, L = W.L; ctx.save();
  const bar = (x, y, w, h, r, c1, c2) => { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillStyle = c2; ctx.fillRect(x, y, w, h); ctx.fillStyle = c1; ctx.fillRect(x, y, w * clamp(r, 0, 1), h); };
  bar(20, 16, 240, 16, p.hp / p.maxHp, '#e0463a', '#4a1512'); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(Math.ceil(p.hp) + ' / ' + p.maxHp, 28, 29);
  const ready = p.en >= 100; bar(20, 40, 190, 11, p.en / 100, ready ? '#ffd24a' : '#4aa8ff', '#16263f'); if (ready) { ctx.fillStyle = '#ffd24a'; ctx.fillText('¡ESPECIAL LISTO!', 218, 50); }
  for (let i = 0; i < p.maxAmmo; i++) { ctx.fillStyle = i < p.ammo ? '#e8f6ff' : 'rgba(255,255,255,.2)'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 2.5 : 6.5, a = k / 8 * 6.28; ctx.lineTo(30 + i * 17 + Math.cos(a) * r, 66 + Math.sin(a) * r); } ctx.fill(); }
  ctx.textAlign = 'right'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#ffd24a'; ctx.fillText('● ' + Save.coins, GW - 70, 30); ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif'; ctx.fillText((L.w + 1) + '-' + (L.n + 1) + ' · ' + WORLDS[L.w].name, GW - 70, 50);
  if (W.boss && W.bossOn) { const b = W.boss, bw = 360, bx = (GW - bw) / 2; bar(bx, 22, bw, 14, b.hp / b.maxHp, '#b14bff', '#2a1040'); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(b.T.name + ' · ' + WORLDS[L.w].boss.title, GW / 2, 56); }
  if (W.banner.t > 0) { const a = clamp(W.banner.t / 0.6, 0, 1); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 150, GW, 90); ctx.fillStyle = '#ffd9a0'; ctx.font = 'bold 40px sans-serif'; ctx.fillText(W.banner.a, GW / 2, 202); ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText(W.banner.b, GW / 2, 230); }
  ctx.restore();
}
function render() {
  ctx.setTransform(Q, 0, 0, Q, 0, 0);
  if (Mode !== 'game' || !W) {
    const t = scene.t; drawBG(scene.world, t * 40, t);
    ctx.fillStyle = WORLDS[scene.world].plat[0]; ctx.fillRect(0, GROUND, GW, GH - GROUND); ctx.fillStyle = WORLDS[scene.world].plat[1]; ctx.fillRect(0, GROUND, GW, 7);
    if (Mode === 'menu') { const f = scene.f, c = CH(Save.sel); f.t = t; const cyc = t % 3.2; f.anim = cyc < 0.7 ? 'atk' : 'idle'; f.atkP = cyc / 0.7; const k = scene.big ? 1.9 : 1.25; f.h = 62 * k; f.w = 28 * k; f.y = GROUND - f.h; f.x = (scene.big ? 220 : 130) - f.w / 2; drawFighter(f, c.pal, c.weapon, 1, false); }
    return;
  }
  const w = W, cam = w.cam, sh = w.shake > 0 ? w.shake * 14 : 0, ox = (Math.random() - 0.5) * sh, oy = (Math.random() - 0.5) * sh;
  drawBG(w.L.w, cam, w.time);
  ctx.save(); ctx.translate(Math.round(-cam + ox), Math.round(oy));
  drawPlatforms(cam); drawGate(cam);
  for (const c of w.pk) { if (c.x < cam - 30 || c.x > cam + GW + 30) continue; if (c.k === 'coin') { const sw = Math.abs(Math.cos(w.time * 5 + c.x * 0.05)) * 6 + 1.5; ctx.fillStyle = '#ffc928'; ctx.beginPath(); ctx.ellipse(c.x + 7, c.y + 7, sw, 7, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.ellipse(c.x + 7, c.y + 7, Math.max(0.8, sw - 2), 4, 0, 0, 6.3); ctx.fill(); } else { ctx.fillStyle = '#ff5a6e'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('♥', c.x - 1, c.y + 16); } }
  if (w.frag) { const fx = w.frag.x, fy = w.frag.y + Math.sin(w.time * 3) * 6; ctx.fillStyle = '#ffe08a'; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(fx, fy - 20); ctx.lineTo(fx + 12, fy); ctx.lineTo(fx, fy + 20); ctx.lineTo(fx - 12, fy); ctx.fill(); ctx.globalAlpha = 1; }
  for (const g of w.ghosts) { const a = g.life / g.max; if (g.mode === 'die') { ctx.save(); ctx.translate(g.f.x + g.f.w / 2, g.f.y + g.f.h / 2); ctx.rotate(g.rot); ctx.translate(-(g.f.x + g.f.w / 2), -(g.f.y + g.f.h / 2)); drawFighter(g.f, g.pal, g.weapon, a, false); ctx.restore(); } else drawFighter(g.f, g.pal, g.weapon, a * 0.4, false); }
  for (const e of w.en) { if (e.x < cam - 150 || e.x > cam + GW + 150) continue; e.type; const ff = e; ff.type = e.type; drawFighter(ff, e.T.pal, e.T.weapon, 1, e.flash > 0); if (!e.boss && e.hp < e.maxHp) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x, e.y - 12, e.w, 5); ctx.fillStyle = '#e0463a'; ctx.fillRect(e.x, e.y - 12, e.w * e.hp / e.maxHp, 5); } }
  const p = w.player; if (!(p.inv > 0 && p.inv < 100 && Math.floor(w.time * 22) % 2 === 0)) drawFighter(p, p.c.pal, p.c.weapon, 1, false);
  if (p.spec > 0) { ctx.strokeStyle = 'rgba(255,240,170,' + p.spec * 2 + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x + 14, p.y + 30, (0.5 - p.spec) * 760, 0, 6.3); ctx.stroke(); }
  for (const b of w.pr) drawProj(b);
  for (const q of w.parts) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.s, q.s); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif'; for (const t of w.texts) { ctx.globalAlpha = clamp(t.life * 2, 0, 1); ctx.fillStyle = '#000'; ctx.fillText(t.txt, t.x + 1, t.y + 1); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y); } ctx.globalAlpha = 1;
  ctx.restore();
  if (w.red > 0) { ctx.fillStyle = 'rgba(255,0,0,' + w.red * 0.8 + ')'; ctx.fillRect(0, 0, GW, GH); }
  if (w.flash > 0) { ctx.fillStyle = 'rgba(255,250,220,' + Math.min(0.8, w.flash) + ')'; ctx.fillRect(0, 0, GW, GH); }
  drawHUD();
}

/* ---------- bucle principal ---------- */
let lastT = 0;
function loop(ts) {
  requestAnimationFrame(loop); const dt = Math.min(0.033, (ts - lastT) / 1000 || 0.016); lastT = ts;
  if (Mode === 'game' && W) { if (W.state === 'play' || W.state === 'lose' || W.state === 'win') update(dt); if (window.syncButtons) syncButtons(); } else scene.t += dt;
  render();
}
requestAnimationFrame(loop);

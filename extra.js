'use strict';
/* ===== EXTRA: enemigos no humanos, animación avanzada, armas y ropa ===== */
let shopPrev = null;
const SWSND = { hammer: 'swingH', axe: 'swingH', scythe: 'swingH', staff: 'swingM', katana: 'swingK', dual: 'swingK', spear: 'swingK' };
const mk = (acc) => ({ acc, body: acc, skin: '#fff', hair: '#fff', blade: '#fff' });
Object.assign(ET, {
  slime:  { hp: 34, spd: 0, dmg: 8, w: 34, h: 30, hop: true, split: true, coin: 2, form: 'slime', col: '#58d68d', pal: mk('#58d68d'), weapon: 'none' },
  wolf:   { hp: 48, spd: 150, dmg: 11, w: 54, h: 34, range: 46, wind: 0.35, cd: 1.1, dashAI: true, coin: 3, form: 'wolf', col: '#8a8f9c', pal: mk('#ff5a4a'), weapon: 'none' },
  bat:    { hp: 22, spd: 130, dmg: 8, w: 36, h: 26, fly: true, cd: 1.6, coin: 2, form: 'bat', col: '#6a4690', pal: mk('#b36bff'), weapon: 'none' },
  wraith: { hp: 40, spd: 70, dmg: 10, w: 36, h: 60, fly: true, shoot: true, cd: 2.4, coin: 3, form: 'wraith', col: '#9fb6ff', pal: mk('#9fb6ff'), weapon: 'none' },
  golem:  { hp: 160, spd: 42, dmg: 24, w: 48, h: 70, range: 84, wind: 0.9, cd: 2.1, coin: 5, armor: true, form: 'golem', col: '#7ff3ff', pal: mk('#7ff3ff'), weapon: 'none' }
});
POOLS.length = 0;
POOLS.push(['grunt', 'slime', 'wolf', 'grunt'], ['grunt', 'archer', 'bat', 'wraith', 'grunt'], ['grunt', 'slime', 'golem', 'bat', 'archer', 'wolf'],
  ['grunt', 'shadow', 'wolf', 'golem', 'archer', 'wraith', 'brute'], ['grunt', 'shadow', 'brute', 'wraith', 'wolf', 'archer', 'golem', 'bat']);

/* ---------- apariencia equipada ---------- */
function look(noPrev) {
  const c = CH(Save.sel), pv = !noPrev && shopPrev;
  const sk = SKINS.find(s => s.id === (pv && pv.t === 'sk' ? pv.id : Save.eqSkin)) || SKINS[0];
  const wp = WEAPONS.find(w => w.id === (pv && pv.t === 'wp' ? pv.id : Save.eqWp)) || WEAPONS[0];
  return { pal: Object.assign({}, c.pal, sk.pal), extra: sk.extra, aura: sk.aura || null, wk: wp.kind || c.weapon, wcol: wp.col || null, glow: wp.glow || null, wp };
}

/* ---------- IA: voladores y saltarines ---------- */
function updFlyer(e, dt, dx, ad, dir) {
  const p = W.player, T = e.T; e.face = dir; e.anim = 'fly';
  if (e.st === 'idle') { e.vx = 0; e.vy = Math.sin(e.t * 3) * 12; if (ad < 640 && !p.dead) e.st = 'chase'; moveE(e, dt); return; }
  if (T.shoot) {
    e.vx = ad > 320 ? dir * T.spd : ad < 200 ? -dir * T.spd : e.vx * 0.9; e.vy = clamp((p.y - 30 + Math.sin(e.t * 1.5) * 30 - e.y) * 1.5, -90, 90);
    if (e.cd <= 0 && ad < 560 && !p.dead) { const a = Math.atan2(p.y + 25 - (e.y + 20), p.x - e.x); addProj({ own: 'e', kind: 'orb', x: e.x + e.w / 2, y: e.y + 20, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 10, dmg: e.dmg, life: 3 }); Snd.play('ghost'); e.cd = T.cd; }
  } else if (e.st === 'chase') {
    e.vx = clamp((p.x - e.x) * 2, -T.spd, T.spd); e.vy = clamp((p.y - 140 + Math.sin(e.t * 4) * 20 - e.y) * 2, -T.spd, T.spd);
    if (e.cd <= 0 && ad < 280 && !p.dead) { e.st = 'dive'; e.stT = 0.75; e.didHit = false; const a = Math.atan2(p.y + 20 - e.y, p.x - e.x); e.vx = Math.cos(a) * 380; e.vy = Math.sin(a) * 380; Snd.play('flap'); }
  } else if (e.st === 'dive') {
    e.stT -= dt; if (!e.didHit && hit(e, p)) { e.didHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, 280); }
    if (e.stT <= 0 || e.y >= GROUND - e.h - 6) { e.st = 'chase'; e.cd = T.cd; }
  }
  moveE(e, dt);
}
function updHop(e, dt, dx, ad, dir) {
  const p = W.player;
  if (e.st === 'idle') { e.vx = 0; e.anim = 'idle'; if (ad < 560 && !p.dead) e.st = 'chase'; moveE(e, dt); return; }
  if (e.onG) {
    e.vx *= Math.pow(0.001, dt); e.hopT -= dt; e.anim = 'idle';
    if (e.hopT <= 0 && !p.dead) { e.vy = -540; e.vx = dir * (e.small ? 210 : 170); e.hopT = rand(0.8, 1.4); e.face = dir; Snd.play('blorp'); }
  } else e.anim = 'air';
  if (e.hitCD <= 0 && !p.dead && hit(e, p)) { e.hitCD = 0.8; hurtPlayer(e.dmg, e.x + e.w / 2, 260); }
  if (e.onG && !support(e.x + e.w / 2 + e.vx * 0.3, e.y + e.h)) e.vx = 0;
  moveE(e, dt);
}

/* ---------- dibujo ---------- */
function drawAny(f, pal, weapon, alpha, flash) { if (f.form && f.form !== 'human') drawCreature(f, flash, alpha); else drawFighter(f, pal, weapon, alpha, flash); }
function drawEnemy(e) {
  const boss = e.boss; ctx.save();
  if (boss && e.st === 'wind') ctx.translate(rand(-2.5, 2.5), 0);
  if (boss && e.form === 'human') e.aura = e.p2 ? '#ff4040' : e.aura;
  drawAny(e, e.T.pal, e.T.weapon, 1, e.flash > 0);
  if (boss && e.st === 'wind') { ctx.strokeStyle = 'rgba(255,70,50,' + (0.4 + 0.4 * Math.sin(W.time * 30)) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w * 0.7 + 14 - e.atkP * 8, e.h * 0.62, 0, 0, 6.3); ctx.stroke(); }
  if (boss && e.p2) { ctx.fillStyle = 'rgba(255,60,40,' + (0.12 + 0.08 * Math.sin(W.time * 10)) + ')'; ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w * 0.9, e.h * 0.7, 0, 0, 6.3); ctx.fill(); }
  if (!boss && e.hp < e.maxHp) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x, e.y - 12, e.w, 5); ctx.fillStyle = '#e0463a'; ctx.fillRect(e.x, e.y - 12, e.w * e.hp / e.maxHp, 5); }
  ctx.restore();
}

function drawFighter(f, pal, weapon, alpha, flash) {
  alpha = alpha === undefined ? 1 : alpha;
  const kind = f.wk || weapon || 'sword', wcol = flash ? '#fff' : (f.wcol || pal.blade), ex = f.extra || '';
  const s = f.h / 62, cx = f.x + f.w / 2, fy = f.y + f.h, t = f.t || 0, an = f.anim || 'idle';
  const body = flash ? '#fff' : pal.body, acc = flash ? '#fff' : pal.acc, skin = flash ? '#fff' : pal.skin, hair = flash ? '#fff' : pal.hair;
  const vy = f.vy || 0, str = clamp(-vy / 1800, -0.1, 0.12), sq = f.land > 0 ? f.land * 1.3 : 0;
  const moving = an === 'run', air = an === 'air', atk = an === 'atk', wind = an === 'wind', dash = an === 'dash', hurt = an === 'hurt';
  const ph = t * 13, bounce = moving ? -Math.abs(Math.sin(ph)) * 2.5 : 0, br = an === 'idle' ? Math.sin(t * 2.6) : 0;
  const pr = f.atkP || 0, cb = f.combo || 1, e = pr < 0.5 ? 2 * pr * pr : 1 - 2 * (1 - pr) * (1 - pr);
  ctx.save(); ctx.globalAlpha = alpha;
  if (f.onG) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, fy, 18 * s, 4 * s, 0, 0, 6.3); ctx.fill(); }
  ctx.translate(cx, fy); ctx.scale(f.face * s * (1 + sq - str * 0.5), s * (1 - sq + str)); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (f.aura && !flash) { ctx.shadowColor = f.aura; ctx.shadowBlur = 18; }
  const crouch = wind ? 4 : f.land > 0 ? 3 : 0, hipY = -27 + bounce + crouch + br * 0.4;
  const lean = moving ? 5 : dash ? 12 : atk ? (cb === 3 ? 9 : 5) * Math.sin(pr * Math.PI) : hurt ? -6 : wind ? -5 : 0;
  const sh = [lean, -47 + bounce + crouch + br - (air && vy < 0 ? 1 : 0)];
  /* pose del arma */
  const twoH = kind === 'hammer' || kind === 'axe' || kind === 'spear' || kind === 'scythe' || kind === 'staff';
  let wang = -0.7 + Math.sin(t * 2) * 0.05, aang = 0.9, ext = 0, w2 = null;
  if (atk) {
    if (kind === 'spear') { wang = cb === 3 ? -3 + 3.2 * e : -0.12; ext = cb === 3 ? 0 : Math.sin(pr * Math.PI) * 26; }
    else if (kind === 'hammer' || kind === 'axe') { const k = pr < 0.4 ? pr / 0.4 * 0.25 : 0.25 + Math.pow((pr - 0.4) / 0.6, 2) * 0.75; wang = -2.9 + 4.1 * k; }
    else if (kind === 'staff') wang = -1.2 + pr * Math.PI * 4;
    else if (cb === 2) wang = 1.1 - 3.4 * e; else if (cb === 3) wang = -3.4 + 4.0 * e; else wang = -2.5 + 3.4 * e;
    aang = wang; if (kind === 'dual') w2 = 1.0 - 3.3 * e;
  } else if (wind) { wang = kind === 'spear' ? -0.2 : -2.3 + Math.sin(t * 40) * 0.05; aang = kind === 'spear' ? 0 : -2.0; ext = kind === 'spear' ? -8 : 0; }
  else if (dash) { wang = -0.15; aang = -0.1; } else if (moving) wang = -0.9 + Math.sin(ph) * 0.18; else if (air) { wang = -1.1; aang = -0.6; }
  if (!atk && !wind) { if (kind === 'spear') wang = moving ? -0.35 : -0.5; if (kind === 'staff') wang = -1.35 + Math.sin(t * 2) * 0.04; if (twoH && !dash) aang = 0.5; }
  if (kind === 'bow') { wang = 0; aang = 0; }
  const hx = sh[0] + Math.cos(aang) * 15 + ext, hy = sh[1] + Math.sin(aang) * 15;
  const Wp = (k, x, y, ang, sc) => {
    const ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
    switch (k) {
      case 'sword': case 'blade': { const L = (k === 'blade' ? 50 : 36) * sc; if (f.glow && !flash) limb(x, y, x + ux * L, y + uy * L, 10, f.glow + '66'); limb(x - ux * 4, y - uy * 4, x + ux * L, y + uy * L, k === 'blade' ? 6 : 4, wcol); limb(x + px * 5, y + py * 5, x - px * 5, y - py * 5, 3, acc); break; }
      case 'katana': { const L = 46 * sc; if (f.glow && !flash) limb(x, y, x + ux * L, y + uy * L, 10, f.glow + '66'); ctx.strokeStyle = wcol; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + ux * L * 0.55 + px * 4, y + uy * L * 0.55 + py * 4, x + ux * L, y + uy * L); ctx.stroke(); limb(x - ux * 8, y - uy * 8, x, y, 4, '#222'); ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x + ux * 2, y + uy * 2, 3.5, 0, 6.3); ctx.fill(); break; }
      case 'spear': { const L = 64; limb(x - ux * 14, y - uy * 14, x + ux * L, y + uy * L, 3.2, '#8d6e63'); ctx.fillStyle = wcol; ctx.beginPath(); ctx.moveTo(x + ux * (L + 14), y + uy * (L + 14)); ctx.lineTo(x + ux * L + px * 4, y + uy * L + py * 4); ctx.lineTo(x + ux * L - px * 4, y + uy * L - py * 4); ctx.fill(); limb(x + ux * (L - 4), y + uy * (L - 4), x + ux * (L - 12) + px * 6, y + uy * (L - 12) + py * 6, 2.5, acc); break; }
      case 'axe': { const L = 40; limb(x - ux * 6, y - uy * 6, x + ux * L, y + uy * L, 4, '#6d4c41'); ctx.fillStyle = wcol; ctx.beginPath(); ctx.moveTo(x + ux * (L - 6) + px * 3, y + uy * (L - 6) + py * 3); ctx.lineTo(x + ux * (L + 6) + px * 17, y + uy * (L + 6) + py * 17); ctx.lineTo(x + ux * (L + 10) - px * 4, y + uy * (L + 10) - py * 4); ctx.lineTo(x + ux * (L - 6) - px * 3, y + uy * (L - 6) - py * 3); ctx.fill(); break; }
      case 'hammer': case 'club': { const L = k === 'hammer' ? 42 : 32; limb(x - ux * 6, y - uy * 6, x + ux * L, y + uy * L, 5, '#6d4c41'); if (f.glow && !flash) limb(x + ux * L, y + uy * L, x + ux * (L + 14), y + uy * (L + 14), 24, f.glow + '55'); limb(x + ux * (L - 2), y + uy * (L - 2), x + ux * (L + 14), y + uy * (L + 14), k === 'hammer' ? 18 : 12, wcol); break; }
      case 'scythe': { const L = 56, tx = x + ux * L, ty = y + uy * L; limb(x - ux * 10, y - uy * 10, tx, ty, 3.4, '#5d4037'); ctx.strokeStyle = wcol; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx - ux * 4, ty - uy * 4); ctx.quadraticCurveTo(tx + px * 32 + ux * 4, ty + py * 32 + uy * 4, tx + px * 27 - ux * 22, ty + py * 27 - uy * 22); ctx.stroke(); break; }
      case 'staff': { const L = 50, tx = x + ux * L, ty = y + uy * L; limb(x - ux * 14, y - uy * 14, tx, ty, 4, '#8d6e63'); ctx.fillStyle = (f.glow || wcol) + '55'; ctx.beginPath(); ctx.arc(tx, ty, 12 + Math.sin(t * 8) * 2, 0, 6.3); ctx.fill(); ctx.fillStyle = wcol; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, 6.3); ctx.fill(); break; }
    }
  };
  /* capa y brazo trasero */
  if (ex.includes('cape')) { const sp = moving || dash ? 14 : air ? 10 : 3, w1 = Math.sin(t * 6) * 3; ctx.fillStyle = acc; ctx.globalAlpha = alpha * 0.92; ctx.beginPath(); ctx.moveTo(sh[0] - 2, sh[1] - 3); ctx.quadraticCurveTo(sh[0] - 16 - sp, sh[1] + 8 + w1, sh[0] - 18 - sp * 1.6, hipY + 18 + w1); ctx.lineTo(sh[0] - 4, hipY + 2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = alpha; }
  ctx.globalAlpha = alpha * 0.85;
  if (twoH) limb(sh[0] - 2, sh[1] + 2, hx + Math.cos(wang) * 16, hy + Math.sin(wang) * 16, 6, body);
  else limb(sh[0], sh[1], sh[0] - 6 + (moving ? Math.sin(ph) * 6 : 0) + (air ? 2 : 0), sh[1] + (air ? 5 : 15), 6, body);
  if (w2 !== null) Wp('sword', sh[0] - 4, sh[1] + 10, w2, 0.8);
  /* piernas y torso */
  const A = air ? (vy < 0 ? [0.7, -0.5] : [0.35, -0.3]) : moving ? [Math.sin(ph) * 0.95, -Math.sin(ph) * 0.95] : dash ? [1.1, -1.0] : atk ? [0.55, -0.4] : wind ? [0.38, -0.38] : hurt ? [0.3, -0.2] : [0.14, -0.14];
  const leg = (a, back) => { const lift = moving ? Math.max(0, Math.sin(ph + (back ? Math.PI : 0) + 1.6)) * 7 : 0; ctx.strokeStyle = body; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(Math.sin(a) * 13 + 3, hipY + Math.cos(a) * 13); ctx.lineTo(Math.sin(a) * 26, Math.min(0, hipY + Math.cos(a) * 26) - lift); ctx.stroke(); };
  leg(A[1], true); ctx.globalAlpha = alpha;
  limb(0, hipY, sh[0], sh[1], 11, body); limb(-5, hipY - 2, 5, hipY - 2, 4, acc); limb(sh[0] - 3, sh[1] + 3, sh[0] + 3, sh[1] + 12, 3, acc);
  leg(A[0], false);
  /* bufanda */
  ctx.strokeStyle = acc; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sh[0] - 2, sh[1] - 3);
  for (let i = 1; i <= 6; i++) ctx.lineTo(sh[0] - 2 - i * 6 - ((moving || air || dash) ? i * 2.5 : 0), sh[1] - 3 + Math.sin(t * 9 - i * 0.9) * (2 + i * 0.6) + (air ? i * 1.3 : 0)); ctx.stroke();
  /* cabeza y extras */
  const hdx = sh[0] + 2, hdy = sh[1] - 10;
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(hdx - 1, hdy, 9, 0, 6.3); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(hdx + 3.5, hdy + 1.5, 5.6, 4, 0, 0, 6.3); ctx.fill();
  limb(hdx - 9, hdy - 3, hdx + 9, hdy - 4, 3, acc);
  ctx.fillStyle = flash ? '#fff' : (pal.eye || '#fff'); ctx.fillRect(hdx + 3, hdy - 0.5, 3.5, 3); ctx.fillStyle = '#111'; ctx.fillRect(hdx + 5, hdy, 1.8, 2.4);
  if (ex.includes('horns')) { ctx.fillStyle = flash ? '#fff' : '#f2e6c8'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hdx + sx * 3 - 3, hdy - 7); ctx.lineTo(hdx + sx * 7, hdy - 19); ctx.lineTo(hdx + sx * 3 + 3, hdy - 7); ctx.fill(); } }
  if (ex.includes('hat')) { ctx.fillStyle = flash ? '#fff' : '#d9b36b'; ctx.beginPath(); ctx.moveTo(hdx - 17, hdy - 4); ctx.lineTo(hdx, hdy - 21); ctx.lineTo(hdx + 17, hdy - 4); ctx.closePath(); ctx.fill(); limb(hdx - 16, hdy - 4, hdx + 16, hdy - 4, 2, '#8a6a2a'); }
  if (ex.includes('crown')) { ctx.fillStyle = flash ? '#fff' : '#ffd24a'; ctx.beginPath(); ctx.moveTo(hdx - 8, hdy - 8); ctx.lineTo(hdx - 8, hdy - 15); ctx.lineTo(hdx - 3, hdy - 11); ctx.lineTo(hdx, hdy - 17); ctx.lineTo(hdx + 3, hdy - 11); ctx.lineTo(hdx + 8, hdy - 15); ctx.lineTo(hdx + 8, hdy - 8); ctx.fill(); }
  if (ex.includes('halo')) { ctx.strokeStyle = flash ? '#fff' : '#ffe9a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(hdx, hdy - 17 + Math.sin(t * 3) * 1.5, 10, 3.4, 0, 0, 6.3); ctx.stroke(); }
  /* brazo delantero, estela y arma */
  if (atk && pr > 0.12 && pr < 0.85 && kind !== 'bow') {
    const R = kind === 'spear' ? 70 : kind === 'scythe' ? 76 : kind === 'hammer' || kind === 'axe' ? 62 : kind === 'katana' ? 56 : 46;
    ctx.save(); ctx.shadowBlur = 0; ctx.strokeStyle = f.glow || (flash ? '#fff' : '#fff'); ctx.globalAlpha = alpha * 0.55; ctx.lineWidth = kind === 'hammer' ? 10 : 6; ctx.beginPath();
    if (kind === 'spear' && cb !== 3) { ctx.moveTo(sh[0] + 22, sh[1]); ctx.lineTo(sh[0] + 62 + ext * 2.5, sh[1]); } else ctx.arc(sh[0], sh[1], R, wang - 1.5, wang); ctx.stroke(); ctx.restore();
  }
  limb(sh[0], sh[1], hx, hy, 6, body); ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, 6.3); ctx.fill();
  if (kind === 'bow') { ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx + 2, hy, 17, -1.25, 1.25); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; const pull = wind ? 8 * pr : 0; ctx.beginPath(); ctx.moveTo(hx + 2 + 17 * Math.cos(-1.25), hy + 17 * Math.sin(-1.25)); ctx.lineTo(hx - pull, hy); ctx.lineTo(hx + 2 + 17 * Math.cos(1.25), hy + 17 * Math.sin(1.25)); ctx.stroke(); }
  else Wp(kind === 'dual' ? 'sword' : kind, hx, hy, wang, kind === 'dual' ? 0.8 : 1);
  ctx.restore();
  if (wind && f.type !== undefined) { ctx.save(); ctx.fillStyle = '#ff4b3a'; ctx.font = 'bold ' + (20 * s | 0) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', cx, f.y - 8); ctx.restore(); }
}

function drawCreature(f, flash, alpha) {
  alpha = alpha === undefined ? 1 : alpha;
  const t = f.t || 0, cx = f.x + f.w / 2, fy = f.y + f.h, an = f.anim || 'idle', form = f.form, pr = f.atkP || 0;
  const col = flash ? '#fff' : (f.col || '#8a8f9c'), stone = flash ? '#fff' : '#59636e', stoneL = flash ? '#fff' : '#7d8b99', mid = form === 'bat' || form === 'wraith';
  ctx.save(); ctx.globalAlpha = alpha;
  if (f.onG) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, fy, f.w * 0.45, 4, 0, 0, 6.3); ctx.fill(); }
  ctx.translate(cx, mid ? f.y + f.h / 2 : fy); ctx.scale(f.face, 1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (form) {
    case 'slime': {
      const w = f.w, h = f.h, air = an === 'air', sy = air ? 1.2 : 1 + Math.sin(t * 5) * 0.07, sx = air ? 0.85 : 1 / sy; ctx.scale(sx, sy);
      const g = ctx.createLinearGradient(0, -h * 1.2, 0, 0); g.addColorStop(0, flash ? '#fff' : '#d8ffe6'); g.addColorStop(1, col); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.bezierCurveTo(-w * 0.62, -h * 1.5, w * 0.62, -h * 1.5, w / 2, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-w * 0.18, -h * 0.85, w * 0.1, h * 0.14, -0.5, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(w * 0.08, -h * 0.5, h * 0.17, 0, 6.3); ctx.arc(w * 0.3, -h * 0.5, h * 0.17, 0, 6.3); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(w * 0.12, -h * 0.5, h * 0.08, 0, 6.3); ctx.arc(w * 0.34, -h * 0.5, h * 0.08, 0, 6.3); ctx.fill(); break; }
    case 'wolf': {
      const run = an === 'run' || an === 'air', ph = t * 16, cr = an === 'wind' ? 6 : 0, tw = Math.sin(t * 8); if (an === 'run' || an === 'dash') ctx.scale(1.1, 0.95);
      ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-20, -24 + cr); ctx.quadraticCurveTo(-34, -32 + tw * 4, -40, -18 + tw * 6); ctx.stroke();
      const lg = (x, a, c) => { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, -14 + cr); ctx.lineTo(x + Math.sin(a) * 11, Math.min(0, -2 - Math.max(0, Math.cos(a)) * (run ? 6 : 0))); ctx.stroke(); };
      const sd = flash ? '#fff' : '#454952'; lg(-14, run ? Math.sin(ph) : 0.1, sd); lg(12, run ? -Math.sin(ph) : 0.1, sd);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -20 + cr, 23, 10, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = flash ? '#fff' : '#c9ccd4'; ctx.beginPath(); ctx.ellipse(2, -15 + cr, 16, 4, 0, 0, 6.3); ctx.fill();
      lg(-6, run ? -Math.sin(ph) : -0.1, col); lg(20, run ? Math.sin(ph) : -0.1, col);
      const hy = -27 + cr; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(24, hy, 10, 8, 0, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.moveTo(30, hy - 4); ctx.lineTo(42, hy + 2); ctx.lineTo(30, hy + 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, hy - 6); ctx.lineTo(20, hy - 15); ctx.lineTo(25, hy - 6); ctx.fill();
      ctx.fillStyle = flash ? '#fff' : '#ff4a3a'; ctx.beginPath(); ctx.arc(26, hy - 2, 2.4, 0, 6.3); ctx.fill();
      if (an === 'wind' || an === 'dash') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(32, hy + 4); ctx.lineTo(34, hy + 9); ctx.lineTo(36, hy + 4); ctx.moveTo(37, hy + 3); ctx.lineTo(39, hy + 8); ctx.lineTo(41, hy + 3); ctx.fill(); } break; }
    case 'bat': {
      const fl = Math.sin(t * 18) * 0.9, wing = (side, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(side * 18, -22 - fl * 16, side * 38, -6 - fl * 22); ctx.quadraticCurveTo(side * 26, 0, side * 22, 4 - fl * 4); ctx.quadraticCurveTo(side * 12, 0, 0, 6); ctx.fill(); };
      wing(-1, flash ? '#fff' : '#3a2552'); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-4, -18); ctx.lineTo(0, -9); ctx.moveTo(6, -8); ctx.lineTo(4, -18); ctx.lineTo(0, -9); ctx.fill();
      ctx.fillStyle = flash ? '#fff' : '#ff4a6a'; ctx.beginPath(); ctx.arc(-3, -3, 2, 0, 6.3); ctx.arc(4, -3, 2, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-3, 3, 2, 4); ctx.fillRect(2, 3, 2, 4);
      wing(1, flash ? '#fff' : '#5b3a82'); break; }
    case 'wraith': {
      const s = f.h / 60, sw = Math.sin(t * 3); ctx.scale(s, s); ctx.translate(0, sw * 4 - (f.boss ? 6 : 0));
      const gg = ctx.createRadialGradient(0, 0, 4, 0, 0, 56); gg.addColorStop(0, 'rgba(160,190,255,.35)'); gg.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = gg; ctx.fillRect(-56, -56, 112, 112);
      ctx.globalAlpha = alpha * 0.85; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -16, 12, Math.PI, 0); ctx.lineTo(13, 8);
      for (let i = 5; i >= -5; i--) ctx.lineTo(i * 2.6, 26 + Math.sin(t * 6 + i) * 5 + (i % 2 ? 6 : 0)); ctx.lineTo(-13, 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(10, -6); ctx.quadraticCurveTo(24, 2 + sw * 4, 28 + (an === 'wind' ? 8 : 0), -4 + sw * 6); ctx.stroke();
      ctx.fillStyle = '#10142a'; ctx.beginPath(); ctx.ellipse(4, -17, 3.2, 4.4, 0, 0, 6.3); ctx.ellipse(-4, -17, 3.2, 4.4, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = flash ? '#fff' : '#ff7bff'; ctx.fillRect(3, -18, 2, 3); ctx.fillRect(-5, -18, 2, 3); break; }
    case 'golem': {
      const s = f.h / 70, k = an === 'wind' ? pr : an === 'atk' ? 1 - pr : 0, ang = 1.2 - 3.1 * k, st = an === 'run' ? Math.sin(t * 8) * 4 : 0; ctx.scale(s, s);
      ctx.fillStyle = stone; ctx.fillRect(-19 + st, -24, 15, 24); ctx.fillRect(4 - st, -24, 15, 24);
      const arm = (sx, c) => { ctx.strokeStyle = c; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(sx, -52); ctx.lineTo(sx + Math.cos(ang) * 30, -52 + Math.sin(ang) * 30); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx + Math.cos(ang) * 32, -52 + Math.sin(ang) * 32, 11, 0, 6.3); ctx.fill(); };
      arm(-24, stone); ctx.fillStyle = stoneL; ctx.beginPath(); ctx.moveTo(-26, -62); ctx.lineTo(26, -62); ctx.lineTo(20, -22); ctx.lineTo(-20, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col; ctx.globalAlpha = alpha * (0.6 + 0.3 * Math.sin(t * 4)); ctx.beginPath(); ctx.arc(0, -42, 7, 0, 6.3); ctx.fill(); ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -60); ctx.lineTo(-8, -48); ctx.lineTo(-16, -38); ctx.moveTo(12, -58); ctx.lineTo(16, -44); ctx.stroke();
      arm(24, stoneL); ctx.fillStyle = stone; ctx.fillRect(-11, -80, 22, 18); ctx.fillStyle = col; ctx.fillRect(1, -74, 6, 4); ctx.fillRect(-8, -74, 6, 4); break; }
    case 'dragon': {
      const s = f.h / 100, fl = Math.sin(t * 5), open = an === 'wind' ? pr * 0.7 : an === 'atk' ? 0.5 : 0.08 + Math.sin(t * 3) * 0.03; ctx.scale(s, s);
      const dk = flash ? '#fff' : '#3a120c';
      ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-10, -72); ctx.quadraticCurveTo(-52, -132 - fl * 14, -86, -92 - fl * 22); ctx.lineTo(-62, -82); ctx.lineTo(-64, -72); ctx.lineTo(-44, -70); ctx.lineTo(-30, -62); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-30, -36); ctx.quadraticCurveTo(-62, -26 + fl * 8, -88, -14 + fl * 12); ctx.stroke();
      ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(-18, -2); ctx.moveTo(18, -30); ctx.lineTo(24, -2); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -48, 42, 28, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = flash ? '#fff' : '#ffc97a'; ctx.beginPath(); ctx.ellipse(6, -40, 28, 16, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = dk; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-30 + i * 11, -70 + Math.abs(i - 2.5) * 3); ctx.lineTo(-25 + i * 11, -82 + Math.abs(i - 2.5) * 3); ctx.lineTo(-20 + i * 11, -70 + Math.abs(i - 2.5) * 3); ctx.fill(); }
      ctx.strokeStyle = col; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(24, -62); ctx.lineTo(42, -88); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(52, -94, 19, 12, -0.1, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.ellipse(66, -92, 13, 7, 0, 0, 6.3); ctx.fill();
      ctx.save(); ctx.translate(46, -88); ctx.rotate(open); ctx.fillStyle = flash ? '#fff' : '#8a2a14'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(32, 2); ctx.lineTo(28, 9); ctx.lineTo(0, 9); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(14, -2, 3, 4); ctx.fillRect(22, -2, 3, 4); ctx.restore();
      ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(44, -102); ctx.lineTo(34, -122); ctx.lineTo(54, -104); ctx.fill(); ctx.beginPath(); ctx.moveTo(54, -103); ctx.lineTo(50, -124); ctx.lineTo(62, -102); ctx.fill();
      ctx.fillStyle = flash ? '#fff' : (f.eye || '#ffe14a'); ctx.beginPath(); ctx.arc(55, -97, 3.4, 0, 6.3); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(55, -99, 1.6, 4);
      if (an === 'wind') { const g = ctx.createRadialGradient(72, -88, 2, 72, -88, 12 + pr * 34); g.addColorStop(0, 'rgba(255,240,160,' + pr + ')'); g.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = g; ctx.fillRect(30, -140, 120, 120); }
      ctx.fillStyle = flash ? '#fff' : 'rgba(120,30,12,.75)'; ctx.beginPath(); ctx.moveTo(6, -68); ctx.quadraticCurveTo(-30, -110 - fl * 10, -66, -80 - fl * 16); ctx.lineTo(-40, -68); ctx.closePath(); ctx.fill(); break; }
  }
  ctx.restore();
  if (an === 'wind' && !f.boss) { ctx.save(); ctx.fillStyle = '#ff4b3a'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', cx, f.y - 8); ctx.restore(); }
}

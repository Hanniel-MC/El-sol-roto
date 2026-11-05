'use strict';
/* ===== INTERFAZ: menús, historia, tienda, ajustes, PWA ===== */
const $ = s => document.querySelector(s), UIel = $('#ui'), touchEl = $('#touch');
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let deferredInstall = null, curLevel = 0, storyTimer = null;
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const ui = (html, cls = '') => { UIel.innerHTML = html; UIel.className = 'on ' + cls; };
const hideUI = () => { UIel.className = ''; UIel.innerHTML = ''; };
const upCost = l => Math.round(60 * Math.pow(1.5, l) / 10) * 10;
const UPS = [
  { k: 'hp', n: 'Vitalidad', i: '❤', d: '+12% de vida máxima' }, { k: 'dmg', n: 'Filo Afilado', i: '⚔', d: '+12% de daño' },
  { k: 'en', n: 'Chi Veloz', i: '⚡', d: '+20% de energía por golpe' }, { k: 'star', n: 'Bolsa de Shuriken', i: '✦', d: '+1 shuriken máximo' }
];
const MAXUP = 8;

function applySettings() {
  Object.assign(Snd.cfg, { music: Save.set.music, sfx: Save.set.sfx, vol: Save.set.vol }); Snd.apply();
  setQuality(Save.set.q); document.documentElement.style.setProperty('--cs', Save.set.ctrl);
}
function setMode(m, world) { Mode = m; if (world !== undefined) scene.world = world; scene.big = false; touchEl.classList.add('hidden'); }

/* ---------- pantallas ---------- */
function showSplash() {
  setMode('menu', 1);
  ui('<div class="center splash" data-act="start"><h1 class="title">ALBA<br>SHINOBI</h1><p class="sub">El Sol Roto</p><p class="tap">Toca para comenzar</p></div>');
}
function showMenu() {
  shopPrev = null; setMode('menu', Math.min(4, (Math.min(Save.best, 14) / 3) | 0)); Snd.music('menu');
  const inst = deferredInstall ? '<button class="btn" data-act="install">📲 Instalar app</button>' : /iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone ? '<button class="btn" data-act="install">📲 Instalar app</button>' : '';
  ui(`<div class="menu"><div class="logo"><h1 class="title">ALBA<br>SHINOBI</h1><p class="sub">El Sol Roto</p></div>
  <div class="mbtns"><button class="btn pri" data-act="play">▶ ${Save.best > 0 ? 'CONTINUAR' : 'JUGAR'}</button>
  <button class="btn" data-act="levels">🗺 Niveles</button><button class="btn" data-act="chars">🥷 Personajes</button>
  <button class="btn" data-act="shop">🪙 Mejoras <b>${Save.coins}</b></button><button class="btn" data-act="settings">⚙ Ajustes</button>
  <button class="btn" data-act="story">📜 Historia</button>${inst}</div></div>`);
}
function showLevels() {
  setMode('menu'); let h = '<div class="page"><div class="bar"><button class="btn sm" data-act="menu">◀ Volver</button><h2>Niveles</h2><span></span></div><div class="worlds">';
  for (let w = 0; w < 5; w++) {
    h += `<div class="world"><h3>Mundo ${w + 1} · ${WORLDS[w].name}</h3><div class="lv">`;
    for (let n = 0; n < 3; n++) {
      const i = w * 3 + n, ok = i <= Save.best, s = Save.stars[i] || 0;
      h += `<button class="card lvl ${ok ? '' : 'lock'} ${n === 2 ? 'bossl' : ''}" ${ok ? `data-act="lvl" data-i="${i}"` : 'disabled'}><b>${w + 1}-${n + 1}</b><small>${n === 2 ? '👹 ' + WORLDS[w].boss.name : 'Misión'}</small><span class="st">${ok ? stars(s) : '🔒'}</span></button>`;
    }
    h += '</div></div>';
  }
  ui(h + '</div></div>');
}
function showChars() {
  setMode('menu'); scene.big = true; Snd.music('menu');
  let h = '<div class="side"><div class="bar"><button class="btn sm" data-act="menu">◀ Volver</button><h2>Personajes</h2><span></span></div><div class="clist">';
  for (const c of CHARS) {
    const ok = Save.best >= c.unlock, sel = Save.sel === c.id, bar = (v, m) => `<i style="width:${Math.min(100, v / m * 100)}%"></i>`;
    h += `<div class="card ch ${sel ? 'sel' : ''} ${ok ? '' : 'lock'}"><div class="chh"><b>${c.name}</b><small>${c.title}</small></div>
    <div class="stats"><label>Vida<span>${bar(c.hp, 160)}</span></label><label>Daño<span>${bar(c.dmg, 1.6)}</span></label><label>Velocidad<span>${bar(c.spd, 1.25)}</span></label></div>
    <p>${ok ? c.desc : '🔒 Se desbloquea al completar el nivel ' + c.unlock + '.'}</p><p class="spn">⚡ ${c.sp}${c.air ? ' · Doble salto' : ''}</p>
    ${ok ? `<button class="btn sm ${sel ? '' : 'pri'}" data-act="pick" data-id="${c.id}">${sel ? '✔ Elegido' : 'Elegir'}</button>` : ''}</div>`;
  }
  ui(h + '</div></div>', 'right');
}
let shopTab = 'up';
function showShop() {
  setMode('menu'); scene.big = true; Snd.music('shop');
  const tabs = [['up', '⬆ Mejoras'], ['wp', '⚔ Armas'], ['sk', '👘 Ropa']];
  let h = `<div class="side"><div class="bar"><button class="btn sm" data-act="menu">◀</button><h2>Tienda</h2><b class="coins">● ${Save.coins}</b></div><div class="tabs">${tabs.map(t => `<button class="btn sm ${shopTab === t[0] ? 'pri' : ''}" data-act="stab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><div class="clist">`;
  if (shopTab === 'up') for (const u of UPS) {
    const lv = Save.up[u.k], max = lv >= MAXUP, cost = upCost(lv);
    h += `<div class="card up"><div class="ui">${u.i}</div><div><b>${u.n}</b> <small>Nv ${lv}/${MAXUP}</small><p>${u.d}</p></div><button class="btn sm ${!max && Save.coins >= cost ? 'pri' : ''}" data-act="buy" data-k="${u.k}" ${max || Save.coins < cost ? 'disabled' : ''}>${max ? 'MAX' : '● ' + cost}</button></div>`;
  } else {
    const L = shopTab === 'wp' ? WEAPONS : SKINS, own = shopTab === 'wp' ? Save.own.wp : Save.own.skin, eq = shopTab === 'wp' ? Save.eqWp : Save.eqSkin;
    for (const it of L) {
      const has = own.includes(it.id), on = eq === it.id, pv = shopPrev && shopPrev.t === shopTab && shopPrev.id === it.id;
      const chips = shopTab === 'wp' && it.id !== 'std' ? `<span class="chip">Daño ${it.dmg}x · Vel ${it.rate}x · Alcance ${it.reach}x${it.en ? ' · Energía +60%' : ''}</span>` : '';
      h += `<div class="card up ${on ? 'sel' : ''} ${pv ? 'on' : ''}" data-act="prev" data-t="${shopTab}" data-id="${it.id}"><div class="ui">${shopTab === 'wp' ? '⚔' : '👘'}</div><div><b>${it.name}</b><p>${it.desc}</p>${chips}</div>
      ${has ? `<button class="btn sm ${on ? '' : 'pri'}" data-act="eqi" data-t="${shopTab}" data-id="${it.id}">${on ? '✔ Puesto' : 'Equipar'}</button>` : `<button class="btn sm ${Save.coins >= it.price ? 'pri' : ''}" data-act="buyi" data-t="${shopTab}" data-id="${it.id}" ${Save.coins < it.price ? 'disabled' : ''}>● ${it.price}</button>`}</div>`;
    }
  }
  ui(h + '</div></div>', 'right');
}
function showSettings() {
  setMode('menu'); const s = Save.set, tg = (k, t) => `<button class="btn sm tg ${s[k] ? 'on' : ''}" data-act="tog" data-k="${k}">${t}: ${s[k] ? 'SÍ' : 'NO'}</button>`;
  ui(`<div class="page"><div class="bar"><button class="btn sm" data-act="menu">◀ Volver</button><h2>Ajustes</h2><span></span></div><div class="set">
  ${tg('music', '🎵 Música')}${tg('sfx', '🔊 Efectos')}${tg('vib', '📳 Vibración')}${tg('touch', '🎮 Controles táctiles siempre')}
  <label class="rng">Volumen<input type="range" min="0" max="1" step="0.05" value="${s.vol}" data-set="vol"></label>
  <label class="rng">Tamaño de botones<input type="range" min="0.7" max="1.4" step="0.05" value="${s.ctrl}" data-set="ctrl"></label>
  <div class="seg">Dificultad ${[[0.75, 'Fácil'], [1, 'Normal'], [1.35, 'Difícil']].map(d => `<button class="btn sm ${s.diff === d[0] ? 'pri' : ''}" data-act="diff" data-v="${d[0]}">${d[1]}</button>`).join('')}</div>
  <div class="seg">Calidad ${[[1, 'Normal'], [1.5, 'Alta']].map(d => `<button class="btn sm ${s.q === d[0] ? 'pri' : ''}" data-act="qual" data-v="${d[0]}">${d[1]}</button>`).join('')}</div>
  <div class="seg"><button class="btn sm" data-act="full">⛶ Pantalla completa</button><button class="btn sm" data-act="export">💾 Exportar partida</button><button class="btn sm" data-act="import">📥 Importar partida</button><button class="btn sm danger" data-act="reset">🗑 Borrar datos</button></div>
  <p class="hint">Tu progreso se guarda en este dispositivo y funciona sin internet. Teclado: ← → mover · Espacio saltar · J atacar · K esquivar · L shuriken · I especial · P pausa.</p></div></div>`);
}

/* ---------- historia ---------- */
function story(slides, world, done, who = 'Narrador') {
  setMode('menu', world); Snd.music('menu'); let i = 0, n = 0, full = '';
  const finish = () => { clearInterval(storyTimer); hideUI(); done(); };
  const run = () => {
    full = slides[i]; n = 0; ui(`<div class="story"><div class="box"><div class="who">${who}</div><p id="tx"></p><div class="row"><button class="btn sm" data-act="sskip">Saltar</button><button class="btn pri sm" data-act="snext">▶</button></div></div></div>`);
    clearInterval(storyTimer); storyTimer = setInterval(() => { n += 2; const t = $('#tx'); if (t) t.textContent = full.slice(0, n); if (n >= full.length) clearInterval(storyTimer); }, 28);
  };
  ACT.snext = () => { if (n < full.length) { n = full.length; $('#tx').textContent = full; clearInterval(storyTimer); } else if (++i >= slides.length) finish(); else run(); };
  ACT.sskip = finish; run();
}

/* ---------- flujo de juego ---------- */
function beginLevel(i) {
  curLevel = i; const w = (i / 3) | 0;
  shopPrev = null; const go = () => { hideUI(); Mode = 'game'; startLevel(i); touchEl.classList.toggle('hidden', !(isTouch || Save.set.touch)); requestWake(); };
  if (i % 3 === 0 && !Save.seen['w' + w]) { Save.seen['w' + w] = 1; persist(); story(WORLDS[w].intro, w, go); } else go();
}
function requestWake() { try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {} }
function winLevel() {
  const w = W, idx = w.L.idx, p = w.player, before = Save.best;
  const st = 1 + (p.hp / p.maxHp >= 0.5 ? 1 : 0) + (w.coinsGot / Math.max(1, w.totalCoins) >= 0.6 ? 1 : 0);
  Save.stars[idx] = Math.max(Save.stars[idx] || 0, st); Save.best = Math.max(Save.best, idx + 1); Save.kills += w.kills; const bonus = 25 + idx * 12; Save.coins += bonus; persist();
  const news = CHARS.filter(c => c.unlock > before && c.unlock <= Save.best), world = w.L.w, got = w.coinsGot + bonus, kills = w.kills;
  const result = () => { setMode('menu', world); Snd.play('win'); ui(`<div class="center"><div class="card res"><h2>${idx === 14 ? '¡LEYENDA COMPLETADA!' : '¡NIVEL COMPLETADO!'}</h2><div class="stars">${stars(st)}</div><p>Monedas +${got} · Enemigos derrotados: ${kills}</p>${news.map(c => `<p class="new">🥷 ¡Nuevo personaje: ${c.name}!</p>`).join('')}<div class="row">${idx < 14 ? '<button class="btn pri" data-act="nextlvl">Siguiente ▶</button>' : ''}<button class="btn" data-act="retry">Repetir</button><button class="btn" data-act="shop">Mejoras</button><button class="btn" data-act="menu">Menú</button></div></div></div>`); };
  touchEl.classList.add('hidden');
  if (idx === 14) story(ENDING, 4, result); else if (w.L.boss && WORLDS[world].outro.length) story(WORLDS[world].outro, world, result); else result();
}
function loseLevel() {
  touchEl.classList.add('hidden'); persist(); setMode('menu', W.L.w); Snd.stop();
  ui(`<div class="center"><div class="card res"><h2 class="red">HAS CAÍDO</h2><p>Mejora a tu personaje y vuelve a intentarlo.</p><div class="row"><button class="btn pri" data-act="retry">Reintentar</button><button class="btn" data-act="shop">Mejoras ● ${Save.coins}</button><button class="btn" data-act="menu">Menú</button></div></div></div>`);
}
function pauseGame() { if (Mode !== 'game' || !W || W.state !== 'play') return; W.state = 'paused'; Input.reset(); ui('<div class="center"><div class="card res"><h2>PAUSA</h2><div class="row col"><button class="btn pri" data-act="resume">▶ Continuar</button><button class="btn" data-act="retry">↻ Reiniciar nivel</button><button class="btn" data-act="quit">Salir al menú</button></div></div></div>'); }
function resumeGame() { if (W && W.state === 'paused') { W.state = 'play'; hideUI(); Input.reset(); } }
window.onPauseKey = () => { if (W && W.state === 'paused' && Mode === 'game') resumeGame(); else pauseGame(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

/* ---------- botones de habilidad (cooldowns) ---------- */
let btnEls = null;
window.syncButtons = force => {
  if (!btnEls || force) { btnEls = {}; document.querySelectorAll('#acts .b').forEach(b => btnEls[b.dataset.k] = b); }
  const p = W && W.player; if (!p) return;
  const set = (k, r, txt) => { const b = btnEls[k]; if (!b) return; b.firstElementChild.style.height = (100 * (1 - r)) + '%'; if (txt !== undefined) b.lastElementChild.textContent = txt; };
  set('dash', 1 - p.dashCD / 1.0); set('throw', p.ammo > 0 ? 1 : 0, '✦' + p.ammo); set('special', p.en / 100); btnEls.special.classList.toggle('rdy', p.en >= 100);
};

/* ---------- acciones ---------- */
const ACT = {
  start() { Snd.init(); try { if (isTouch && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {}); } catch (e) {} applySettings();
    if (!Save.seen.intro) { Save.seen.intro = 1; persist(); story(INTRO, 1, showMenu); } else showMenu(); },
  menu: showMenu, levels: showLevels, chars: showChars, shop: showShop, settings: showSettings,
  stab(d) { shopTab = d.t; shopPrev = null; showShop(); }, prev(d) { shopPrev = { t: d.t, id: d.id }; showShop(); },
  buyi(d) { const wp = d.t === 'wp', it = (wp ? WEAPONS : SKINS).find(x => x.id === d.id), own = wp ? Save.own.wp : Save.own.skin;
    if (it && !own.includes(it.id) && Save.coins >= it.price) { Save.coins -= it.price; own.push(it.id); Save[wp ? 'eqWp' : 'eqSkin'] = it.id; persist(); Snd.play('buy'); shopPrev = null; showShop(); } },
  eqi(d) { Save[d.t === 'wp' ? 'eqWp' : 'eqSkin'] = d.id; persist(); Snd.play('equip'); shopPrev = null; showShop(); },
  play() { beginLevel(Math.min(Save.best, 14)); },
  lvl(d) { beginLevel(+d.i); }, nextlvl() { beginLevel(Math.min(14, curLevel + 1)); }, retry() { beginLevel(curLevel); },
  story() { story(INTRO, 1, showMenu); }, resume: resumeGame, quit() { W = null; Snd.stop(); showMenu(); },
  pick(d) { Save.sel = d.id; persist(); showChars(); },
  buy(d) { const lv = Save.up[d.k], c = upCost(lv); if (lv < MAXUP && Save.coins >= c) { Save.coins -= c; Save.up[d.k]++; persist(); Snd.play('coin'); showShop(); } },
  tog(d) { Save.set[d.k] = !Save.set[d.k]; persist(); applySettings(); showSettings(); },
  diff(d) { Save.set.diff = +d.v; persist(); showSettings(); }, qual(d) { Save.set.q = +d.v; persist(); applySettings(); showSettings(); },
  full() { const e = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : e.requestFullscreen && e.requestFullscreen()); },
  export() { const code = btoa(unescape(encodeURIComponent(JSON.stringify(Save)))); try { navigator.clipboard.writeText(code); } catch (e) {} prompt('Copia este código y guárdalo (ya se copió al portapapeles):', code); },
  import() { const c = prompt('Pega tu código de partida:'); if (!c) return; try { const s = JSON.parse(decodeURIComponent(escape(atob(c.trim())))); Save = Object.assign(defSave(), s); persist(); applySettings(); showMenu(); } catch (e) { alert('Código no válido.'); } },
  reset() { if (confirm('¿Borrar TODO tu progreso?')) { Save = defSave(); persist(); applySettings(); showMenu(); } },
  install() { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; showMenu(); } else alert('En iPhone: pulsa Compartir y luego "Añadir a pantalla de inicio".'); }
};
UIel.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; Snd.init(); if (b.dataset.act !== 'start') Snd.play('click'); const f = ACT[b.dataset.act]; if (f) f(b.dataset); });
UIel.addEventListener('input', e => { const k = e.target.dataset.set; if (!k) return; Save.set[k] = +e.target.value; persist(); applySettings(); });
$('#btn-pause').addEventListener('click', pauseGame);
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

/* ---------- arranque ---------- */
Input.bindTouch(); applySettings(); showSplash();

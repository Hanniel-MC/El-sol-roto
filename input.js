'use strict';
/* ===== ENTRADA: teclado + controles táctiles ===== */
const Input = (() => {
  const held = { left:false, right:false, jump:false };
  const at = {};
  const press = k => { at[k] = performance.now(); if (k in held) held[k] = true; };
  const release = k => { if (k in held) held[k] = false; };
  const take = k => { if (at[k] && performance.now() - at[k] < 170) { at[k] = 0; return true; } return false; };
  const reset = () => { for (const k in held) held[k] = false; for (const k in at) at[k] = 0; };
  const KM = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'jump', KeyW:'jump', Space:'jump',
    KeyJ:'attack', KeyZ:'attack', KeyK:'dash', KeyX:'dash', ShiftLeft:'dash', KeyL:'throw', KeyC:'throw', KeyI:'special', KeyV:'special' };
  addEventListener('keydown', e => {
    const k = KM[e.code];
    if (k) { e.preventDefault(); if (!e.repeat) press(k); }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat && window.onPauseKey) onPauseKey();
  });
  addEventListener('keyup', e => { const k = KM[e.code]; if (k) release(k); });
  addEventListener('blur', reset);

  function bindTouch() {
    document.querySelectorAll('#acts [data-k]').forEach(b => {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('d'); press(k); });
      const up = () => { b.classList.remove('d'); release(k); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    });
    const dp = document.getElementById('dpad');
    const upd = e => {
      const r = dp.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      held.left = x < 0.46; held.right = x > 0.54;
      dp.dataset.s = held.left ? 'l' : held.right ? 'r' : '';
    };
    dp.addEventListener('pointerdown', e => { e.preventDefault(); dp.setPointerCapture(e.pointerId); upd(e); });
    dp.addEventListener('pointermove', e => { if (dp.hasPointerCapture(e.pointerId)) upd(e); });
    const end = () => { held.left = held.right = false; dp.dataset.s = ''; };
    dp.addEventListener('pointerup', end); dp.addEventListener('pointercancel', end);
    document.addEventListener('contextmenu', e => e.preventDefault());
  }
  return { held, press, release, take, reset, bindTouch };
})();

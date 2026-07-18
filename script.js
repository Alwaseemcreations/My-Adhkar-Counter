(() => {
  'use strict';

  const STORAGE_KEY = 'tasbih.count';

  const lcdBox = document.querySelector('.lcd');
  const lcdValue = document.getElementById('counterValue');
  const btnCount = document.getElementById('btnCount');
  const btnReset = document.getElementById('btnReset');
  const btnDelete = document.getElementById('btnDelete');

  /**
   * count is either an integer >= 1, or null meaning "blank display".
   */
  let count = loadCount();

  function loadCount() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === '') return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function saveCount() {
    if (count === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(count));
    }
  }

  /* ---------- Rendering ---------- */

  function render() {
    lcdValue.textContent = count === null ? '' : String(count);
    fitFont();
  }

  // Shrink the digit text to always fit inside the LCD cutout, never overflowing.
  function fitFont() {
    const boxRect = lcdBox.getBoundingClientRect();
    if (boxRect.width === 0 || boxRect.height === 0) return;

    // Start from a size proportional to the LCD panel height, then shrink if needed.
    let fontSize = Math.round(boxRect.height * 0.62);
    lcdValue.style.fontSize = fontSize + 'px';

    const maxWidth = lcdBox.clientWidth;
    let guard = 60; // safety cap on iterations
    while (lcdValue.scrollWidth > maxWidth && fontSize > 8 && guard > 0) {
      fontSize -= 1;
      lcdValue.style.fontSize = fontSize + 'px';
      guard -= 1;
    }
  }

  /* ---------- Actions ---------- */

  function doCount() {
    count = count === null ? 1 : count + 1;
    saveCount();
    render();
    vibrate(12);
  }

  function doDelete() {
    if (count === null) return; // nothing to delete from blank
    count = count - 1;
    if (count <= 0) count = null;
    saveCount();
    render();
  }

  function doReset() {
    if (count === null) return; // already blank, nothing to animate
    lcdValue.classList.add('is-fading');
    window.setTimeout(() => {
      count = null;
      saveCount();
      render();
      lcdValue.classList.remove('is-fading');
    }, 180);
  }

  function vibrate(ms) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch (e) { /* ignore unsupported */ }
    }
  }

  /* ---------- Press feedback (mouse, touch, pen, keyboard) ---------- */

  function wirePress(el) {
    const press = () => el.classList.add('is-pressed');
    const release = () => el.classList.remove('is-pressed');

    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') press();
    });
    el.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') release();
    });
  }

  [btnCount, btnReset, btnDelete].forEach(wirePress);

  btnCount.addEventListener('click', doCount);
  btnDelete.addEventListener('click', doDelete);
  btnReset.addEventListener('click', doReset);

  /* ---------- Keep digits sized correctly as the device scales ---------- */

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => fitFont()).observe(document.querySelector('.device'));
  } else {
    window.addEventListener('resize', fitFont);
  }

  /* ---------- Initial paint ---------- */
  render();
})();

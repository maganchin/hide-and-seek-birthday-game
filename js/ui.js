// All DOM: loader, intro, HUD, prompts, modals, map labels, finale text.
import { ISLANDS, PERSON } from './content.js';

export function createUI({ total, state }) {
  const $ = (s, r = document) => r.querySelector(s);
  const handlers = {};
  const on = (k, f) => (handlers[k] = f);
  const emit = (k, ...a) => handlers[k] && handlers[k](...a);
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const stack = [];   // open modals, topmost last

  $('#total').textContent = total;
  $('#vol').value = state.volume;
  $('#reducedToggle').checked = state.reduced;

  // ── loader / intro ──
  const loading = (p, text) => {
    $('.loader-bar i').style.width = `${Math.round(p * 100)}%`;
    if (text) $('.loader-text').textContent = text + (p < 1 ? '…' : '');
    if (p >= 1) setTimeout(() => $('#loader').classList.add('gone'), 300);
  };
  const showIntro = () => {
    const tw = $('.twinkles');
    if (!tw.children.length) for (let i = 0; i < Math.min(PERSON.age, 60); i++) {   // one sparkle per year
      const s = document.createElement('i');
      s.textContent = i % 3 ? '✦' : '✧';
      s.style.cssText = `left:${4 + Math.random() * 92}%;top:${3 + Math.random() * 60}%;font-size:${8 + Math.random() * 14}px;animation-delay:${(Math.random() * 4).toFixed(2)}s;animation-duration:${(2.6 + Math.random() * 2.5).toFixed(2)}s`;
      tw.appendChild(s);
    }
    $('#intro').hidden = false; requestAnimationFrame(() => $('#intro').classList.add('show'));
  };
  const hideIntro = () => {
    $('#intro').classList.remove('show');
    setTimeout(() => ($('#intro').hidden = true), 900);
    $('#hud').hidden = false;
    requestAnimationFrame(() => $('#hud').classList.add('show'));
    if (isTouch) $('#joy').hidden = false;
  };
  $('#start').addEventListener('click', () => emit('start'));

  // ── HUD ──
  $('#mapBtn').addEventListener('click', () => emit('map'));
  $('#counter').addEventListener('click', () => emit('journal'));
  $('#hintBtn').addEventListener('click', () => emit('hint'));
  $('#muteBtn').addEventListener('click', () => emit('mute'));
  $('#vol2').value = state.volume;
  for (const id of ['#vol', '#vol2']) $(id).addEventListener('input', (e) => {
    const v = +e.target.value;
    $('#vol').value = $('#vol2').value = v;
    emit('volume', v);
    if (state.muted && v > 0) emit('mute');
  });
  $('#settingsBtn').addEventListener('click', (e) => { e.stopPropagation(); $('#settings').hidden = !$('#settings').hidden; });
  document.addEventListener('pointerdown', (e) => { if (!$('#settings').hidden && !e.target.closest('#settings, #settingsBtn')) $('#settings').hidden = true; });
  $('#reducedToggle').addEventListener('change', (e) => emit('reduced', e.target.checked));
  $('#resetBtn').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed) { emit('reset'); return; }
    b.dataset.armed = '1'; b.textContent = 'Tap again to clear every discovered memory';
    setTimeout(() => { delete b.dataset.armed; b.textContent = 'Reset progress'; }, 4000);
  });
  const setCount = (n) => { $('#found').textContent = n; };
  const pulseCount = () => { const c = $('#counter'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); };
  const setMuted = (m) => { $('#muteBtn').classList.toggle('muted', m); $('#muteBtn').setAttribute('aria-label', m ? 'Unmute music' : 'Mute music'); };
  const setMapButton = (inMap) => { $('#mapBtn').textContent = inMap ? `Back to ${PERSON.name}` : 'World Map'; $('#mapBtn').classList.toggle('active', inMap); };

  // ── transient text ──
  let toastT;
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('show'); setTimeout(() => (t.hidden = true), 500); }, 3600); };
  let bannerT;
  const banner = (title, sub) => {
    const b = $('#banner'); $('.b-title', b).textContent = title; $('.b-sub', b).textContent = sub;
    b.hidden = false; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(bannerT); bannerT = setTimeout(() => { b.classList.remove('show'); setTimeout(() => (b.hidden = true), 900); }, 3800);
  };
  const hint = () => {
    const h = $('#hint');
    h.innerHTML = isTouch ? 'Tap to walk · drag to look · pinch to zoom' : 'Click to walk · WASD to move · two-finger scroll or drag to look around · pinch to zoom';
    h.hidden = false; h.classList.add('show');
    setTimeout(() => { h.classList.remove('show'); setTimeout(() => (h.hidden = true), 900); }, 7000);
  };
  const prompt = (show, x, y, txt) => {
    const p = $('#prompt');
    if (!show) { if (!p.hidden) p.hidden = true; return; }
    p.hidden = false;
    p.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    if (p.dataset.k !== txt.title + txt.sub) { $('b', p).textContent = txt.title; $('span', p).textContent = txt.sub; p.dataset.k = txt.title + txt.sub; }
  };
  $('#prompt').addEventListener('click', () => emit('interact'));
  const fade = (inn, cb) => { const f = $('#fade'); f.classList.toggle('on', inn); setTimeout(() => cb && cb(), 650); };

  // ── modals ──
  const open = (el, onClose) => {
    el.hidden = false; requestAnimationFrame(() => el.classList.add('show'));
    const close = () => {
      if (el.hidden) return;
      el.classList.remove('show');
      setTimeout(() => (el.hidden = true), 350);
      const i = stack.findIndex((s) => s.el === el); if (i >= 0) stack.splice(i, 1);
      onClose && onClose();
    };
    stack.push({ el, close });
    $('.close', el).onclick = close;
    el.onclick = (e) => { if (e.target === el) close(); };
    return close;
  };
  const isOpen = () => stack.length > 0;
  const closeTop = () => stack.length && stack[stack.length - 1].close();

  function openVideo({ memory: m, place, onPlay, onWatched, onClose }) {
    const el = $('#videoModal'), v = $('video', el), ph = $('.v-placeholder', el);
    $('.v-eyebrow', el).textContent = place;
    $('#vTitle').textContent = m.sender ? `From ${m.sender}` : 'A birthday message';
    let watched = false;
    const status = $('.v-status', el);
    const already = state.found.has(m.file || `${m.island}:${m.spot}`);
    status.textContent = already ? 'Found ✦' : '';
    const markWatched = () => { if (watched) return; watched = true; onWatched(); status.textContent = 'Memory found ✦'; confetti(); };
    v.onplay = () => onPlay();
    v.ontimeupdate = () => { if (v.duration && v.currentTime / v.duration > 0.9) markWatched(); };
    v.onended = () => { markWatched(); };
    if (m.file) {
      ph.hidden = true; v.hidden = false;
      v.poster = m.poster || '';
      v.src = m.file;
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      // no video yet: this spot shows a step of the setup guide, and counts as found once opened
      v.hidden = true; ph.hidden = false;
      const tip = m.tip || { t: 'A message goes here', b: 'Set <code>video</code> for this spot in <code>world.config.js</code>.' };
      $('#vTitle').textContent = m.sender ? `From ${m.sender}` : 'A birthday message goes here';
      ph.innerHTML = `<span class="tip-kicker">Setup tip</span><b>${tip.t}</b><span class="tip-body">${tip.b}</span>`;
      setTimeout(markWatched, 600);
    }
    $('.replay', el).hidden = !m.file;
    $('.replay', el).onclick = () => { if (m.file) { v.currentTime = 0; v.play(); } };
    open(el, () => { v.pause(); v.removeAttribute('src'); v.load(); onClose(); });
  }

  // a setup card on its own (the signposts on the misty islands)
  function openTip({ tip, place, onClose }) {
    const el = $('#videoModal'), v = $('video', el), ph = $('.v-placeholder', el);
    $('.v-eyebrow', el).textContent = place;
    $('#vTitle').textContent = tip.t;
    $('.v-status', el).textContent = '';
    v.hidden = true; ph.hidden = false;
    ph.innerHTML = `<span class="tip-kicker">Setup tip</span><span class="tip-body">${tip.b}</span>`;
    $('.replay', el).hidden = true;
    open(el, onClose);
  }

  function openImage({ src, eyebrow, title, onClose }) {
    const el = $('#imageModal');
    $('.v-eyebrow', el).textContent = eyebrow;
    $('h2', el).textContent = title;
    $('img', el).src = src;
    $('img', el).alt = title;
    open(el, onClose);
  }

  // a little burst of confetti from both sides of the screen
  function confetti() {
    if (state.reduced) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    const dpr = Math.min(devicePixelRatio, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    document.body.appendChild(c);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const cols = ['#f6c85f', '#f49ac1', '#8fd3c1', '#9fc6f2', '#c3a6ff', '#ff8a65', '#fff3c4'];
    const bits = [];
    for (let side = 0; side < 2; side++) for (let i = 0; i < 90; i++) {
      const x = side ? innerWidth + 10 : -10, y = innerHeight * (0.55 + Math.random() * 0.3);
      const a = (side ? Math.PI + 0.35 : -0.35) + (side ? 1 : -1) * Math.random() * 0.9 * -1;
      const sp = 9 + Math.random() * 11;
      bits.push({ x, y, vx: Math.cos(a) * sp * (side ? 1 : 1), vy: -Math.abs(Math.sin(a) * sp) - 6 - Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], star: Math.random() < 0.18 });
    }
    const t0 = performance.now();
    const step = (now) => {
      const el = (now - t0) / 1000;
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const b of bits) {
        b.vy += 0.38; b.vx *= 0.985; b.vy *= 0.99;
        b.x += b.vx; b.y += b.vy; b.r += b.vr;
        g.save(); g.translate(b.x, b.y); g.rotate(b.r);
        g.globalAlpha = Math.max(0, Math.min(1, 3.2 - el));
        g.fillStyle = b.c;
        if (b.star) { g.font = '16px sans-serif'; g.fillText('✦', -6, 6); }
        else g.fillRect(-b.w / 2, -b.h / 2 * Math.abs(Math.cos(b.r * 2)), b.w, b.h * Math.abs(Math.cos(b.r * 2)) + 1);
        g.restore();
      }
      if (el < 3.3) requestAnimationFrame(step); else c.remove();
    };
    requestAnimationFrame(step);
  }

  function openTravel({ current, islands, onPick, onClose }) {
    const el = $('#travelModal'), box = $('.dest', el);
    box.innerHTML = '';
    let picked = false;
    for (const i of islands) {
      if (i.id === current) continue;
      const b = document.createElement('button');
      b.className = 'dest-btn';
      b.innerHTML = `<span class="d-name"></span><span class="d-era"></span>${i.total ? `<span class="d-count">${i.found} / ${i.total}</span>` : ''}`;
      $('.d-name', b).textContent = i.name; $('.d-era', b).textContent = i.era;
      b.onclick = () => { picked = true; close(); onPick(i.id); };
      box.appendChild(b);
    }
    const close = open(el, () => { if (!picked) onClose(); });
  }

  // a picker of swatch cards (the cat house and the wardrobe share it)
  function openPicker(sel, items, current, onPick, onClose) {
    const el = $(sel), box = $('.cat-list', el);
    box.innerHTML = '';
    let picked = false;
    for (const [id, it] of Object.entries(items)) {
      const b = document.createElement('button');
      b.className = 'dest-btn cat-btn' + (id === current ? ' current' : '');
      b.innerHTML = `<span class="cat-swatch"></span><span class="d-name"></span><span class="d-era"></span><span class="d-count">${id === current ? 'wearing now ✦' : ''}</span>`;
      $('.cat-swatch', b).style.background = it.swatch;
      $('.d-name', b).textContent = it.name; $('.d-era', b).textContent = it.blurb;
      b.onclick = () => { picked = true; close(); onPick(id); };
      box.appendChild(b);
    }
    const close = open(el, () => { if (!picked) onClose(); });
  }
  function openCats({ skins, current, onPick, onClose }) {
    const items = {};
    for (const [id, sk] of Object.entries(skins)) items[id] = { name: sk.name, blurb: sk.blurb, swatch: sk.patches ? `conic-gradient(${sk.fur} 0 40%, ${sk.patches[0]} 0 70%, ${sk.patches[1]} 0)` : sk.points ? `radial-gradient(circle at 50% 60%, ${sk.points} 0 32%, ${sk.fur} 34%)` : sk.bib ? `radial-gradient(circle at 50% 80%, ${sk.bib} 0 34%, ${sk.fur} 36%)` : sk.stripe ? `repeating-linear-gradient(120deg, ${sk.fur} 0 7px, ${sk.stripe} 7px 10px)` : sk.fur };
    openPicker('#catModal', items, current, onPick, onClose);
    for (const b of document.querySelectorAll('#catModal .cat-btn.current .d-count')) b.textContent = 'with you ✦';
  }
  function openWardrobe({ outfits, current, onPick, onClose }) { openPicker('#wardrobeModal', outfits, current, onPick, onClose); }

  function openJournal({ items, total: tot, onPlay, onClose, canCelebrate, onCelebrate }) {
    const el = $('#journalModal'), list = $('.j-list', el);
    const n = items.filter((i) => i.found).length;
    $('.j-title', el).textContent = `${n} of ${tot} memories found`;
    list.innerHTML = '';
    let handed = false;
    const groups = {};
    for (const it of items) (groups[it.m.island] ||= []).push(it);
    for (const [id, its] of Object.entries(groups)) {
      const g = document.createElement('div'); g.className = 'j-group';
      g.innerHTML = `<div class="j-island"><b></b> <i></i></div><div class="j-items"></div>`;
      $('b', g).textContent = ISLANDS[id].name; $('i', g).textContent = ISLANDS[id].era;
      for (const it of its) {
        const c = document.createElement('button');
        c.className = 'j-item' + (it.found ? ' found' : '');
        if (it.found) {
          c.innerHTML = `<span class="thumb"></span><span class="j-who"></span><span class="j-where"></span>`;
          if (it.m.poster) $('.thumb', c).style.backgroundImage = `url("${it.m.poster}")`;
          $('.j-who', c).textContent = it.m.sender || 'A birthday message';
          $('.j-where', c).textContent = it.spot || '';
          c.onclick = () => { handed = true; close(); onPlay(it.m); };
        } else {
          c.classList.add('hidden-item');
          c.innerHTML = `<span class="thumb locked">✦</span><span class="j-who">Still hidden</span><span class="j-where">somewhere in ${ISLANDS[id].name} · tap for a hint</span>`;
          c.onclick = () => { $('.j-where', c).textContent = `Hint: look near ${it.spot || 'somewhere special'}`; c.classList.add('hinted'); };
        }
        $('.j-items', g).appendChild(c);
      }
      list.appendChild(g);
    }
    if (canCelebrate) {
      const c = document.createElement('button'); c.className = 'btn-primary j-cel'; c.textContent = 'Return to the celebration';
      c.onclick = () => { handed = true; close(); onCelebrate(); };
      list.appendChild(c);
    }
    const close = open(el, () => { if (!handed) onClose(); });
  }

  // ── map labels ──
  let labelsOn = false, labelsClickable = false;
  const labels = {};
  function setupMapLabels(list) {
    const box = $('#mapLabels');
    for (const i of list) {
      const b = document.createElement('button');
      b.className = 'map-label' + (i.id === 'overlook' ? ' small' : '');
      b.innerHTML = '<b></b><span></span>';
      $('b', b).textContent = i.name; $('span', b).textContent = i.era;
      b.onclick = () => labelsClickable && emit('mapPick', i.id);
      box.appendChild(b);
      labels[i.id] = b;
    }
  }
  const showMapLabels = (show, clickable = false) => { labelsOn = show; labelsClickable = clickable; const box = $('#mapLabels'); box.classList.toggle('show', show); box.classList.toggle('clickable', clickable); };
  const mapLabelsVisible = () => labelsOn;
  const placeMapLabel = (id, x, y, vis) => { const l = labels[id]; if (!l) return; l.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`; l.style.visibility = vis ? 'visible' : 'hidden'; };

  // ── joystick ──
  {
    const j = $('#joy'), knob = $('i', j);
    let id = null, cx = 0, cy = 0;
    j.addEventListener('pointerdown', (e) => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
    const move = (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx, dy = e.clientY - cy; const R = 44, d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      emit('joy', dx / R, dy / R);
    };
    j.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; emit('joy', 0, 0); };
    j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
  }

  // ── finale ──
  let finaleDone;
  const finale = (show, done) => {
    const f = $('#finale');
    if (show) { finaleDone = done; f.hidden = false; f.classList.remove('text'); $('#hud').classList.add('dim'); }
    else { f.classList.remove('text'); setTimeout(() => (f.hidden = true), 900); $('#hud').classList.remove('dim'); }
  };
  const finaleText = () => $('#finale').classList.add('text');
  $('#keepExploring').addEventListener('click', () => finaleDone && finaleDone());

  return { on, emit, openTip, openImage, loading, showIntro, hideIntro, setCount, pulseCount, setMuted, setMapButton, toast, banner, hint, prompt, fade, openVideo, openTravel, openCats, openWardrobe, openJournal, isOpen, closeTop, setupMapLabels, showMapLabels, mapLabelsVisible, placeMapLabel, finale, finaleText };
}

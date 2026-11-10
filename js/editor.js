// Friend Studio: a hidden panel (open the site with ?edit=1) for making each
// friend's character look more like them. Changes show up live in the world,
// are kept in this browser, and "Export" downloads js/friend-looks.js so they
// can be baked into the site for everyone.
import { friendsAPI, LOOK_STORE } from './friends.js';
import { FRIEND_LOOKS } from './friend-looks.js';

const SKINS = ['#fbe3d2', '#f6d8c8', '#f2d2bc', '#f0c8a8', '#e0b08a', '#d8a880', '#c89070', '#b07a54', '#a8704e', '#9a6646', '#8a5a40', '#6e4630'];
const HAIRS = ['#141012', '#2a1d18', '#3a2418', '#4a2e1e', '#6b4a32', '#8a6240', '#b07a4a', '#c9a06a', '#e2c690', '#d8d4cc', '#9a3a2a', '#5a3a6a'];
const STYLES = [['short', 'Short'], ['swept', 'Swept back'], ['wavyShort', 'Wavy short'], ['curly', 'Curly'], ['bun', 'Bun / pulled back'], ['shoulder', 'Shoulder length'], ['long', 'Long'], ['wavy', 'Long & wavy']];
const OPTIONAL = [['jacket', 'Jacket', '#3a3e48'], ['glasses', 'Glasses', '#2a2628'], ['beard', 'Beard', '#1a1414'], ['cap', 'Cap', '#3f6a4a'], ['necklace', 'Necklace', '#d8b25a']];

const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOOK_STORE) || '{}'); } catch { return {}; } };
const writeLocal = (o) => localStorage.setItem(LOOK_STORE, JSON.stringify(o));

export function startEditor({ visit, toast }) {
  const css = document.createElement('style');
  css.textContent = `
  #studio { position: fixed; right: 14px; top: 84px; width: 300px; max-height: calc(100vh - 110px); overflow-y: auto; z-index: 40;
    background: #fbf3e2; border: 3px solid #6a4430; border-radius: 18px; padding: 12px 14px 14px; font-family: var(--hand, Fredoka, sans-serif); color: #4a2e22; }
  #studio.min .st-body { display: none; }
  #studio h3 { margin: 0; font-family: var(--title, Fraunces, serif); font-size: 21px; display: flex; justify-content: space-between; align-items: center; }
  #studio h3 button { border: 2px solid #8a5a3c; background: #fff7e8; border-radius: 10px; font: inherit; font-size: 13px; padding: 2px 9px; cursor: pointer; color: #4a2e22; }
  #studio .st-hint { font-size: 12px; opacity: .75; margin: 2px 0 8px; }
  #studio label { display: block; font-size: 13px; font-weight: 600; margin: 9px 0 4px; }
  #studio select, #studio input[type=range] { width: 100%; font: inherit; font-size: 14px; }
  #studio select { padding: 5px 8px; border-radius: 10px; border: 2px solid #c9a37a; background: #fffaf0; color: #4a2e22; }
  #studio .sw { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
  #studio .sw button { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; outline: 1px solid #8a5a3c; cursor: pointer; padding: 0; }
  #studio .sw button.on { outline: 3px solid #e8a83a; }
  #studio input[type=color] { width: 30px; height: 26px; border: none; background: none; padding: 0; cursor: pointer; }
  #studio .row { display: flex; align-items: center; gap: 8px; margin: 5px 0; font-size: 13px; }
  #studio .row span { flex: 1; }
  #studio .tabs { display: flex; gap: 6px; margin-top: 8px; }
  #studio .tabs button, #studio .acts button { flex: 1; font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 11px; border: 2px solid #8a5a3c; background: #fff7e8; color: #4a2e22; cursor: pointer; }
  #studio .tabs button.on { background: #f2d7a6; }
  #studio .acts { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
  #studio .acts button.main { background: #e8b84a; }
  @media (max-width: 600px) { #studio { left: 8px; right: 8px; top: auto; bottom: 8px; width: auto; max-height: 46vh; } }`;
  document.head.appendChild(css);

  const el = document.createElement('div');
  el.id = 'studio';
  el.innerHTML = `<h3>Friend Studio <button class="st-min">–</button></h3>
    <div class="st-body"><div class="st-hint">Pick a friend — you'll fly over to them. Changes save in this browser; Export to make them permanent.</div>
    <label>Friend</label><select class="st-who"></select><div class="tabs"></div><div class="st-ctrls"></div>
    <div class="acts"><button class="st-reset">Reset friend</button><button class="st-copy">Copy</button><button class="st-export main">Export file</button></div></div>`;
  document.body.appendChild(el);
  for (const ev of ['pointerdown', 'wheel', 'keydown']) el.addEventListener(ev, (e) => e.stopPropagation());
  const $ = (s) => el.querySelector(s);
  $('.st-min').onclick = () => { el.classList.toggle('min'); $('.st-min').textContent = el.classList.contains('min') ? '+' : '–'; };

  const friends = friendsAPI.list;
  const who = $('.st-who');
  friends.forEach((f, i) => { const o = document.createElement('option'); o.value = i; o.textContent = `${f.look.name} · ${f.isl.info.name}`; who.appendChild(o); });
  let cur = null, part = 's';

  const change = (key, val) => {
    const all = readLocal(), mine = all[cur.id] || (all[cur.id] = {});
    if (key === 'cat') mine.cat = val;
    else (mine[part] ||= {})[key] = val;
    writeLocal(all);
    friendsAPI.restyle(cur);
    render(false);
  };

  function swatches(label, key, list, value) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label>${label}</label><div class="sw"></div>`;
    const sw = wrap.querySelector('.sw');
    for (const c of list) { const b = document.createElement('button'); b.style.background = c; b.title = c; if (c === value) b.className = 'on'; b.onclick = () => change(key, c); sw.appendChild(b); }
    const pick = document.createElement('input'); pick.type = 'color'; pick.value = value || '#888888'; pick.title = 'Any colour'; pick.oninput = () => change(key, pick.value); sw.appendChild(pick);
    return wrap;
  }
  function colorRow(label, key, value) {
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<span>${label}</span>`;
    const i = document.createElement('input'); i.type = 'color'; i.value = value || '#888888'; i.oninput = () => change(key, i.value);
    r.appendChild(i); return r;
  }

  function render(fly = true) {
    cur = friends[+who.value];
    const look = cur.look, tabs = $('.tabs'), box = $('.st-ctrls');
    tabs.innerHTML = ''; box.innerHTML = '';
    if (look.plus) {
      for (const [k, n] of [['s', look.name], ['plus', 'Their friend']]) { const b = document.createElement('button'); b.textContent = n; if (part === k) b.className = 'on'; b.onclick = () => { part = k; render(false); }; tabs.appendChild(b); }
    } else part = 's';
    if (look.cat) {
      box.appendChild(swatches('Fur', 'cat', ['#3a3230', '#141012', '#6b4a32', '#b07a4a', '#f0a050', '#b1abae', '#f6efe4', '#fbf8f2'], look.cat));
    } else {
      const s = look[part];
      box.appendChild(swatches('Skin tone', 'skin', SKINS, s.skin));
      box.appendChild(swatches('Hair colour', 'hair', HAIRS, s.hair));
      const hs = document.createElement('div'); hs.innerHTML = '<label>Hairstyle</label>';
      const sel = document.createElement('select');
      for (const [v, n] of STYLES) { const o = document.createElement('option'); o.value = v; o.textContent = n; if (s.hairStyle === v) o.selected = true; sel.appendChild(o); }
      sel.onchange = () => change('hairStyle', sel.value); hs.appendChild(sel); box.appendChild(hs);
      const cl = document.createElement('div'); cl.innerHTML = '<label>Clothes</label>';
      cl.appendChild(colorRow('Top', 'top', s.top));
      cl.appendChild(colorRow('Trousers / legs', 'bottom', s.bottom ?? '#1c1a1e'));
      cl.appendChild(colorRow('Shoes', 'shoes', s.shoes ?? '#151315'));
      for (const [k, n] of [['dress', 'Dress'], ['sleeveless', 'Sleeveless'], ['mandarin', 'Mandarin collar']]) {
        const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span>${n}</span>`;
        const c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!s[k]; c.onchange = () => change(k, c.checked); r.appendChild(c); cl.appendChild(r);
      }
      box.appendChild(cl);
      const ex = document.createElement('div'); ex.innerHTML = '<label>Extras</label>';
      for (const [k, n, def] of OPTIONAL) {
        const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span>${n}</span>`;
        const on = !!s[k], col = typeof s[k] === 'string' ? s[k] : def;
        const c = document.createElement('input'); c.type = 'checkbox'; c.checked = on;
        const i = document.createElement('input'); i.type = 'color'; i.value = col; i.disabled = !on;
        c.onchange = () => change(k, c.checked ? i.value : false);
        i.oninput = () => change(k, i.value);
        r.append(i, c); ex.appendChild(r);
      }
      const hr = document.createElement('div'); hr.innerHTML = `<label>Height</label>`;
      const h = document.createElement('input'); h.type = 'range'; h.min = 0.88; h.max = 1.16; h.step = 0.01; h.value = s.tall ?? 1;
      h.onchange = () => change('tall', +h.value); hr.appendChild(h); ex.appendChild(hr);
      box.appendChild(ex);
    }
    if (fly) visit(cur);
  }
  who.onchange = () => { part = 's'; render(); };

  $('.st-reset').onclick = () => { const all = readLocal(); delete all[cur.id]; writeLocal(all); friendsAPI.restyle(cur); render(false); toast(`${cur.look.name} is back to the saved look`); };
  const merged = () => { const out = JSON.parse(JSON.stringify(FRIEND_LOOKS)); const loc = readLocal(); for (const [id, o] of Object.entries(loc)) { const t = out[id] || (out[id] = {}); if (o.cat) t.cat = o.cat; for (const k of ['s', 'plus']) if (o[k]) t[k] = { ...(t[k] || {}), ...o[k] }; } return out; };
  const fileText = () => `// Saved customisations from the friend editor (open the site with ?edit=1).
// The editor's "Export" button downloads a new copy of this file — drop it in
// here (replacing this one) and redeploy to make the looks permanent.
export const FRIEND_LOOKS = ${JSON.stringify(merged(), null, 2)};
`;
  $('.st-copy').onclick = async () => { try { await navigator.clipboard.writeText(fileText()); toast('Copied the looks to your clipboard ✦'); } catch { toast('Copy failed — use Export file instead'); } };
  $('.st-export').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' }));
    a.download = 'friend-looks.js'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Downloaded friend-looks.js ✦ put it in the js folder to make it permanent');
  };
  render();
}

// The friends who sent birthday messages, each standing beside the spot where
// their video is hidden. They wave when the birthday person comes near and
// show a little name tag.
import * as THREE from 'three';
import { makePerson, animatePerson, Inst, makeFluffyCat } from './people.js';
import { buildCat } from './avatar.js';
import { FRIEND_LOOKS } from './friend-looks.js';

export const LOOK_STORE = 'archipelago-friend-looks';

// Default looks, handed out in turn to friends who don't have a `look` in
// world.config.js. Change any friend in Friend Studio (?edit=1) or in the config.
const DEFAULTS = [
  { skin: '#f2d2bc', hair: '#1a1414', hairStyle: 'long', top: '#e2b0a6', bottom: '#2a2a30' },
  { skin: '#c8906a', hair: '#2a1a14', hairStyle: 'curly', top: '#8fb8de', bottom: '#3a3e48' },
  { skin: '#f6d8c8', hair: '#b07a4a', hairStyle: 'bun', top: '#c9ced3', bottom: '#3a3e48' },
  { skin: '#8a5a40', hair: '#141012', hairStyle: 'short', top: '#f2c46a', bottom: '#2a3048', glasses: '#2a2628' },
  { skin: '#e0b08a', hair: '#3a2418', hairStyle: 'wavyShort', top: '#7aa86a', bottom: '#2a2a30' },
  { skin: '#f0c8a8', hair: '#6b4a32', hairStyle: 'shoulder', top: '#b39ad8', bottom: '#1a1a1e' },
  { skin: '#a8704e', hair: '#141012', hairStyle: 'swept', top: '#e8e2d6', jacket: '#3a4a6a', bottom: '#2a2a30' },
];
const LOOKS = {};
export function registerLooks(memories) {
  let n = 0, k = 0;
  for (const m of memories) {
    const id = `${m.island}:${m.spot}`;
    const name = m.sender || `Friend ${++k}`;
    LOOKS[id] = m.cat
      ? { name, cat: m.cat }
      : { name, s: { ...DEFAULTS[n++ % DEFAULTS.length], ...(m.look || {}) } };
  }
}

function nameTag(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 72;
  const g = c.getContext('2d');
  g.font = '600 34px Fredoka, sans-serif';
  const w = Math.min(244, g.measureText(text).width + 36);
  g.fillStyle = 'rgba(255,248,232,0.95)'; g.strokeStyle = '#8a5a3c'; g.lineWidth = 3;
  g.beginPath(); g.roundRect((256 - w) / 2, 8, w, 54, 26); g.fill(); g.stroke();
  g.fillStyle = '#4a2e22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 37, 230);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(1.3, 0.37, 1);
  return s;
}

// find a free patch of ground beside the spot, not in her way
function standPoint(isl, sp) {
  let dx = sp.glowX - sp.x, dz = sp.glowZ - sp.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.2) { dx = 0; dz = 1; } else { dx /= d; dz /= d; }
  const px = -dz, pz = dx;
  for (const [a, b] of [[1.15, 0.2], [-1.15, 0.2], [1.5, -0.4], [-1.5, -0.4], [0.9, -1.0], [-0.9, -1.0], [0, -1.4], [2.0, 0.6], [-2.0, 0.6]]) {
    const x = sp.x + px * a + dx * b, z = sp.z + pz * a + dz * b;
    if (!isl.blocked(x, z, 0.35)) return [x, z];
  }
  return [sp.x - dx * 1.2, sp.z - dz * 1.2];
}

// the look for one spot: built-in defaults ← the exported file ← this browser's edits
function lookFor(id) {
  const base = LOOKS[id];
  if (!base) return null;
  let local = {};
  try { local = JSON.parse(localStorage.getItem(LOOK_STORE) || '{}')[id] || {}; } catch { local = {}; }
  const o = { ...(FRIEND_LOOKS[id] || {}), ...local };
  return { ...base, s: base.s && { ...base.s, ...(o.s || {}) }, plus: base.plus && { ...base.plus, ...(o.plus || {}) }, cat: o.cat ?? base.cat };
}

// (re)build what a friend looks like inside their group
function dress(f) {
  for (const o of [...f.people, ...f.cats]) f.g.remove(o);
  if (f.tabby) f.g.remove(f.tabby.root);
  f.people = []; f.cats = []; f.tabby = null; f.guitar = false;
  const look = f.look;
  if (look.cat) {
    const cat = makeFluffyCat(look.cat, { s: 1.15 }); f.g.add(cat); f.cats.push(cat);
    return;
  }
  const p = makePerson(look.s); f.g.add(p); f.people.push(p);
  if (look.plus) { const q = makePerson(look.plus); q.position.set(-0.55, 0, 0.1); q.rotation.y = 0.3; f.g.add(q); f.people.push(q); }
  if (look.guitar) {
    const gt = Inst.guitar('#e2b77a', true); const u = p.userData;
    gt.position.set(0.02, u.hip + 0.3, 0.22); gt.rotation.z = -1.1; u.body.add(gt); f.guitar = true;
  }
  if (look.tabby) { const c = buildCat(); c.root.scale.setScalar(0.85); c.root.position.set(0.6, 0, 0.25); c.root.rotation.y = -0.4; f.g.add(c.root); f.tabby = c; }
}

// what the editor uses: the list of friends, and a way to change one live
export const friendsAPI = { list: [], defaults: LOOKS, restyle: null };

export function placeFriends(spots) {
  const friends = [];
  for (const sp of spots) {
    const id = sp.memory && `${sp.memory.island}:${sp.memory.spot}`;
    const look = id && lookFor(id);
    if (!look) continue;
    const isl = sp.island;
    const [x, z] = look.at || standPoint(isl, sp);
    const g = new THREE.Group();
    g.position.set(x, isl.heightAt(x, z), z);
    g.rotation.y = Math.atan2(sp.x - x, sp.z - z);        // facing where the birthday person will stand
    isl.group.add(g);
    const f = { g, sp, isl, ph: friends.length * 0.9, people: [], cats: [], id, look };
    dress(f);
    const tag = nameTag(look.name);
    tag.position.set(0, look.cat ? 1.1 : 2.45, 0); g.add(tag); f.tag = tag;
    isl.circle(x, z, look.plus ? 0.6 : 0.32, 1.8);
    friends.push(f);
  }
  // rebuild the walking grids so click-to-walk steps round them
  for (const isl of new Set(friends.map((f) => f.isl))) isl.buildNav();
  friendsAPI.list = friends;
  friendsAPI.restyle = (f) => { f.look = lookFor(f.id); dress(f); };

  return (t, dt, S) => {
    for (const f of friends) {
      const here = S.island === f.isl;
      f.g.visible = here || S.mode === 'map' || S.mode === 'travel';
      if (!f.g.visible) continue;
      const d = here ? Math.hypot(S.pos.x - f.g.position.x, S.pos.z - f.g.position.z) : 99;
      const near = d < 4.5;
      // turn toward her when she's close, otherwise face the spot
      const want = near ? Math.atan2(S.pos.x - f.g.position.x, S.pos.z - f.g.position.z) : Math.atan2(f.sp.x - f.g.position.x, f.sp.z - f.g.position.z);
      let da = ((want - f.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      f.g.rotation.y += da * Math.min(1, dt * 3);
      f.people.forEach((p, i) => animatePerson(p, t + i, f.guitar ? 'guitar' : near && !f.sp.found ? 'wave' : 'chat', f.ph + i));
      for (const c of f.cats) { c.userData.tail.rotation.z = Math.sin(t * 1.8 + f.ph) * 0.4; c.userData.head.rotation.y = Math.sin(t * 0.7 + f.ph) * 0.3; }
      if (f.tabby) f.tabby.update(dt, 0, t);
      f.tag.material.opacity = THREE.MathUtils.clamp((9 - d) / 3, 0, 1);
      f.tag.visible = f.tag.material.opacity > 0.01;
    }
  };
}

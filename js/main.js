import * as THREE from 'three';
import { U, IS_MOBILE, softDot } from './kit.js';
import { buildWorld } from './world.js';
import { buildOverlook } from './islands/overlook.js';
import { buildNYC } from './islands/nyc.js';
import { buildDC } from './islands/dc.js';
import { buildRotunda } from './islands/rotunda.js';
import { buildMet } from './islands/met.js';
import { buildCarnegie } from './islands/carnegie.js';
import { buildGeffen } from './islands/geffen.js';
import { buildPlaceholder } from './islands/placeholder.js';
import { buildAvatar, buildCat, buildDog, CAT_SKINS, OUTFITS } from './avatar.js';
import { placeFriends, registerLooks } from './friends.js';
import { startEditor } from './editor.js';
import { MEMORIES, MUSIC_FILE, MUSIC_YOUTUBE, ISLANDS, PERSON, TEXT, PETS, SETUP_TIPS, SHOW_PLACEHOLDERS } from './content.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';

const params = new URLSearchParams(location.search);
// fill the page's words in from world.config.js
document.title = TEXT.pageTitle;
for (const el of document.querySelectorAll('[data-text]')) el.textContent = TEXT[el.dataset.text] ?? '';
const $ = (s) => document.querySelector(s);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

// ── persistence ──
const STORE = 'hide-and-seek-birthday-v1';
if (params.has('reset')) localStorage.removeItem(STORE);
const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
const state = {
  found: new Set(saved.found || []),
  finaleSeen: !!saved.finaleSeen,
  reduced: saved.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches,
  volume: saved.volume ?? 0.7,
  muted: !!saved.muted,
  dogJoined: !!saved.dogJoined,
  catSkin: saved.catSkin || 'orangeTabby',
  outfit: saved.outfit || PERSON.outfit,
};
const save = () => localStorage.setItem(STORE, JSON.stringify({ found: [...state.found], finaleSeen: state.finaleSeen, reduced: state.reduced, volume: state.volume, muted: state.muted, dogJoined: state.dogJoined, catSkin: state.catSkin, outfit: state.outfit }));
const memKey = (m) => m.file || `${m.island}:${m.spot}`;
if (params.has('all')) MEMORIES.forEach((m) => m.file && state.found.add(memKey(m)));
const TOTAL = MEMORIES.length;

// ── renderer ──
const renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE || devicePixelRatio < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !IS_MOBILE;
renderer.shadowMap.type = THREE.PCFShadowMap;
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.3, 3000);
const onResize = () => { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 0.8 ? 62 : 50; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); };
addEventListener('resize', onResize);
onResize();

const ui = createUI({ total: TOTAL, state });
const audio = createAudio({ file: MUSIC_FILE, youtube: MUSIC_YOUTUBE, state, onMissing: (why) => (MUSIC_FILE || MUSIC_YOUTUBE) && ui.toast(why || 'Music file not found: check music.file in world.config.js') });

// ── build the world, with a real loading bar ──
let world, islands = [], byId = {}, interiors = [];
async function build() {
  const steps = [
    ['Painting the sky', () => { world = buildWorld(scene); }],
    ['Raising the Overlook', () => buildOverlook(scene)],
    ['Lighting up New York', () => buildNYC(scene)],
    ['Planting cherry blossoms', () => buildDC(scene)],
    ['Lighting the Met\'s chandeliers', () => { const m = buildMet(scene); interiors.push(m, m.up); byId.metOpera = m; byId.metUp = m.up; }],
    ['Seating the audience at Geffen Hall', () => { const g = buildGeffen(scene); interiors.push(g); byId.geffen = g; }],
    ['Tuning the orchestra at Carnegie Hall', () => { const c = buildCarnegie(scene); interiors.push(c); byId.carnegie = c; }],
    ['Polishing the Capitol Rotunda', () => { const r = buildRotunda(scene); interiors.push(r); byId.rotunda = r; }],
    ...(SHOW_PLACEHOLDERS ? [
      ['Rolling in the sea mist', () => buildPlaceholder(scene, { id: 'mistA', center: [80, 6, -12], seed: 7711 })],
      ['Saving room for your places', () => buildPlaceholder(scene, { id: 'mistB', center: [-38, -4, -58], seed: 8833 })],
    ] : []),
  ];
  // canvas signs are painted once, so make sure their fonts are loaded first
  if (document.fonts) await Promise.race([
    Promise.all(['700 40px Fraunces', 'italic 500 40px Fraunces', '600 40px Fraunces', '800 40px Nunito', '600 20px Fredoka', '20px "Lilita One"'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  for (let i = 0; i < steps.length; i++) {
    ui.loading(i / steps.length, steps[i][0]);
    await nextFrame();
    const isl = steps[i][1]();
    if (isl) { islands.push(isl); byId[isl.id] = isl; }
  }
  for (const room of interiors) room.player = S;
  setupDogHome();
  ui.loading(0.95, 'Hiding the messages');
  await nextFrame();
}

// ── discovery spots ──
const glowTex = softDot(128, 'rgba(255,226,150,1)', 'rgba(255,190,90,0)');
const starTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.translate(32, 32); g.fillStyle = '#fff6da'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 6 : 30; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const pickables = [];
const spots = [];
function setupSpots() {
  for (const m of MEMORIES) {
    const isl = byId[m.island];
    const sp = isl && isl.spots.find((s) => s.id === m.spot);
    if (!sp) { console.warn('Unknown spot for memory', m); continue; }
    if (sp.memory) { console.warn('Two memories share a spot:', m.spot); continue; }
    sp.memory = m;
  }
  for (const isl of [...islands, ...interiors]) for (const sp of isl.spots) {
    if (!sp.memory && !sp.isGate && !sp.isEaster && !sp.prompt) continue;
    spots.push(sp);
    const g = new THREE.Group();
    g.position.set(sp.glowX, isl.heightAt(sp.glowX, sp.glowZ) + sp.glowY, sp.glowZ);
    if (sp.memory) {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe7a8' }));
      g.add(halo, star);
      sp.halo = halo; sp.star = star;
    }
    const pick = new THREE.Mesh(new THREE.SphereGeometry(sp.isGate ? 2.2 : 1.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    pick.userData.spot = sp;
    g.add(pick);
    pickables.push(pick);
    sp.marker = g;
    isl.group.add(g);
  }
  // celebration spot (activates once everything is found)
  const ov = byId.overlook;
  const cel = { id: 'celebration', island: ov, x: 0, z: 2.2, glowX: 0, glowZ: -0.8, glowY: 3, reach: 3.4, label: 'the birthday cake', isCelebration: true };
  const pick = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  pick.position.set(0, 1.5, -0.8); pick.userData.spot = cel; ov.group.add(pick); pickables.push(pick);
  cel.pick = pick;
  spots.push(cel);
  refreshSpots();
}
function refreshSpots() {
  for (const sp of spots) {
    if (sp.isCelebration) { sp.active = allFound(); sp.pick.visible = true; continue; }
    if (!sp.memory) continue;
    sp.found = state.found.has(memKey(sp.memory));
  }
  ui.setCount(foundCount());
  const ov = byId.overlook;
  if (ov && ov.celebration) ov.celebration.group.visible = allFound() || state.finaleSeen;
}
const foundCount = () => MEMORIES.filter((m) => state.found.has(memKey(m))).length;
const allFound = () => TOTAL > 0 && foundCount() >= TOTAL;

// ── avatar + companion ──
let avatar = buildAvatar(state.outfit);
let corgi = buildCat(state.catSkin);
const dog = buildDog();
scene.add(avatar.root, corgi.root, dog.root);
// the cat's own mini scooter (pink, with a teal stripe and a tiny headlight)
const catScooter = (() => {
  const g = new THREE.Group();
  const m = (c) => new THREE.MeshToonMaterial({ color: c });
  const add = (geo, mat, x, y, z, rx = 0, rz = 0, p = g) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.rotation.set(rx, 0, rz); me.castShadow = true; p.add(me); return me; };
  const pink = m('#f4a6c0'), dark = m('#2a2628'), teal = m('#2fbf8f');
  add(new THREE.BoxGeometry(0.26, 0.04, 0.62), pink, 0, 0.1, 0);
  add(new THREE.BoxGeometry(0.27, 0.02, 0.63), teal, 0, 0.075, 0);
  const wheels = [-0.3, 0.32].map((z) => { const w = new THREE.Group(); w.position.set(0, 0.07, z); g.add(w); add(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), dark, 0, 0, 0, 0, Math.PI / 2, w); add(new THREE.BoxGeometry(0.06, 0.06, 0.02), m('#d8dde4'), 0, 0, 0, 0, 0, w); return w; });
  add(new THREE.CylinderGeometry(0.018, 0.02, 0.5, 6), pink, 0, 0.36, 0.36, -0.12);
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 6), dark, 0, 0.6, 0.39, 0, Math.PI / 2);
  add(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff6da' }), 0, 0.52, 0.41);
  g.userData.wheels = wheels;
  g.visible = false;
  return g;
})();
scene.add(catScooter);
const S = {
  mode: 'loading',             // loading | intro | explore | travel | map | modal | finale
  island: null,
  pos: new THREE.Vector3(),    // island-local
  heading: Math.PI,
  path: [],
  pendingSpot: null,
  speed: 0,
  keys: {},
  joy: new THREE.Vector2(),
  flight: null,
  corgi: { pos: new THREE.Vector3(), heading: 0, island: null },
  dog: { pos: new THREE.Vector3(), heading: 0, island: null },
  nearSpot: null,
  idleT: 0,
  ride: null,                  // the e-scooter, while riding it
};
const rig = { yaw: 0, pitch: 0.62, dist: 15, cur: 15, target: new THREE.Vector3(), look: new THREE.Vector3() };
const camTween = { on: false };

function placeOn(isl, x, z, face) {
  S.island = isl;
  S.pos.set(x, 0, z);
  S.pos.onStair = false;
  isl.resolve(S.pos);
  S.heading = face ?? Math.atan2(-x, -z);
  S.path = [];
  S.corgi.island = isl;
  S.corgi.pos.set(x + 1.2, 0, z + 0.8);
  isl.resolve(S.corgi.pos);
  S.dog.island = isl;
  S.dog.pos.set(x - 1.3, 0, z + 0.9);
  isl.resolve(S.dog.pos);
}
function worldPos(isl, p, out = new THREE.Vector3()) { return out.set(isl.center.x + p.x, isl.center.y + isl.heightAt(p.x, p.z), isl.center.z + p.z); }

// ── camera rig ──
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _ray = new THREE.Ray();
function followPose(outPos, outLook, dt = 1) {
  const t = rig.target;
  if (S.mode === 'travel' && S.flight) t.copy(avatar.root.position).add(_v.set(0, 1.3, 0));
  else worldPos(S.island, S.pos, t).add(_v.set(0, 1.35, 0));
  const zoomPitch = THREE.MathUtils.clamp((rig.dist - 22) / 38, 0, 1) * 0.55;
  // pulling the pitch below the usual floor tilts the view upward (everywhere, while exploring)
  const lookUp = canLookUp() ? Math.max(0, 0.22 - rig.pitch) : 0;
  if (!lookUp && rig.pitch < 0.22) rig.pitch = 0.22;
  const pitch = Math.max(rig.pitch, 0.3 + zoomPitch, lookUp ? 0.12 : -1);
  const dir = _v2.set(Math.sin(rig.yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(rig.yaw) * Math.cos(pitch));
  // don't let buildings swallow the camera
  let d = rig.dist;
  if (S.island && S.mode !== 'travel') {
    _ray.set(t, dir);
    for (const box of S.island.occluders()) {
      const hit = _ray.intersectBox(box, _v);
      if (hit) { const hd = hit.distanceTo(t); if (hd < d) d = Math.max(2.2, hd - 0.6); }
    }
  }
  // indoors, keep the camera under the ceiling
  if (S.island && S.island.ceilingY && dir.y > 0.01) d = Math.min(d, Math.max(2.2, (S.island.center.y + S.island.ceilingY - 0.5 - t.y) / dir.y));
  rig.cur += (d - rig.cur) * Math.min(1, dt * (d < rig.cur ? 12 : 3));
  outPos.copy(t).addScaledVector(dir, rig.cur);
  outLook.copy(t);
  if (lookUp) outLook.y += lookUp * 24;
}
const canLookUp = () => !!S.island && S.mode === 'explore';
const minPitch = () => (canLookUp() ? -0.75 : 0.22);
const MAP_POS = new THREE.Vector3(0, 125, 150), MAP_LOOK = new THREE.Vector3(0, -8, -28);
// pull wide shots back on portrait screens so every island still fits
const fit = () => THREE.MathUtils.clamp(1.2 / camera.aspect, 1, 1.9);
function mapPose(outPos, outLook, t) {
  const drift = state.reduced ? 0 : Math.sin(t * 0.05) * 0.12, k = fit();
  outPos.set(Math.sin(drift) * 160 * k, MAP_POS.y * k, Math.cos(drift) * 160 * k - 10);
  outLook.copy(MAP_LOOK);
}
function introPose(outPos, outLook, t) {
  const a = state.reduced ? 0 : Math.sin(t * 0.04) * 0.25;
  const k = fit();
  outPos.set(Math.sin(a) * 104 * k, 38 * k + Math.sin(t * 0.07) * (state.reduced ? 0 : 3), Math.cos(a) * 104 * k + 22);
  outLook.set(0, k > 1.2 ? 10 : 30, -30);
}
function tweenCamera(dur, pose) {
  camTween.on = true;
  camTween.t = 0;
  camTween.dur = state.reduced ? Math.min(dur, 0.9) : dur;
  camTween.fromPos = camera.position.clone();
  camTween.fromLook = rig.look.clone();
  camTween.pose = pose;
}
const _cp = new THREE.Vector3(), _cl = new THREE.Vector3();
function updateCamera(dt, t) {
  let pose = followPose;
  if (S.mode === 'intro' || S.mode === 'loading') pose = introPose;
  else if (S.mode === 'map') pose = mapPose;
  else if (S.mode === 'finale') pose = finalePose;
  pose(_cp, _cl, t, dt);
  if (camTween.on) {
    camTween.t += dt / camTween.dur;
    const k = ease(Math.min(1, camTween.t));
    // lift the path a little so long moves arc instead of cutting through islands
    const lift = Math.sin(k * Math.PI) * Math.min(40, camTween.fromPos.distanceTo(_cp) * 0.25);
    camera.position.lerpVectors(camTween.fromPos, _cp, k).y += lift;
    rig.look.lerpVectors(camTween.fromLook, _cl, k);
    if (camTween.t >= 1) camTween.on = false;
  } else {
    camera.position.copy(_cp);
    rig.look.copy(_cl);
  }
  camera.lookAt(rig.look);
}

// ── finale camera ──
let finale = null;
function finalePose(outPos, outLook, t) {
  const ov = byId.overlook;
  const c = _v.set(ov.center.x, ov.center.y + 1.8, ov.center.z - 0.8);
  const el = t - finale.t0;
  const a = (state.reduced ? 0 : el * 0.06) + 0.55;
  const d = THREE.MathUtils.lerp(16, 8.5, ease(Math.min(1, el / 6)));
  const h = THREE.MathUtils.lerp(9, 3.2, ease(Math.min(1, el / 6)));
  outPos.set(c.x + Math.sin(a) * d, c.y + h, c.z + Math.cos(a) * d);
  outLook.copy(c).add(_v2.set(0, THREE.MathUtils.lerp(0, 1.4, ease(Math.min(1, el / 8))), 0));
}

// ── input ──
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pointers = new Map();
let drag = null, pinch = null;
const canvas = renderer.domElement;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, t: performance.now() };
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: rig.dist }; drag = null; }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) { hover(e); return; }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    rig.dist = THREE.MathUtils.clamp(pinch.dist * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 4.5, 60);
    return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 7) drag.moved = true;
  if (drag.moved && (S.mode === 'explore' || S.mode === 'travel')) {
    rig.yaw -= dx * 0.0055;
    rig.pitch = THREE.MathUtils.clamp(rig.pitch + dy * 0.004, minPitch(), 1.2);
  }
  drag.x = e.clientX; drag.y = e.clientY;
});
const endPointer = (e) => {
  const wasTap = drag && !drag.moved && pointers.size === 1 && performance.now() - drag.t < 600;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (wasTap) click(e.clientX, e.clientY);
  if (!pointers.size) drag = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); drag = null; pinch = null; });
// Trackpad: two-finger scroll orbits and tilts the camera, pinch zooms
// (browsers report pinch as a wheel event with ctrlKey). A mouse wheel zooms.
let trackpad = false;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (S.mode !== 'explore' && S.mode !== 'travel') return;
  if (e.deltaMode === 0 && (e.deltaX !== 0 || (!Number.isInteger(e.deltaY) && !e.ctrlKey))) trackpad = true;
  if (e.ctrlKey) {
    rig.dist = THREE.MathUtils.clamp(rig.dist * Math.exp(e.deltaY * 0.012), 4.5, 60);
  } else if (trackpad && !e.altKey) {
    rig.yaw += e.deltaX * 0.006;
    rig.pitch = THREE.MathUtils.clamp(rig.pitch + e.deltaY * 0.0045, minPitch(), 1.2);
  } else {
    rig.dist = THREE.MathUtils.clamp(rig.dist * Math.exp(e.deltaY * 0.0012), 4.5, 60);
  }
}, { passive: false });
// Safari pinch gestures
let gestureDist = 0;
canvas.addEventListener('gesturestart', (e) => { e.preventDefault(); gestureDist = rig.dist; });
canvas.addEventListener('gesturechange', (e) => { e.preventDefault(); if (S.mode === 'explore') rig.dist = THREE.MathUtils.clamp(gestureDist / e.scale, 4.5, 60); });

function hover(e) {
  if (S.mode !== 'explore' && S.mode !== 'map') { canvas.style.cursor = ''; return; }
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (S.mode === 'map') { canvas.style.cursor = pickIsland() ? 'pointer' : ''; return; }
  const hit = raycaster.intersectObjects(pickables.filter((p) => p.userData.spot.island === S.island && (!p.userData.spot.isCelebration || p.userData.spot.active)), false)[0];
  canvas.style.cursor = hit ? 'pointer' : '';
}

function pickIsland() {
  const hits = raycaster.intersectObjects(islands.map((i) => i.group), true);
  for (const h of hits) { let o = h.object; while (o) { for (const isl of islands) if (isl.group === o) return isl; o = o.parent; } }
  return null;
}

const clickMarker = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.4, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff3c8', transparent: true, depthWrite: false }));
clickMarker.visible = false;
scene.add(clickMarker);

function click(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (S.mode === 'map') { const isl = pickIsland(); if (isl) travelTo(isl); return; }
  if (S.mode !== 'explore') return;
  // tapping the cat or the dog: pets and treats
  const petHit = raycaster.intersectObjects(state.dogJoined || (PETS.dog && S.island.id === PETS.dog.island) ? [corgi.root, dog.root] : [corgi.root], true)[0];
  if (petHit) {
    let o = petHit.object; while (o && o !== corgi.root && o !== dog.root) o = o.parent;
    if (o === dog.root && !state.dogJoined) { const sp = spots.find((q) => q.pup); if (sp) walkToSpot(sp); }
    else petAnimal(o === dog.root ? 'dog' : 'cat');
    return;
  }
  const cand = pickables.filter((p) => p.userData.spot.island === S.island && !(p.userData.spot.pup && state.dogJoined) && (!p.userData.spot.isCelebration || p.userData.spot.active) && !(S.ride && p.userData.spot.ride));
  const hit = raycaster.intersectObjects(cand, false)[0];
  if (hit) { walkToSpot(hit.object.userData.spot); return; }
  const g = raycaster.intersectObject(S.island.ground, false)[0];
  if (g) {
    const lx = g.point.x - S.island.center.x, lz = g.point.z - S.island.center.z;
    walkTo(lx, lz);
    clickMarker.position.set(g.point.x, S.island.center.y + S.island.heightAt(lx, lz) + 0.05, g.point.z);
    clickMarker.visible = true; clickMarker.userData.t = 0;
    return;
  }
  // clicked another island: offer the quick way there
  const other = pickIsland();
  if (other && other !== S.island) ui.toast(`Use a Sky Gate or the World Map to fly to ${other.info.name}`);
}

function walkTo(x, z) {
  const p = S.island.findPath(S.pos.x, S.pos.z, x, z);
  S.path = p || [];
  S.pendingSpot = null;
}
function walkToSpot(sp) {
  if (Math.hypot(S.pos.x - sp.x, S.pos.z - sp.z) < sp.reach) { interact(sp); return; }
  walkTo(sp.x, sp.z);
  S.pendingSpot = sp;
}

addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  if (ui.isOpen()) { if (k === 'escape') ui.closeTop(); return; }
  S.keys[k] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if ((k === 'e' || k === 'enter') && S.mode === 'explore' && S.nearSpot) interact(S.nearSpot);
  if (k === 'm' && (S.mode === 'explore' || S.mode === 'map')) toggleMap();
  if (k === 'escape' && S.mode === 'map') toggleMap();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { S.path = []; S.pendingSpot = null; }
});
addEventListener('keyup', (e) => { S.keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { S.keys = {}; });

// ── interactions ──
function interact(sp) {
  S.path = []; S.pendingSpot = null;
  if (sp.ride) { if (S.ride) hopOff(); else hopOn(sp.ride); return; }
  if (sp.pup) { joinDog(sp); return; }
  if (sp.catHouse) { openCatHouse(); return; }
  if (sp.wardrobe) { openWardrobe(); return; }
  if (S.ride) hopOff();
  if (sp.isGate) { openTravel(); return; }
  if (sp.isCelebration) { if (sp.active) startFinale(); return; }
  if (sp.enter) { enterInterior(byId[sp.enter], sp); return; }
  if (sp.exit) { exitInterior(null, sp.exitTo); return; }
  if (sp.placeholder) { openSetupTip(PLACEHOLDER_TIP, sp); return; }
  if (sp.memory) openMemory(sp.memory, sp);
}

// ── the DC e-scooter ──
const rideSpot = { id: 'riding', glowY: 2.3, reach: 0, label: 'the e-scooter', prompt: { title: 'Zooming on the e-scooter', sub: 'to hop off' } };
// where the rider sits relative to the vehicle's origin, turned to heading h (scooter: on the deck; car: the driver's seat)
const _seat = new THREE.Vector3();
function seatVec(sc, h, out = _seat) {
  const sx = sc.seat ? sc.seat.x : 0, sz = sc.seat ? sc.seat.z : 0.35;
  return out.set(sx * Math.cos(h) + sz * Math.sin(h), 0, -sx * Math.sin(h) + sz * Math.cos(h));
}
function hopOn(sc) {
  S.ride = sc;
  sc.spot.marker.visible = false;
  if (sc.stand) sc.stand.visible = false;
  rideSpot.ride = sc; rideSpot.island = S.island;
  rideSpot.label = sc.label || 'the e-scooter';
  rideSpot.prompt = sc.ridePrompt || { title: 'Zooming on the e-scooter', sub: 'to hop off' };
  rideSpot.glowY = sc.bubbleY || 2.3;
  S.heading = sc.group.rotation.y;
  const v = seatVec(sc, S.heading);
  S.pos.set(sc.group.position.x + v.x, 0, sc.group.position.z + v.z);
  audio.whoosh();
  ui.toast((sc.hello || 'Wheee! Ride anywhere around DC ✦ ') + (IS_MOBILE ? 'Tap the bubble' : 'Press E') + (sc.byeVerb || ' to hop off'));
}
function hopOff() {
  const sc = S.ride;
  if (!sc) return;
  S.ride = null;
  // park it where it is and step off to the side (a car: out of the driver's door)
  const v = seatVec(sc, S.heading);
  sc.park(S.pos.x - v.x, S.pos.z - v.z, S.heading);
  sc.spot.marker.visible = true;
  const side = sc.exitSide ?? 0.75;
  S.pos.x += Math.cos(S.heading) * side; S.pos.z -= Math.sin(S.heading) * side;
  S.island.resolve(S.pos);
  S.speed = 0;
  audio.tick(0);
}

function openMemory(m, sp) {
  S.mode = 'modal';
  if (!m.file) m.tip = SETUP_TIPS[MEMORIES.filter((q) => !q.file).indexOf(m) % SETUP_TIPS.length];
  const isl = byId[m.island];
  ui.openVideo({
    memory: m,
    place: `${isl.info.name} · ${sp ? sp.label : ''}`,
    onPlay: () => audio.duck(true),
    onWatched: () => {
      if (!state.found.has(memKey(m))) {
        state.found.add(memKey(m));
        save();
        refreshSpots();
        audio.chime();
        ui.pulseCount();
      }
    },
    onClose: () => {
      audio.duck(false);
      S.mode = 'explore';
      if (allFound() && !state.finaleSeen) setTimeout(() => { if (S.mode === 'explore') startFinale(); }, 900);
    },
  });
}

// doors that lead inside a building (the Capitol, the Met, Geffen Hall, Carnegie Hall)
function enterInterior(room, sp) {
  hopOff();
  S.mode = 'modal';
  const doors = sp.doors || [];
  doors.forEach((d) => (d.userData.open = 1));
  audio.chime();
  setTimeout(() => ui.fade(true, () => {
    const L = sp.landing || room.landing;
    placeOn(room, L.x, L.z, L.heading ?? Math.PI);
    rig.yaw = sp.landing ? L.heading + Math.PI : room.camYaw ?? 0; rig.pitch = room.camPitch ?? 0.42; rig.dist = rig.cur = room.camDist ?? 11;
    camTween.on = false;
    S.mode = 'explore';
    ui.fade(false);
    ui.banner(room.info.name, room.info.era);
    setTimeout(() => doors.forEach((d) => (d.userData.open = 0)), 1500);
  }), state.reduced ? 100 : 900);
}
function exitInterior(after, to) {
  S.mode = 'modal';
  ui.fade(true, () => {
    const out = to || S.island.exitTo;
    placeOn(byId[out.island], out.x, out.z, out.heading);
    rig.yaw = out.heading + Math.PI; rig.pitch = 0.5; rig.dist = rig.cur = byId[out.island].camDist ?? 12;
    camTween.on = false;
    S.mode = 'explore';
    ui.fade(false);
    after && after();
  });
}
// the signpost on a misty "your place here" island
const PLACEHOLDER_TIP = { t: 'Add your own island', b: 'This misty island is waiting for one of <i>their</i> places: a hometown, a college, a favourite trip. SETUP.md has a ready-made prompt you can paste into an AI coding assistant, along with a few photos of the place, to build it. Or set <code>showPlaceholderIslands: false</code> in <code>world.config.js</code> to clear the mist away.' };
function openSetupTip(tip, sp) {
  S.mode = 'modal';
  ui.openTip({ tip, place: `${S.island.info.name} · ${sp.label}`, onClose: () => { S.mode = 'explore'; } });
}

function openTravel() {
  S.mode = 'modal';
  ui.openTravel({
    current: S.island.id,
    islands: islands.map((i) => ({ id: i.id, name: i.info.name, era: i.info.era, found: MEMORIES.filter((m) => m.island === i.id && state.found.has(memKey(m))).length, total: MEMORIES.filter((m) => m.island === i.id).length })),
    onPick: (id) => { S.mode = 'explore'; travelTo(byId[id]); },
    onClose: () => { S.mode = 'explore'; },
  });
}

// ── travel between islands (avatar glides on the wind) ──
function travelTo(dest, after) {
  if (!dest) return;
  if (dest !== S.island) hopOff();
  ui.showMapLabels(false);
  ui.setMapButton(false);
  if (dest === S.island && S.mode !== 'map') return;
  const from = worldPos(S.island, S.pos);
  const land = dest.landing;
  const to = worldPos(dest, new THREE.Vector3(land.x, 0, land.z));
  if (state.reduced || S.island.interior) {
    // gentle cut instead of a long flight
    ui.fade(true, () => {
      placeOn(dest, land.x, land.z, Math.atan2(-land.x, -land.z));
      rig.yaw = Math.atan2(land.x, land.z);
      S.mode = 'explore';
      camTween.on = false;
      ui.fade(false);
      ui.banner(dest.info.name, dest.info.era);
      after && after();
    });
    return;
  }
  const dist = from.distanceTo(to);
  const lift = 14 + dist * 0.12;
  const dir = _v.subVectors(to, from).normalize();
  S.flight = {
    p0: from, p3: to,
    p1: from.clone().add(new THREE.Vector3(0, lift, 0)).addScaledVector(dir, dist * 0.2),
    p2: to.clone().add(new THREE.Vector3(0, lift * 0.9, 0)).addScaledVector(dir, -dist * 0.25),
    t: 0, dur: dist < 1 ? 1.5 : 2.6 + dist / 45, dest, after,
  };
  if (S.mode === 'map') tweenCamera(1.6);
  S.mode = 'travel';
  S.path = [];
  rig.yaw = Math.atan2(-dir.x, -dir.z);
  rig.dist = Math.max(rig.dist, 16);
  audio.whoosh();
}
const bez = (a, b, c, d, t, out) => {
  const u = 1 - t;
  return out.set(0, 0, 0).addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c, 3 * u * t * t).addScaledVector(d, t * t * t);
};
const trail = (() => {
  const N = 60, pos = new Float32Array(N * 3), age = new Float32Array(N).fill(9);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('age', new THREE.BufferAttribute(age, 1));
  const p = new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uMap: { value: softDot(64) }, uPx: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `attribute float age; uniform float uPx; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; vA=clamp(1.0-age/1.6,0.0,1.0); gl_PointSize=(6.0*vA+2.0)*uPx*(20.0/max(-mv.z,1.0)); }`,
    fragmentShader: `uniform sampler2D uMap; varying float vA; void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(vec3(1.0,0.86,0.6)*t.rgb, t.a*vA); }`,
  }));
  p.frustumCulled = false;
  scene.add(p);
  let i = 0, acc = 0;
  return {
    update(dt, src, emit) {
      for (let k = 0; k < N; k++) age[k] += dt;
      acc += dt;
      if (emit && acc > 0.03) { acc = 0; pos[i * 3] = src.x + (Math.random() - 0.5) * 0.6; pos[i * 3 + 1] = src.y + 0.6 + (Math.random() - 0.5) * 0.6; pos[i * 3 + 2] = src.z + (Math.random() - 0.5) * 0.6; age[i] = 0; i = (i + 1) % N; }
      g.attributes.position.needsUpdate = true; g.attributes.age.needsUpdate = true;
    },
  };
})();

// ── map ──
function toggleMap() {
  if (S.mode === 'map') {
    S.mode = 'explore';
    ui.showMapLabels(false);
    ui.setMapButton(false);
    tweenCamera(1.8);
  } else if (S.mode === 'explore' && S.island.interior) {
    exitInterior(() => toggleMap());
  } else if (S.mode === 'explore') {
    S.mode = 'map';
    S.path = [];
    ui.showMapLabels(true, true);
    ui.setMapButton(true);
    tweenCamera(2.2);
  }
}

// ── finale ──
function startFinale() {
  const ov = byId.overlook;
  const go = () => {
    S.mode = 'finale';
    finale = { t0: clock.elapsedTime, lit: 0 };
    tweenCamera(2.5);
    const cel = ov.celebration;
    cel.group.visible = true;
    cel.group.userData.rise = 0;
    cel.flames.forEach((f) => { f.visible = false; });
    const L = ov.skyLanterns;
    L.mesh.visible = true; L.glowPts.visible = true; L.t0 = clock.elapsedTime;
    placeOn(ov, -2.3, 2.4, Math.atan2(2.3, -3.2));
    audio.duck(false);
    ui.finale(true, () => {
      // back to exploring; the cake stays and can be revisited any time
      state.finaleSeen = true; save();
      S.mode = 'explore';
      rig.yaw = 0; rig.pitch = 0.5; rig.dist = 12;
      tweenCamera(2);
      ui.finale(false);
    });
  };
  if (S.island !== ov) travelTo(ov, go);
  else go();
}

// ── per-frame ──
const clock = { last: performance.now(), elapsedTime: 0, getDelta() { const n = performance.now(), d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d; } };
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _mv = new THREE.Vector3();
let lastProj = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  U.time.value = t;
  U.sway.value = state.reduced ? 0 : 1;

  updateFloaters(dt);
  if (friendsTick) friendsTick(t, dt, S);
  if (S.mode === 'explore') moveAvatar(dt);
  else S.speed = 0;

  if (S.mode === 'travel' && S.flight) {
    const F = S.flight;
    F.t += dt / F.dur;
    const k = ease(Math.min(1, F.t));
    bez(F.p0, F.p1, F.p2, F.p3, k, avatar.root.position);
    const ahead = bez(F.p0, F.p1, F.p2, F.p3, Math.min(1, k + 0.02), _mv);
    const dx = ahead.x - avatar.root.position.x, dz = ahead.z - avatar.root.position.z;
    if (Math.hypot(dx, dz) > 0.01) S.heading = lerpAngle(S.heading, Math.atan2(dx, dz), 0.1);
    avatar.root.rotation.y = S.heading;
    rig.yaw = lerpAngle(rig.yaw, S.heading + Math.PI, dt * 1.5);
    corgi.root.position.lerp(_mv.copy(avatar.root.position).add(_v.set(Math.sin(S.heading + 2.4) * 1.3, -0.15 + Math.sin(t * 3) * 0.15, Math.cos(S.heading + 2.4) * 1.3)), 1 - Math.exp(-dt * 10));
    corgi.root.rotation.y = S.heading;
    trail.update(dt, avatar.root.position, true);
    avatar.update(dt, 0, t, true);
    corgi.update(dt, 1, t);
    if (state.dogJoined) {
      dog.root.position.lerp(_mv.copy(avatar.root.position).add(_v.set(Math.sin(S.heading - 2.3) * 1.6, -0.3 + Math.sin(t * 2.6 + 1) * 0.15, Math.cos(S.heading - 2.3) * 1.6)), 1 - Math.exp(-dt * 9));
      dog.root.rotation.y = S.heading;
      dog.update(dt, 1, t, pets.dog.t);
    }
    if (F.t >= 1) {
      const dest = F.dest, land = dest.landing;
      S.flight = null;
      placeOn(dest, land.x, land.z, Math.atan2(-land.x, -land.z));
      S.mode = 'explore';
      ui.banner(dest.info.name, dest.info.era);
      F.after && F.after();
    }
  } else {
    trail.update(dt, avatar.root.position, false);
    if (S.island) {
      worldPos(S.island, S.pos, avatar.root.position);
      avatar.root.rotation.y = S.heading;
      if (S.ride) {
        // the scooter rides under the rider, the deck a hand's width off the ground
        const sc = S.ride, g = sc.group, v = seatVec(sc, S.heading);
        g.position.set(S.pos.x - v.x, S.island.heightAt(S.pos.x, S.pos.z), S.pos.z - v.z);
        g.rotation.set(0, S.heading, 0);
        for (const w of sc.wheels) w.rotation.x += S.speed * dt / (sc.wheelR || 0.1 * sc.scale);
        avatar.root.position.y += sc.deck;
      }
      avatar.update(dt, S.speed, t, false, !!S.ride);
      updateCorgi(dt, t);
      updateDog(dt, t);
    }
  }

  // nearest interactive spot
  S.nearSpot = null;
  if (S.mode === 'explore' && S.island) {
    let best = 1e9;
    for (const sp of spots) {
      if (sp.island !== S.island || (sp.isCelebration && !sp.active) || (sp.pup && state.dogJoined)) continue;
      const d = Math.hypot(S.pos.x - sp.x, S.pos.z - sp.z);
      if (d < sp.reach && d < best) { best = d; S.nearSpot = sp; }
    }
    // riding: the bubble over their head hops off (unless something else is right here)
    if (S.ride && (!S.nearSpot || S.nearSpot.ride)) {
      S.nearSpot = rideSpot;
      rideSpot.x = rideSpot.glowX = S.pos.x; rideSpot.z = rideSpot.glowZ = S.pos.z;
    }
  }
  // spot markers
  for (const sp of spots) {
    if (!sp.halo) continue;
    const near = S.nearSpot === sp;
    const pulse = state.reduced ? 0.85 : 0.75 + Math.sin(t * 2.4 + sp.x) * 0.25;
    if (!sp.found) {
      sp.halo.material.opacity = 0.75 * pulse + (near ? 0.25 : 0);
      sp.halo.scale.setScalar((near ? 3.2 : 2.6) * (0.9 + pulse * 0.15));
      sp.star.material.opacity = 0.95;
      sp.star.scale.setScalar(0.55 + pulse * 0.15);
      sp.star.material.rotation = state.reduced ? 0 : t * 0.5;
      sp.marker.position.y = sp.island.heightAt(sp.glowX, sp.glowZ) + sp.glowY + (state.reduced ? 0 : Math.sin(t * 1.6 + sp.z) * 0.12);
    } else {
      sp.halo.material.opacity = near ? 0.5 : 0.22;
      sp.halo.scale.setScalar(1.6);
      sp.star.material.opacity = 0.45;
      sp.star.scale.setScalar(0.35);
    }
  }
  // celebration
  const ov = byId.overlook;
  if (ov) {
    const cel = ov.celebration;
    if (cel.group.visible) {
      const r = cel.group.userData.rise = Math.min(1, (cel.group.userData.rise ?? 1) + dt / 2.5);
      for (const c of cel.cakeParts) c.visible = r > 0.02;
      cel.group.scale.setScalar(0.2 + ease(r) * 0.8);
      const showBeacon = allFound() && !state.finaleSeen && S.mode !== 'finale';
      cel.beacon.material.uniforms.uO.value += ((showBeacon ? 1 : 0) - cel.beacon.material.uniforms.uO.value) * dt * 2;
      cel.glow.material.opacity += (((S.mode === 'finale' || showBeacon) ? 0.55 : 0.18) - cel.glow.material.opacity) * dt * 2;
      if (state.finaleSeen && S.mode !== 'finale') cel.flames.forEach((f) => (f.visible = true));
    }
    if (S.mode === 'finale' && finale) {
      const el = t - finale.t0;
      const want = Math.min(cel.flames.length, Math.floor(Math.max(0, el - 2.6) / 0.11));
      while (finale.lit < want) { cel.flames[finale.lit].visible = true; finale.lit++; if (finale.lit % 3 === 0) audio.tick(finale.lit); }
      if (el > 5.8 && !finale.text) { finale.text = true; ui.finaleText(); }
    }
    if (!ov.skyLanterns.mesh.visible && state.finaleSeen) { ov.skyLanterns.mesh.visible = ov.skyLanterns.glowPts.visible = true; ov.skyLanterns.t0 = t - 40; }
  }
  if (clickMarker.visible) {
    clickMarker.userData.t += dt;
    const k = clickMarker.userData.t;
    clickMarker.scale.setScalar(1 + k * 1.5);
    clickMarker.material.opacity = Math.max(0, 1 - k * 1.6);
    if (k > 0.7 || !S.path.length) clickMarker.visible = k <= 0.7 && S.path.length > 0;
  }

  if (hintBeam.visible) {
    const want = t < hintUntil ? 1 : 0, u = hintBeam.material.uniforms.uO;
    u.value += (want - u.value) * Math.min(1, dt * 3);
    const tgt = spots.find((sp) => sp.memory && sp.found && Math.abs(sp.island.center.x + sp.glowX - hintBeam.position.x) < 0.01 && Math.abs(sp.island.center.z + sp.glowZ - hintBeam.position.z) < 0.01);
    if (tgt) hintUntil = 0;
    if (!want && u.value < 0.01) hintBeam.visible = false;
  }
  for (const isl of islands) { if (isl.fogNear) isl.fogNear(S.island === isl && S.mode !== 'map', dt); isl.update(t, dt); }
  if (S.island && S.island.interior) S.island.update(t, dt);
  updateCamera(dt, t);
  if (world) {
    world.update(t, dt, camera, rig.look);
    // fog follows the zoom so wide shots stay clear
    const cd = camera.position.distanceTo(rig.look);
    scene.fog.near = 160 + Math.max(0, cd - 120); scene.fog.far = 820 + Math.max(0, cd - 120) * 1.6;
    // keep the shadow map centred on whatever we're looking at
    world.sun.target.position.copy(rig.look);
    world.sun.position.copy(rig.look).add(_v.set(55, 85, 30));
    if (S.mode === 'map' || S.mode === 'intro') world.sun.castShadow = false; else world.sun.castShadow = !IS_MOBILE;
  }

  // HTML overlays (prompt + map labels)
  if (t - lastProj > 1 / 30) {
    lastProj = t;
    if (S.nearSpot && S.mode === 'explore') {
      const sp = S.nearSpot;
      _v.set(sp.glowX, sp.island.heightAt(sp.glowX, sp.glowZ) + sp.glowY + 0.9, sp.glowZ).add(sp.island.center).project(camera);
      ui.prompt(true, (_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight, promptText(sp));
    } else ui.prompt(false);
    if (ui.mapLabelsVisible()) {
      for (const isl of islands) {
        _v.copy(isl.center).add(_v2.set(0, isl.id === 'overlook' ? 6 : 10, 0)).project(camera);
        ui.placeMapLabel(isl.id, (_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight, _v.z < 1);
      }
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function promptText(sp) {
  const key = IS_MOBILE ? 'Tap' : 'Press E';
  if (sp.isGate) return { title: 'Sky Gate', sub: `${key} to travel` };
  if (sp.prompt) return { title: sp.prompt.title, sub: `${key} ${sp.prompt.sub}` };
  if (sp.isCelebration) return { title: 'The birthday cake', sub: `${key} to celebrate again` };
  const who = sp.memory.sender ? `From ${sp.memory.sender}` : 'A birthday message';
  return sp.found ? { title: who, sub: `${key} to watch again` } : { title: 'Something is glowing…', sub: `${key} to open` };
}

function moveAvatar(dt) {
  const isl = S.island;
  let mx = 0, mz = 0;
  const K = S.keys;
  const fwd = (K.w || K.arrowup ? 1 : 0) - (K.s || K.arrowdown ? 1 : 0) + (-S.joy.y);
  const side = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0) + S.joy.x;
  const SPEED = S.ride ? (S.ride.speed || 10.5) : 5.4;
  let target = 0;
  if (Math.abs(fwd) > 0.05 || Math.abs(side) > 0.05) {
    _f.set(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw));
    _r.set(Math.cos(rig.yaw), 0, -Math.sin(rig.yaw));
    _mv.copy(_f).multiplyScalar(fwd).addScaledVector(_r, side);
    const L = Math.min(1, _mv.length());
    _mv.normalize();
    mx = _mv.x; mz = _mv.z; target = SPEED * L;
    S.path = [];
  } else if (S.path.length) {
    const [px, pz] = S.path[0];
    const dx = px - S.pos.x, dz = pz - S.pos.z, d = Math.hypot(dx, dz);
    if (d < Math.max(0.25, S.speed * dt * 1.5)) { S.path.shift(); }
    else { mx = dx / d; mz = dz / d; target = SPEED * Math.min(1, d / 0.6 + 0.35); }
    if (!S.path.length && S.pendingSpot) {
      const sp = S.pendingSpot; S.pendingSpot = null;
      if (Math.hypot(S.pos.x - sp.x, S.pos.z - sp.z) < sp.reach + 0.5) {
        S.heading = Math.atan2(sp.glowX - S.pos.x, sp.glowZ - S.pos.z);
        interact(sp);
      }
    }
  }
  S.speed += (target - S.speed) * Math.min(1, dt * 10);
  if (S.speed > 0.05 && (mx || mz)) {
    const ox = S.pos.x, oz = S.pos.z;
    S.pos.x += mx * S.speed * dt; S.pos.z += mz * S.speed * dt;
    isl.resolve(S.pos);
    // a car can't nose into buildings or off the edge: if a corner newly hits something, stay put
    if (S.ride && S.ride.corners) {
      const before = carCorners(isl, ox, oz), after = carCorners(isl, S.pos.x, S.pos.z);
      if (after & ~before) { S.pos.x = ox; S.pos.z = oz; S.speed *= 0.3; }
    }
    // stairs between two floors of the same room
    const lvl = isl.swap && isl.swap(S.pos);
    if (lvl) { S.island = lvl; lvl.resolve(S.pos); }
    // stuck on a path segment? drop it
    if (S.path.length && Math.hypot(S.pos.x - ox, S.pos.z - oz) < S.speed * dt * 0.15) S.idleT += dt; else S.idleT = 0;
    if (S.idleT > 0.5) { S.path = []; S.idleT = 0; }
    S.heading = lerpAngle(S.heading, Math.atan2(mx, mz), Math.min(1, dt * (S.ride && S.ride.turn || 12)));
  }
}
// bitmask of which of the car's corners are blocked, with the driver's seat at (x, z)
function carCorners(isl, x, z) {
  const sc = S.ride, h = S.heading, v = seatVec(sc, h), c = Math.cos(h), sn = Math.sin(h);
  let m = 0;
  sc.corners.forEach(([lx, lz], i) => {
    const px = x - v.x + lx * c + lz * sn, pz = z - v.z - lx * sn + lz * c;
    if (isl.blocked(px, pz, 0.05)) m |= 1 << i;
  });
  return m;
}

// ── the dog: waits at its spot (pets.dog in world.config.js) until you say hi, then comes along ──
function setupDogHome() {
  const isl = PETS.dog && byId[PETS.dog.island];
  if (!isl) { dog.root.visible = false; return; }
  const home = isl.dogHome || { x: 0, z: 0 };
  // nudge onto open ground if something's in the way
  let hx = home.x, hz = home.z;
  for (let r = 0; r < 6 && isl.blocked(hx, hz, 0.6); r += 0.5) for (let a = 0; a < 12; a++) { const x = home.x + Math.cos(a / 2) * r, z = home.z + Math.sin(a / 2) * r; if (!isl.blocked(x, z, 0.6)) { hx = x; hz = z; r = 99; break; } }
  isl.pupHome = { x: hx, z: hz };
  const pup = isl.spot('dogPark', hx, hz + 1.4, { label: PETS.dog.name, glowX: hx, glowZ: hz, glowY: 1.5, reach: 2.4 });
  pup.pup = true;
  pup.prompt = { title: `${PETS.dog.name}, a very good pup`, sub: 'to say hi' };
  isl.circle(hx, hz, 0.5, 1);
  isl.buildNav();
}
function joinDog(sp) {
  state.dogJoined = true; save();
  if (sp.marker) sp.marker.visible = false;
  S.dog.island = S.island;
  S.dog.pos.set(sp.glowX, 0, sp.glowZ);
  pets.dog.t = 1.6;
  hearts(dog.root.position, 6);
  audio.chime();
  ui.toast(`${PETS.dog.name} wants to come along! They’ll follow you everywhere now ✦`);
}
function updateDog(dt, t) {
  const D = S.dog;
  pets.dog.t = Math.max(0, pets.dog.t - dt);
  if (!state.dogJoined) {
    // sitting at home, watching for the birthday person
    const az = PETS.dog && byId[PETS.dog.island];
    if (!az) return;
    const home = az.pupHome;
    worldPos(az, D.pos.set(home.x, 0, home.z), dog.root.position);
    const near = S.island === az ? Math.atan2(S.pos.x - home.x, S.pos.z - home.z) : 0.3;
    D.heading = lerpAngle(D.heading, S.island === az && Math.hypot(S.pos.x - home.x, S.pos.z - home.z) < 7 ? near : 0.3, dt * 3);
    dog.root.rotation.y = D.heading;
    dog.update(dt, 0, t, pets.dog.t);
    return;
  }
  if (D.island !== S.island) { D.island = S.island; D.pos.set(S.pos.x - 1.2, 0, S.pos.z + 1); S.island.resolve(D.pos); }
  const back = _v2.set(S.pos.x - Math.sin(S.heading) * 1.6 - Math.cos(S.heading) * 0.9, 0, S.pos.z - Math.cos(S.heading) * 1.6 + Math.sin(S.heading) * 0.9);
  const dx = back.x - D.pos.x, dz = back.z - D.pos.z, d = Math.hypot(dx, dz);
  let sp = 0;
  if (d > 0.6) { sp = Math.min(S.ride ? 14 : 7.5, d * 3); D.pos.x += dx / d * sp * dt; D.pos.z += dz / d * sp * dt; D.heading = lerpAngle(D.heading, Math.atan2(dx, dz), dt * 8); S.island.resolve(D.pos); }
  else D.heading = lerpAngle(D.heading, Math.atan2(S.pos.x - D.pos.x, S.pos.z - D.pos.z), dt * 3);
  worldPos(S.island, D.pos, dog.root.position);
  dog.root.rotation.y = D.heading;
  dog.update(dt, sp, t, pets.dog.t);
}

// ── the cat house on the Overlook: swap the cat for a different kitty ──
function openCatHouse() {
  S.mode = 'modal';
  ui.openCats({
    skins: CAT_SKINS, current: state.catSkin,
    onPick: (id) => { S.mode = 'explore'; setCatSkin(id); },
    onClose: () => { S.mode = 'explore'; },
  });
}
function setCatSkin(id) {
  const pos = corgi.root.position.clone(), ry = corgi.root.rotation.y;
  scene.remove(corgi.root);
  corgi = buildCat(id);
  corgi.root.position.copy(pos); corgi.root.rotation.y = ry;
  scene.add(corgi.root);
  if (state.catSkin !== id) { state.catSkin = id; save(); }
  pets.cat.t = 1.6;
  hearts(pos, 5);
  audio.chime();
  ui.toast(`Say hi to ${PETS.cat.name}, now a ${CAT_SKINS[id].name.toLowerCase()}! ✦`);
}
// fly to a friend and frame them up close (used by the Friend Studio)
function visitFriend(f) {
  const go = () => {
    const fx = f.g.position.x, fz = f.g.position.z;
    let a = Math.atan2(f.sp.x - fx, f.sp.z - fz);
    placeOn(f.isl, fx + Math.sin(a) * 2.2, fz + Math.cos(a) * 2.2);
    S.heading = Math.atan2(fx - S.pos.x, fz - S.pos.z);
    rig.yaw = S.heading + Math.PI + 0.5; rig.pitch = 0.22; rig.dist = rig.cur = 4.4;
    camTween.on = false;
    S.mode = 'explore';
  };
  if (S.mode !== 'explore' || camTween.on) { setTimeout(() => visitFriend(f), 400); return; }   // wait until the opening camera settles
  if (S.island !== f.isl) travelTo(f.isl, go); else go();
}

// ── the wardrobe on the Overlook ──
function openWardrobe() {
  S.mode = 'modal';
  ui.openWardrobe({
    outfits: OUTFITS, current: state.outfit,
    onPick: (id) => { S.mode = 'explore'; setOutfit(id); },
    onClose: () => { S.mode = 'explore'; },
  });
}
function setOutfit(id) {
  const pos = avatar.root.position.clone(), ry = avatar.root.rotation.y;
  scene.remove(avatar.root);
  avatar = buildAvatar(id);
  avatar.root.position.copy(pos); avatar.root.rotation.y = ry;
  scene.add(avatar.root);
  if (state.outfit !== id) { state.outfit = id; save(); }
  hearts(pos.clone().add(_v.set(0, 0.6, 0)), 6);
  audio.chime();
  ui.toast(`${OUTFITS[id].name} ✦ looking amazing!`);
}

function placeCatPreviews() {
  const ov = byId.overlook, ch = ov.catHouse;
  ['greyTabby', 'fluffyBlack', 'calico'].forEach((id, i) => {
    const [x, z, ry, y] = ch.previews[i];
    const c = buildCat(id);
    c.root.scale.setScalar(0.8);
    c.root.position.set(x, (y ?? ov.heightAt(x, z)) + (y ? 0.05 : 0), z);
    c.root.rotation.y = ry;
    ov.group.add(c.root);
  });
}

// ── pets and treats ──
const pets = { cat: { t: 0, n: 0 }, dog: { t: 0, n: 0 } };
const heartTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#ff7a9a'; g.beginPath(); g.moveTo(32, 54); g.bezierCurveTo(4, 34, 8, 8, 32, 20); g.bezierCurveTo(56, 8, 60, 34, 32, 54); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const floaters = [];
let friendsTick = null;   // the friends standing by their message spots
function hearts(at, n = 4) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false }));
    s.scale.setScalar(0.32);
    s.position.copy(at).add(_v.set((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.3, (Math.random() - 0.5) * 0.6));
    s.userData = { t: 0, life: 1.4 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.4, delay: i * 0.12 };
    scene.add(s); floaters.push(s);
  }
}
function treat(kind, at) {
  const g = new THREE.Group();
  if (kind === 'cat') {   // a little fish
    const fm = new THREE.MeshToonMaterial({ color: '#f2a65a' });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), fm); b.scale.set(1.6, 0.8, 0.5); g.add(b);
    const tl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), fm); tl.rotation.z = Math.PI / 2; tl.position.x = -0.15; g.add(tl);
  } else {                // a bone
    const bm = new THREE.MeshToonMaterial({ color: '#f6efe0' });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 6), bm); sh.rotation.z = Math.PI / 2; g.add(sh);
    for (const sx of [-0.13, 0.13]) for (const sz of [-0.03, 0.03]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), bm); k.position.set(sx, sz, 0); g.add(k); }
  }
  g.position.copy(at).add(_v.set(0, 1.4, 0));
  g.userData = { t: 0, life: 0.9, treat: true, from: g.position.clone(), to: at.clone().add(_v.set(0, kind === 'cat' ? 0.35 : 0.75, 0)) };
  scene.add(g); floaters.push(g);
}
function petAnimal(kind) {
  const P = pets[kind], obj = kind === 'cat' ? corgi.root : dog.root;
  const isTreat = P.n++ % 2 === 1;
  P.t = 1.6;
  if (isTreat) { treat(kind, obj.position); setTimeout(() => hearts(obj.position, 3), 700); audio.chime(); }
  else { hearts(obj.position, 5); audio.tick(P.n); }
  const lines = kind === 'cat'
    ? (isTreat ? [`Treat time! ${PETS.cat.name} gulped the fishy in one bite ✦`, `Nom nom — ${PETS.cat.name} is very pleased`] : [`Purrrr… ${PETS.cat.name} loves pets ✦`, `Slow blink from ${PETS.cat.name} — that means I love you`])
    : (isTreat ? [`Treat! ${PETS.dog.name} caught it mid-air ✦`, `A bone! Best day ever, says ${PETS.dog.name}`] : [`Good pup, ${PETS.dog.name}! *happy tail wags* ✦`, `Ear scratches — ${PETS.dog.name}’s favourite`]);
  ui.toast(lines[Math.floor(P.n / 2) % 2]);
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i], u = f.userData;
    if (u.delay > 0) { u.delay -= dt; f.visible = false; continue; }
    f.visible = true;
    u.t += dt;
    const k = u.t / u.life;
    if (u.treat) { f.position.lerpVectors(u.from, u.to, Math.min(1, k * 1.2)); f.position.y += Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.4; f.rotation.y += dt * 6; f.scale.setScalar(k > 0.85 ? Math.max(0.01, (1 - k) / 0.15) : 1); }
    else { f.position.y += dt * 0.7; f.position.x += u.vx * dt; f.material.opacity = Math.min(1, (1 - k) * 2); f.scale.setScalar(0.32 * (1 + Math.sin(u.t * 8) * 0.06)); }
    if (k >= 1) { scene.remove(f); floaters.splice(i, 1); }
  }
}

function updateCorgi(dt, t) {
  const C = S.corgi;
  if (S.ride && S.ride.passenger) {
    // riding shotgun: sit on the passenger seat, looking out the windscreen
    const sc = S.ride, g = sc.group, p = sc.passenger, h = S.heading;
    C.island = S.island;
    C.pos.set(g.position.x + p.x * Math.cos(h) + p.z * Math.sin(h), 0, g.position.z - p.x * Math.sin(h) + p.z * Math.cos(h));
    C.heading = h;
    worldPos(S.island, C.pos, corgi.root.position);
    corgi.root.position.y += p.y;
    corgi.root.rotation.y = h;
    catScooter.visible = false;
    corgi.update(dt, 0, t);
    pets.cat.t = Math.max(0, pets.cat.t - dt);
    corgi.root.scale.setScalar(1.1);
    return;
  }
  if (C.island !== S.island) { C.island = S.island; C.pos.set(S.pos.x + 1, 0, S.pos.z + 1); }
  const back = _v.set(S.pos.x - Math.sin(S.heading) * 1.3 + Math.cos(S.heading) * 0.7, 0, S.pos.z - Math.cos(S.heading) * 1.3 - Math.sin(S.heading) * 0.7);
  const dx = back.x - C.pos.x, dz = back.z - C.pos.z, d = Math.hypot(dx, dz);
  let sp = 0;
  if (d > 0.5) { sp = Math.min(S.ride ? 14 : 7, d * 3); C.pos.x += dx / d * sp * dt; C.pos.z += dz / d * sp * dt; C.heading = lerpAngle(C.heading, Math.atan2(dx, dz), dt * 8); S.island.resolve(C.pos); }
  else C.heading = lerpAngle(C.heading, Math.atan2(S.pos.x - C.pos.x, S.pos.z - C.pos.z), dt * 3);
  worldPos(S.island, C.pos, corgi.root.position);
  corgi.root.rotation.y = C.heading;
  // when the birthday person is on the scooter, the cat rides a little one of its own
  catScooter.visible = !!S.ride;
  if (S.ride) {
    catScooter.position.copy(corgi.root.position);
    catScooter.rotation.y = C.heading;
    for (const w of catScooter.userData.wheels) w.rotation.x += sp * dt / 0.07;
    corgi.root.position.y += 0.13;
  }
  corgi.update(dt, S.ride ? 0 : sp, t);
  pets.cat.t = Math.max(0, pets.cat.t - dt);
  if (pets.cat.t > 0) { const w = pets.cat.t; corgi.root.scale.set(1.1 * (1 + Math.sin(t * 14) * 0.05 * w), 1.1 * (1 - Math.sin(t * 14) * 0.05 * w), 1.1); corgi.root.position.y += Math.abs(Math.sin(t * 7)) * 0.06 * w; } else corgi.root.scale.setScalar(1.1);
}

// ── UI wiring ──
ui.on('start', async () => {
  if (S.mode !== 'intro') return;
  audio.start();
  ui.hideIntro();
  ui.showMapLabels(false);
  S.mode = 'explore';
  rig.yaw = 0; rig.pitch = 0.55; rig.dist = 14; rig.cur = 14;
  tweenCamera(state.reduced ? 0.8 : 4.2);
  setTimeout(() => ui.banner(byId.overlook.info.name, 'Find the glowing messages hidden across the islands'), state.reduced ? 600 : 3600);
  setTimeout(() => ui.hint(), state.reduced ? 1200 : 4600);
});
ui.on('map', () => { if (S.mode === 'explore' || S.mode === 'map') toggleMap(); });
ui.on('mapPick', (id) => { if (S.mode === 'map') travelTo(byId[id]); });
ui.on('journal', () => {
  if (S.mode !== 'explore' && S.mode !== 'map') return;
  const prev = S.mode;
  S.mode = 'modal';
  ui.openJournal({
    items: MEMORIES.map((m) => ({ m, found: state.found.has(memKey(m)), island: ISLANDS[m.island].name, spot: (byId[m.island]?.spots.find((s) => s.id === m.spot) || {}).label })),
    total: TOTAL,
    onPlay: (m) => { const sp = byId[m.island].spots.find((s) => s.id === m.spot); openMemory(m, sp); },
    onClose: () => { if (S.mode === 'modal') S.mode = prev; },
    canCelebrate: allFound(),
    onCelebrate: () => { S.mode = prev === 'map' ? 'map' : 'explore'; if (prev === 'map') { ui.showMapLabels(false); ui.setMapButton(false); S.mode = 'explore'; } startFinale(); },
  });
});
ui.on('joy', (x, y) => S.joy.set(x, y));
// hints: light a beam over the nearest hidden message on this island
const hintBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 60, 20, 1, true), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: U.time, uO: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uO; void main(){ float s=0.6+0.4*sin(vUv.x*30.0+uTime*3.0); float a=pow(1.0-vUv.y,1.4)*0.55*s*uO; gl_FragColor=vec4(vec3(1.0,0.85,0.45)*a,a);} `,
}));
hintBeam.visible = false;
scene.add(hintBeam);
let hintUntil = 0;
ui.on('hint', () => {
  if (S.mode !== 'explore' && S.mode !== 'map') return;
  const hidden = spots.filter((sp) => sp.memory && !sp.found);
  if (!hidden.length) { ui.toast('You’ve found every message ✦'); return; }
  const here = S.mode === 'explore' ? hidden.filter((sp) => sp.island === S.island) : [];
  if (!here.length) {
    const counts = {};
    for (const sp of hidden) counts[sp.island.info.name] = (counts[sp.island.info.name] || 0) + 1;
    const list = Object.entries(counts).map(([n, c]) => `${c} in ${n}`).join(' · ');
    ui.toast(`${S.mode === 'explore' ? 'Nothing left to find here! ' : ''}Still hidden: ${list}`);
    return;
  }
  let best = here[0], bd = 1e9;
  for (const sp of here) { const d = Math.hypot(sp.x - S.pos.x, sp.z - S.pos.z); if (d < bd) { bd = d; best = sp; } }
  hintBeam.position.set(best.island.center.x + best.glowX, best.island.center.y + 30, best.island.center.z + best.glowZ);
  hintBeam.visible = true;
  hintUntil = clock.elapsedTime + 25;
  ui.toast(`Hint: look near ${best.label} ✦ (${here.length} left on this island)`);
});
ui.on('reduced', (v) => { state.reduced = v; save(); document.body.classList.toggle('reduced', v); });
ui.on('volume', (v) => { state.volume = v; save(); audio.apply(); });
ui.on('mute', () => { state.muted = !state.muted; save(); audio.apply(); ui.setMuted(state.muted); });
ui.on('reset', () => { localStorage.removeItem(STORE); location.reload(); });
ui.on('interact', () => { if (S.nearSpot && S.mode === 'explore') interact(S.nearSpot); });
ui.on('zoom', (dir) => { if (S.mode === 'explore') rig.dist = THREE.MathUtils.clamp(rig.dist * (dir > 0 ? 1.25 : 0.8), 4.5, 60); });

// ── go ──
(async () => {
  requestAnimationFrame(tick);
  await build();
  setupSpots();
  registerLooks(MEMORIES);
  friendsTick = placeFriends(spots);
  placeCatPreviews();
  placeOn(byId.overlook, 0, 7, Math.PI);
  ui.setupMapLabels(islands.map((i) => ({ id: i.id, name: i.info.name, era: i.info.era })));
  ui.setMuted(state.muted);
  document.body.classList.toggle('reduced', state.reduced);
  ui.loading(1, 'Ready');
  await nextFrame();
  S.mode = 'intro';
  ui.showIntro();
  if (params.has('skip') || params.has('edit')) ui.emit('start');
  // Friend Studio: ?edit=1 opens the panel for customising the friends' characters
  let studioOpen = false;
  const openStudio = () => { if (studioOpen) return; studioOpen = true; startEditor({ visit: visitFriend, toast: ui.toast }); };
  if (params.has('edit') || location.hash === '#edit') setTimeout(openStudio, 600);
  // or press Shift+F anywhere in the game
  addEventListener('keydown', (e) => { if (e.shiftKey && e.key.toLowerCase() === 'f' && !(e.target.closest && e.target.closest('input, select, textarea'))) { if (S.mode === 'map') toggleMap(); openStudio(); } });
  window.__arch = { S, rig, byId, state, dog, corgi, setOutfit, startFinale, travelTo, toggleMap, camera, renderer, scene, audio };
})();

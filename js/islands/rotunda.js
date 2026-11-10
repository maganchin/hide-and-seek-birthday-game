// Inside the Capitol: the Rotunda, after the reference photos — a round
// sandstone hall with fluted pilasters, gold-framed history paintings,
// carved relief panels and statues, a sculpted frieze, a ring of arched
// windows, and the coffered dome with a fresco in the eye at the top.
import * as THREE from 'three';
import { Island } from '../island.js';
import { U, toonMat, canvasTex, rng } from '../kit.js';
import { makePerson, animatePerson } from '../people.js';

const RR = 12;           // room radius
const WALL = 7.2;        // height of the painted wall zone
const FRIEZE0 = 7.4, FRIEZE1 = 8.8;
const DRUM0 = 9.2, DRUM1 = 12.2;
const DOME0 = 12.2, DOMER = 11.2;
const STONE = '#e6d8bd', STONE_D = '#cdbb9a';

class Round extends Island {
  insideRim(x, z, m = 1.2) { return Math.hypot(x, z) < RR - m * 0.7; }
  clampRim(p) { const d = Math.hypot(p.x, p.z), lim = RR - 0.9; if (d > lim) { p.x *= lim / d; p.z *= lim / d; } }
  finalize(scene) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RR * 2, RR * 2).rotateX(-Math.PI / 2), toonMat({ map: this.gp.texture() }));
    floor.receiveShadow = true; floor.name = 'ground'; floor.userData.island = this;
    this.ground = floor;
    this.group.add(floor);
    const built = this.b.build();
    built.traverse((o) => { o.castShadow = false; });
    this.group.add(built);
    this.buildNav();
    scene.add(this.group);
    return this;
  }
}

// a painterly "history painting": sky, distant land, a crowd of figures, banners
function historyPainting(seed) {
  const r = rng(seed);
  return canvasTex(400, 280, (g, w, h) => {
    const skies = [['#c9a46a', '#6d7f8f'], ['#e2c48c', '#7a6a58'], ['#b8c4c8', '#5a6a78'], ['#e8b878', '#8a5a40']];
    const [s1, s2] = skies[Math.floor(r() * skies.length)];
    const gr = g.createLinearGradient(0, 0, 0, h * 0.7); gr.addColorStop(0, s2); gr.addColorStop(1, s1);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { g.globalAlpha = 0.25; g.fillStyle = '#fff8e8'; g.beginPath(); g.ellipse(r() * w, r() * h * 0.4, 30 + r() * 50, 10 + r() * 14, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    g.fillStyle = '#4e4a32'; g.beginPath(); g.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * (0.58 + Math.sin(x * 0.02 + seed) * 0.04)); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#3a3322'; g.fillRect(0, h * 0.78, w, h * 0.22);
    if (r() < 0.5) { g.fillStyle = '#2a2a2a'; for (let i = 0; i < 3; i++) { const x = r() * w; g.fillRect(x, h * 0.35, 3, h * 0.3); g.fillStyle = ['#b8322a', '#f2ede0', '#2b3d6b'][i]; g.fillRect(x + 3, h * 0.35, 30, 18); g.fillStyle = '#2a2a2a'; } }
    const cloth = ['#8a2a22', '#2b3d6b', '#e8dcc0', '#4a5a3a', '#6a4a2a', '#c8a050', '#1e1e24'];
    for (let i = 0; i < 26; i++) {
      const x = 20 + r() * (w - 40), y = h * (0.6 + r() * 0.28), s = 0.7 + (y / h) * 0.6;
      g.fillStyle = cloth[Math.floor(r() * cloth.length)];
      g.beginPath(); g.moveTo(x - 9 * s, y + 40 * s); g.lineTo(x - 7 * s, y); g.lineTo(x + 7 * s, y); g.lineTo(x + 9 * s, y + 40 * s); g.fill();
      g.fillStyle = '#e2b896'; g.beginPath(); g.arc(x, y - 6 * s, 6 * s, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(40,25,10,0.25)'; g.fillRect(0, 0, w, h);
  });
}

// carved sandstone relief: scrolls and a central medallion
function reliefTex() {
  return canvasTex(320, 100, (g, w, h) => {
    g.fillStyle = '#ddcdb0'; g.fillRect(0, 0, w, h);
    g.lineWidth = 6; g.lineCap = 'round';
    const scroll = (cx, cy, rad, dir, col) => { g.strokeStyle = col; g.beginPath(); for (let a = 0; a < Math.PI * 3.4; a += 0.1) { const rr = rad * (1 - a / (Math.PI * 4)); g.lineTo(cx + Math.cos(a * dir) * rr, cy + Math.sin(a * dir) * rr); } g.stroke(); };
    for (const [off, col] of [[2, '#b7a582'], [0, '#f6ead2']]) {
      scroll(80 + off, 50 + off, 36, 1, col); scroll(240 + off, 50 + off, 36, -1, col);
      g.strokeStyle = col; g.beginPath(); g.arc(160 + off, 50 + off, 24, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(10 + off, 50 + off); g.bezierCurveTo(60, 10, 100, 90, 160, 50); g.bezierCurveTo(220, 10, 260, 90, 310, 50); g.stroke();
    }
    g.strokeStyle = '#bfae8c'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
  });
}

// grisaille frieze: a long procession of figures in carved-stone tones
function friezeTex() {
  const r = rng(91);
  return canvasTex(2048, 128, (g, w, h) => {
    g.fillStyle = '#c9bea8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const x = i * (w / 160) + (r() - 0.5) * 6, s = 0.8 + r() * 0.35;
      for (const [off, col] of [[2, '#9a8f7a'], [0, '#ece4d4']]) {
        g.fillStyle = col;
        g.beginPath(); g.moveTo(x - 6 * s + off, h * 0.9); g.lineTo(x - 4 * s + off, h * 0.45); g.lineTo(x + 4 * s + off, h * 0.45); g.lineTo(x + 7 * s + off, h * 0.9); g.fill();
        g.beginPath(); g.arc(x + off, h * 0.35, 5 * s, 0, 7); g.fill();
        if (i % 3 === 0) { g.fillRect(x + 4 * s + off, h * 0.5, 10 * s, 3); }
      }
    }
    g.fillStyle = '#a8977a'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
  }, { repeat: true });
}

// ring of arched windows with pilasters, as luminous as the photo
function drumTex() {
  return canvasTex(2048, 256, (g, w, h) => {
    g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
    const n = 24, cw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * cw;
      g.fillStyle = '#d9cbb0'; g.fillRect(x + 2, 0, 10, h);
      const wx = x + cw * 0.28, ww = cw * 0.5, wy = h * 0.18, wh = h * 0.68;
      const gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#fff1d0');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx, wy + ww / 2); g.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); g.lineTo(wx + ww, wy + wh); g.fill();
      g.strokeStyle = '#c8b894'; g.lineWidth = 3; g.stroke();
    }
    g.fillStyle = '#d9cbb0'; g.fillRect(0, h - 14, w, 14); g.fillRect(0, 0, w, 10);
  }, { repeat: true });
}

// coffered dome: rows of square coffers with rosettes, shrinking toward the top
function domeTex() {
  return canvasTex(2048, 1024, (g, w, h) => {
    g.fillStyle = '#efe2c4'; g.fillRect(0, 0, w, h);
    // the hemisphere maps the whole canvas: top row = the eye, bottom row = the base of the dome
    const rows = 11, cols = 40;
    for (let j = 0; j < rows; j++) {
      const y0 = h * 0.14 + j * (h * 0.8 / rows), rh = h * 0.8 / rows;
      for (let i = 0; i < cols; i++) {
        const x0 = i * w / cols, cw = w / cols;
        g.fillStyle = '#d8c296'; g.fillRect(x0 + cw * 0.1, y0 + rh * 0.1, cw * 0.8, rh * 0.8);
        g.fillStyle = '#c8ad78'; g.fillRect(x0 + cw * 0.22, y0 + rh * 0.22, cw * 0.56, rh * 0.56);
        g.fillStyle = '#f3e6c4'; g.beginPath(); g.arc(x0 + cw / 2, y0 + rh / 2, Math.min(cw, rh) * 0.14, 0, 7); g.fill();
      }
    }
    g.fillStyle = '#fff7e0'; g.fillRect(0, 0, w, h * 0.13);   // bright band around the eye
    g.fillStyle = '#d6c4a2'; g.fillRect(0, h * 0.95, w, h * 0.05);  // base moulding
  });
}

// the fresco in the eye of the dome: sky, clouds and a ring of robed figures
function frescoTex() {
  const r = rng(26);
  return canvasTex(512, 512, (g, w) => {
    const c = w / 2;
    const gr = g.createRadialGradient(c, c, 10, c, c, c); gr.addColorStop(0, '#fff3d6'); gr.addColorStop(0.5, '#e8c890'); gr.addColorStop(1, '#a8885a');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 30; i++) { const a = r() * 7, d = 60 + r() * 140; g.globalAlpha = 0.35; g.fillStyle = '#fffaf0'; g.beginPath(); g.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, 40, 18, a, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const robes = ['#b8322a', '#2b4d8b', '#e8dcc0', '#4a7a4a', '#d4a24a', '#8a5a9a'];
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * Math.PI * 2, d = 170 + (i % 3) * 18;
      g.save(); g.translate(c + Math.cos(a) * d, c + Math.sin(a) * d); g.rotate(a + Math.PI / 2);
      g.fillStyle = robes[i % robes.length]; g.beginPath(); g.moveTo(-10, 18); g.lineTo(-6, -8); g.lineTo(6, -8); g.lineTo(10, 18); g.fill();
      g.fillStyle = '#e8c09a'; g.beginPath(); g.arc(0, -14, 7, 0, 7); g.fill();
      g.restore();
    }
    g.fillStyle = '#f3c97a'; g.beginPath(); g.arc(c, c, 34, 0, 7); g.fill();
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 10; g.beginPath(); g.arc(c, c, c - 6, 0, 7); g.stroke();
  });
}

export function buildRotunda(scene) {
  const I = new Round({ id: 'rotunda', center: [260, 260, 600], R: RR, seed: 1776 });
  I.interior = true;
  I.ceilingY = 18;
  I.lookUp = true;   // dragging down tilts the view up to the dome
  const b = I.b, gp = I.gp, r = b.r;

  // ── floor: polished sandstone in rings and rays ──
  gp.base(['#e2d2b4', '#d8c6a4', '#eadcc0'], 2500);
  for (const [rad, c] of [[11.6, '#cdb894'], [10.6, '#e6d7b9'], [8, '#d2bf9c'], [7.4, '#e9dcc2'], [4.6, '#cbb690'], [4.1, '#ecdfc6'], [1.6, '#c9b08a'], [1.2, '#f0e4cc']]) gp.circle(0, 0, rad, c);
  { const g = gp.g; g.strokeStyle = 'rgba(160,135,95,0.55)'; g.lineWidth = 3;
    for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; g.beginPath(); g.moveTo(gp.X(Math.cos(a) * 4.1), gp.Z(Math.sin(a) * 4.1)); g.lineTo(gp.X(Math.cos(a) * 10.6), gp.Z(Math.sin(a) * 10.6)); g.stroke(); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.beginPath(); g.moveTo(gp.X(Math.cos(a) * 1.6), gp.Z(Math.sin(a) * 1.6)); g.lineTo(gp.X(Math.cos(a) * 4.1), gp.Z(Math.sin(a) * 4.1)); g.stroke(); } }

  // ── the round wall ──
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(RR, RR, DRUM0, 64, 1, true), toonMat({ color: STONE, side: THREE.BackSide }));
  wall.position.y = DRUM0 / 2; I.extras.add(wall);
  // fluted pilasters, bases and capitals
  const NP = 16;
  for (let k = 0; k < NP; k++) {
    const a = (k + 0.5) / NP * Math.PI * 2, x = Math.cos(a) * (RR - 0.25), z = Math.sin(a) * (RR - 0.25), ry = -a + Math.PI / 2;
    b.box(0.8, WALL - 0.6, 0.3, '#ecdfc6', x, 0.5, z, { ry });
    for (let f = -2; f <= 2; f++) b.box(0.06, WALL - 0.9, 0.06, STONE_D, Math.cos(a) * (RR - 0.42) - Math.sin(a) * f * 0.14, 0.65, Math.sin(a) * (RR - 0.42) + Math.cos(a) * f * 0.14, { ry, ao: false });
    b.box(1.0, 0.5, 0.45, '#d8c8a8', x, 0, z, { ry });
    b.box(1.05, 0.4, 0.5, '#e6d7b9', x, WALL - 0.2, z, { ry });
    I.circle(x, z, 0.4, WALL);
  }
  b.add(new THREE.TorusGeometry(RR - 0.1, 0.2, 6, 64), '#d6c4a2', 0, WALL + 0.15, 0, { rx: Math.PI / 2, ao: false });   // cornice
  b.add(new THREE.TorusGeometry(RR - 0.1, 0.14, 6, 64), '#d6c4a2', 0, 0.12, 0, { rx: Math.PI / 2, ao: false });        // base course

  // paintings (8, between pilasters), reliefs above them, statues and doorways
  const bays = 16;
  const doorBays = [0, 4, 8, 12];      // four doorways; bay 4 faces the entrance (+z)
  let pi = 0;
  for (let k = 0; k < bays; k++) {
    const a = k / bays * Math.PI * 2, x = Math.cos(a) * (RR - 0.08), z = Math.sin(a) * (RR - 0.08), ry = -a - Math.PI / 2;
    const face = (obj, y, inset = 0) => { obj.position.set(Math.cos(a) * (RR - 0.08 - inset), y, Math.sin(a) * (RR - 0.08 - inset)); obj.rotation.y = ry; I.extras.add(obj); return obj; };
    if (doorBays.includes(k)) {
      const glowM = new THREE.MeshBasicMaterial({ color: k === 4 ? '#fff0c8' : '#e8c890', toneMapped: false });
      face(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.1), glowM), 1.6, 0.02);
      b.box(2.2, 0.35, 0.35, '#cdb894', x * 0.985, 3.15, z * 0.985, { ry });
      for (const s of [-1, 1]) b.box(0.25, 3.3, 0.3, '#cdb894', x * 0.985 + Math.cos(ry) * s * 0.98, 0, z * 0.985 - Math.sin(ry) * s * 0.98, { ry });
      b.box(2.6, 0.3, 0.4, '#d8c8a8', x * 0.985, 3.5, z * 0.985, { ry });
      // relief above the door
      face(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), toonMat({ map: reliefTex() })), 5.2, 0.03);
      continue;
    }
    if (k % 2 === 1) {
      // big gold-framed painting
      face(new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.1), toonMat({ map: historyPainting(pi + 3) })), 2.75, 0.2);
      b.box(3.35, 2.45, 0.1, '#c99a3a', x * 0.993, 1.53, z * 0.993, { ry });
      b.box(3.15, 2.25, 0.12, '#8a6420', x * 0.992, 1.63, z * 0.992, { ry, ao: false });
      face(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.8), toonMat({ map: reliefTex() })), 5.25, 0.03);
      // red benches in front
      b.box(2.0, 0.42, 0.55, '#7a2a28', Math.cos(a) * (RR - 0.9), 0, Math.sin(a) * (RR - 0.9), { ry });
      I.circle(Math.cos(a) * (RR - 0.9), Math.sin(a) * (RR - 0.9), 0.8, 0.5);
      pi++;
    } else {
      // a statue on a pedestal (marble or bronze) with a carved panel above
      const marble = k % 4 === 2;
      const sx = Math.cos(a) * (RR - 1.2), sz = Math.sin(a) * (RR - 1.2), col = marble ? '#f3efe6' : '#3a3530';
      b.box(0.8, 1.1, 0.8, '#d6c8ac', sx, 0, sz, { ry });
      b.cyl(0.26, 0.34, 1.3, 10, col, sx, 1.1, sz);
      b.cyl(0.2, 0.24, 0.5, 10, col, sx, 2.4, sz);
      b.sphere(0.17, col, sx, 3.05, sz);
      b.cyl(0.06, 0.06, 0.6, 6, col, sx + Math.cos(ry) * 0.25, 2.3, sz - Math.sin(ry) * 0.25, { rz: 0.4 });
      I.circle(sx, sz, 0.6, 3);
      face(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.0), toonMat({ map: reliefTex() })), 5.0, 0.03).rotation.z = 0;
    }
  }

  // sculpted frieze band
  const fr = friezeTex(); fr.repeat.set(3, 1);
  const frieze = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.15, RR - 0.15, FRIEZE1 - FRIEZE0, 64, 1, true), toonMat({ map: fr, side: THREE.BackSide }));
  frieze.position.y = (FRIEZE0 + FRIEZE1) / 2; I.extras.add(frieze);
  b.add(new THREE.TorusGeometry(RR - 0.2, 0.16, 6, 64), '#d6c4a2', 0, FRIEZE1 + 0.1, 0, { rx: Math.PI / 2, ao: false });
  // the drum of windows (unlit material so it glows like daylight)
  const dt = drumTex(); dt.repeat.set(1, 1);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.4, RR - 0.4, DRUM1 - DRUM0, 64, 1, true), new THREE.MeshBasicMaterial({ map: dt, side: THREE.BackSide, toneMapped: false }));
  drum.position.y = (DRUM0 + DRUM1) / 2; I.extras.add(drum);
  // ring ledge between the frieze and the windows
  const ledge = new THREE.Mesh(new THREE.RingGeometry(RR - 1.0, RR, 64).rotateX(Math.PI / 2), toonMat({ color: '#e6d7b9', side: THREE.DoubleSide }));
  ledge.position.y = DRUM0; I.extras.add(ledge);
  b.add(new THREE.TorusGeometry(RR - 0.9, 0.06, 4, 64), '#c9a85a', 0, DRUM0 + 0.5, 0, { rx: Math.PI / 2, ao: false });   // gilt rail
  // coffered dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DOMER, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ map: domeTex(), side: THREE.BackSide }));
  dome.position.y = DOME0; I.extras.add(dome);
  const domeRing = new THREE.Mesh(new THREE.RingGeometry(DOMER, RR - 0.3, 64).rotateX(Math.PI / 2), toonMat({ color: '#e6d7b9', side: THREE.DoubleSide }));
  domeRing.position.y = DOME0; I.extras.add(domeRing);
  // fresco in the eye
  const fresco = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: frescoTex(), toneMapped: false, side: THREE.DoubleSide }));
  fresco.position.y = DOME0 + DOMER * 0.93; I.extras.add(fresco);

  // brass stanchions and red velvet ropes around the centre
  const NS = 14, SR = 3.4, brass = '#d8b24a';
  const postTop = [];
  for (let k = 0; k < NS; k++) {
    const a = k / NS * Math.PI * 2, x = Math.cos(a) * SR, z = Math.sin(a) * SR;
    b.cyl(0.16, 0.2, 0.05, 12, brass, x, 0, z, { ao: false });
    b.cyl(0.035, 0.035, 0.95, 8, brass, x, 0.05, z, { ao: false });
    b.sphere(0.07, brass, x, 1.02, z, { ao: false });
    postTop.push(new THREE.Vector3(x, 0.95, z));
  }
  const rope = toonMat({ color: '#7a1f24' });
  for (let k = 0; k < NS; k++) {
    const p0 = postTop[k], p1 = postTop[(k + 1) % NS], mid = p0.clone().lerp(p1, 0.5); mid.y -= 0.25;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, mid, p1), 10, 0.025, 5), rope);
    I.extras.add(tube);
  }
  I.block(0, 0, SR + 0.3);

  // visitors taking it all in
  const looks = [
    { skin: '#f1cfb6', hair: '#3a2a20', hairStyle: 'short', top: '#4a6a8a', bottom: '#3a3a44' },
    { skin: '#dcae86', hair: '#1a1416', hairStyle: 'long', top: '#b8322a', bottom: '#2a2830' },
    { skin: '#b07a54', hair: '#141012', hairStyle: 'curly', top: '#e8e2d4', bottom: '#4a4a52' },
    { skin: '#f4d8c6', hair: '#8a6a4a', hairStyle: 'wavy', top: '#6a8a5a', bottom: '#2a2830' },
    { skin: '#efcfb3', hair: '#141012', hairStyle: 'bun', top: '#2a2a32', bottom: '#2a2830' },
    { skin: '#9a6646', hair: '#141012', hairStyle: 'short', top: '#d8a24a', bottom: '#3a3a44' },
  ];
  const visitors = [];
  for (let i = 0; i < 9; i++) {
    const p = makePerson(looks[i % looks.length]);
    const a = i / 9 * Math.PI * 2 + 0.3, d = 6 + (i % 3) * 1.4;
    p.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    p.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)) + (i % 2 ? 0.6 : -0.4);   // facing the wall
    p.userData.head.rotation.x = -0.35;   // gazing up at the dome
    p.traverse((o) => { o.castShadow = true; });
    I.extras.add(p);
    I.circle(p.position.x, p.position.z, 0.4, 1.8);
    visitors.push(p);
  }

  // invisible ring of wall boxes so the camera stays inside
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; I.box(Math.cos(a) * (RR + 0.6), Math.sin(a) * (RR + 0.6), 3.4, 3.4, DOME0); }

  // the entrance doorway (bay 4 faces +z): way back out to the Capitol steps
  I.landing = { x: 0, z: RR - 2.6 };
  const exit = I.spot('rotundaExit', 0, RR - 1.6, { label: 'the Capitol doors', glowY: 2.2, reach: 2.2 });
  exit.prompt = { title: 'Back outside', sub: 'to step out onto the Capitol steps' };
  exit.exit = true;
  I.exitTo = { island: 'dc', x: 0, z: -8.4, heading: 0 };

  I.updaters.push((t) => {
    const mot = U.sway.value ? 1 : 0.25;
    visitors.forEach((p, i) => { animatePerson(p, t * mot * 0.4, 'idle', i); p.userData.head.rotation.x = -0.35 + Math.sin(t * 0.3 + i) * 0.1; });
  });

  return I.finalize(scene);
}

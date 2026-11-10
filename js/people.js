// Storybook people (friends, opera-goers, musicians), an
// orchestra, a grand piano and fluffy cats. Same chibi proportions as the avatar.
import * as THREE from 'three';
import { toonMat } from './kit.js';

const mats = new Map();
const M = (c, o) => { const k = c + JSON.stringify(o || {}); if (!mats.has(k)) mats.set(k, toonMat({ color: c, ...o })); return mats.get(k); };
const basic = (c) => { const k = 'b' + c; if (!mats.has(k)) mats.set(k, new THREE.MeshBasicMaterial({ color: c })); return mats.get(k); };
function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }

// spec: { skin, hair, hairStyle, top, bottom, dress, jacket, shoes, beard, glasses, necklace, tall, seated, sleeveless }
export function makePerson(s) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = M(s.skin), top = M(s.top), bottom = M(s.bottom ?? '#1c1a1e'), shoe = M(s.shoes ?? '#151315');
  const H = s.tall ?? 1;
  const hip = 0.46 * H;

  // legs
  const legs = [-1, 1].map((k) => {
    const p = new THREE.Group(); p.position.set(k * 0.075, hip, 0); root.add(p);
    add(p, new THREE.CylinderGeometry(0.048, 0.042, hip - 0.04, 8), s.dress ? skin : bottom, 0, -(hip - 0.04) / 2, 0);
    add(p, new THREE.BoxGeometry(0.1, 0.06, 0.2), shoe, 0, -hip + 0.03, 0.04);
    return p;
  });
  // torso / dress
  if (s.dress) {
    const pts = [[0.2, hip - 0.02], [0.2, hip + 0.2], [0.17, hip + 0.42], [0.18, hip + 0.56], [0.17, hip + 0.66], [0.07, hip + 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
    add(body, new THREE.LatheGeometry(pts, 18), top);
  } else {
    add(body, new THREE.CylinderGeometry(0.16, 0.15, 0.16, 12), bottom, 0, hip + 0.04, 0);
    add(body, new THREE.CylinderGeometry(0.18, 0.165, 0.56, 14), top, 0, hip + 0.38, 0);
    add(body, new THREE.SphereGeometry(0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), top, 0, hip + 0.66, 0).scale.y = 0.35;
  }
  if (s.jacket) {
    for (const k of [-1, 1]) {
      const panel = add(body, new THREE.CylinderGeometry(0.196, 0.19, 0.6, 14, 1, true, k > 0 ? 0.25 : Math.PI + 0.25, Math.PI * 0.75), M(s.jacket, { side: THREE.DoubleSide }), 0, hip + 0.36, 0);
      panel.rotation.y = k > 0 ? -Math.PI / 2 + 0.05 : Math.PI / 2 - 0.05;
    }
    add(body, new THREE.CylinderGeometry(0.2, 0.2, 0.6, 14, 1, true, Math.PI * 0.75, Math.PI * 0.5), M(s.jacket, { side: THREE.DoubleSide }), 0, hip + 0.36, 0);
  }
  const neckY = hip + 0.72;
  if (s.necklace) add(body, new THREE.TorusGeometry(0.07, 0.008, 4, 16), M(s.necklace === true ? '#e3c26b' : s.necklace), 0, neckY - 0.06, 0.04).rotation.x = Math.PI / 2 - 0.5;
  if (s.mandarin) add(body, new THREE.CylinderGeometry(0.07, 0.08, 0.06, 12), top, 0, neckY, 0);

  // arms (pivot at the shoulder)
  const sleeve = s.sleeveless || s.dress && !s.sleeves ? skin : M(s.jacket ?? s.top);
  const arms = [-1, 1].map((k) => {
    const p = new THREE.Group(); p.position.set(k * 0.2, neckY - 0.08, 0); body.add(p);
    add(p, new THREE.SphereGeometry(0.055, 10, 8), sleeve, 0, 0, 0);
    add(p, new THREE.CylinderGeometry(0.046, 0.04, 0.42, 8), sleeve, 0, -0.21, 0);
    add(p, new THREE.SphereGeometry(0.042, 8, 6), skin, 0, -0.44, 0);
    return p;
  });

  // head
  const head = new THREE.Group(); head.position.set(0, neckY + 0.24, 0); body.add(head);
  add(head, new THREE.CylinderGeometry(0.05, 0.058, 0.12, 8), skin, 0, -0.2, 0);
  add(head, new THREE.SphereGeometry(0.24, 18, 14), skin, 0, 0, 0).scale.set(1, 1.03, 0.96);
  const hair = M(s.hair);
  const cap = (tilt = -0.5, len = 0.55) => { const c = add(head, new THREE.SphereGeometry(0.255, 20, 14, 0, Math.PI * 2, 0, Math.PI * len), hair, 0, 0.02, -0.02); c.rotation.x = tilt; return c; };
  switch (s.hairStyle) {
    case 'short': cap(-0.55, 0.5); add(head, new THREE.SphereGeometry(0.245, 14, 10), hair, 0, 0.0, -0.07); break;
    case 'swept': cap(-0.45, 0.5); add(head, new THREE.SphereGeometry(0.245, 14, 10), hair, 0, 0.0, -0.07); add(head, new THREE.SphereGeometry(0.13, 12, 8), hair, 0.04, 0.2, 0.08).scale.set(1.5, 0.7, 1); break;
    case 'curly': for (let i = 0; i < 26; i++) { const a = i * 2.4, e = Math.acos(1 - (i / 26) * 1.15); add(head, new THREE.SphereGeometry(0.075, 7, 5), hair, Math.sin(e) * Math.cos(a) * 0.24, Math.cos(e) * 0.24 + 0.02, Math.sin(e) * Math.sin(a) * 0.24 - 0.04); } break;
    case 'wavyShort': cap(-0.4, 0.52); add(head, new THREE.SphereGeometry(0.25, 14, 10), hair, 0, 0.02, -0.07); for (let i = 0; i < 6; i++) add(head, new THREE.SphereGeometry(0.07, 7, 5), hair, -0.15 + i * 0.06, 0.2, 0.12); break;
    case 'bun': cap(-0.9, 0.6); add(head, new THREE.SphereGeometry(0.25, 14, 10), hair, 0, -0.01, -0.09); add(head, new THREE.SphereGeometry(0.1, 10, 8), hair, 0, 0.14, -0.22); break;
    case 'shoulder': cap(-0.15, 0.6); add(head, new THREE.CylinderGeometry(0.25, 0.27, 0.32, 16, 1, true, Math.PI * 0.6, Math.PI * 0.8), M(s.hair, { side: THREE.DoubleSide }), 0, -0.14, -0.02); break;
    case 'long':
    case 'wavy': {
      cap(-0.15, 0.6);
      const back = add(head, new THREE.CylinderGeometry(0.26, s.hairStyle === 'wavy' ? 0.33 : 0.28, 0.62, 16, 1, true, Math.PI * 0.62, Math.PI * 0.76), M(s.hair, { side: THREE.DoubleSide }), 0, -0.28, -0.02);
      if (s.hairStyle === 'wavy') for (const k of [-1, 1]) for (let i = 0; i < 3; i++) add(head, new THREE.SphereGeometry(0.08, 7, 5), hair, k * 0.24, -0.15 - i * 0.16, 0.02);
      break;
    }
    default: cap();
  }
  // face
  const eye = basic('#1a1414'), white = basic('#ffffff');
  for (const k of [-1, 1]) {
    add(head, new THREE.SphereGeometry(0.028, 8, 6), eye, k * 0.08, 0.0, 0.215).scale.set(0.9, 1.1, 0.5);
    add(head, new THREE.SphereGeometry(0.008, 6, 4), white, k * 0.08 + 0.01, 0.013, 0.23);
    add(head, new THREE.BoxGeometry(0.06, 0.009, 0.01), M(s.hair), k * 0.08, 0.07, 0.22).rotation.z = k * -0.1;
    add(head, new THREE.CircleGeometry(0.038, 10), new THREE.MeshBasicMaterial({ color: '#ee9a92', transparent: true, opacity: 0.35 }), k * 0.13, -0.06, 0.197).rotation.y = k * 0.55;
  }
  add(head, new THREE.TorusGeometry(0.035, 0.007, 4, 10, Math.PI), basic('#8e4448'), 0, -0.08, 0.225).rotation.z = Math.PI;
  if (s.beard) { const bd = add(head, new THREE.SphereGeometry(0.235, 14, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.4), M(s.beard), 0, -0.01, 0.01); bd.scale.set(1.02, 1, 1.03); }
  if (s.glasses) {
    for (const k of [-1, 1]) add(head, new THREE.TorusGeometry(0.05, 0.007, 4, 14), M(s.glasses === true ? '#2a2628' : s.glasses), k * 0.08, 0.0, 0.23);
    add(head, new THREE.BoxGeometry(0.06, 0.008, 0.008), M(s.glasses === true ? '#2a2628' : s.glasses), 0, 0.01, 0.235);
  }
  if (s.cap) {   // a baseball cap with a little brim
    const c = add(head, new THREE.SphereGeometry(0.265, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M(s.cap), 0, 0.05, -0.01); c.scale.y = 0.85;
    add(head, new THREE.CylinderGeometry(0.17, 0.17, 0.02, 16, 1, false, -Math.PI / 2, Math.PI), M(s.cap), 0, 0.06, 0.2).scale.set(1, 1, 1.1);
    if (s.capPatch) add(head, new THREE.BoxGeometry(0.12, 0.08, 0.01), M(s.capPatch), 0, 0.17, 0.235).rotation.x = -0.35;
  }
  if (s.tie) { add(body, new THREE.BoxGeometry(0.05, 0.36, 0.02), M(s.tie), 0, hip + 0.5, 0.19); add(body, new THREE.BoxGeometry(0.07, 0.05, 0.03), M(s.tie), 0, hip + 0.68, 0.18); }
  if (s.scarf) {   // a long scarf draped round the neck, both ends hanging down the front
    const sc = M(s.scarf), dots = M('#c8a8f0');
    add(body, new THREE.TorusGeometry(0.11, 0.035, 6, 16), sc, 0, hip + 0.7, 0.01).rotation.x = Math.PI / 2 - 0.25;
    for (const k of [-1, 1]) {
      const strip = add(body, new THREE.BoxGeometry(0.11, 0.6, 0.025), sc, k * 0.12, hip + 0.38, 0.2);
      strip.rotation.z = k * -0.04;
      for (let d = 0; d < 4; d++) add(strip, new THREE.BoxGeometry(0.02, 0.02, 0.006), dots, (d % 2 ? 0.025 : -0.025), 0.2 - d * 0.13, 0.015);
    }
  }
  if (s.stripes) for (const k of [-1, 1]) add(body, new THREE.BoxGeometry(0.02, 0.5, 0.02), M(s.stripes), k * 0.19, hip + 0.38, 0.06);

  root.userData = { body, head, arms, legs, hip, H };
  if (s.seated) sit(root);
  return root;
}

function sit(p) {
  const u = p.userData;
  u.legs.forEach((l) => { l.rotation.x = -Math.PI / 2; });
  u.legs.forEach((l) => { l.position.y = u.hip * 0.95; });
  u.seated = true;
}
// stand a seated player up (or sit them back down) when they leave the stage
export function setSeated(p, on) {
  const u = p.userData;
  if (on) { sit(p); return; }
  u.legs.forEach((l) => { l.rotation.x = 0; l.position.y = u.hip; });
  u.seated = false;
}

// ── instruments ──
export const Inst = {
  guitar(color = '#c0562f', acoustic = false) {
    const g = new THREE.Group();
    g.scale.setScalar(1.25);
    add(g, new THREE.TorusGeometry(0.3, 0.012, 4, 20, Math.PI), M('#2a1a12'), 0.0, 0.2, -0.06).rotation.z = -0.3;
    const bodyM = M(color);
    add(g, new THREE.SphereGeometry(0.17, 14, 10), bodyM, 0, -0.06, 0).scale.set(1, 1.15, 0.28);
    add(g, new THREE.SphereGeometry(0.13, 14, 10), bodyM, 0, 0.14, 0).scale.set(1, 1, 0.28);
    if (acoustic) add(g, new THREE.CircleGeometry(0.05, 12), basic('#2a1a12'), 0, 0.04, 0.05);
    add(g, new THREE.BoxGeometry(0.05, 0.62, 0.03), M('#3a2618'), 0, 0.52, 0.02);
    add(g, new THREE.BoxGeometry(0.08, 0.12, 0.03), M('#2a1a12'), 0, 0.87, 0.02);
    return g;
  },
  keyboard() {
    const g = new THREE.Group();
    add(g, new THREE.BoxGeometry(1.0, 0.07, 0.3), M('#1d1b1f'), 0, 0.82, 0);
    add(g, new THREE.BoxGeometry(0.92, 0.02, 0.14), M('#f4f2ee'), 0, 0.865, 0.06);
    for (let i = 0; i < 10; i++) add(g, new THREE.BoxGeometry(0.03, 0.022, 0.08), M('#1d1b1f'), -0.42 + i * 0.09 + (i % 3 === 2 ? 0.02 : 0), 0.875, 0.03);
    for (const k of [-1, 1]) { const l = add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.95, 5), M('#3a3a3e'), k * 0.25, 0.4, 0); l.rotation.z = k * 0.45; }
    return g;
  },
  mic() {
    const g = new THREE.Group();
    add(g, new THREE.CylinderGeometry(0.12, 0.14, 0.03, 12), M('#2a2a2e'), 0, 0.015, 0);
    add(g, new THREE.CylinderGeometry(0.012, 0.012, 1.45, 6), M('#3a3a3e'), 0, 0.73, 0);
    add(g, new THREE.SphereGeometry(0.035, 8, 6), M('#555a60'), 0, 1.48, 0.04);
    return g;
  },
  sax() {
    const g = new THREE.Group(), b = M('#d9a93e', { emissive: '#3a2a08' });
    add(g, new THREE.CylinderGeometry(0.03, 0.05, 0.55, 8), b, 0, 0, 0);
    add(g, new THREE.TorusGeometry(0.07, 0.05, 6, 10, Math.PI), b, 0.07, -0.27, 0).rotation.z = Math.PI;
    add(g, new THREE.CylinderGeometry(0.1, 0.06, 0.2, 10), b, 0.14, -0.15, 0);
    add(g, new THREE.CylinderGeometry(0.012, 0.02, 0.14, 6), M('#222'), 0, 0.33, 0.02).rotation.x = 0.6;
    return g;
  },
  trumpet() {
    const g = new THREE.Group(), b = M('#e2b54a', { emissive: '#3a2a08' });
    add(g, new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), b, 0, 0, 0).rotation.x = Math.PI / 2;
    add(g, new THREE.CylinderGeometry(0.09, 0.02, 0.15, 12), b, 0, 0, 0.27).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.08, 6), b, 0, 0.04, -0.04 + i * 0.04);
    return g;
  },
  violin() {
    const g = new THREE.Group(), w = M('#8a3d1d');
    add(g, new THREE.SphereGeometry(0.1, 12, 8), w, 0, 0, 0).scale.set(1, 1.5, 0.3);
    add(g, new THREE.BoxGeometry(0.03, 0.22, 0.025), M('#1b1416'), 0, 0.22, 0.02);
    return g;
  },
  bow() { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), M('#4a3020'), 0, 0, 0).rotation.z = Math.PI / 2; return g; },
  flute() { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.62, 8), M('#e3e7ec', { emissive: '#2a2c30' }), 0, 0, 0).rotation.z = Math.PI / 2; return g; },
  erhu() {
    const g = new THREE.Group();
    add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.12, 6), M('#5a2a1a'), 0, 0, 0).rotation.x = Math.PI / 2;
    add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6), M('#3a1e14'), 0, 0.4, -0.03);
    return g;
  },
  tambourine() { const g = new THREE.Group(); add(g, new THREE.TorusGeometry(0.11, 0.025, 6, 16), M('#c79a5a'), 0, 0, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.01, 8), M('#d8dde4'), Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0).rotation.x = Math.PI / 2; } return g; },
  drumKit() {
    const g = new THREE.Group(), shell = M('#e0782f', { emissive: '#3a1a08' }), head = M('#f2ece0'), chrome = M('#cfd3d8'), brass = M('#d6b24a', { emissive: '#2a2008' });
    const drum = (r, h, x, y, z, rx = 0) => { const d = new THREE.Group(); add(d, new THREE.CylinderGeometry(r, r, h, 18), shell); add(d, new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.01, 18), head, 0, h / 2, 0); d.position.set(x, y, z); d.rotation.x = rx; g.add(d); return d; };
    drum(0.3, 0.32, 0, 0.3, 0.25, Math.PI / 2);            // kick
    drum(0.16, 0.13, -0.18, 0.75, 0.15, 0.35);              // toms
    drum(0.16, 0.13, 0.18, 0.75, 0.15, 0.35);
    drum(0.2, 0.18, 0.5, 0.42, -0.05);                      // floor tom
    drum(0.17, 0.12, -0.38, 0.55, -0.05, 0.15);             // snare
    for (const [x, y, z] of [[-0.62, 1.05, 0.0], [0.62, 1.15, 0.1], [-0.4, 0.85, -0.2]]) {
      add(g, new THREE.CylinderGeometry(0.01, 0.01, y, 4), chrome, x, y / 2, z);
      add(g, new THREE.CylinderGeometry(0.24, 0.24, 0.012, 18), brass, x, y, z).rotation.z = 0.12;
    }
    add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.08, 12), M('#2a2628'), 0, 0.45, -0.55);  // throne
    return g;
  },
  stick() { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.008, 0.01, 0.34, 5), M('#e4c79a'), 0, -0.12, 0.05).rotation.x = 1.2; return g; },
};

// ── animation helpers for each part ──
export function animatePerson(p, t, role, ph = 0) {
  const u = p.userData, [L, R] = u.arms;
  const beat = t * 2 * Math.PI * 1.6 + ph;               // ~96 bpm
  u.body.position.y = (u.seated ? -u.hip * 0.42 : 0) + Math.abs(Math.sin(beat / 2)) * 0.02;
  u.head.rotation.z = Math.sin(beat / 2) * 0.06;
  u.body.rotation.y = Math.sin(beat / 4) * 0.05;
  u.body.rotation.x = 0; u.body.rotation.z = 0; u.head.rotation.x = 0;
  if (!u.seated && role !== 'walk') for (const l of u.legs) l.rotation.x = 0;
  switch (role) {
    case 'walk': {
      const w = t * 9 + ph, sw = Math.sin(w);
      u.body.position.y = Math.abs(Math.sin(w)) * 0.04;
      u.legs[0].rotation.x = -sw * 0.5; u.legs[1].rotation.x = sw * 0.5;
      L.rotation.set(sw * 0.5, 0, -0.08); R.rotation.set(-sw * 0.5, 0, 0.08);
      u.head.rotation.z = Math.sin(w / 2) * 0.04; u.body.rotation.y = 0;
      break;
    }
    case 'hug':
      // arms wrapped forward around her, a gentle side-to-side squeeze
      L.rotation.set(-1.35, 0, 0.62 + Math.sin(t * 2.4 + ph) * 0.06); R.rotation.set(-1.35, 0, -0.62 - Math.sin(t * 2.4 + ph) * 0.06);
      u.body.rotation.x = 0.12; u.body.rotation.z = Math.sin(t * 1.6 + ph) * 0.05; u.head.rotation.x = 0.1;
      u.body.position.y = 0; u.body.rotation.y = 0;
      break;
    case 'chat':
      // milling about: weight shifts, little gestures, the odd laugh
      L.rotation.set(-0.25 - Math.max(0, Math.sin(t * 1.3 + ph)) * 0.5, 0, -0.12); R.rotation.set(Math.sin(t * 0.9 + ph) * 0.12, 0, 0.12);
      u.head.rotation.x = Math.max(0, Math.sin(t * 0.7 + ph * 2)) ** 8 * -0.25;
      u.body.position.y = Math.abs(Math.sin(t * 0.8 + ph)) * 0.015; u.body.rotation.z = 0;
      break;
    case 'guitar': case 'bass': case 'acoustic':
      L.rotation.set(-0.8, 0, -0.5); R.rotation.set(-0.5 + Math.sin(beat * 2) * 0.25, 0, 0.35); break;
    case 'keys':
      L.rotation.set(-1.05 + Math.sin(beat) * 0.08, 0, -0.15); R.rotation.set(-1.05 + Math.sin(beat + 1.3) * 0.08, 0, 0.15); break;
    case 'vocals':
      L.rotation.set(-1.25, 0, -0.15); R.rotation.set(Math.sin(beat / 2) * 0.2 - 0.15, 0, 0.25 + Math.max(0, Math.sin(beat / 2)) * 0.4); u.head.rotation.x = -0.1; break;
    case 'sax': case 'trumpet':
      L.rotation.set(-1.2, 0, -0.35); R.rotation.set(-1.0, 0, 0.35); u.body.rotation.x = Math.sin(beat / 2) * 0.06; break;
    case 'violin': case 'erhu':
      L.rotation.set(-1.3, 0, -0.75); R.rotation.set(-0.7, 0, 0.6 + Math.sin(beat) * 0.35); u.head.rotation.z = 0.25; break;
    case 'flute':
      L.rotation.set(-1.5, 0, 0.55); R.rotation.set(-1.35, 0, -0.25); u.head.rotation.z = -0.15; break;
    case 'drums':
      L.rotation.set(-0.9 + Math.max(0, Math.sin(beat * 2)) * 0.6, 0, -0.25); R.rotation.set(-0.9 + Math.max(0, Math.sin(beat * 2 + Math.PI)) * 0.6, 0, 0.25); break;
    case 'wave':
      L.rotation.set(0.05, 0, -0.1); R.rotation.set(-2.7, 0, 0.35 + Math.sin(t * 9) * 0.35); u.head.rotation.z = Math.sin(t * 3) * 0.08; break;
    case 'tambourine':
      L.rotation.set(-0.3, 0, -0.1); R.rotation.set(-2.6 + Math.sin(beat * 2) * 0.2, 0, 0.3); break;
    case 'lionDrum':
      L.rotation.set(-1.4 + Math.max(0, Math.sin(beat * 2)) * 0.7, 0, -0.2); R.rotation.set(-1.4 + Math.max(0, Math.sin(beat * 2 + 1.6)) * 0.7, 0, 0.2); break;
    default:
      L.rotation.set(Math.sin(beat / 2) * 0.1, 0, -0.1); R.rotation.set(-Math.sin(beat / 2) * 0.1, 0, 0.1);
  }
}

// b: the room's Builder (chairs and stands are merged in); group: where the people go.
export function buildOrchestra(b, group, { x: ox = 0, z: oz = 0, y = 0, scale = 1, maxX = 8, minZ = -1e9 } = {}) {
  const SK = ['#f4d8c6', '#f1cfb6', '#dcae86', '#b07a54', '#9a6646'], HAIR = ['#141012', '#2a1d18', '#6b4a32', '#8a6a4a', '#1e1614'];
  const players = [];
  let i = 0;
  const seat = (x, z, ry, role) => {
    const p = makePerson({ skin: SK[i % 5], hair: HAIR[(i * 3) % 5], hairStyle: ['short', 'bun', 'long', 'wavyShort', 'swept'][i % 5], top: '#141214', bottom: '#141214', seated: true, dress: i % 3 === 1 });
    p.position.set(x, y, z); p.rotation.y = ry;
    const u = p.userData, neck = u.hip + 0.72;
    const at = (obj, parent, px, py, pz, rx = 0, rz = 0) => { obj.position.set(px, py, pz); obj.rotation.set(rx, 0, rz); parent.add(obj); return obj; };
    if (role === 'violin') { at(Inst.violin(), u.body, 0.14, neck + 0.04, 0.14, -1.25, 0.5); at(Inst.bow(), u.arms[0], 0, -0.44, 0.04); }
    else if (role === 'cello') { const c = Inst.guitar('#8a4a24', true); c.scale.setScalar(1.6); at(c, p, 0, 0.15, 0.32, 0.15, 0); at(Inst.bow(), u.arms[0], 0, -0.44, 0.04); }
    else if (role === 'flute') at(Inst.flute(), u.body, -0.32, neck + 0.18, 0.2);
    else if (role === 'trumpet') at(Inst.trumpet(), u.body, 0, neck + 0.18, 0.34);
    b.box(0.42, u.hip * 0.55, 0.42, '#2a2224', x, y, z - 0.05);
    b.cyl(0.015, 0.015, 1.0, 4, '#2a2628', x + Math.sin(ry) * 0.5, y, z + Math.cos(ry) * 0.5, { ao: false });
    b.box(0.32, 0.22, 0.02, '#fbf8f0', x + Math.sin(ry) * 0.5, y + 1.0, z + Math.cos(ry) * 0.5, { ry, ao: false });
    group.add(p);
    players.push({ p, role: role === 'cello' ? 'violin' : role, ph: i * 0.41 });
    i++;
  };
  for (const [rad, n, role, a0, a1] of [[2.6, 8, 'violin', -1.25, 1.25], [4.0, 10, 'violin', -1.15, 1.15], [5.3, 6, 'cello', 0.75, 1.2], [5.3, 6, 'flute', -0.55, 0.55], [5.3, 6, 'cello', -1.2, -0.75], [6.4, 6, 'trumpet', -0.5, 0.5]]) {
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * (k / (n - 1)), r = rad * scale;
      const x = ox + Math.sin(a) * r, z = oz - 0.1 - Math.cos(a) * r * 0.78;
      if (z < minZ || Math.abs(x - ox) > maxX) continue;
      seat(x, z, Math.atan2(ox - x, oz + 0.5 - z), role);
    }
  }
  for (const sx of [-1, 1]) { const tz = Math.max(minZ + 0.5, oz - 6.2 * scale); b.cyl(0.42, 0.32, 0.8, 16, '#c08a3a', ox + sx * 1.0, y, tz); b.cyl(0.43, 0.43, 0.03, 16, '#f2ead8', ox + sx * 1.0, y + 0.8, tz, { ao: false }); }
  b.box(0.9, 0.25, 0.9, '#3a2a20', ox, y, oz);
  const cond = makePerson({ skin: '#f1cfb6', hair: '#d8d4cc', hairStyle: 'swept', top: '#f4f2ee', jacket: '#141214', bottom: '#141214' });
  cond.position.set(ox, y + 0.25, oz); cond.rotation.y = Math.PI;
  const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), new THREE.MeshBasicMaterial({ color: '#fbf8f0' }));
  baton.position.set(0, -0.6, 0.1); baton.rotation.x = 1.2; cond.userData.arms[1].add(baton);
  group.add(cond);
  return (t) => {
    for (const m of players) animatePerson(m.p, t, m.role, m.ph);
    const u = cond.userData, beat = t * Math.PI * 2 * 1.4;
    u.arms[1].rotation.set(-1.6 + Math.sin(beat) * 0.5, 0, 0.5 + Math.cos(beat) * 0.35);
    u.arms[0].rotation.set(-1.3 + Math.sin(beat * 0.5) * 0.3, 0, -0.5);
    u.body.rotation.y = Math.sin(beat * 0.5) * 0.12;
    u.head.rotation.x = Math.sin(beat) * 0.06;
  };
}

// a black grand piano (lid up), keyboard facing +z
export function grandPiano() {
  const g = new THREE.Group();
  const black = M('#141214'), shine = M('#2a2830');
  const sh = new THREE.Shape();
  sh.moveTo(-0.75, 0); sh.lineTo(0.75, 0); sh.lineTo(0.75, -0.9); sh.quadraticCurveTo(0.7, -1.9, 0.1, -2.2); sh.quadraticCurveTo(-0.4, -2.3, -0.6, -1.7); sh.quadraticCurveTo(-0.75, -1.2, -0.75, 0);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.32, bevelEnabled: false }), black);
  body.rotation.x = Math.PI / 2; body.position.y = 0.98; g.add(body);
  // the lid, propped open on its hinge along the straight side
  const pivot = new THREE.Group(); pivot.position.set(-0.75, 1.0, 0); pivot.rotation.z = 0.7; g.add(pivot);
  const lid = new THREE.Mesh(new THREE.ShapeGeometry(sh), M('#1c1a20', { side: THREE.DoubleSide }));
  lid.rotation.x = Math.PI / 2; lid.position.x = 0.75; pivot.add(lid);
  add(pivot, new THREE.CylinderGeometry(0.012, 0.012, 0.9, 4), shine, 1.2, -0.45, -1.0).rotation.z = 0.7;
  add(g, new THREE.BoxGeometry(1.5, 0.12, 0.3), black, 0, 0.92, 0.12);
  add(g, new THREE.BoxGeometry(1.38, 0.03, 0.16), M('#f4f2ee'), 0, 0.99, 0.16);
  for (let k = 0; k < 20; k++) add(g, new THREE.BoxGeometry(0.03, 0.03, 0.09), black, -0.64 + k * 0.068, 1.01, 0.12);
  for (const [x, z] of [[-0.65, 0.05], [0.65, 0.05], [0.1, -2.0]]) add(g, new THREE.CylinderGeometry(0.05, 0.04, 0.66, 8), black, x, 0.33, z);
  const bench = new THREE.Group(); bench.position.set(0, 0, 0.75); g.add(bench);
  add(bench, new THREE.BoxGeometry(0.7, 0.08, 0.36), black, 0, 0.5, 0);
  for (const sx of [-0.3, 0.3]) add(bench, new THREE.BoxGeometry(0.05, 0.5, 0.3), black, sx, 0.25, 0);
  return g;
}

// a fluffy long-haired cat (for the cats who sent their love too)
export function makeFluffyCat(fur = '#3a3230', o = {}) {
  const g = new THREE.Group();
  const furM = M(fur), dark = basic('#120e0e'), eyeM = basic(o.eyes ?? '#d8b040');
  const body = new THREE.Group(); g.add(body);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; add(body, new THREE.SphereGeometry(0.16, 10, 8), furM, Math.cos(a) * 0.14, 0.24 + Math.sin(i * 1.7) * 0.04, Math.sin(a) * 0.2).scale.set(1, 0.9, 1.1); }
  add(body, new THREE.SphereGeometry(0.26, 14, 10), furM, 0, 0.27, 0).scale.set(1, 0.85, 1.3);
  const head = new THREE.Group(); head.position.set(0, 0.46, 0.3); body.add(head);
  add(head, new THREE.SphereGeometry(0.19, 14, 10), furM, 0, 0, 0).scale.set(1.15, 1, 1);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(head, new THREE.SphereGeometry(0.08, 8, 6), furM, Math.cos(a) * 0.17, Math.sin(a) * 0.12 - 0.04, -0.02); }   // ruff
  for (const k of [-1, 1]) {
    add(head, new THREE.ConeGeometry(0.06, 0.12, 4), furM, k * 0.12, 0.15, 0).rotation.set(0.1, Math.PI / 4, k * -0.4);
    add(head, new THREE.SphereGeometry(0.035, 8, 6), eyeM, k * 0.07, 0.02, 0.16).scale.z = 0.5;
    add(head, new THREE.SphereGeometry(0.016, 6, 4), dark, k * 0.07, 0.02, 0.18);
  }
  add(head, new THREE.SphereGeometry(0.02, 6, 4), basic('#4a2a2a'), 0, -0.04, 0.19);
  const tail = add(g, new THREE.CylinderGeometry(0.07, 0.1, 0.45, 8), furM, 0, 0.2, -0.38); tail.rotation.x = -1.1;
  g.userData = { body, head, tail };
  g.scale.setScalar(o.s ?? 1);
  return g;
}

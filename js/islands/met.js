// Inside the Metropolitan Opera House at Lincoln Center: the grand lobby, after
// the photo — the white double staircase whose two flights sweep up from either
// side to meet on a bridge, smooth white balustrades with brass rails, curving
// balcony tiers stacked above with dark wood soffits, the great starburst
// chandelier, a red mural, the red-lamped box office beneath, red carpet.
// The stairs are walkable: they climb to the grand tier, its own walking level.
import * as THREE from 'three';
import { Island } from '../island.js';
import { U, toonMat, textPlane } from '../kit.js';
import { makePerson, animatePerson } from '../people.js';

const HW = 10, HD = 9, CEIL = 11, TIER = 3.6;
const WHITE = '#f7f3ea', CREAM = '#efe6d2', BRASS = '#d8b25a', RED = '#a8262e', SOFFIT = '#5a3a28';
// the staircase: an annulus round (0, CZ); angle a is measured from +z (0) to the back (π)
const CZ = -1.0, R1 = 3.6, R2 = 5.2, A0 = 0.4 * Math.PI, A1 = Math.PI, AR = A1 - A0;
const polar = (x, z) => [Math.hypot(x, z - CZ), Math.atan2(Math.abs(x), z - CZ)];
const stairH = (a) => TIER * THREE.MathUtils.clamp((a - A0) / AR, 0, 1);
const inBand = (r, a, pad = 0) => r > R1 - pad && r < R2 + pad && a >= A0 && a <= A1 + 0.01;
const bandClamp = (p, r) => { const k = THREE.MathUtils.clamp(r, R1 + 0.25, R2 - 0.25) / r; p.x *= k; p.z = CZ + (p.z - CZ) * k; };

class Lobby extends Island {
  insideRim(x, z, m = 1.2) { return Math.abs(x) < HW - m * 0.6 && Math.abs(z) < HD - m * 0.6; }
  // on the stairs she stays between the balustrades; off them, she can only step on at the bottom
  clampRim(p) {
    const [r, a] = polar(p.x, p.z);
    if (p.onStair) {
      if (a < A0 + 0.02) p.onStair = false;
      else bandClamp(p, r);
    } else if (inBand(r, a)) {
      if (a < A0 + AR * 0.12) p.onStair = true;
      else { const k = (r < (R1 + R2) / 2 ? R1 - 0.08 : R2 + 0.08) / r; p.x *= k; p.z = CZ + (p.z - CZ) * k; }
    }
    p.x = THREE.MathUtils.clamp(p.x, -HW + 0.7, HW - 0.7); p.z = THREE.MathUtils.clamp(p.z, -HD + 0.7, HD - 0.7);
  }
  heightAt(x, z) { const [r, a] = polar(x, z); return inBand(r, a) ? stairH(a) : 0; }
  swap(p) { const [r, a] = polar(p.x, p.z); return p.onStair && inBand(r, a) && a > A1 - AR * 0.1 ? this.up : null; }
  finalize(scene) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HW * 2).rotateX(-Math.PI / 2), toonMat({ map: this.gp.texture() }));
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

// the grand tier: the U of balcony plus the bridge and the top of both flights
const UP_RECTS = [[-9.6, 9.6, -8.6, -6.2], [-9.6, -7.4, -6.2, 8.4], [7.4, 9.6, -6.2, 8.4], [-1.3, 1.3, -6.4, -4.4]];
class GrandTier extends Island {
  insideRim(x, z, m = 1.2) {
    const s = Math.max(0, m - 1) * 0.45;
    if (UP_RECTS.some(([x0, x1, z0, z1]) => x > x0 + s && x < x1 - s && z > z0 + s && z < z1 - s)) return true;
    const [r, a] = polar(x, z);
    return r > R1 + 0.25 + s * 0.5 && r < R2 - 0.25 - s * 0.5 && a > A1 - AR * 0.3 && a <= A1 + 0.01;
  }
  clampRim(p) {
    if (this.insideRim(p.x, p.z, 1)) return;
    const [r, a] = polar(p.x, p.z);
    if (a > A1 - AR * 0.35 && r > R1 - 0.5 && r < R2 + 0.5) { bandClamp(p, r); return; }
    let best = null, bd = 1e9;
    for (const [x0, x1, z0, z1] of UP_RECTS) {
      const x = THREE.MathUtils.clamp(p.x, x0 + 0.3, x1 - 0.3), z = THREE.MathUtils.clamp(p.z, z0 + 0.3, z1 - 0.3);
      const d = (x - p.x) ** 2 + (z - p.z) ** 2;
      if (d < bd) { bd = d; best = [x, z]; }
    }
    p.x = best[0]; p.z = best[1];
  }
  heightAt(x, z) { const [r, a] = polar(x, z); return inBand(r, a) && a < A1 - 0.02 && Math.abs(x) > 1.3 ? stairH(a) - TIER : 0; }
  swap(p) { const [r, a] = polar(p.x, p.z); if (inBand(r, a) && a < A1 - AR * 0.22) { p.onStair = true; return this.below; } return null; }
  update(t, dt) { this.below.update(t, dt); super.update(t, dt); }
  finalize(scene) {
    const sh = new THREE.Shape();
    [[-9.7, -8.7], [9.7, -8.7], [9.7, 8.5], [7.3, 8.5], [7.3, -6.1], [1.3, -6.1], [1.3, -4.3], [-1.3, -4.3], [-1.3, -6.1], [-7.3, -6.1], [-7.3, 8.5], [-9.7, 8.5]].forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
    const floor = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ visible: false }));
    floor.position.y = 0.01; floor.name = 'ground'; floor.userData.island = this;
    this.ground = floor; this.group.add(floor);
    this.group.add(this.b.build());
    this.buildNav();
    scene.add(this.group);
    return this;
  }
}

// a starburst chandelier: a bright core with crystal-tipped rods in every direction
function starburst(r, n = 60) {
  const g = new THREE.Group();
  const glow = new THREE.MeshBasicMaterial({ color: '#fff4d6' }), rod = new THREE.MeshBasicMaterial({ color: '#efe0b8' });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.14, 12, 10), glow));
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const y = 1 - (i + 0.5) / n * 2, rr = Math.sqrt(1 - y * y), a = i * 2.39996;
    const d = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
    const len = r * (0.7 + (i % 4) * 0.1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 4).translate(0, len / 2, 0), rod);
    m.quaternion.setFromUnitVectors(up, d); g.add(m);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.05, 6, 5), glow); tip.position.copy(d).multiplyScalar(len); g.add(tip);
  }
  return g;
}

export function buildMet(scene) {
  const I = new Lobby({ id: 'metOpera', center: [-260, 260, 900], R: HW, seed: 1883 });
  I.interior = true;
  I.ceilingY = CEIL;
  I.camDist = 10;
  I.camPitch = 0.38;
  const b = I.b, gp = I.gp;

  // ── red carpet over the whole lobby floor, a gold border ──
  gp.base(['#a8303a', '#a02a34', '#b03840'], 2400);
  for (const [x, z, w, d] of [[0, -HD + 0.25, HW * 2, 0.2], [0, HD - 0.25, HW * 2, 0.2], [-HW + 0.25, 0, 0.2, HD * 2], [HW - 0.25, 0, 0.2, HD * 2]]) gp.rect(x, z, w, d, BRASS);

  // ── shell: cream walls, red walls under the balcony at the back, a gold-leaf ceiling ──
  const shell = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, CEIL, HD * 2), toonMat({ color: CREAM, side: THREE.BackSide }));
  shell.position.y = CEIL / 2 - 0.02; I.extras.add(shell);
  I.box(0, -HD - 0.4, HW * 2 + 2, 0.6, CEIL); I.box(0, HD + 0.4, HW * 2 + 2, 0.6, CEIL);
  I.box(-HW - 0.4, 0, 0.6, HD * 2 + 2, CEIL); I.box(HW + 0.4, 0, 0.6, HD * 2 + 2, CEIL);
  b.box(HW * 2, TIER, 0.1, '#6a1e24', 0, 0, -HD + 0.06);
  for (let x = -8; x <= 8; x += 4) for (let z = -6; z <= 6; z += 4) b.box(3.4, 0.08, 3.4, '#e8d29c', x, CEIL - 0.1, z, { ao: false });
  // the box office beneath the bridge, with little red lamps
  b.box(5.2, 1.05, 0.7, '#3a2420', 0, 0, -HD + 1.0);
  b.box(5.3, 0.06, 0.8, '#d8b25a', 0, 1.05, -HD + 1.0, { ao: false });
  b.box(5.0, 0.08, 0.05, '#ffcf9a', 0, 0.98, -HD + 1.37, { layer: 'glow', ao: false });
  for (const x of [-4.4, -3.2, 3.2, 4.4, -6.8, 6.8]) b.box(0.16, 0.36, 0.08, '#ff6a5a', x, 1.9, -HD + 0.14, { layer: 'glow', ao: false });
  I.box(0, -HD + 1.0, 5.2, 0.7, 1.1);

  // ── balcony tiers: the grand tier (walkable) and two above, curving fronts, dark soffits ──
  const tierFront = (y, depth, inset) => {
    const xi = HW - depth - inset, zb = -HD + depth + inset * 0.4;
    // back run, bowed forward in the middle
    for (let k = 0; k < 24; k++) {
      const x1 = -xi + (k / 24) * 2 * xi, x2 = -xi + ((k + 1) / 24) * 2 * xi;
      const bow = (x) => zb + Math.cos((x / xi) * Math.PI / 2) * 0.9;
      if (y === TIER && Math.abs((x1 + x2) / 2) < 1.4) continue;   // the bridge comes through here
      const z1 = bow(x1), z2 = bow(x2), len = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
      b.box(0.18, 1.0, len + 0.03, WHITE, mx, y, mz, { ry });
      b.box(0.1, 0.06, len + 0.03, BRASS, mx, y + 1.08, mz, { ry, ao: false });
      b.box(len + 0.05, 0.12, 1.4, SOFFIT, mx, y - 0.12, mz - 0.6, { ao: false });
    }
    for (const sx of [-1, 1]) {
      b.box(0.18, 1.0, HD * 2 - depth - 1, WHITE, sx * xi, y, (zb + HD - 1) / 2 + 0.3);
      b.box(0.1, 0.06, HD * 2 - depth - 1, BRASS, sx * xi, y + 1.08, (zb + HD - 1) / 2 + 0.3, { ao: false });
      b.box(HW - xi, 0.3, HD * 2, sx > 0 ? CREAM : CREAM, sx * (xi + (HW - xi) / 2), y - 0.3, 0);
      b.box(HW - xi, 0.06, HD * 2, SOFFIT, sx * (xi + (HW - xi) / 2), y - 0.34, 0, { ao: false });
      for (let z = -HD + 2; z < HD - 1; z += 1.6) b.sphere(0.06, '#fff0c8', sx * (xi - 0.12), y + 0.4, z, { layer: 'glow', ao: false, ws: 5, hs: 4 });
    }
    b.box(HW * 2, 0.3, depth + inset * 0.4 + 0.2, CREAM, 0, y - 0.3, -HD + (depth + inset * 0.4) / 2);
  };
  tierFront(TIER, 2.6, 0);
  tierFront(6.6, 2.6, 0.6);
  tierFront(9.2, 2.6, 1.2);
  // the tall white pillars either side of the staircase
  for (const sx of [-1, 1]) { b.cyl(0.45, 0.45, CEIL, 18, WHITE, sx * 6.4, 0, -7.6); I.circle(sx * 6.4, -7.6, 0.5, CEIL); }
  // the red mural on the back wall of the grand tier, with a dark statue before it on the bridge
  const mural = textPlane(6.5, 3.2, (g, W, H) => {
    g.fillStyle = '#c8342a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = ['#f2c14e', '#e8722a', '#7a1a22', '#f6e2b0', '#3a6aa8', '#4a8a4a'][i % 6]; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, 6 + Math.random() * 26, 4 + Math.random() * 16, Math.random() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }, { px: 220 });
  mural.position.set(0, TIER + 2.2, -HD + 0.06); I.extras.add(mural);
  b.box(0.7, 1.0, 0.7, '#6a6a6a', 0, TIER, -8.3);
  b.cyl(0.18, 0.26, 0.9, 10, '#2a2a2e', 0, TIER + 1.0, -8.3); b.sphere(0.16, '#2a2a2e', 0, TIER + 2.05, -8.3);

  // ── the double staircase ──
  {
    const n = 22;
    for (const sx of [-1, 1]) {
      for (let k = 0; k < n; k++) {
        const a = A0 + (k + 0.5) / n * AR, y = stairH(a), rm = (R1 + R2) / 2;
        const x = sx * Math.sin(a) * rm, z = CZ + Math.cos(a) * rm;
        b.box(R2 - R1, 0.16, AR * rm / n + 0.04, RED, x, y - 0.16, z, { ry: sx * a + Math.PI / 2 });
        b.box(R2 - R1, 0.3, AR * rm / n + 0.04, WHITE, x, y - 0.46, z, { ry: sx * a + Math.PI / 2 });     // the sweeping underside
      }
      // smooth white balustrades along both edges, with brass handrails
      for (const r of [R1, R2]) for (let k = 0; k < 36; k++) {
        const a1 = A0 + k / 36 * AR, a2 = A0 + (k + 1) / 36 * AR;
        if (r === R1 && a1 > A1 - 0.18) continue;            // open where the flights meet the bridge
        const am = (a1 + a2) / 2, y = stairH(am), x = sx * Math.sin(am) * r, z = CZ + Math.cos(am) * r, len = (a2 - a1) * r + 0.04;
        b.box(0.18, 1.1, len, WHITE, x, y - 0.4, z, { ry: sx * am + Math.PI / 2 });
        b.cyl(0.035, 0.035, len, 4, BRASS, x, y + 0.95, z, { rz: Math.PI / 2, ry: sx * am + Math.PI, center: true, ao: false });
      }
    }
    // the bridge where they meet, an arch beneath it
    b.box(2.8, 0.35, 2.0, WHITE, 0, TIER - 0.35, CZ - (R1 + R2) / 2 - 0.2);
    b.box(2.8, 0.06, 2.0, RED, 0, TIER - 0.02, CZ - (R1 + R2) / 2 - 0.2, { ao: false });
  }

  // ── starburst chandeliers: one great one over the stairs, others under the tiers ──
  const bursts = [];
  for (const [x, y, z, r] of [[0, 7.6, -1.0, 1.7], [-5, 8.2, 4, 0.8], [5, 8.2, 4, 0.8], [0, 8.6, 6.4, 0.7], [-8.6, 2.6, 2.5, 0.45], [8.6, 2.6, 2.5, 0.45]]) {
    const s = starburst(r); s.position.set(x, y, z); I.extras.add(s); bursts.push(s);
    if (y > 5) b.cyl(0.01, 0.01, CEIL - y, 3, '#b89a5a', x, y, z, { ao: false });
  }
  const warm = new THREE.PointLight('#ffe0b0', 26, 26, 1.3);
  warm.position.set(0, 6.5, 1); I.group.add(warm);

  // ── the front wall: tall glass onto the plaza ──
  for (const x of [-4.4, -2.2, 0, 2.2, 4.4]) {
    const w = textPlane(1.9, 7.2, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d2a4a'); gr.addColorStop(1, '#4a3a5a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe6b0'; for (let i = 0; i < 14; i++) g.fillRect(Math.random() * W, H * 0.6 + Math.random() * H * 0.35, 3, 3); g.strokeStyle = '#2a2428'; g.lineWidth = 3; for (let y = 0; y < H; y += H / 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }, { px: 80, glow: true });
    w.position.set(x, 3.8, HD - 0.05); w.rotation.y = Math.PI; I.extras.add(w);
  }

  // ── opera-goers in their evening best ──
  const guests = [
    [-1.6, 5.2, 2.2, { skin: '#f1cfb6', hair: '#2a1d18', hairStyle: 'bun', top: '#1c1a20', dress: true, sleeveless: true, necklace: true }],
    [-0.9, 5.6, -2.6, { skin: '#b07a54', hair: '#141012', hairStyle: 'short', top: '#efe6d4', jacket: '#1a1a1e', bottom: '#1a1a1e' }],
    [6.6, 3.8, -1.8, { skin: '#f4d8c6', hair: '#8a6a4a', hairStyle: 'long', top: '#8a1e2e', dress: true }],
    [7.3, 4.5, -2.8, { skin: '#dcae86', hair: '#1e1614', hairStyle: 'short', top: '#efe6d4', jacket: '#22202a', bottom: '#22202a', glasses: true }],
    [-7.0, 6.4, 3.0, { skin: '#f1cfb6', hair: '#141012', hairStyle: 'shoulder', top: '#2b3d6b', dress: true }],
    [2.6, -6.6, 0.4, { skin: '#9a6646', hair: '#141012', hairStyle: 'curly', top: '#e8c26b', dress: true, sleeveless: true }],
  ];
  const people = guests.map(([x, z, ry, s]) => { const p = makePerson(s); p.position.set(x, 0, z); p.rotation.y = ry; I.extras.add(p); I.circle(x, z, 0.3, 1.8); return p; });
  I.updaters.push((t) => {
    const k = U.sway.value ? 1 : 0.2;
    people.forEach((p, i) => animatePerson(p, t * k * 0.6, 'chat', i * 1.3));
    bursts.forEach((s, i) => { s.rotation.y = t * 0.05 * k * (i % 2 ? 1 : -1); });
  });

  // ── back out to the plaza ──
  I.landing = { x: 0, z: HD - 2.2 };
  const exit = I.spot('metExit', 0, HD - 1.2, { label: 'the plaza doors', glowY: 2.4, reach: 2 });
  exit.prompt = { title: 'Back to the plaza', sub: 'to step outside' };
  exit.exit = true;
  I.exitTo = { island: 'nyc', x: -6, z: 18.6, heading: Math.PI };
  I.finalize(scene);

  // ── the grand tier, its own walking level ──
  const c = I.center;
  const T = new GrandTier({ id: 'metUp', center: [c.x, c.y + TIER, c.z], R: HW, seed: 1884 });
  T.interior = true;
  T.ceilingY = CEIL - TIER;
  T.camDist = 8;
  T.below = I;
  T.exitTo = I.exitTo;
  T.box(0, -HD - 0.4, HW * 2 + 2, 0.6, CEIL); T.box(-HW - 0.4, 0, 0.6, HD * 2 + 2, CEIL); T.box(HW + 0.4, 0, 0.6, HD * 2 + 2, CEIL);
  for (const sx of [-1, 1]) T.circle(sx * 6.4, -7.6, 0.5, CEIL);
  T.circle(0, -8.3, 0.5, 2);
  const upGuests = [[-8.6, -3, 1.6, '#1c1a20'], [8.4, 1.5, -1.4, '#8a1e2e'], [-4.5, -7.8, 0.2, '#2b3d6b']];
  const ups = upGuests.map(([x, z, ry, col], i) => { const p = makePerson({ skin: ['#f1cfb6', '#dcae86', '#b07a54'][i], hair: '#141012', hairStyle: ['bun', 'short', 'long'][i], top: col, dress: i !== 1 }); p.position.set(x, 0, z); p.rotation.y = ry; T.extras.add(p); T.circle(x, z, 0.25, 1.8); return p; });
  T.updaters.push((t) => ups.forEach((p, i) => animatePerson(p, t * 0.6, 'chat', i * 2)));
  I.up = T.finalize(scene);
  return I;
}

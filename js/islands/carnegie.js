// Inside Carnegie Hall's main hall (Stern Auditorium), after the photos: an
// ivory-and-gold horseshoe of four curving tiers with rows of little lights
// beneath each, red velvet seats, the arched stage alcove with gold trim, the
// great ring of lights in the ceiling, and a pianist at a grand piano.
import * as THREE from 'three';
import { Island } from '../island.js';
import { U, toonMat } from '../kit.js';
import { makePerson, animatePerson, grandPiano } from '../people.js';

const HW = 11, HD = 13, CEIL = 12;
const IVORY = '#f6efe0', CREAM = '#efe3c8', GOLD = '#d8b25a', RED = '#a8262e', RED_D = '#7a1c24';
const STAGE_FRONT = -5.6, STAGE_H = 1.0;

class Auditorium extends Island {
  insideRim(x, z, m = 1.2) { return Math.abs(x) < HW - m * 0.6 && Math.abs(z) < HD - m * 0.6; }
  clampRim(p) { p.x = THREE.MathUtils.clamp(p.x, -HW + 0.7, HW - 0.7); p.z = THREE.MathUtils.clamp(p.z, -HD + 0.7, HD - 0.7); }
  finalize(scene) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HD * 2, HD * 2).rotateX(-Math.PI / 2), toonMat({ map: this.gp.texture() }));
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

// points round a horseshoe: up the left side, round the back, down the right side
function horseshoe(a, bz, z0, z1, step = 0.55) {
  const pts = [];
  for (let z = z0; z < z1; z += step) pts.push([-a, z]);
  const n = Math.ceil((Math.PI * (a + bz) / 2) / step);
  for (let k = 0; k <= n; k++) { const t = k / n * Math.PI; pts.push([-a * Math.cos(t), z1 + bz * Math.sin(t)]); }
  for (let z = z1 - step; z >= z0; z -= step) pts.push([a, z]);
  return pts;
}

export function buildCarnegie(scene) {
  const I = new Auditorium({ id: 'carnegie', center: [260, 260, 900], R: HD, seed: 1891 });
  I.interior = true;
  I.ceilingY = CEIL;
  I.camDist = 10;
  I.camPitch = 0.3;
  const b = I.b, gp = I.gp;

  // ── red carpet aisles, darker red under the seats ──
  gp.base(['#6e2a2a', '#64262a', '#73302e'], 1200);
  for (const x of [-2.6, 2.6]) gp.rect(x, 3.5, 1.6, 18, RED);
  for (const sx of [-1, 1]) gp.rect(sx * 9.3, 3.5, 2.6, 18, RED);
  gp.rect(0, 11.6, 22, 2.8, RED);
  gp.rect(0, -4.9, 22, 1.2, RED);

  // ── the hall shell ──
  const shell = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, CEIL, HD * 2), toonMat({ color: IVORY, side: THREE.BackSide }));
  shell.position.y = CEIL / 2 - 0.02; I.extras.add(shell);
  I.box(0, -HD - 0.4, HW * 2 + 2, 0.6, CEIL); I.box(0, HD + 0.4, HW * 2 + 2, 0.6, CEIL);
  I.box(-HW - 0.4, 0, 0.6, HD * 2 + 2, CEIL); I.box(HW + 0.4, 0, 0.6, HD * 2 + 2, CEIL);
  // cream doors with gold frames along the side walls of the main floor
  for (const sx of [-1, 1]) for (const z of [-2.5, 3.5, 8.5]) { b.box(0.08, 2.4, 1.1, CREAM, sx * (HW - 0.05), 0, z); b.box(0.1, 2.55, 1.3, GOLD, sx * (HW - 0.03), 0, z, { ao: false }); b.box(0.12, 2.4, 1.1, CREAM, sx * (HW - 0.07), 0, z); }

  // ── stage and the arched alcove behind it ──
  b.box(HW * 2, STAGE_H, HD + STAGE_FRONT, '#e2c290', 0, 0, (-HD + STAGE_FRONT) / 2);
  b.box(HW * 2, 0.08, 0.12, '#b8925e', 0, STAGE_H, STAGE_FRONT - 0.06, { ao: false });
  b.box(HW * 2, STAGE_H, 0.1, '#8a6a48', 0, 0, STAGE_FRONT);
  I.box(0, (-HD + STAGE_FRONT) / 2, HW * 2, HD + STAGE_FRONT + 0.4, STAGE_H + 0.2);
  // the proscenium wall with its arched opening (straight sides, a shallow elliptical top)
  {
    const ow = 6.6, sideTop = 6.0, rise = 2.2, z = STAGE_FRONT - 0.2;
    const wall = new THREE.Shape();
    wall.moveTo(-HW, 0); wall.lineTo(HW, 0); wall.lineTo(HW, CEIL); wall.lineTo(-HW, CEIL); wall.lineTo(-HW, 0);
    const hole = new THREE.Path();
    hole.moveTo(-ow, STAGE_H); hole.lineTo(ow, STAGE_H); hole.lineTo(ow, sideTop); hole.absellipse(0, sideTop, ow, rise, 0, Math.PI, false); hole.lineTo(-ow, STAGE_H);
    wall.holes.push(hole);
    b.add(new THREE.ExtrudeGeometry(wall, { depth: 0.5, bevelEnabled: false, curveSegments: 30 }), IVORY, 0, 0, z - 0.25, { ao: false });
    // gold moulding round the opening, and a broad arch moulding higher up
    const trim = (rx, ry, y0, r, col) => {
      const pts = [new THREE.Vector3(-rx, STAGE_H, 0), new THREE.Vector3(-rx, y0, 0)];
      for (let k = 1; k <= 30; k++) { const t = k / 30 * Math.PI; pts.push(new THREE.Vector3(-rx * Math.cos(t), y0 + ry * Math.sin(t), 0)); }
      pts.push(new THREE.Vector3(rx, STAGE_H, 0));
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 90, r, 6), toonMat({ color: col }));
      m.position.z = z + 0.27; I.extras.add(m);
    };
    trim(ow + 0.1, rise + 0.1, sideTop, 0.09, GOLD);
    trim(ow + 0.6, rise + 0.5, sideTop, 0.06, '#e8d6b0');
    trim(HW - 1.4, 3.0, 8.2, 0.12, '#e8d6b0');
    for (const sx of [-1, 1]) { b.box(0.7, sideTop - STAGE_H, 0.3, CREAM, sx * (ow + 0.45), STAGE_H, z + 0.3); b.box(0.9, 0.4, 0.4, GOLD, sx * (ow + 0.45), sideTop - 0.3, z + 0.32, { ao: false }); }
  }
  // inside the alcove: cream panelled walls with pilasters, a soft vaulted ceiling
  b.box(13, 8, 0.2, CREAM, 0, STAGE_H, -HD + 0.15);
  for (const x of [-5.4, -2.7, 0, 2.7, 5.4]) { b.box(0.5, 5.6, 0.2, IVORY, x, STAGE_H, -HD + 0.3); b.box(0.6, 0.3, 0.3, GOLD, x, STAGE_H + 5.6, -HD + 0.3, { ao: false }); }
  for (const x of [-4.05, -1.35, 1.35, 4.05]) b.box(2.0, 3.4, 0.05, '#f6ecd6', x, STAGE_H + 1.2, -HD + 0.27, { ao: false });
  for (const sx of [-1, 1]) b.box(0.2, 8, HD + STAGE_FRONT, CREAM, sx * 6.7, STAGE_H, (-HD + STAGE_FRONT) / 2);
  b.box(13.6, 0.3, HD + STAGE_FRONT, '#f2e6cc', 0, 8.6, (-HD + STAGE_FRONT) / 2);
  const stageLight = new THREE.PointLight('#fff2dc', 34, 16, 1.3);
  stageLight.position.set(0, 7, -9); I.group.add(stageLight);
  const hallLight = new THREE.PointLight('#ffe8c8', 22, 30, 1.3);
  hallLight.position.set(0, 9, 3); I.group.add(hallLight);

  // ── a grand piano, centre stage, and a pianist playing ──
  const piano = grandPiano();
  piano.position.set(0.3, STAGE_H, -8.0); piano.rotation.y = -0.35; I.extras.add(piano);
  const pianist = makePerson({ skin: '#f1cfb6', hair: '#141012', hairStyle: 'bun', top: '#141214', dress: true, seated: true });
  pianist.position.set(0.3 + Math.sin(-0.35) * 0.82, STAGE_H + 0.06, -8.0 + Math.cos(-0.35) * 0.82); pianist.rotation.y = Math.PI - 0.35;
  I.extras.add(pianist);

  // ── the main floor: three blocks of red seats with aisles between ──
  for (let row = 0; row < 13; row++) {
    const z = -3.9 + row * 0.95;
    for (const [x0, x1] of [[-7.6, -3.4], [-1.8, 1.8], [3.4, 7.6]]) {
      for (let x = x0 + 0.25; x < x1; x += 0.54) {
        b.box(0.48, 0.42, 0.46, RED, x, 0, z);
        b.box(0.48, 0.6, 0.1, RED_D, x, 0.38, z + 0.24);
      }
      I.box((x0 + x1) / 2, z + 0.05, x1 - x0, 0.7, 1);
    }
  }
  const SK = ['#f4d8c6', '#f1cfb6', '#dcae86', '#b07a54', '#9a6646'], HAIR = ['#141012', '#2a1d18', '#6b4a32', '#8a6a4a', '#1e1614'];
  const audience = [];
  for (const [x, row, s] of [[-0.97, 2, '#2b3d6b'], [4.73, 4, '#8a1e2e'], [-5.69, 6, '#1c1a20'], [0.65, 7, '#3f6a4a'], [-4.07, 9, '#e8c26b'], [6.35, 3, '#5b3a7a'], [-1.51, 11, '#c87a8a']]) {
    const p = makePerson({ skin: SK[row % 5], hair: HAIR[row % 5], hairStyle: ['bun', 'short', 'long'][row % 3], top: s, seated: true });
    p.position.set(x, 0.05, -3.9 + row * 0.95 + 0.05); p.rotation.y = Math.PI; I.extras.add(p); audience.push(p);
  }

  // ── four curving tiers: ivory fronts with gold bands, lights beneath, red seats rising behind ──
  [[3.0, 8.6, 7.6], [5.2, 9.0, 8.0], [7.4, 9.4, 8.4], [9.6, 9.8, 8.8]].forEach(([y, a, bz], ti) => {
    const pts = horseshoe(a, Math.min(bz, HD - 3.4 - 0.4), STAGE_FRONT + 0.4, 3.0);
    for (let k = 0; k < pts.length - 1; k++) {
      const [x1, z1] = pts[k], [x2, z2] = pts[k + 1];
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
      const nx = -dz / len, nz = dx / len, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
      const seg = (w, h, off, yy, col, o = {}) => b.box(w, h, len + 0.04, col, mx + nx * off, yy, mz + nz * off, { ry, ...o });
      seg(4.2, 0.3, 2.1, y - 0.3, IVORY);                                   // tier floor
      seg(0.16, 0.9, 0, y, IVORY);                                          // front parapet
      seg(0.2, 0.07, -0.02, y + 0.82, GOLD, { ao: false });
      seg(0.2, 0.05, -0.02, y + 0.35, GOLD, { ao: false });
      seg(0.18, 0.12, 0.02, y - 0.42, '#e8dcc4', { ao: false });
      for (let r = 0; r < 3; r++) {                                         // rows of red seats stepping up
        seg(0.5, 0.45 + r * 0.25, 0.55 + r * 0.75, y, RED);
        seg(0.12, 0.5, 0.82 + r * 0.75, y + 0.35 + r * 0.25, RED_D);
      }
      if (k % 2 === 0) b.sphere(0.065, '#fff2c8', mx - nx * 0.06, y - 0.5, mz - nz * 0.06, { layer: 'glow', ao: false, ws: 6, hs: 4 });
      if (k % 3 === 0) b.sphere(0.05, '#fff2c8', mx + nx * 1.6, y - 0.36, mz + nz * 1.6, { layer: 'glow', ao: false, ws: 5, hs: 4 });
    }
    // brass rails down the aisles of the top tier, like the photo
    if (ti === 3) for (const sx of [-1, 1]) b.cyl(0.03, 0.03, 1.0, 4, GOLD, sx * 0.4, y, HD - 2.2, { ao: false });
  });

  // ── the ceiling: a great oval, ringed with lights ──
  b.box(HW * 2, 0.5, HD * 2, '#efe4cc', 0, CEIL - 0.5, 0);
  const ringOf = (rx, rz, y, tube, col, glow) => { const t = new THREE.Mesh(new THREE.TorusGeometry(1, tube, 6, 70), glow ? new THREE.MeshBasicMaterial({ color: col }) : toonMat({ color: col })); t.rotation.x = Math.PI / 2; t.scale.set(rx, rz, 1); t.position.set(0, y, 2.5); I.extras.add(t); };
  ringOf(6.6, 7.4, CEIL - 0.52, 0.12, GOLD);
  ringOf(5.0, 5.6, CEIL - 0.55, 0.07, '#e8d6b0');
  ringOf(4.2, 4.7, CEIL - 0.56, 0.06, '#fff6dc', true);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 50).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fbf3e2' }));
  disc.scale.set(4.1, 1, 4.6); disc.position.set(0, CEIL - 0.58, 2.5); I.extras.add(disc);
  for (let k = 0; k < 56; k++) { const a = k / 56 * Math.PI * 2; b.sphere(0.1, '#fff2c8', Math.cos(a) * 5.8, CEIL - 0.68, 2.5 + Math.sin(a) * 6.5, { layer: 'glow', ao: false, ws: 6, hs: 4 }); }

  I.updaters.push((t) => {
    const k = U.sway.value ? 1 : 0.25;
    animatePerson(pianist, t * k, 'keys', 0);
    pianist.userData.body.rotation.z = Math.sin(t * k * 1.3) * 0.06;
    audience.forEach((p, j) => animatePerson(p, t * k * 0.3, 'chat', j));
  });

  // ── the doors at the back ──
  b.box(2.4, 3, 0.1, CREAM, 0, 0, HD - 0.06);
  b.box(2.6, 0.15, 0.14, GOLD, 0, 3, HD - 0.08, { ao: false });
  I.landing = { x: 0, z: HD - 2.2 };
  const exit = I.spot('carnegieExit', 0, HD - 1.2, { label: 'the doors', glowY: 2.2, reach: 2 });
  exit.prompt = { title: 'Back to 57th Street', sub: 'to step outside' };
  exit.exit = true;
  I.exitTo = { island: 'nyc', x: 19.8, z: 0.4, heading: 0 };
  return I.finalize(scene);
}

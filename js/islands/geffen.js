// Inside David Geffen Hall at Lincoln Center, after the photo: a warm beech-wood
// hall wrapped round a forward stage, the orchestra mid-concert, rows of seats
// in front, wavy wooden balcony fronts along the sides, terraced seats behind
// the stage, and a dark acoustic canopy hung with lights and speaker clusters.
import * as THREE from 'three';
import { Island } from '../island.js';
import { U, toonMat } from '../kit.js';
import { makePerson, animatePerson, buildOrchestra } from '../people.js';

const HW = 12, HD = 13, CEIL = 11, STAGE_H = 0.8;
const BEECH = '#ddb27c', BEECH_D = '#b9875a', SEAT = '#8a4a34', SEAT_D = '#5e3224', CANOPY = '#2a2628';

class Hall extends Island {
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

export function buildGeffen(scene) {
  const I = new Hall({ id: 'geffen', center: [0, 260, 1200], R: HD, seed: 1962 });
  I.interior = true;
  I.ceilingY = CEIL;
  I.camDist = 10;
  I.camPitch = 0.3;
  const b = I.b, gp = I.gp;

  // ── pale wood floor, aisles ──
  gp.base(['#c9965e', '#c28f58', '#cf9c64'], 1400);
  gp.rect(0, 6, 1.8, 13, '#b07a48');
  for (const sx of [-1, 1]) gp.rect(sx * 10.6, 2, 2.0, 22, '#b07a48');

  // ── the beech shell, slatted walls, a soft blue glow high on the back wall ──
  const shell = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, CEIL, HD * 2), toonMat({ color: BEECH, side: THREE.BackSide }));
  shell.position.y = CEIL / 2 - 0.02; I.extras.add(shell);
  I.box(0, -HD - 0.4, HW * 2 + 2, 0.6, CEIL); I.box(0, HD + 0.4, HW * 2 + 2, 0.6, CEIL);
  I.box(-HW - 0.4, 0, 0.6, HD * 2 + 2, CEIL); I.box(HW + 0.4, 0, 0.6, HD * 2 + 2, CEIL);
  for (let x = -HW + 0.3; x < HW; x += 0.35) b.box(0.12, CEIL - 3.6, 0.12, BEECH_D, x, 3.4, -HD + 0.08, { ao: false });
  for (const sx of [-1, 1]) for (let y = 0.6; y < CEIL - 1; y += 0.5) b.box(0.08, 0.14, HD * 2 - 1, (y * 2) % 2 ? BEECH_D : '#e8c290', sx * (HW - 0.05), y, 0, { ao: false });
  b.box(7, 2.6, 0.06, '#7fa8e8', -6, 7.6, -HD + 0.14, { layer: 'glow', ao: false });

  // ── the stage, pushed forward into the hall ──
  b.box(14, STAGE_H, 7.6, '#e6be88', 0, 0, -4.6);
  b.box(14.2, 0.06, 7.8, '#c89a64', 0, STAGE_H, -4.6, { ao: false });
  b.box(14, STAGE_H, 0.1, '#3a2a20', 0, 0, -0.8);
  I.box(0, -4.6, 14.2, 7.8, STAGE_H + 0.3);
  const tick = buildOrchestra(b, I.extras, { x: 0, z: -1.5, y: STAGE_H, maxX: 6.2, minZ: -8.0 });

  // ── terraced seats behind the stage ──
  const people = [];
  const SK = ['#f4d8c6', '#f1cfb6', '#dcae86', '#b07a54', '#9a6646'];
  const sitter = (x, y, z, ry) => { const i = people.length; const p = makePerson({ skin: SK[i % 5], hair: ['#141012', '#2a1d18', '#8a6a4a'][i % 3], hairStyle: ['bun', 'short', 'long', 'wavyShort'][i % 4], top: ['#2b3d6b', '#8a1e2e', '#1c1a20', '#3f6a4a', '#e8c26b', '#5b3a7a'][i % 6], seated: true }); p.position.set(x, y, z); p.rotation.y = ry; I.extras.add(p); people.push(p); };
  for (let r = 0; r < 4; r++) {
    const z = -9.0 - r * 0.9, y = 1.2 + r * 0.5;
    b.box(HW * 2 - 2, y, 0.9, BEECH_D, 0, 0, z);
    b.box(HW * 2 - 2.4, 0.06, 0.06, '#f0d4a4', 0, y + 0.92, z + 0.42, { ao: false });
    for (let x = -10; x <= 10; x += 0.6) { b.box(0.5, 0.4, 0.45, SEAT, x, y, z); b.box(0.5, 0.5, 0.1, SEAT_D, x, y + 0.4, z - 0.22); }
    for (const x of [-7.2, -2.4, 3.6, 8.4]) if ((r + Math.round(x)) % 2 === 0) sitter(x + r * 0.6, y + 0.05, z, 0);
  }
  I.box(0, -10.4, HW * 2, 3.6, 3);

  // ── the main floor: two blocks of seats with a centre aisle ──
  for (let row = 0; row < 11; row++) {
    const z = 0.6 + row * 0.95;
    for (const sx of [-1, 1]) {
      for (let x = 1.15; x < 9.5 - Math.max(0, 3 - row) * 0.6; x += 0.56) { b.box(0.5, 0.42, 0.46, SEAT, sx * x, 0, z); b.box(0.5, 0.6, 0.1, SEAT_D, sx * x, 0.38, z + 0.24); }
      I.box(sx * 5.3, z + 0.05, 8.5, 0.7, 1);
    }
  }
  [[-2.27, 1], [3.39, 2], [-5.07, 4], [1.71, 5], [-1.15, 7], [6.75, 3], [-7.3, 8], [4.5, 9]].forEach(([x, row], i) => sitter(x, 0.05, 0.6 + row * 0.95 + 0.05, Math.PI));

  // ── wavy wooden balcony fronts along the sides, two levels ──
  for (const [y, base] of [[3.0, 9.2], [5.4, 9.6], [7.8, 10.0]]) {
    for (const sx of [-1, 1]) {
      let prev = null;
      for (let z = -11; z <= 11; z += 0.5) {
        const x = sx * (base + Math.sin(z * 0.55 + y) * 0.35);
        if (prev) {
          const [px, pz] = prev, len = Math.hypot(x - px, z - pz), ry = Math.atan2(x - px, z - pz);
          b.box(0.16, 1.0, len + 0.03, '#e8c290', (x + px) / 2, y, (z + pz) / 2, { ry });
          b.box(0.18, 0.05, len + 0.03, '#f6dcae', (x + px) / 2, y + 1.0, (z + pz) / 2, { ry, ao: false });
        }
        prev = [x, z];
      }
      b.box(HW - base + 0.5, 0.3, 22.5, BEECH_D, sx * (base + (HW - base) / 2), y - 0.3, 0);
      for (let z = -10.5; z <= 10.5; z += 0.6) b.box(0.4, 0.5, 0.45, SEAT, sx * (base + 0.9), y, z);
      for (let z = -10.5; z <= 10.5; z += 1.5) b.sphere(0.05, '#fff2c8', sx * (base - 0.2), y - 0.35, z, { layer: 'glow', ao: false, ws: 5, hs: 4 });
      for (const z of [-6.2, 1.4, 7.6]) sitter(sx * (base + 0.9), y + 0.05, z + (y > 4 ? 1 : 0), -sx * Math.PI / 2);
    }
  }

  // ── the dark acoustic canopy, hung with lights and two speaker clusters ──
  for (let x = -9; x <= 9; x += 1.5) b.box(0.08, 0.12, 20, CANOPY, x, 9.3, -1, { ao: false });
  for (let z = -11; z <= 9; z += 1.5) b.box(18, 0.12, 0.08, CANOPY, 0, 9.3, z, { ao: false });
  for (let x = -8; x <= 8; x += 1.6) for (let z = -9; z <= 7; z += 2) { b.cyl(0.008, 0.008, 0.9 + ((x + z) % 3) * 0.3, 3, '#3a3638', x, 8.4 - ((x + z) % 3) * 0.3, z, { ao: false }); b.sphere(0.08, '#fff4d8', x, 8.35 - ((x + z) % 3) * 0.3, z, { layer: 'glow', ao: false, ws: 6, hs: 4 }); }
  for (const sx of [-1, 1]) { b.box(0.9, 2.2, 0.9, '#1c1a1e', sx * 3.4, 6.4, -1.2); b.cyl(0.02, 0.02, 0.9, 3, '#3a3638', sx * 3.4, 8.6, -1.2, { ao: false }); }
  const stageLight = new THREE.PointLight('#fff0d8', 30, 18, 1.3);
  stageLight.position.set(0, 7.5, -4.5); I.group.add(stageLight);
  const hallLight = new THREE.PointLight('#ffe0b8', 18, 28, 1.3);
  hallLight.position.set(0, 8, 5); I.group.add(hallLight);

  I.updaters.push((t) => {
    const k = U.sway.value ? 1 : 0.25;
    tick(t * k);
    people.forEach((p, j) => animatePerson(p, t * k * 0.3, 'chat', j));
  });

  // ── the doors at the back ──
  b.box(2.4, 2.8, 0.1, '#7a5034', 0, 0, HD - 0.06);
  I.landing = { x: 0, z: HD - 1.8 };
  const exit = I.spot('geffenExit', 0, HD - 1.0, { label: 'the doors', glowY: 2.1, reach: 1.9 });
  exit.prompt = { title: 'Back to the plaza', sub: 'to step outside' };
  exit.exit = true;
  I.exitTo = { island: 'nyc', x: -9.7, z: 13.83, heading: Math.PI / 2 };
  return I.finalize(scene);
}

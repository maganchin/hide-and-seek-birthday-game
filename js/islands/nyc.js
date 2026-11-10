// New York City: brownstones, a park, the Statue of Liberty, Lincoln Center and Carnegie Hall
import * as THREE from 'three';
import { Island } from '../island.js';
import { P, U, textPlane, waterMat, toonMat } from '../kit.js';

export function buildNYC(scene) {
  const I = new Island({ id: 'nyc', center: [-74, 8, -2], R: 32, seed: 1201, depth: 30 });
  const b = I.b, gp = I.gp, r = b.r;

  // ── ground painting ──
  gp.base(['#6fa356', '#7cb062', '#5f9449', '#86b96a', '#6a9c50']);
  gp.rect(0, 2, 62, 4.2, '#c9bdb0');                // avenue sidewalks
  gp.rect(0, 2, 62, 3, '#6d6774', { tiles: null });  // avenue asphalt
  for (let x = -28; x < 28; x += 2.4) gp.rect(x, 2, 1.1, 0.12, '#efe6c8');
  gp.rect(4, -2, 4.2, 18, '#c9bdb0');
  gp.rect(4, 10, 4.2, 22, '#c9bdb0');
  gp.rect(4, 8, 3, 24, '#6d6774');
  for (let z = -1; z < 20; z += 2.4) gp.rect(4, z, 0.12, 1.1, '#efe6c8');
  for (let i = 0; i < 6; i++) gp.rect(4 + (i - 2.5) * 0.5, 4.6, 0.3, 1.4, '#f4efe2');  // crosswalk
  gp.rect(-8, -3.5, 26, 6.5, '#b9ada2', { tiles: '#8d8379', step: 1 }); // brownstone frontage
  gp.dabs(14, 13, 8, ['#8cc46e', '#7ab85f', '#9ccf7c'], 260, 0.4);   // park lawn
  gp.path([[6.5, 7], [10, 9], [14, 8.5], [19, 11], [19, 16], [14, 19], [9, 17], [8, 12], [10, 9]], 1.3, '#e3d2b2', '#b9a07f');
  gp.circle(14, 13, 2.8, '#ddd0bb', '#b8a68c');
  gp.circle(-21.5, 16, 3.9, '#d8ccb7', '#b0a089');
  gp.path([[-21, 12.2], [-18.5, 7], [-14, 4.5]], 1.4, '#d8ccb7', '#b0a089');
  gp.rect(-13, 6.4, 6, 3, '#c9bdb0');

  // ── skyline (behind the brownstones) ──
  // Empire State Building
  {
    const x = -8, z = -14, c = '#d7cab3';
    b.box(5.4, 12, 5.4, c, x, 0, z); P.windows(b, x, z, 5.4, 5.4, 0.6, 12, 11, 5, { lit: 0.55, ww: 0.35, wh: 0.5 });
    b.box(4.2, 4, 4.2, c, x, 12, z); P.windows(b, x, z, 4.2, 4.2, 12.2, 16, 4, 4, { lit: 0.6, ww: 0.3, wh: 0.45 });
    b.box(3, 3, 3, c, x, 16, z); P.windows(b, x, z, 3, 3, 16.2, 19, 3, 3, { lit: 0.7, ww: 0.28, wh: 0.4 });
    b.box(2, 2, 2, '#e3d8c5', x, 19, z);
    b.cyl(0.8, 1, 1.6, 8, '#e8dfcf', x, 21, z);
    b.cyl(0.5, 0.7, 1.2, 8, '#f1ead9', x, 22.6, z);
    b.cone(0.3, 3.2, 6, '#e9e2d6', x, 23.8, z);
    b.sphere(0.18, '#ff8e8e', x, 27.1, z, { layer: 'glow', ao: false });
    I.box(x, z, 5.4, 5.4, 20);
  }
  // Chrysler Building
  {
    const x = 11, z = -14, c = '#d9dbe2';
    b.box(4.2, 12, 4.2, c, x, 0, z); P.windows(b, x, z, 4.2, 4.2, 0.6, 12, 11, 4, { lit: 0.55, ww: 0.32, wh: 0.5 });
    b.box(3.2, 3, 3.2, c, x, 12, z); P.windows(b, x, z, 3.2, 3.2, 12.2, 15, 3, 3, { lit: 0.6, ww: 0.3, wh: 0.45 });
    for (let k = 0; k < 5; k++) {
      const s = 1.5 - k * 0.27, y = 15 + k * 1.05;
      b.cyl(s * 0.75, s, 1.05, 4, '#c8ccd6', x, y, z, { ry: Math.PI / 4 });
      for (let f = 0; f < 4; f++) {          // sunburst arches
        const a = f * Math.PI / 2;
        b.add(new THREE.CircleGeometry(s * 0.55, 10, 0, Math.PI), '#ffe0a0', x + Math.sin(a) * s * 0.72, y + 0.25, z + Math.cos(a) * s * 0.72, { ry: a, layer: 'glow', ao: false, jitter: 0 });
      }
    }
    b.cone(0.22, 4, 6, '#eef0f4', x, 20.2, z);
    I.box(x, z, 4.2, 4.2, 18);
  }
  // supporting cast of towers
  const towers = [[-19, -10, 3.6, 3.6, 10, '#b9b0c4'], [1.5, -18, 4, 3.6, 14, '#c2b6a6'], [-1.5, -12, 3.2, 3, 8, '#cdbba4'], [-16, -18, 3, 3, 7.5, '#bfa79a'], [16, -15, 2.8, 2.8, 8, '#b6aac0']];
  for (const [x, z, w, d, h, c] of towers) {
    b.box(w, h, d, c, x, 0, z);
    b.box(w + 0.2, 0.3, d + 0.2, '#e6dccb', x, h, z);
    b.box(w * 0.4, 1, d * 0.4, '#8f8a96', x, h + 0.3, z);
    P.windows(b, x, z, w, d, 0.6, h - 0.3, Math.floor(h / 1.1), Math.max(2, Math.floor(w / 0.9)), { lit: 0.5, ww: 0.32, wh: 0.5 });
    I.box(x, z, w, d, h);
  }

  // ── brownstone row ──
  const browns = ['#8e5440', '#7d4a3a', '#9b5f45', '#86503e', '#a0664b'];
  for (let i = 0; i < 5; i++) {
    const x = -16 + i * 4, z = -3.5, h = 5.2 + (i % 2) * 0.9, c = browns[i];
    b.box(3.9, h, 5, c, x, 0, z);
    b.box(4.05, 0.35, 5.15, '#d9c6a6', x, h, z);              // cornice
    b.box(4.05, 0.15, 5.15, '#3d2a24', x, h + 0.35, z);
    P.windows(b, x, z, 3.9, 5, 1.6, h - 0.4, 2, 3, { faces: 's', lit: 0.75, ww: 0.55, wh: 0.9 });
    for (let k = 0; k < 3; k++) b.box(0.8, 0.12, 0.08, '#d9c6a6', x - 1.2 + k * 1.2, 1.5 + 2.1, z + 2.52, { ao: false });
    // stoop + door
    b.box(0.9, 1.6, 0.12, '#3b2b2b', x + 1.1, 0.9, z + 2.52);
    b.sphere(0.12, '#ffdb8f', x + 1.1, 2.75, z + 2.58, { layer: 'glow', ao: false });
    for (let s = 0; s < 4; s++) b.box(1.1, 0.25, 0.4, '#a0705a', x + 1.1, s * 0.22, z + 2.5 + 1.4 - s * 0.38);
    for (const sx of [-0.6, 0.6]) b.box(0.05, 0.9, 1.6, '#24201f', x + 1.1 + sx, 0.3, z + 3.3, { rx: -0.45 });
    // window box flowers
    P.flowers(b, x - 0.8, z + 2.7, 0.3, 6, ['#ff8fa3', '#ffd36e', '#f5f0ff'], { y: 1.45 });
    I.box(x, z, 3.9, 5, h);
    I.box(x + 1.1, z + 3.4, 1.1, 1.6, 1);
  }
  const stoop = I.spot('stoop', -10.9, 1.2, { label: 'the brownstone stoop', glowX: -10.9, glowZ: 0.3, glowY: 1.6 });

  // ── corner building with a rooftop gathering ──
  {
    const x = 10.5, z = -3, w = 6, d = 5, h = 3.4;
    b.box(w, h, d, '#b5765a', x, 0, z);
    P.windows(b, x, z, w, d, 0.4, h - 0.3, 1, 4, { faces: 'se', lit: 0.8, ww: 0.9, wh: 1.4 });
    b.box(w + 0.2, 0.5, 0.15, '#d9c6a6', x, h, z + d / 2);
    b.box(w + 0.2, 0.5, 0.15, '#d9c6a6', x, h, z - d / 2);
    b.box(0.15, 0.5, d, '#d9c6a6', x + w / 2, h, z);
    b.box(0.15, 0.5, d, '#d9c6a6', x - w / 2, h, z);
    // awning
    b.box(w * 0.8, 0.12, 1, '#2f6b55', x, 2.2, z + d / 2 + 0.5, { rx: 0.25 });
    // exterior stairs along the west wall
    for (let s = 0; s < 10; s++) b.box(1, 0.2, 0.45, '#5b4a46', x - w / 2 - 0.6, s * 0.34, z + d / 2 - 0.3 - s * 0.45);
    b.box(0.06, 0.9, 4.6, '#2a2524', x - w / 2 - 1.1, 1.8, z + 0.3, { rx: 0.65 });
    // the party: string lights, table, tiny cake, chairs, plants
    for (let k = 0; k < 14; k++) {
      const t = k / 13;
      b.sphere(0.07, ['#ffe39a', '#ffc6a3', '#fff2c8'][k % 3], x - w / 2 + 0.3 + t * (w - 0.6), h + 1.9 - Math.sin(t * Math.PI) * 0.45, z - 1, { layer: 'glow', ao: false, ws: 6, hs: 4 });
      b.sphere(0.07, ['#ffe39a', '#ffc6a3', '#fff2c8'][k % 3], x - w / 2 + 0.3 + t * (w - 0.6), h + 1.9 - Math.sin(t * Math.PI) * 0.45, z + 1.2, { layer: 'glow', ao: false, ws: 6, hs: 4 });
    }
    for (const [px, pz] of [[-2.8, -2.3], [2.8, -2.3], [-2.8, 2.3], [2.8, 2.3]]) b.cyl(0.04, 0.04, 2, 4, '#3a3030', x + px, h, z + pz);
    b.cyl(0.8, 0.8, 0.08, 14, '#efe6d6', x + 0.5, h + 0.75, z);
    b.cyl(0.08, 0.1, 0.75, 6, '#3a3030', x + 0.5, h, z);
    b.cyl(0.25, 0.25, 0.2, 12, '#fbe8ef', x + 0.5, h + 0.83, z);
    b.cyl(0.18, 0.18, 0.15, 12, '#f6c2d2', x + 0.5, h + 1.03, z);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; b.box(0.4, 0.45, 0.4, '#c98b5a', x + 0.5 + Math.cos(a) * 1.15, h, z + Math.sin(a) * 1.15); }
    for (const [px, pz] of [[-2.2, -1.8], [2.3, 1.8]]) { b.cyl(0.3, 0.22, 0.45, 8, '#c76f4f', x + px, h, z + pz); b.ico(0.45, '#5e9a4a', x + px, h + 0.75, z + pz, { layer: 'sway', sway: 0.05, swayBase: h }); }
    I.box(x, z, w, d, h + 1);
    I.box(x - w / 2 - 0.6, z + 0.3, 1.1, 4.6, 2);
  }
  const rooftop = I.spot('rooftop', 6.9, 1.1, { label: 'the rooftop gathering', glowX: 11, glowZ: -3, glowY: 4.6, reach: 3 });

  // ── street furniture ──
  // the mailbox
  {
    const x = 1.6, z = 4.8;
    b.box(0.75, 1.05, 0.6, '#2c5aa0', x, 0.3, z);
    b.cyl(0.3, 0.3, 0.75, 12, '#2c5aa0', x, 1.35, z, { rz: Math.PI / 2, center: true });
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.22, 0.22]) b.box(0.08, 0.3, 0.08, '#1f3f72', x + sx, 0, z + sz);
    b.box(0.5, 0.06, 0.02, '#e8e2d2', x, 1.25, z + 0.31, { ao: false });
    I.circle(x, z, 0.5, 1.6);
  }
  const mailbox = I.spot('mailbox', 1.6, 6.1, { label: 'a glowing mailbox', glowX: 1.6, glowZ: 4.8, glowY: 1.9 });

  // newsstand
  {
    const x = -13, z = 6.6;
    b.box(3.2, 2.2, 1.8, '#2f6b55', x, 0, z);
    b.box(3.6, 0.15, 2.4, '#255645', x, 2.2, z, { rx: 0.08 });
    for (let k = 0; k < 9; k++) b.box(0.28, 0.38, 0.03, ['#e86b5b', '#f2c14e', '#5aa0d8', '#f4ede0', '#9b6fd0'][k % 5], x - 1.3 + (k % 5) * 0.62, 0.8 + Math.floor(k / 5) * 0.5, z + 0.92, { ao: false });
    I.box(x, z, 3.2, 1.8, 2.4);
  }
  I.spot('newsstand', -13, 8.4, { label: 'the corner newsstand', glowZ: 7.4, glowY: 1.6 });

  // taxis
  for (const [x, z, ry] of [[-3, 2.8, 0], [-19, 1.1, Math.PI], [4.2, 15.5, Math.PI / 2]]) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    b.box(2.6, 0.6, 1.15, '#f2bf2b', 0, 0.28, 0, { matrix: m });
    b.box(1.4, 0.45, 1.05, '#f2bf2b', -0.1, 0.88, 0, { matrix: m });
    b.box(1.3, 0.35, 1.08, '#7da2c4', -0.1, 0.92, 0, { matrix: m, ao: false });
    b.box(0.45, 0.15, 0.25, '#fff6d8', -0.1, 1.33, 0, { matrix: m, layer: 'glow', ao: false });
    for (const wx of [-0.85, 0.85]) for (const wz of [-0.55, 0.55]) b.cyl(0.26, 0.26, 0.18, 10, '#2a2627', wx, 0.26, wz, { matrix: m, rx: Math.PI / 2, center: true });
    b.box(0.08, 0.15, 0.3, '#fff2b0', 1.31, 0.4, 0.38, { matrix: m, layer: 'glow' });
    b.box(0.08, 0.15, 0.3, '#fff2b0', 1.31, 0.4, -0.38, { matrix: m, layer: 'glow' });
    const c = Math.abs(Math.cos(ry));
    I.box(x, z, c ? 2.6 : 1.15, c ? 1.15 : 2.6, 1.2);
  }

  // street lamps & trees
  for (const x of [-21, -13, -6, 8, 15, 21]) { P.lamp(b, x, 4.5); I.circle(x, 4.5, 0.2, 1); }
  for (const x of [-18, -10, -2]) { P.tree(b, x, 5.6, { h: 2, s: 0.75 }); I.circle(x, 5.6, 0.3, 1.5); }

  // ── the park ──
  const parkOk = (x, z) => Math.hypot(x - 14, z - 13) > 3.3;
  const parkTrees = [[8.5, 19], [20, 8], [21.5, 15], [16, 21], [10.5, 14.5], [18, 18.5], [7.2, 10], [12, 7.4], [22, 11.5]];
  for (const [x, z] of parkTrees) {
    if (!I.insideRim(x, z, 2)) continue;
    P.tree(b, x, z, { h: 2 + r(), s: 0.9 + r() * 0.3, leaf: ['#5f9a4a', '#73ad54', '#e2a35a', '#d77e4e'][Math.floor(r() * 4)] });
    I.circle(x, z, 0.35, 1.8);
  }
  P.flowers(b, 14, 13, 7.5, 140, ['#ffd1dc', '#ffe58f', '#ffffff', '#c3a6ff', '#ff9e7a'], { ok: (x, z) => parkOk(x, z) && I.insideRim(x, z, 1.5) && !(Math.abs(x - 4) < 2.6) });
  P.grassTufts(b, 0, 0, 27, 160, '#5f9a45', { ok: (x, z) => I.insideRim(x, z, 1) && (z > 4.5 || z < -20) && !(Math.abs(x - 4) < 2.4) && parkOk(x, z) && Math.hypot(x + 19, z - 15) > 4.6 });
  // fountain
  {
    const x = 14, z = 13;
    b.cyl(2.3, 2.4, 0.55, 20, '#cdbfa6', x, 0, z);
    b.cyl(0.35, 0.5, 1.4, 10, '#d8cbb3', x, 0.5, z);
    b.cyl(0.9, 0.5, 0.25, 14, '#d8cbb3', x, 1.8, z);
    b.cyl(0.18, 0.25, 0.8, 8, '#d8cbb3', x, 2, z);
    b.sphere(0.25, '#d8cbb3', x, 2.95, z);
    const w = new THREE.Mesh(new THREE.CircleGeometry(2.05, 28).rotateX(-Math.PI / 2), waterMat);
    w.position.set(x, 0.5, z);
    I.extras.add(w);
    I.circle(x, z, 2.4, 1);
  }
  I.spot('fountain', 14, 16, { label: 'the park fountain', glowZ: 13, glowY: 3.4 });
  // benches
  P.bench(b, 12.5, 18.3, Math.PI + 0.2);
  P.bench(b, 18.5, 9.2, -0.6 + Math.PI);
  P.bench(b, 9.5, 10, 2.3);
  I.box(12.5, 18.4, 1.7, 0.6, 1); I.circle(18.5, 9.2, 0.8, 1); I.circle(9.5, 10, 0.8, 1);
  const parkBench = I.spot('parkBench', 12.6, 16.9, { label: 'a park bench', glowX: 12.5, glowZ: 18.3, glowY: 1.4 });
  for (const [x, z] of [[9.5, 16], [17, 10.5]]) { P.lamp(b, x, z, { h: 2.2 }); I.circle(x, z, 0.2, 1); }
  // hot-dog cart
  {
    const x = 7.4, z = 5.6;
    b.box(1.5, 0.9, 0.8, '#d9d4cc', x, 0.3, z);
    for (const sx of [-0.55, 0.55]) b.cyl(0.25, 0.25, 0.1, 10, '#333', x + sx, 0.25, z + 0.42, { rx: Math.PI / 2, center: true });
    b.cyl(0.03, 0.03, 1.5, 4, '#555', x, 1.2, z);
    b.cone(1.1, 0.5, 8, '#e45d4b', x, 2.6, z);
    b.cone(1.12, 0.48, 8, '#f7f1e4', x, 2.61, z, { ry: Math.PI / 8, sx: 0.6, sz: 0.6 });
    I.box(x, z, 1.5, 0.8, 1.2);
  }

  // ── Statue of Liberty on the promontory ──
  {
    const x = -21.5, z = 16, c = '#7fb9a5', stone = '#cdbb9d';
    b.box(4.4, 0.6, 4.4, stone, x, 0, z);
    b.box(3, 2.6, 3, '#d7c6a8', x, 0.6, z);
    b.box(3.4, 0.25, 3.4, stone, x, 3.2, z);
    b.box(2.2, 1, 2.2, '#d7c6a8', x, 3.45, z);
    b.cone(1.1, 4.2, 10, c, x, 4.45, z);
    b.cyl(0.45, 0.6, 1.2, 8, c, x, 7.2, z);
    b.sphere(0.45, c, x, 8.75, z);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI - Math.PI * 0.5; b.cone(0.07, 0.6, 4, c, x + Math.sin(a) * 0.4, 9.05, z + Math.cos(a) * 0.4, { rx: Math.cos(a) * 0.7, rz: -Math.sin(a) * 0.7 }); }
    b.cyl(0.13, 0.15, 2, 6, c, x + 0.45, 8.1, z, { rz: -0.2 });
    b.cyl(0.22, 0.12, 0.5, 8, '#c9a85a', x + 0.85, 10, z);
    b.cone(0.22, 0.6, 8, '#ffcc66', x + 0.85, 10.5, z, { layer: 'glow', ao: false });
    b.box(0.5, 0.75, 0.15, c, x - 0.55, 7, z + 0.25, { rz: 0.25 });
    I.box(x, z, 4.4, 4.4, 10);
  }

  // ── Lincoln Center: the raised travertine plaza, the Revson fountain, the Met's five
  //    full-height arches, and the colonnades of Koch Theater and David Geffen Hall ──
  {
    const cx = -6, TRAV = '#efe7d6', TRAV2 = '#e4dac6', PZ = 0.35;
    gp.rect(cx, 14.6, 10.4, 11.6, '#e9e1d0', { tiles: '#d2c7b3', step: 1.2 });
    gp.circle(cx, 14, 3.0, '#ddd3c0', '#c4b8a2');
    I.lift(cx, 14.6, 5.2, 5.8, PZ, { ramp: 0.8 });
    // the wide steps up from the street, with lit risers
    for (let k = 0; k < 3; k++) {
      b.box(10.4, 0.12 * (k + 1), 0.3, TRAV2, cx, 0, 8.95 + k * 0.3);
      b.box(10.2, 0.03, 0.02, '#fff2cc', cx, 0.12 * k + 0.05, 8.8 + k * 0.3, { layer: 'glow', ao: false });
    }
    // ── the Metropolitan Opera House ──
    const z0 = 20.2, W = 11, H = 8.4, bay = W / 5, ar = 0.9, spring = 6.0;
    b.box(W, H, 5.2, TRAV, cx, 0, z0 + 3.5);                        // the block behind the glass
    for (const sx of [-1, 1]) b.box(0.3, H, 0.8, TRAV, cx + sx * (W / 2 - 0.15), 0, z0 + 0.5);
    const face = new THREE.Shape();
    face.moveTo(-W / 2, 0); face.lineTo(W / 2, 0); face.lineTo(W / 2, H); face.lineTo(-W / 2, H); face.lineTo(-W / 2, 0);
    for (let k = 0; k < 5; k++) {
      const x = -W / 2 + bay * (k + 0.5), hole = new THREE.Path();
      hole.moveTo(x - ar, PZ); hole.lineTo(x + ar, PZ); hole.lineTo(x + ar, spring); hole.absarc(x, spring, ar, 0, Math.PI, false); hole.lineTo(x - ar, PZ);
      face.holes.push(hole);
    }
    b.add(new THREE.ExtrudeGeometry(face, { depth: 0.55, bevelEnabled: false, curveSegments: 14 }), TRAV, cx, 0, z0 + 0.15, { ry: Math.PI, ao: false });
    // warm glass behind the arches with a dark bronze mullion grid
    b.box(W - 0.4, H - 1.4, 0.06, '#ffd896', cx, PZ, z0 + 0.75, { layer: 'glow', ao: false });
    for (let k = 0; k < 5; k++) {
      const x = cx - W / 2 + bay * (k + 0.5);
      for (let y = PZ + 0.75; y < spring + ar; y += 0.75) b.box(ar * 2, 0.05, 0.05, '#3a3030', x, y, z0 + 0.7, { ao: false });
      for (const dx of [-0.6, -0.2, 0.2, 0.6]) b.box(0.05, spring + ar - PZ, 0.05, '#3a3030', x + dx, PZ, z0 + 0.7, { ao: false });
      if (k >= 1 && k <= 3) {   // starburst chandeliers inside
        b.sphere(0.14, '#fff6dc', x, 4.6, z0 + 1.2, { layer: 'glow', ao: false });
        for (let j = 0; j < 14; j++) { const a = j / 14 * Math.PI * 2; b.sphere(0.05, '#fff6dc', x + Math.cos(a) * 0.45, 4.6 + Math.sin(a) * 0.45, z0 + 1.2, { layer: 'glow', ao: false, ws: 5, hs: 4 }); }
      }
    }
    // the two Chagall-style murals hanging in the outer arches
    const mural = (base, accents) => textPlane(1.5, 3.4, (g, W2, H2) => {
      g.fillStyle = base; g.fillRect(0, 0, W2, H2);
      for (let i = 0; i < 34; i++) { g.fillStyle = accents[i % accents.length]; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(Math.random() * W2, Math.random() * H2, 5 + Math.random() * 18, 3 + Math.random() * 12, Math.random() * 3, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    }, { px: 140 });
    for (const [k, m] of [[0, mural('#d63a2a', ['#f2c14e', '#2a6ab8', '#3f8f5a', '#fff0d0'])], [4, mural('#e8c040', ['#d63a2a', '#2a6ab8', '#3f8f5a', '#7a3a8a'])]]) {
      m.position.set(cx - W / 2 + bay * (k + 0.5), 3.4, z0 + 0.68); m.rotation.y = Math.PI; I.extras.add(m);
    }
    I.box(cx, z0 + 2.95, W, 5.9, H);
    // David Geffen Hall (-x: on the right as you face the Met) and Koch Theater (+x): tall slender travertine columns over glowing glass
    const colonnade = (x0, faceX, sgn, beads, doorZ = null) => {
      b.box(3.2, 7.2, 9.6, TRAV2, x0, 0, 14.4);
      b.box(0.06, 6.4, 9.2, '#ffe2a8', faceX + sgn * 0.05, PZ, 14.4, { layer: 'glow', ao: false });
      for (let k = 0; k <= 8; k++) { const zc = 9.8 + k * 1.15; if (doorZ !== null && Math.abs(zc - doorZ) < 1.2) continue; b.box(0.26, 6.9, 0.26, TRAV, faceX + sgn * 0.5, 0, zc); }
      b.box(1.0, 0.4, 9.8, TRAV, faceX + sgn * 0.4, 6.9, 14.4);
      b.box(3.6, 0.3, 10, '#f6f0e4', x0 + sgn * 0.2, 7.2, 14.4);
      if (beads) for (let k = 0; k < 4; k++) for (let j = 0; j < 9; j++) b.sphere(0.07, '#ffe9a8', faceX - sgn * 0.3, 2.4 + j * 0.32, 11.2 + k * 2.1, { layer: 'glow', ao: false, ws: 5, hs: 4 });
      I.box(x0, 14.4, 3.2, 9.6, 7.2);
    };
    colonnade(cx - 6.8, cx - 5.2, 1, false, 13.83);
    colonnade(cx + 6.8, cx + 5.2, -1, true);
    // the Revson fountain: a dark granite basin with rings of jets rising and falling
    b.cyl(2.0, 2.1, 0.45, 30, '#3d4048', cx, PZ, 14);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.85, 30).rotateX(-Math.PI / 2), waterMat);
    water.position.set(cx, PZ + 0.38, 14); I.extras.add(water);
    const jetM = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.85 });
    const jets = [];
    for (const [d, n, hgt] of [[0, 1, 3.2], [0.55, 8, 2.2], [1.15, 14, 1.5], [1.6, 20, 0.9]]) for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2;
      const j = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.11, 1, 6).translate(0, 0.5, 0), jetM);
      j.position.set(cx + Math.cos(a) * d, PZ + 0.38, 14 + Math.sin(a) * d); j.userData.h = hgt;
      I.extras.add(j); jets.push(j);
    }
    I.updaters.push((t) => { const m = U.sway.value; jets.forEach((j, i) => { j.scale.y = j.userData.h * (0.8 + 0.2 * Math.sin(t * 1.4 + i * 0.4 * m)); }); });
    I.circle(cx, 14, 2.1, 1);
    // clear, glowing entrances: a gold-framed doorway, a sign over it and a pulsing ring on the ground
    const rings = [];
    const entrance = (x, z, ry, title, sub, out, sw = 2.2, signOff = 0.85) => {
      const along = Math.abs(ry) > 0.1;                                   // door in a wall facing ±x
      const bw = along ? 0.1 : 1.8, bd = along ? 1.8 : 0.1;
      b.box(bw, 2.5, bd, '#fff6dc', x, PZ, z, { layer: 'glow', ao: false });
      b.box(along ? 0.14 : 2.1, 0.16, along ? 2.1 : 0.14, '#d8b25a', x, PZ + 2.5, z, { ao: false });
      for (const k of [-1, 1]) b.box(along ? 0.14 : 0.12, 2.5, along ? 0.12 : 0.14, '#d8b25a', x + (along ? 0 : k * 0.96), PZ, z + (along ? k * 0.96 : 0), { ao: false });
      b.box(along ? 0.14 : 0.04, 2.3, along ? 0.04 : 0.14, '#c9a14f', x, PZ, z, { ao: false });    // the seam between the two doors
      const sign = textPlane(sw, sw * 0.28, (g, W, H) => {
        g.fillStyle = '#2a2224'; g.beginPath(); g.roundRect(3, 3, W - 6, H - 6, H * 0.2); g.fill();
        g.strokeStyle = '#d8b25a'; g.lineWidth = 5; g.stroke();
        g.fillStyle = '#f6dc9a'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `700 ${H * 0.34}px Fraunces, Georgia, serif`; g.fillText(title, W / 2, H * 0.38, W * 0.9);
        g.fillStyle = '#fff4dc'; g.font = `600 ${H * 0.24}px Fredoka, sans-serif`; g.fillText(sub, W / 2, H * 0.72, W * 0.9);
      }, { px: 160, glow: true });
      sign.position.set(x + (along ? out * signOff : 0), PZ + 3.1, z + (along ? 0 : out * signOff)); sign.rotation.y = along ? ry : Math.PI;
      I.extras.add(sign);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.8, depthWrite: false }));
      ring.position.set(x + (along ? out * 1.5 : 0), PZ + 0.03, z + (along ? 0 : out * 1.5)); I.extras.add(ring); rings.push(ring);
    };
    entrance(cx, z0 + 0.66, 0, 'THE MET OPERA', 'Enter the grand lobby →', -1, 3.0, 1.2);
    entrance(cx - 5.12, 13.83, Math.PI / 2, 'CONCERT HALL', 'David Geffen Hall · enter →', 1, 2.6);
    I.updaters.push((t) => rings.forEach((r, i) => { const k = 0.5 + 0.5 * Math.sin(t * 2.6 + i); r.material.opacity = 0.45 + 0.45 * k; r.scale.setScalar(0.92 + 0.12 * k); }));
    const met = I.spot('metDoors', cx, z0 - 1.0, { label: 'the Met Opera doors', glowZ: z0 - 0.2, glowY: 2.6, reach: 2.4 });
    met.enter = 'metOpera';
    met.prompt = { title: 'The Metropolitan Opera', sub: 'to go inside' };
    const gef = I.spot('geffenDoors', cx - 3.7, 13.83, { label: 'the Geffen Hall doors', glowX: cx - 5.0, glowY: 2.4, reach: 2.4 });
    gef.enter = 'geffen';
    gef.prompt = { title: 'The Concert Hall · David Geffen Hall', sub: 'to hear the orchestra' };
  }

  // ── Carnegie Hall: uplit terracotta-brown brick, a tall corner tower, an arcade of
  //    arched doors under a lit marquee, rows of arched windows, a heavy cornice ──
  {
    const cx = 19.4, zf = -1.2, W = 8.2, D = 6.4, H = 7.6, BR = '#a8704a', LIT = '#f0cf98', ST = '#e3c79a';
    b.box(W, H, D, BR, cx, 0, zf - D / 2);
    b.box(W + 0.1, 1.9, D + 0.1, '#8a5a3c', cx, 0, zf - D / 2);
    // the corner tower (west end), taller, with its own cornice
    const tx = cx - W / 2 + 1.3;
    b.box(2.6, 11, 2.8, BR, tx, 0, zf - 1.4);
    b.box(2.9, 0.45, 3.1, ST, tx, 11, zf - 1.4);
    b.box(2.7, 0.12, 2.9, LIT, tx, 10.85, zf - 1.4, { layer: 'glow', ao: false });
    for (let y = 8; y < 10.6; y += 1.3) for (const dx of [-0.6, 0, 0.6]) {
      b.box(0.34, 0.8, 0.06, '#ffe0a6', tx + dx, y, zf + 0.02, { layer: 'glow', ao: false });
      b.add(new THREE.CircleGeometry(0.17, 10, 0, Math.PI), '#ffe0a6', tx + dx, y + 0.8, zf + 0.02, { layer: 'glow', ao: false });
    }
    // ground floor arcade under the marquee
    for (let k = 0; k < 7; k++) {
      const x = cx - W / 2 + 0.75 + k * 1.12;
      b.box(0.7, 1.15, 0.08, '#ffd896', x, 0, zf + 0.06, { layer: 'glow', ao: false });
      b.add(new THREE.CircleGeometry(0.35, 12, 0, Math.PI), '#ffd896', x, 1.15, zf + 0.07, { layer: 'glow', ao: false });
      b.add(new THREE.RingGeometry(0.35, 0.47, 12, 1, 0, Math.PI), ST, x, 1.15, zf + 0.08, { ao: false });
    }
    b.box(5.4, 0.18, 0.9, '#2a2224', cx + 0.4, 1.95, zf + 0.45);
    for (let k = 0; k < 24; k++) b.sphere(0.045, '#fff0c0', cx - 2.2 + k * 0.23, 1.93, zf + 0.9, { layer: 'glow', ao: false, ws: 5, hs: 4 });
    // tall arched windows (two storeys), then smaller ones, all with stone surrounds
    for (const [y, h, n, w] of [[2.4, 1.9, 6, 0.55], [4.9, 0.9, 8, 0.4], [6.2, 0.7, 8, 0.36]]) {
      const x0 = cx - W / 2 + 2.9, span = W - 3.3;
      for (let k = 0; k < n; k++) {
        const x = x0 + (k + 0.5) * span / n;
        b.box(w, h, 0.06, '#ffdba0', x, y, zf + 0.02, { layer: 'glow', ao: false });
        b.add(new THREE.CircleGeometry(w / 2, 10, 0, Math.PI), '#ffdba0', x, y + h, zf + 0.02, { layer: 'glow', ao: false });
        b.add(new THREE.RingGeometry(w / 2, w / 2 + 0.1, 10, 1, 0, Math.PI), ST, x, y + h, zf + 0.03, { ao: false });
        b.box(w + 0.2, 0.08, 0.12, ST, x, y - 0.08, zf + 0.04, { ao: false });
      }
    }
    for (const y of [2.2, 4.65]) b.box(W + 0.1, 0.12, D + 0.1, ST, cx, y, zf - D / 2, { ao: false });
    // heavy cornice, washed in warm uplight
    b.box(W + 0.6, 0.5, D + 0.6, ST, cx, H, zf - D / 2);
    b.box(W + 0.3, 0.14, D + 0.3, LIT, cx, H - 0.16, zf - D / 2, { layer: 'glow', ao: false });
    for (let k = 0; k < 30; k++) b.box(0.1, 0.12, 0.1, '#d8b888', cx - W / 2 + 0.15 + k * 0.27, H - 0.12, zf + 0.25, { ao: false });
    b.box(W, 0.12, 0.08, LIT, cx, 0.02, zf + 0.12, { layer: 'glow', ao: false });
    // flags over the entrance
    const flag = (draw) => textPlane(0.75, 0.48, draw, { px: 96 });
    const flags = [
      flag((g, w, h) => { for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#fff' : '#b8322a'; g.fillRect(0, i * h / 7, w, h / 7 + 1); } g.fillStyle = '#2b3d6b'; g.fillRect(0, 0, w * 0.42, h * 0.55); }),
      flag((g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8322a'; g.fillRect(0, 0, w, h * 0.34); g.fillRect(0, h * 0.66, w, h * 0.34); }),
      flag((g, w, h) => { g.fillStyle = '#b8322a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.4); }),
    ];
    flags.forEach((f, i) => {
      const x = cx - 1.6 + i * 1.4;
      b.cyl(0.02, 0.02, 1.3, 4, '#d8d4cc', x, 2.3, zf + 0.35, { rx: 0.7, ao: false });
      f.position.set(x + 0.4, 3.0, zf + 0.8); f.rotation.y = 0.15; I.extras.add(f);
    });
    const sign = textPlane(3.2, 0.36, (g, w, h) => { g.fillStyle = '#f6d58e'; g.font = `700 ${h * 0.62}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CARNEGIE HALL', w / 2, h * 0.55); }, { px: 120, transparent: true, glow: true });
    sign.position.set(cx + 0.4, 2.23, zf + 0.91); I.extras.add(sign);
    I.box(cx, zf - D / 2, W, D, H + 3);
    const ch = I.spot('carnegieDoors', cx + 0.4, zf + 1.3, { label: 'the Carnegie Hall doors', glowZ: zf + 0.3, glowY: 1.6, reach: 2.2 });
    ch.enter = 'carnegie';
    ch.prompt = { title: 'Carnegie Hall', sub: 'to go inside' };
  }

  // gate, sign, scattered life
  I.dogHome = { x: 9.5, z: 12.5 };   // where the dog waits (pets.dog in world.config.js)
  I.addGate(26, 2, Math.PI / 2);
  I.addSign(24.5, 7.2, -0.35);
  for (let k = 0; k < 6; k++) { const a = r() * 6, d = 22 + r() * 3; if (I.insideRim(Math.cos(a) * d, Math.sin(a) * d, 2)) P.rock(b, Math.cos(a) * d, Math.sin(a) * d, 0.4 + r() * 0.4, '#a69b8c'); }

  return I.finalize(scene);
}

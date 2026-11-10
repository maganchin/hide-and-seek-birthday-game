// Washington, D.C.: the Capitol, a tidal-basin pond, a bookshop and cherry blossoms
import * as THREE from 'three';
import { Island } from '../island.js';
import { P, U, textPlane, IS_MOBILE, waterMat, gable, RAMP, toonMat } from '../kit.js';

export function buildDC(scene) {
  const I = new Island({ id: 'dc', center: [37, 0, -62], R: 28, seed: 2207, depth: 28 });
  const b = I.b, gp = I.gp, r = b.r;

  // ── ground ──
  gp.base(['#79ad5c', '#86b868', '#6c9f52', '#93c374', '#7fb262']);
  // the mall: lawn stripes and gravel walks
  gp.rect(0, -1, 9, 14, '#8fc06e');
  for (let z = -7; z < 6; z += 1.4) gp.rect(0, z, 9, 0.7, '#99c878');
  gp.rect(-5.4, -1, 1.6, 15, '#e6d8bd'); gp.rect(5.4, -1, 1.6, 15, '#e6d8bd');
  gp.rect(0, -8.3, 30, 3.2, '#e6d8bd', { edge: '#c9b796' });
  // winding garden paths
  const pathC = '#ead9b9', pathE = '#c3ab86';
  gp.path([[-11.5, 18.5], [-9, 14], [-6, 12.5], [-5.4, 8], [-5.4, 4]], 1.6, pathC, pathE);
  gp.path([[-6, 12.5], [-2, 11], [3, 12.5], [5.5, 14.5]], 1.4, pathC, pathE);
  gp.path([[-5.4, 4], [-9, 5.5], [-13.5, 7.8]], 1.4, pathC, pathE);
  gp.path([[5.4, 4], [9, 4], [14, 3.5], [18, 5]], 1.4, pathC, pathE);
  gp.path([[5.4, -2], [10, -3], [14.5, -6.5]], 1.2, pathC, pathE);
  gp.dabs(10, 11, 8, ['#f7c4d6', '#f2b2c8', '#fde1ea'], 420, 0.1); // fallen petals
  gp.dabs(-8, 14, 6, ['#f7c4d6', '#fde1ea'], 260, 0.1);

  // ── the Capitol ──
  {
    const x = 0, z = -15, W = '#f3eee4', S = '#e2dccf';
    b.box(11, 0.8, 7, S, x, 0, z);                             // podium
    b.box(9.5, 4.2, 5.4, W, x, 0.8, z);                        // centre block
    for (const sx of [-1, 1]) {
      b.box(7, 3.4, 4.6, W, x + sx * 8.5, 0, z + 0.2);          // wings
      b.box(7.2, 0.35, 4.8, S, x + sx * 8.5, 3.4, z + 0.2);
      for (let k = 0; k < 6; k++) b.cyl(0.13, 0.15, 2.6, 8, '#fbf8f1', x + sx * (6 + k * 1), 0.4, z + 2.7);
      b.box(6.5, 0.35, 0.5, S, x + sx * 8.5, 3, z + 2.7);
      P.windows(b, x + sx * 8.5, z + 0.2, 7, 4.6, 0.6, 3, 2, 6, { faces: 's', lit: 0.65, ww: 0.32, wh: 0.7 });
      I.box(x + sx * 8.5, z + 0.4, 7, 5.4, 4);
    }
    // portico + pediment
    for (let k = 0; k < 8; k++) if (k !== 3 && k !== 4) b.cyl(0.17, 0.2, 3.6, 8, '#fdfbf6', x - 3.15 + k * 0.9, 0.8, z + 3.3);   // the middle bay frames the doors
    b.box(7.6, 0.45, 1.6, S, x, 4.4, z + 3.1);
    b.add(gable(7.6, 1.3, 1.5), W, x, 4.85, z + 3.1);
    P.windows(b, x, z, 9.5, 5.4, 1.4, 4.4, 2, 7, { faces: 's', lit: 0.7, ww: 0.32, wh: 0.75 });
    // drum, colonnade, dome, lantern
    const dy = 5;
    b.cyl(3, 3.1, 0.6, 24, S, x, dy, z);
    b.cyl(2.5, 2.6, 2.4, 24, W, x, dy + 0.6, z);
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; b.cyl(0.1, 0.12, 2.2, 6, '#fffdf7', x + Math.cos(a) * 2.85, dy + 0.6, z + Math.sin(a) * 2.85); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; b.box(0.25, 0.9, 0.05, '#ffd98f', x + Math.cos(a) * 2.52, dy + 1.4, z + Math.sin(a) * 2.52, { ry: -a + Math.PI / 2, layer: 'glow', ao: false }); }
    b.cyl(2.95, 2.95, 0.35, 24, S, x, dy + 2.8, z);
    b.cyl(2.2, 2.4, 1, 24, W, x, dy + 3.15, z);
    b.add(new THREE.SphereGeometry(2.3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), '#f7f3ea', x, dy + 4.1, z, { sy: 1.25, ao: false, jitter: 0.02 });
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; b.add(new THREE.TorusGeometry(2.3, 0.04, 4, 20, Math.PI / 2), '#ddd6c6', x, dy + 4.1, z, { ry: a, sy: 1.25, ao: false }); }
    b.cyl(0.4, 0.5, 1.1, 10, W, x, dy + 6.9, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; b.cyl(0.04, 0.04, 0.8, 4, '#fff', x + Math.cos(a) * 0.48, dy + 7, z + Math.sin(a) * 0.48); }
    b.add(new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), W, x, dy + 8, z);
    b.cyl(0.08, 0.12, 0.7, 6, '#8e8a7e', x, dy + 8.3, z);
    b.sphere(0.12, '#fff1c4', x, dy + 7.4, z, { layer: 'glow', ao: false });
    // grand steps
    for (let s = 0; s < 5; s++) b.box(8.4 - s * 0.2, 0.2, 0.55, '#e9e3d6', x, s * 0.17, z + 5.6 - s * 0.5);
    I.box(x, z, 11, 7, 13);
    I.box(x, z + 3.5, 8, 2, 4);
    // US flag on the dome lantern would be too small: put two flags by the steps instead
    for (const sx of [-5.2, 5.2]) addFlag(I, x + sx, z + 6.1, 4.4);
  }
  I.spot('capitolSteps', -3.3, -7.5, { label: 'the Capitol steps', glowX: -3.4, glowZ: -8.9, glowY: 1.5 });

  // the Capitol's front doors open into the Rotunda
  {
    const z = -15 + 2.74;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 0.1), toonMat({ color: '#d8cdb6' }));
    frame.position.set(0, 0.8 + 1.5, z); I.extras.add(frame);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: '#ffe2a8', toneMapped: false }));
    glow.position.set(0, 0.8 + 1.3, z + 0.06); I.extras.add(glow);
    const bronze = toonMat({ color: '#6b5232' }), trim = toonMat({ color: '#b8964a' });
    I.capDoors = [-1, 1].map((s) => {
      const hinge = new THREE.Group(); hinge.position.set(s * 0.8, 0.8, z + 0.1);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 0.08), bronze); leaf.position.set(-s * 0.4, 1.3, 0); leaf.castShadow = true; hinge.add(leaf);
      for (const y of [0.6, 1.3, 2.0]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.03), trim); p.position.set(-s * 0.4, y, 0.05); hinge.add(p); }
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), trim); knob.position.set(-s * 0.72, 1.3, 0.08); hinge.add(knob);
      hinge.userData = { s, open: 0, cur: 0 };
      I.extras.add(hinge);
      return hinge;
    });
    I.updaters.push((t, dt) => { for (const h of I.capDoors) { const u = h.userData; u.cur += ((u.open ? 1 : 0) - u.cur) * Math.min(1, dt * 3.5); h.rotation.y = -u.s * u.cur * 1.6; } });
    I.lift(0, -10.4, 3.6, 1.1, 0.7, { ramp: 1.4 });
    const doorsSpot = I.spot('capitolDoors', 0, -9.9, { label: 'the Capitol doors', glowX: 0, glowZ: z + 0.2, glowY: 3.4, reach: 1.9 });
    doorsSpot.enter = 'rotunda';
    doorsSpot.doors = I.capDoors;
    doorsSpot.prompt = { title: 'The Capitol doors', sub: 'to step inside' };
  }

  // an electric scooter parked at the foot of the steps — hop on and ride it around DC
  {
    const g = new THREE.Group();
    const blk = toonMat({ color: '#1f2124' }), grey = toonMat({ color: '#3a3d42' }), steel = toonMat({ color: '#9aa0a6' });
    const accent = toonMat({ color: '#2fbf8f' }), tyre = toonMat({ color: '#141414' });
    const add = (geo, mat, x, y, z, rx = 0, rz = 0, parent = g) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.rotation.set(rx, 0, rz); me.castShadow = true; parent.add(me); return me; };
    add(new THREE.BoxGeometry(0.2, 0.06, 0.95), blk, 0, 0.13, 0);                       // deck
    add(new THREE.BoxGeometry(0.21, 0.02, 0.6), grey, 0, 0.17, -0.05);                   // grip tape
    add(new THREE.BoxGeometry(0.22, 0.03, 0.97), accent, 0, 0.1, 0);                     // teal stripe
    const wheels = [-0.5, 0.52].map((z) => {
      const w = new THREE.Group(); w.position.set(0, 0.1, z); g.add(w);
      add(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), tyre, 0, 0, 0, 0, Math.PI / 2, w);
      add(new THREE.BoxGeometry(0.07, 0.1, 0.03), steel, 0, 0, 0, 0, 0, w);            // spoke, so you can see it spin
      return w;
    });
    add(new THREE.BoxGeometry(0.05, 0.04, 0.24), blk, 0, 0.22, -0.5);                    // rear fender
    add(new THREE.CylinderGeometry(0.03, 0.035, 1.0, 8), blk, 0, 0.66, 0.66, -0.12);     // stem
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), blk, 0, 1.15, 0.72, 0, Math.PI / 2);   // handlebar
    for (const k of [-1, 1]) add(new THREE.CylinderGeometry(0.026, 0.026, 0.1, 6), grey, k * 0.22, 1.15, 0.72, 0, Math.PI / 2);
    add(new THREE.BoxGeometry(0.09, 0.05, 0.03), new THREE.MeshBasicMaterial({ color: '#e8f4ff' }), 0, 0.98, 0.75);   // headlight
    add(new THREE.BoxGeometry(0.08, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: '#2fbf8f' }), 0, 1.1, 0.7);     // display
    const stand = add(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 4), steel, -0.1, 0.06, -0.05, 0, 0.6);           // kickstand
    g.scale.setScalar(1.3);
    I.extras.add(g);
    const sc = { group: g, wheels, stand, scale: 1.3, deck: 0.2 * 1.3 };
    const spot = I.spot('scooter', 0, 0, { label: 'the e-scooter', glowY: 1.4, reach: 1.9 });
    spot.ride = sc;
    spot.prompt = { title: 'An electric scooter', sub: 'to hop on and ride' };
    sc.spot = spot;
    // park it (and move its glow) wherever she hops off
    sc.park = (x, z, ry) => {
      g.position.set(x, I.heightAt(x, z), z);
      g.rotation.set(0, ry, 0.03);
      stand.visible = true;
      spot.x = x; spot.z = z;
      spot.glowX = x; spot.glowZ = z;
      if (spot.marker) spot.marker.position.set(x, I.heightAt(x, z) + spot.glowY, z);
    };
    sc.park(2.9, -8.2, 0.7);
    I.scooter = sc;
  }

  // reflecting pool on the mall
  {
    I.gp.rect(0, -0.5, 3.6, 9.6, '#b8ac94');
    const w = new THREE.Mesh(new THREE.PlaneGeometry(3, 9).rotateX(-Math.PI / 2), waterMat);
    w.position.set(0, 0.08, -0.5);
    I.extras.add(w);
    b.box(3.6, 0.22, 0.3, '#d8cdb6', 0, 0, -5.15); b.box(3.6, 0.22, 0.3, '#d8cdb6', 0, 0, 4.15);
    b.box(0.3, 0.22, 9.6, '#d8cdb6', -1.65, 0, -0.5); b.box(0.3, 0.22, 9.6, '#d8cdb6', 1.65, 0, -0.5);
    I.box(0, -0.5, 3.6, 9.6, 0.3);
  }

  // Washington Monument
  {
    const x = 18.5, z = -8;
    b.box(2.4, 0.3, 2.4, '#d9cfbd', x, 0, z);
    b.add(new THREE.CylinderGeometry(0.42, 0.62, 13, 4), '#f1ebe0', x, 6.8, z, { ry: Math.PI / 4 });
    b.add(new THREE.ConeGeometry(0.42, 1, 4), '#f6f1e8', x, 13.8, z, { ry: Math.PI / 4 });
    b.sphere(0.1, '#ff8a7a', x, 14.4, z, { layer: 'glow', ao: false });
    I.circle(x, z, 1.1, 14);
  }

  // ── tidal-basin pond with cherry blossoms, a bench by the water, waterfall ──
  I.addPond(10, 11, 4.2, { gap: 2.2 });
  I.addStream([[12.5, 14.2], [15.5, 17], [19, 19.5], [22, 21]], 1.4);
  I.lift(16.8, 18.2, 1.2, 1.5, 0.45, { arch: true, axis: 'z' });
  // little footbridge over the stream
  {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(16.8, 0, 18.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.75, 0)), new THREE.Vector3(1, 1, 1));
    for (let k = 0; k < 7; k++) { const t = k / 6; b.box(1.5, 0.12, 0.5, '#9c6b47', 0, Math.sin(t * Math.PI) * 0.45, -1.5 + t * 3, { matrix: m }); }
    for (const sx of [-0.75, 0.75]) b.box(0.06, 0.5, 3, '#7a5236', sx, 0.55, 0, { matrix: m });
  }
  P.bench(b, 6.6, 15.6, Math.PI + 0.9, { wood: '#7a5238' });
  I.box(6.6, 15.6, 1.4, 1.2, 1);
  I.spot('waterBench', 5.4, 14.4, { label: 'a bench beside the water', glowX: 6.6, glowZ: 15.6, glowY: 1.3 });

  // ── bookshop ──
  {
    const x = -15, z = 5, w = 5.2, d = 4.2, h = 3.6;
    b.box(w, h, d, '#a2563f', x, 0, z);
    b.box(w + 0.3, 0.3, d + 0.3, '#e7d5b5', x, h, z);
    b.add(gable(d + 0.6, 1.8, w + 0.4), '#5b4a52', x, h + 0.3, z, { ry: Math.PI / 2 });
    b.box(0.7, 1.4, 0.7, '#8e4b37', x + 1.5, h + 0.8, z - 0.6);
    // shop front
    b.box(w * 0.9, 2.3, 0.12, '#2f5a46', x, 0, z + d / 2 + 0.02);
    b.box(2.6, 1.6, 0.08, '#ffd59a', x - 0.9, 0.5, z + d / 2 + 0.09, { layer: 'glow', ao: false });
    for (let k = 0; k < 3; k++) for (let j = 0; j < 7; j++) b.box(0.22, 0.38, 0.06, ['#b44a3f', '#3d6c8f', '#e2b450', '#6a8f4e', '#8a5a9a', '#f0e6d2'][(k + j * 2) % 6], x - 2 + j * 0.34, 0.6 + k * 0.5, z + d / 2 + 0.15, { ao: false });
    b.box(0.9, 1.9, 0.1, '#6b3b2a', x + 1.6, 0, z + d / 2 + 0.1);
    b.sphere(0.06, '#e9c46a', x + 1.3, 0.95, z + d / 2 + 0.17, { ao: false });
    // striped awning
    for (let k = 0; k < 9; k++) b.box(w * 0.92 / 9, 0.08, 1.1, k % 2 ? '#f3ede0' : '#3f7b5e', x - w * 0.46 + (k + 0.5) * w * 0.92 / 9, 2.55, z + d / 2 + 0.55, { rx: 0.35, ao: false });
    P.windows(b, x, z, w, d, 2.6, h, 1, 3, { faces: 'sw', lit: 0.9, ww: 0.6, wh: 0.7 });
    // books on a little cart and a flower pot
    b.box(1.1, 0.6, 0.5, '#7a5238', x - 2.9, 0, z + d / 2 + 1);
    for (let j = 0; j < 6; j++) b.box(0.14, 0.32, 0.4, ['#b44a3f', '#3d6c8f', '#e2b450', '#6a8f4e'][j % 4], x - 3.3 + j * 0.16, 0.6, z + d / 2 + 1, { ao: false });
    b.cyl(0.3, 0.22, 0.5, 8, '#c76f4f', x + 2.8, 0, z + d / 2 + 0.6);
    b.ico(0.45, '#d4689a', x + 2.8, 0.85, z + d / 2 + 0.6, { layer: 'sway', sway: 0.05, swayBase: 0 });
    const sign = textPlane(1.8, 0.5, (g, W, H) => {
      g.fillStyle = '#2f5a46'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#e9c46a'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12);
      g.fillStyle = '#f5e6c4'; g.font = `600 ${H * 0.52}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('Books & Letters', W / 2, H * 0.54);
    }, { px: 128 });
    sign.position.set(x, 3.05, z + d / 2 + 0.15);
    I.extras.add(sign);
    I.box(x, z, w, d, h + 1.5);
    I.box(x - 2.9, z + d / 2 + 1, 1.1, 0.5, 0.7);
  }
  I.spot('bookshop', -13.4, 9, { label: 'the little bookshop', glowX: -13.4, glowZ: 7.3, glowY: 1.6 });

  // ── blossom arch on the garden path ──
  {
    const x = -6.3, z = 12.6;
    for (const sx of [-1.1, 1.1]) b.cyl(0.08, 0.08, 2.6, 6, '#f4efe6', x + sx, 0, z, {});
    b.add(new THREE.TorusGeometry(1.1, 0.07, 6, 16, Math.PI), '#f4efe6', x, 2.6, z);
    for (let k = 0; k < 18; k++) { const a = k / 17 * Math.PI; b.ico(0.32 + r() * 0.15, ['#f6b8cf', '#fbd0de', '#ffffff', '#f3a6c3'][k % 4], x + Math.cos(a) * 1.15, 2.6 + Math.sin(a) * 1.15, z + (r() - 0.5) * 0.3, { layer: 'sway', sway: 0.03, swayBase: 0 }); }
    I.circle(x - 1.1, z, 0.2, 2.6); I.circle(x + 1.1, z, 0.2, 2.6);
  }
  I.spot('blossomArch', -5.2, 14.2, { label: 'the blossom arch', glowX: -6.3, glowZ: 12.6, glowY: 2.6 });

  // ── gazebo (a nod to the memorial by the basin) ──
  {
    const x = 19, z = 3.6;
    b.cyl(2.3, 2.5, 0.4, 16, '#e1d8c6', x, 0, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; b.cyl(0.11, 0.13, 2.4, 6, '#fbf7ee', x + Math.cos(a) * 1.9, 0.4, z + Math.sin(a) * 1.9); }
    b.cyl(2.2, 2.2, 0.3, 16, '#efe8da', x, 2.8, z);
    b.add(new THREE.SphereGeometry(2, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#f8f4ec', x, 3.1, z, { sy: 0.7 });
    I.lift(x, z, 2.4, 2.4, 0.4, { ramp: 0.5 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; if (k !== 4) I.circle(x + Math.cos(a) * 1.9, z + Math.sin(a) * 1.9, 0.18, 1); }
  }
  I.spot('gazebo', 19, 3.6, { label: 'the white gazebo', glowY: 2 });

  // ── cherry blossoms, hedges, tulips, lamps ──
  const blossoms = [[7, 6.4], [14.3, 9.2], [13.6, 14.6], [5.6, 10.7], [9, 16.2], [-9.4, 15.8], [-3.5, 15.5], [-10.4, 9.8], [-8.5, 1.5], [8.4, -6], [-9.3, -4.8], [12, 0], [-19.5, -1.5], [-2.6, 8.6], [2.7, 8.8], [22, -1.5], [-18.5, 12], [-14, -7], [15, -12], [-20.5, 5.5]];
  for (const [x, z] of blossoms) {
    if (!I.insideRim(x, z, 2.2)) continue;
    P.blossom(b, x, z, { s: 0.85 + r() * 0.35 });
    I.circle(x, z, 0.3, 2);
  }
  for (const sx of [-7.6, 7.6]) {   // clipped hedges along the mall
    for (let k = 0; k < 9; k++) b.ico(0.55, '#4f8a44', sx, 0.25, -5.5 + k * 1.15, { sy: 0.75, detail: 1 });
    I.box(sx, -0.9, 1, 10.4, 1);
  }
  P.flowers(b, -11, -2, 4, 70, ['#ff6f7d', '#ffd36e', '#ffffff', '#ff9ec4'], { ok: (x, z) => I.insideRim(x, z, 2) });
  P.flowers(b, 13, -1, 3.5, 60, ['#ff6f7d', '#ffd36e', '#c3a6ff'], { ok: (x, z) => I.insideRim(x, z, 2) && Math.hypot(x - 18.5, z + 8) > 1.5 });
  P.flowers(b, -2, 18, 5, 70, ['#fbd0de', '#ffffff', '#c3a6ff', '#ffd36e'], { ok: (x, z) => I.insideRim(x, z, 1.5) });
  P.grassTufts(b, 0, 0, 27, 140, '#5f9a45', { ok: (x, z) => I.insideRim(x, z, 1) && Math.abs(x) > 5 && (z > -7 || Math.abs(x) > 15) && Math.hypot(x - 10, z - 11) > 5 });
  for (const [x, z] of [[-5.4, -4], [5.4, -4], [-5.4, 3.5], [5.4, 3.5], [-8.5, 14], [3, 11.6], [12, 4.4]]) { P.lamp(b, x + (x < 0 ? -1.1 : 1.1), z, { h: 2.4 }); I.circle(x + (x < 0 ? -1.1 : 1.1), z, 0.2, 1); }

  I.dogHome = { x: 9, z: 6 };        // where the dog waits (pets.dog in world.config.js)
  I.addGate(-12, 19, -0.53);
  I.addSign(-16.5, 16.5, -0.2);

  // falling petals
  const N = IS_MOBILE ? 90 : 200;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (r() - 0.5) * 50; pos[i * 3 + 1] = r() * 8; pos[i * 3 + 2] = (r() - 0.5) * 50; seed[i] = r(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const petals = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: U.time, uMotion: U.sway, uPx: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `attribute float seed; uniform float uTime; uniform float uMotion; uniform float uPx; varying float vS;
      void main(){ vec3 p=position; float t=uTime*uMotion*0.6+seed*40.0;
        p.y = mod(p.y - t*0.55, 8.0) + 0.2; p.x += sin(t*0.9+seed*9.0)*1.2 + t*0.3; p.z += cos(t*0.7)*0.8;
        p.x = mod(p.x+25.0,50.0)-25.0;
        vS=seed; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=(3.0+seed*3.0)*uPx*(20.0/max(-mv.z,1.0)); }`,
    fragmentShader: `varying float vS; void main(){ vec2 c=gl_PointCoord-0.5; c.x*=1.6; if(length(c)>0.5) discard; gl_FragColor=vec4(mix(vec3(1.0,0.78,0.85),vec3(1.0,0.92,0.95),vS),0.9);} `,
  }));
  petals.frustumCulled = false;
  I.extras.add(petals);

  return I.finalize(scene);
}

// flag on a pole

export function usFlagTex(g, w, h) {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f6f1e7' : '#b8323a'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
  g.fillStyle = '#2b3d6b'; g.fillRect(0, 0, w * 0.42, h * 7 / 13);
  g.fillStyle = '#f6f1e7';
  for (let j = 0; j < 9; j++) for (let i = 0; i < (j % 2 ? 5 : 6); i++) {
    g.beginPath(); g.arc(w * 0.42 * ((i + (j % 2 ? 1 : 0.5)) / 6), h * 7 / 13 * ((j + 0.6) / 9.5), h * 0.018, 0, 7); g.fill();
  }
}

const flagMat = (tex) => {
  const m = new THREE.MeshToonMaterial({ map: tex, gradientMap: RAMP, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time; sh.uniforms.uSway = U.sway;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uSway;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fx = uv.x; transformed.z += sin(uv.x*6.0 - uTime*4.0)*0.12*fx*(0.3+0.7*uSway); transformed.y += sin(uv.x*5.0-uTime*3.0)*0.04*fx*uSway;`);
  };
  return m;
};

export function addFlag(I, x, z, h = 4, tex, o = {}) {
  const b = I.b;
  b.cyl(0.05, 0.07, h, 6, '#d9d6cf', x, 0, z);
  b.sphere(0.1, '#e2b450', x, h + 0.05, z);
  const fw = o.w ?? 1.6, fh = o.h ?? 0.95;
  const c = document.createElement('canvas'); c.width = 320; c.height = 190;
  (tex || usFlagTex)(c.getContext('2d'), 320, 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.PlaneGeometry(fw, fh, 12, 4); g.translate(fw / 2, 0, 0);
  const f = new THREE.Mesh(g, flagMat(t));
  f.position.set(x + 0.05, h - fh / 2 - 0.1, z);
  f.rotation.y = o.ry ?? 0;
  f.castShadow = true;
  I.extras.add(f);
  I.circle(x, z, 0.15, 1);
  return f;
}

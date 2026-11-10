// The Overlook: the small meadow at the centre of the archipelago where the
// journey begins, and where the birthday celebration appears at the end.
import * as THREE from 'three';
import { Island } from '../island.js';
import { P, U, toonMat, softDot, IS_MOBILE, rng, gable, textPlane } from '../kit.js';
import { PERSON, PETS } from '../content.js';

export function buildOverlook(scene) {
  const I = new Island({ id: 'overlook', center: [0, -2, 0], R: 14, seed: 5150, depth: 20 });
  const b = I.b, gp = I.gp, r = b.r;

  gp.base(['#79b05a', '#86bd66', '#6da452', '#94c873', '#7db55e']);
  gp.path([[0, 9], [0, 5], [0, 1.5], [0, -4.5]], 1.6, '#e8d4ae', '#bfa47c');
  gp.circle(0, -0.8, 3.2, '#e8d9bd', '#c2aa85');
  gp.dabs(0, 0, 12, ['#a3d07f', '#b5dc8e'], 160, 0.12);

  // fairy ring of flowers around where the celebration will appear
  for (let k = 0; k < 22; k++) {
    const a = k / 22 * Math.PI * 2, x = Math.cos(a) * 3.6, z = -0.8 + Math.sin(a) * 3.6;
    if (Math.abs(x) < 1.1 && z > 0) continue;
    b.sphere(0.13, ['#fff4c4', '#ffd6e6', '#ffffff'][k % 3], x, 0.12, z, { ao: false, ws: 6, hs: 4 });
  }

  // a big friendly tree and the old wooden fence from the reference
  P.tree(b, 7.4, -4.2, { h: 3.4, s: 1.6, leaf: '#5f9e4c', puffs: 6 }); I.circle(7.4, -4.2, 0.5, 3);
  P.fence(b, [[-10.6, 4.8], [-9.6, 7.2], [-7.6, 9.1], [-5.2, 10.5]]);
  for (const [x, z] of [[-10.6, 4.8], [-9.6, 7.2], [-7.6, 9.1], [-5.2, 10.5]]) I.circle(x, z, 0.2, 1);
  for (const [x, z] of [[-3, 6], [3.2, 5.6]]) { P.lamp(b, x, z, { h: 2.2, pole: '#5a4a3a' }); I.circle(x, z, 0.2, 1); }

  // cherry blossoms that sway in the breeze
  for (const [x, z, s] of [[-8, -3.5, 1.2], [3.9, -10, 1], [-7.4, 6.3, 1.05], [10.4, -2.2, 0.95], [-2.6, -10.2, 0.9]]) {
    if (!I.insideRim(x, z, 1.6)) continue;
    P.blossom(b, x, z, { s }); I.circle(x, z, 0.35, 2.2);
  }

  const place = (x, z, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
  const toWorld = (m, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(m);

  // ── koi pond with lily pads ──
  const pond = { x: 5.6, z: 7.6, r: 2.1 };
  I.addPond(pond.x, pond.z, pond.r, { stone: '#bfb5a2' });
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3 + 0.4, d = 0.9 + (k % 2) * 0.6;
    b.cyl(0.24, 0.24, 0.02, 10, '#5f9a4a', pond.x + Math.cos(a) * d, 0.08, pond.z + Math.sin(a) * d, { ao: false });
    if (k % 2 === 0) b.sphere(0.08, '#f7b6cc', pond.x + Math.cos(a) * d, 0.13, pond.z + Math.sin(a) * d, { ao: false, ws: 6, hs: 4 });
  }
  const koi = [];
  const koiCols = [['#f26b2b', '#fbf5ec'], ['#fbf5ec', '#e2402e'], ['#f6a23b', '#f6a23b'], ['#fbf5ec', '#222'], ['#e2402e', '#fbf5ec']];
  koiCols.forEach(([c1, c2], i) => {
    const f = new THREE.Group();
    const bodyM = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), toonMat({ color: c1 }));
    bodyM.scale.set(0.55, 0.35, 1.3);
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toonMat({ color: c2 }));
    spot.position.set(0, 0.03, 0.03); spot.scale.set(0.9, 0.5, 1.3);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), toonMat({ color: c1 }));
    tail.rotation.x = -Math.PI / 2; tail.position.z = -0.2; tail.scale.set(1, 0.3, 1);
    f.add(bodyM, spot, tail);
    f.userData = { r: 0.6 + (i % 3) * 0.45, sp: (0.35 + i * 0.07) * (i % 2 ? 1 : -1), ph: i * 1.3, tail };
    f.position.y = 0.04;
    I.extras.add(f);
    koi.push(f);
  });
  I.updaters.push((t) => {
    const mot = U.sway.value ? 1 : 0.3;
    for (const f of koi) {
      const u = f.userData, a = t * u.sp * mot + u.ph;
      f.position.x = pond.x + Math.cos(a) * u.r;
      f.position.z = pond.z + Math.sin(a) * u.r * 0.85;
      f.rotation.y = -a + (u.sp > 0 ? Math.PI : 0);
      u.tail.rotation.y = Math.sin(t * 8 + u.ph) * 0.5;
    }
  });
  P.bench(b, 2.9, 10.6, Math.PI - 0.3);
  I.box(2.9, 10.6, 1.7, 0.8, 1);

  I.addGate(0, -7.2, 0);
  I.addSign(-4.4, 4.6, 0.5, 'Welcome, friends');

  // flowers and grass fill whatever space is left
  const free = (x, z) => I.insideRim(x, z, 1) && Math.abs(x) > 1 && Math.hypot(x, z + 0.8) > 4 && !I.blocked(x, z, 0.05);
  P.flowers(b, 0, 0, 12, 220, ['#ff8fa3', '#ffd36e', '#ffffff', '#c3a6ff', '#ff9e7a'], { ok: free });
  P.grassTufts(b, 0, 0, 13, 100, '#5f9a45', { ok: free });


  // falling cherry-blossom petals
  const PN = IS_MOBILE ? 50 : 110;
  const pp = new Float32Array(PN * 3), ps = new Float32Array(PN);
  for (let i = 0; i < PN; i++) { pp[i * 3] = (r() - 0.5) * 26; pp[i * 3 + 1] = r() * 6; pp[i * 3 + 2] = (r() - 0.5) * 26; ps[i] = r(); }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  pg.setAttribute('seed', new THREE.BufferAttribute(ps, 1));
  const petals = new THREE.Points(pg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: U.time, uMotion: U.sway, uPx: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `attribute float seed; uniform float uTime; uniform float uMotion; uniform float uPx; varying float vS;
      void main(){ vec3 p=position; float t=uTime*uMotion*0.6+seed*40.0;
        p.y = mod(p.y - t*0.5, 6.0) + 0.2; p.x += sin(t*0.9+seed*9.0)*1.0 + t*0.25; p.z += cos(t*0.7)*0.7;
        p.x = mod(p.x+13.0,26.0)-13.0;
        vS=seed; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=(3.0+seed*3.0)*uPx*(20.0/max(-mv.z,1.0)); }`,
    fragmentShader: `varying float vS; void main(){ vec2 c=gl_PointCoord-0.5; c.x*=1.6; if(length(c)>0.5) discard; gl_FragColor=vec4(mix(vec3(1.0,0.78,0.85),vec3(1.0,0.92,0.95),vS),0.9);} `,
  }));
  petals.frustumCulled = false;
  I.extras.add(petals);

  // ── the cat house: a little cottage with cat ears where you pick your kitty ──
  {
    const x = -5.8, z = -3, PINK = '#f6c8cf', CREAM = '#fff4e6', RUST = '#c86a5a';
    gp.circle(x + 1.6, z, 1.1, '#e8d4ae', '#bfa47c');
    b.box(2.0, 1.7, 2.2, PINK, x, 0, z);
    b.box(2.1, 0.12, 2.3, CREAM, x, 1.7, z, { ao: false });
    b.add(gable(2.5, 1.0, 2.6), RUST, x, 1.82, z, { ry: Math.PI / 2, jitter: 0.03 });
    for (const sz of [-0.75, 0.75]) b.cone(0.28, 0.55, 4, RUST, x, 2.35, z + sz, { ry: Math.PI / 4 });     // cat ears on the roof
    for (const sz of [-0.75, 0.75]) b.cone(0.15, 0.32, 4, '#f6a8b8', x + 0.12, 2.38, z + sz, { ry: Math.PI / 4 });
    // round-topped door facing the plaza, a paw-print window, a little sign
    b.box(0.08, 0.9, 0.7, '#6a3a2a', x + 1.0, 0, z);
    b.add(new THREE.CircleGeometry(0.35, 14, 0, Math.PI), '#6a3a2a', x + 1.04, 0.9, z, { ry: Math.PI / 2 });
    b.box(0.06, 0.06, 0.06, '#e8c26b', x + 1.06, 0.5, z + 0.22, { ao: false });
    b.add(new THREE.CircleGeometry(0.3, 16), '#fff2c8', x + 1.02, 1.15, z + 0.75, { ry: Math.PI / 2, layer: 'glow', ao: false });
    b.add(new THREE.CircleGeometry(0.3, 16), '#fff2c8', x + 1.02, 1.15, z - 0.75, { ry: Math.PI / 2, layer: 'glow', ao: false });
    for (const [dy, dz, r] of [[-0.05, 0, 0.09], [0.08, -0.09, 0.04], [0.11, 0, 0.04], [0.08, 0.09, 0.04]]) b.add(new THREE.CircleGeometry(r, 10), '#c86a5a', x + 1.03, 1.15 + dy, z + 0.75 + dz, { ry: Math.PI / 2, ao: false });
    const sign = textPlane(1.5, 0.42, (g, W, H) => {
      g.fillStyle = '#fff6e8'; g.beginPath(); g.roundRect(3, 3, W - 6, H - 6, H * 0.35); g.fill();
      g.strokeStyle = '#c86a5a'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#7a3b3a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${H * 0.46}px "Lilita One", Fredoka, sans-serif`; g.fillText('🐾 Cat House', W / 2, H * 0.52, W * 0.88);
    }, { px: 180 });
    sign.position.set(x + 1.08, 1.62, z); sign.rotation.y = Math.PI / 2; I.extras.add(sign);
    // a carpeted cat tree beside it, with a yarn ball
    const tx = x + 0.6, tz = z + 1.75;
    b.cyl(0.08, 0.08, 1.8, 8, '#d9b38a', tx, 0, tz);
    for (const [y, rr] of [[0.6, 0.38], [1.2, 0.32], [1.8, 0.36]]) b.cyl(rr, rr, 0.1, 14, '#b8a0c8', tx, y, tz);
    b.sphere(0.13, '#f7a8c0', tx + 0.3, 0.13, tz + 0.3);
    I.box(x, z, 2.1, 2.3, 2.6);
    I.circle(tx, tz, 0.45, 2);
    I.catHouse = { x, z, previews: [[x + 1.7, z + 1.3, -2.4], [x + 1.9, z - 1.25, -0.9], [tx, tz, -1.6, 1.9]] };
    const sp = I.spot('catHouse', x + 2.0, z, { label: 'the cat house', glowX: x + 1.1, glowZ: z, glowY: 1.3, reach: 2.2 });
    sp.catHouse = true;
    sp.prompt = { title: 'The Cat House', sub: `to dress up ${PETS.cat.name}` };
  }

  // ── the wardrobe: an open armoire with outfits on hangers, a mirror and a rug ──
  {
    const x = 5.3, z = -6.3, ry = Math.atan2(-x, -2 - z);       // facing the plaza
    const mtx = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    const W = '#8a5a3a', WD = '#6a4028', GOLD = '#e0b860';
    gp.circle(x + Math.sin(ry) * 1.6, z + Math.cos(ry) * 1.6, 1.2, '#e8b8c8', '#c88aa0');
    b.box(2.0, 2.6, 0.9, W, 0, 0, -0.1, { matrix: mtx });                    // the cabinet
    b.box(1.84, 2.3, 0.05, '#4a2c1c', 0, 0.12, 0.33, { matrix: mtx, ao: false });   // dark inside
    b.box(2.2, 0.2, 1.0, WD, 0, 2.6, -0.1, { matrix: mtx });
    b.box(1.2, 0.3, 0.2, WD, 0, 2.8, 0.3, { matrix: mtx });                // carved crest
    b.sphere(0.1, GOLD, 0, 2.95, 0.36, { matrix: mtx, ao: false });
    b.box(1.8, 0.04, 0.04, GOLD, 0, 2.15, 0.25, { matrix: mtx, ao: false }); // hanging rail
    // the doors, swung open
    for (const s2 of [-1, 1]) {
      const dm = new THREE.Matrix4().copy(mtx).multiply(new THREE.Matrix4().compose(new THREE.Vector3(s2 * 1.0, 0, 0.35), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s2 * -1.2, 0)), new THREE.Vector3(1, 1, 1)));
      b.box(0.95, 2.4, 0.06, W, s2 * 0.47, 0.1, 0, { matrix: dm });
      b.box(0.7, 1.6, 0.02, '#a87a52', s2 * 0.47, 0.45, 0.035, { matrix: dm, ao: false });
      b.sphere(0.04, GOLD, s2 * 0.08, 1.2, 0.06, { matrix: dm, ao: false });
    }
    // the outfits hanging inside (one in each colour from the wardrobe)
    ['#f2866b', '#f6c94e', '#9aa3ad', '#e86aa8', '#1a1a1e', '#4a6fa8'].forEach((c, k) => {
      const hx = -0.75 + k * 0.3;
      b.cyl(0.005, 0.005, 0.12, 3, '#c8c0b0', hx, 2.03, 0.18, { matrix: mtx, ao: false });
      b.add(new THREE.ConeGeometry(0.16, 1.05, 6, 1, true), c, hx, 1.45, 0.18, { matrix: mtx, ao: false });
      b.box(0.24, 0.05, 0.05, '#c8c0b0', hx, 2.0, 0.18, { matrix: mtx, ao: false });
    });
    // a standing mirror and a little stool beside it
    const mm = new THREE.Matrix4().copy(mtx).multiply(new THREE.Matrix4().compose(new THREE.Vector3(1.75, 0, 0.6), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.5, 0)), new THREE.Vector3(1, 1, 1)));
    b.box(0.7, 1.7, 0.08, GOLD, 0, 0.15, 0, { matrix: mm });
    b.box(0.58, 1.56, 0.02, '#d8eef6', 0, 0.22, 0.05, { matrix: mm, layer: 'glow', ao: false });
    for (const s2 of [-1, 1]) b.box(0.06, 0.2, 0.4, GOLD, s2 * 0.3, 0, 0, { matrix: mm });
    I.box(x, z, 2.3, 2.3, 3);
    const fx = x + Math.sin(ry) * 1.9, fz = z + Math.cos(ry) * 1.9;
    const sp = I.spot('wardrobe', fx, fz, { label: `${PERSON.name}'s wardrobe`, glowX: x + Math.sin(ry) * 0.4, glowZ: z + Math.cos(ry) * 0.4, glowY: 2.4, reach: 2.4 });
    sp.wardrobe = true;
    sp.prompt = { title: `${PERSON.name}'s Wardrobe`, sub: 'to change outfits' };
    const sign = textPlane(1.6, 0.42, (g, W2, H) => {
      g.fillStyle = '#fff6e8'; g.beginPath(); g.roundRect(3, 3, W2 - 6, H - 6, H * 0.35); g.fill();
      g.strokeStyle = '#c88aa0'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#6a3a4a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${H * 0.44}px "Lilita One", Fredoka, sans-serif`; g.fillText('✦ Wardrobe ✦', W2 / 2, H * 0.52, W2 * 0.88);
    }, { px: 180 });
    sign.position.set(x + Math.sin(ry) * 0.42, 3.25, z + Math.cos(ry) * 0.42); sign.rotation.y = ry; I.extras.add(sign);
  }

  I.finalize(scene);

  // ── the celebration (hidden until every memory is found) ──
  const cel = new THREE.Group();
  cel.position.set(0, 0, -0.8);
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.35, 32), toonMat({ color: '#efe4d0' }));
  dais.position.y = 0.17; dais.receiveShadow = true;
  cel.add(dais);
  const tier = (rad, h, y, col) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 36), toonMat({ color: col }));
    m.position.y = y + h / 2; m.castShadow = true; cel.add(m);
    // frosting drips
    const drip = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.07, 6, 36), toonMat({ color: '#fffaf2' }));
    drip.rotation.x = Math.PI / 2; drip.position.y = y + h; cel.add(drip);
    for (let k = 0; k < 18; k++) {
      const a = k / 18 * Math.PI * 2, d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), drip.material);
      d.scale.y = 1.6 + (k % 3) * 0.6; d.position.set(Math.cos(a) * rad, y + h - 0.1, Math.sin(a) * rad); cel.add(d);
    }
    return m;
  };
  tier(1.35, 0.75, 0.35, '#f6c7d4');
  tier(1.0, 0.65, 1.1, '#fbe6d6');
  tier(0.65, 0.55, 1.75, '#f6c7d4');
  // berries on the top
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), toonMat({ color: '#d93a4a' })); s.position.set(Math.cos(a) * 0.4, 2.36, Math.sin(a) * 0.4); cel.add(s); }
  // one candle per year (world.config.js → birthdayPerson.age), shared out across the three tiers
  const flames = [];
  const flameTex = softDot(64, 'rgba(255,230,160,1)', 'rgba(255,150,60,0)');
  const candleCols = ['#9ed0f0', '#f9d77e', '#c3a6ff', '#ffb3c7', '#a8e6b8'];
  const ring = (n, rad, y) => {
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + n;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 6), toonMat({ color: candleCols[(k + n) % 5] }));
      c.position.set(Math.cos(a) * rad, y + 0.16, Math.sin(a) * rad); cel.add(c);
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffd38a' }));
      f.position.set(c.position.x, y + 0.42, c.position.z); f.scale.set(0.22, 0.32, 1); f.visible = false;
      f.userData.ph = r() * 6;
      cel.add(f); flames.push(f);
    }
  };
  {
    const n = Math.min(PERSON.age, 60), top = Math.max(1, Math.round(n * 0.2)), mid = Math.round(n * 0.35), bot = n - top - mid;
    if (bot > 0) ring(bot, 1.15, 1.1);
    if (mid > 0) ring(mid, 0.8, 1.75);
    ring(top, top === 1 ? 0 : 0.42, 2.3);
  }
  // beacon of light (visible from anywhere once revealed)
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 140, 24, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: U.time, uO: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uO; void main(){ float s=0.6+0.4*sin(vUv.x*40.0+uTime*2.0); float a=pow(1.0-vUv.y,1.6)*0.35*s*uO; gl_FragColor=vec4(vec3(1.0,0.86,0.55)*a, a);} `,
  }));
  beacon.position.y = 70;
  cel.add(beacon);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(128), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  glow.scale.set(9, 9, 1); glow.position.y = 1.5; cel.add(glow);
  cel.visible = false;
  I.group.add(cel);
  I.celebration = { group: cel, flames, beacon, glow, cakeParts: cel.children.filter((c) => c !== beacon && c !== glow && c !== dais) };

  // floating sky lanterns across the whole archipelago
  const N = IS_MOBILE ? 140 : 300;
  const lg = new THREE.CylinderGeometry(0.35, 0.28, 0.75, 8);
  const lanterns = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ color: '#ffb560', toneMapped: false, transparent: true, opacity: 0 }), N);
  const rr = rng(2626), data = [];
  for (let i = 0; i < N; i++) {
    const a = rr() * Math.PI * 2, d = 6 + Math.pow(rr(), 0.7) * 150;
    data.push({ x: Math.cos(a) * d, z: Math.sin(a) * d - 30, y0: -60 + rr() * 50, v: 1.2 + rr() * 1.6, ph: rr() * 6, s: 0.8 + rr() * 0.9 });
  }
  lanterns.frustumCulled = false;
  lanterns.visible = false;
  scene.add(lanterns);
  const glowPts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)),
    new THREE.PointsMaterial({ map: softDot(64), size: 6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffb35a', opacity: 0 }));
  glowPts.frustumCulled = false; glowPts.visible = false;
  scene.add(glowPts);
  I.skyLanterns = { mesh: lanterns, glowPts, data, t0: 0 };

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  I.updaters.push((t, dt) => {
    for (const f of flames) if (f.visible) { const k = 0.85 + Math.sin(t * 13 + f.userData.ph) * 0.1 + Math.sin(t * 7.3 + f.userData.ph) * 0.06; f.scale.set(0.22 * k, 0.34 * k, 1); }
    const L = I.skyLanterns;
    if (L.mesh.visible) {
      const el = t - L.t0, mot = U.sway.value ? 1 : 0.35;
      const gp2 = glowPts.geometry.attributes.position;
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const y = d.y0 + el * d.v * mot;
        const yy = ((y + 60) % 170) - 60;
        pv.set(d.x + Math.sin(el * 0.3 + d.ph) * 1.5, yy, d.z + Math.cos(el * 0.25 + d.ph) * 1.5);
        e.set(Math.sin(el + d.ph) * 0.08, 0, Math.cos(el * 0.8 + d.ph) * 0.08);
        m4.compose(pv, q.setFromEuler(e), sc.setScalar(d.s));
        L.mesh.setMatrixAt(i, m4);
        gp2.setXYZ(i, pv.x, pv.y, pv.z);
      }
      L.mesh.instanceMatrix.needsUpdate = true;
      gp2.needsUpdate = true;
      const fade = Math.min(1, el / 3);
      L.mesh.material.opacity = 0.95 * fade;
      glowPts.material.opacity = 0.75 * fade;
    }
  });

  return I;
}

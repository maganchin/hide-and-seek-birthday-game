// Island framework: ground painting, colliders, a navigation grid for
// click-to-walk, discovery spots and the sky gate used to travel.
import * as THREE from 'three';
import { Builder, GroundPainter, islandBase, rimFn, IS_MOBILE, U, textPlane, waterMat, waterfall } from './kit.js';
import { SEA_Y } from './world.js';
import { ISLANDS } from './content.js';

const AV_R = 0.38;      // avatar collision radius
const CELL = 0.7;       // nav grid resolution (m)

export class Island {
  constructor({ id, center, R, seed, depth = 30, under = {} }) {
    this.id = id;
    this.info = ISLANDS[id];
    this.center = new THREE.Vector3(...center);
    this.R = R;
    this.seed = seed;
    this.depth = depth;
    this.underOpts = under;
    this.b = new Builder(seed);
    this.gp = new GroundPainter(R, IS_MOBILE ? 1024 : 2048, seed);
    this.colliders = [];
    this.spots = [];
    this.updaters = [];
    this.group = new THREE.Group();
    this.group.position.copy(this.center);
    this.extras = new THREE.Group();   // non-merged meshes (signs, water, flags…)
    this.group.add(this.extras);
    this.noWalk = [];                  // extra circles that block walking but not the camera
    this.rim = rimFn(R, seed);
  }

  // ── colliders (local coords). h = height, used for camera occlusion ──
  box(x, z, w, d, h = 4) { this.colliders.push({ t: 'b', x, z, hw: w / 2, hd: d / 2, h }); }
  circle(x, z, r, h = 2) { this.colliders.push({ t: 'c', x, z, r, h }); }
  block(x, z, r) { this.noWalk.push({ x, z, r }); }

  spot(id, x, z, o = {}) {
    const s = { id, island: this, x, z, glowY: o.glowY ?? 1.4, label: o.label ?? id, reach: o.reach ?? 2.6, glowX: o.glowX ?? x, glowZ: o.glowZ ?? z };
    this.spots.push(s);
    return s;
  }

  insideRim(x, z, margin = 1.2) {
    const a = Math.atan2(z, x);
    return Math.hypot(x, z) < this.rim(a) - margin;
  }

  blocked(x, z, pad = AV_R) {
    if (!this.insideRim(x, z, 1.0 + pad)) return true;
    for (const c of this.colliders) {
      if (c.t === 'c') { if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true; }
      else if (Math.abs(x - c.x) < c.hw + pad && Math.abs(z - c.z) < c.hd + pad) return true;
    }
    for (const c of this.noWalk) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    return false;
  }

  // push a local position out of colliders and back inside the rim
  resolve(p) {
    for (let it = 0; it < 3; it++) {
      for (const c of [...this.colliders, ...this.noWalk.map((n) => ({ t: 'c', ...n }))]) {
        if (c.t === 'c') {
          const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + AV_R;
          if (d < m && d > 1e-5) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
        } else {
          const qx = Math.max(c.x - c.hw, Math.min(p.x, c.x + c.hw));
          const qz = Math.max(c.z - c.hd, Math.min(p.z, c.z + c.hd));
          const dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
          if (d < AV_R) {
            if (d > 1e-5) { p.x = qx + dx / d * AV_R; p.z = qz + dz / d * AV_R; }
            else { // inside the box: exit via the nearest face
              const ex = c.hw - Math.abs(p.x - c.x), ez = c.hd - Math.abs(p.z - c.z);
              if (ex < ez) p.x = c.x + Math.sign(p.x - c.x || 1) * (c.hw + AV_R);
              else p.z = c.z + Math.sign(p.z - c.z || 1) * (c.hd + AV_R);
            }
          }
        }
      }
      this.clampRim(p);
    }
    return p;
  }

  clampRim(p) {
    const a = Math.atan2(p.z, p.x), lim = this.rim(a) - 1.4, d = Math.hypot(p.x, p.z);
    if (d > lim) { p.x *= lim / d; p.z *= lim / d; }
  }

  // ── nav grid + A* ──
  buildNav() {
    const n = this.navN = Math.ceil((this.R * 2.2) / CELL);
    this.navO = -n * CELL / 2;
    this.nav = new Uint8Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = this.navO + (i + 0.5) * CELL, z = this.navO + (j + 0.5) * CELL;
      this.nav[j * n + i] = this.blocked(x, z, AV_R + 0.12) ? 1 : 0;
    }
  }
  cellOf(x, z) { return [Math.floor((x - this.navO) / CELL), Math.floor((z - this.navO) / CELL)]; }
  cellPos(i, j) { return [this.navO + (i + 0.5) * CELL, this.navO + (j + 0.5) * CELL]; }
  free(i, j) { return i >= 0 && j >= 0 && i < this.navN && j < this.navN && !this.nav[j * this.navN + i]; }

  nearestFree(i, j) {
    if (this.free(i, j)) return [i, j];
    for (let r = 1; r < 30; r++) {
      let best = null, bd = 1e9;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (this.free(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } }
      }
      if (best) return best;
    }
    return null;
  }

  lineFree(x1, z1, x2, z2) {
    const L = Math.hypot(x2 - x1, z2 - z1), steps = Math.ceil(L / (CELL * 0.5));
    for (let s = 0; s <= steps; s++) {
      const t = s / Math.max(steps, 1);
      const [i, j] = this.cellOf(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t);
      if (!this.free(i, j)) return false;
    }
    return true;
  }

  findPath(fx, fz, tx, tz) {
    const n = this.navN;
    const s = this.nearestFree(...this.cellOf(fx, fz));
    const g = this.nearestFree(...this.cellOf(tx, tz));
    if (!s || !g) return null;
    const goalExact = this.free(...this.cellOf(tx, tz));
    const key = (i, j) => j * n + i;
    const open = new Heap(), came = new Map(), cost = new Map([[key(s[0], s[1]), 0]]), closed = new Set();
    open.push([0, s[0], s[1]]);
    const H = (i, j) => Math.hypot(i - g[0], j - g[1]);
    let found = false, guard = 0;
    while (open.size && guard++ < 40000) {
      const [, ci, cj] = open.pop();
      if (closed.has(key(ci, cj))) continue;
      closed.add(key(ci, cj));
      if (ci === g[0] && cj === g[1]) { found = true; break; }
      const cc = cost.get(key(ci, cj));
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (!this.free(ni, nj)) continue;
        if (di && dj && (!this.free(ci + di, cj) || !this.free(ci, cj + dj))) continue;
        const nc = cc + (di && dj ? 1.414 : 1), k = key(ni, nj);
        if (nc < (cost.get(k) ?? 1e9)) { cost.set(k, nc); came.set(k, key(ci, cj)); open.push([nc + H(ni, nj), ni, nj]); }
      }
    }
    if (!found) return null;
    const cells = [];
    let k = key(g[0], g[1]);
    while (k !== undefined) { cells.push([k % n, Math.floor(k / n)]); k = came.get(k); }
    cells.reverse();
    const pts = cells.map(([i, j]) => this.cellPos(i, j));
    if (goalExact) pts[pts.length - 1] = [tx, tz];
    // string-pull
    const out = [[fx, fz]];
    let a = 0;
    while (a < pts.length - 1) {
      let bst = a + 1;
      for (let c = pts.length - 1; c > a + 1; c--) if (this.lineFree(out[out.length - 1][0], out[out.length - 1][1], pts[c][0], pts[c][1])) { bst = c; break; }
      out.push(pts[bst]);
      a = bst;
    }
    return out.slice(1);
  }

  // ── camera occluders in world space ──
  occluders() {
    if (this._occ) return this._occ;
    const c = this.center;
    this._occ = this.colliders.filter((o) => o.h > 2.2).map((o) => {
      const hw = o.t === 'c' ? o.r : o.hw, hd = o.t === 'c' ? o.r : o.hd;
      return new THREE.Box3(new THREE.Vector3(c.x + o.x - hw, c.y, c.z + o.z - hd), new THREE.Vector3(c.x + o.x + hw, c.y + o.h, c.z + o.z + hd));
    });
    return this._occ;
  }

  // ── sky gate (travel point) ──
  addGate(x, z, ry = 0) {
    const b = this.b;
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    b.cyl(1.9, 2.2, 0.35, 10, '#b7ab9c', 0, 0, 0, { matrix: m });
    b.cyl(1.5, 1.7, 0.2, 10, '#d6cbb9', 0, 0.35, 0, { matrix: m });
    b.add(new THREE.TorusGeometry(1.55, 0.22, 8, 28), '#c8bba8', 0, 2.05, 0, { matrix: m, jitter: 0.1 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      b.box(0.3, 0.3, 0.5, '#e7d7b5', Math.cos(a) * 1.55, 2.05 + Math.sin(a) * 1.55 - 0.15, 0, { matrix: m, rz: a });
    }
    b.sphere(0.2, '#ffe6a3', 0, 3.85, 0, { matrix: m, layer: 'glow', ao: false, jitter: 0 });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.36, 40), gateMat);
    disc.position.set(x, 2.05, z);
    disc.rotation.y = ry;
    this.extras.add(disc);
    const back = disc.clone(); back.rotation.y = ry + Math.PI; this.extras.add(back);
    this.circle(x, z, 2.0, 4.2);
    this.gate = this.spot('gate', x + Math.sin(ry) * 2.6, z + Math.cos(ry) * 2.6, { label: 'Sky Gate', reach: 3.2, glowY: 2 });
    this.gate.isGate = true;
    this.landing = { x: this.gate.x, z: this.gate.z, face: ry };
  }

  // raised walkable areas (bridges arch, platforms are flat with soft edges)
  lift(x, z, hw, hd, h, o = {}) { (this.lifts ||= []).push({ x, z, hw, hd, h, arch: o.arch, axis: o.axis ?? 'x', ramp: o.ramp ?? 0.8 }); }
  heightAt(x, z) {
    let y = 0;
    for (const l of this.lifts || []) {
      const dx = Math.abs(x - l.x), dz = Math.abs(z - l.z);
      if (dx > l.hw || dz > l.hd) continue;
      if (l.arch) {
        const t = l.axis === 'x' ? (x - l.x + l.hw) / (2 * l.hw) : (z - l.z + l.hd) / (2 * l.hd);
        y = Math.max(y, Math.sin(t * Math.PI) * l.h);
      } else {
        const e = Math.min(l.hw - dx, l.hd - dz);
        y = Math.max(y, l.h * Math.min(1, e / l.ramp));
      }
    }
    return y;
  }

  // a stream from pts[0] to the rim, ending in a waterfall into the sky
  addStream(pts, width = 1.6, o = {}) {
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const dir = new THREE.Vector2(last[0] - prev[0], last[1] - prev[1]).normalize();
    const edge = this.rim(Math.atan2(last[1], last[0])) + 0.6;
    const full = [...pts.slice(0, -1), [Math.cos(Math.atan2(last[1], last[0])) * edge, Math.sin(Math.atan2(last[1], last[0])) * edge]];
    this.gp.path(full, width + 0.7, o.bank ?? '#8a7a5c');
    this.gp.path(full, width, '#4f9cc0');
    // ribbon mesh
    const P = [], I = [];
    for (let i = 0; i < full.length; i++) {
      const p = full[i], q = full[Math.min(i + 1, full.length - 1)], pp = full[Math.max(i - 1, 0)];
      const tx = q[0] - pp[0], tz = q[1] - pp[1], L = Math.hypot(tx, tz) || 1;
      const nx = -tz / L * width / 2, nz = tx / L * width / 2;
      P.push(p[0] + nx, 0.06, p[1] + nz, p[0] - nx, 0.06, p[1] - nz);
      if (i) { const k = (i - 1) * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setIndex(I);
    const ribbon = new THREE.Mesh(g, waterMat);
    this.extras.add(ribbon);
    // block walking along the stream except where bridges sit
    for (let i = 0; i < full.length - 1; i++) {
      const [x1, z1] = full[i], [x2, z2] = full[i + 1], L = Math.hypot(x2 - x1, z2 - z1);
      for (let s = 0; s <= L; s += 0.6) {
        const x = x1 + (x2 - x1) * s / L, z = z1 + (z2 - z1) * s / L;
        if ((o.bridges || []).some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br)) continue;
        this.block(x, z, width / 2);
      }
    }
    const fall = waterfall(width * 1.1, this.center.y - SEA_Y + 4);
    const end = full[full.length - 1];
    fall.position.set(end[0], 0.05, end[1]);
    fall.rotation.y = Math.atan2(dir.x, dir.y);
    this.extras.add(fall);
    const fall2 = fall.clone(); fall2.rotation.y += Math.PI / 2; fall2.scale.x = 0.6; this.extras.add(fall2);
    return fall;
  }

  addPond(x, z, rad, o = {}) {
    this.gp.circle(x, z, rad + 0.4, o.bank ?? '#8f8166');
    this.gp.circle(x, z, rad, '#4f9cc0');
    const w = new THREE.Mesh(new THREE.CircleGeometry(rad, 36).rotateX(-Math.PI / 2), waterMat);
    w.position.set(x, 0.07, z);
    this.extras.add(w);
    for (let i = 0; i < Math.round(rad * 5); i++) {
      const a = (i / Math.round(rad * 5)) * Math.PI * 2 + this.b.r() * 0.2;
      if (o.gap && Math.abs(((a - o.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.35) continue;
      this.b.ico(0.32 + this.b.r() * 0.2, o.stone ?? '#b3a996', x + Math.cos(a) * (rad + 0.1), 0, z + Math.sin(a) * (rad + 0.1), { detail: 0, sy: 0.55, jitter: 0.12 });
    }
    this.block(x, z, rad + 0.2);
  }

  // ── storybook wooden signpost ──
  addSign(x, z, ry = 0, sub = this.info.era) {
    const b = this.b;
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    for (const sx of [-1.05, 1.05]) b.box(0.14, 2.2, 0.14, '#6e4c33', sx, 0, -0.06, { matrix: m });
    const sign = textPlane(2.4, 1.1, (g, w, h) => signArt(g, w, h, this.info.name, sub), { px: 256 });
    sign.position.set(x, 1.55, z);
    sign.rotation.y = ry;
    sign.position.add(new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(0.02));
    this.extras.add(sign);
    b.box(2.5, 1.2, 0.1, '#7a5638', 0, 0.95, -0.08, { matrix: m });
    this.circle(x, z, 1.1, 2.2);
  }

  finalize(scene) {
    const base = islandBase({ R: this.R, seed: this.seed, groundTex: this.gp.texture(), depth: this.depth, b: this.b, ...this.underOpts });
    this.ground = base.top;
    this.ground.userData.island = this;
    this.group.add(base.group);
    const merged = this.b.build();
    merged.traverse((o) => { o.userData.island = this; });
    this.group.add(merged);
    this.buildNav();
    scene.add(this.group);
    return this;
  }

  update(t, dt) { for (const f of this.updaters) f(t, dt); }
}

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(v) {
    const a = this.a; a.push(v);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

const gateMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.FrontSide,
  uniforms: { uTime: U.time },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `varying vec2 vUv; uniform float uTime;
    void main(){
      vec2 p=vUv-0.5; float r=length(p)*2.0; float a=atan(p.y,p.x);
      float sw = sin(a*3.0 - r*9.0 + uTime*1.8)*0.5+0.5;
      float sw2 = sin(a*5.0 + r*6.0 - uTime*1.1)*0.5+0.5;
      vec3 c = mix(vec3(0.55,0.85,0.95), vec3(1.0,0.86,0.55), sw);
      c = mix(c, vec3(1.0,0.97,0.9), pow(sw2,6.0)*0.6);
      float alpha = (0.35 + 0.45*sw*sw2) * smoothstep(1.0,0.75,r) + smoothstep(0.35,0.0,r)*0.4;
      gl_FragColor=vec4(c, alpha*0.9);
    }`,
});

export function signArt(g, w, h, title, sub) {
  g.fillStyle = '#e9d6b0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(140,100,60,${0.05 + Math.random() * 0.08})`; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y + 2); g.stroke(); }
  g.strokeStyle = '#7a5235'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#3e2a1c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${h * 0.27}px Fraunces, Georgia, serif`;
  g.fillText(title.toUpperCase(), w / 2, h * 0.4, w * 0.86);
  g.font = `italic 500 ${h * 0.17}px Fraunces, Georgia, serif`;
  g.fillStyle = '#6a4a32';
  g.fillText(sub, w / 2, h * 0.7, w * 0.86);
}

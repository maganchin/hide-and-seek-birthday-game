// Shared building blocks: materials, a merged-geometry builder, painterly
// canvas textures and the floating-island base.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const U = {
  time: { value: 0 },
  sway: { value: 1 },        // 0 when reduced motion is on
};

export const IS_MOBILE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;

// ── deterministic randomness so the world looks the same every visit ──────
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── materials ───────────────────────────────────────────────────────────────
function toonRamp() {
  const d = new Uint8Array([110, 160, 205, 238, 255]);
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
export const RAMP = toonRamp();

function addSway(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uSway = U.sway;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float sway;\nuniform float uTime;\nuniform float uSway;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 swW = modelMatrix * vec4(position, 1.0);
        float swP = swW.x * 0.35 + swW.z * 0.27;
        transformed.x += sin(uTime * 1.6 + swP) * sway * uSway;
        transformed.z += cos(uTime * 1.25 + swP * 1.3) * sway * uSway * 0.6;`);
  };
  mat.customProgramCacheKey = () => 'sway' + mat.type;
  return mat;
}

export const MAT = {
  lit: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP }),
  sway: addSway(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP })),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  glowSway: addSway(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })),
};

export function toonMat(opts) {
  return new THREE.MeshToonMaterial({ gradientMap: RAMP, ...opts });
}

// ── merged builder: everything static on an island becomes a few draw calls ─
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _c = new THREE.Color();

export class Builder {
  constructor(seed = 7) {
    this.layers = { lit: [], sway: [], glow: [], glowSway: [] };
    this.r = rng(seed);
  }
  // opts: layer, jitter (per-face colour variation), sway (amount), swayBase (y),
  //       swayMode 'up' (things that grow up) | 'down' (things that hang), ao (bool)
  add(geo, color, x = 0, y = 0, z = 0, o = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    _e.set(o.rx || 0, o.ry || 0, o.rz || 0);
    _q.setFromEuler(_e);
    const sc = o.s ?? 1;
    _s.set(o.sx ?? sc, o.sy ?? sc, o.sz ?? sc);
    _m.compose(_p.set(x, y, z), _q, _s);
    if (o.matrix) _m.premultiply(o.matrix);
    g.applyMatrix4(_m);
    const pos = g.attributes.position, n = pos.count;
    const col = new Float32Array(n * 3);
    _c.set(color);
    const jit = o.jitter ?? 0.06;
    const ao = o.ao ?? true;
    const g0 = o.grad ? new THREE.Color(o.grad[0]) : null, g1 = o.grad ? new THREE.Color(o.grad[1]) : null;
    for (let i = 0; i < n; i += 3) {
      const f = 1 + (this.r() - 0.5) * 2 * jit;
      for (let k = 0; k < 3 && i + k < n; k++) {
        const vy = pos.getY(i + k);
        const a = ao ? 0.72 + 0.28 * Math.min(1, Math.max(0, (vy - (o.aoBase ?? 0)) / 1.6)) : 1;
        if (g0) _c.lerpColors(g0, g1, Math.min(1, Math.max(0, (vy - y) / o.grad[2])));
        col[(i + k) * 3] = _c.r * f * a;
        col[(i + k) * 3 + 1] = _c.g * f * a;
        col[(i + k) * 3 + 2] = _c.b * f * a;
      }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const layer = o.layer || (o.sway ? 'sway' : 'lit');
    if (layer === 'sway' || layer === 'glowSway') {
      const sw = new Float32Array(n);
      const base = o.swayBase ?? y;
      const amt = o.sway ?? 0.1;
      for (let i = 0; i < n; i++) {
        const d = o.swayMode === 'down' ? base - pos.getY(i) : pos.getY(i) - base;
        sw[i] = Math.max(0, d) * amt;
      }
      g.setAttribute('sway', new THREE.BufferAttribute(sw, 1));
    }
    this.layers[layer].push(g);
    return this;
  }
  box(w, h, d, color, x, y, z, o = {}) { return this.add(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2 * (o.s ?? o.sy ?? 1) * (o.center ? 0 : 1), z, o); }
  cyl(rt, rb, h, seg, color, x, y, z, o = {}) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), color, x, y + h / 2 * (o.center ? 0 : 1), z, o); }
  cone(r, h, seg, color, x, y, z, o = {}) { return this.add(new THREE.ConeGeometry(r, h, seg), color, x, y + h / 2, z, o); }
  sphere(r, color, x, y, z, o = {}) { return this.add(new THREE.SphereGeometry(r, o.ws ?? 10, o.hs ?? 8), color, x, y, z, o); }
  ico(r, color, x, y, z, o = {}) { return this.add(new THREE.IcosahedronGeometry(r, o.detail ?? 1), color, x, y, z, o); }

  build() {
    const grp = new THREE.Group();
    for (const [k, list] of Object.entries(this.layers)) {
      if (!list.length) continue;
      const mesh = new THREE.Mesh(mergeGeometries(list), MAT[k]);
      mesh.castShadow = k === 'lit' || k === 'sway';
      mesh.receiveShadow = k === 'lit' || k === 'sway';
      mesh.name = k;
      grp.add(mesh);
    }
    return grp;
  }
}

// ── reusable props (all go through a Builder) ──────────────────────────────
export const P = {
  tree(b, x, z, o = {}) {
    const r = b.r, h = o.h ?? 2 + r() * 1.5, s = o.s ?? 1;
    const leaf = o.leaf ?? ['#5f9a4a', '#6fae55', '#4f8a44', '#7bb85e'][Math.floor(r() * 4)];
    b.cyl(0.14 * s, 0.22 * s, h * s, 6, o.trunk ?? '#6b4a33', x, o.y ?? 0, z);
    const top = (o.y ?? 0) + h * s;
    const n = o.puffs ?? 4;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = i === 0 ? 0 : 0.55 * s;
      const c = new THREE.Color(leaf).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.3) * 0.08);
      b.ico((0.85 + r() * 0.4) * s * (i === 0 ? 1.15 : 0.85), c, x + Math.cos(a) * d, top + (i === 0 ? 0.2 : -0.1 + r() * 0.5) * s, z + Math.sin(a) * d,
        { sway: 0.035, swayBase: o.y ?? 0, layer: 'sway', jitter: 0.1, detail: 1 });
    }
  },
  pine(b, x, z, o = {}) {
    const s = o.s ?? 1, y = o.y ?? 0, r = b.r;
    b.cyl(0.1 * s, 0.16 * s, 0.9 * s, 5, '#5a3d2a', x, y, z);
    const col = o.color ?? '#3f6e4a';
    for (let i = 0; i < 3; i++) {
      b.cone((1.1 - i * 0.28) * s, 1.3 * s, 7, new THREE.Color(col).offsetHSL(0, 0, (r() - 0.5) * 0.06), x, y + (0.7 + i * 0.75) * s, z,
        { layer: 'sway', sway: 0.025, swayBase: y, jitter: 0.08, ry: r() * 3 });
    }
  },
  blossom(b, x, z, o = {}) {
    const r = b.r, s = o.s ?? 1, y = o.y ?? 0;
    b.cyl(0.12 * s, 0.2 * s, 1.6 * s, 6, '#5a3b33', x, y, z, { rz: (r() - 0.5) * 0.2 });
    const pinks = o.colors ?? ['#f6b8cf', '#f3a6c3', '#fbd0de', '#eea0bd'];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + r(), d = i === 0 ? 0 : (0.7 + r() * 0.3) * s;
      b.ico((0.6 + r() * 0.35) * s, pinks[Math.floor(r() * pinks.length)], x + Math.cos(a) * d, y + (1.9 + r() * 0.6) * s, z + Math.sin(a) * d,
        { layer: 'sway', sway: 0.04, swayBase: y, jitter: 0.08, detail: 1 });
    }
  },
  flowers(b, cx, cz, rad, n, colors, o = {}) {
    const r = b.r, y = o.y ?? 0;
    const stem = new THREE.CylinderGeometry(0.02, 0.02, 1, 3);
    const head = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (o.ok && !o.ok(x, z)) continue;
      const h = 0.25 + r() * 0.35;
      b.add(stem, '#4f8a3f', x, y + h / 2, z, { sy: h, layer: 'sway', sway: 0.25, swayBase: y, ao: false });
      b.add(head, colors[Math.floor(r() * colors.length)], x, y + h, z, { s: 0.09 + r() * 0.05, layer: 'sway', sway: 0.25, swayBase: y, ao: false, jitter: 0.02 });
    }
  },
  grassTufts(b, cx, cz, rad, n, color, o = {}) {
    const r = b.r, y = o.y ?? 0;
    const g = new THREE.ConeGeometry(0.06, 1, 3);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (o.ok && !o.ok(x, z)) continue;
      for (let k = 0; k < 3; k++) {
        const h = 0.25 + r() * 0.3;
        b.add(g, new THREE.Color(color).offsetHSL(0, 0, (r() - 0.5) * 0.1), x + (r() - 0.5) * 0.2, y + h / 2, z + (r() - 0.5) * 0.2,
          { sy: h, rz: (r() - 0.5) * 0.5, rx: (r() - 0.5) * 0.5, layer: 'sway', sway: 0.2, swayBase: y, ao: false });
      }
    }
  },
  lamp(b, x, z, o = {}) {
    const y = o.y ?? 0, h = o.h ?? 2.6;
    b.cyl(0.05, 0.08, h, 6, o.pole ?? '#2f3a36', x, y, z);
    b.cyl(0.18, 0.12, 0.08, 6, o.pole ?? '#2f3a36', x, y + h, z);
    b.sphere(0.17, o.light ?? '#ffd88a', x, y + h + 0.12, z, { layer: 'glow', ao: false, jitter: 0 });
    b.cone(0.22, 0.18, 6, o.pole ?? '#2f3a36', x, y + h + 0.26, z);
  },
  // hanging lantern (sways as a pendulum around its hook)
  lantern(b, x, y, z, o = {}) {
    const c = o.color ?? '#e0412f';
    const hook = y + 0.5;
    b.cyl(0.008, 0.008, 0.5, 3, '#3a2a20', x, y, z, { layer: 'glowSway', sway: 0.12, swayBase: hook, swayMode: 'down', ao: false });
    b.sphere(0.24 * (o.s ?? 1), c, x, y - 0.12, z, { sy: 1.15, layer: 'glowSway', sway: 0.12, swayBase: hook, swayMode: 'down', ao: false, jitter: 0, ws: 10, hs: 8 });
    b.cyl(0.1, 0.1, 0.06, 6, '#c9962e', x, y + 0.12, z, { layer: 'glowSway', sway: 0.12, swayBase: hook, swayMode: 'down', ao: false });
    b.cyl(0.1, 0.1, 0.06, 6, '#c9962e', x, y - 0.44, z, { layer: 'glowSway', sway: 0.12, swayBase: hook, swayMode: 'down', ao: false });
  },
  bench(b, x, z, ry = 0, o = {}) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, o.y ?? 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    const wood = o.wood ?? '#8a5a3a', iron = o.iron ?? '#2f3330';
    b.box(1.6, 0.08, 0.5, wood, 0, 0.45, 0, { matrix: m });
    b.box(1.6, 0.4, 0.07, wood, 0, 0.55, -0.24, { matrix: m, rx: -0.15 });
    for (const sx of [-0.7, 0.7]) b.box(0.08, 0.45, 0.45, iron, sx, 0, 0, { matrix: m });
  },
  rock(b, x, z, s, color = '#9a8f86', o = {}) {
    b.ico(s, color, x, (o.y ?? 0) + s * 0.3, z, { detail: 0, sy: o.sy ?? 0.65, ry: b.r() * 6, jitter: 0.12 });
  },
  // window grid on the faces of a box centred at (x,z) with footprint w×d
  windows(b, x, z, w, d, y0, y1, rows, cols, o = {}) {
    const r = b.r, faces = o.faces ?? 'nsew';
    const lit = o.lit ?? 0.6, ww = o.ww ?? 0.4, wh = o.wh ?? 0.55;
    const on = o.on ?? ['#ffd27e', '#ffc46b', '#ffe3a8'], off = o.off ?? '#4e4a5e';
    for (const f of faces) {
      const along = f === 'n' || f === 's' ? w : d;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const u = -along / 2 + (i + 0.5) * along / cols, y = y0 + (j + 0.5) * (y1 - y0) / rows - wh / 2;
        const isOn = r() < lit;
        const c = isOn ? on[Math.floor(r() * on.length)] : off;
        const layer = isOn ? 'glow' : 'lit';
        const t = 0.06;
        if (f === 's') b.box(ww, wh, t, c, x + u, y, z + d / 2 + 0.01, { layer, ao: false, jitter: 0.03 });
        if (f === 'n') b.box(ww, wh, t, c, x + u, y, z - d / 2 - 0.01, { layer, ao: false, jitter: 0.03 });
        if (f === 'e') b.box(t, wh, ww, c, x + w / 2 + 0.01, y, z + u, { layer, ao: false, jitter: 0.03 });
        if (f === 'w') b.box(t, wh, ww, c, x - w / 2 - 0.01, y, z + u, { layer, ao: false, jitter: 0.03 });
      }
    }
  },
  fence(b, pts, color = '#8b6644', o = {}) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
      const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
      b.box(0.09, 0.85, 0.09, color, x1, 0, z1);
      for (const h of [0.35, 0.68]) b.box(0.05, 0.07, L, color, (x1 + x2) / 2, h, (z1 + z2) / 2, { ry: a });
      if (i === pts.length - 2) b.box(0.09, 0.85, 0.09, color, x2, 0, z2);
    }
  },
};

// ── canvas textures ─────────────────────────────────────────────────────────
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

// a sign / poster as a flat textured plane
export function textPlane(w, h, draw, o = {}) {
  const px = o.px ?? 256;
  const tex = canvasTex(Math.round(px * w / h), px, draw);
  const mat = o.glow ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: !!o.transparent, side: THREE.DoubleSide })
    : new THREE.MeshToonMaterial({ map: tex, gradientMap: RAMP, transparent: !!o.transparent, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

export function softDot(size = 64, inner = 'rgba(255,240,200,1)', outer = 'rgba(255,200,120,0)') {
  return canvasTex(size, size, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)')); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}

// Painterly ground painter. Coordinates are island-local metres.
export class GroundPainter {
  constructor(R, size, seed) {
    this.R = R; this.S = size; this.r = rng(seed);
    this.c = document.createElement('canvas');
    this.c.width = this.c.height = size;
    this.g = this.c.getContext('2d');
  }
  X(x) { return (x / this.R * 0.5 + 0.5) * this.S; }
  Z(z) { return (z / this.R * 0.5 + 0.5) * this.S; }
  L(l) { return l / this.R * 0.5 * this.S; }
  base(colors, dabs = 9000) {
    const g = this.g, S = this.S, r = this.r;
    g.fillStyle = colors[0]; g.fillRect(0, 0, S, S);
    for (let i = 0; i < dabs; i++) {
      g.globalAlpha = 0.1 + r() * 0.18;
      g.fillStyle = colors[Math.floor(r() * colors.length)];
      const x = r() * S, y = r() * S, rr = S * (0.002 + r() * 0.008);
      g.beginPath(); g.ellipse(x, y, rr * 1.8, rr, r() * Math.PI, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    return this;
  }
  dabs(cx, cz, rad, colors, n = 300, size = 0.25) {
    const g = this.g, r = this.r;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      g.globalAlpha = 0.25 + r() * 0.4;
      g.fillStyle = colors[Math.floor(r() * colors.length)];
      const rr = this.L(size * (0.5 + r()));
      g.beginPath(); g.ellipse(this.X(cx + Math.cos(a) * d), this.Z(cz + Math.sin(a) * d), rr * 1.6, rr, r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    return this;
  }
  path(pts, width, color, edge) {
    const g = this.g;
    const stroke = (w, c, a = 1) => {
      g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = this.L(w); g.lineCap = g.lineJoin = 'round';
      g.beginPath(); g.moveTo(this.X(pts[0][0]), this.Z(pts[0][1]));
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, mz = (pts[i][1] + pts[i + 1][1]) / 2;
        g.quadraticCurveTo(this.X(pts[i][0]), this.Z(pts[i][1]), this.X(mx), this.Z(mz));
      }
      const e = pts[pts.length - 1]; g.lineTo(this.X(e[0]), this.Z(e[1])); g.stroke();
    };
    if (edge) stroke(width + 0.5, edge, 0.6);
    stroke(width, color);
    stroke(width * 0.55, '#ffffff', 0.07);
    g.globalAlpha = 1;
    return this;
  }
  rect(x, z, w, d, color, o = {}) {
    const g = this.g;
    if (o.edge) { g.fillStyle = o.edge; g.fillRect(this.X(x - w / 2 - 0.25), this.Z(z - d / 2 - 0.25), this.L(w + 0.5), this.L(d + 0.5)); }
    g.fillStyle = color; g.fillRect(this.X(x - w / 2), this.Z(z - d / 2), this.L(w), this.L(d));
    if (o.tiles) {
      g.strokeStyle = o.tiles; g.lineWidth = 1; g.globalAlpha = 0.35;
      for (let i = x - w / 2; i <= x + w / 2; i += o.step ?? 1) { g.beginPath(); g.moveTo(this.X(i), this.Z(z - d / 2)); g.lineTo(this.X(i), this.Z(z + d / 2)); g.stroke(); }
      for (let i = z - d / 2; i <= z + d / 2; i += o.step ?? 1) { g.beginPath(); g.moveTo(this.X(x - w / 2), this.Z(i)); g.lineTo(this.X(x + w / 2), this.Z(i)); g.stroke(); }
      g.globalAlpha = 1;
    }
    return this;
  }
  circle(x, z, rad, color, edge) {
    const g = this.g;
    if (edge) { g.fillStyle = edge; g.beginPath(); g.arc(this.X(x), this.Z(z), this.L(rad + 0.3), 0, 7); g.fill(); }
    g.fillStyle = color; g.beginPath(); g.arc(this.X(x), this.Z(z), this.L(rad), 0, 7); g.fill();
    return this;
  }
  texture() {
    const t = new THREE.CanvasTexture(this.c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
}

// ── floating island base ───────────────────────────────────────────────────
export function rimFn(R, seed) {
  const r = rng(seed);
  const p = [r() * 6, r() * 6, r() * 6];
  return (a) => R * (1 + 0.05 * Math.sin(3 * a + p[0]) + 0.035 * Math.sin(5 * a + p[1]) + 0.02 * Math.sin(11 * a + p[2]));
}

export function islandBase({ R, seed, groundTex, depth = 30, grass = '#5d9447', soil = '#8a5a3c', rock = ['#a8775a', '#8f6450', '#b98a68', '#7a5546'], b }) {
  const rim = rimFn(R, seed);
  const r = rng(seed + 11);
  const group = new THREE.Group();

  // top: polar grid so the rim noise scales smoothly toward the centre
  const segA = 96, segR = 10;
  const pos = [], uv = [], idx = [];
  pos.push(0, 0, 0); uv.push(0.5, 0.5);
  for (let j = 1; j <= segR; j++) {
    for (let i = 0; i < segA; i++) {
      const a = (i / segA) * Math.PI * 2, rr = rim(a) * (j / segR);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      pos.push(x, 0, z); uv.push(x / R * 0.5 + 0.5, 1 - (z / R * 0.5 + 0.5));
    }
  }
  for (let i = 0; i < segA; i++) idx.push(0, 1 + ((i + 1) % segA), 1 + i);
  for (let j = 1; j < segR; j++) {
    const o0 = 1 + (j - 1) * segA, o1 = 1 + j * segA;
    for (let i = 0; i < segA; i++) {
      const i2 = (i + 1) % segA;
      idx.push(o0 + i, o0 + i2, o1 + i, o0 + i2, o1 + i2, o1 + i);
    }
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  tg.setIndex(idx);
  tg.computeVertexNormals();
  groundTex.flipY = true;
  const top = new THREE.Mesh(tg, toonMat({ map: groundTex }));
  top.receiveShadow = true;
  top.name = 'ground';
  group.add(top);

  // underside: tapering rock with strata, slightly lumpy
  const rings = 14, up = [], uc = [], ui = [];
  const strata = (y) => rock[Math.floor((-y * 0.45 + Math.sin(y * 0.3) * 1.5 + 100)) % rock.length];
  const col = new THREE.Color();
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const y = j === 0 ? 0 : j === 1 ? -0.5 : -0.5 - Math.pow((t - 1 / rings) / (1 - 1 / rings), 1.15) * depth;
    let prof = j === 0 ? 1 : j === 1 ? 1.025 : Math.pow(1 - (t - 1 / rings) / (1 - 1 / rings), 0.75) * 0.98;
    for (let i = 0; i <= segA; i++) {
      const a = (i / segA) * Math.PI * 2;
      const lump = j > 1 ? 1 + (r() - 0.5) * 0.12 + 0.08 * Math.sin(a * 7 + j) : 1;
      const rr = rim(a) * Math.max(prof, 0.02) * lump;
      up.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
      if (j <= 1) col.set(j === 0 ? grass : new THREE.Color(grass).multiplyScalar(0.8));
      else if (j === 2) col.set(soil);
      else col.set(strata(y)).multiplyScalar(0.85 + r() * 0.2 - t * 0.25);
      uc.push(col.r, col.g, col.b);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segA; i++) {
      const a = j * (segA + 1) + i, c = a + segA + 1;
      ui.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }
  let ug = new THREE.BufferGeometry();
  ug.setAttribute('position', new THREE.Float32BufferAttribute(up, 3));
  ug.setAttribute('color', new THREE.Float32BufferAttribute(uc, 3));
  ug.setIndex(ui);
  ug = ug.toNonIndexed();
  ug.computeVertexNormals();
  const under = new THREE.Mesh(ug, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP }));
  under.name = 'under';
  group.add(under);

  // hanging roots and vines under the rim
  if (b) {
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2, rr = rim(a) * (0.93 + r() * 0.05), L = 1 + r() * 4;
      b.cone(0.12 + r() * 0.1, L, 4, r() < 0.6 ? '#4f7f3c' : '#6b4b35', Math.cos(a) * rr, -0.4 - L, Math.sin(a) * rr, { rx: Math.PI, ao: false, layer: 'sway', sway: 0.03, swayBase: -0.4, swayMode: 'down' });
    }
  }
  return { group, rim, top };
}

// waterfall ribbon from an island edge down toward the sea
const fallMat = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time },
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `varying vec2 vUv; uniform float uTime;
    float h(float n){return fract(sin(n)*43758.5453);}
    void main(){
      float x=vUv.x, y=vUv.y;
      float col=floor(x*14.0);
      float speed=0.9+h(col)*0.5;
      float s=fract(y*6.0 + uTime*speed*0.6 + h(col)*3.0);
      float streak=smoothstep(0.0,0.25,s)*smoothstep(1.0,0.55,s);
      float edge=smoothstep(0.0,0.18,x)*smoothstep(1.0,0.82,x);
      vec3 c=mix(vec3(0.62,0.82,0.95), vec3(1.0), streak*0.7);
      float fade=smoothstep(0.0,0.35,y);
      gl_FragColor=vec4(c, (0.55+streak*0.4)*edge*fade);
    }`,
});
export function waterfall(width, height) {
  const g = new THREE.PlaneGeometry(width, height, 1, 1);
  g.translate(0, -height / 2, 0);
  const m = new THREE.Mesh(g, fallMat);
  m.renderOrder = 2;
  return m;
}

// shimmering pond/stream surface
export const waterMat = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time, uDeep: { value: new THREE.Color('#3f8fb5') }, uLight: { value: new THREE.Color('#8fd4e8') } },
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: `varying vec3 vW; uniform float uTime; uniform vec3 uDeep; uniform vec3 uLight;
    void main(){
      float r = sin(vW.x*1.3+uTime*1.2)*sin(vW.z*1.1-uTime*0.9) + sin((vW.x+vW.z)*2.3+uTime*2.0)*0.5;
      vec3 c = mix(uDeep, uLight, 0.45+0.3*r);
      float sp = step(1.35, r + sin(vW.x*7.0+uTime*3.0)*sin(vW.z*6.0-uTime*2.4)*0.6);
      c += sp*0.6;
      gl_FragColor=vec4(c,0.88);
    }`,
});

// triangular prism: triangle (width w, height h) in the XY plane, extruded
// along Z by len and centred. Rotate ry=π/2 for a roof running along X.
export function gable(w, h, len) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  return g;
}

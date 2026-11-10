// The birthday person's avatar: a small storybook figure whose skin and hair
// colours come from world.config.js, dressed in one of the wardrobe outfits.
// Plus a chubby cat who waddles along behind.
import * as THREE from 'three';
import { toonMat, softDot } from './kit.js';
import { PERSON } from './content.js';

const SKIN = PERSON.look.skin || '#efcfb6', HAIR = PERSON.look.hair || '#1b1719', NAVY = '#1f3552';

// teal silk with navy peonies and leafy branches, painted once
function partyTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 512, 0);
  grd.addColorStop(0, '#4a7c8b'); grd.addColorStop(0.5, '#5a8f9d'); grd.addColorStop(1, '#4a7c8b');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  // silk sheen streaks
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(200,235,240,${0.04 + Math.random() * 0.06})`; g.lineWidth = 2 + Math.random() * 6; const x = Math.random() * 512; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 20, 170, x - 20, 340, x + 10, 512); g.stroke(); }
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // leafy branches
  g.strokeStyle = NAVY; g.fillStyle = NAVY;
  for (let i = 0; i < 26; i++) {
    const x = r() * 512, y = r() * 512, a = r() * Math.PI * 2;
    g.lineWidth = 3; g.globalAlpha = 0.85;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30 - 10, x + Math.cos(a) * 60, y + Math.sin(a) * 60); g.stroke();
    for (let k = 0; k < 4; k++) {
      const t = (k + 1) / 5, lx = x + Math.cos(a) * 60 * t, ly = y + Math.sin(a) * 60 * t;
      g.beginPath(); g.ellipse(lx + Math.cos(a + 1.3) * 8, ly + Math.sin(a + 1.3) * 8, 9, 4, a + 1.3, 0, Math.PI * 2); g.fill();
    }
  }
  // peonies
  for (let i = 0; i < 22; i++) {
    const x = r() * 512, y = r() * 512, rad = 14 + r() * 16;
    g.globalAlpha = 0.9;
    for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2 + r(); g.beginPath(); g.ellipse(x + Math.cos(a) * rad * 0.55, y + Math.sin(a) * rad * 0.55, rad * 0.55, rad * 0.38, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#2c4a6c'; g.beginPath(); g.arc(x, y, rad * 0.3, 0, 7); g.fill(); g.fillStyle = NAVY;
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// painted fabrics for the wardrobe outfits
function fabric(draw, rep = [2, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); draw(g, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  return t;
}
const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const FABRICS = {
  gown: () => fabric((g, n) => { g.fillStyle = '#1c2440'; g.fillRect(0, 0, n, n); g.strokeStyle = 'rgba(120,170,200,0.35)'; g.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = rnd() * n, y = rnd() * n, a = rnd() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); g.stroke(); } }),
  robe: () => fabric((g, n) => { const gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, '#f4c9a8'); gr.addColorStop(0.45, '#e2783e'); gr.addColorStop(1, '#c4542a'); g.fillStyle = gr; g.fillRect(0, 0, n, n); g.strokeStyle = 'rgba(255,236,200,0.45)'; g.lineWidth = 3; for (let i = 0; i < 18; i++) { const x = rnd() * n; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 14, n * 0.3, x - 14, n * 0.6, x + 6, n); g.stroke(); } g.fillStyle = 'rgba(232,190,90,0.8)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(rnd() * n, rnd() * n * 0.35, 10, 4, rnd() * 3, 0, 7); g.fill(); } }, [3, 1]),
  silk: () => fabric((g, n) => { g.fillStyle = '#e8b89a'; g.fillRect(0, 0, n, n); for (let i = 0; i < 40; i++) { g.fillStyle = ['#f0a060', '#7aa0d8', '#c8a0d8', '#f6dcc0', '#4a70b0'][i % 5]; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(rnd() * n, rnd() * n, 8 + rnd() * 26, 4 + rnd() * 10, rnd() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; }),
  hood: () => fabric((g, n) => { g.fillStyle = '#8a2a3a'; g.fillRect(0, 0, n, n); for (let i = 0; i < 50; i++) { g.fillStyle = rnd() < 0.5 ? '#3a6ad0' : '#6a8ae0'; g.beginPath(); g.arc(rnd() * n, rnd() * n, 4 + rnd() * 12, 0, 7); g.fill(); } }),
};

// the outfits in the wardrobe on the Overlook
export const OUTFITS = {
  party:      { name: 'Floral party dress', blurb: 'Teal silk with navy flowers',     swatch: '#4a7c8b' },
  gown:       { name: 'Concert gown',       blurb: 'Midnight silk for a night out',   swatch: '#1c2440' },
  robe:       { name: 'Phoenix robe',       blurb: 'Golden crown and flowing sleeves', swatch: 'linear-gradient(#f4c9a8, #e2783e, #c4542a)' },
  graduation: { name: 'Graduation day',     blurb: 'Robes, cap and hood',              swatch: 'linear-gradient(135deg, #1e2a5a 0 55%, #8a2a3a 55% 75%, #7a5ab8 75%)' },
  street:     { name: 'Street style',       blurb: 'Olive cape, silk top, tan tote',   swatch: 'linear-gradient(135deg, #5a6048 0 50%, #e8b89a 50% 75%, #b8642a 75%)' },
  velvet:     { name: 'Blue velvet',        blurb: 'Velvet dress, scarf, tall boots',  swatch: 'linear-gradient(135deg, #2440b8 0 65%, #6a2ac0 65%)' },
};

export function buildAvatar(outfitId = 'party') {
  const O = OUTFITS[outfitId] ? outfitId : 'party';
  const root = new THREE.Group();
  const body = new THREE.Group();      // bobs while walking
  root.add(body);
  const m = (c, o = {}) => toonMat({ color: c, ...o });
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
  const lathe = (pts, mat, parent = body, seg = 24, open = null) => add(parent, open ? new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg, open[0], open[1]) : new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);
  const skin = m(SKIN), slide = m('#141214');

  // ── legs: bare with slides, hidden under a long skirt, wide trousers, or tall boots ──
  const legKind = { party: 'slides', gown: 'hidden', robe: 'hidden', graduation: 'hidden', street: 'trousers', velvet: 'boots' }[O];
  const legs = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.075, 0.42, 0); root.add(pivot);
    if (legKind === 'trousers') {
      const olive = m('#5a6048');
      add(pivot, new THREE.CylinderGeometry(0.07, 0.095, 0.42, 10), olive, 0, -0.21, 0);
      add(pivot, new THREE.BoxGeometry(0.008, 0.4, 0.01), m('#d8b25a'), s * 0.09, -0.21, 0);
      add(pivot, new THREE.BoxGeometry(0.1, 0.03, 0.2), slide, 0, -0.415, 0.03);
    } else {
      add(pivot, new THREE.CylinderGeometry(0.042, 0.036, 0.38, 8), skin, 0, -0.2, 0);
      if (legKind === 'boots') {
        const boot = m('#121012');
        add(pivot, new THREE.CylinderGeometry(0.05, 0.048, 0.3, 10), boot, 0, -0.26, 0);
        add(pivot, new THREE.BoxGeometry(0.11, 0.07, 0.22), boot, 0, -0.39, 0.03);
        add(pivot, new THREE.BoxGeometry(0.12, 0.03, 0.23), m('#2a2628'), 0, -0.42, 0.03);
      } else {
        add(pivot, new THREE.SphereGeometry(0.05, 8, 6), skin, 0, -0.39, 0.03).scale.set(0.9, 0.5, 1.6);
        add(pivot, new THREE.BoxGeometry(0.1, 0.03, 0.2), slide, 0, -0.415, 0.03);
        add(pivot, new THREE.BoxGeometry(0.105, 0.035, 0.07), slide, 0, -0.385, 0.06);
      }
    }
    pivot.visible = legKind !== 'hidden';
    return pivot;
  });

  // ── the garment ──
  let dress, sleeve = null, sleeveStyle = 'bare';
  if (O === 'party') {
    const tex = partyTexture(); tex.repeat.set(2, 1);
    const dressMat = m('#ffffff', { map: tex });
    dress = lathe([[0.17, 0.3], [0.19, 0.34], [0.2, 0.55], [0.19, 0.72], [0.155, 0.84], [0.17, 0.96], [0.19, 1.04], [0.17, 1.12], [0.075, 1.16]], dressMat, body, 22);
    add(body, new THREE.BoxGeometry(0.03, 0.2, 0.05), skin, -0.185, 0.42, 0.02).rotation.z = -0.05;
    add(body, new THREE.CylinderGeometry(0.068, 0.078, 0.085, 14), dressMat, 0, 1.19, 0);
    add(body, new THREE.TorusGeometry(0.073, 0.008, 4, 16), m(NAVY), 0, 1.235, 0).rotation.x = Math.PI / 2;
    const pearl = m('#fbf6ee', { emissive: '#3a3630' });
    for (const [x, y, z] of [[0, 1.2, 0.08], [0.06, 1.12, 0.15], [0.12, 1.07, 0.13], [0.165, 1.0, 0.09], [0.17, 0.82, 0.08]]) add(body, new THREE.SphereGeometry(0.018, 8, 6), pearl, x, y, z);
  } else if (O === 'gown') {
    const gm = m('#ffffff', { map: FABRICS.gown(), side: THREE.DoubleSide });
    dress = lathe([[0.36, 0.01], [0.34, 0.2], [0.29, 0.45], [0.23, 0.66], [0.17, 0.74], [0.155, 0.84], [0.17, 0.96], [0.185, 1.06], [0.15, 1.13], [0.075, 1.17]], gm, body, 26);
    lathe([[0.27, 0.66], [0.24, 0.72], [0.18, 0.78], [0.165, 0.8]], m('#26304e', { side: THREE.DoubleSide }), body, 26);   // the peplum
    add(body, new THREE.CylinderGeometry(0.07, 0.08, 0.06, 14), gm, 0, 1.18, 0);
  } else if (O === 'robe') {
    const hm = m('#ffffff', { map: FABRICS.robe(), side: THREE.DoubleSide });
    dress = lathe([[0.42, 0.01], [0.38, 0.2], [0.3, 0.5], [0.2, 0.74], [0.16, 0.84], [0.175, 0.96], [0.19, 1.04], [0.17, 1.08]], hm, body, 28);
    // gold phoenix embroidery across the bodice, a sheer overskirt
    for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.3; add(body, new THREE.SphereGeometry(0.04, 8, 6), m('#e8b45a', { emissive: '#3a2400' }), Math.sin(a) * 0.185, 0.98 + Math.cos(k) * 0.03, Math.cos(a) * 0.185).scale.set(1, 0.5, 0.4); }
    lathe([[0.46, 0.04], [0.4, 0.3], [0.26, 0.62], [0.2, 0.76]], m('#fbe4d4', { transparent: true, opacity: 0.45, side: THREE.DoubleSide }), body, 28);
    add(body, new THREE.TorusGeometry(0.17, 0.02, 6, 20), m('#c8542a'), 0, 0.78, 0).rotation.x = Math.PI / 2;   // sash
  } else if (O === 'graduation') {
    dress = lathe([[0.2, 0.04], [0.2, 0.3], [0.19, 0.6], [0.16, 0.8], [0.17, 0.96], [0.18, 1.06], [0.16, 1.12], [0.075, 1.17]], m('#7a5ab8'), body, 22);
    // the navy robe, open down the front
    lathe([[0.3, 0.03], [0.28, 0.4], [0.24, 0.8], [0.22, 1.02], [0.2, 1.12], [0.1, 1.17]], m('#1e2a5a', { side: THREE.DoubleSide }), body, 24, [0.5, Math.PI * 2 - 1.0]);
    add(body, new THREE.CylinderGeometry(0.07, 0.08, 0.08, 14), m('#7a5ab8'), 0, 1.19, 0);
    // the hood: a patterned red-and-blue V over the shoulders with a pale lining
    lathe([[0.3, 0.86], [0.27, 1.0], [0.2, 1.12], [0.1, 1.18]], m('#ffffff', { map: FABRICS.hood(), side: THREE.DoubleSide }), body, 24, [Math.PI * 0.22, Math.PI * 1.56]);
    for (const s of [-1, 1]) add(body, new THREE.BoxGeometry(0.04, 0.3, 0.02), m('#f4d8dc'), s * 0.09, 0.98, 0.17).rotation.z = s * 0.45;
  } else if (O === 'street') {
    dress = lathe([[0.17, 0.42], [0.175, 0.6], [0.165, 0.8], [0.18, 0.98], [0.19, 1.06], [0.16, 1.13], [0.075, 1.16]], m('#ffffff', { map: FABRICS.silk() }), body, 22);
    add(body, new THREE.CylinderGeometry(0.068, 0.078, 0.085, 14), m('#2a2628'), 0, 1.19, 0);
    // the olive cape, open at the front, falling past the knees
    lathe([[0.36, 0.3], [0.32, 0.6], [0.27, 0.9], [0.22, 1.1], [0.12, 1.2]], m('#5a6048', { side: THREE.DoubleSide }), body, 24, [0.7, Math.PI * 2 - 1.4]);
  } else if (O === 'velvet') {
    dress = lathe([[0.2, 0.56], [0.195, 0.66], [0.17, 0.82], [0.18, 0.96], [0.19, 1.04], [0.17, 1.12], [0.075, 1.16]], m('#2440b8'), body, 22);
    add(body, new THREE.BoxGeometry(0.03, 0.12, 0.05), skin, -0.2, 0.6, 0.02);
    add(body, new THREE.CylinderGeometry(0.068, 0.078, 0.1, 14), m('#2440b8'), 0, 1.19, 0);
    // the purple scarf over one shoulder, falling front and back
    const scarf = m('#6a2ac0');
    add(body, new THREE.BoxGeometry(0.1, 0.62, 0.025), scarf, 0.1, 0.84, 0.19).rotation.z = 0.12;
    add(body, new THREE.BoxGeometry(0.1, 0.8, 0.025), scarf, 0.13, 0.74, -0.19).rotation.z = -0.05;
    add(body, new THREE.TorusGeometry(0.085, 0.03, 6, 14, Math.PI), scarf, 0.13, 1.14, 0).rotation.y = Math.PI / 2;
  }
  sleeve = { gown: null, robe: 'sheer', graduation: 'robe', street: 'silk', velvet: 'velvet' }[O] ?? null;

  // ── arms, pivot at the shoulder (bare, or in this outfit's sleeves) ──
  const sleeveMat = { robe: m('#1e2a5a'), silk: m('#2a2628'), velvet: m('#2440b8') }[sleeve];
  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.2, 1.08, 0); body.add(pivot);
    add(pivot, new THREE.SphereGeometry(0.048, 10, 8), sleeveMat || skin, 0, -0.01, 0);
    add(pivot, new THREE.CylinderGeometry(sleeve === 'robe' ? 0.07 : 0.04, sleeve === 'robe' ? 0.09 : 0.033, 0.44, 8), sleeveMat || skin, s * 0.02, -0.24, 0).rotation.z = s * 0.08;
    add(pivot, new THREE.SphereGeometry(0.04, 8, 6), skin, s * 0.035, -0.48, 0);
    if (sleeve === 'sheer') {   // long, floaty sleeves that hang below the hand
      const sh = add(pivot, new THREE.CylinderGeometry(0.06, 0.2, 0.75, 12, 1, true), m('#fbe0cc', { transparent: true, opacity: 0.55, side: THREE.DoubleSide }), s * 0.03, -0.42, 0);
      sh.rotation.z = s * 0.08;
      add(pivot, new THREE.TorusGeometry(0.045, 0.012, 6, 12), m('#c8542a'), s * 0.03, -0.12, 0).rotation.x = Math.PI / 2;
    }
    return pivot;
  });

  // head
  const head = new THREE.Group(); head.position.set(0, 1.44, 0); body.add(head);
  add(head, new THREE.CylinderGeometry(0.05, 0.058, 0.12, 8), skin, 0, -0.2, 0);
  add(head, new THREE.SphereGeometry(0.25, 20, 16), skin, 0, 0, 0).scale.set(1, 1.02, 0.96);
  // ── hair ──
  const hairMat = m(HAIR);
  const hairKind = { party: 'pony', gown: 'bun', robe: 'long', graduation: 'bun', street: 'bob', velvet: 'ponyPlain' }[O];
  const cap = add(head, new THREE.SphereGeometry(0.264, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat, 0, 0.018, -0.015);
  cap.rotation.x = hairKind === 'bob' ? -0.55 : -0.95;
  add(head, new THREE.SphereGeometry(0.256, 16, 12), hairMat, 0, -0.01, -0.1);
  const pony = new THREE.Group(); pony.position.set(0, -0.1, -0.25); head.add(pony);
  if (hairKind === 'pony' || hairKind === 'ponyPlain') {
    add(pony, new THREE.SphereGeometry(0.085, 10, 8), hairMat, 0, 0, 0).scale.set(1, 0.9, 0.8);
    add(pony, new THREE.CylinderGeometry(0.05, 0.02, 0.26, 8), hairMat, 0, -0.15, -0.03).rotation.x = 0.25;
  }
  if (hairKind === 'pony') {
    const bowMat = m('#0d0b0c');
    for (const s of [-1, 1]) { const loop = add(pony, new THREE.SphereGeometry(0.05, 8, 6), bowMat, s * 0.06, 0.02, -0.06); loop.scale.set(1.2, 0.7, 0.4); loop.rotation.z = s * 0.4; }
    add(pony, new THREE.BoxGeometry(0.035, 0.035, 0.03), bowMat, 0, 0.01, -0.07);
    for (const s of [-1, 1]) add(pony, new THREE.BoxGeometry(0.025, 0.14, 0.01), bowMat, s * 0.025, -0.07, -0.08).rotation.z = s * 0.25;
  } else if (hairKind === 'bun') {
    add(pony, new THREE.SphereGeometry(0.1, 12, 10), hairMat, 0, 0.02, 0.02);
  } else if (hairKind === 'long') {
    pony.position.set(0, -0.05, -0.2);
    add(pony, new THREE.BoxGeometry(0.4, 0.8, 0.08), hairMat, 0, -0.4, -0.02);
    for (const s of [-1, 1]) add(head, new THREE.BoxGeometry(0.06, 0.55, 0.06), hairMat, s * 0.22, -0.32, 0.02);
  } else if (hairKind === 'bob') {
    add(head, new THREE.CylinderGeometry(0.27, 0.31, 0.38, 18, 1, true, Math.PI * 0.28, Math.PI * 1.44), m(HAIR, { side: THREE.DoubleSide }), 0, -0.13, -0.01);
  }
  // face-framing strands (the bob has its own)
  if (hairKind !== 'bob') for (const s of [-1, 1]) add(head, new THREE.CylinderGeometry(0.016, 0.006, 0.3, 5), hairMat, s * 0.215, -0.04, 0.09).rotation.set(0.15, 0, s * 0.18);

  // ── accessories ──
  const gold = m('#e8b45a', { emissive: '#3a2400' });
  if (O === 'robe') {  // the golden phoenix crown with dangling tassels
    const crown = new THREE.Group(); crown.position.set(0, 0.2, -0.02); head.add(crown);
    add(crown, new THREE.TorusGeometry(0.2, 0.02, 6, 20, Math.PI), gold, 0, 0, 0.02).rotation.x = -0.3;
    for (let k = 0; k < 9; k++) {
      const a = -1.2 + k * 0.3, x = Math.sin(a) * 0.2, z = Math.cos(a) * 0.12;
      add(crown, new THREE.ConeGeometry(0.03, 0.18 + (k % 2) * 0.08, 5), gold, x, 0.1, z).rotation.z = -a * 0.5;
      add(crown, new THREE.SphereGeometry(0.02, 6, 4), m('#e8504a', { emissive: '#400000' }), x, 0.02, z + 0.02);
    }
    add(crown, new THREE.SphereGeometry(0.05, 10, 8), gold, 0, 0.12, 0.12).scale.set(1.6, 1, 0.6);   // the phoenix at the front
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const strand = add(crown, new THREE.CylinderGeometry(0.005, 0.005, 0.32, 3), gold, s * (0.21 + k * 0.02), -0.2, 0.06 - k * 0.04);
      add(crown, new THREE.SphereGeometry(0.014, 6, 4), m('#f6d27a', { emissive: '#3a2400' }), s * (0.21 + k * 0.02), -0.37, 0.06 - k * 0.04);
    }
    add(head, new THREE.SphereGeometry(0.012, 6, 4), m('#e8504a'), 0, 0.08, 0.245);   // a dot of red on the forehead
  }
  if (O === 'graduation') {  // mortarboard with a tassel
    const mb = new THREE.Group(); mb.position.set(0, 0.24, 0); mb.rotation.x = -0.12; head.add(mb);
    add(mb, new THREE.CylinderGeometry(0.2, 0.22, 0.1, 16), m('#141214'), 0, -0.02, 0);
    add(mb, new THREE.BoxGeometry(0.56, 0.025, 0.56), m('#141214'), 0, 0.04, 0).rotation.y = Math.PI / 4;
    add(mb, new THREE.SphereGeometry(0.02, 6, 4), m('#141214'), 0, 0.065, 0);
    add(mb, new THREE.CylinderGeometry(0.008, 0.008, 0.28, 4), m('#1e2a5a'), 0.26, -0.08, 0.1);
  }
  if (O === 'street') {     // a tan leather tote, in the left hand
    const tote = new THREE.Group(); tote.position.set(-0.03, -0.62, 0.02); arms[0].add(tote);
    add(tote, new THREE.BoxGeometry(0.3, 0.26, 0.12), m('#b8642a'), 0, -0.1, 0);
    add(tote, new THREE.TorusGeometry(0.07, 0.012, 4, 12, Math.PI), m('#9a5020'), 0, 0.03, 0);
    add(tote, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), m('#e0a050'), 0.1, -0.1, 0.07).rotation.x = Math.PI / 2;
  }
  if (O === 'velvet') {      // a little black bag on the arm, and silver rings
    const bag = add(arms[0], new THREE.BoxGeometry(0.16, 0.12, 0.07), m('#141214'), -0.02, -0.5, 0.06);
    add(bag, new THREE.TorusGeometry(0.06, 0.008, 4, 10, Math.PI), m('#141214'), 0, 0.06, 0);
    add(head, new THREE.SphereGeometry(0.02, 6, 4), m('#d8dde4'), -0.25, -0.08, 0.02);
    add(head, new THREE.SphereGeometry(0.02, 6, 4), m('#d8dde4'), 0.25, -0.08, 0.02);
  }

  // face: eyes with highlights, brows, blush, a soft smile
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#1a1414' });
  const hiMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const s of [-1, 1]) {
    add(head, new THREE.SphereGeometry(0.03, 10, 8), eyeMat, s * 0.085, 0.0, 0.225).scale.set(0.9, 1.1, 0.5);
    add(head, new THREE.SphereGeometry(0.009, 6, 4), hiMat, s * 0.085 + 0.01, 0.014, 0.24);
    add(head, new THREE.BoxGeometry(0.06, 0.008, 0.01), eyeMat, s * 0.085, 0.072, 0.228).rotation.z = s * -0.1;
    add(head, new THREE.CircleGeometry(0.042, 12), new THREE.MeshBasicMaterial({ color: '#f29c9c', transparent: true, opacity: 0.45 }), s * 0.14, -0.06, 0.205).rotation.y = s * 0.55;
  }
  add(head, new THREE.TorusGeometry(0.03, 0.006, 4, 10, Math.PI), new THREE.MeshBasicMaterial({ color: '#a8545a' }), 0, -0.085, 0.235).rotation.z = Math.PI;

  // soft contact shadow
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: softDot(64, 'rgba(40,30,40,0.5)', 'rgba(40,30,40,0)'), transparent: true, depthWrite: false }));
  blob.position.y = 0.02;
  root.add(blob);

  root.scale.setScalar(1.15);

  let phase = 0;
  return {
    root, head,
    update(dt, speed, t, flying = false, riding = false) {
      if (riding) {
        // standing on the scooter deck: hands on the bars, ponytail streaming back
        const k = Math.min(1, speed / 9);
        body.position.y = Math.sin(t * 9) * 0.006 * k;
        body.rotation.x = 0.06 + k * 0.08;
        arms[0].rotation.set(-1.25, 0, -0.1); arms[1].rotation.set(-1.25, 0, 0.1);
        legs[0].rotation.x = -0.12; legs[1].rotation.x = 0.1;
        dress.rotation.y = 0;
        head.rotation.z = Math.sin(t * 1.4) * 0.03;
        pony.rotation.x = -0.15 - k * 0.7 + Math.sin(t * 14) * 0.06 * k;
        pony.rotation.z = Math.sin(t * 9) * 0.1 * k;
        blob.visible = true;
        return;
      }
      body.rotation.x = 0;
      arms[0].rotation.y = arms[1].rotation.y = 0;
      const walking = speed > 0.3;
      phase += dt * (walking ? 9 + speed * 0.6 : 2);
      const sw = walking ? Math.sin(phase) : 0;
      body.position.y = walking ? Math.abs(Math.sin(phase)) * 0.05 : Math.sin(t * 2) * 0.008;
      arms[0].rotation.x = sw * 0.55; arms[1].rotation.x = -sw * 0.55;
      arms[0].rotation.z = flying ? -0.9 : -0.06; arms[1].rotation.z = flying ? 0.9 : 0.06;
      legs[0].rotation.x = flying ? 0.3 : -sw * 0.45; legs[1].rotation.x = flying ? -0.1 : sw * 0.45;
      dress.rotation.y = sw * 0.05;
      head.rotation.z = walking ? Math.sin(phase * 0.5) * 0.04 : Math.sin(t * 0.8) * 0.03;
      pony.rotation.x = (walking ? -Math.abs(sw) * 0.25 : 0) + Math.sin(t * 2.2) * 0.04;
      pony.rotation.z = sw * 0.15;
      blob.visible = !flying;
    },
  };
}

// the cat skins you can pick at the Overlook's cat house
export const CAT_SKINS = {
  greyTabby:   { name: 'Grey tabby',       blurb: 'The original chubby loaf',     fur: '#b1abae', stripe: '#7e7679' },
  orangeTabby: { name: 'Orange tabby',     blurb: 'Pure marmalade chaos',          fur: '#f0a050', stripe: '#c8682a' },
  fluffyBlack: { name: 'Fluffy black cat', blurb: 'A little void with golden eyes', fur: '#262122', stripe: null, fluffy: true, eyes: '#e8c040' },
  tuxedo:      { name: 'Tuxedo',           blurb: 'Dressed for the opera',         fur: '#1f1c1e', stripe: null, bib: '#f6f2ea', eyes: '#9ad06a' },
  calico:      { name: 'Calico',           blurb: 'Patches of orange and black',   fur: '#f6efe4', stripe: null, patches: ['#e8913c', '#2a2426'] },
  siamese:     { name: 'Siamese',          blurb: 'Cream with chocolate points',   fur: '#f2e4cc', stripe: null, points: '#5a4034', eyes: '#5aa0e0' },
  fluffyWhite: { name: 'Fluffy white cat', blurb: 'A cloud that purrs',            fur: '#fbf8f2', stripe: null, fluffy: true, eyes: '#6ab0e8' },
};

// chubby cat: a round loaf of a cat with stubby legs, dressed in whichever skin is picked
export function buildCat(skinId = 'greyTabby') {
  const sk = CAT_SKINS[skinId] || CAT_SKINS.greyTabby;
  const root = new THREE.Group();
  const m = (c) => toonMat({ color: c });
  const add = (geo, mat, x, y, z, p = root) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  const fur = m(sk.fur), stripe = sk.stripe ? m(sk.stripe) : null, dark = new THREE.MeshBasicMaterial({ color: sk.fur === '#262122' || sk.fur === '#1f1c1e' ? '#f2e8d8' : '#231d1f' });
  const pt = sk.points ? m(sk.points) : null;
  const body = new THREE.Group(); root.add(body);
  add(new THREE.SphereGeometry(0.3, 20, 14), fur, 0, 0.27, 0, body).scale.set(1.0, 0.8, 1.25);
  // ears
  for (const s of [-1, 1]) add(new THREE.ConeGeometry(0.075, 0.13, 4), pt || fur, s * 0.15, 0.5, 0.17, body).rotation.set(0.2, Math.PI / 4, s * -0.35);
  if (stripe) {
    // forehead and back stripes
    for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.025, 0.012, 0.09), stripe, (k - 1) * 0.06, 0.505, 0.2, body).rotation.x = -0.6;
    for (let k = 0; k < 3; k++) {   // stripes hug the back
      const z = -0.06 - k * 0.1, f = Math.sqrt(1 - (z / 0.375) ** 2);
      const st = add(new THREE.TorusGeometry(0.3 * f * 1.01, 0.014, 4, 14, Math.PI * 0.5), stripe, 0, 0.27, z, body);
      st.rotation.set(0, 0, Math.PI * 0.25); st.scale.set(1, 0.8, 1);
    }
  }
  if (sk.fluffy) for (let i = 0; i < 26; i++) {   // a halo of fluff
    const a = i * 2.39996, y = 1 - (i + 0.5) / 26 * 1.6, r = Math.sqrt(Math.max(0, 1 - y * y));
    add(new THREE.SphereGeometry(0.075, 7, 5), fur, Math.cos(a) * r * 0.3, 0.27 + y * 0.22, Math.sin(a) * r * 0.36 - 0.03, body);
  }
  if (sk.bib) { add(new THREE.SphereGeometry(0.16, 12, 8), m(sk.bib), 0, 0.22, 0.24, body).scale.set(1, 0.9, 0.5); add(new THREE.SphereGeometry(0.09, 10, 8), m(sk.bib), 0, 0.29, 0.33, body).scale.set(1.3, 0.8, 0.5); }
  if (sk.patches) sk.patches.forEach((c, i) => { for (let k = 0; k < 2; k++) { const a = i * 2.2 + k * 1.3; add(new THREE.SphereGeometry(0.12, 10, 8), m(c), Math.cos(a) * 0.2, 0.36 + k * 0.03, Math.sin(a) * 0.22 - 0.05, body).scale.set(1, 0.45, 1); } });
  if (pt) add(new THREE.SphereGeometry(0.1, 10, 8), pt, 0, 0.29, 0.33, body).scale.set(1.3, 0.85, 0.5);   // dark face mask
  // face: wide-set dot eyes, tiny mouth, whiskers, blush
  for (const s of [-1, 1]) {
    if (sk.eyes) add(new THREE.SphereGeometry(0.034, 10, 8), new THREE.MeshBasicMaterial({ color: sk.eyes }), s * 0.11, 0.33, 0.35, body).scale.set(1, 1.1, 0.5);
    add(new THREE.SphereGeometry(0.026, 8, 6), sk.eyes ? new THREE.MeshBasicMaterial({ color: '#141012' }) : dark, s * 0.11, 0.33, sk.eyes ? 0.362 : 0.355, body).scale.set(sk.eyes ? 0.55 : 1, 1.1, 0.5);
    add(new THREE.CircleGeometry(0.03, 10), new THREE.MeshBasicMaterial({ color: '#f2a2a8', transparent: true, opacity: 0.55 }), s * 0.17, 0.28, 0.345, body).rotation.y = s * 0.5;
    for (const w of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.006, 0.006), dark, s * 0.25, 0.29 + w * 0.02, 0.3, body).rotation.z = w * s * 0.15;
  }
  add(new THREE.TorusGeometry(0.018, 0.005, 4, 8, Math.PI), dark, 0, 0.3, 0.37, body).rotation.z = Math.PI;
  // stubby legs and a striped tail
  const legs = [];
  const paw = sk.bib ? m(sk.bib) : pt || fur;
  for (const [x, z] of [[-0.12, 0.17], [0.12, 0.17], [-0.12, -0.17], [0.12, -0.17]]) legs.push(add(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), paw, x, 0.05, z));
  const tailG = new THREE.Group(); tailG.position.set(0, 0.3, -0.36); body.add(tailG);
  add(new THREE.CylinderGeometry(sk.fluffy ? 0.07 : 0.045, sk.fluffy ? 0.08 : 0.05, 0.22, 8), pt || fur, 0, 0.08, -0.02, tailG).rotation.x = -0.5;
  if (stripe) add(new THREE.TorusGeometry(0.048, 0.012, 4, 10), stripe, 0, 0.1, -0.03, tailG).rotation.x = Math.PI / 2 - 0.5;
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.36, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: softDot(64, 'rgba(40,30,40,0.45)', 'rgba(40,30,40,0)'), transparent: true, depthWrite: false }));
  blob.position.y = 0.015; root.add(blob);
  root.scale.setScalar(1.1);
  let ph = 0;
  return {
    root,
    update(dt, speed, t) {
      const w = speed > 0.2;
      ph += dt * (w ? 15 : 2);
      legs.forEach((l, i) => { l.position.y = 0.05 + (w ? Math.max(0, Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI))) * 0.04 : 0); });
      body.position.y = w ? Math.abs(Math.sin(ph)) * 0.025 : 0;
      body.rotation.z = w ? Math.sin(ph) * 0.06 : 0;                // waddle
      body.scale.y = w ? 1 : 1 + Math.sin(t * 2.4) * 0.015;          // breathing
      tailG.rotation.y = Math.sin(t * (w ? 8 : 2.5)) * 0.5;
    },
  };
}

// a German Shepherd: tan with a black saddle and muzzle, tall upright ears, a blue collar
export function buildDog() {
  const root = new THREE.Group();
  const m = (c) => toonMat({ color: c });
  const add = (geo, mat, x, y, z, p) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  const tan = m('#c8894a'), tanL = m('#deaa6c'), black = m('#231c1a'), dark = new THREE.MeshBasicMaterial({ color: '#141012' });
  const body = new THREE.Group(); body.position.set(0, 0.52, 0); root.add(body);
  add(new THREE.SphereGeometry(0.24, 16, 12), tan, 0, 0, 0, body).scale.set(0.95, 0.9, 1.75);                 // torso
  add(new THREE.SphereGeometry(0.245, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), black, 0, 0.02, -0.05, body).scale.set(1.0, 0.95, 1.6);  // saddle
  add(new THREE.SphereGeometry(0.2, 14, 10), tanL, 0, -0.02, 0.3, body).scale.set(1, 1.1, 1);                 // chest
  // head on a neck, so it can tilt (like the photo)
  const head = new THREE.Group(); head.position.set(0, 0.25, 0.42); body.add(head);
  add(new THREE.CylinderGeometry(0.11, 0.15, 0.28, 10), tan, 0, -0.08, -0.04, head).rotation.x = 0.5;
  add(new THREE.SphereGeometry(0.16, 16, 12), tan, 0, 0.1, 0.05, head).scale.set(1, 0.95, 1.05);
  add(new THREE.SphereGeometry(0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.4), black, 0, 0.115, 0.03, head).scale.set(0.9, 0.8, 1.0);   // dark crown
  const snout = add(new THREE.CylinderGeometry(0.06, 0.09, 0.22, 10), black, 0, 0.05, 0.22, head); snout.rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.035, 8, 6), dark, 0, 0.07, 0.34, head);                                      // nose
  add(new THREE.BoxGeometry(0.1, 0.02, 0.1), m('#c86a6a'), 0, 0.0, 0.25, head);                               // a hint of tongue
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.024, 8, 6), dark, s * 0.065, 0.15, 0.17, head);
    add(new THREE.SphereGeometry(0.007, 4, 3), new THREE.MeshBasicMaterial({ color: '#fff' }), s * 0.065 + 0.008, 0.16, 0.19, head);
    const ear = add(new THREE.ConeGeometry(0.06, 0.2, 4), black, s * 0.085, 0.3, 0.0, head); ear.rotation.set(-0.1, Math.PI / 4, s * -0.22); ear.scale.set(1, 1, 0.45);
    add(new THREE.ConeGeometry(0.035, 0.12, 4), m('#e0b48a'), s * 0.085, 0.29, 0.012, head).rotation.set(-0.1, Math.PI / 4, s * -0.22);
  }
  add(new THREE.TorusGeometry(0.12, 0.022, 6, 16), m('#2a5aa8'), 0, -0.1, -0.02, head).rotation.x = Math.PI / 2 - 0.5;   // blue collar
  // legs (pivot at the hip / shoulder)
  const legs = [[-0.12, 0.28], [0.12, 0.28], [-0.12, -0.3], [0.12, -0.3]].map(([x, z]) => {
    const p = new THREE.Group(); p.position.set(x, 0.5, z); root.add(p);
    add(new THREE.CylinderGeometry(0.05, 0.04, 0.46, 8), tanL, 0, -0.24, 0, p);
    add(new THREE.SphereGeometry(0.05, 8, 6), tanL, 0, -0.48, 0.03, p).scale.set(1, 0.6, 1.4);
    return p;
  });
  // a bushy tail with a dark top
  const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.42); root.add(tail);
  add(new THREE.ConeGeometry(0.07, 0.48, 8), tan, 0, -0.22, -0.06, tail).rotation.x = Math.PI - 0.35;
  add(new THREE.ConeGeometry(0.05, 0.3, 6), black, 0, -0.1, -0.03, tail).rotation.x = Math.PI - 0.35;
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: softDot(64, 'rgba(40,30,40,0.45)', 'rgba(40,30,40,0)'), transparent: true, depthWrite: false }));
  blob.position.y = 0.015; blob.scale.z = 1.5; root.add(blob);
  root.scale.setScalar(1.2);
  let ph = 0, sit = 1;
  return {
    root, head,
    update(dt, speed, t, petT = 0) {
      const w = speed > 0.25;
      ph += dt * (w ? 11 + speed : 2);
      sit += ((w ? 0 : 1) - sit) * Math.min(1, dt * 4);
      // sitting: rear down, front up, the head tilted like in the photo
      body.rotation.x = -0.55 * sit;
      body.position.set(0, 0.52 - 0.12 * sit, -0.1 * sit);
      legs.forEach((l, i) => {
        const front = i < 2, sw = w ? Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55 : 0;
        l.rotation.x = sw + (front ? -0.1 * sit : -1.3 * sit);
        l.position.y = front ? 0.5 + 0.04 * sit : 0.5 - 0.28 * sit;
        l.position.z = front ? 0.28 : -0.3 + 0.1 * sit;
      });
      tail.position.set(0, 0.6 - 0.45 * sit, -0.42 + 0.05 * sit);
      const wag = petT > 0 ? 9 : w ? 6 : 2.5;
      tail.rotation.set(-0.3 * sit + (w ? 0.4 : 0), Math.sin(t * wag) * (petT > 0 ? 0.7 : 0.3), 0);
      head.rotation.set(-0.1 * sit + (petT > 0 ? -0.2 : 0) - body.rotation.x * 0.7, 0, (w ? 0 : 0.28) + (petT > 0 ? Math.sin(t * 6) * 0.15 : 0));
      root.position.y += w ? Math.abs(Math.sin(ph)) * 0.03 : 0;
    },
  };
}

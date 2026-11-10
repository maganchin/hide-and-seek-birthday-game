// The birthday person's avatar: a small storybook figure whose skin and hair
// colours come from world.config.js, dressed in one of the wardrobe outfits.
// Plus a chubby cat who waddles along behind.
import * as THREE from 'three';
import { toonMat, softDot } from './kit.js';
import { PERSON } from './content.js';

const SKIN = PERSON.look.skin || '#efcfb6', HAIR = PERSON.look.hair || '#1b1719';

// painted fabrics for the wardrobe outfits
function fabric(draw, rep = [2, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); draw(g, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  return t;
}
const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const FABRICS = {
  // sunny yellow with white polka dots
  dots: () => fabric((g, n) => { g.fillStyle = '#f6c94e'; g.fillRect(0, 0, n, n); g.fillStyle = '#fffaf0'; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc((x + (y % 2) * 0.5) * n / 8, (y + 0.5) * n / 8, 6, 0, 7); g.fill(); } }, [3, 2]),
  // party sequins: pink and lilac with little sparkles
  sequins: () => fabric((g, n) => { const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#e86aa8'); gr.addColorStop(1, '#9a6ae0'); g.fillStyle = gr; g.fillRect(0, 0, n, n); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.5})`; g.beginPath(); g.arc(rnd() * n, rnd() * n, 1.5 + rnd() * 2.5, 0, 7); g.fill(); } }, [2, 2]),
  // a breton stripe tee
  stripes: () => fabric((g, n) => { g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, n, n); g.fillStyle = '#2f4a8a'; for (let y = 0; y < n; y += 32) g.fillRect(0, y, n, 13); }, [1, 2]),
};

// the outfits in the wardrobe on the Overlook
export const OUTFITS = {
  casual:     { name: 'T-shirt & jeans',    blurb: 'A comfy everyday classic',        swatch: 'linear-gradient(135deg, #f2866b 0 55%, #4a6fa8 55%)' },
  sundress:   { name: 'Sundress',           blurb: 'Yellow with white polka dots',    swatch: 'radial-gradient(circle at 30% 30%, #fffaf0 0 12%, #f6c94e 14%)' },
  hoodie:     { name: 'Hoodie & joggers',   blurb: 'Cozy day off',                    swatch: 'linear-gradient(135deg, #9aa3ad 0 60%, #3a3e48 60%)' },
  party:      { name: 'Party dress',        blurb: 'Sparkly sequins for the big day', swatch: 'linear-gradient(135deg, #e86aa8, #9a6ae0)' },
  graduation: { name: 'Graduation day',     blurb: 'Gown, cap and a gold tassel',     swatch: 'linear-gradient(135deg, #1a1a1e 0 75%, #e8b45a 75%)' },
  overalls:   { name: 'Overalls',           blurb: 'Denim over a striped tee',        swatch: 'linear-gradient(135deg, #4a6fa8 0 60%, #fbf8f2 60% 75%, #2f4a8a 75%)' },
};

export function buildAvatar(outfitId = 'casual') {
  const O = OUTFITS[outfitId] ? outfitId : 'casual';
  const root = new THREE.Group();
  const body = new THREE.Group();      // bobs while walking
  root.add(body);
  const m = (c, o = {}) => toonMat({ color: c, ...o });
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
  const lathe = (pts, mat, parent = body, seg = 24, open = null) => add(parent, open ? new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg, open[0], open[1]) : new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);
  const skin = m(SKIN), slide = m('#c8955f');

  // ── legs: trousers (jeans / joggers) with sneakers, bare with sandals, tall boots, or hidden under a gown ──
  const legKind = { casual: 'trousers', sundress: 'sandals', hoodie: 'trousers', party: 'boots', graduation: 'hidden', overalls: 'trousers' }[O];
  const trouserCol = { casual: '#4a6fa8', hoodie: '#3a3e48', overalls: '#4a6fa8' }[O];
  const sneaker = m('#f6f4ef'), sole = m('#d8d2c6');
  const legs = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.075, 0.42, 0); root.add(pivot);
    if (legKind === 'trousers') {
      add(pivot, new THREE.CylinderGeometry(0.06, 0.07, 0.4, 10), m(trouserCol), 0, -0.2, 0);
      add(pivot, new THREE.BoxGeometry(0.11, 0.07, 0.21), sneaker, 0, -0.395, 0.03);
      add(pivot, new THREE.BoxGeometry(0.115, 0.025, 0.22), sole, 0, -0.425, 0.03);
    } else {
      add(pivot, new THREE.CylinderGeometry(0.042, 0.036, 0.38, 8), skin, 0, -0.2, 0);
      if (legKind === 'boots') {
        const boot = m('#f4f1ec');
        add(pivot, new THREE.CylinderGeometry(0.05, 0.048, 0.22, 10), boot, 0, -0.3, 0);
        add(pivot, new THREE.BoxGeometry(0.11, 0.07, 0.22), boot, 0, -0.39, 0.03);
        add(pivot, new THREE.BoxGeometry(0.12, 0.03, 0.23), m('#c8c0b4'), 0, -0.42, 0.03);
      } else {
        add(pivot, new THREE.SphereGeometry(0.05, 8, 6), skin, 0, -0.39, 0.03).scale.set(0.9, 0.5, 1.6);
        add(pivot, new THREE.BoxGeometry(0.1, 0.03, 0.2), slide, 0, -0.415, 0.03);
        add(pivot, new THREE.BoxGeometry(0.105, 0.035, 0.03), slide, 0, -0.385, 0.06);
      }
    }
    pivot.visible = legKind !== 'hidden';
    return pivot;
  });

  // ── the garment ──
  let dress;
  const top = (mat) => lathe([[0.19, 0.5], [0.185, 0.62], [0.165, 0.8], [0.18, 0.96], [0.19, 1.04], [0.17, 1.12], [0.075, 1.16]], mat, body, 22);
  if (O === 'casual') {
    dress = top(m('#f2866b'));
    lathe([[0.19, 0.4], [0.195, 0.52]], m('#4a6fa8'), body, 22);                          // jeans waistband
    add(body, new THREE.CylinderGeometry(0.068, 0.078, 0.06, 14), m('#f2866b'), 0, 1.18, 0);
  } else if (O === 'sundress') {
    const dm = m('#ffffff', { map: FABRICS.dots(), side: THREE.DoubleSide });
    dress = lathe([[0.26, 0.36], [0.24, 0.5], [0.19, 0.7], [0.16, 0.82], [0.17, 0.96], [0.18, 1.06], [0.15, 1.12]], dm, body, 24);
    for (const sx of [-1, 1]) add(body, new THREE.BoxGeometry(0.03, 0.12, 0.03), dm, sx * 0.1, 1.15, 0.03);   // straps
  } else if (O === 'hoodie') {
    const hm = m('#9aa3ad');
    dress = lathe([[0.2, 0.46], [0.2, 0.56], [0.18, 0.8], [0.195, 0.96], [0.2, 1.04], [0.18, 1.12], [0.08, 1.16]], hm, body, 22);
    add(body, new THREE.TorusGeometry(0.15, 0.06, 8, 16, Math.PI), hm, 0, 1.13, -0.1).rotation.x = Math.PI / 2 + 0.35;   // the hood, down
    add(body, new THREE.BoxGeometry(0.22, 0.1, 0.03), m('#8a939d'), 0, 0.7, 0.18);                                          // front pocket
    for (const sx of [-1, 1]) add(body, new THREE.CylinderGeometry(0.006, 0.006, 0.16, 4), m('#f6f4ef'), sx * 0.04, 1.03, 0.19); // drawstrings
  } else if (O === 'party') {
    const pm = m('#ffffff', { map: FABRICS.sequins(), side: THREE.DoubleSide });
    dress = lathe([[0.27, 0.42], [0.25, 0.52], [0.18, 0.7], [0.155, 0.82], [0.17, 0.96], [0.19, 1.04], [0.17, 1.12], [0.075, 1.16]], pm, body, 24);
    add(body, new THREE.CylinderGeometry(0.068, 0.078, 0.05, 14), pm, 0, 1.18, 0);
  } else if (O === 'graduation') {
    dress = lathe([[0.3, 0.03], [0.28, 0.4], [0.24, 0.8], [0.22, 1.02], [0.2, 1.12], [0.1, 1.17]], m('#1a1a1e', { side: THREE.DoubleSide }), body, 24);
    add(body, new THREE.CylinderGeometry(0.07, 0.08, 0.08, 14), m('#fbf8f2'), 0, 1.19, 0);                       // collar
  } else if (O === 'overalls') {
    dress = top(m('#ffffff', { map: FABRICS.stripes() }));
    const denim = m('#4a6fa8');
    lathe([[0.2, 0.4], [0.2, 0.62], [0.19, 0.8]], denim, body, 22);                                            // the dungaree trousers top
    add(body, new THREE.BoxGeometry(0.22, 0.24, 0.03), denim, 0, 0.9, 0.175);                                    // bib
    for (const sx of [-1, 1]) {
      add(body, new THREE.BoxGeometry(0.04, 0.32, 0.02), denim, sx * 0.09, 1.0, 0.0).rotation.x = 0;             // straps over the shoulders
      add(body, new THREE.SphereGeometry(0.018, 8, 6), m('#e8b45a', { emissive: '#3a2400' }), sx * 0.08, 1.0, 0.19);
    }
  }
  const sleeve = { casual: 'short', hoodie: 'long', graduation: 'wide', overalls: 'short' }[O] ?? null;

  // ── arms, pivot at the shoulder (bare, short sleeves, long sleeves or wide gown sleeves) ──
  const sleeveMat = { casual: m('#f2866b'), hoodie: m('#9aa3ad'), graduation: m('#1a1a1e'), overalls: m('#ffffff', { map: FABRICS.stripes() }) }[O];
  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.2, 1.08, 0); body.add(pivot);
    const full = sleeve === 'long' || sleeve === 'wide';
    add(pivot, new THREE.SphereGeometry(0.048, 10, 8), sleeve ? sleeveMat : skin, 0, -0.01, 0);
    add(pivot, new THREE.CylinderGeometry(sleeve === 'wide' ? 0.07 : 0.04, sleeve === 'wide' ? 0.09 : 0.033, 0.44, 8), full ? sleeveMat : skin, s * 0.02, -0.24, 0).rotation.z = s * 0.08;
    if (sleeve === 'short') add(pivot, new THREE.CylinderGeometry(0.052, 0.05, 0.14, 8), sleeveMat, s * 0.006, -0.07, 0).rotation.z = s * 0.08;
    add(pivot, new THREE.SphereGeometry(0.04, 8, 6), skin, s * 0.035, -0.48, 0);
    return pivot;
  });

  // head
  const head = new THREE.Group(); head.position.set(0, 1.44, 0); body.add(head);
  add(head, new THREE.CylinderGeometry(0.05, 0.058, 0.12, 8), skin, 0, -0.2, 0);
  add(head, new THREE.SphereGeometry(0.25, 20, 16), skin, 0, 0, 0).scale.set(1, 1.02, 0.96);
  // ── hair ──
  const hairMat = m(HAIR);
  const hairKind = { casual: 'pony', sundress: 'long', hoodie: 'bun', party: 'bob', graduation: 'long', overalls: 'pony' }[O];
  const cap = add(head, new THREE.SphereGeometry(0.264, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat, 0, 0.018, -0.015);
  cap.rotation.x = hairKind === 'bob' ? -0.55 : -0.95;
  add(head, new THREE.SphereGeometry(0.256, 16, 12), hairMat, 0, -0.01, -0.1);
  const pony = new THREE.Group(); pony.position.set(0, -0.1, -0.25); head.add(pony);
  if (hairKind === 'pony') {
    add(pony, new THREE.SphereGeometry(0.085, 10, 8), hairMat, 0, 0, 0).scale.set(1, 0.9, 0.8);
    add(pony, new THREE.CylinderGeometry(0.05, 0.02, 0.26, 8), hairMat, 0, -0.15, -0.03).rotation.x = 0.25;
  }
  if (hairKind === 'bun') {
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
  if (O === 'graduation') {  // mortarboard with a gold tassel
    const mb = new THREE.Group(); mb.position.set(0, 0.24, 0); mb.rotation.x = -0.12; head.add(mb);
    add(mb, new THREE.CylinderGeometry(0.2, 0.22, 0.1, 16), m('#141214'), 0, -0.02, 0);
    add(mb, new THREE.BoxGeometry(0.56, 0.025, 0.56), m('#141214'), 0, 0.04, 0).rotation.y = Math.PI / 4;
    add(mb, new THREE.SphereGeometry(0.02, 6, 4), m('#e8b45a'), 0, 0.065, 0);
    add(mb, new THREE.CylinderGeometry(0.01, 0.01, 0.28, 4), m('#e8b45a', { emissive: '#3a2400' }), 0.26, -0.08, 0.1);
  }
  if (O === 'party') {       // a little party hat
    const hat = add(head, new THREE.ConeGeometry(0.09, 0.24, 14), m('#f6c94e'), 0.08, 0.3, 0.02); hat.rotation.z = -0.25;
    add(hat, new THREE.SphereGeometry(0.03, 8, 6), m('#fbf8f2'), 0, 0.13, 0);
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

// A misty, unfinished island out at sea: bare meadow, a few rocks, drifting
// fog, and a signpost that says "Your place here". It shows people using the
// template where their own island would go (SETUP.md explains how to add one).
import * as THREE from 'three';
import { Island } from '../island.js';
import { P, U, textPlane, softDot } from '../kit.js';

export function buildPlaceholder(scene, { id, center, seed }) {
  const I = new Island({ id, center, R: 16, seed, depth: 22, under: { grass: '#b9c4b4', soil: '#9a948a', rock: ['#a9a6a0', '#b8b4ac', '#9c9890', '#c4c0b8'] } });
  const b = I.b, gp = I.gp;

  // washed-out ground: a pale meadow with a dotted outline where buildings would go
  gp.base(['#c3cdbd', '#cbd4c5', '#bcc6b6', '#d2dacb']);
  gp.circle(0, 0, 6.5, '#d9dfd2', '#c2cabb');
  gp.path([[0, 12], [0, 6], [0, 2]], 1.4, '#e4e2d8', '#cfcbbe');

  for (const [x, z, s] of [[-7, -4, 1.1], [6.5, -6, 0.9], [-4, 8, 0.8], [9, 4, 1.0]]) { P.rock(b, x, z, s, '#b3afa8'); I.circle(x, z, s * 0.8, 1); }
  for (const [x, z] of [[-9, 2], [8, -1], [3, -10]]) { P.tree(b, x, z, { h: 2.6, s: 1.2, leaf: '#aebda8', puffs: 5 }); I.circle(x, z, 0.4, 3); }

  // dashed "building plots": little survey stakes with string
  for (const [cx, cz, w, d] of [[-3.5, -2.5, 4, 3], [3.5, 1.5, 3.5, 3]]) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.cyl(0.05, 0.05, 0.6, 5, '#d8c9a8', cx + sx * w / 2, 0, cz + sz * d / 2);
  }

  // the signpost
  const sp = I.spot('placeholderSign', 0, 4.2, { label: 'the signpost', glowY: 2.3, reach: 2.6 });
  sp.placeholder = true;
  sp.prompt = { title: 'Your place here', sub: 'to read the sign' };
  b.cyl(0.09, 0.1, 2.2, 6, '#8a6a4a', 0, 0, 2.6);
  const sign = textPlane(2.4, 0.9, (g, W, H) => {
    g.fillStyle = '#f6efe0'; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, H * 0.18); g.fill();
    g.strokeStyle = '#8a6a4a'; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#5a4030'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${H * 0.34}px "Lilita One", Fredoka, sans-serif`; g.fillText('Your place here ✦', W / 2, H * 0.4, W * 0.9);
    g.font = `600 ${H * 0.17}px Fredoka, sans-serif`; g.fillStyle = '#8a6a4a'; g.fillText('Add your own island · see SETUP.md', W / 2, H * 0.72, W * 0.9);
  }, { px: 200 });
  sign.position.set(0, 2.15, 2.62);
  I.extras.add(sign);
  I.circle(0, 2.6, 0.3, 2);

  I.addGate(0, 11, Math.PI);
  I.finalize(scene);

  // drifting fog that hides the island in soft white
  const fogTex = softDot(128, 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)');
  const puffs = [];
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 44; k++) {
    const a = r() * Math.PI * 2, d = 3 + r() * 17;
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0.75 + r() * 0.2, color: '#f6f7fa' }));
    const sc = 10 + r() * 12;
    m.scale.set(sc, sc * 0.55, 1);
    m.position.set(Math.cos(a) * d, 1.5 + r() * 6, Math.sin(a) * d);
    m.userData = { a, d, ph: r() * 6, y: m.position.y, op: m.material.opacity };
    I.group.add(m); puffs.push(m);
  }
  // thick from afar; thins out once you're standing on the island so you can look around
  let near = 0;
  I.fogNear = (on, dt) => { near += ((on ? 1 : 0) - near) * Math.min(1, dt * 2); };
  I.updaters.push((t) => {
    for (const p of puffs) {
      p.material.opacity = p.userData.op * (1 - near * (p.userData.d < 12 ? 0.92 : 0.6));
      const a = p.userData.a + t * 0.02;
      p.position.x = Math.cos(a) * p.userData.d;
      p.position.z = Math.sin(a) * p.userData.d;
      p.position.y = p.userData.y + Math.sin(t * 0.4 + p.userData.ph) * 0.5;
    }
  });
  I.fogPuffs = puffs;
  return I;
}

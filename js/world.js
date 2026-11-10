// Sky, sea, light, clouds and the small living details between islands.
import * as THREE from 'three';
import { U, IS_MOBILE, rng, canvasTex, softDot, Builder } from './kit.js';

export const SUN_DIR = new THREE.Vector3(0.78, 0.13, -0.62).normalize();
export const SEA_Y = -72;
const _seg = new THREE.Vector3(), _rel = new THREE.Vector3();
let _segL = 0;

export function buildWorld(scene) {
  const fogCol = new THREE.Color('#f3c9b4');
  scene.fog = new THREE.Fog(fogCol, 160, 820);

  // sky dome
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: SUN_DIR }, uTime: U.time },
      vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vD; uniform vec3 uSun; uniform float uTime;
        void main(){
          float y=vD.y;
          vec3 zen=vec3(0.30,0.47,0.80), mid=vec3(0.58,0.68,0.93), hor=vec3(1.0,0.80,0.70), low=vec3(0.98,0.70,0.62);
          vec3 c = mix(hor, mid, smoothstep(0.0,0.28,y));
          c = mix(c, zen, smoothstep(0.25,0.85,y));
          c = mix(c, low, smoothstep(0.02,-0.12,y));
          float s=max(dot(vD,uSun),0.0);
          c += vec3(1.0,0.62,0.35)*pow(s,6.0)*0.55;
          c += vec3(1.0,0.85,0.55)*pow(s,60.0)*0.8;
          c = mix(c, vec3(1.0,0.97,0.86), smoothstep(0.9975,0.999,s));
          gl_FragColor=vec4(c,1.0);
        }`,
    }));
  sky.renderOrder = -10;
  scene.add(sky);

  // sea: colour deepens away from the sun, sun glitter path, little sparkles
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000, 1, 1).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uSun: { value: SUN_DIR } }]),
      vertexShader: `varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: `varying vec3 vW; uniform float uTime; uniform vec3 uSun;
        #include <fog_pars_fragment>
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          vec3 V=normalize(cameraPosition-vW);
          vec2 p=vW.xz*0.035;
          float n=noise(p+vec2(uTime*0.05,uTime*0.03))*0.6+noise(p*2.7-vec2(uTime*0.08,0.0))*0.4;
          vec3 deep=vec3(0.16,0.42,0.68), shallow=vec3(0.36,0.66,0.86);
          vec3 c=mix(deep,shallow,n);
          float fres=pow(1.0-max(V.y,0.0),3.0);
          c=mix(c, vec3(0.96,0.78,0.74), fres*0.55);
          vec3 R=reflect(-V, normalize(vec3((n-0.5)*0.25,1.0,(noise(p*3.1)-0.5)*0.25)));
          float s=pow(max(dot(R,uSun),0.0),180.0);
          c+=vec3(1.0,0.85,0.6)*s*2.2;
          float sp=step(0.985, noise(vW.xz*0.9+uTime*0.6))*step(0.6,n);
          c+=sp*0.5;
          gl_FragColor=vec4(c,1.0);
          #include <fog_fragment>
        }`,
    }));
  sea.position.y = SEA_Y;
  sea.material.uniforms.uTime = U.time;
  scene.add(sea);

  // light
  const hemi = new THREE.HemisphereLight('#d6e3ff', '#f0b98f', 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe2bf', 2.3);
  sun.position.set(60, 90, 25);
  sun.castShadow = !IS_MOBILE;
  if (sun.castShadow) {
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = c.bottom = -42; c.right = c.top = 42; c.near = 1; c.far = 260;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 3;
  }
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight('#ffb38a', 0.6);
  rim.position.copy(SUN_DIR).multiplyScalar(100);
  scene.add(rim);

  // clouds: painted billboards in several layers
  const cloudTexes = [0, 1, 2].map((i) => paintCloud(i + 3));
  const clouds = new THREE.Group();
  const r = rng(99);
  const nClouds = IS_MOBILE ? 38 : 70;
  for (let i = 0; i < nClouds; i++) {
    const layer = i % 3;
    const m = new THREE.SpriteMaterial({ map: cloudTexes[i % 3], transparent: true, depthWrite: false, fog: true, opacity: 0.92 });
    const s = new THREE.Sprite(m);
    const a = r() * Math.PI * 2;
    let y, d;
    if (layer === 0) { y = -58 + r() * 12; d = 30 + r() * 300; }   // a cloud sea below the islands
    else if (layer === 1) { y = -15 + r() * 30; d = 250 + r() * 150; } // drifting beyond the islands
    else { y = 40 + r() * 70; d = 300 + r() * 200; }                  // high, toward the horizon
    s.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
    s.userData.layer = layer;
    const sc = layer === 2 ? 70 + r() * 70 : layer === 1 ? 50 + r() * 40 : 30 + r() * 40;
    s.scale.set(sc, sc * 0.55, 1);
    s.userData.v = 0.6 + r() * 1.2;
    clouds.add(s);
  }
  // a band of big horizon clouds catching the sunset
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.3;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexes[i % 3], transparent: true, depthWrite: false, fog: false, opacity: 0.85, color: '#ffe0d0' }));
    s.position.set(Math.cos(a) * 700, -20 + r() * 50, Math.sin(a) * 700);
    const sc = 200 + r() * 160;
    s.scale.set(sc, sc * 0.45, 1);
    s.userData.v = 0.2;
    clouds.add(s);
  }
  scene.add(clouds);

  // sailboats on the sea
  const boats = new THREE.Group();
  const bb = new Builder(5);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = 70 + r() * 160;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, ry = r() * 6;
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, SEA_Y, z);
    bb.box(3, 0.7, 1.1, i % 2 ? '#a5583c' : '#f2ede2', 0, 0, 0, { matrix: m, ao: false });
    bb.cyl(0.07, 0.07, 4.5, 4, '#6a4a32', 0, 0.6, 0, { matrix: m, ao: false });
    bb.add(new THREE.ConeGeometry(1.3, 3.8, 3), i % 3 ? '#fff8ec' : '#f5c9a6', 0.5, 2.9, 0, { matrix: m, sx: 0.12, ao: false, jitter: 0 });
  }
  boats.add(bb.build());
  scene.add(boats);

  // birds: a few soft V shapes circling
  const birds = new THREE.Group();
  const birdGeo = new THREE.BufferGeometry();
  birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0.3, 0, 0, 0, 0.3, 0, 0, -0.2, 0, 0, 0.3, 1, 0.3, 0, 0, 0, -0.2], 3));
  const birdMat = new THREE.MeshBasicMaterial({ color: '#3d3550', side: THREE.DoubleSide, fog: true });
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(birdGeo, birdMat);
    m.userData = { c: new THREE.Vector3((r() - 0.5) * 260, 25 + r() * 35, -40 + (r() - 0.5) * 200), rad: 12 + r() * 25, sp: 0.15 + r() * 0.15, ph: r() * 6 };
    m.scale.setScalar(0.8 + r() * 0.5);
    birds.add(m);
  }
  scene.add(birds);

  // drifting golden motes / dandelion fluff that follow the camera
  const N = IS_MOBILE ? 160 : 380;
  const mp = new Float32Array(N * 3), ms = new Float32Array(N);
  for (let i = 0; i < N; i++) { mp[i * 3] = (r() - 0.5) * 80; mp[i * 3 + 1] = (r() - 0.5) * 30; mp[i * 3 + 2] = (r() - 0.5) * 80; ms[i] = r(); }
  const motesGeo = new THREE.BufferGeometry();
  motesGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  motesGeo.setAttribute('seed', new THREE.BufferAttribute(ms, 1));
  const motes = new THREE.Points(motesGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.time, uCam: { value: new THREE.Vector3() }, uMap: { value: softDot(64) }, uPx: { value: Math.min(devicePixelRatio, 2) }, uMotion: U.sway },
    vertexShader: `attribute float seed; uniform float uTime; uniform vec3 uCam; uniform float uPx; uniform float uMotion; varying float vA;
      void main(){
        vec3 p=position;
        float t=uTime*uMotion;
        p.x+=sin(t*0.3+seed*20.0)*2.0 + t*0.8;
        p.y+=sin(t*0.5+seed*13.0)*1.2 + t*0.25*(seed-0.3);
        p.z+=cos(t*0.25+seed*7.0)*2.0;
        vec3 box=vec3(80.0,30.0,80.0);
        p = uCam + mod(p - uCam + box*0.5, box) - box*0.5;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mv;
        vA = (0.4+0.6*sin(uTime*1.5+seed*30.0)) * smoothstep(60.0, 8.0, -mv.z);
        gl_PointSize = (2.0+seed*3.5)*uPx*(28.0/max(-mv.z,1.0));
      }`,
    fragmentShader: `uniform sampler2D uMap; varying float vA; void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(vec3(1.0,0.9,0.6)*t.rgb, t.a*vA); }`,
  }));
  motes.frustumCulled = false;
  scene.add(motes);

  return {
    sun, sky, sea, clouds, motes,
    update(t, dt, cam, look) {
      if (look) { _seg.subVectors(look, cam.position); _segL = _seg.length(); _seg.divideScalar(_segL || 1); }
      for (const c of clouds.children) {
        c.position.x += c.userData.v * dt * U.sway.value;
        if (c.position.x > 520) c.position.x = -520;
        // keep the view clear: fade clouds close to the camera or in the line of sight
        const base = c.userData.o ?? (c.userData.o = c.material.opacity);
        let k = 1;
        if (look) {
          _rel.subVectors(c.position, cam.position);
          const dCam = _rel.length(), size = c.scale.x * 0.5;
          k = Math.min(1, Math.max(0, (dCam - size * 0.6) / (size * 1.6)));
          const along = _rel.dot(_seg);
          if (along > 0 && along < _segL + size) {
            const off = _rel.addScaledVector(_seg, -along).length();
            k = Math.min(k, Math.max(0, (off - size * 0.35) / (size * 0.6)));
          }
        }
        c.material.opacity += (base * k - c.material.opacity) * Math.min(1, dt * 4);
      }
      boats.children[0].position.x = Math.sin(t * 0.02) * 6;
      boats.children[0].position.y = Math.sin(t * 0.8) * 0.15;
      for (const bd of birds.children) {
        const u = bd.userData, a = t * u.sp * (U.sway.value ? 1 : 0.2) + u.ph;
        bd.position.set(u.c.x + Math.cos(a) * u.rad, u.c.y + Math.sin(a * 2) * 2, u.c.z + Math.sin(a) * u.rad);
        bd.rotation.y = -a;
        bd.scale.y = 0.6 + Math.abs(Math.sin(t * 6 + u.ph)) * 0.8;
      }
      motes.material.uniforms.uCam.value.copy(cam.position);
    },
  };
}

// a fluffy cumulus painted with layered soft circles: sunlit tops, lilac bellies
function paintCloud(seed) {
  const r = rng(seed);
  return canvasTex(512, 256, (g, w, h) => {
    const puffs = [];
    for (let i = 0; i < 26; i++) {
      const t = r();
      puffs.push({ x: w * (0.12 + t * 0.76), y: h * (0.62 - Math.sin(t * Math.PI) * 0.25 + (r() - 0.5) * 0.12), r: h * (0.12 + r() * 0.16) * (0.6 + Math.sin(t * Math.PI) * 0.7) });
    }
    // shadow pass (lower, lilac), then lit pass (upper, cream)
    for (const p of puffs) {
      const gr = g.createRadialGradient(p.x, p.y + p.r * 0.25, p.r * 0.2, p.x, p.y + p.r * 0.25, p.r);
      gr.addColorStop(0, 'rgba(214,190,222,0.95)'); gr.addColorStop(0.75, 'rgba(226,196,214,0.8)'); gr.addColorStop(1, 'rgba(230,200,215,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y + p.r * 0.25, p.r, 0, 7); g.fill();
    }
    for (const p of puffs) {
      const gr = g.createRadialGradient(p.x - p.r * 0.2, p.y - p.r * 0.35, p.r * 0.1, p.x, p.y - p.r * 0.1, p.r * 0.9);
      gr.addColorStop(0, 'rgba(255,252,246,1)'); gr.addColorStop(0.6, 'rgba(255,236,226,0.85)'); gr.addColorStop(1, 'rgba(255,225,215,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y - p.r * 0.1, p.r * 0.9, 0, 7); g.fill();
    }
    // feather the bottom edge
    g.globalCompositeOperation = 'destination-out';
    const fade = g.createLinearGradient(0, h * 0.7, 0, h);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fade; g.fillRect(0, 0, w, h);
  });
}

export { paintCloud };

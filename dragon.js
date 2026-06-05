/* ============================================================
   DRAGONFIRE — Three.js scene  (v3: full flying dragon)
   A winged dragon flies in side profile across a smouldering
   red sky, breathing a focused jet of fire straight ahead.
   Long neck, spread bat-wings, trailing barbed tail.
   Fully procedural — no external 3D assets.
   ============================================================ */
import * as THREE from 'three';

const canvas = document.getElementById('dragon-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;

/* ---------- Renderer / Scene / Camera ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x2a0805, 0.014);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.5, 20);
camera.lookAt(0, 1.4, -2);

/* shared noise GLSL */
const NOISE_GLSL = `
  float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float vnoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.02; a*=0.5; } return v; }
`;

/* ============================================================
   SKY — warm, cloudy, smouldering red dome
   ============================================================ */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    uTime:  { value: 0 },
    top:    { value: new THREE.Color(0x230505) },
    mid:    { value: new THREE.Color(0x6e1407) },
    horizon:{ value: new THREE.Color(0xd8500f) },
    bottom: { value: new THREE.Color(0x0a0302) }
  },
  vertexShader: `varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: NOISE_GLSL + `
    varying vec3 vW; uniform vec3 top, mid, horizon, bottom; uniform float uTime;
    void main(){
      float h = vW.y * 0.5 + 0.5;
      vec3 col = mix(bottom, mid, smoothstep(0.0, 0.5, h));
      col = mix(col, top, smoothstep(0.5, 1.0, h));
      // glowing band near the horizon
      float band = smoothstep(0.35, 0.0, abs(h - 0.34));
      col = mix(col, horizon, band * 0.7);
      // drifting clouds
      vec3 cd = vec3(vW.x*2.2, vW.y*2.2, vW.z*2.2);
      float clouds = fbm(cd + vec3(uTime*0.02, 0.0, uTime*0.015));
      clouds = smoothstep(0.45, 0.95, clouds);
      float cloudMask = smoothstep(0.85, 0.15, h);   // mostly lower sky
      col = mix(col, horizon * 1.05 + vec3(0.05), clouds * cloudMask * 0.55);
      gl_FragColor = vec4(col, 1.0);
    }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(220, 40, 40), skyMat));

/* ============================================================
   LIGHTS
   ============================================================ */
scene.add(new THREE.AmbientLight(0x5a1a10, 1.5));
const key = new THREE.DirectionalLight(0xff7a40, 0.8); key.position.set(12, 4, 8); scene.add(key);
const back = new THREE.DirectionalLight(0x7a1e20, 0.7); back.position.set(-10, 12, -6); scene.add(back);
const fireLight = new THREE.PointLight(0xff7a1e, 4, 90, 2); scene.add(fireLight);

/* ============================================================
   PROCEDURAL SCALE TEXTURE (bump + roughness)
   ============================================================ */
function makeScaleTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#241310'; g.fillRect(0, 0, s, s);
  const r = 12;
  for (let y = -r; y < s + r; y += r * 0.9) {
    const off = ((Math.round(y / (r * 0.9))) % 2) * r;
    for (let x = -r; x < s + r; x += r * 2) {
      const cx = x + off, cy = y;
      const grad = g.createRadialGradient(cx, cy - r * 0.3, 1, cx, cy, r);
      grad.addColorStop(0, '#8a4338');
      grad.addColorStop(0.55, '#3a1d18');
      grad.addColorStop(1, '#120807');
      g.fillStyle = grad;
      g.beginPath(); g.arc(cx, cy, r * 0.95, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.1; g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2);
  return tex;
}
const scaleTex = makeScaleTexture();

/* ============================================================
   MATERIALS
   ============================================================ */
const hideMat = new THREE.MeshStandardMaterial({
  color: 0x5a1d12, roughness: 0.95, metalness: 0.2,
  emissive: 0x4a0e05, emissiveIntensity: 0.35,
  bumpMap: scaleTex, bumpScale: 0.05, roughnessMap: scaleTex
});
const hornMat  = new THREE.MeshStandardMaterial({ color: 0x1c130f, roughness: 0.45, metalness: 0.4, emissive: 0x220500, emissiveIntensity: .3 });
const teethMat = new THREE.MeshStandardMaterial({ color: 0xeadfce, roughness: 0.4 });
const eyeMat   = new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffb000, emissiveIntensity: 2.6, roughness: 0.2 });
const membraneMat = new THREE.MeshStandardMaterial({
  color: 0x6e1810, roughness: 0.8, metalness: 0.05,
  emissive: 0x8a160e, emissiveIntensity: 0.5, side: THREE.DoubleSide,
  transparent: true, opacity: 0.96
});

/* ============================================================
   THE FLYING DRAGON  (local space: +X = forward / flight & fire)
   ============================================================ */
const dragon = new THREE.Group();
dragon.position.set(-1.5, 3.4, -3);
dragon.rotation.y = -0.42;     // turn toward camera for a 3/4 side view
dragon.rotation.z = 0.06;
dragon.scale.setScalar(0.92);
scene.add(dragon);

function spike(len, rad, mat) { return new THREE.Mesh(new THREE.ConeGeometry(rad, len, 6), mat || hornMat); }

/* ---- TORSO ---- */
const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), hideMat);
torso.scale.set(2.1, 1.15, 1.25);
dragon.add(torso);
// chest/belly
const chest = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), hideMat);
chest.scale.set(1.3, 1.0, 1.05); chest.position.set(1.2, -0.1, 0);
dragon.add(chest);

/* ---- NECK ---- */
const neck = new THREE.Group(); dragon.add(neck);
const NECK = 9;
const neckSeg = [], neckBase = [];
for (let i = 0; i < NECK; i++) {
  const t = i / (NECK - 1);
  const x = 1.7 + t * 2.1;
  const y = 0.5 + t * 1.25 + Math.sin(t * 1.6) * 0.15;
  const z = 0;
  neckBase.push(new THREE.Vector3(x, y, z));
  const rad = 0.78 - t * 0.34;
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 2), hideMat);
  m.position.set(x, y, z); neck.add(m); neckSeg.push(m);
  const sp = spike(0.35 + rad * 0.7, 0.09 + rad * 0.08);
  sp.position.set(x - 0.15, y + rad * 0.85, z); sp.rotation.z = -0.35;
  neck.add(sp);
}

/* ---- HEAD (at neck tip, jaws forward) ---- */
const head = new THREE.Group();
const hp = neckBase[NECK - 1];
head.position.set(hp.x + 0.2, hp.y + 0.35, 0);
head.rotation.z = -0.35;       // snout tips slightly down
dragon.add(head);
const HS = 0.62;               // head scale
const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), hideMat);
skull.scale.setScalar(HS); skull.scale.y *= 0.92; head.add(skull);
const upperJaw = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * HS / 0.62, 0.6, 1.7 * HS / 0.62, 9), hideMat);
upperJaw.rotation.z = Math.PI / 2; upperJaw.position.set(0.95 * HS / 0.62, 0.05, 0); upperJaw.scale.z = 0.8; head.add(upperJaw);
const jaw = new THREE.Group(); jaw.position.set(0.2, -0.22 * HS / 0.62, 0); head.add(jaw);
const lowerJaw = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 1.5, 9), hideMat);
lowerJaw.rotation.z = Math.PI / 2; lowerJaw.position.set(0.7, -0.04, 0); lowerJaw.scale.set(HS / 0.62, 0.65, 0.76 * HS / 0.62); jaw.add(lowerJaw);
// teeth
function addTeeth(parent, n, x0, y, len, side2) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    [-1, 1].forEach((s) => {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.045, len, 5), teethMat);
      tooth.position.set(x0 + t * 0.95, y, s * (0.12 + t * 0.18));
      tooth.rotation.z = side2 > 0 ? Math.PI : 0;
      parent.add(tooth);
    });
  }
}
addTeeth(head, 6, 0.55, -0.27, 0.2, 1);
addTeeth(jaw, 5, 0.45, 0.2, 0.18, -1);
// eyes
[-1, 1].forEach((s) => {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), eyeMat);
  eye.position.set(0.18, 0.22, s * 0.4); head.add(eye);
});
// horns
[-1, 1].forEach((s) => {
  const h1 = spike(1.4, 0.11);
  h1.position.set(-0.32, 0.42, s * 0.26); h1.rotation.z = 1.2; h1.rotation.y = s * 0.5; head.add(h1);
  const h2 = spike(0.8, 0.07);
  h2.position.set(-0.25, 0.22, s * 0.42); h2.rotation.z = 1.4; h2.rotation.y = s * 0.9; head.add(h2);
});
// mouth anchor (fire origin)
const mouthAnchor = new THREE.Object3D();
mouthAnchor.position.set(1.5 * HS / 0.62, -0.05, 0);
head.add(mouthAnchor);

/* ---- TAIL (long, tapering, barbed) ---- */
const tail = new THREE.Group(); dragon.add(tail);
const TAIL = 18;
const tailSeg = [], tailBase = [];
for (let i = 0; i < TAIL; i++) {
  const t = i / (TAIL - 1);
  const x = -1.7 - t * 7.5;
  const y = 0.25 - t * 0.6 + Math.sin(t * 3.0) * 0.3;
  const z = 0;
  tailBase.push(new THREE.Vector3(x, y, z));
  const rad = Math.max(0.06, 0.85 * (1 - t) * (1 - t) + 0.05);
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 2), hideMat);
  m.position.set(x, y, z); tail.add(m); tailSeg.push(m);
  if (i % 2 === 0 && t < 0.85) {
    const sp = spike(0.2 + rad * 0.9, 0.05 + rad * 0.08);
    sp.position.set(x, y + rad * 0.9, z); sp.rotation.z = -0.3; tail.add(sp);
  }
}
// arrow/barb tail-fin
const finShape = new THREE.Shape();
finShape.moveTo(0, 0); finShape.lineTo(-0.9, 0.7); finShape.lineTo(-0.5, 0);
finShape.lineTo(-0.9, -0.7); finShape.lineTo(0, 0);
const tailFin = new THREE.Mesh(new THREE.ShapeGeometry(finShape), membraneMat);
const tp = tailBase[TAIL - 1];
tailFin.position.set(tp.x - 0.2, tp.y, 0);
tailFin.rotation.y = Math.PI / 2;
tail.add(tailFin);

/* ---- LEGS (tucked) ---- */
function leg(x, z) {
  const g = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.9, 7), hideMat);
  thigh.rotation.z = 0.9; thigh.position.set(-0.1, -0.1, 0); g.add(thigh);
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.7, 7), hideMat);
  shin.position.set(0.3, -0.5, 0); shin.rotation.z = -0.3; g.add(shin);
  for (let i = -1; i <= 1; i++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5), hornMat);
    claw.position.set(0.5 + i * 0.06, -0.78, i * 0.08); claw.rotation.x = 0.4; g.add(claw);
  }
  g.position.set(x, -0.95, z);
  return g;
}
dragon.add(leg(0.9, 0.65), leg(0.9, -0.65), leg(-0.9, 0.6), leg(-0.9, -0.6));

/* ---- WINGS (large bat membranes that flap) ---- */
function buildWing() {
  const g = new THREE.Group();
  // outline in (x=chord forward, y=span outward)
  const pts = [[0,0],[2.9,0.4],[4.7,1.3],[3.7,2.4],[2.7,3.2],[1.5,2.9],[0.5,1.9],[-0.7,0.7]];
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.lineTo(0, 0);
  const membrane = new THREE.Mesh(new THREE.ShapeGeometry(shape, 26), membraneMat);
  g.add(membrane);
  // arm + finger bones to the outer points
  [[4.7,1.3],[3.7,2.4],[2.7,3.2],[1.5,2.9]].forEach(([tx,ty]) => {
    const len = Math.hypot(tx, ty);
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, len, 6), hornMat);
    bone.position.set(tx/2, ty/2, 0.03);
    bone.rotation.z = Math.atan2(ty, tx) - Math.PI/2;
    g.add(bone);
  });
  return g;
}
const shoulderX = 0.3, shoulderY = 0.85;
const wingNear = new THREE.Group();           // toward camera (+Z)
wingNear.position.set(shoulderX, shoulderY, 0.4);
wingNear.add(buildWing());
dragon.add(wingNear);
const wingFar = new THREE.Group();            // away (-Z)
wingFar.position.set(shoulderX, shoulderY, -0.4);
const fw = buildWing(); fw.scale.y = -1;       // mirror span
wingFar.add(fw);
dragon.add(wingFar);

/* ============================================================
   FLAME JET  — shader core + focused particle torrent + smoke
   ============================================================ */
const breath = new THREE.Group(); scene.add(breath);
const FLAME_LEN = 12;

const coreMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: NOISE_GLSL + `
    varying vec2 vUv; uniform float uTime, uIntensity;
    void main(){
      float len = 1.0 - clamp(vUv.y, 0.0, 1.0);     // 0 at mouth, 1 at far tip
      float around = vUv.x;
      float n  = fbm(vec3(around*6.0, len*5.0 - uTime*2.8, uTime*0.7));
      float n2 = fbm(vec3(around*3.0 + 5.0, len*3.0 - uTime*1.7, 2.0));
      float body = smoothstep(1.0, 0.12, len);
      float flick = body * (0.55 + 0.7*n) * (0.6 + 0.5*n2);
      float core = smoothstep(0.5, 0.0, len);
      vec3 white=vec3(1.0,0.96,0.82), yellow=vec3(1.0,0.72,0.18), orange=vec3(1.0,0.34,0.05), red=vec3(0.72,0.06,0.02);
      float temp = clamp(flick + core*0.85, 0.0, 1.0);
      vec3 col = mix(red, orange, smoothstep(0.15,0.45,temp));
      col = mix(col, yellow, smoothstep(0.45,0.72,temp));
      col = mix(col, white, smoothstep(0.72,1.0,temp));
      float alpha = flick * uIntensity * smoothstep(0.0, 0.1, len);
      if(alpha < 0.02) discard;
      gl_FragColor = vec4(col*(0.9+core), alpha);
    }`
});
const coreGeo = new THREE.ConeGeometry(2.0, FLAME_LEN, 24, 22, true);
const flameCore = new THREE.Mesh(coreGeo, coreMat);
flameCore.geometry.translate(0, -FLAME_LEN/2, 0);
flameCore.rotation.z = Math.PI/2;                 // plume extends +X
breath.add(flameCore);
const coreMat2 = coreMat.clone();
coreMat2.uniforms = { uTime: coreMat.uniforms.uTime, uIntensity: { value: 1.4 } };
const flameInner = new THREE.Mesh(new THREE.ConeGeometry(0.9, FLAME_LEN*0.7, 18, 16, true), coreMat2);
flameInner.geometry.translate(0, -(FLAME_LEN*0.7)/2, 0);
flameInner.rotation.z = Math.PI/2;
breath.add(flameInner);

function makeGlow() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(32,32,0,32,32,32);
  grd.addColorStop(0,'rgba(255,255,255,1)'); grd.addColorStop(0.3,'rgba(255,210,140,0.9)');
  grd.addColorStop(0.6,'rgba(255,110,30,0.45)'); grd.addColorStop(1,'rgba(255,40,0,0)');
  g.fillStyle = grd; g.fillRect(0,0,64,64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = makeGlow();

const FIRE = isMobile ? 500 : 1100;
const fPos = new Float32Array(FIRE*3), fCol = new Float32Array(FIRE*3), fLife = new Float32Array(FIRE), fMax = new Float32Array(FIRE);
const fVel = []; for (let i=0;i<FIRE;i++){ fVel.push(new THREE.Vector3()); fPos[i*3+1]=9999; }
const fGeo = new THREE.BufferGeometry();
fGeo.setAttribute('position', new THREE.BufferAttribute(fPos,3));
fGeo.setAttribute('color', new THREE.BufferAttribute(fCol,3));
const fire = new THREE.Points(fGeo, new THREE.PointsMaterial({ size:1.3, map:glowTex, vertexColors:true, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true }));
scene.add(fire); let fCursor = 0;

const SMOKE = isMobile ? 80 : 150;
const sPos = new Float32Array(SMOKE*3), sLife = new Float32Array(SMOKE);
const sVel = []; for (let i=0;i<SMOKE;i++){ sVel.push(new THREE.Vector3()); sPos[i*3+1]=9999; }
const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos,3));
const smoke = new THREE.Points(sGeo, new THREE.PointsMaterial({ size:4.5, map:glowTex, color:0x1a0c08, transparent:true, opacity:0.45, depthWrite:false }));
scene.add(smoke); let sCursor = 0;

function rampColor(arr, idx, t) {
  let r,g,b;
  if (t>0.7){ const k=(1-t)/0.3; r=1; g=0.95-k*0.2; b=0.8-k*0.55; }
  else if (t>0.4){ const k=(0.7-t)/0.3; r=1; g=0.75-k*0.4; b=0.25-k*0.2; }
  else { const k=(0.4-t)/0.4; r=1-k*0.45; g=0.35-k*0.32; b=0.05; }
  const f=Math.min(t*1.8,1);
  arr[idx]=r*f; arr[idx+1]=Math.max(g,0)*f; arr[idx+2]=Math.max(b,0)*f;
}

const _origin = new THREE.Vector3(), _dir = new THREE.Vector3(), _tmp = new THREE.Vector3();

function emitFire(intensity) {
  const n = Math.round((isMobile ? 14 : 26) * intensity);
  for (let k=0;k<n;k++) {
    const i = fCursor; fCursor = (fCursor+1)%FIRE;
    const along = Math.random()*1.4;
    fPos[i*3]   = _origin.x + _dir.x*along + (Math.random()-0.5)*0.18;
    fPos[i*3+1] = _origin.y + _dir.y*along + (Math.random()-0.5)*0.18;
    fPos[i*3+2] = _origin.z + _dir.z*along + (Math.random()-0.5)*0.18;
    const spd = 11 + Math.random()*7;
    _tmp.copy(_dir).multiplyScalar(spd);
    _tmp.x += (Math.random()-0.5)*2.6;     // focused jet (tight spread)
    _tmp.y += (Math.random()-0.5)*2.6;
    _tmp.z += (Math.random()-0.5)*2.6;
    fVel[i].copy(_tmp);
    fMax[i] = 0.65 + Math.random()*0.6; fLife[i] = fMax[i];
  }
  if (Math.random() < 0.55) {
    const i = sCursor; sCursor = (sCursor+1)%SMOKE;
    _tmp.copy(_dir).multiplyScalar(FLAME_LEN*0.72);
    sPos[i*3]   = _origin.x + _tmp.x + (Math.random()-0.5)*1.6;
    sPos[i*3+1] = _origin.y + _tmp.y + (Math.random()-0.5)*1.6;
    sPos[i*3+2] = _origin.z + _tmp.z + (Math.random()-0.5)*1.6;
    sVel[i].set(_dir.x*2+(Math.random()-0.5)*1.2, 1.6+Math.random()*1.4, _dir.z*2+(Math.random()-0.5)*1.2);
    sLife[i] = 1.0;
  }
}
function updateFire(dt) {
  const pos = fGeo.attributes.position, col = fGeo.attributes.color;
  for (let i=0;i<FIRE;i++){
    if (fLife[i]<=0){ if(fPos[i*3+1]!==9999) fPos[i*3+1]=9999; continue; }
    fLife[i]-=dt; const v=fVel[i]; v.multiplyScalar(0.92); v.y+=dt*2.6;
    fPos[i*3]+=v.x*dt; fPos[i*3+1]+=v.y*dt; fPos[i*3+2]+=v.z*dt;
    rampColor(col.array, i*3, Math.max(fLife[i]/fMax[i],0));
  }
  pos.needsUpdate=true; col.needsUpdate=true;
  const sp = sGeo.attributes.position;
  for (let i=0;i<SMOKE;i++){
    if (sLife[i]<=0){ if(sPos[i*3+1]!==9999) sPos[i*3+1]=9999; continue; }
    sLife[i]-=dt*0.4; sPos[i*3]+=sVel[i].x*dt; sPos[i*3+1]+=sVel[i].y*dt; sPos[i*3+2]+=sVel[i].z*dt; sVel[i].multiplyScalar(0.98);
  }
  sp.needsUpdate=true;
}

/* ============================================================
   BACKGROUND EMBERS
   ============================================================ */
const EMB = isMobile ? 130 : 280;
const ePos = new Float32Array(EMB*3), eSpd = new Float32Array(EMB);
for (let i=0;i<EMB;i++){ ePos[i*3]=(Math.random()-0.5)*100; ePos[i*3+1]=(Math.random()-0.5)*55-5; ePos[i*3+2]=(Math.random()-0.5)*70-15; eSpd[i]=0.4+Math.random()*1.3; }
const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(ePos,3));
scene.add(new THREE.Points(eGeo, new THREE.PointsMaterial({ size:0.45, map:glowTex, color:0xff5a2a, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false })));

/* ============================================================
   ANIMATION
   ============================================================ */
const _q = new THREE.Quaternion();
const pointer = { x:0, y:0, tx:0, ty:0 };
window.addEventListener('pointermove', (e)=>{ pointer.tx=e.clientX/window.innerWidth-0.5; pointer.ty=e.clientY/window.innerHeight-0.5; }, { passive:true });

const clock = new THREE.Clock();
let elapsed = 0, running = true;
document.addEventListener('visibilitychange', ()=>{ running=!document.hidden; if(running) clock.getDelta(); });

function frame() {
  requestAnimationFrame(frame);
  if (!running) return;
  let dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt; const t = elapsed;
  const sway = reduceMotion ? 0 : 1;

  /* fire surges */
  const surge = 0.72 + 0.28*Math.sin(t*0.9) + 0.2*Math.sin(t*2.6);
  const intensity = reduceMotion ? 0.7 : Math.max(0.5, surge);
  coreMat.uniforms.uTime.value = t;
  coreMat.uniforms.uIntensity.value = 0.62*intensity;
  coreMat2.uniforms.uIntensity.value = 0.9*intensity;
  skyMat.uniforms.uTime.value = t;

  /* flight: bob + gentle bank, slow drift across */
  dragon.position.y = 3.4 + Math.sin(t*0.55)*0.35*sway;
  dragon.position.x = -1.5 + Math.sin(t*0.3)*0.6*sway;
  dragon.rotation.z = 0.06 + Math.sin(t*0.55)*0.04*sway;
  dragon.rotation.y = -0.42 + pointer.x*0.18 + Math.sin(t*0.25)*0.05*sway;

  /* wings flap (base ±90° spread, oscillating) */
  const flap = reduceMotion ? 0.15 : Math.sin(t*2.2)*0.5;
  wingNear.rotation.x = Math.PI/2 + 0.15 + flap;
  wingFar.rotation.x  = -Math.PI/2 - 0.15 - flap;
  wingNear.rotation.y = -0.15; wingFar.rotation.y = 0.15;

  /* neck + head subtle motion */
  for (let i=0;i<NECK;i++){ const m=neckSeg[i]; const b=neckBase[i]; m.position.z = b.z + Math.sin(t*1.0+i*0.4)*0.05*sway; }
  head.rotation.z = -0.35 + Math.sin(t*0.9)*0.05*sway - pointer.y*0.12;
  head.rotation.y = Math.sin(t*0.6)*0.06*sway + pointer.x*0.12;
  jaw.rotation.z = -(0.16 + intensity*0.2);

  /* tail swims */
  for (let i=0;i<TAIL;i++){ const m=tailSeg[i]; const b=tailBase[i]; const ph=t*1.6 - i*0.45;
    m.position.z = b.z + Math.sin(ph)*0.5*(i/TAIL)*sway;
    m.position.y = b.y + Math.cos(ph*0.7)*0.15*(i/TAIL)*sway; }
  const tl = tailSeg[TAIL-1]; tailFin.position.set(tl.position.x-0.2, tl.position.y, tl.position.z);

  /* fire origin + direction from the mouth */
  mouthAnchor.getWorldPosition(_origin);
  _dir.set(1,0,0).applyQuaternion(head.getWorldQuaternion(_q)).normalize();
  breath.position.copy(_origin);
  breath.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0), _dir);
  fireLight.position.copy(_origin).addScaledVector(_dir, 2);
  fireLight.intensity = (3.5 + Math.sin(t*40)*1.2 + Math.sin(t*13)*0.8)*intensity;

  if (!reduceMotion || elapsed < 1) emitFire(intensity);
  updateFire(dt);

  for (let i=0;i<EMB;i++){ ePos[i*3+1]+=eSpd[i]*dt; ePos[i*3]+=Math.sin(t*0.5+i)*dt*0.25; if(ePos[i*3+1]>30){ ePos[i*3+1]=-28; ePos[i*3]=(Math.random()-0.5)*100; } }
  eGeo.attributes.position.needsUpdate = true;

  pointer.x += (pointer.tx-pointer.x)*0.04; pointer.y += (pointer.ty-pointer.y)*0.04;
  camera.position.x += (pointer.x*4 - camera.position.x)*0.05;
  camera.position.y += (1.5 - pointer.y*2.5 - camera.position.y)*0.05;
  camera.lookAt(0, 1.4, -2);

  renderer.render(scene, camera);
}

window.addEventListener('resize', ()=>{ camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

frame();
window.requestAnimationFrame(()=>{ const l=document.getElementById('loader'); if(l) setTimeout(()=>l.classList.add('hide'), 500); });
canvas.addEventListener('webglcontextlost', (e)=>{ e.preventDefault(); canvas.style.display='none'; document.body.style.background='radial-gradient(circle at 50% 30%, #2a0606, #070202 70%)'; });
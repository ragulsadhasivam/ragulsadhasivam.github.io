// Stylised full-body 3D avatar of Ragul beside a standing desk with two monitors (built from primitives).
// Likeness (from the owner's portrait): short dark wavy hair with volume on top, trimmed moustache and short
// beard, warm brown skin, thick straight brows, black rolled-sleeve shirt over a white tee,
// silver bracelet on one wrist, dark smartwatch on the other.
import * as THREE from 'three';

const C = {
  skin: 0xa86f4c, skinShade: 0x8f5b3d, hair: 0x15100d, beard: 0x1b1410,
  shirt: 0x15171d, tee: 0xf1efe9, jeans: 0x3b4660, shoe: 0xf1efe9, sole: 0xbfb8ad,
  mouth: 0x3a1512, silver: 0xd0d4dc, watch: 0x1b1f27, strap: 0x2b303a,
  wood: 0xe9c9a3, metal: 0x1c1411, cream: 0xfff6ea,
};
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function limb(a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.001), 6, 16), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

function screenTexture(kind) {
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 400;
  const g = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const bars = [[0.06, 0.34, '#FFD2B4'], [0.22, 0.5, '#FFF6EA'], [0.4, 0.78, '#D98C6B'], [0.12, 0.62, '#FFD2B4'], [0.55, 0.92, '#FFF6EA']];
  function draw(t) {
    g.fillStyle = '#1e120d'; g.fillRect(0, 0, 640, 400);
    g.fillStyle = '#2a1710'; g.fillRect(0, 0, 640, 34);
    ['#FFD2B4', '#D98C6B', '#8c5a44'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(18 + i * 18, 17, 5, 0, 7); g.fill(); });
    if (kind === 'timeline') {
      g.strokeStyle = '#4a2b1e'; g.lineWidth = 1;
      for (let i = 0; i <= 12; i++) { const x = 40 + i * 48; g.beginPath(); g.moveTo(x, 50); g.lineTo(x, 380); g.stroke(); }
      bars.forEach(([s, e, col], i) => { g.fillStyle = col; g.globalAlpha = 0.92; g.fillRect(40 + s * 576, 70 + i * 60, (e - s) * 576, 30); g.globalAlpha = 1; });
      const px = 40 + ((t * 0.12) % 1) * 576; g.fillStyle = '#FFF6EA'; g.fillRect(px - 1, 44, 2, 340);
      g.beginPath(); g.moveTo(px - 7, 44); g.lineTo(px + 7, 44); g.lineTo(px, 56); g.fill();
    } else {
      [0, 1, 2].forEach((i) => {
        const x = 60 + i * 190; g.strokeStyle = '#FFF6EA'; g.lineWidth = 2; g.strokeRect(x, 70, 150, 290);
        g.fillStyle = '#FFD2B4'; g.fillRect(x + 14, 84, 122, 70);
        g.fillStyle = '#4a2b1e'; g.fillRect(x + 14, 170, 90, 12); g.fillRect(x + 14, 192, 122, 12); g.fillRect(x + 14, 214, 70, 12);
        const pulse = 14 + 10 * Math.sin(t * 2 + i); g.strokeStyle = '#D98C6B'; g.beginPath(); g.arc(x + 75, 300, pulse, 0, 7); g.stroke();
      });
    }
    tex.needsUpdate = true;
  }
  draw(0); return { tex, draw };
}

function softDisc(color, opacity, rx, rz) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(rx * 2, rz * 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, color, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}

export function createAvatar() {
  const root = new THREE.Group();
  const skin = mat(C.skin, { roughness: 0.55 }), skinShade = mat(C.skinShade), hairM = mat(C.hair, { roughness: 0.9 });

  /* floor shadows: the page colour is the room */
  const sh1 = softDisc(0x4a1d0c, 0.38, 0.55, 0.4); sh1.position.set(0.95, 0.002, 0.05); root.add(sh1);
  const sh2 = softDisc(0x4a1d0c, 0.32, 1.4, 0.55); sh2.position.set(-0.85, 0.002, 0.1); root.add(sh2);

  /* standing desk with two monitors */
  const desk = new THREE.Group(); root.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 0.85), mat(C.wood, { roughness: 0.5 })); top.position.set(-0.85, 1.0, 0.1); desk.add(top);
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.0, 0.07), mat(C.metal, { roughness: 0.4, metalness: 0.4 })); leg.position.set(-0.85 + s * 1.0, 0.5, 0.1); desk.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.7), mat(C.metal, { roughness: 0.4, metalness: 0.4 })); foot.position.set(-0.85 + s * 1.0, 0.02, 0.1); desk.add(foot);
  });
  const screens = [];
  [[-1.25, 'timeline'], [-0.45, 'frames']].forEach(([x, kind], i) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.5, 0.035), mat(0x0e0907, { roughness: 0.4 })); frame.position.set(x, 1.34, 0.0); frame.rotation.y = i === 0 ? 0.18 : -0.12; desk.add(frame);
    const s = screenTexture(kind);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.77, 0.45), new THREE.MeshBasicMaterial({ map: s.tex })); scr.position.set(0, 0, 0.019); frame.add(scr); screens.push(s);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.03), mat(C.metal)); arm.position.set(x, 1.12, -0.03); desk.add(arm);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.18), mat(C.metal)); base.position.set(x, 1.03, 0.03); desk.add(base);
  });
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.018, 0.14), mat(0x0e0907)); kb.position.set(-0.85, 1.035, 0.3); desk.add(kb);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 20), mat(C.cream, { roughness: 0.4 })); mug.position.set(-0.1, 1.075, 0.25); desk.add(mug);

  /* character */
  const person = new THREE.Group(); person.position.set(0.95, 0, 0.1); person.rotation.y = -0.28; root.add(person);
  const shirt = mat(C.shirt, { roughness: 0.85 }), tee = mat(C.tee, { roughness: 0.8 }), jeans = mat(C.jeans, { roughness: 0.8 });

  [-1, 1].forEach((s) => {
    person.add(limb(new THREE.Vector3(s * 0.075, 0.92, 0), new THREE.Vector3(s * 0.085, 0.1, 0.0), 0.072, jeans));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), mat(C.shoe, { roughness: 0.6 })); shoe.scale.set(0.9, 0.55, 1.7); shoe.position.set(s * 0.09, 0.055, 0.07); person.add(shoe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.3), mat(C.sole)); sole.position.set(s * 0.09, 0.013, 0.08); person.add(sole);
  });
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), jeans); pelvis.scale.set(1.1, 0.8, 0.8); pelvis.position.y = 0.93; person.add(pelvis);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 8, 24), shirt); torso.scale.set(1.5, 1, 0.8); torso.position.set(0, 1.18, 0); person.add(torso);
  const hemM = mat(C.shirt, { roughness: 0.85, side: THREE.DoubleSide });
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 28, 1, true), hemM); hem.scale.set(1.15, 1, 0.8); hem.position.set(0, 0.98, 0); person.add(hem);
  const teeV = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.3, 4), tee); teeV.rotation.set(0, Math.PI / 4, Math.PI); teeV.scale.set(1, 1, 0.3); teeV.position.set(0, 1.29, 0.125); person.add(teeV);
    [-1, 1].forEach((s) => {
    const lap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.03), shirt); lap.position.set(s * 0.115, 1.14, 0.14); lap.rotation.z = s * -0.07; person.add(lap);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.03), shirt); col.position.set(s * 0.085, 1.4, 0.11); col.rotation.z = s * -0.55; person.add(col);
  });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.12, 20), skinShade); neck.position.set(0, 1.42, 0.01); person.add(neck);

  const armDesk = { sh: new THREE.Vector3(-0.22, 1.32, 0), el: new THREE.Vector3(-0.34, 1.12, 0.16), ha: new THREE.Vector3(-0.5, 1.045, 0.2) };
  const armFree = { sh: new THREE.Vector3(0.22, 1.32, 0), el: new THREE.Vector3(0.27, 1.06, 0.04), ha: new THREE.Vector3(0.25, 0.86, 0.1) };
  [armDesk, armFree].forEach((a) => {
    person.add(limb(a.sh, a.el, 0.062, shirt));
    person.add(limb(a.el, a.el.clone().lerp(a.ha, 0.2), 0.058, shirt));
    person.add(limb(a.el.clone().lerp(a.ha, 0.35), a.ha, 0.044, skin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 14), skin); hand.scale.set(1, 0.85, 1.15); hand.position.copy(a.ha); person.add(hand);
  });
  const dirD = armDesk.ha.clone().sub(armDesk.el).normalize();
  const brace = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.007, 10, 28), mat(C.silver, { metalness: 0.8, roughness: 0.25 })); brace.position.copy(armDesk.ha.clone().lerp(armDesk.el, 0.2)); brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirD); person.add(brace);
  const dirF = armFree.ha.clone().sub(armFree.el).normalize(); const wp = armFree.ha.clone().lerp(armFree.el, 0.2);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 10, 28), mat(C.strap)); strap.position.copy(wp); strap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirF); person.add(strap);
  const wface = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 24), mat(C.watch, { roughness: 0.3, metalness: 0.4 })); wface.position.copy(wp).add(new THREE.Vector3(0.05, 0, 0.02)); wface.rotation.z = Math.PI / 2; person.add(wface);

  /* head: Pixar-style proportions, big glossy eyes */
  const head = new THREE.Group(); head.position.set(0, 1.7, 0.02); head.scale.setScalar(0.56); person.add(head);
  const HS = new THREE.Vector3(0.92, 1.06, 0.97), HR = 0.36;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(HR, 56, 40), skin); skull.scale.copy(HS); head.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(HR * 0.86, 44, 30), skin); jaw.scale.set(0.9, 0.74, 0.92); jaw.position.set(0, -0.16, 0.03); head.add(jaw);
  const beardM = mat(C.beard, { roughness: 0.95, side: THREE.DoubleSide });
  const beard = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.012, 48, 32, 0.04 * Math.PI, 0.92 * Math.PI, 0.72 * Math.PI, 0.3 * Math.PI), beardM); beard.scale.copy(HS); head.add(beard);
  const jawBeard = new THREE.Mesh(new THREE.SphereGeometry(HR * 0.865, 40, 28, 0.04 * Math.PI, 0.92 * Math.PI, 0.45 * Math.PI, 0.55 * Math.PI), beardM); jawBeard.scale.set(0.9, 0.74, 0.92); jawBeard.position.copy(jaw.position); head.add(jawBeard);
  const stub = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.008, 48, 32, 0.05 * Math.PI, 0.9 * Math.PI, 0.5 * Math.PI, 0.24 * Math.PI), mat(C.beard, { transparent: true, opacity: 0.36, roughness: 1, side: THREE.DoubleSide })); stub.scale.copy(HS); head.add(stub);
  [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), skinShade); e.scale.set(0.45, 1, 0.75); e.position.set(s * 0.335, -0.01, -0.01); head.add(e); });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), skinShade); nose.scale.set(0.9, 1.1, 1); nose.position.set(0, -0.035, 0.355); head.add(nose);

  const eyes = new THREE.Group(); head.add(eyes); const irises = [];
  [-1, 1].forEach((s) => {
    const eg = new THREE.Group(); eg.position.set(s * 0.118, 0.05, 0.315);
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.068, 24, 18), mat(0xfaf7f1, { roughness: 0.25 })); w.scale.set(1.1, 0.95, 0.5); eg.add(w);
    const ir = new THREE.Group(); ir.position.z = 0.02;
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 16), mat(0x3a2112, { roughness: 0.2 })); iris.scale.set(1, 1, 0.45); ir.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), mat(0x050302, { roughness: 0.1 })); pupil.position.z = 0.012; pupil.scale.set(1, 1, 0.4); ir.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.01, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(0.014, 0.014, 0.022); ir.add(glint);
    eg.add(ir); irises.push(ir); eyes.add(eg);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.035), hairM); brow.position.set(s * 0.125, 0.15, 0.335); brow.rotation.z = s * -0.12; brow.rotation.x = -0.12; head.add(brow);
  });
  [-1, 1].forEach((s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), mat(C.beard, { roughness: 0.95 })); m.scale.set(1.7, 0.5, 0.6); m.position.set(s * 0.055, -0.1, 0.345); m.rotation.z = s * -0.2; head.add(m); });
  // smile (arc) at rest, open mouth while speaking
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.009, 8, 24, Math.PI * 0.62), mat(C.mouth));
  smile.rotation.z = Math.PI * 1.19; smile.position.set(0, -0.125, 0.345); smile.scale.set(1, 0.8, 0.5); head.add(smile);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat(C.mouth, { roughness: 0.5 })); mouth.scale.set(1.1, 0.18, 0.3); mouth.position.set(0, -0.165, 0.338); mouth.visible = false; head.add(mouth);

  const backCap = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.04, 40, 28, Math.PI, Math.PI, 0, 0.66 * Math.PI), hairM); backCap.scale.copy(HS); backCap.position.y = 0.01; head.add(backCap);
  const topCap = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.05, 40, 28, 0, Math.PI * 2, 0, 0.3 * Math.PI), hairM); topCap.scale.copy(HS); topCap.position.set(0, 0.015, -0.02); topCap.rotation.x = -0.12; head.add(topCap);
  [-1, 1].forEach((s) => { const sb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.06), hairM); sb.position.set(s * 0.33, 0.04, 0.12); head.add(sb); });
  const r2 = rng(31);
  for (let i = 0; i < 52; i++) {
    const th = Math.acos(1 - r2() * 0.78) * 0.9, ph = r2() * Math.PI * 2, rr = 0.075 + r2() * 0.07;
    if (Math.sin(ph) > 0.4 && th > 0.9) continue;
    const cl = new THREE.Mesh(new THREE.SphereGeometry(rr, 14, 12), hairM); const R = HR * 1.04 + rr * 0.35;
    cl.position.set(Math.sin(th) * Math.cos(ph) * R * HS.x, Math.cos(th) * R * HS.y + 0.02, Math.sin(th) * Math.sin(ph) * R * HS.z - 0.01); head.add(cl);
  }

  /* warm lights: one colour world */
  root.add(new THREE.AmbientLight(0xffc7a6, 1.05));
  const key = new THREE.DirectionalLight(0xffe2c8, 3.0); key.position.set(-2.5, 3.5, 3.5); root.add(key);
  const rim = new THREE.DirectionalLight(0xffb48a, 1.3); rim.position.set(3, 2.2, -2); root.add(rim);
  const fill = new THREE.DirectionalLight(0xfff0e0, 0.8); fill.position.set(2, 1.4, 4); root.add(fill);

  /* behaviour */
  const state = { yaw: 0, pitch: 0, mouth: 0, speaking: false, pulse: 0, blinkAt: 2.5, blinkT: -1, last: 0 };
  const pointer = new THREE.Vector2(0, 0); const baseHeadY = head.position.y;

  function update(t, motion = true) {
    const dt = Math.min(0.05, t - state.last); state.last = t;
    if (!motion) { head.rotation.set(0, -0.2, 0); return; }
    const ty = THREE.MathUtils.clamp(pointer.x, -1, 1) * 0.6 - 0.2, tx = THREE.MathUtils.clamp(-pointer.y, -1, 1) * 0.3;
    state.yaw += (ty - state.yaw) * (1 - Math.exp(-dt * 5)); state.pitch += (tx - state.pitch) * (1 - Math.exp(-dt * 5));
    head.rotation.y = state.yaw; head.rotation.x = state.pitch + (state.speaking ? Math.sin(t * 3.1) * 0.03 : 0);
    irises.forEach((ir) => { ir.position.x = THREE.MathUtils.clamp(state.yaw + 0.2, -0.6, 0.6) * 0.03; ir.position.y = state.pitch * 0.025; });
    const b = Math.sin(t * 1.55); torso.scale.y = 1 + 0.012 * b; head.position.y = baseHeadY + 0.004 * b;
    person.rotation.y = -0.28 + (state.speaking ? Math.sin(t * 1.4) * 0.03 : 0);
    if (t > state.blinkAt && state.blinkT < 0) state.blinkT = t;
    if (state.blinkT >= 0) { const p = (t - state.blinkT) / 0.14; eyes.scale.y = p < 1 ? 1 - Math.sin(p * Math.PI) * 0.92 : 1; if (p >= 1) { state.blinkT = -1; state.blinkAt = t + 2.2 + Math.random() * 3; } }
    state.pulse *= Math.exp(-dt * 7);
    const open = state.speaking ? Math.min(1, 0.3 + state.pulse * 0.7 + (Math.sin(t * 17) * 0.5 + 0.5) * 0.25) : 0;
    state.mouth += (open - state.mouth) * (1 - Math.exp(-dt * 22));
    const talk = state.mouth > 0.12; mouth.visible = talk; smile.visible = !talk;
    mouth.scale.y = 0.18 + state.mouth * 1.2; mouth.position.y = -0.165 - state.mouth * 0.012;
    if (Math.floor(t * 20) !== Math.floor((t - dt) * 20)) screens.forEach((s) => s.draw(t));
  }

  return {
    group: root, pointer, update,
    setSpeaking(v) { state.speaking = v; },
    pulse() { state.pulse = 1; },
  };
}

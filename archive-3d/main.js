import * as THREE from 'three';
import { createAvatar } from './avatar.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

/* ---------------- 3D stage ---------------- */
const stage = $('#stage'), canvas = $('#avatar');
let avatar = null, renderer = null, camera = null, running = false, heroVisible = true;

function initStage() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { stage.hidden = true; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  avatar = createAvatar(); scene.add(avatar.group);
  const FOV = THREE.MathUtils.degToRad(32);
  const t0 = performance.now();
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const d = Math.max(1.95 / (2 * Math.tan(FOV / 2)), 3.0 / (2 * Math.tan(FOV / 2) * camera.aspect));
    camera.position.set(0.0, 1.05, d + 0.2); camera.lookAt(0.0, 0.95, 0); camera.updateProjectionMatrix();
    if (!running) frame(performance.now());
  }
  new ResizeObserver(resize).observe(canvas); resize();
  addEventListener('pointermove', (e) => { avatar.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1); }, { passive: true });
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; loop(); }).observe(stage);
  document.addEventListener('visibilitychange', loop);
  function frame(now) { avatar.update((now - t0) / 1000, !reduce); renderer.render(scene, camera); }
  function loop() {
    if (reduce || running || !heroVisible || document.hidden) { if (reduce) frame(performance.now()); return; }
    running = true;
    const tick = (now) => { if (!heroVisible || document.hidden) { running = false; return; } frame(now); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  loop();
}
initStage();

/* ---------------- voice (browser speech, no autoplay) ---------------- */
const SCRIPT = [
  "Hi, I'm Ragul Sadhasivam, a motion and UI UX designer based in Hyderabad.",
  "I design the screens of an app, then animate them in After Effects, so loaders, splash screens and pairing flows tell people what the product is doing.",
  "I work in Figma, After Effects, Illustrator, Photoshop and Premiere Pro, and I export animations as Lottie for developers.",
  "Scroll down to see the work, or press the contact link at the end to reach me.",
];
const playBtn = $('#play'), caption = $('#caption');
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices = [], speaking = false, run = 0;

function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }
function pickMale() {
  const en = voices.filter((v) => /^en/i.test(v.lang));
  const prefer = [/rishi/i, /google uk english male/i, /daniel/i, /\balex\b/i, /microsoft (guy|ryan|david|mark|george)/i, /\bfred\b/i, /aaron|arthur|gordon|oliver|thomas/i, /\bmale\b/i];
  for (const rx of prefer) { const v = en.find((x) => rx.test(x.name)); if (v) return v; }
  return en[0] || null;
}
function stopSpeech() {
  run++; speaking = false; synth && synth.cancel();
  avatar && avatar.setSpeaking(false);
  playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play intro';
  caption.classList.remove('on');
}
function speakAll() {
  const my = ++run; speaking = true; avatar && avatar.setSpeaking(true);
  playBtn.setAttribute('aria-pressed', 'true'); playBtn.textContent = 'Stop';
  const voice = pickMale(); let i = 0;
  const next = () => {
    if (my !== run) return;
    if (i >= SCRIPT.length) { stopSpeech(); return; }
    caption.textContent = SCRIPT[i]; caption.classList.add('on');
    const u = new SpeechSynthesisUtterance(SCRIPT[i]);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.rate = 0.96; u.pitch = 0.85; u.volume = 1;
    u.onboundary = () => avatar && avatar.pulse();
    u.onend = () => { i++; next(); };
    u.onerror = () => { if (my === run) stopSpeech(); };
    synth.speak(u);
  };
  next();
}
playBtn.addEventListener('click', () => {
  if (!synth) { caption.textContent = 'Your browser does not support speech. Read on: ' + SCRIPT.join(' '); caption.classList.add('on'); return; }
  speaking ? stopSpeech() : speakAll();
});
addEventListener('pagehide', stopSpeech);

/* ---------------- motion ---------------- */
const EASE = 'expo.out'; // cubic-bezier(.16,1,.3,1)
function motion() {
  gsap.registerPlugin(ScrollTrigger);
  // hero enter
  gsap.set('[data-enter]', { opacity: 0, y: 24 });
  gsap.to('[data-enter]', { opacity: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.1 });
  if (stage && !stage.hidden) { gsap.set(stage, { opacity: 0 }); gsap.to(stage, { opacity: 1, duration: 1.2, ease: EASE, delay: 0.25 }); }

  // sections enter once: when they come into view, or straight away if the visitor has already scrolled past them
  const reveal = $$('.sec-head, [data-clip], [data-enter-s]');
  gsap.set(reveal, { opacity: 0, y: 32 });
  const io = new IntersectionObserver((entries) => {
    const go = entries.filter((e) => e.isIntersecting || e.boundingClientRect.top < 0).map((e) => e.target);
    if (!go.length) return;
    go.forEach((el) => io.unobserve(el));
    gsap.to(go, { opacity: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.08, overwrite: true });
  }, { rootMargin: '0px 0px -10% 0px' });
  reveal.forEach((el) => io.observe(el));

  // playhead: scroll is playback (30 s timeline), 600 ms smoothing
  const mark = $('.ph-mark'), tc = $('#tc'), line = $('.ph-line');
  const proxy = { p: 0 };
  gsap.to(proxy, {
    p: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
    onUpdate() {
      const h = line.clientHeight - 11; mark.style.transform = `translateY(${proxy.p * h}px)`;
      const s = Math.round(proxy.p * 30); tc.textContent = '00:' + String(s).padStart(2, '0');
    },
  });
}

if (reduce) {
  // reduced motion: no enters, no scrub, static avatar, no autoplaying video
  $('.playhead').style.display = 'none';
} else if (gsap && ScrollTrigger) {
  motion();
}

/* ---------------- videos: play only while visible (muted, no audio) ---------------- */
const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
  const v = e.target; if (reduce) return;
  if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
}), { threshold: 0.35 });
$$('.clip video').forEach((v) => { vio.observe(v); if (reduce) v.controls = true; });

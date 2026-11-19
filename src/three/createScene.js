import * as THREE from 'three';
import { FRAME } from '@/config/layout';
import { WIN, EYE0, BREEZE } from './config';
import { loadImg } from './utils';
import { createRipples } from './ripples';
import { setupInteraction } from './interaction';
import { createSky } from './objects/sky';
import { createTable } from './objects/table';
import { setupLighting } from './objects/lighting';
import { createBottle } from './objects/bottle';
import { createWater } from './objects/water';
import { createParticles } from './objects/particles';
import { createRaft } from './objects/raft';
import { addFlowers } from './objects/flowers';
import { addPebbles } from './objects/pebbles';
import flowersUrl from '@/assets/images/flowers.png';
import raftUrl from '@/assets/images/raft.png';
import pebblesUrl from '@/assets/images/pebbles.png';
import cloudsUrl from '@/assets/images/clouds.png';

/**
 * 在 canvas 上建立整個 3D 場景並開始播放。
 * @param canvas      要畫的 <canvas>
 * @param getScale    回傳海報目前縮放倍率（決定畫布解析度）
 * @param onInteract  使用者點了畫面任何地方
 * @returns { ready: 圖片載完、開始播放的 Promise, resize(), dispose() }
 */
export function createScene(canvas, { getScale = () => 1, onInteract = () => {} } = {}) {
  /* ---- renderer ---- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x5d9fd0);

  function resize() {
    renderer.setPixelRatio(Math.min(2.5, Math.max(1, devicePixelRatio * getScale())));
    renderer.setSize(FRAME.w, FRAME.h, false);
  }
  resize();

  /* ---- camera：off-axis「窗戶」投影，相框就像一扇看進場景的窗 ---- */
  const camera = new THREE.PerspectiveCamera(20, FRAME.w / FRAME.h, 0.1, 400);
  const eye = EYE0.clone();
  function updateCamera() {
    camera.position.copy(eye);
    camera.rotation.set(0, 0, 0);
    const n = camera.near, d = eye.z;
    camera.projectionMatrix.makePerspective(
      (WIN.x0 - eye.x) * n / d, (WIN.x1 - eye.x) * n / d,
      (WIN.y1 - eye.y) * n / d, (WIN.y0 - eye.y) * n / d, n, camera.far,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  updateCamera();

  /* ---- 場景內容 ---- */
  const scene = new THREE.Scene();
  const U = { time: { value: 0 }, wind: { value: 1 } };   // 各材質共用的 uniform
  const ripples = createRipples(U.time);

  const sky = createSky(scene);
  createTable(scene, U);
  setupLighting(scene, renderer);
  createBottle(scene, U);
  const water = createWater(scene, U, ripples);
  const particles = createParticles(scene, ripples);
  const raft = createRaft(scene, U, ripples, particles.splash);

  /* ---- 互動 ---- */
  let gust = 0;
  const input = setupInteraction({
    canvas, camera,
    onWater(p) {
      ripples.add(p.x, p.z, 0.028);
      raft.push(p);
      particles.splash(p.x, p.z, 0.25);
      onInteract();
    },
    onMiss() {
      gust = 1;   // 點瓶子以外的地方：吹一陣強風
      onInteract();
    },
  });

  /* ---- 動畫迴圈 ---- */
  const clock = new THREE.Clock();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameId = 0;
  let disposed = false;

  function tick() {
    const dt = Math.min(clock.getDelta(), 1 / 20);
    const t = clock.elapsedTime * (reduceMotion ? 0.5 : 1);
    U.time.value = t;

    // 風：平常的微風 + 點擊後慢慢消退的強風
    gust *= Math.exp(-dt * 0.9);
    const breeze = BREEZE * Math.max(0, Math.sin(t * 0.31) + 0.6 * Math.sin(t * 0.83 + 1.7) + 0.35 * Math.sin(t * 1.9 + 0.4) - 0.2);
    U.wind.value = 1 + breeze + gust * 2.4;

    // 視差：有滑鼠就跟著滑鼠，閒置時慢慢飄
    const { pointer } = input;
    const idle = !pointer.active || performance.now() - pointer.last > 4000;
    const px = idle ? Math.sin(t * 0.17) * 0.45 : pointer.x * 0.55;
    const py = idle ? Math.sin(t * 0.13 + 1.2) * 0.18 : pointer.y * 0.28;
    eye.x += (EYE0.x + px - eye.x) * Math.min(1, dt * 2.2);
    eye.y += (EYE0.y + py - eye.y) * Math.min(1, dt * 2.2);
    updateCamera();
    sky.update(eye);

    if (raft.update(dt, t)) water.setRaft(raft.state.x, raft.state.z);
    particles.update(dt, t, renderer.domElement.height / (WIN.y1 - WIN.y0));

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  }

  /* ---- 載入插畫，載完才開始播 ---- */
  const ready = Promise.all([loadImg(flowersUrl), loadImg(raftUrl), loadImg(pebblesUrl), loadImg(cloudsUrl)])
    .then(([flowers, raftImg, pebbles, clouds]) => {
      if (disposed) return;
      sky.draw(clouds);
      addFlowers(scene, flowers, U);
      addPebbles(scene, pebbles, U);
      raft.build(raftImg);
      clock.start();
      tick();
    });

  function dispose() {
    disposed = true;
    cancelAnimationFrame(frameId);
    input.dispose();
    scene.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material) {
        obj.material.map?.dispose();
        obj.material.dispose();
      }
    });
    scene.environment?.dispose();
    renderer.dispose();
  }

  return { ready, resize, dispose };
}

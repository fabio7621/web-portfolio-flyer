import * as THREE from 'three';

/** sRGB hex → three.js 線性色 */
export const C = (hex) => new THREE.Color(hex);
export const V2 = (x, y) => new THREE.Vector2(x, y);

/** 固定 seed 的亂數，讓手繪紋理每次長得一樣 */
export function rng(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

function tune(tex, srgb = true) {
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function canvasTex(canvas) {
  return tune(new THREE.CanvasTexture(canvas));
}

export function imageTex(img) {
  const tex = tune(new THREE.Texture(img));
  tex.needsUpdate = true;
  return tex;
}

const texLoader = new THREE.TextureLoader();
export function loadTex(src, srgb = true) {
  return tune(texLoader.load(src), srgb);
}

export function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 三次貝茲曲線上的一點（二維） */
export function cubicBezier(P0, P1, P2, P3, t) {
  const u = 1 - t;
  return V2(
    u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
    u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
  );
}

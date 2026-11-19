import * as THREE from 'three';

export const MAX_RIPPLES = 6;

/**
 * 漣漪：最多同時 6 個，用環狀緩衝區輪流覆蓋。
 * 每個漣漪存成 vec4(x, z, 產生時間, 振幅)，直接當 shader 的 uRip 陣列用。
 * @param time 共用的 time uniform（{ value }），新漣漪用它當產生時間
 */
export function createRipples(time) {
  const list = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0));
  let next = 0;

  function add(x, z, amp) {
    list[next].set(x, z, time.value, amp);
    next = (next + 1) % MAX_RIPPLES;
  }

  /** 水面在 (x, z) 的高度偏移（跟 shaders/wave.glsl.js 同一個公式） */
  function height(x, z, t) {
    let h = 0.010 * Math.sin(2.1 * x + 1.3 * t) + 0.008 * Math.sin(2.7 * z - 1.6 * t + 1.0) + 0.006 * Math.sin(2.31 * (x + z) + 2.1 * t);
    for (const r of list) {
      const age = t - r.z;
      if (age < 0 || age > 4.5) continue;
      const d = Math.hypot(x - r.x, z - r.y), front = age * 0.9;
      const s = Math.min(1, Math.max(0, (front + 0.03 - d) / 0.11));
      const sm = s * s * (3 - 2 * s);
      h += r.w * Math.exp(-age * 1.25) * Math.exp(-1.1 * d) * sm * Math.sin(17 * (d - front));
    }
    return h;
  }

  return { list, add, height };
}

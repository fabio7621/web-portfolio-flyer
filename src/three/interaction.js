import * as THREE from 'three';
import { W_LEVEL, R_IN } from './config';

/**
 * 滑鼠／觸控：
 * - 移動：記錄指標位置（給鏡頭視差用），滑到水面上游標變手指
 * - 點水面：onWater(點到的水面座標)
 * - 點其他地方：onMiss()
 */
export function setupInteraction({ canvas, camera, onWater, onMiss }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -W_LEVEL);
  const pointer = { x: 0, y: 0, active: false, last: 0 };

  function toNdc(e, out) {
    const r = canvas.getBoundingClientRect();
    return out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  /** 回傳點到的水面位置；沒點到水就回傳 null */
  function hitWater(e) {
    raycaster.setFromCamera(toNdc(e, ndc), camera);
    const { ray } = raycaster;
    const p = new THREE.Vector3();
    if (!ray.intersectPlane(waterPlane, p)) return null;
    // 射線從瓶口進到水面
    if (Math.hypot(p.x, p.z) < R_IN * 0.98) return p;
    // 退而求其次：點在水位高度附近的瓶身上，也算點到水
    const t = (0 - ray.origin.z) / ray.direction.z;
    const q = ray.at(t, new THREE.Vector3());
    return (Math.abs(q.x) < 1 && q.y > 0 && q.y < W_LEVEL + 0.12) ? new THREE.Vector3(q.x, W_LEVEL, 0.25) : null;
  }

  function onMove(e) {
    toNdc(e, ndc);
    pointer.x = ndc.x; pointer.y = ndc.y;
    pointer.active = true; pointer.last = performance.now();
    canvas.style.cursor = hitWater(e) ? 'pointer' : 'default';
  }
  function onLeave() { pointer.active = false; }
  function onDown(e) {
    const p = hitWater(e);
    if (p) onWater(p); else onMiss();
  }

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);

  return {
    pointer,
    dispose() {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
    },
  };
}

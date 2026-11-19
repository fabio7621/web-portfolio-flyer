import * as THREE from 'three';
import { R_IN } from '../config';
import { C, imageTex } from '../utils';
import { spriteMaterial } from './spriteMaterial';

// 瓶底石頭：同一張圖疊四層（前亮後暗、左右翻轉交錯），做出有深度的石床
const LAYERS = [
  { z: -0.64, tint: '#b3b0a2', flip: false, squash: 0.80, y: 0.16, widthK: 0.98 },
  { z: -0.24, tint: '#cdc8ba', flip: true,  squash: 0.84, y: 0.15, widthK: 0.98 },
  { z:  0.16, tint: '#e6e1d4', flip: false, squash: 0.88, y: 0.13, widthK: 0.97 },
  { z:  0.54, tint: '#ffffff', flip: true,  squash: 0.92, y: 0.10, widthK: 0.95 },
];

export function addPebbles(scene, img, U) {
  const tex = imageTex(img);
  for (const L of LAYERS) {
    const chord = 2 * Math.sqrt(R_IN * R_IN - L.z * L.z) * L.widthK;   // 這個深度的瓶內寬度
    const h = chord / (img.width / img.height) * L.squash;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(chord, h), spriteMaterial(tex, U, { tint: C(L.tint), caustic: 0.38 }));
    if (L.flip) mesh.scale.x = -1;
    mesh.position.set(0, L.y + h / 2, L.z);
    scene.add(mesh);
  }
}

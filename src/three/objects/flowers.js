import * as THREE from 'three';
import { dx, dy, PPU } from '../config';
import { canvasTex } from '../utils';
import { spriteMaterial } from './spriteMaterial';

// 原圖花莖不夠長：從 CUT 這一列以下的花莖拉長成 STEM_DST px，讓它伸到瓶底
const CUT = 460;
const STEM_DST = 573;
const SCALE = 0.785 / PPU;          // 圖片 px → 世界單位
const TOP_LEFT = [178, 250];        // 花在設計稿上的左上角

export function addFlowers(scene, img, U) {
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = CUT + STEM_DST;
  const g = cv.getContext('2d');
  g.drawImage(img, 0, 0, img.width, CUT, 0, 0, img.width, CUT);
  g.drawImage(img, 0, CUT, img.width, img.height - CUT, 0, CUT, img.width, STEM_DST);

  const w = cv.width * SCALE, h = cv.height * SCALE;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h, 24, 60),
    spriteMaterial(canvasTex(cv), U, { sway: 1, pivot: 3.45, refract: 0.010 }),
  );
  mesh.position.set(dx(TOP_LEFT[0]) + w / 2, dy(TOP_LEFT[1]) - h / 2, 0.0);
  scene.add(mesh);
}

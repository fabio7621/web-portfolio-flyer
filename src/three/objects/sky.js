import * as THREE from 'three';
import { dx, dy, PPU, EYE0, CLOUD_RECT } from '../config';
import { canvasTex, rng } from '../utils';

// 天空是一整張不透明的手繪圖層，釘在相框後面。雲直接畫進這張圖裡，
// 所以透過玻璃瓶也看得到（也會被折射）；分開做成透明的雲會被瓶子吃掉。
const SKY_RECT = { x0: 30, x1: 980, y0: 150, y1: 1050 };   // 天空圖層涵蓋的設計稿範圍（相框＋留邊）
const SKY_Z = -60;
const SKY_PARALLAX = 0.12;
const SKY_SCALE = 1.7;                                     // canvas px / 設計稿 px

function paintGradient() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 1024;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 1024);
  grd.addColorStop(0.00, '#3b84c0'); grd.addColorStop(0.45, '#4a94cc');
  grd.addColorStop(0.80, '#64a8d9'); grd.addColorStop(1.00, '#7ab6e0');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 1024);
  // 柔和的筆刷斑駁感
  const r = rng(7);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 1024, w = 40 + r() * 140, h = 8 + r() * 26;
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(20,60,110,0.03)';
    g.beginPath(); g.ellipse(x, y, w, h, (r() - 0.5) * 0.4, 0, Math.PI * 2); g.fill();
  }
  return cv;
}

export function createSky(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((SKY_RECT.x1 - SKY_RECT.x0) * SKY_SCALE);
  canvas.height = Math.round((SKY_RECT.y1 - SKY_RECT.y0) * SKY_SCALE);
  const tex = canvasTex(canvas);

  /** 重畫天空；傳入雲的圖片就把雲畫上去 */
  function draw(cloudImg) {
    const g = canvas.getContext('2d');
    g.drawImage(paintGradient(), 0, 0, canvas.width, canvas.height);
    if (cloudImg) {
      const w = CLOUD_RECT.w, h = w * cloudImg.height / cloudImg.width;
      g.drawImage(
        cloudImg,
        (CLOUD_RECT.cx - w / 2 - SKY_RECT.x0) * SKY_SCALE, (CLOUD_RECT.cy - h / 2 - SKY_RECT.y0) * SKY_SCALE,
        w * SKY_SCALE, h * SKY_SCALE,
      );
    }
    tex.needsUpdate = true;
  }
  draw(null);

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scene.add(mesh);

  /** 依鏡頭位置擺放天空，讓它在相框裡看起來大小不變、只有輕微視差 */
  function update(eye) {
    const k = (eye.z - SKY_Z) / eye.z;
    const cx = (SKY_RECT.x0 + SKY_RECT.x1) / 2, cy = (SKY_RECT.y0 + SKY_RECT.y1) / 2;
    const wx = dx(cx) + (eye.x - EYE0.x) * SKY_PARALLAX;
    const wy = dy(cy) + (eye.y - EYE0.y) * SKY_PARALLAX * 0.5;
    mesh.position.set(eye.x + (wx - eye.x) * k, eye.y + (wy - eye.y) * k, SKY_Z);
    mesh.scale.set((SKY_RECT.x1 - SKY_RECT.x0) / PPU * k, (SKY_RECT.y1 - SKY_RECT.y0) / PPU * k, 1);
  }

  return { draw, update };
}

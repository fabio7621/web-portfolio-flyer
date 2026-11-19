import * as THREE from 'three';
import { FRAME } from '@/config/layout';

/* =========================================================
   設計稿 px ↔ 3D 世界座標
   瓶子中心在設計稿 x=459、瓶底在 y=1095，1 單位 = 158px
   ========================================================= */
export const PPU = 158;     // px per world unit
export const CX = 459;      // 瓶子中心 x（設計稿 px）
export const BASE = 1095;   // 瓶底 y（設計稿 px）
export const dx = (X) => (X - CX) / PPU;
export const dy = (Y) => (BASE - Y) / PPU;

// 相框在 z=0 平面上的範圍
export const WIN = {
  x0: dx(FRAME.x), x1: dx(FRAME.x + FRAME.w),
  y0: dy(FRAME.y + FRAME.h), y1: dy(FRAME.y),
};

/* =========================================================
   常調的參數
   ========================================================= */

// 鏡頭位置。第二個數字越大，越從上往下看（約 18° 俯角，配合竹筏插畫）
export const EYE0 = new THREE.Vector3((WIN.x0 + WIN.x1) / 2, 8.6, 24);
export const D = EYE0.z;

// 瓶內水位高度、瓶子內徑
export const W_LEVEL = 0.74;
export const R_IN = 0.935;

// 桌板後緣落在設計稿的這條地平線上
export const HORIZON_Y = 990;
export const TABLE_BACK = -(EYE0.y * D / (EYE0.y - dy(HORIZON_Y)) - D);

// 雲的位置與大小（設計稿 px，cx / cy 是中心，w 是寬）
export const CLOUD_RECT = { cx: 503, cy: 712, w: 830 };

// 竹筏
export const RAFT_W = 150;               // 寬度（設計稿 px）
export const RAFT_ANCHOR = [320, 534];   // 圖片上桅杆下方、水線的位置（image px）。第二個數字越大，竹筏浮得越高
export const RAFT_SLOPE = 0.306;         // 水線斜度，配合竹筏圖的角度

// 平常的微風強度（點擊吹的強風另外疊加）
export const BREEZE = 0.30;

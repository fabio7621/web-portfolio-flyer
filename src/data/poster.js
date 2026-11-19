// 海報上的文案、色票與位置。改字、改色、調位置都在這裡。
// left / top 是設計稿 px，delay 是進場動畫延遲（秒）。

export const techTags = [
  { label: 'SCRIPT SETUP', left: 133, delay: 0.10 },
  { label: 'VUE 3',        left: 402, delay: 0.16 },
  { label: 'VITE',         left: 540, delay: 0.22 },
  { label: 'PINIA',        left: 675, delay: 0.28 },
  { label: 'ROUTER',       left: 808, delay: 0.34 },
];

export const counter = { label: 'REACTIVITY', target: 100 };

export const sideLabels = [
  { text: 'FRONTEND PORTFOLIO', left: 81,  top: 455, delay: 0.50 },
  { text: '2026',               left: 907, top: 768, delay: 0.55 },
];

export const title = {
  word: 'WEB',          // 白色粗體大字，一個字母一個字母升起
  script: 'Portfolio',  // 橘色手寫字
};

export const swatches = [
  { hex: '#8EC9D9', left: 116, delay: 0.60 },
  { hex: '#47645F', left: 202, delay: 0.68 },
  { hex: '#4597C7', left: 289, delay: 0.76 },
  { hex: '#526E87', left: 375, delay: 0.84 },
  { hex: '#203330', left: 461, delay: 0.92 },
  { hex: '#F7921E', left: 560, delay: 1.00, small: true },
];

export const taglines = [
  { text: 'REACTIVE BY NATURE',  top: 1264, delay: 0.70 },
  { text: 'COMPOSED WITH VUE 3', top: 1292, delay: 0.78 },
];

export const credits = [
  { text: 'DESIGN & CODE BY: FABIO20',       top: 1457, delay: 1.00 },
  { text: 'FABIO7621.GITHUB.IO/RESUME-BLOG', top: 1475, delay: 1.06 },
];

export const hint = 'TAP THE WATER · 點一下水面';

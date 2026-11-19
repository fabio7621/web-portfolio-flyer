# Web Portfolio 宣傳單 — 玻璃瓶竹筏網頁動畫

Vue 3 + Vite 做的 2D 海報排版，加上 three.js 3D 場景：玻璃瓶、水面、浮在水上的竹筏、插花、石頭、桌板與天空。

## 怎麼跑

```bash
npm install       # 第一次
npm run dev       # 開發，打開終端機顯示的網址
npm run build     # 打包到 dist/（相對路徑，可直接丟 GitHub Pages）
npm run preview   # 預覽打包結果
```

字型（Archivo、Kaushan Script）從 Google Fonts 載入，需要連網。

## 檔案結構

```
index.html                    頁面殼＋字型
vite.config.js                Vite 設定（@ = src/）
src/
  main.js                     建立 Vue app
  App.vue                     海報外框、縮放、組合各區塊、紙張顆粒
  styles/base.css             全站共用：色票變數、.t 文字定位、.fade 淡入
  config/layout.js            設計稿尺寸 1008×1560、相框位置
  data/poster.js              ★ 文案、色票、各行文字的位置與動畫延遲
  composables/
    usePosterScale.js         海報等比縮放塞進視窗
    useCountUp.js             REACTIVITY 0→100% 數字跑動
  components/                 （畫面由上到下）
    PosterHeader.vue          logo、技術標籤、REACTIVITY
    PosterDecor.vue           走動的虛線框角、直排小字
    BottleScene.vue           相框＋3D 畫布＋「點一下水面」提示
    PosterTitle.vue           WEB ／ Portfolio 標題
    ColorSwatches.vue         色票（點擊複製色碼）
    PosterFooter.vue          標語、斜線色塊、署名
  three/                      3D 場景（純 JS，不依賴 Vue）
    createScene.js            入口：renderer、鏡頭、動畫迴圈、載圖、dispose
    config.js                 ★ 座標換算與常調參數
    utils.js                  顏色、貼圖、載圖、貝茲曲線小工具
    ripples.js                漣漪資料＋水面高度（JS 版）
    interaction.js            點水面／點空白處／滑鼠視差
    shaders/
      noise.glsl.js           共用雜訊、水底光紋
      wave.glsl.js            水面高度（GLSL 版）
    objects/
      sky.js                  天空＋雲
      table.js                桌板＋晃動的樹影
      lighting.js             燈光、玻璃用的環境貼圖
      bottle.js               玻璃瓶＋插畫墨線高光
      water.js                水體、水面
      spriteMaterial.js       花和石頭共用的插畫材質
      flowers.js              花
      pebbles.js              石頭（四層）
      raft.js                 竹筏外觀＋浮沉物理
      particles.js            氣泡、懸浮物、水花
  assets/images/              插畫素材
    flowers.png  raft.png  pebbles.png  clouds.png
    table_base.jpg            桌板底色（攤平、拿掉樹影）
    table_shade.png           桌板樹影遮罩（讓樹影晃動）
```

## 互動

- 點水面：漣漪＋竹筏晃動、濺起水花
- 點瓶子以外的地方：吹一陣強風，花和樹影晃得更大
- 移動滑鼠：3D 物件會有輕微視差，標題文字固定不動
- 點色票：複製色碼
- 網址加上 `#still`：竹筏一開始就浮在水上，不播落水動畫，方便截圖

## 常改的地方

| 想改什麼 | 檔案 | 找這個 |
|---|---|---|
| 文案、色票、文字位置 | `src/data/poster.js` | 各個陣列 |
| 雲的位置／大小 | `src/three/config.js` | `CLOUD_RECT`（cx / cy 是中心，w 是寬） |
| 竹筏大小 | `src/three/config.js` | `RAFT_W`（設計稿 px） |
| 竹筏吃水深度 | `src/three/config.js` | `RAFT_ANCHOR` 第二個數字（越大浮得越高） |
| 竹筏水線斜度 | `src/three/config.js` | `RAFT_SLOPE` |
| 水位高度 | `src/three/config.js` | `W_LEVEL` |
| 鏡頭俯角 | `src/three/config.js` | `EYE0` 第二個數字（越大越從上往下看） |
| 平常的微風強度 | `src/three/config.js` | `BREEZE` |
| 花擺動幅度 | `src/three/objects/spriteMaterial.js` | vertex shader 裡的 `*.023` |
| 標題字體、顏色、動畫 | `src/components/PosterTitle.vue` | `<style>` |

座標說明：版面以 1008 × 1560 的設計稿為準，`dx()`、`dy()` 會把設計稿 px 換成 3D 世界座標（瓶子中心在設計稿 x=459、瓶底在 y=1095，1 單位 = 158px）。

<script setup>
// 相框裡的 three.js 3D 場景（瓶子、水、竹筏、花…）。場景本體在 src/three/。
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { createScene } from '@/three/createScene';
import { hint } from '@/data/poster';

const props = defineProps({
  scale: { type: Number, required: true },   // 海報目前的縮放倍率，用來決定畫布解析度
});

const canvas = ref(null);
const isLoaded = ref(false);
const isHintVisible = ref(false);

let scene = null;
let hintDismissed = false;
const timers = [];

function dismissHint() {
  isHintVisible.value = false;
  hintDismissed = true;
}

onMounted(() => {
  scene = createScene(canvas.value, {
    getScale: () => props.scale,
    onInteract: dismissHint,
  });
  scene.ready
    .then(() => requestAnimationFrame(() => { isLoaded.value = true; }))
    .catch((err) => console.error(err));

  // 3.6 秒後還沒點過，就提示「點一下水面」，顯示 3.8 秒
  timers.push(setTimeout(() => {
    if (!hintDismissed) isHintVisible.value = true;
    timers.push(setTimeout(dismissHint, 3800));
  }, 3600));
});

watch(() => props.scale, () => scene?.resize());

onBeforeUnmount(() => {
  timers.forEach(clearTimeout);
  scene?.dispose();
});
</script>

<template>
  <div class="frame">
    <canvas ref="canvas" :class="{ on: isLoaded }"></canvas>
    <div class="sheen"></div>
    <p class="hint" :class="{ on: isHintVisible }">{{ hint }}</p>
  </div>
</template>

<style scoped>
.frame{position:absolute;left:111px;top:216px;width:785px;height:934px;overflow:hidden;background:#5d9fd0}
.frame canvas{position:absolute;inset:0;width:785px;height:934px;display:block;opacity:0;transition:opacity 1.1s ease}
.frame canvas.on{opacity:1}
.sheen{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0) 30%),
             radial-gradient(140% 100% at 50% 40%,rgba(0,0,0,0) 60%,rgba(20,40,60,.10) 100%);}

/* hint 是相框內的座標（原本在海報上的 128,1124 減去相框左上角 111,216） */
.hint{position:absolute;left:17px;top:908px;margin:0;font-size:11px;font-weight:800;letter-spacing:.12em;color:rgba(255,255,255,.85);
  white-space:nowrap;opacity:0;transition:opacity .8s;pointer-events:none}
.hint.on{opacity:1}
</style>

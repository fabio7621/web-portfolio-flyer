<script setup>
import { usePosterScale } from '@/composables/usePosterScale';
import PosterHeader from '@/components/PosterHeader.vue';
import PosterDecor from '@/components/PosterDecor.vue';
import BottleScene from '@/components/BottleScene.vue';
import PosterTitle from '@/components/PosterTitle.vue';
import ColorSwatches from '@/components/ColorSwatches.vue';
import PosterFooter from '@/components/PosterFooter.vue';

const scale = usePosterScale();
</script>

<template>
  <div class="stage">
    <!-- 元件順序 = 疊放順序（後面的蓋在前面上） -->
    <div class="poster" :style="{ '--s': scale }">
      <PosterHeader />
      <PosterDecor />
      <BottleScene :scale="scale" />
      <PosterTitle />
      <ColorSwatches />
      <PosterFooter />
      <div class="grain"></div>
    </div>
  </div>
</template>

<style scoped>
.stage{position:fixed;inset:0;
  background:radial-gradient(120% 90% at 50% 40%, #efe3cf 0%, #e3d4bb 70%, #d9c8ab 100%);
}
.poster{
  position:absolute;left:50%;top:50%;
  width:1008px;height:1560px;
  transform:translate(-50%,-50%) scale(var(--s, 1));
  transform-origin:50% 50%;
  background:var(--paper);
  box-shadow:0 2px 0 rgba(0,0,0,.04), 0 30px 80px -30px rgba(80,55,20,.45), 0 10px 30px -12px rgba(80,55,20,.25);
  overflow:hidden;
}
/* 紙張顆粒感 */
.grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:.28;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .2  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");}
</style>

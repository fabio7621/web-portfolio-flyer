<script setup>
// 下方：兩行標語、斜線色塊、署名
import { taglines, credits } from '@/data/poster';
</script>

<template>
  <p
    v-for="line in taglines"
    :key="line.text"
    class="t sub fade"
    :style="{ top: `${line.top}px`, animationDelay: `${line.delay}s` }"
  >{{ line.text }}</p>

  <div class="stripes fade" style="animation-delay:.9s"></div>

  <p
    v-for="line in credits"
    :key="line.text"
    class="t credit fade"
    :style="{ top: `${line.top}px`, animationDelay: `${line.delay}s` }"
  >{{ line.text }}</p>
</template>

<style scoped>
.sub{font-size:22.5px;font-weight:800;left:116px}

.stripes{position:absolute;left:728px;top:1245px;width:156px;height:105px;
  background:repeating-linear-gradient(135deg,var(--ink) 0 14px,transparent 14px 29.5px);
  background-size:200% 200%;transition:background-position 1.2s ease}
.stripes:hover{background-position:42px 0}

.credit{right:140px;font-size:17px;color:var(--slate);text-align:right;font-weight:800;letter-spacing:.03em}
</style>

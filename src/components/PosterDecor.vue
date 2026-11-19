<script setup>
// 裝飾：會走動的虛線框角、左右兩側的直排小字
import { sideLabels } from '@/data/poster';
</script>

<template>
  <svg class="dash" viewBox="0 0 1008 1560" aria-hidden="true">
    <path d="M352 192 H104 Q92 192 92 204 V416" />
    <path d="M655 1170 H902 Q914 1170 914 1158 V870" />
  </svg>

  <p
    v-for="label in sideLabels"
    :key="label.text"
    class="t vert fade"
    :style="{ left: `${label.left}px`, top: `${label.top}px`, animationDelay: `${label.delay}s` }"
  >{{ label.text }}</p>
</template>

<style scoped>
.dash{position:absolute;inset:0;width:1008px;height:1560px;pointer-events:none;overflow:visible}
.dash path{fill:none;stroke:var(--ink);stroke-width:9.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:13 21;animation:march 3.2s linear infinite}
@keyframes march{to{stroke-dashoffset:-34}}

.vert{writing-mode:vertical-rl;transform:rotate(180deg);font-size:15px}

@media (prefers-reduced-motion: reduce){
  .dash path{animation:none}
}
</style>

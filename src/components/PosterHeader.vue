<script setup>
// 上方一排：logo、技術標籤、REACTIVITY 百分比
import { techTags, counter } from '@/data/poster';
import { useCountUp } from '@/composables/useCountUp';

const percent = useCountUp(counter.target, { delay: 500, duration: 1600 });
</script>

<template>
  <div class="logo fade" style="animation-delay:.05s"><i></i><i></i></div>

  <p
    v-for="tag in techTags"
    :key="tag.label"
    class="t meta fade"
    :style="{ left: `${tag.left}px`, animationDelay: `${tag.delay}s` }"
  >{{ tag.label }}</p>

  <p class="t meta fade counter" style="animation-delay:.4s">
    {{ counter.label }}&nbsp;&nbsp;&nbsp;{{ percent }}%
  </p>
</template>

<style scoped>
.logo{position:absolute;left:27px;top:39px;width:42px;height:52px}
.logo i{position:absolute;left:0;width:42px;height:23px;background:var(--ink);border-radius:9px 11px 10px 8px}
.logo i:first-child{top:0;transform:rotate(-1.5deg)}
.logo i:last-child{top:29px;transform:rotate(1deg);border-radius:8px 10px 11px 9px}

.meta{font-size:15px;top:56px}
.counter{right:132px;top:185px}
</style>

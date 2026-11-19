<script setup>
// 標題：白色 WEB（逐字升起）＋ 橘色手寫 Portfolio（像寫字一樣展開）
import { title } from '@/data/poster';

const letters = title.word.split('');
const letterDelay = (i) => `${(0.9 + i * 0.1).toFixed(2)}s`;
</script>

<template>
  <div class="title" :aria-label="`${title.word} ${title.script}`">
    <div class="blue">
      <span v-for="(ch, i) in letters" :key="i"><b :style="{ animationDelay: letterDelay(i) }">{{ ch }}</b></span>
    </div>
    <div class="sky">{{ title.script }}</div>
  </div>
</template>

<style scoped>
.title{position:absolute;left:0;top:0;width:1008px;height:1560px;pointer-events:none}

.blue{position:absolute;left:318px;top:668px;font-size:112px;font-weight:900;font-stretch:125%;
  color:#fff;letter-spacing:.005em;line-height:1;display:flex}
.blue span{display:inline-block;overflow:hidden;padding:0 1px;margin:0 -1px}
.blue b{display:inline-block;font-weight:900;transform:translateY(105%);animation:rise 1s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes rise{to{transform:none}}

.sky{position:absolute;left:548px;top:618px;font-family:"Kaushan Script",cursive;font-size:70px;
  color:var(--orange);-webkit-text-stroke:2px var(--orange);
  transform:rotate(-9deg);transform-origin:0 100%;line-height:1;
  clip-path:inset(-20% 100% -20% -10%);animation:write 1.3s cubic-bezier(.6,.1,.3,1) 1.5s forwards}
@keyframes write{to{clip-path:inset(-20% -10% -20% -10%)}}
</style>

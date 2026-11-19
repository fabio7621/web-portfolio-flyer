<script setup>
// 色票：點一下複製色碼，上方跳出 COPIED 提示
import { ref, onBeforeUnmount } from 'vue';
import { swatches } from '@/data/poster';

const toastText = ref('COPIED');
const isToastVisible = ref(false);
let toastTimer = 0;

async function copyHex(hex) {
  try {
    await navigator.clipboard.writeText(hex);
    toastText.value = `COPIED ${hex}`;
  } catch {
    toastText.value = hex;
  }
  isToastVisible.value = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { isToastVisible.value = false; }, 1400);
}

onBeforeUnmount(() => clearTimeout(toastTimer));
</script>

<template>
  <button
    v-for="swatch in swatches"
    :key="swatch.hex"
    class="sw"
    :class="{ small: swatch.small }"
    :style="{ left: `${swatch.left}px`, background: swatch.hex, animationDelay: `${swatch.delay}s` }"
    :aria-label="swatch.hex"
    @click="copyHex(swatch.hex)"
  ></button>
  <p class="toast" :class="{ on: isToastVisible }">{{ toastText }}</p>
</template>

<style scoped>
.sw{position:absolute;top:1172px;width:71px;height:71px;border:0;padding:0;cursor:pointer;
  transform:scale(.4);opacity:0;animation:pop .7s cubic-bezier(.3,1.6,.5,1) forwards;transition:transform .25s}
.sw:hover{transform:translateY(-4px)!important}
.sw.small{top:1173px;width:27px;height:27px}
@keyframes pop{to{transform:none;opacity:1}}

.toast{position:absolute;left:116px;top:1150px;font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--slate);
  opacity:0;transition:opacity .3s}
.toast.on{opacity:1}
</style>

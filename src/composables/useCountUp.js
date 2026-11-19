import { ref, onMounted, onBeforeUnmount } from 'vue';

/** 數字從 0 跑到 target（ease-out cubic）。delay / duration 單位是毫秒。 */
export function useCountUp(target, { delay = 0, duration = 1000 } = {}) {
  const value = ref(0);
  let frameId = 0;

  onMounted(() => {
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start - delay) / duration);
      const eased = 1 - Math.pow(1 - Math.max(0, progress), 3);
      value.value = Math.round(target * eased);
      if (progress < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
  });
  onBeforeUnmount(() => cancelAnimationFrame(frameId));

  return value;
}

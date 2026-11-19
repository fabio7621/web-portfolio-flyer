import { ref, onMounted, onBeforeUnmount } from 'vue';
import { POSTER_W, POSTER_H } from '@/config/layout';

/** 讓整張海報等比縮放、塞進視窗（留 3% 邊）。回傳目前的縮放倍率。 */
export function usePosterScale() {
  const computeScale = () => Math.min(innerWidth / POSTER_W, innerHeight / POSTER_H) * 0.97;
  const scale = ref(computeScale());
  const onResize = () => { scale.value = computeScale(); };

  onMounted(() => addEventListener('resize', onResize));
  onBeforeUnmount(() => removeEventListener('resize', onResize));

  return scale;
}

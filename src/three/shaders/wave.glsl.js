// 水面高度（GLSL 版）。JS 版在 ../ripples.js 的 height()，兩邊公式要一致。
import { MAX_RIPPLES } from '../ripples';

export const WAVE_GLSL = /* glsl */`
uniform vec4 uRip[${MAX_RIPPLES}];
float waveH(vec2 p, float t){
  float h = 0.010*sin(2.1*p.x + 1.3*t) + 0.008*sin(2.7*p.y - 1.6*t + 1.0) + 0.006*sin(2.31*(p.x+p.y) + 2.1*t);
  for(int i=0;i<${MAX_RIPPLES};i++){
    vec4 r = uRip[i]; float age = t - r.z;
    if(age < 0. || age > 4.5) continue;
    float d = length(p - r.xy); float front = age * 0.9;
    float env = exp(-age*1.25) * exp(-1.1*d) * smoothstep(front + 0.03, front - 0.08, d);
    h += r.w * env * sin(17.*(d - front));
  }
  return h;
}`;

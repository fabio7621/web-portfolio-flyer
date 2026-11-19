import * as THREE from 'three';
import { W_LEVEL } from '../config';
import { C } from '../utils';
import { NOISE } from '../shaders/noise.glsl';

/**
 * 立在 3D 裡的 2D 插畫（花、石頭）用的材質：
 * 水面下會被折射、染上水色，可選擇加水底光紋或隨風擺動。
 * opts: tint 染色、refract 水下偏移量、caustic 光紋強度、sway 擺動幅度、pivot 從哪個高度開始擺、wet 水線上方的濕痕
 */
export function spriteMaterial(map, U, opts = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      map: { value: map }, uTime: U.time, uWind: U.wind,
      uW: { value: W_LEVEL }, uTint: { value: opts.tint || new THREE.Color(1, 1, 1) },
      uWater: { value: C('#7fc0d6') }, uRefract: { value: opts.refract || 0 },
      uCaustic: { value: opts.caustic || 0 }, uSway: { value: opts.sway || 0 }, uPivot: { value: opts.pivot || 0 },
      uWet: { value: opts.wet || 0 },
    },
    vertexShader: /* glsl */`
      uniform float uTime, uSway, uPivot, uWind; varying vec2 vUv; varying vec3 vW;
      void main(){
        vUv = uv; vec4 w = modelMatrix*vec4(position,1.);
        float h = max(0., w.y - uPivot);
        float ph = uv.x*2.6 + uv.y*1.3;
        float s = uSway*uWind*(sin(uTime*1.05 + ph)*.6 + sin(uTime*.53 + ph*1.7)*.4) + uSway*.25*sin(uTime*2.7+ph*3.)*(uWind-1.);
        float flutter = uSway*uWind*sin(uTime*3.4 + ph*5.3 + w.y*2.2)*.16;    // fine sprays tremble on their own
        w.x += (s*h*h + flutter*h)*.023;   // 花擺動幅度
        w.y -= abs(s)*h*h*.0032;
        vW = w.xyz;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform float uTime, uW, uRefract, uCaustic, uWet; uniform vec3 uTint, uWater;
      varying vec2 vUv; varying vec3 vW;
      ${NOISE}
      void main(){
        float wl = uW + .010*sin(2.1*vW.x + 1.3*uTime) + .008*sin(2.7*vW.z - 1.6*uTime + 1.);
        float under = smoothstep(wl + .004, wl - .004, vW.y);
        vec2 uv = vUv;
        uv.x += under*(uRefract + sin(vW.y*26. + uTime*2.2)*.0022);
        vec4 c = texture2D(map, uv);
        if(c.a < .5) discard;
        vec3 col = c.rgb * uTint;
        // damp line just above the waterline
        col *= 1. - uWet * smoothstep(.04,.0, vW.y - wl) * (1.-under) * .28;
        if(uCaustic > 0.){
          float ca = caustic(vW.xy*vec2(2.6,3.4) + vec2(vW.z*2.,0.) + 3., uTime*.6);
          col += col * ca * uCaustic;
        }
        col = mix(col, col*uWater*1.3, under*.16);
        col = mix(col, uWater, under*.05);
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`,
  });
}

import * as THREE from 'three';
import { dy, PPU, EYE0, D, TABLE_BACK } from '../config';
import { loadTex } from '../utils';
import { NOISE } from '../shaders/noise.glsl';
import tableBaseUrl from '@/assets/images/table_base.jpg';
import tableShadeUrl from '@/assets/images/table_shade.png';

// 桌板：桌板插畫攤平成俯視貼圖；樹影是另一張遮罩，才能讓它在風裡晃動
const TABLE_FRONT = D - D * EYE0.y / (EYE0.y - dy(1175));   // 前緣剛好落在相框下方
const TABLE_W = 1010 / PPU * (D - TABLE_FRONT) / D;         // 前緣約 1010 設計稿 px 寬
const SHADE_RATIO = [102 / 244, 115 / 208, 130 / 172].map((v) => Math.pow(v, 2.2));   // 插畫裡陰影的色調（線性空間）

export function createTable(scene, U) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uWind: U.wind,
      uBase: { value: loadTex(tableBaseUrl) }, uMask: { value: loadTex(tableShadeUrl, false) },
      uShade: { value: new THREE.Vector3(...SHADE_RATIO) }, uBack: { value: TABLE_BACK }, uFront: { value: TABLE_FRONT },
      uX0: { value: EYE0.x - TABLE_W / 2 }, uW: { value: TABLE_W },
    },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uWind, uBack, uFront, uX0, uW; uniform vec3 uShade;
      uniform sampler2D uBase, uMask;
      varying vec3 vW;
      ${NOISE}
      void main(){
        vec2 p = vW.xz;
        vec2 uv = vec2((p.x - uX0)/uW, 1. - (p.y - uBack)/(uFront - uBack));   // v = 1 at the back edge (image top)
        vec3 col = texture2D(uBase, uv).rgb;

        // leaf shadows from the drawing, swaying a little in the breeze
        vec2 sway = vec2(sin(uTime*.45 + uv.y*4.)*.0031 + sin(uTime*1.3 + uv.x*9.)*.0011*uWind,
                         cos(uTime*.37 + uv.x*3.)*.0055) * uWind;
        sway += (vec2(vnoise(uv*vec2(38.,10.) + uTime*.35), vnoise(uv*vec2(38.,10.) - uTime*.3 + 5.)) - .5) * vec2(.0042,.011) * uWind;
        float leaf = texture2D(uMask, uv + sway).r;
        col *= mix(vec3(1.), uShade, leaf);

        // bottle: contact ring, cast shadow and the caustic it focuses
        vec2 bp = p;
        vec2 dir = normalize(vec2(-1., .28));
        float along = dot(bp, dir), perp = dot(bp, vec2(-dir.y, dir.x));
        float len = 2.25; float w = mix(.98, .62, clamp(along/len,0.,1.));
        float sh = smoothstep(w, w-.38, abs(perp)) * smoothstep(-.3,.2,along) * smoothstep(len, len-1.1, along);
        sh = max(sh, smoothstep(1.08, .92, length(bp)));
        col = mix(col, col*mix(vec3(1.), uShade, .75), sh*.55);
        vec2 cp = (bp - dir*1.25)*vec2(2.0,3.2);
        float shimmer = .72 + .28*sin(uTime*2.1 + p.x*7.)*sin(uTime*1.4 + p.y*8.);
        col += vec3(.26,.27,.22) * exp(-dot(cp,cp)) * shimmer;
        col += vec3(.10,.12,.10) * caustic(bp*3.2 + 7., uTime*.55) * sh;
        float ring = smoothstep(.09, 0., abs(length(bp) - 1.0)) * smoothstep(-.6,.6, -bp.y+.4);
        col *= 1. - ring*.30;

        // back edge of the slab
        col *= 1. - smoothstep(uBack+.02, uBack, p.y)*.22;
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`,
  });

  const depth = TABLE_FRONT - TABLE_BACK;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_W, depth, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(EYE0.x, 0, TABLE_BACK + depth / 2);
  scene.add(mesh);
}

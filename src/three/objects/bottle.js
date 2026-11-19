import * as THREE from 'three';
import { C, V2, cubicBezier } from '../utils';
import { NOISE } from '../shaders/noise.glsl';

/* 瓶身輪廓（旋轉成形用的 2D 剖面，x = 半徑、y = 高度） */
function outerProfile() {
  const p = [];
  const rc = 0.17;   // 瓶底圓角
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * i / 10; p.push(V2(1 - rc + rc * Math.cos(a), rc + rc * Math.sin(a))); }
  p.push(V2(1.0, 1.2)); p.push(V2(1.0, 2.40));
  // 瓶肩
  const S = [V2(1, 2.40), V2(1, 2.92), V2(0.56, 2.98), V2(0.555, 3.30)];
  for (let i = 1; i <= 22; i++) p.push(cubicBezier(...S, i / 22));
  p.push(V2(0.555, 3.44));
  // 瓶口的珠緣
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; p.push(V2(0.585 + 0.055 * Math.cos(a), 3.53 + 0.09 * Math.sin(a))); }
  p.push(V2(0.61, 3.70));
  for (let i = 1; i <= 8; i++) { const a = (Math.PI / 2) * i / 8; p.push(V2(0.555 + 0.055 * Math.cos(a), 3.70 + 0.055 * Math.sin(a))); }
  return p;
}

function innerProfile() {
  const p = [];
  p.push(V2(0.505, 3.755));
  p.push(V2(0.50, 3.30));
  const S = [V2(0.50, 3.30), V2(0.505, 2.98), V2(0.94, 2.94), V2(0.94, 2.42)];
  for (let i = 1; i <= 18; i++) p.push(cubicBezier(...S, i / 18));
  p.push(V2(0.94, 0.30));
  for (let i = 1; i <= 8; i++) { const a = (Math.PI / 2) * i / 8; p.push(V2(0.80 + 0.14 * Math.cos(a), 0.30 - 0.14 * Math.sin(a))); }
  p.push(V2(0.0, 0.16));
  return p;
}

/* 插畫風疊層：墨線輪廓＋手繪高光。side = 1 正面、-1 背面 */
function overlayMaterial(side, U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: side > 0 ? THREE.FrontSide : THREE.BackSide,
    uniforms: { uSide: { value: side }, uInk: { value: C('#20313a') }, uTime: U.time },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vVP; varying vec3 vObj;
      void main(){ vObj = position; vN = normalize(normalMatrix*normal);
        vec4 mv = modelViewMatrix*vec4(position,1.); vVP = mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      uniform float uSide, uTime; uniform vec3 uInk;
      varying vec3 vN; varying vec3 vVP; varying vec3 vObj;
      ${NOISE}
      float band(float x, float a, float b, float s){ return smoothstep(a-s,a+s,x)*smoothstep(b+s,b-s,x); }
      void main(){
        vec3 N = normalize(vN) * uSide; vec3 V = normalize(-vVP);
        float ndv = clamp(dot(N,V), 0., 1.);
        float ang = atan(vObj.z, vObj.x);
        float wob = (vnoise(vec2(vObj.y*5., ang*4.)) - .5)*.10;
        float ink = smoothstep(.24 + wob, .10 + wob*.5, ndv);
        float inkA = uSide > 0. ? .82 : .38;
        float y = vObj.y;
        float hl = 0.;
        if(uSide > 0.){
          float nx = N.x + (vnoise(vec2(y*3.2, 1.7)) - .5)*.05;
          float body = smoothstep(.22,.55,y) * smoothstep(2.45,2.05,y);
          float brk = smoothstep(.25,.45, vnoise(vec2(y*2.6, 3.)));
          hl += band(nx, -.80, -.70, .012) * body * .85;                 // tall left highlight
          hl += band(nx, -.64, -.60, .010) * body * brk * .55;           // thin companion stroke
          hl += band(nx,  .50,  .57, .012) * body * brk * .45;           // right reflection
          hl += band(nx, -.48, -.18, .08) * body * .07;                  // broad soft sheen
          float sh = smoothstep(2.45,2.65,y) * smoothstep(3.3,3.05,y);
          hl += band(nx, -.62, -.40, .02) * sh * smoothstep(.05,.35,N.y) * .8;   // shoulder catchlight
          hl += band(nx, .35, .46, .02) * sh * .35;
          float lip = smoothstep(3.42, 3.48, y);
          hl += smoothstep(.55,.85, N.y) * lip * .75;                    // rim of the lip
          hl += band(nx, -.72, -.52, .02) * lip * .7;
          float base = smoothstep(.20,.05,y);
          hl += band(nx, -.75, .75, .05) * base * smoothstep(.0,.5,-N.y+.4) * .25;
          ink *= 1. - smoothstep(.2,.6,hl);
        }
        float a = max(ink*inkA, clamp(hl,0.,1.));
        vec3 col = mix(uInk, vec3(1.), clamp(hl/(hl + ink*inkA + 1e-4),0.,1.));
        if(a < .003) discard;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

export function createBottle(scene, U) {
  const outer = outerProfile();

  // 玻璃本體
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry([V2(0, 0), ...outer, ...innerProfile()], 160),
    new THREE.MeshPhysicalMaterial({
      color: C('#f4fbf9'), metalness: 0, roughness: 0.0, transmission: 1, thickness: 0.0, ior: 1.0,
      envMapIntensity: 1.0, specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.05,
      attenuationColor: C('#d7efec'), attenuationDistance: 2.4, side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  glass.renderOrder = 1;
  scene.add(glass);

  // 插畫疊層（背面淡、正面深）
  const overlayGeo = new THREE.LatheGeometry(outer, 160);
  const back = new THREE.Mesh(overlayGeo, overlayMaterial(-1, U));
  back.scale.setScalar(1.002); back.renderOrder = 3;
  const front = new THREE.Mesh(overlayGeo, overlayMaterial(1, U));
  front.scale.setScalar(1.003); front.renderOrder = 20;
  scene.add(back, front);
}

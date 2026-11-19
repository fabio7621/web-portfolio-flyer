import * as THREE from 'three';
import { PPU, W_LEVEL, RAFT_W, RAFT_ANCHOR, RAFT_SLOPE } from '../config';
import { C, imageTex } from '../utils';

/* 竹筏是 3/4 視角的插畫，水線沿著竹子斜斜往右上，不是水平的。
   所以竹筏自己畫水線：斜線以下染成水色、半透明，上下浮動時會跨過這條線。 */
function raftMaterial(map, U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: true, side: THREE.DoubleSide,
    uniforms: {
      map: { value: map }, uTime: U.time, uWind: U.wind, uW: { value: W_LEVEL }, uRaftX: { value: 0 }, uSlope: { value: RAFT_SLOPE },
      uWater: { value: C('#86c3d8') },
    },
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW;
      void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform float uTime, uW, uRaftX, uSlope, uWind; uniform vec3 uWater;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        float line = uW + .010*sin(2.1*vW.x + 1.3*uTime) + .008*sin(2.7*vW.z - 1.6*uTime + 1.)
                   + uSlope*(vW.x - uRaftX) + .0025*sin(vW.x*40. + uTime*3.);
        float dy = vW.y - line;
        float under = smoothstep(.003, -.003, dy);
        vec2 uv = vUv; uv.x += under*sin(vW.y*34. + uTime*2.4)*.0035;
        float sail = smoothstep(.40,.46,vUv.x)*smoothstep(.86,.80,vUv.x)*smoothstep(.34,.40,vUv.y)*smoothstep(.82,.77,vUv.y);
        uv.x += sail*sin(vUv.y*15. - uTime*3.6)*.0045*uWind*(vUv.x - .40);
        uv.y += sail*sin(vUv.x*11. - uTime*2.9)*.0025*uWind;
        vec4 c = texture2D(map, uv);
        if(c.a < .03) discard;
        vec3 col = c.rgb;
        col *= 1. - .28*smoothstep(.03, .0, dy)*(1. - under);                // damp wood just above the water
        col = mix(col, mix(col*vec3(.70,.88,.95), uWater, .35), under);      // seen through the water
        float a = c.a * mix(1., .58 - .18*smoothstep(0., .05, -dy), under);
        float foam = smoothstep(.0055, .0, abs(dy)) * step(.5, c.a);
        col = mix(col, vec3(1.), foam*.85); a = max(a, foam*.9*c.a);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * 竹筏：一開始從空中掉進水裡，之後隨波浮動、緩慢漂移。
 * 網址加 #still 則直接浮在水上（方便截圖）。
 */
export function createRaft(scene, U, ripples, splash) {
  const state = { x: 0.22, z: 0.30, vx: 0, vz: 0, y: 2.15, vy: 0, a: 0.05, va: 0, wet: false };
  if (location.hash === '#still') { state.y = W_LEVEL; state.wet = true; }

  let mesh = null;

  /** 圖片載入後才建立網格 */
  function build(img) {
    const s = RAFT_W / img.width / PPU;
    const geo = new THREE.PlaneGeometry(img.width * s, img.height * s, 1, 1);
    geo.translate((img.width / 2 - RAFT_ANCHOR[0]) * s, (RAFT_ANCHOR[1] - img.height / 2) * s, 0);
    mesh = new THREE.Mesh(geo, raftMaterial(imageTex(img), U));
    mesh.position.set(state.x, state.y, state.z);
    mesh.renderOrder = 9;
    scene.add(mesh);
  }

  /** 點水面時推竹筏一下：離點擊處越近晃越大 */
  function push(p) {
    const d = Math.hypot(p.x - state.x, p.z - state.z);
    const k = Math.max(0, 1 - d / 1.4);
    state.va += (p.x < state.x ? -1 : 1) * 2.4 * k + (Math.random() - 0.5) * 0.6;
    state.vy -= 0.35 * k;
    state.vx += (state.x - p.x) * 0.35;
    state.vz += (state.z - p.z) * 0.25;
  }

  function step(dt, t) {
    const s = state;
    // 慢慢漂向一個會移動的目標點
    const tx = 0.16 + 0.13 * Math.sin(t * 0.11) + 0.04 * Math.sin(t * 0.29);
    const tz = 0.27 + 0.07 * Math.sin(t * 0.17 + 1.0);
    s.vx += (tx - s.x) * 0.55 * dt; s.vz += (tz - s.z) * 0.55 * dt;
    s.vx *= Math.exp(-1.4 * dt); s.vz *= Math.exp(-1.4 * dt);
    s.x = Math.min(0.40, Math.max(-0.12, s.x + s.vx * dt));
    s.z = Math.min(0.40, Math.max(0.14, s.z + s.vz * dt));

    const surf = W_LEVEL + ripples.height(s.x, s.z, t);
    if (!s.wet) {
      // 還在空中：自由落體，碰到水面濺水花
      s.vy -= 6.2 * dt; s.y += s.vy * dt;
      if (s.y <= surf) {
        s.wet = true;
        const p = Math.min(1.2, Math.abs(s.vy) / 3);
        ripples.add(s.x, s.z, 0.03 * p + 0.01);
        splash(s.x, s.z, p);
        s.vy *= 0.25; s.va += 1.6;
      }
    } else {
      // 浮在水上：彈簧拉回水面
      s.vy += ((surf - s.y) * 30 - s.vy * 4.2) * dt; s.y += s.vy * dt;
      if (s.y < surf - 0.07) { s.y = surf - 0.07; s.vy = Math.max(s.vy, 0); }
      if (s.y > surf + 0.10) { s.y = surf + 0.10; s.vy = Math.min(s.vy, 0); }
    }
    // 跟著波浪坡度傾斜
    const slope = (ripples.height(s.x + 0.3, s.z, t) - ripples.height(s.x - 0.3, s.z, t)) / 0.6;
    const target = Math.atan(slope) * 1.7 + 0.035 * Math.sin(t * 0.83) + 0.02 * Math.sin(t * 1.9);
    s.va += ((target - s.a) * 16 - s.va * 2.6) * dt; s.a += s.va * dt;
    s.a = Math.max(-0.45, Math.min(0.45, s.a));
  }

  /** 每幀更新；竹筏還沒載入就回傳 false */
  function update(dt, t) {
    if (!mesh) return false;
    const SUBSTEPS = 4;
    for (let i = 0; i < SUBSTEPS; i++) step(dt / SUBSTEPS, t);
    const s = state;
    mesh.position.set(s.x, s.y, s.z);
    mesh.rotation.set(Math.sin(t * 0.7) * 0.05, 0, s.a);
    mesh.scale.x = 1 - 0.04 * Math.sin(t * 0.37);
    mesh.material.uniforms.uRaftX.value = s.x;
    if (s.wet && Math.abs(s.vy) > 0.35 && Math.random() < dt * 6) ripples.add(s.x, s.z, 0.006);
    return true;
  }

  return { state, build, push, update };
}

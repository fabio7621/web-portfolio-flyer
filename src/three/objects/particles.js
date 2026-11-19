import * as THREE from 'three';
import { D, W_LEVEL, R_IN } from '../config';
import { C } from '../utils';

const R = Math.random;
const KIND_BUBBLE = 0;
const KIND_DOT = 1;

function pointsMaterial(kind) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uPx: { value: 1 }, uD: { value: D }, uKind: { value: kind }, uCol: { value: C('#ffffff') } },
    vertexShader: /* glsl */`
      attribute float size; attribute float alpha; uniform float uPx, uD; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vA = alpha;
        gl_PointSize = size*uPx*uD/(-mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      uniform float uKind; uniform vec3 uCol; varying float vA;
      void main(){
        vec2 p = gl_PointCoord - .5; float d = length(p);
        float a;
        if(uKind < .5){ // bubble: inked ring + glint
          a = smoothstep(.5,.40,d)*smoothstep(.22,.34,d)*.9 + smoothstep(.13,.05,length(p+vec2(.14,.14)));
        } else { a = smoothstep(.5,.15,d); }
        a *= vA; if(a < .01) discard;
        gl_FragColor = vec4(uCol, a);
        #include <colorspace_fragment>
      }`,
  });
}

function makePoints(scene, count, kind, renderOrder) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));
  g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(count), 1));
  const points = new THREE.Points(g, pointsMaterial(kind));
  points.frustumCulled = false;
  points.renderOrder = renderOrder;
  scene.add(points);
  return points;
}

/** 粒子：往上冒的氣泡、水中懸浮的小點、竹筏落水／點擊時濺起的水滴 */
export function createParticles(scene, ripples) {
  const bubbles = makePoints(scene, 14, KIND_BUBBLE, 6);
  const dots = makePoints(scene, 70, KIND_DOT, 7);   // 40 個懸浮點 + 30 個水滴共用

  const bubbleList = Array.from({ length: 14 }, () => ({ x: 0, y: 0, z: 0, s: 0, sp: 0, ph: R() * 6, born: -1 }));
  function spawnBubble(b, t) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.7;
    b.x = Math.cos(a) * r; b.z = Math.sin(a) * r * 0.8; b.y = 0.42 + R() * 0.1;
    b.s = 0.022 + R() * 0.03; b.sp = 0.10 + R() * 0.12; b.born = t + R() * 6;
  }
  bubbleList.forEach((b) => spawnBubble(b, 0));

  const specks = Array.from({ length: 40 }, () => {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.85;
    return { x: Math.cos(a) * r, y: 0.2 + R() * (W_LEVEL - 0.25), z: Math.sin(a) * r, s: 0.008 + R() * 0.012, ph: R() * 6, al: 0.35 + R() * 0.5 };
  });

  const drops = Array.from({ length: 30 }, () => ({ x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0, s: 0, life: 0 }));

  /** 在 (x, z) 濺起水花，power 越大水滴越多、越高 */
  function splash(x, z, power) {
    let k = 0;
    for (const d of drops) {
      if (d.life > 0) continue;
      if (k++ > 6 + power * 16) break;
      const a = R() * Math.PI * 2;
      d.x = x + Math.cos(a) * 0.32; d.z = z + Math.sin(a) * 0.12; d.y = W_LEVEL + 0.02;
      const sp = (0.35 + R() * 0.8) * Math.min(1.4, 0.5 + power);
      d.vx = Math.cos(a) * sp * 0.55; d.vz = Math.sin(a) * sp * 0.25; d.vy = 0.8 + R() * 1.4 * Math.min(1.3, 0.4 + power);
      d.s = 0.016 + R() * 0.02; d.life = 1;
    }
  }

  /** pxPerUnit：畫布上 1 世界單位等於幾個像素，用來算點的大小 */
  function update(dt, t, pxPerUnit) {
    bubbles.material.uniforms.uPx.value = pxPerUnit;
    dots.material.uniforms.uPx.value = pxPerUnit;

    {
      const { position: P, size: S, alpha: A } = bubbles.geometry.attributes;
      bubbleList.forEach((b, i) => {
        if (t < b.born) { A.array[i] = 0; return; }
        b.y += b.sp * dt; b.sp += dt * 0.05;
        const wx = Math.sin(t * 3 + b.ph) * 0.012;
        const surf = W_LEVEL + ripples.height(b.x, b.z, t) - 0.01;
        if (b.y > surf) { ripples.add(b.x, b.z, 0.0035); spawnBubble(b, t); A.array[i] = 0; return; }
        P.array[i * 3] = b.x + wx; P.array[i * 3 + 1] = b.y; P.array[i * 3 + 2] = b.z;
        S.array[i] = b.s; A.array[i] = Math.min(1, (t - b.born) * 3) * 0.9;
      });
      P.needsUpdate = S.needsUpdate = A.needsUpdate = true;
    }
    {
      const { position: P, size: S, alpha: A } = dots.geometry.attributes;
      specks.forEach((s, i) => {
        P.array[i * 3] = s.x + Math.sin(t * 0.21 + s.ph) * 0.03;
        P.array[i * 3 + 1] = s.y + Math.sin(t * 0.33 + s.ph * 2) * 0.025;
        P.array[i * 3 + 2] = s.z + Math.cos(t * 0.19 + s.ph) * 0.03;
        S.array[i] = s.s; A.array[i] = s.al * (0.6 + 0.4 * Math.sin(t * 1.3 + s.ph));
      });
      drops.forEach((d, j) => {
        const i = specks.length + j;
        if (d.life > 0) {
          d.vy -= 5.5 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
          const r = Math.hypot(d.x, d.z);
          if (r > R_IN - 0.03) { const k = (R_IN - 0.03) / r; d.x *= k; d.z *= k; d.vx *= -0.4; d.vz *= -0.4; }
          if (d.vy < 0 && d.y < W_LEVEL) { d.life = 0; ripples.add(d.x, d.z, 0.0025); }
        }
        P.array[i * 3] = d.x; P.array[i * 3 + 1] = d.y; P.array[i * 3 + 2] = d.z;
        S.array[i] = d.s; A.array[i] = d.life > 0 ? 0.95 : 0;
      });
      P.needsUpdate = S.needsUpdate = A.needsUpdate = true;
    }
  }

  return { splash, update };
}

import * as THREE from 'three';
import { W_LEVEL, R_IN } from '../config';
import { C, V2 } from '../utils';
import { NOISE } from '../shaders/noise.glsl';
import { WAVE_GLSL } from '../shaders/wave.glsl';
import { MAX_RIPPLES } from '../ripples';

/** 瓶內的水：水體（側面看到的那團水）＋會動的水面 */
export function createWater(scene, U, ripples) {
  /* ---- 水體 ---- */
  const bodyMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uW: { value: W_LEVEL }, uTop: { value: C('#cdeaf1') }, uDeep: { value: C('#4f9dbd') }, uTime: U.time },
    vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; varying vec3 vVP;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(normalMatrix*normal);
        vec4 mv = viewMatrix*w; vVP = mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      uniform float uW, uTime; uniform vec3 uTop, uDeep;
      varying vec3 vW; varying vec3 vN; varying vec3 vVP;
      void main(){
        float d = clamp((uW - vW.y)/uW, 0., 1.);
        vec3 col = mix(uTop, uDeep, d*.85);
        float ndv = abs(dot(normalize(vN), normalize(-vVP)));
        float a = (gl_FrontFacing ? .14 : .10) + d*.10 + (1.-ndv)*.20;
        float wl = uW - vW.y + sin(vW.x*3. + uTime*1.3)*.008;
        float line = smoothstep(.028,.012,wl) * smoothstep(-.004,.006,wl);
        float under = smoothstep(.045,.03,wl)*smoothstep(.02,.03,wl);
        col = mix(col, vec3(1.), line*.9); a = max(a, line*(gl_FrontFacing?.75:.35));
        col = mix(col, uDeep*.6, under*.6); a = max(a, under*.22);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  const pts = [V2(0, 0.16)];
  for (let i = 8; i >= 0; i--) { const a = (Math.PI / 2) * i / 8; pts.push(V2(0.79 + 0.14 * Math.cos(a), 0.30 - 0.14 * Math.sin(a))); }
  pts.push(V2(R_IN - 0.005, W_LEVEL));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 128), bodyMat);
  body.renderOrder = 5;
  scene.add(body);

  /* ---- 水面 ---- */
  const surfaceMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: U.time, uRip: { value: ripples.list }, uR: { value: R_IN - 0.006 },
      uRaft: { value: new THREE.Vector2() },
      uDeep: { value: C('#7fbfd6') }, uSky: { value: C('#e3f2f7') }, uInk: { value: C('#20313a') },
    },
    vertexShader: /* glsl */`
      uniform float uTime; varying vec3 vW;
      ${WAVE_GLSL}
      void main(){ vec4 w = modelMatrix*vec4(position,1.); w.y += waveH(w.xz, uTime); vW = w.xyz;
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uR; uniform vec2 uRaft; uniform vec3 uDeep, uSky, uInk; uniform vec4 uRip[${MAX_RIPPLES}];
      varying vec3 vW;
      ${NOISE}
      // anti-aliased ink-style rings: constant on-screen width however flat the surface is seen
      float rings(float d, float freq, float speed, float fall){
        float v = d*freq - uTime*speed;
        float f = abs(fract(v) - .5);
        float px = fwidth(v);
        return (1. - smoothstep(px*.7, px*1.9, f)) * exp(-d*fall) * smoothstep(.0,.05,d);
      }
      float ring1(float d, float f){ float px = fwidth(d); return 1. - smoothstep(px*.8, px*2.2, abs(d - f)); }
      void main(){
        float r = length(vW.xz);
        if(r > uR) discard;
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW))); if(N.y < 0.) N = -N;
        vec3 V = normalize(cameraPosition - vW);
        float F = pow(1. - max(dot(N,V),0.), 3.);
        vec3 col = mix(uDeep, uSky, F);
        float a = .16 + .34*F;

        // toon ripples: around the raft (pill shaped) and the stems
        vec2 q = vW.xz - uRaft; float dr = length(vec2(max(abs(q.x)-.30,0.), q.y*1.25));
        float rr = rings(dr, 6.5, .30, 2.8);
        float s1 = rings(length(vW.xz - vec2(-.50,.02)), 9., .40, 6.);
        float s2 = rings(length(vW.xz - vec2(-.34,-.02)), 10., .36, 6.5);
        // click ripples, drawn as crisp rings travelling out
        float cr = 0.;
        for(int i=0;i<${MAX_RIPPLES};i++){ vec4 R = uRip[i]; float age = uTime - R.z; if(age<0.||age>3.5) continue;
          float d = length(vW.xz - R.xy); float f = age*.9;
          float k = clamp(R.w*40.,0.,1.) * smoothstep(uR+.02, uR-.1, d);
          cr += ring1(d, f) * exp(-age*1.0) * k;
          cr += ring1(d, f - .15) * exp(-age*1.4) * .7 * k;
          cr += ring1(d, f - .28) * exp(-age*1.9) * .45 * k; }
        float lines = clamp(rr*1.25 + (s1 + s2)*.8 + cr, 0., 1.);
        col = mix(col, vec3(1.), lines); a = max(a, lines*.85);

        // sun glints
        vec3 L = normalize(vec3(.55,.75,.35)); vec3 H = normalize(L+V);
        float sp = pow(max(dot(N,H),0.), 900.);
        float glint = smoothstep(.25,.6,sp);
        col = mix(col, vec3(1.), glint); a = max(a, glint);

        // meniscus + ink edge
        float rim = smoothstep(uR-.06, uR-.008, r);
        col = mix(col, vec3(1.), rim*.8); a = max(a, rim*.55);
        float ink = smoothstep(uR-.014, uR-.002, r);
        col = mix(col, uInk, ink); a = max(a, ink*.55);

        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(2 * R_IN, 2 * R_IN, 170, 170), surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = W_LEVEL;
  surface.renderOrder = 8;
  scene.add(surface);

  return {
    /** 告訴水面竹筏在哪，畫竹筏周圍的漣漪 */
    setRaft(x, z) { surfaceMat.uniforms.uRaft.value.set(x, z); },
  };
}

import * as THREE from 'three';
import { C } from '../utils';

/** 燈光＋給玻璃反射用的自製環境貼圖（天空漸層＋幾塊亮板） */
export function setupLighting(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();

  env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: C('#4f95cf') }, hor: { value: C('#dcecf3') }, bot: { value: C('#d8c6a3') } },
    vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform vec3 top,hor,bot; void main(){ float h=normalize(vP).y;
      vec3 c = h>0. ? mix(hor,top,pow(h,.55)) : mix(hor,bot,pow(-h,.35)); gl_FragColor=vec4(c,1.); }`,
  })));

  const softbox = (w, h, pos, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide,
    }));
    m.position.copy(pos); m.lookAt(0, 0, 0); env.add(m);
  };
  softbox(2.4, 14, new THREE.Vector3(9, 3, 8), 7);
  softbox(1.2, 10, new THREE.Vector3(-11, 2, 5), 3.5);
  softbox(16, 3, new THREE.Vector3(0, 13, 2), 2.2);

  scene.environment = pmrem.fromScene(env, 0.015).texture;
  pmrem.dispose();

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 9, 7);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xcfe6f5, 0xe8d8b8, 0.6));
}

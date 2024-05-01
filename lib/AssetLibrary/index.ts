import * as THREE from 'three';
// import { FBMFireMaterial } from '@/threejs-shader-materials/index';

import luminescenceVertexShader from './shader/luminescence/vertex.glsl?raw';
import luminescenceFragmentShader from './shader/luminescence/fragment.glsl?raw';

import coffeeSteamVertexShader from './shader/coffeeSteam/vertex.glsl?raw';
import coffeeSteamFragmentShader from './shader/coffeeSteam/fragment.glsl?raw';

import gradientTransparentVertexShader from './shader/gradientTransparent/vertex.glsl?raw';
import gradientTransparentFragmentShader from './shader/gradientTransparent/fragment.glsl?raw';

import gradualChangeVertexShader from './shader/gradualChange/vertex.glsl?raw';
import gradualChangeFragmentShader from './shader/gradualChange/fragment.glsl?raw';

import { Reflector } from 'three/examples/jsm/objects/Reflector';

// /**
//  * @description: 烟囱火焰
//  * @param {*} options
//  * @return {*}
//  * @author: 池樱千幻
//  */
// export const chimneyFire = (options = {}) => {
// 	const geo = new THREE.SphereGeometry(2, 16, 10);
// 	const mat = new FBMFireMaterial({
// 		fog: options.fog !== undefined,
// 		transparent: true,
// 	});
// 	mat.color = new THREE.Color(0xcc3300);
// 	mat.tiles = 1;
// 	mat.hashLoop = 8.0;
// 	mat.amp = 1.0;
// 	mat.rimPow = 2.0;
// 	mat.speed = -1.0;
// 	Object.assign(mat, options);
// 	const mesh = new THREE.Mesh(geo, mat);
// 	mesh.scale.set(0.11, 0.55, 0.11);
// 	mesh.renderOrder = 3;
// 	return mesh;
// };

/**
 * @description: 透明发光材质
 * @param {*} options
 * @return {*}
 * @author: 池樱千幻
 */
export const luminescenceMaterial = (c: THREE.ColorRepresentation | undefined, strTex: string) => {
  const texLoader = new THREE.TextureLoader();
  let textureMap = texLoader.load(strTex);
  textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;

  let custimMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: {
        // type: 'c',
        value: new THREE.Color(c),
      },
      textureMap: {
        value: textureMap,
      },
      alpha: {
        // type: 'f',
        value: 0.3,
      },
      time: {
        // type: 'f',
        value: 0.0,
      },
    },
    vertexShader: luminescenceVertexShader,
    fragmentShader: luminescenceFragmentShader,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  return custimMaterial;
};

/**
 * @description: 闪烁光柱
 * @return {*}
 * @author: 池樱千幻
 */
export const gradientTransparentMaterial = () => {
  let cubeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.01 },
      color: { value: new THREE.Color(0xff0000) },
    },
    vertexShader: gradientTransparentVertexShader,
    fragmentShader: gradientTransparentFragmentShader,
    transparent: true,
  });
  return cubeMaterial;
};

/**
 * @description: 咖啡烟
 * @param {object} model
 * @return {*}
 * @author: 池樱千幻
 */
export const coffeeSteam = (model: { material: THREE.ShaderMaterial; update: () => void }) => {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: coffeeSteamVertexShader,
    fragmentShader: coffeeSteamFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uTimeFrequency: { value: 0.0004 },
      uUvFrequency: { value: new THREE.Vector2(4, 5) },
      uColor: { value: new THREE.Color(`#ffffff`) },
    },
  });
  model.material = mat;

  model.update = () => {
    mat.uniforms.uTime.value += 100;
  };
  return model;
};

/**
 * @description: 根据面,创建镜面,需要修改threejs源码
 * @param {*} geometry
 * @return {*}
 * @author: 池樱千幻
 */
export const getMirror = (geometry = new THREE.PlaneGeometry(10, 10), width = 100, height = 100) => {
  let groundMirror = new Reflector(geometry, {
    textureWidth: width * window.devicePixelRatio,
    textureHeight: height * window.devicePixelRatio,
    color: 0x777777,
    opacity: 1,
  } as any);
  groundMirror.position.y = 0.01;
  groundMirror.rotateX(-Math.PI / 2);
  return groundMirror;
};

export const gradualChangeMaterial = () => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      s: { value: -1.0 },
      b: { value: 1.0 }, //bias 颜色最亮的位置
      p: { value: 1.0 }, //power决定了透明度变化速度及方向。
      glowColor: { value: new THREE.Color(0x1da9fc) },
    },
    vertexShader: gradualChangeVertexShader,
    fragmentShader: gradualChangeFragmentShader,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
  });
  return material;
};

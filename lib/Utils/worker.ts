/*
 * @Author: hongbin
 * @Date: 2022-08-24 22:00:00
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-04-23 19:02:51
 * @Description:处理worker功能
 */

import * as THREE from 'three';
import { THREEMaterialType, IBaseProps, IGroupParams, IMeshParams, IPointLight } from '../worker/types';

/**
 * glb模型并发加载工作原理
 * web worker 可以解析glb模型 但是postMessage发送的数据类型只是普通的对象，
 * 并且不能存在方法 方法无法传递，带方法会导致发送失败，并且不会触发onerror
 * THREE构建物体所需的bufferGeometry，还是BufferAttribute 或者Material等原型对象无法被传递
 * 传递到主线程的只是一个普通对象和上面的属性(对象中不能有函数)
 * 可以通过生成一个THREE所需的类型 把传递过来的对象上的参数复制给THREE需要的对象上
 * 这样在主线程生成一个同样的模型，但是省去了解析模型时间(模型解析在web worker中与js主线程并发执行)
 * 实现并发加载
 */

/**
 * 通过设置attributes index来复刻一个集合体
 */
const genGeometry = (geometry: IMeshParams['geometry']) => {
  const geom = new THREE.BufferGeometry();
  const {
    attributes: { position, uv, normal },
    index,
  } = geometry;

  if (position instanceof THREE.GLBufferAttribute || uv instanceof THREE.GLBufferAttribute || normal instanceof THREE.GLBufferAttribute) {
    // 如果是GLBufferAttribute类型,就返回空的geometry
    return geom;
  }
  //处理几何坐标
  const attributes = {
    position: new THREE.BufferAttribute(position.array, position.itemSize, position.normalized),
    uv: new THREE.BufferAttribute(uv.array, uv.itemSize, uv.normalized),
    normal: new THREE.BufferAttribute(normal.array, normal.itemSize, normal.normalized),
  };
  geom.attributes = attributes;
  geom.index = index ? new THREE.BufferAttribute(index.array, index.itemSize, index.normalized) : null;

  return geom;
};
/**
 * 根据传入纹理的参数生成真正有效的Material类型数据
 */
const genMaterial = (mate: IMeshParams['material']) => {
  console.log('mate: ', mate);
  if (!mate) return undefined;
  const multipleMaterial = Array.isArray(mate);
  const material = multipleMaterial ? ([] as THREE.Material[]) : new THREE[mate.type as THREEMaterialType]();
  //处理材质
  //多个材质
  if (multipleMaterial && Array.isArray(material)) {
    for (const m of mate) {
      const im = new THREE[m.type as THREEMaterialType]();
      material.push(im);
    }
  } else if (mate) {
    //单个材质
    Object.assign(material, mate);
  }
  return material;
};

/**
 * 处理基本属性转换(Object3D基类上的属性) matrix scale rotate translate position children  animations
 */
const parseBaseParams = (params: IBaseProps, object: THREE.Object3D) => {
  const matrix = new THREE.Matrix4();
  matrix.elements = params.matrix.elements;
  object.name = params.name;
  object.matrix = matrix;
  object.rotation.set(...params.rotation);
  object.position.set(...params.position);
  object.scale.set(...params.scale);
  object.quaternion.set(...params.quaternion);
  object.up.set(...params.up);
  object.userData = params.userData;
  object.visible = params.visible;

  parseChildren(object, params.children);
  genAnimations(object, params.animations);
  // deleteObjectKeys(params, [
  //     "name",
  //     "matrix",
  //     "rotation",
  //     "position",
  //     "scale",
  //     "quaternion",
  //     "up",
  //     "userData",
  //     "visible",
  // ]);
  // object.scale.x += 0.3;
  // object.scale.y += 0.3;
  // object.scale.z += 0.3;
};

const parseMesh = (IMeshParams: IMeshParams) => {
  const geometry = genGeometry(IMeshParams.geometry);
  const material = genMaterial(IMeshParams.material);

  const mesh = new THREE.Mesh(geometry, material);
  parseBaseParams(IMeshParams, mesh);
  return mesh;
};

const parseGroup = (params: IGroupParams) => {
  const group = new THREE.Group();
  parseBaseParams(params, group);
  return group;
};

const parsePointLight = (params: IPointLight) => {
  const color = new THREE.Color();
  // 色彩空间
  // export type ColorSpace = NoColorSpace | SRGBColorSpace | LinearSRGBColorSpace;
  // export type NoColorSpace = '';
  // export type SRGBColorSpace = 'srgb';
  // export type LinearSRGBColorSpace = 'srgb-linear';
  //glb模型为了亮度恢复 使用srgb格式 所以颜色也使用同样格式 使其颜色模式一致
  color.setRGB(params.color.r, params.color.g, params.color.b, 'srgb-linear');

  const pointLight = new THREE.PointLight(color, params.intensity, params.distance, params.decay);
  parseBaseParams(params, pointLight);
  return pointLight;
};

const parseObject3D = (params: IBaseProps) => {
  const object = new THREE.Object3D();
  parseBaseParams(params, object);
  return object;
};

const parseChildren = (object3D: THREE.Object3D, children: IBaseProps[]) => {
  if (!children.length) return;
  const objectList: THREE.Object3D[] = [];
  for (const child of children) {
    const { type } = child;
    if (type === 'Mesh') {
      objectList.push(parseMesh(child as IMeshParams));
    } else if (type === 'Group') {
      objectList.push(parseGroup(child));
    } else if (type === 'PointLight') {
      objectList.push(parsePointLight(child as IPointLight));
    } else if (type === 'Object3D') {
      objectList.push(parseObject3D(child));
    } else {
      throw new Error('出现了未处理的类型：' + type);
    }
  }

  object3D.add(...objectList);
};
/**
 * 生成动画
 */
const genAnimations = (object3D: THREE.Object3D, sceneAnimations: IGroupParams['sceneAnimations']) => {
  if (!sceneAnimations) return;
  const animations: THREE.AnimationClip[] = [];

  for (const animation of sceneAnimations!) {
    const clip = new THREE.AnimationClip(animation.name, animation.duration, [], animation.blendMode);

    for (const { name, times, values } of animation.tracks) {
      const nreTrack = new THREE.QuaternionKeyframeTrack(name, times as any, values as any);
      clip.tracks.push(nreTrack);
    }

    animations.push(clip);
  }

  object3D.animations = animations;
};

/**
 * 解析传入的模型参数生成有效的three.js物体
 */
export const parseModel = (params: IGroupParams) => {
  const model = parseGroup(params);
  // model.position.x += 10;
  genAnimations(model, params.sceneAnimations);
  // console.log("解析完:", model);

  return model;
};

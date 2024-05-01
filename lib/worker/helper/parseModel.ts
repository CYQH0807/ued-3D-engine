/*
 * @Author: hongbin
 * @Date: 2022-08-29 15:12:06
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-04-23 13:57:46
 * @Description: 解析模型函数
 */

import { IBaseProps, IGroupParams, IPointLight } from '../types';

/**
 * 生成基本参数 旋转 位移 缩放等属性
 */
const genBaseStruct = (obj: THREE.Object3D): IBaseProps => {
  const { type, name, quaternion: q, position: p, rotation: r, scale: s, up: u, userData, visible, matrix } = obj;
  const quaternion: IBaseProps['quaternion'] = [q.x, q.y, q.z, q.w];
  const position: IBaseProps['position'] = [p.x, p.y, p.z];
  const rotation: IBaseProps['rotation'] = [r.x, r.y, r.z, r.order];
  const scale: IBaseProps['scale'] = [s.x, s.y, s.z];
  const up: IBaseProps['up'] = [u.x, u.y, u.z];

  return {
    type,
    name,
    quaternion,
    position,
    rotation,
    scale,
    up,
    matrix,
    userData,
    visible,
    children: genObject3DChildren(obj.children),
    animations: genAnimations(obj.animations),
  };
};

/**
 * 生成动画结构
 */
export const genAnimations = (animations: THREE.AnimationClip[]) =>
  animations.map((animation) => {
    //删除这个方法就可以传递过去了
    //@ts-ignore
    animation['tracks'].forEach((t) => delete t['createInterpolant']);
    return animation;
  });

/**
 * 生成物体参数
 */
const genMeshStruct = (mesh: THREE.Mesh) => {
  const { geometry, material } = mesh;

  return {
    geometry,
    material,
    ...genBaseStruct(mesh),
  };
};

const genPointLightStruct = (pointLight: THREE.PointLight): IPointLight => {
  return {
    power: pointLight.power,
    color: pointLight.color,
    decay: pointLight.decay,
    castShadow: pointLight.castShadow,
    distance: pointLight.distance,
    frustumCulled: pointLight.frustumCulled,
    intensity: pointLight.intensity,
    layers: pointLight.layers,
    ...genBaseStruct(pointLight),
  };
};

const genObject3DStruct = (object: THREE.Object3D) => {
  return {
    ...genBaseStruct(object),
  };
};

/**
 * 生成子元素结构
 */
const genObject3DChildren = (children: THREE.Object3D[]) => {
  const childStruct: IGroupParams['children'] = [];
  for (const child of children) {
    const { type } = child;
    if (type === 'Mesh') {
      childStruct.push(genMeshStruct(child as THREE.Mesh));
    } else if (type === 'Group') {
      childStruct.push(genGroupStruct(child as THREE.Group));
    } else if (type === 'PointLight') {
      childStruct.push(genPointLightStruct(child as THREE.PointLight));
    } else if (type === 'Object3D') {
      childStruct.push(genObject3DStruct(child));
    }
  }
  return childStruct;
};

/**
 * 生成物体组结构
 */
export const genGroupStruct = (group: THREE.Group) => {
  const struct: IGroupParams = { ...genBaseStruct(group) };
  return struct;
};

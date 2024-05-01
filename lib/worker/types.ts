/*
 * @Author: hongbin
 * @Date: 2022-08-16 15:19:38
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-04-23 13:27:59
 * @Description:类型定义
 */

export interface MonitorArray<T> extends Array<T> {
  monitoringChanges?: (...items: T[]) => void;
  constructor: {
    prototype: {
      monitoringChanges?: (...items: T[]) => void;
    };
  };
}

export interface TPlanet {
  /**
   * 陷入地下的处理
   */
  fallIntoFloor(upDistance: number, vector3?: THREE.Vector3): number;
  // fallIntoFloor(vector3: THREE.Vector3): void;
  //初始化星球
  init: () => void;
  /**
   * 星球名
   */
  name: string;
  /**
   * 需要检测的物体
   */
  withVolume: MonitorArray<THREE.Object3D<THREE.Event>>;
  /**
   * 星球内全部物体
   */
  objects: THREE.Group;
  /**
   * 专属此星球的每一帧执行的操作
   */
  ticks: () => void;
  /**
   * 地面
   */
  // floor: THREE.Mesh;
  /**
   * 必须检测的物体
   */
  mustBeDetected: THREE.Mesh[];
  /**
   * 星球外壳
   */
  planet: THREE.Mesh;
  /**
   * 镜头纵向可旋转角度
   */
  polarAngle?: Partial<{ min: number; max: number }>;
  /**
   * 防止陷入地下所添加的物体
   */
  underground: {
    // mesh: THREE.Box3 | THREE.Sphere;
    // init: () => {};
    needCalculate: (y: number) => boolean;
  };
}
/**
 * Three.js 支持的所有材料类型
 */
export type THREEMaterialType = 'ShadowMaterial' | 'SpriteMaterial' | 'RawShaderMaterial' | 'ShaderMaterial' | 'PointsMaterial' | 'MeshPhysicalMaterial' | 'MeshStandardMaterial' | 'MeshPhongMaterial' | 'MeshToonMaterial' | 'MeshNormalMaterial' | 'MeshLambertMaterial' | 'MeshDepthMaterial' | 'MeshDistanceMaterial' | 'MeshBasicMaterial' | 'MeshMatcapMaterial' | 'LineDashedMaterial' | 'LineBasicMaterial' | 'Material';

export type Vector3Arr = [x: number, y: number, z: number];

export interface IBaseProps {
  name: string;
  type: string;
  matrix: THREE.Mesh['matrix'];
  position: Vector3Arr;
  quaternion: [...Vector3Arr, number];
  rotation: [...Vector3Arr, THREE.Mesh['rotation']['order']];
  scale: Vector3Arr;
  up: Vector3Arr;
  userData: THREE.Mesh['userData'];
  visible: THREE.Mesh['visible'];
  children: Array<IMeshParams | IGroupParams | IPointLight>;
  animations: THREE.AnimationClip[];
  /**
   * blender 制作的模型动画添载在scene上的animations上 这个参数导出scene上的动画
   */
  sceneAnimations?: THREE.AnimationClip[];
}

/**
 * 将整个模型解析完发送过去的数据结构 根据这个结构生成模型
 */
export interface IMeshParams extends IBaseProps {
  geometry: THREE.Mesh['geometry'];
  material: THREE.Mesh['material'];
}
export interface IGroupParams extends IBaseProps {}
export interface IPointLight extends IBaseProps {
  power: number;
  color: THREE.Color;
  decay: number;
  castShadow: boolean;
  distance: number;
  frustumCulled: boolean;
  intensity: number;
  layers?: any;
}

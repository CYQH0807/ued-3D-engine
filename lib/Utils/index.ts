/*
 * @Description: 工具类
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-14 17:44:16
 * @LastEditTime: 2023-08-01 14:59:52
 */
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { needReadConfig } from '../config';

/**
 * @description: 读取配置文件,将json解析成THREE对象
 * @param {*} config
 * @return {*}
 * @author: 池樱千幻
 */
export const readConfig = (config: any = {}) => {
  let keyList = Object.keys(config);
  if (keyList.length === 0) {
    console.error('当前模型没有config配置');
  }
  const configObj: any = {};
  needReadConfig.forEach((str) => {
    let attribute = config[str];
    if (attribute && attribute.x !== undefined && attribute.y !== undefined && attribute.z !== undefined) {
      configObj[str] = new THREE.Vector3(attribute.x, attribute.y, attribute.z);
    } else if (attribute && attribute.r !== undefined && attribute.g !== undefined && attribute.b !== undefined) {
      configObj[str] = new THREE.Color(attribute.r, attribute.g, attribute.b);
    } else {
      configObj[str] = config[str];
    }
  });
  return configObj;
};

/**
 * @description: promise队列执行,最大并发数量默认为2
 * @param {function} tasks
 * @param {*} limit
 * @return {*}
 * @author: 池樱千幻
 */
export const promiseQueue = async (tasks: (() => Promise<void>)[], limit = 2) => {
  const taskPool = new Set();
  for (const task of tasks) {
    const promise = task();
    taskPool.add(Promise.resolve(promise));
    promise.then(() => taskPool.delete(promise));
    if (taskPool.size >= limit) {
      await Promise.race(taskPool);
    }
  }
  return Promise.all(taskPool);
};

/**
 * @description: 根据模型计算模型中心,以及各种位置,使用THREE.Box3
 * @param {*} model
 * @return {*} center 模型中心点坐标
 * @return {*} size 盒子的大小
 * @return {*} box3 三维空间中的一个轴对齐包围盒
 *  @return {*} length  计算从(0, 0, 0) 到 center 的直线长度
 * @author: 池樱千幻
 */
export const getBox3ByModel = (model: THREE.Object3D<THREE.Event>) => {
  model.updateMatrixWorld();
  var boundingBox = new THREE.Box3().setFromObject(model);
  var modelSizeVec3 = new THREE.Vector3();
  boundingBox.getSize(modelSizeVec3);
  var modelCenter = new THREE.Vector3();
  boundingBox.getCenter(modelCenter);
  return {
    center: modelCenter,
    size: modelSizeVec3,
    box3: boundingBox,
    length: modelSizeVec3.length(),
  };
};

/**
 * @description: 物体移动动画
 * @param {*} update
 * @return {*}
 * @author: 池樱千幻
 */
export const tween = (pos: any, object: any, time = 1000, update = () => {}) => {
  return new Promise<void>((resolve) => {
    let tweenA = new TWEEN.Tween(object)
      .to(
        {
          ...pos,
        },
        time
      )
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start()
      .onUpdate(update);
    tweenA.onComplete(() => {
      resolve();
    });
  });
};

/**
   * @description: 判断操作系统,因为右键在win和mac的触发方式不同,
   * windows的触发顺序是 按下 => 抬起 => 右键
   * mac的触发顺序是 按下 => 右键 => 抬起
   * @return {
   *  win: false,
      mac: false,
      x11: false
   * @author: 池樱千幻
   */
export const systemClass = () => {
  let system = {
    win: false,
    mac: false,
    x11: false,
  };
  system.win = navigator.platform.indexOf('Win') == 0;
  system.mac = navigator.platform.indexOf('Mac') == 0;
  system.x11 = navigator.platform == 'X11' || navigator.platform.indexOf('Linux') == 0;
  return system;
};

/**
 * @description: 防抖
 * @param {*} func
 * @param {*} wait
 * @param {*} immediate
 * @return {*}
 * @author: 池樱千幻
 */
export function debounce(func: { apply: (arg0: any, arg1: IArguments) => any }, wait = 500, immediate?: any) {
  var timeout: any, result: any;
  function debounced(this: any) {
    var context = this,
      args = arguments;
    if (timeout) clearTimeout(timeout);
    if (immediate) {
      var callNow = !timeout;
      timeout = setTimeout(function () {
        result = func.apply(context, args);
      }, wait);
      if (callNow) result = func.apply(context, args);
    } else {
      timeout = setTimeout(function () {
        result = func.apply(context, args);
      }, wait);
    }
    return result;
  }
  debounced.cancel = function () {
    clearTimeout(timeout);
    timeout = undefined;
  };
  return debounced;
}

/**
 * @description: 根据传入的file, 解析gltf,并输出
 * @param {*} file
 * @return {*}
 * @author: 池樱千幻
 */
export const loadGLTFFile = (file: string) => {
  if (typeof file !== 'string') {
    //文件流,需要解析
    file = URL.createObjectURL(file);
  }
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      // resource URL
      file,
      // called when the resource is loaded
      function (gltf) {
        resolve(gltf);
      },
      // called while loading is progressing
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      // called when loading has errors
      function (error) {
        reject(error);
      }
    );
  });
};

/**
 * @description: 根据gltf的扩展信息,加载灯光信息
 * @param {*} gltf
 * @return {*}
 * @author: 池樱千幻
 */
export const createLightByGLTF = (gltf: { parser: { json: { extensions: { KHR_lights_punctual: { lights: any } } } } }) => {
  let lights = gltf?.parser?.json?.extensions?.KHR_lights_punctual?.lights;
  const groupLight: THREE.Group[] = [];
  const helperList: THREE.SpotLightHelper[] = [];
  if (lights) {
    const spotLight = new THREE.SpotLight(0xffffff);
    lights.forEach((info: { color: THREE.ColorRepresentation | undefined; position: THREE.Vector3; angle: number; castShadow: boolean; intensity: number; penumbra: number; target: THREE.Vector3 }, index: any) => {
      const group = new THREE.Group();

      group.userData.type = 'lightGroup';
      let tp_spotLight = spotLight.clone();
      tp_spotLight.name = `light_${index}`;
      tp_spotLight.color.copy(new THREE.Color(info.color));
      let pos = new THREE.Vector3();
      pos.add(info.position);
      tp_spotLight.position.copy(pos);
      tp_spotLight.shadow.mapSize.width = 1024;
      tp_spotLight.shadow.mapSize.height = 1024;
      tp_spotLight.shadow.bias = -0.0006;

      tp_spotLight.angle = info.angle;
      tp_spotLight.castShadow = info.castShadow;
      tp_spotLight.intensity = info.intensity;
      tp_spotLight.penumbra = info.penumbra;
      tp_spotLight.position.copy(pos);

      let target = new THREE.Vector3();
      target.add(info.target);
      const targetObject = new THREE.Object3D();
      targetObject.name = `target_${tp_spotLight.name}`;
      targetObject.position.copy(target);
      tp_spotLight.target = targetObject;

      const spotLightHelper = new THREE.SpotLightHelper(tp_spotLight);
      spotLightHelper.name = `helper_${tp_spotLight.name}`;
      spotLightHelper.userData.type = 'spotLightHelper';
      spotLightHelper.userData.lightGroup = group;

      group.userData.helper = spotLightHelper;
      helperList.push(spotLightHelper);

      group.add(tp_spotLight);
      group.add(targetObject);
      groupLight.push(group);
    });
  }
  return { groupLight, helperList };
};

/**
 * @description: 根据传入的相机对象,获取当前相机的位置和看向的目标位置
 * @param {*} camera
 * @return {*}
 * @author: 池樱千幻
 */
export const getCameraPosAndTargetByCamera = (camera: { position: any; quaternion: any }) => {
  var cameraPosition = camera.position;
  var cameraQuaternion = camera.quaternion;
  // 假设你已经将相机的位置和四元数角度赋值给cameraPosition和cameraQuaternion对象

  var cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(cameraQuaternion);

  cameraDirection.multiplyScalar(3);

  var target = new THREE.Vector3().addVectors(cameraPosition, cameraDirection);

  return {
    position: cameraPosition.clone(),
    target,
  };
};

/**
 * @description: 递归销毁模型
 * @param {*} parent
 * @param {*} child
 * @return {*}
 * @author: 池樱千幻
 */
export const removeModel = (parent: THREE.Object3D<THREE.Event> | null, child: THREE.Object3D<THREE.Event>) => {
  if (child.children.length) {
    let arr = child.children.filter((x) => x);
    arr.forEach((a) => {
      removeModel(child, a);
    });
  }
  if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
    if (child.material.map) child.material.map.dispose();
    child.material.dispose();
    child.geometry.dispose();
    if (child.material) child.material.dispose();
  }
  child.remove();
  if (parent) {
    parent.remove(child);
  }
};

//
/**
 * @description: 使用队列,延迟加载模型
 * @param {THREE} object 要拆分的模型对象
 * @param {THREE} model 要添加到的模型对象
 * @param {function} cb 循环的过程中要执行的函数
 * @param {*} time 每次的加载时间 默认为50ms
 * @param {*} limit 队列每次执行的个数 默认为2
 * @return {*} Promise
 * @author: 池樱千幻
 */
export const promiseQueueByObject = (object: THREE.Object3D<THREE.Event>, model: THREE.Object3D<THREE.Event>, cb: (arg0: any) => any, time = 50, limit = 2) => {
  let loadPromiseList = object?.children?.map((item: any) => {
    return (): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          cb && cb(item);
          model?.add(item);
          resolve();
        }, time);
      });
    };
  });
  return promiseQueue(loadPromiseList, limit);
};

/**
 * @description: 初始化模型的配置属性
 * @param {any} model
 * @return {*}
 * @author: 池樱千幻
 */
export const initModelAttr = (model: any) => {
  model.traverse((it: { isMesh: any; material: { clone: () => any; color: { clone: () => any }; opacity: number; transparent: boolean; originTransparent: any; originOpacity: any; needsUpdate: boolean }; originColor: any; castShadow: boolean; receiveShadow: boolean; renderOrder: number; originMaterial: any }) => {
    if (it.isMesh) {
      // 克隆材质
      it.material = it.material.clone();
      // 记录原始颜色
      it.originColor = it.material.color.clone();
      it.castShadow = true;
      it.receiveShadow = true;
      // 解决透明元素渲染层级的问题
      if (it.material.opacity < 1) {
        it.renderOrder = 2;
      } else {
        it.renderOrder = 1;
      }
      const materials = Array.isArray(it.material) ? it.material : [it.material];
      materials.forEach((mat: { map: { encoding: THREE.TextureEncoding }; metalnessMap: { encoding: THREE.TextureEncoding }; roughnessMap: { encoding: THREE.TextureEncoding } }) => {
        if (mat.map) {
          mat.map.encoding = THREE.sRGBEncoding;
        }
        if (mat.metalnessMap) {
          mat.metalnessMap.encoding = THREE.sRGBEncoding;
        }
        if (mat.roughnessMap) {
          mat.roughnessMap.encoding = THREE.sRGBEncoding;
        }
      });
    }
    if (it.material) {
      it.material.transparent = true;
      it.material.originTransparent = it.material.transparent;
      it.material.originOpacity = it.material.opacity;
      it.material.needsUpdate = true;
      it.material.opacity = it.material.originOpacity;
      it.originMaterial = it.material;
    }
  });
};

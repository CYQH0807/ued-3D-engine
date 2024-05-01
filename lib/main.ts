/*
 * @Description: UED三维引擎总入口,为了方便使用,将所有的类都挂载到这个类上.
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-03-15 13:16:50
 * @LastEditTime: 2024-05-01 17:48:13
 */
import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Main from './Main/Main';
import Sub from './Sub/Main';
import EventEmitter from './Utils/EventEmitter';
import { tween, createLightByGLTF, loadGLTFFile } from './Utils';
import OrbitControls from './Main/OrbitControls';
import TweakPane from './Tweak';
import { luminescenceMaterial, gradientTransparentMaterial, coffeeSteam, getMirror, gradualChangeMaterial } from './AssetLibrary';
import request from './Utils/request';
import { EngineOption } from './tools';

// import LoadModelWorker from './worker/loadModel.worker.ts?worker';
// let loadModelWorker = new LoadModelWorker();
// import { parseModel } from './Utils/worker';

// import { SetConfig } from './config';
/**
 * @description: 三维引擎的入口
 * @return {*} 返回UED3DEngine的单例.
 * @author: 池樱千幻
 */
class UED3DEngine extends EventEmitter {
  // 单例
  static instance: UED3DEngine | null;
  /**
   * @description: 主场景dom元素
   * @return {*}
   * @author: 池樱千幻
   */
  _container: HTMLElement | null | undefined;
  /**
   * @description: 是否调试模式
   * @return {*}
   * @author: 池樱千幻
   */
  isDebug: boolean | undefined;

  /**
   * @description: 外部传递的配置对象
   * @return {*}
   * @author: 池樱千幻
   */
  config: any;

  /**
   * @description: 外部传递的资源对象
   * @return {*}
   * @author: 池樱千幻
   */
  assets: any;

  /**
   * @description: 小地图
   * @return {*}
   * @author: 池樱千幻
   */
  miniMap: Sub;
  /**
   * @description: 资产库
   * @return {*}
   * @author: 池樱千幻
   */
  AssetLibrary: { luminescenceMaterial: any; gradientTransparentMaterial: any; coffeeSteam: any; getMirror: any; gradualChangeMaterial: any };

  /**
   * @description: 主场景对象
   * @return {*}
   * @author: 池樱千幻
   */
  main: Main;

  /**
   * @description: 控制器
   * @return {*}
   * @author: 池樱千幻
   */
  _orbitControls: OrbitControls | null;
  [key: string]: any;

  /**
   * @description: 三维引擎的构造函数
   * @param {EngineOption} options
   * @return {*}
   * @author: 池樱千幻
   */
  constructor(options?: EngineOption) {
    super();
    // 如果当前实例存在,则直接返回
    if (UED3DEngine.instance) {
      return UED3DEngine.instance;
    }
    UED3DEngine.instance = this;

    this._container = options?.targetElement;
    this.isDebug = options?.isDebug;

    if (!this._container) {
      console.error('缺少 targetElement 属性');
      return;
    }
    // 导入配置与资源
    this.assets = options?.assets;
    if (!this.assets) {
      console.error('缺少 assets 资源信息');
      return;
    }
    this.AssetLibrary = { luminescenceMaterial, gradientTransparentMaterial, coffeeSteam, getMirror, gradualChangeMaterial };

    // config配置信息从请求中获取
    options?.isQueryConfig && request
      .post('/api/getConfig')
      .then((data) => {
        this.config = data;
        this.init(options);
      })
      .catch(() => {
        console.error('配置文件请求失败!,采用本地文件');
        this.config = options?.config;
        this.init(options);
      });
  }

  /**
   * @description: 场景初始化
   * @param {EngineOption} options
   * @return {*}
   * @author: 池樱千幻
   */
  private init(options: EngineOption | undefined) {
    // 初始化主场景
    this.main = new Main({
      targetElement: this._container,
      configKey: options?.configKey || '',
      type: 'main',
      isDebug: this.isDebug || false,
    });
    // 这个函数需要先监听,才能率先执行
    this.on('rendererSuccess', () => {
      // 主场景渲染完成,判断当前环境如果是开发环境,则初始化调试面板
      if (import.meta.env.MODE === 'development') {
        // 在开发环境下执行的代码
        window.tweakPane = new TweakPane();
      } else {
        // 在生产环境,给window开放一个方法,通过调用该方法,实现开启或关闭调试面板
        window.toggleDebug = () => {
          if (window.tweakPane) {
            console.log('关闭调试面板');
            window.tweakPane.destroy();
            window.tweakPane = null;
          } else {
            console.log('开启调试面板');
            window.tweakPane = new TweakPane();
          }
          return this;
        };
      }
    });

    // 将主场景的属性挂载到UED3DEngine上,用于兼容旧版本
    this._scene = this.main._scene;
    this._renderer = this.main._renderer;
    this._camera = this.main._camera;
    this._orbitControls = this.main._orbitControls;
    this.transformControls = this.main.helper?.transformControls;
    this.sceneHelpers = this.main.helper?.sceneHelpers;
    this.animations = this.main.resources.gltfAnimations;

    this.miniMapElement = options?.miniTargetElement;
    // 如果有,就初始化副场景,一般用于小地图
    if (options?.miniTargetElement && options?.miniMapConfigKey) {
      this.miniMap = new Sub({
        targetElement: options.miniTargetElement,
        configKey: options?.miniMapConfigKey,
        type: 'miniMap',
        isDebug: this.isDebug || false,
      });
    }

    // loadModelWorker.onmessage = async ({ data }) => {
    //   console.log('主线程data: ', data);

    //   const { work_type, json } = data;

    //   if (work_type === 'parseModel') {
    //     console.log(' work_type, json: ', work_type, json);
    //     //     console.timeEnd('worker');
    //     //   }
    //     json.animations?.forEach((animation: THREE.AnimationClip) => {
    //       animation.tracks.forEach((track: any) => {
    //         track.interpolation = THREE.InterpolateDiscrete;
    //       });
    //     });
    //     const root = await new THREE.ObjectLoader().parseAsync(json);
    //     console.log('root: ', root);
    //     this.main._scene.add(root);
    // console.log('jsonScene: ', jsonScene);
    // const loader = new THREE.ObjectLoader();
    // const myObject = loader.parse(jsonScene);
    // console.log('myObject: ', myObject);
    // const scene = new THREE.Object3D().copy(THREE.Object3D.parse(jsonScene));
    // const mesh = parseModel(data);
    // console.log('mesh: ', JSON.stringify(mesh));
    // let aa = mesh.toJSON();
    // console.log('aa: ', aa);
    // this.main._scene.add(mesh);
    // setTimeout(() => {
    //   debugger
    // }, 10000);
    //   }
    // };

    // loadModelWorker.onerror = (err) => {
    //   console.error('work出错：', err, err.message);
    // };
    // loadModelWorker.postMessage({ work_type: 'start' });
    // console.time('worker');
    // loadModelWorker.postMessage({ work_type: 'modelParse', name: 'D12345GC.gltf' });

    // loadModelWorker.postMessage({ work_type: 'modelParse', url: '/webgl/model/minMap/xiaoditu.gltf' });

    // loadModelWorker.postMessage({ work_type: 'modelParse', url: '/webgl/model/ttttt/test.glb' });
  }

  /**
   * @description: 获取当前模型
   * @return {*}
   * @author: 池樱千幻
   */
  getCurrentModel() {
    return this.main.resources.getCurrentModel();
  }

  /**
   * @description: 模型资源是否正在加载
   * @return {*}
   * @author: 池樱千幻
   */
  get modelLoading() {
    return this.main.resources.isLoading;
  }

  // 切换模型
  async toggleModel(configKey: string) {
    // 判断当前是否正在加载模型,如果是,就先取消
    // if (this.main.resources.isLoading) {
    //   return Promise.reject();
    // } else {
    this.main._orbitControls.enabled = false;
    this.main.configKey = configKey;
    // 重新设置主场景的配置文件
    this.main.setConfig(configKey);
    this.main.event.unbindTargetElementEvent();
    this.off('rendererSuccess');
    this.off('rendererOtherSuccess');
    // 是否加载过当前的场景
    let isCreatedScene = await this.main.Scene.setViewportScene();

    // 重新加载配置
    await this.main.resources.initModelByAssets(this.assets[configKey], configKey, !isCreatedScene);
    this.main._orbitControls.enabled = true;
    // this.trigger('rendererSuccess', null);
    this.trigger('rendererSuccess_miniMap', null);

    this.main.event.bindTargetElementEvent();
    // 如果有工具面板,就重新加载
    if (window.tweakPane) {
      let json = this.main.config;
      window.tweakPane.reload(json);
    }
    return Promise.resolve();
    // }
  }

  /**
   * @description: 删除一个css3d对象
   * @param {CSS3DObject} mesh
   * @return {*}
   * @author: 池樱千幻
   */
  removeMesh(mesh: CSS3DObject | null) {
    if (mesh) {
      const parent = mesh.parent;
      if (parent !== null) {
        parent.remove(mesh); // 从父容器中删除
      }
      const scene = mesh.element.parentNode;
      if (scene !== null) {
        scene.removeChild(mesh.element);
      }
      mesh = null;
    }
  }

  /**
   * @description: 根据模型的位置,移动相机,并看向模型的中心点.
   * @param {THREE} model
   * @param {THREE} cameraPosition
   * @return {*}
   * @author: 池樱千幻
   */
  moveCameraByModelLookAtCenter(model: THREE.Object3D<Event>, cameraPosition: THREE.Vector3) {
    if (!model) {
      return;
    }
    // 获取模型中心点
    model.updateMatrixWorld();
    var boundingBox = new THREE.Box3().setFromObject(model);
    var modelSizeVec3 = new THREE.Vector3();
    boundingBox.getSize(modelSizeVec3);
    var modelCenter = new THREE.Vector3();
    boundingBox.getCenter(modelCenter);
    if (!cameraPosition) {
      cameraPosition = modelCenter.clone();
      cameraPosition.y += 50;
      cameraPosition.z += 50;
    }
    this.cameraAnimation(cameraPosition, modelCenter);
  }

  /**
   * @description: 根据文件加载聚光灯
   * @param {*} file
   * @return {*}
   * @author: 池樱千幻
   */
  async loadSpotLightByGLTF(file: string) {
    let gltf: any = await loadGLTFFile(file);
    return createLightByGLTF(gltf);
  }

  /**
   * @description: 将控制器的聚焦方法暴露出来
   * @param {any} target
   * @return {*}
   * @author: 池樱千幻
   */
  focus(target: THREE.Object3D<THREE.Event>) {
    target && this._orbitControls?.focus(target);
  }

  /**
   * @description: 相机动画
   * @param {*} pos 要移动到的位置
   * @param {*} cameraLookAt 相机要看向的位置
   * @param {*} time 时间
   * @return {*}
   * @author: 池樱千幻
   */
  cameraAnimation(pos: THREE.Vector3, cameraLookAt: THREE.Vector3, time = 1000) {
    if (!pos.isVector3) {
      pos = new THREE.Vector3().add(pos);
    }
    if (!cameraLookAt.isVector3) {
      cameraLookAt = new THREE.Vector3().add(cameraLookAt);
    }

    return this.objectAnimation(pos, this._camera.position, time, () => {
      this._camera.updateMatrixWorld();
      this._camera.lookAt(cameraLookAt);
      if (this._orbitControls) {
        this._orbitControls.target = cameraLookAt;
      }
    });
  }

  /**
   * @description: 任意物体动画
   * @param {*}  to 动画结束时的属性
   * @param {*} object 需要动画的对象
   * @param {*} time 时间
   * @param {*} update
   * @return {*}
   * @author: 池樱千幻
   */
  objectAnimation(to: THREE.Vector3, object: any, time = 1000, update = () => { }) {
    return tween(to, object, time, update);
  }

  /**
   * @description: 根据名称/函数条件查找当前模型中的动画.如果name是一个函数,就是数组filter的函数判断,item参数就是每一个动画对象.可以自定义查找条件
   * @param {*} name string / function
   * @return {*}
   * @author: 池樱千幻
   */
  getAnimationByName(name: (item: any) => boolean) {
    let filter = (item: any) => {
      return item.name === name;
    };
    if (typeof name !== 'string') {
      filter = name;
    }
    let list = this.main.resources.Animation.animationsList.filter((item) => filter(item));
    return list.length === 1 ? list[0] : list;
  }

  /**
   * @description: 清理
   * @return {*}
   * @author: 池樱千幻
   */
  cleanup() {
    this.main?.destroy();
    this.miniMap?.destroy();
    UED3DEngine.instance = null;
  }
  destroy() {
    this.cleanup();
  }

  /**
   * @description: 窗口重置
   * @return {*}
   * @author: 池樱千幻
   */
  resize() {
    this.main.event._onWindowResize();
  }
}

export default UED3DEngine;

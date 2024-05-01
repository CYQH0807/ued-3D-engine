/*
 * @Description:  加载资源
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-15 11:25:23
 * @LastEditTime: 2023-05-11 11:24:48
 */
import commonClass from './commonClass';
import webglModelCache from '../ModelCache';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Animation from './Animation';
import { removeModel, promiseQueueByObject, initModelAttr } from '../Utils';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'; //rebe加载器

import UED3DEngine from '../main';

export default class Resources extends commonClass {
  WebglModelCache: any;
  model: THREE.Object3D<THREE.Event>;
  gltfAnimations: any[];
  Animation: Animation;
  // 当前是否正在加载
  isLoading: boolean;
  //聚光灯对象
  spotLightObject: THREE.Group;
  // 聚光灯辅助对象
  spotLightHelper: THREE.Group;
  // 当前加载的configKey
  curConfigKey: string;
  HDRResource: any[] = [];
  // 当前key对应的模型,用于外部调用
  // currentModel: THREE.Object3D<THREE.Event>;

  constructor() {
    super();
    this.baseExperience = new UED3DEngine();
    // 初始化模型缓存
    if (!this.WebglModelCache) {
      this.WebglModelCache = new webglModelCache({
        THREE,
        GLTFLoader,
      });
    }
    this.curConfigKey = this.experience.configKey;
    // 当前key对应的资源列表
    let _assetsList = this.baseExperience.assets[this.curConfigKey];
    this.initModelByAssets(_assetsList, this.experience.configKey);
  }

  // 根据configKey获取对应的场景
  getSceneByKey(configKey: string) {
    return this.experience.Scene.getSceneByKey(configKey);
  }

  /**
   * @description: 根据资源列表加载模型
   * @param {any} list 资源列表
   * @param {string} configKey 当前key
   * @param {boolean} isLoaded 是否已经加载过了
   * @return {*}
   * @author: 池樱千幻
   */
  async initModelByAssets(list: any[], configKey: string, isLoaded: boolean = false) {
    this.isLoading = true;
    //清空动画列表
    this.gltfAnimations = [];
    // 加载HDR
    await this.loadHDR(list);
    // 加载灯光
    this.loadLight(list);
    // 如果有动画,就销毁
    this.Animation && this.Animation.destroy();
    // 根据configKey,从场景池中获取场景
    let scene = this.getSceneByKey(configKey);

    if (scene === undefined) {
      console.error(`场景池中没有找到场景: ${configKey}`);
      return;
    }
    // 如果已经加载过了,就不需要再次加载,只执行一部分重置的操作
    if (isLoaded) {
      // 从场景中获取模型
      this.model = scene.getObjectByName('webglModel') || new THREE.Group();
      // 获取动画列表
      this.gltfAnimations = scene.userData.gltfAnimations;
      // 重新设置动画
      this.setAnimation();
      // 触发加载成功事件
      this.trigger('resourcesLoadSuccess', [{ isLoad: true, configKey }]);

      this.isLoading = false;
    } else {
      // 如果没有加载过,先创建一个group
      this.model = new THREE.Group();
      this.model.name = 'webglModel';
      // 过滤需要加载的模型
      let modelList = list.filter((item: { type: string }) => item.type == 'model');
      // 拿到资源列表中,不隐藏的模型,率先加载
      let fristLoadList = modelList.filter((item) => !item.hidden);
      try {
        // 使用WebglModelCache加载gltf文件
        let gltfModelList = await Promise.all(fristLoadList.map((item: { name: any; source: any; password: any }) => this.loadModel(item.name, item.source, item.password)));
        // 为了防止当前传入key和当前key不同的情况,即:在加载某
        if (configKey === this.experience.configKey) {
          // 加载成功
          gltfModelList.forEach((item: any) => {
            if (item.animations.length > 0) {
              this.gltfAnimations.push(...item.animations);
            }
            this.model.add(item.model);
          });
          //  将当前动画数据记录在userData中,以便于还原模型的时候可以执行
          scene.userData.gltfAnimations = this.gltfAnimations;
          // this.model.add(subGroup);
          this.curConfigKey = configKey;
          this.setAnimation();
          //资源加载成功,触发自定义事件
          this.trigger('resourcesLoadSuccess', [{ configKey }]);
        } else {
          // 销毁场景
          this.experience.Scene.destroySceneByKey(configKey);
        }
      } catch (error) {
        this.loadError(error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  /**
   * @description: 获取当前配置所指向的模型对象
   * @return {*}
   * @author: 池樱千幻
   */
  getCurrentModel() {
    return this.model.getObjectByName('mainModel');
  }

  /**
   * @description:
   * @return {*}
   * @author: 池樱千幻
   */
  /**
   * @description: 根据其他模型列表,加载其他模型资源,但是初始化是隐藏的
   * @param {String} configKey 根据这个key 将其他物体添加到对应key的场景中
   * @return {*}
   * @author: 池樱千幻
   */
  loadOtherModel(configKey: string) {
    // // 当前key对应的资源列表
    let _assetsList = this.baseExperience.assets[this.curConfigKey];
    let otherLoadList = _assetsList.filter((item: { type: string; hidden: any }) => item.type == 'model' && item.hidden);
    let currKey_Scene = this.experience.Scene.getSceneByKey(configKey);
    if (!currKey_Scene) {
      return;
    }

    Promise.all(otherLoadList.map((item: { name: any; source: any; password: any; isMerge: any }) => this.loadModel(item.name, item.source, item.password, item.isMerge)))
      .then((modelList) => {
        let mainModel = currKey_Scene?.getObjectByName('mainModel');
        // 从Object对象中拆分的所有物体,需要使用异步函数添加到场景或者其他对象中
        let list: any[] = [];
        // 加载成功
        modelList.forEach((item: any) => {
          // 如果有其他模型,添加一个空对象,用于校验是否加载过
          let otherGroup = new THREE.Group();
          otherGroup.name = item.name;
          mainModel &&
            list.push(
              promiseQueueByObject(item.model, mainModel, (item) => {
                item.visible = false;
              })
            );
        });
        Promise.all(list).then(() => {
          this.baseExperience.trigger('rendererOtherSuccess', null);
        });
      })
      .catch(this.loadError);
  }

  /**
   * @description: 根据资源列表加载灯光属性
   * @param {*} assetsList
   * @return {*}
   * @author: 池樱千幻
   */
  loadLight(assetsList: any[]) {
    // 加载聚光灯之前先尝试删除和销毁
    if (this.spotLightObject) {
      removeModel(this._scene, this.spotLightObject);
    }
    let lightList = assetsList.filter((item: { type: string }) => item.type == 'light');
    Promise.all(lightList.map((item: { source: any }) => this.baseExperience.loadSpotLightByGLTF(item.source))).then((list) => {
      this.spotLightObject = new THREE.Group();
      this.spotLightObject.name = 'spotLightObject';
      this.spotLightHelper = new THREE.Group();
      this.spotLightHelper.name = 'spotLightHelper';

      list.forEach((item) => {
        this.spotLightObject.add(...item.groupLight);
        this.spotLightHelper.add(...item.helperList);
      });
      this._scene.add(this.spotLightObject);
      this.experience.helper.sceneHelpers.add(this.spotLightHelper);
    });
  }

  // 根据资源列表,加载HDR
  async loadHDR(assetsList: any[]) {
    // 先销毁原本的贴图
    this.HDRResource.forEach((item) => {
      item.envMap.dispose();
    });
    this.HDRResource = [];
    let HDRList = assetsList.filter((item: { type: string }) => item.type == 'HDR');
    if (HDRList.length > 0) {
      for (let i = 0; i < HDRList.length; i++) {
        const hdrLoader = new RGBELoader();
        const envMap = await hdrLoader.loadAsync(HDRList[i].source);
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        this.HDRResource.push({ envMap, ...HDRList[i] });
      }
    }
  }

  loadError(error: any) {
    console.log('error: ', error);
  }

  setAnimation() {
    this.Animation = new Animation(this.model);
  }

  /**
   * @description: 根据url与密码加载模型
   * @param {*} name
   * @param {*} url
   * @param {*} pwd
   * @return {*}
   * @author: 池樱千幻
   */
  loadModel(name: any, url: any, pwd: any, isMerge: boolean = false) {
    return new Promise((resolve) => {
      this.WebglModelCache.loadModel(url, pwd, () => {}).then((gltf: any) => {
        let { model, animations } = this.analysisGltf(gltf, name);
        resolve({ model, name, isMerge, animations });
      });
    });
  }
  // this.gltfAnimations.push(...gltf.animations);
  /**
   * @description: 根据GLTFLoader,解析出来的gltf,加载动画,并处理材质,颜色等
   * @param {*} gltf
   * @return {*}
   * @author: 池樱千幻
   */
  analysisGltf(gltf: { scene: any; animations: any }, name: any) {
    let model = gltf.scene;
    let animations = gltf.animations;
    model.name = name;
    initModelAttr(model);
    return { model, animations };
  }
}

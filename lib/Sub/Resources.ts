/*
 * @Description:  加载资源
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-15 11:25:23
 * @LastEditTime: 2023-03-23 12:19:08
 */
import commonClass from './commonClass';
import webglModelCache from '../ModelCache';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Animation from './Animation';

import UED3DEngine from '../main';

export default class Resources extends commonClass {
  WebglModelCache: any;
  model: THREE.Group;
  gltfAnimations: any[];
  Animation: Animation;
  //聚光灯对象
  spotLightObject: THREE.Group;
  // 聚光灯辅助对象
  spotLightHelper: THREE.Group;
  constructor(_assetsList: any[]) {
    super();
    if (!_assetsList) {
      console.error('资源列表不能为空 !!');
      return;
    }
    this.baseExperience = new UED3DEngine();

    // 初始化模型缓存
    this.WebglModelCache = new webglModelCache({
      THREE,
      GLTFLoader,
    });
    this.model = new THREE.Group();
    this.model.name = 'webglModel';
    this.gltfAnimations = [];
    let modelList = _assetsList.filter((item: { type: string }) => item.type == 'model');
    Promise.all(modelList.map((item: { name: any; source: any; password: any }) => this.loadModel(item.name, item.source, item.password)))
      .then((modelList) => {
        // 加载成功
        modelList.forEach((item: any) => {
          this.model.add(item.model);
        });
        this.setAnimation();
        //资源加载成功,触发自定义事件
        this.trigger('resourcesLoadSuccess', null);
      })
      .catch(this.loadError);
    this.loadLight(_assetsList);
  }

  /**
   * @description: 根据资源列表加载灯光属性
   * @param {*} assetsList
   * @return {*}
   * @author: 池樱千幻
   */
  loadLight(assetsList: any[]) {
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
      this._scene?.add(this.spotLightObject);
      this.experience.helper.sceneHelpers.add(this.spotLightHelper);
    });
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
  loadModel(name: any, url: any, pwd: any) {
    return new Promise((resolve) => {
      this.WebglModelCache.loadModel(url, pwd, () => {}).then((gltf: any) => {
        let model = this.analysisGltf(gltf, name);
        resolve({ model, name });
      });
    });
  }

  /**
   * @description: 根据GLTFLoader,解析出来的gltf,加载动画,并处理材质,颜色等
   * @param {*} gltf
   * @return {*}
   * @author: 池樱千幻
   */
  analysisGltf(gltf: { scene: any; animations: any }, name: any) {
    let model = gltf.scene;
    this.gltfAnimations.push(...gltf.animations);
    model.name = name;
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
    return model;
  }
}

/*
 * @Description: 世界负责组装模型,加载到场景里
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-16 09:29:14
 * @LastEditTime: 2023-08-16 12:15:34
 */
import commonClass from './commonClass';
import { SetConfig } from '../config';
import UED3DEngine from '../main';
import Cruise from './Cruise';
import * as THREE from 'three';
import Resources from './Resources';

import { removeModel, promiseQueueByObject, initModelAttr } from '../Utils';
export default class World extends commonClass {
  baseExperience: UED3DEngine;
  resources: Resources;
  Cruise: any;
  toolsModel: any;
  constructor() {
    super();
    this.baseExperience = new UED3DEngine();
    this.resources = this.experience.resources;
    this.resources.on('resourcesLoadSuccess', (param: any) => this.resourcesLoadSuccess(param));
  }

  async resourcesLoadSuccess(param: any) {
    let setConfig = new SetConfig(this.experience.type);
    this.initToolsModel();
    this.experience.isRender = true;

    if (param && param.isLoad) {
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          setConfig.setAnimation();
          this.baseExperience.trigger('rendererSuccess', null);
          resolve();
        }, 200)
      );
      return;
    } else {
      await this.taskLoad(param.configKey);
    }
    setConfig.setAnimation();
    this.Cruise = new Cruise();
    this.baseExperience.trigger('rendererSuccess', null);
    this.resources.loadOtherModel(this.experience.configKey);
    //完成之后启用控制器
    this._orbitControls.enabled = true;
  }

  // 根据configKey获取对应的场景
  getSceneByKey(configKey: string) {
    return this.experience.Scene.getSceneByKey(configKey);
  }
  /**
   * @description: 模型分步加载
   * @return {*}
   * @author: 池樱千幻
   */
  async taskLoad(configKey: string) {
    let mainModel = this.resources.model.getObjectByName('mainModel');
    // 如果有mainModel 就开始分步加载
    if (mainModel && this.config.stepLoading) {
      // 先克隆数据,然后将原数据清空,并把原来的结构加载到场景里
      let mainModelClone = mainModel.clone();
      // 清空原数据
      removeModel(null, mainModel);
      let webglModel = this.getSceneByKey(configKey)?.getObjectByName('webglModel');
      // 将原来的结构加载到场景里
      if (!webglModel) {
        this.getSceneByKey(configKey)?.add(this.resources.model);
      }
      initModelAttr(mainModelClone);
      // 将克隆的数据加载到场景里
      await promiseQueueByObject(mainModelClone, mainModel, () => {}, 100, 3);
    } else {
      await this.directLoad(configKey);
    }
  }

  /**
   * @description: 直接加载
   * @return {*}
   * @author: 池樱千幻
   */
  directLoad(configKey: string) {
    return new Promise((resolve) => {
      this.getSceneByKey(configKey)?.add(this.resources.model);
      // 如果没有mainModel 就直接加载
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  /**
   * @description: 初始化工具模型
   * @return {*}
   * @author: 池樱千幻
   */
  initToolsModel() {
    this.toolsModel = this.resources.model.getObjectByName('toolsModel');

    if (this.toolsModel) {
      // 工具模型都放到最后一个层里
      this.toolsModel.traverse((item: { isMesh: any; layers: { set: (arg0: number) => any } }) => {
        item.isMesh && item.layers.set(31);
      });

      let enclosingSphere = this.toolsModel.getObjectByName('enclosingSphere');
      enclosingSphere.material.side = THREE.BackSide;
      // 计算整体模型的半径
      let radius = this.getModelRadius(this.resources.model);
      enclosingSphere.scale.set(radius, radius, radius);
    }
  }

  /**
   * @description: 获取模型包裹的球半径
   * @param {*} model
   * @return {*}
   * @author: 池樱千幻
   */
  getModelRadius(model: THREE.Group | THREE.Object3D<THREE.Event>): any {
    if (model) {
      var sphere = new THREE.Sphere();
      const box = new THREE.Box3();
      box.setFromObject(model);
      return box.getBoundingSphere(sphere).radius;
    }
  }
}

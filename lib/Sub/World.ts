/*
 * @Description: 世界负责组装模型,加载到场景里
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-16 09:29:14
 * @LastEditTime: 2023-03-16 16:38:52
 */
import commonClass from './commonClass';
import { SetConfig } from '../config';
import UED3DEngine  from '../main';
import Cruise from "./Cruise";
import * as THREE from 'three';
import Resources from './Resources';
export default class World extends commonClass {
  baseExperience: UED3DEngine;
  resources: Resources;
  Cruise: any;
  toolsModel: any;
  constructor() {
    super();
    this.baseExperience = new UED3DEngine();

    this.resources = this.experience.resources;
    this.resources.on('resourcesLoadSuccess', () => this.resourcesLoadSuccess());
  }

  resourcesLoadSuccess() {
    setTimeout(() => {
      this.experience.isRender = true;

      this.Cruise = new Cruise();

      this.baseExperience.trigger('rendererSuccess_miniMap', null);
      this.baseExperience.trigger('rendererSuccess_sub', null);
    }, 500);
    new SetConfig(this.experience.type);
    console.log(this.resources.model);
    this.initToolsModel();

    this._scene?.add(this.resources.model);
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
      this.toolsModel.traverse((item: { isMesh: any; layers: { set: (arg0: number) => any; }; }) => {
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

import * as THREE from 'three';
import { removeModel } from '../Utils';
import commonClass from './commonClass';

/*
 * @Description: 场景类, 用于创建并缓存多个创建,用于切换.
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-05-09 13:58:28
 * @LastEditTime: 2023-05-10 18:02:12
 */
export default class Scene extends commonClass {
  // 场景池,用于缓存创建的场景
  scenePool: THREE.Scene[] = [];

  // 当前渲染的场景
  viewportScene: THREE.Scene;
  constructor() {
    super();
    // 初始化当前渲染的场景,并将场景添加到场景池中.
    this.viewportScene = new THREE.Scene();
    this.viewportScene.userData.name = this.experience.configKey;
    this.scenePool.push(this.viewportScene);
  }

  /**
   * @description: 根据key切换场景,如果没有就创建一个新的场景. 如果创建了新场景,就返回true,如果没有就返回false
   * @return {*}
   * @author: 池樱千幻
   */
  async setViewportScene() {
    let scene = this.scenePool.find((item) => item.userData.name === this.experience.configKey);
    if (scene) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 300);
      });
      this.viewportScene = scene;
      return false;
    }
    scene = new THREE.Scene();
    scene.userData = {
      name: this.experience.configKey,
    };
    this.scenePool.push(scene);
    this.viewportScene = scene;
    return true;
  }

  // 根据key销毁场景池中的场景
  destroySceneByKey(key: string) {
    let index = this.scenePool.findIndex((item) => item.userData.name === key);
    if (index !== -1) {
      removeModel(null, this.scenePool[index]);
      this.scenePool[index].clear();
      this.scenePool.splice(index, 1);
    }
  }

  /**
   * @description: 根据key在场景池中查找场景,如果没有就返回null
   * @param {string} key
   * @return {*}
   * @author: 池樱千幻
   */
  getSceneByKey(key: string) {
    return this.scenePool.find((item) => item.userData.name === key);
  }

  destroyed() {
    // 循环销毁场景池中的场景
    this.scenePool.forEach((item) => {
      removeModel(null, item);
      item.clear();
    });
    this.scenePool = [];
  }
}

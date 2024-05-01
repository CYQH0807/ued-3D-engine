/*
 * @Description: 通用类,所有类都应该继承该类
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-15 10:58:49
 * @LastEditTime: 2023-03-16 15:54:38
 */

import Main from './Main';
import EventEmitter from '../Utils/EventEmitter';
import UED3DEngine  from '../main';
import OrbitControls from './OrbitControls';

export default class commonClass extends EventEmitter {
  experience: Main;
  _camera: THREE.PerspectiveCamera | null;
  _renderer: THREE.WebGLRenderer | null;
  _scene: THREE.Scene | null;
  _orbitControls: OrbitControls | null;
  config: any;
  isDebug: any;
  baseExperience: UED3DEngine;
  constructor() {
    super();
    this.experience = new Main();
    this._camera = this.experience._camera;
    this._renderer = this.experience._renderer;
    this._scene = this.experience._scene;
    this._orbitControls = this.experience._orbitControls;
    this.config = this.experience.config;
    this.isDebug = this.experience.isDebug;
  }

  /**
   * @description: 更新事件
   * @return {*}
   * @author: 池樱千幻
   */
  update() { }

  /**
   * @description: 销毁事件
   * @return {*}
   * @author: 池樱千幻
   */
  destroy() { }
}

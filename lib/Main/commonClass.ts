/*
 * @Description: 通用类,所有类都应该继承该类
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-15 10:58:49
 * @LastEditTime: 2024-05-01 17:24:08
 */

import Main from './Main';
import EventEmitter from '../Utils/EventEmitter';
import UED3DEngine from '../main';
import OrbitControls from './OrbitControls';

export default class commonClass extends EventEmitter {
  /**
   * @description: 主场景
   * @return {*}
   * @author: 池樱千幻
   */
  experience: Main;
  /**
   * @description: 当前相机
   * @return {*}
   * @author: 池樱千幻
   */
  _camera: THREE.PerspectiveCamera;
  /**
   * @description: 当前渲染器
   * @return {*}
   * @author: 池樱千幻
   */
  _renderer: THREE.WebGLRenderer;
  /**
   * @description: 当前控制器
   * @return {*}
   * @author: 池樱千幻
   */
  _orbitControls: OrbitControls;
  /**
   * @description: 配置文件
   * @return {*}
   * @author: 池樱千幻
   */
  config: any;
  isDebug: any;
  /**
   * @description: 单例对象
   * @return {*}
   * @author: 池樱千幻
   */
  baseExperience: UED3DEngine;
  constructor() {
    super();
    this.experience = new Main();
    this._camera = this.experience._camera;
    this._renderer = this.experience._renderer;
    this._orbitControls = this.experience._orbitControls;
    this.config = this.experience.config;
    this.isDebug = this.experience.isDebug;
  }

  get _scene() {
    return this.experience._scene;
  }

  /**
   * @description: 更新事件
   * @return {*}
   * @author: 池樱千幻
   */
  update() {}

  /**
   * @description: 销毁事件
   * @return {*}
   * @author: 池樱千幻
   */
  destroy() {}
}

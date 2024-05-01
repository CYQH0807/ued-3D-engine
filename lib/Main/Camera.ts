/*
 * @Description: 相机类,用于初始化相机,并切换巡游使用.
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-03-02 17:17:49
 * @LastEditTime: 2024-05-01 17:22:56
 */

import commonClass from './commonClass';
import UED3DEngine from '../main';
import * as THREE from 'three';

import { getCameraPosAndTargetByCamera } from '../Utils';

export default class Camera extends commonClass {
  baseExperience: UED3DEngine;
  /**
   * @description: 当前相机
   * @return {*}
   * @author: 池樱千幻
   */
  camera: THREE.PerspectiveCamera;
  /**
   * @description: 用于渲染的相机,以便后续切换使用.
   * @return {*}
   * @author: 池樱千幻
   */
  viewportCamera: THREE.PerspectiveCamera;
  constructor() {
    super();
    this.baseExperience = new UED3DEngine();
    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(this.config.cameraFov, this.config.width / this.config.height, 5, 1e10);

    this.camera.userData = {
      isSceneCamera: true,
    };
    // 并初始化一个用于渲染的相机,以便后续切换使用.
    this.viewportCamera = this.camera;
  }

  /**
   * @description: 切换相机
   * 根据目标相机的角度和位置,使用动画,移动主相机到目标相机的位置,然后切换相机
   * @param {*} camera
   * @return {*}
   * @author: 池樱千幻
   */
  async setViewportCamera(camera: THREE.PerspectiveCamera) {

    if (!this.baseExperience.main._orbitControls) {
      console.error('请先初始化相机控制器');
      return;
    }

    // 切换相机的时候,重新赋值一遍主相机的一些属性
    this.copyParamByMainCamera(camera);

    // 切换相机之后,禁用控制器
    this.baseExperience.main._orbitControls.enabled = false;

    // 目标相机的位置和计算过的target
    let { position, target } = getCameraPosAndTargetByCamera(camera);
    // 主相机的 位置和target
    let mainCameraPosition = this.camera.position;
    let mainCameraTarget = this.baseExperience.main._orbitControls.target;

    // 获取位置的距离差和目标的距离差
    let posD = position.distanceTo(mainCameraPosition);
    let tarD = target.distanceTo(mainCameraTarget);

    let time = 1000;
    // 如果差值小于0.5,认为没有移动.不进行相机动画.
    if (Math.abs(posD) < 0.5 && Math.abs(tarD) < 0.5) {
      time = 0;
    }
    await this.baseExperience.cameraAnimation(position, target, time);
    this.viewportCamera = camera;
  }

  /**
   * @description: 返回原始相机
   * @return {*}
   * @author: 池樱千幻
   */
  resetViewportCamera() {
    if (!this.baseExperience.main._orbitControls) {
      console.error('请先初始化相机控制器');
      return;
    }
    this.baseExperience.main._orbitControls.enabled = true;
    this.viewportCamera = this.camera;
  }

  /**
   * @description: 将主相机的一些属性赋值给动画相机.
   * @param {*} camera
   * @return {*}
   * @author: 池樱千幻
   */
  copyParamByMainCamera(camera: THREE.PerspectiveCamera) {
    camera.fov = this.camera.fov;
    camera.aspect = this.camera.aspect;
    camera.far = this.camera.far;
    camera.near = this.camera.near;
    camera.updateProjectionMatrix();
  }
}

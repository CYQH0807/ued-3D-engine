/*
 * @Description: 巡游类,根据gltf中的动画,挑选中巡游信息
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-03-03 15:30:40
 * @LastEditTime: 2023-04-24 14:54:03
 */

import commonClass from './commonClass';
import UED3DEngine from '../main';
import { getCameraPosAndTargetByCamera } from '../Utils';

import * as THREE from 'three';
import Resources from './Resources';

export default class Cruise extends commonClass {
  baseExperience: UED3DEngine;
  Camera: any;
  resources: Resources;
  _resetAnimation: () => void;
  curCruiseLine: any;
  curCruiseName: any;
  curCruiseCamera: THREE.Camera;
  constructor() {
    super();
    this.baseExperience = new UED3DEngine();

    //相机类
    this.Camera = this.baseExperience.main.Camera;

    this.resources = this.experience.resources;
    // console.log('巡游初始化!!');

    this._resetAnimation = () => this.resetAnimation();

    // 查找出巡游相机的组,
    // let gltfCruiseGroup = this.resources.model.getObjectByName('shexiang');
    // console.log('gltfCruiseGroup: ', gltfCruiseGroup);

    // 根据组里的相机,进行巡游线路的构建

    // 按组拆分,实现线路的巡游,暂停,倍速和进度.
  }

  /**
   * @description: 根据动画相机的进度,移动当前主相机的位置
   * @param {*} progress
   * @return {*}
   * @author: 池樱千幻
   */
  moveCameraByProgress(progress: any) {
    //先把巡游相机移动到目标进度上.
    this.curCruiseLine.setProgress(progress);
    // 获取目标相机的位置.
    let { position, target } = getCameraPosAndTargetByCamera(this.curCruiseCamera);

    this.baseExperience.cameraAnimation(position, target, 0);
  }

  /**
   * @description: 根据动画名称,设置当前巡游线路.
   * @param {*} cruiseName
   * @return {*}
   * @author: 池樱千幻
   */
  setCruiseLine(cruiseName: any) {
    this.curCruiseName = cruiseName;
    this.curCruiseLine = this.baseExperience.getAnimationByName(cruiseName);
    this.curCruiseCamera = this.baseExperience?._scene.getObjectByName('Camera');
    if (!this.curCruiseLine) {
      console.error(`${cruiseName} 动画不存在.`);
    }
  }

  /**
   * @description: 切换动画的开始和暂停,如果当前动画正在执行,就暂停,没有执行就开始
   * @return {*}
   * @author: 池樱千幻
   */
  toggleCurrentCruise() {
    console.log('this.curCruiseLine: ', this.curCruiseLine);
    // 当前动画如果不在执行,就开始动画
    if (this.curCruiseLine.isRunning()) {
      this.stopCurrentCruise();
    } else {
      this.beginCurrentCruise();
    }
  }

  /**
   * @description: 根据当前切换的线路,开始巡游
   * @return {*}
   * @author: 池樱千幻
   */
  async beginCurrentCruise() {
    if (!this.curCruiseLine) {
      return console.error(`当前巡游线路不存在,请检查!`);
    }
    await this.Camera.setViewportCamera(this.curCruiseCamera);
    this.curCruiseLine.getMixer().removeEventListener('finished', this._resetAnimation);
    this.curCruiseLine.getMixer().addEventListener('finished', this._resetAnimation);
    this.curCruiseLine.ued_once_last();
  }

  /**
   * @description: 暂停
   * @return {*}
   * @author: 池樱千幻
   */
  stopCurrentCruise() {
    if (!this.curCruiseLine) {
      return console.error(`当前巡游线路不存在,请检查!`);
    }
    let { position, target } = getCameraPosAndTargetByCamera(this.curCruiseCamera);
    this.baseExperience.cameraAnimation(position, target, 0).then(() => {
      this.Camera.resetViewportCamera();
      this.curCruiseLine.ued_stop();
    });
  }

  /**
   * @description: 重置动画
   * @return {*}
   * @author: 池樱千幻
   */
  resetAnimation() {
    if (!this.curCruiseLine) {
      return console.error(`当前巡游线路不存在,请检查!`);
    }
    let { position, target } = getCameraPosAndTargetByCamera(this.curCruiseCamera);
    this.baseExperience.cameraAnimation(position, target, 0).then(() => {
      this.baseExperience.main.Camera.resetViewportCamera();
      this.curCruiseLine.stop();
      this.trigger('cruiseFinished', null);
    });
  }

  /**
   * @description: 根据动画名称,解析巡游点位
   * @return {*}
   * @author: 池樱千幻
   */
  // lineDisplay() {
  //   let cruiseAnimationList = this.resources.Animation.animationsList.filter((item: { name: string; }) => {
  //     return item.name == '摄像机Action';
  //   });
  //   cruiseAnimationList.forEach((action) => {
  //     var times: any = [];
  //     var positions = [];
  //     var tracks = action.getClip().tracks;
  //     for (var i = 0; i < tracks.length; i++) {
  //       var track = tracks[i];
  //       if (track.name.endsWith('.position')) {
  //         var values = track.values;
  //         for (var j = 0; j < values.length; j += 3) {
  //           positions.unshift(new THREE.Vector3(values[j], values[j + 1], values[j + 2]));
  //         }
  //         times = track.times;
  //       }
  //     }
  //   });
  // }
}

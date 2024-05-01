/*
 * @Description: 动画初始化
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-19 11:33:09
 * @LastEditTime: 2023-04-26 14:54:39
 */
import commonClass from './commonClass';
import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';

export default class Animation extends commonClass {
  gltfAnimations: any;
  animationsList: animationActionExt[];
  _mixer: THREE.AnimationMixer;
  rootObject: THREE.Group;

  constructor(rootObject: THREE.Group) {
    super();
    //原始动画数组
    this.gltfAnimations = this.experience.resources.gltfAnimations;
    this.rootObject = rootObject;
  }
  /**
   * @description: 这里将动画的初始化函数单独拿出来,是为了方便在模型加载完成后,再初始化动画
   * @return {*}
   * @author: 池樱千幻
   */
  init() {
    this.setMixer(this.rootObject);
    this.animationsList = [];
    // 初始化扩展各类动画
    this.initExpansionAnim();
  }

  /**
   * @description: 根据模型中的动画,扩展动画属性
   * @return {*}
   * @author: 池樱千幻
   */
  initExpansionAnim() {
    if (this._mixer) {
      for (let i = 0; i < this.gltfAnimations.length; i++) {
        var animation = this.gltfAnimations[i];
        var clipAction = this._mixer.clipAction(animation);
        let anim = new animationActionExt({
          name: this.gltfAnimations[i].name || i,
          clipAction: clipAction,
        });
        this.animationsList.push(anim);
      }
    }
  }

  /**
   * @description:  初始化动画混合器
   * @return {*}
   * @author: 池樱千幻
   */
  setMixer(rootObject: THREE.Group | THREE.Object3D<THREE.Event> | THREE.AnimationObjectGroup) {
    if (this.gltfAnimations && this.gltfAnimations.length) {
      this._mixer = new THREE.AnimationMixer(rootObject);
    }
  }

  /**
   * @description: 动画整体播放.
   * @return {*}
   * @author: 池樱千幻
   */
  startAllAnimations() {
    for (let i = 0; i < this.gltfAnimations.length; i++) {
      var animation = this.gltfAnimations[i];
      var clipAction = this._mixer.clipAction(animation);
      clipAction.play();
    }
  }

  /**
   * @description: 动画整体停止
   * @return {*}
   * @author: 池樱千幻
   */
  stopAllAnimations() {
    this._mixer?.stopAllAction();
  }

  destroy() {
    this.stopAllAnimations();
    this._mixer?.uncacheRoot(this.rootObject);
  }
}

/**
 * @description: 根据THREEJS原有的动画属性,强行扩展如下功能
 *
 * 'ued_loop', //启动动画循环
 * 'ued_once_last', //启动动画一次不循环
 * 'ued_once_first', // 启动动画一次后复位
 * 'ued_once_progress', // 活套百分比
 * 'ued_hidden', // 模型隐藏
 * 'ued_flicker', // 模型闪烁
 * 'ued_reverse', // 模型动画倒放
 * 'ued_stop', // 停止动画
 * @return {*}
 * @author: 池樱千幻
 */
class animationActionExt extends AnimationAction {
  name: any;
  timeInterval: number[];
  duration: number;
  orgTimeScale: number;
  animationType: string;
  delay: number;
  groupId: string;
  isPause: boolean;
  constructor(animationAction: { name: any; clipAction: THREE.AnimationAction }) {
    const aia = animationAction;
    super(aia.clipAction.getMixer(), aia.clipAction.getClip());

    // 扩展 clipAction的 属性
    this.name = animationAction.name;

    this.setLoop(THREE.LoopOnce, 1);
    this.begin = this.begin;
    this.beginByTime = this.beginByTime;
    this.pause = this.pause;
    this.setProgress = this.setProgress;
    this.getProgress = this.getProgress;
    this.timeInterval = [0, 100];

    // 将原本的动画时间记录一下
    this.duration = this.getClip().duration;

    // 将原本的执行方向记录
    this.orgTimeScale = this.timeScale;

    // 物体的动画类型 在分组时有用
    this.animationType = 'loop';
    // 延迟执行的时间
    this.delay = 0;
    // 动画属于的组的id
    this.groupId = '';

    this.ued_loop = this.ued_loop;
    this.ued_once_last = this.ued_once_last;
    this.ued_once_first = this.ued_once_first;
    this.ued_once_progress = this.ued_once_progress;
    this.ued_hidden = this.ued_hidden;
    this.ued_flicker = this.ued_flicker;
    this.ued_reverse = this.ued_reverse;
    this.ued_stop = this.ued_stop;

    // 是否暂停过 如果暂停过 开始执行动画的时候 就继续执行
    this.isPause = false;
  }

  // 延迟执行 time 单位是秒
  beginByTime(time = 0, isReset = false) {
    if (!this.isRunning()) {
      setTimeout(() => {
        this.begin(isReset);
      }, time);
    }
    return this;
  }

  //
  /**
   * @description: 开始执行动画 isReset = true 重置动画并开始, isRunning = false 不重置 直接开始
   * @param {*} isRunning 是否判断动画正在执行
   * @return {*}
   * @author: 池樱千幻
   */
  begin(isReset = false) {
    if (isReset) {
      this.timeInterval = [0, 100];
      this.reset().play();
    } else {
      if (!this.isRunning()) {
        if (this.getEffectiveTimeScale() === 0) {
          this.setEffectiveTimeScale(this.orgTimeScale);
        } else {
          this.enabled = true;
          this.play();
        }
      }
    }
    return this;
  }

  // 暂停
  pause() {
    this.setEffectiveTimeScale(0);
    return this;
  }

  getProgress() {
    return this.time / this.getClip().duration;
  }

  // 设置动画百分比
  setProgress(progress: number) {
    if (!this.isRunning()) {
      this.begin().pause();
    }
    this.time = this.duration * (progress / 100);
    return this;
  }

  ued_loop(time = 0) {
    this.setLoop(THREE.LoopRepeat, Infinity);
    this.beginByTime(time);
    return this;
  }

  ued_once_last(time = 0) {
    this.clampWhenFinished = true;
    this.beginByTime(time);
    return this;
  }

  ued_once_first(time = 0) {
    this.clampWhenFinished = false;
    this.beginByTime(time);
    return this;
  }

  ued_once_progress(time = 0, bProgress = 0, eProgress = 100) {
    this.pause();
    if (!this.isRunning()) {
      setTimeout(() => {
        let curProgress = (this.time / this.duration) * 100;
        if (bProgress === null) {
          bProgress = curProgress;
        }

        this.enabled = true;

        this.paused = false;
        this.clampWhenFinished = true;
        if (bProgress > eProgress) {
          this.setEffectiveTimeScale(-1);
          this.orgTimeScale = -1;
        } else {
          this.setEffectiveTimeScale(1);
          this.orgTimeScale = 1;
        }
        this.timeInterval = [bProgress, eProgress];

        this.setProgress(bProgress).begin();
      }, time);
    }
    return this;
  }

  ued_hidden(_time = 0) {
    console.log('模型隐藏');
  }

  ued_flicker(_time = 0) {
    console.log('模型闪烁');
  }

  ued_reverse(time = 0) {
    this.timeScale = -1;
    this.beginByTime(time);
    return this;
  }

  ued_stop(time = 0) {
    setTimeout(() => {
      this.pause();
    }, time);
    return this;
  }
}

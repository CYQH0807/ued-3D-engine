import * as THREE from 'three';
import { systemClass, debounce } from '../Utils';
import commonClass from './commonClass';
import UED3DEngine from '../main';

export default class Event extends commonClass {
  baseExperience: UED3DEngine;
  targetElement: HTMLElement;
  isOCmove: {
    x: number;
    y: number;
    // 轨道控制器的移动 false 说明不是,true 是
    flag: boolean;
    // 是否是右键
    isRight: boolean;
    time: number;
  };
  raycaster: THREE.Raycaster;
  mousePoint: THREE.Vector2;
  system: { win: boolean; mac: boolean; x11: boolean };
  _resizeHandler: () => void;
  _visibilityHandler: () => void;
  _keydownHandler: (event: any) => void;
  _modelTrigger: (event: any) => void;
  _mousedown: (event: any) => void;
  _mouseup: (event: any) => void;
  _contextmenu: (event: any) => void;
  _mousemove: { (this: any): any; cancel(): void };
  _modelClick: (event: any) => void;
  timer: any;
  _modelDbClick: (event: any) => void;
  constructor() {
    super();
    this.baseExperience = new UED3DEngine();

    this.targetElement = this.experience.targetElement;

    // 是否是轨道控制器的移动,鼠标拖动
    this.isOCmove = {
      x: 0,
      y: 0,
      // 轨道控制器的移动 false 说明不是,true 是
      flag: true,
      // 是否是右键
      isRight: false,
      time: +new Date(),
    };

    // 初始化一个射线类
    this.raycaster = new THREE.Raycaster();

    this.mousePoint = new THREE.Vector2();
    // 当前系统
    this.system = systemClass();
    this._resizeHandler = () => this._onWindowResize();
    this._visibilityHandler = () => this._visibilitychange();
    this._keydownHandler = (event) => this.keydown(event);

    this._modelClick = (event) => {
      this.timer && clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        clearTimeout(this.timer);
        this.modelClick(event, 'clickModel');
      }, 200);
    };

    this._modelDbClick = (event) => {
      clearTimeout(this.timer);
      this.modelClick(event, 'dbClickModel');
    };

    this._mousedown = (event) => this.mousedown(event);
    this._mouseup = (event) => this.mouseup(event);
    this._contextmenu = () => this.contextmenu();
    this._mousemove = debounce((event: any) => this.mousemove(event), 100);

    this.bindGlobalEvent();
    this.bindTargetElementEvent();
  }

  /**
   * @description: 绑定window和dom事件
   * @return {*}
   * @author: 池樱千幻
   */
  bindGlobalEvent() {
    document.addEventListener('visibilitychange', this._visibilityHandler, false);
    window.addEventListener('resize', this._resizeHandler, false);
    window.addEventListener('mousemove', this._mousemove);
    document.addEventListener('keydown', this._keydownHandler);
  }

  /**
   * @description: 解绑window和dom事件
   * @return {*}
   * @author: 池樱千幻
   */
  removeGlobalEvent() {
    window.removeEventListener('resize', this._resizeHandler, false);
    document.removeEventListener('visibilitychange', this._visibilityHandler, false);
    document.removeEventListener('keydown', this._keydownHandler, false);
    window.removeEventListener('mousemove', this._mousemove);
  }

  /**
   * @description: 绑定目标元素上的事件,为了方便重复绑定和解绑,事件独立出来
   * @return {*}
   * @author: 池樱千幻
   */
  bindTargetElementEvent() {
    this._renderer?.domElement.addEventListener('click', this._modelClick, false);
    this._renderer?.domElement.addEventListener('dblclick', this._modelDbClick, false);
    this._renderer?.domElement.addEventListener('mousedown', this._mousedown, false);
    this._renderer?.domElement.addEventListener('mouseup', this._mouseup, false);
    this._renderer?.domElement.addEventListener('contextmenu', this._contextmenu, false);
  }

  /**
   * @description: 解绑目标元素上的事件
   * @return {*}
   * @author: 池樱千幻
   */
  unbindTargetElementEvent() {
    this._renderer?.domElement.removeEventListener('click', this._modelClick, false);
    this._renderer?.domElement.removeEventListener('dblclick', this._modelDbClick, false);
    this._renderer?.domElement.removeEventListener('mousedown', this._mousedown, false);
    this._renderer?.domElement.removeEventListener('mouseup', this._mouseup, false);
    this._renderer?.domElement.removeEventListener('contextmenu', this._contextmenu, false);
    ['clickModel', 'dbClickModel', 'rightClickModel'].forEach((str) => {
      this.baseExperience.off(str);
    });
  }

  /**
   * @description: 鼠标移动,记录当前鼠标的位置
   * @param {*} event
   * @return {*}
   * @author: 池樱千幻
   */
  mousemove(event: { clientX: number; clientY: number }) {
    if (!this._scene) {
      console.error('当前场景不存在');
      return;
    }
    let { width, height, top, left } = this.targetElement.getBoundingClientRect();
    this.mousePoint.x = ((event.clientX - left) / width) * 2 - 1;
    this.mousePoint.y = -((event.clientY - top) / height) * 2 + 1;
    this.raycaster.setFromCamera(this.mousePoint, this.experience.Camera.viewportCamera);
    const intersects = this.raycaster.intersectObjects(this._scene.children);
    let obj = intersects.find((obj) => {
      return obj.object && obj.object.type !== 'Box3Helper' && this.isHide(obj.object);
    });
    obj && this.baseExperience.trigger('mouseRay', [obj.object]);
  }
  /**
   * @description: 根据物体的父级是否隐藏,来判断当前物体是否隐藏,
   * 这里是threejs的渲染机制,如果父级隐藏,子级也会隐藏,但是子级的visible属性还是true,所以要通过遍历父级来判断当前物体是否隐藏
   * @param {*} obj
   * @return {*}
   * @author: 池樱千幻
   */
  isHide(obj: THREE.Object3D<THREE.Event>) {
    let visible = true;
    obj?.traverseAncestors((parent) => {
      if (parent.visible === false) {
        visible = false;
      }
    });
    return visible && obj.visible;
  }

  /**
   * @description: 模型单击事件
   * @param {*} event
   * @return {*}
   * @author: 池樱千幻
   */
  modelClick(event: { clientX: number; clientY: number; preventDefault: () => void }, eventEmitName: string) {
    this.isOCmove.isRight = false;
    if (this.isOCmove.flag) {
      // 是控制器触发的点击,不响应模型的点击事件.
      return;
    }
    if (!this._camera || !this._scene) {
      return;
    }
    const pointer = new THREE.Vector2();
    let { width, height, top, left } = this.targetElement.getBoundingClientRect();
    pointer.x = ((event.clientX - left) / width) * 2 - 1;
    pointer.y = -((event.clientY - top) / height) * 2 + 1;

    this.baseExperience.trigger('sceneClick', [pointer]);

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this._camera);
    // 资产库的数据都在层2上,要让射线也能命中层2
    raycaster.layers.enable(2);

    let intersects = raycaster.intersectObjects(this._scene.children, true);
    if (intersects.length > 0) {
      //过滤隐藏物体,自身隐藏或父级隐藏 都算隐藏
      // 这里可能会遇到点击错误的情况, 这里有具体的解决办法, https://blog.csdn.net/mo911108/article/details/120158624
      let obj = intersects.find((obj) => {
        return obj.object && obj.object.type !== 'Box3Helper' && this.isHide(obj.object);
      });
      obj && this.baseExperience.trigger(eventEmitName, [obj.object, event, obj]);
    }
    event.preventDefault();
  }

  /**
   * @description: 监听浏览器是否可视
   * @return {*}
   * @author: 池樱千幻
   */
  _visibilitychange() {
    if (document.visibilityState === 'visible') {
      this.experience.isRender = true;
    } else {
      this.experience.isRender = false;
    }
  }

  /**
   * @description: 窗口变化
   * @return {*}
   * @author: 池樱千幻
   */
  _onWindowResize() {
    if (!this.experience.isRender || !this._camera || !this._renderer) {
      return;
    }

    const bounding = this.targetElement.getBoundingClientRect();
    this.config.width = bounding.width;
    this.config.height = bounding.height;

    this._camera.aspect = this.config.width / this.config.height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(this.config.width, this.config.height);
  }

  /**
   * @description: 键盘按下
   * @param {*} event
   * @return {*}
   * @author: 池樱千幻
   */
  keydown(event: { target: { localName: string }; key: string }) {
    // 要是body触发的键盘事件才可以
    if (event?.target?.localName !== 'body') {
      return;
    }
    let help = this.experience.helper.sceneHelpers.getObjectByName('box3Help');
    if (!help) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'f':
        this._orbitControls?.focus(help.userData.model);
        break;
      case 'g':
        this.experience.helper.transformControls.setMode('translate');
        break;
      case 'r':
        this.experience.helper.transformControls.setMode('rotate');
        break;
      case 's':
        this.experience.helper.transformControls.setMode('scale');
        break;
      case 'q':
        this.experience.helper.transformControls.setSpace(this.experience.helper.transformControls.space === 'local' ? 'world' : 'local');
        break;
    }
  }

  /**
   * @description: 鼠标按下,记录当前鼠标按下的位置,和当前事件
   * @param {*} event
   * @return {*}
   * @author: 池樱千幻
   */
  mousedown(event: { clientX: number; clientY: number; buttons: number }) {
    this.isOCmove.x = event.clientX;
    this.isOCmove.y = event.clientY;
    this.isOCmove.time = +new Date();
    if (event.buttons == 1) {
      this.isOCmove.isRight = false;
    } else if (event.buttons == 2) {
      this.isOCmove.isRight = true;
    }

    // this.isOCmove.isRight = true;
  }

  /**
   * @description: 鼠标抬起,
   * @param {*} event
   * @return {*}
   * @author: 池樱千幻
   */
  mouseup(event: { clientX: number; clientY: number }) {
    // 获取移动距离
    let w = Math.abs(this.isOCmove.x - event.clientX);
    let h = Math.abs(this.isOCmove.y - event.clientY);
    // 勾股定理计算距离
    let distance = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
    //如果是小于3,并且在1s之内触发的,说明没移动
    if (distance < 3 && +new Date() - this.isOCmove.time < 1000) {
      this.isOCmove.flag = false;
      // 如果右键触发了,并且是mac系统
      if (this.isOCmove.isRight && this.system.mac) {
        // 如果是右键,就触发右键事件
        this.baseExperience.trigger('rightClickModel', null);
      }
    } else {
      this.isOCmove.flag = true;
    }
  }

  /**
   * @description: 鼠标右键点击
   * @param {*} event
   * @return {*}
   * @author: 池樱千幻
   */
  contextmenu() {
    this.isOCmove.isRight = true;
    // 如果不是win系统的都返回
    if (!this.system.win) {
      return;
    }

    if (this.isOCmove.flag) {
      // 是控制器触发的点击,不响应模型的点击事件.
      return;
    }
    this.baseExperience.trigger('rightClickModel', null);
  }

  destroy() {
    this.removeGlobalEvent();
    this.unbindTargetElementEvent();
  }
}

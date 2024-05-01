import commonClass from './commonClass';
import * as THREE from 'three';
import { getBox3ByModel } from '../Utils';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export default class Helper extends commonClass {
  lightHelperList: (THREE.HemisphereLightHelper | THREE.SpotLightHelper | THREE.DirectionalLightHelper)[];
  transformLayer: THREE.Layers;
  sceneHelpers: THREE.Scene;
  sceneHelpersIsRender: boolean;
  transformControls: TransformControls;
  constructor() {
    super();
    this.setHelperScene();
    this.setAxesHelper();
    // 光源辅助list
    this.lightHelperList = [];

    // 可以被控制的层级
    this.transformLayer = new THREE.Layers();
    this.transformLayer.set(2);

    if (this.isDebug) {
      this.setTransformControls();
    }
  }

  /**
   * @description: 辅助类场景,所有辅助类都加载到这里,上线的时候可以直接关闭
   * @return {*}
   * @author: 池樱千幻
   */
  setHelperScene() {
    this.sceneHelpers = new THREE.Scene();
    this.sceneHelpersIsRender = true;
  }

  /**
   * @description: 坐标轴辅助
   * @return {*}
   * @author: 池樱千幻
   */
  setAxesHelper() {
    this.sceneHelpers.add(new THREE.AxesHelper(50));
  }

  /**
   * @description: 变换控制器
   * @return {*}
   * @author: 池樱千幻
   */
  setTransformControls() {
    if (!this._camera || !this._renderer) {
      return
    }
    this.transformControls = new TransformControls(this._camera, this._renderer.domElement);
    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (this._orbitControls) {
        this._orbitControls.enabled = !event.value;
      }
    });

    this.transformControls.addEventListener('change', () => {
      if (!this._camera || !this._renderer) {
        return
      }
      this.lightHelperList.forEach((help) => {
        help.update();
      });
      this.sceneHelpers.traverse((item) => {
        if (item.userData.type == 'spotLightHelper') {
          (item as THREE.SpotLightHelper).update();
        }
      });
      this._renderer.autoClear = false;
      this._renderer.render(this.sceneHelpers, this._camera);
      this._renderer.autoClear = true;
    });
    this.sceneHelpers.add(this.transformControls);

  }

  /**
   * @description:给model 添加辅助盒子
   * @param {*} model
   * @return {*}
   * @author: 池樱千幻
   */
  addBoxHelp(model: THREE.Object3D<THREE.Event>) {
    let { box3 } = getBox3ByModel(model);
    let box3Help = this.sceneHelpers.getObjectByName('box3Help') as THREE.Box3Helper | undefined;
    if (!box3Help) {
      box3Help = new THREE.Box3Helper(box3, new THREE.Color(0xffff00));
      box3Help.layers.set(2);
      box3Help.name = 'box3Help';
      box3Help.userData.model = model;
      this.sceneHelpers.add(box3Help);
    } else {
      box3Help.box = box3;
      box3Help.userData.model = model;
      box3Help.updateMatrixWorld();
    }
  }

  update() {
    if (this.isDebug && this._renderer && this._camera) {
      this._renderer.autoClear = false;
      this.sceneHelpersIsRender && this._renderer.render(this.sceneHelpers, this._camera);
      this._renderer.autoClear = true;
    }
  }
}

/*
 * @Description: 由工具导出的配置项数据
 * 某些属性是工具的配置
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-01-14 17:23:38
 * @LastEditTime: 2023-07-31 11:03:39
 */
import UED3DEngine from './main';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { removeModel } from './Utils';

import * as THREE from 'three';

export const needReadConfig = [
  'dirLightColor', // 平行光颜色
  'dirLightIntensity', // 平行光强度
  'dirLightPosition', // 平行光位置
  'dirLightTargtPosition', // 平行光目标位置
  'hemiLightColor', // 半球光地面颜色
  'hemiLightGroundColor', // 半球光天空颜色
  'hemiLightIntensity', // 半球光强度
  'hemiLightPosition', // 半球光位置
  'ambientLightColor', // 环境光颜色
  'isOpenBloom', // 辉光状态
  'bloomThreshold', // 辉光阈值
  'bloomStrength', // 辉光强度
  'bloomRadius', // 辉光半径
  'ambientLightIntensity', // 环境光强度
  'isBkgColor', // canvas容器是否使用背景色
  'bkgColor', // canvas容器背景颜色
  'physicallyCorrectLights', // 物理灯
  'environmentLight', // 环境贴图光
  'isShadow', // 阴影
  'cameraFov', // 摄像机视锥体垂直视野角度
  'cameraPosition', // 相机位置
  'cameraTargetPosition', // 相机看向的位置
  'modelTriggerType', // 模型触发的方式, 双击或单击
  'animationOn', // 是否开启动画
  'controlsEnablePan', // 是否允许平移
  'controlsEnableRotate', // 是否允许旋转,
  'controlsEnableZoom', // 是否允许缩放
  'controlsMinDistance', // 相机向内移动的距离
  'controlsMaxDistance', // 相机向外移动的距离
  'controlsMaxPolarAngle', // 垂直旋转角度的上限
  'controlsMinPolarAngle', // 垂直旋转角度的下限
  'stepLoading', // 模型是否分步加载进场景
  // 'isMiniMapLinkage', // 小地图是否联动
];

export class SetConfig {
  baseExperience: UED3DEngine;
  experience: any;
  _camera: any;
  _renderer: any;
  _scene: any;
  _orbitControls: any;
  config: any;
  isDebug: any;
  targetElement: any;
  resources: any;
  constructor(type = 'main') {
    this.baseExperience = new UED3DEngine();

    this.experience = this.baseExperience[type];
    this._camera = this.experience._camera;
    this._renderer = this.experience._renderer;
    this._scene = this.experience._scene;
    this._orbitControls = this.experience._orbitControls;
    this.config = this.experience.config;
    this.isDebug = this.experience.isDebug;

    this.targetElement = this.experience.targetElement;
    this.resources = this.experience.resources;

    this.setRender();
    this.setCamera();
    this.setControls();
    this.setLightByConfig();
    this.setBackground();
    this.setScene();
    //动画的执行不能在初始化,要在模型加载完成后,调用
    // this.setAnimation();
  }

  /**
   * @description: 灯光
   * @return {*}
   * @author: 池樱千幻
   */
  setLightByConfig() {
    let AllLight = this._scene.getObjectByName('AllLight');
    if (AllLight !== undefined) {
      // 切换配置时,销毁原来场景的灯光
      removeModel(this._scene, AllLight);
    }

    let dirLight = new THREE.DirectionalLight(this.config.dirLightColor, this.config.dirLightIntensity);
    dirLight.castShadow = this.config.isShadow;
    dirLight.shadow.mapSize.width = 5120;
    dirLight.shadow.mapSize.height = 5120;

    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    dirLight.shadow.camera.left = -250;
    dirLight.shadow.camera.right = 250;
    dirLight.shadow.camera.near = 0.01;
    dirLight.shadow.camera.far = 2000;
    dirLight.shadow.bias = -0.0006;
    dirLight.position.copy(this.config.dirLightPosition);

    let hemiLight = new THREE.HemisphereLight(this.config.hemiLightColor, this.config.hemiLightGroundColor, this.config.hemiLightIntensity);
    hemiLight.position.copy(this.config.hemiLightPosition);

    let ambientLight = new THREE.AmbientLight(this.config.ambientLightColor, this.config.ambientLightIntensity);
    dirLight.name = 'DirectionalLight';
    hemiLight.name = 'HemisphereLight';
    ambientLight.name = 'AmbientLight';
    dirLight.target.name = 'DirectionalLight Target';
    let group = new THREE.Group();
    group.name = 'AllLight';
    group.add(dirLight);
    group.add(hemiLight);
    group.add(ambientLight);
    group.add(dirLight.target);
    this._scene.add(group);
  }

  setBackground() {
    if (this.config.isBkgColor) {
      this.targetElement.style.backgroundColor = this.config.bkgColor.getStyle();
    }
  }

  setRender() {
    // 辉光加载
    this.experience.isOpenBloom = this.config.isOpenBloom;
    this.experience.bloomTools.bloomPass.threshold = this.config.bloomThreshold;
    this.experience.bloomTools.bloomPass.strength = this.config.bloomStrength;
    this.experience.bloomTools.bloomPass.radius = this.config.bloomRadius;
    this._renderer.physicallyCorrectLights = this.config.physicallyCorrectLights;
  }

  setScene() {
    if (this.config.environmentLight) {
      this._scene.environment = null;
      this._scene.background = null;
      // 使用环境贴图照亮物体
      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(this._renderer);
      this._scene.environment = pmremGenerator.fromScene(environment).texture;

      this.resources?.HDRResource?.forEach((item: { name: string | number; envMap: any }) => {
        this._scene[item.name] = item.envMap;
      });
    } else {
      this._scene.environment = null;
    }
  }
  setCamera() {
    this._camera.updateMatrixWorld();
    this._camera.position.copy(this.config.cameraPosition);
  }
  setControls() {
    this._orbitControls.target.copy(this.config.cameraTargetPosition);

    this._orbitControls.enablePan = this.config.controlsEnablePan;
    this._orbitControls.enableRotate = this.config.controlsEnableRotate;
    this._orbitControls.enableZoom = this.config.controlsEnableZoom;

    this._orbitControls.minDistance = this.config.controlsMinDistance;
    this._orbitControls.maxDistance = this.config.controlsMaxDistance;
    this._orbitControls.minPolarAngle = this.config.controlsMinPolarAngle * Math.PI;
    this._orbitControls.maxPolarAngle = this.config.controlsMaxPolarAngle * Math.PI;
    this._orbitControls.update();

    this.experience.needLinkage = this.config.isMiniMapLinkage;

    this._orbitControls.dispatchEvent({ type: 'change' });
  }

  /**
   * @description: 初始化动画,要在模型加载成功之后才能执行
   * @return {*}
   * @author: 池樱千幻
   */
  setAnimation() {
    this.resources?.Animation?.init();
    if (this.config.animationOn) {
      this.resources.Animation?.startAllAnimations();
    } else {
      this.resources.Animation?.stopAllAnimations();
    }
  }
}

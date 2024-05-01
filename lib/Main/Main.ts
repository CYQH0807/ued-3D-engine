import * as THREE from 'three';
import { readConfig } from '../Utils';
import OrbitControls from './OrbitControls';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Stats from 'three/examples/jsm/libs/stats.module';
import Event from './event';
import Resources from './Resources';
import World from './World';
import Helper from './Helper';
import Camera from './Camera';
import UED3DEngine from '../main';
import BloomTools from './BloomTools';
import TWEEN from '@tweenjs/tween.js';
import Scene from './Scene';

// 设置渲染频率为30FBS，也就是每秒调用渲染器render方法大约30次
var FPS = 60;
var renderT = 1 / FPS; //单位秒  间隔多长时间渲染渲染一次
// 声明一个变量表示render()函数被多次调用累积时间
// 如果执行一次renderer.render，timeS重新置0
var timeS = 0;

/**
 * @description: 主场景类
 * @return {*}
 * @author: 池樱千幻
 */
export default class Main {
  static instance: Main;
  // 当前引擎的实例
  baseExperience: UED3DEngine;
  // 当前场景的类型
  type: string;
  // 渲染的目标元素
  targetElement: HTMLElement;
  // 是否开启调试模式
  isDebug: boolean;
  // 是否渲染,用于当前浏览器切换时,暂停渲染
  isRender: boolean;
  // 跟踪时间,用于计算渲染时间
  _clock: any;
  // 小地图联动函数
  private _miniMapLinkage: () => void;
  // 当前场景的配置文件
  config: any;
  // 相机类
  Camera: Camera;
  // 当前场景的相机
  _camera: THREE.PerspectiveCamera;
  // 场景类
  Scene: Scene;

  // // 当前场景对象
  // _scene: THREE.Scene;
  // 渲染器
  _renderer: THREE.WebGLRenderer;
  //控制器
  _orbitControls: OrbitControls;
  // 是否需要小地图联动
  needLinkage: boolean;
  // 世界类
  world: World;
  // 资源类
  resources: Resources;
  // 事件类
  event: Event;
  // 统计信息
  _stats: Stats;
  // css渲染器
  private css3DLabelRenderer: any;
  private css2DLabelRenderer: any;
  // 帮助类
  helper: Helper;
  // 是否开启辉光
  private isOpenBloom: boolean;
  // 辉光工具类
  bloomTools: BloomTools;
  // 当前动画的id,用于销毁动画
  animationId: number;
  // 动画混合器
  _mixer: null;
  // 当前场景的key,用于外部解析config对象
  configKey: string;

  /**
   * @description: 主场景的构造函数
   * @param {MainConfig} _options
   * @return {*}
   * @author: 池樱千幻
   */
  constructor(_options?: MainConfig) {
    if (Main.instance) {
      return Main.instance;
    }
    Main.instance = this;
    this.baseExperience = new UED3DEngine();

    this.init(_options);
  }

  //初始化方法
  init(_options?: MainConfig) {
    this.type = _options?.type || 'main';
    if (!_options?.targetElement) {
      console.error('缺少 targetElement 属性');
      return;
    }
    // Options
    this.targetElement = _options?.targetElement || document.body;
    this.isDebug = _options?.isDebug || false;
    this.configKey = _options?.configKey;
    if (!this.configKey) {
      console.error('缺少 configKey 属性');
      return;
    }

    // 是否渲染
    this.isRender = false;
    this._miniMapLinkage = () => this.miniMapLinkage(); // debounce(() => this.miniMapLinkage(), 10);
    this.setConfig(this.configKey);
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setCssRender();
    this.setControls();
    this.setEvent();
    this.setResource();
    this.setHelper();
    this.setBloom();
    this.setWorld();
    this._clock = new THREE.Clock();
    this._animate();
  }

  /**
   * @description: 根据configKey,初始化config配置
   * @param {*} configKey
   * @return {*}
   * @author: 池樱千幻
   */
  setConfig(configKey: string) {
    this.config = null;
    this.config = readConfig(this.baseExperience.config[configKey]);
    const bounding = this.targetElement.getBoundingClientRect();
    this.config.width = bounding.width;
    this.config.height = bounding.height;
  }

  /**
   * @description: 设置相机
   * @param {*} config
   * @return {*}
   * @author: 池樱千幻
   */
  setCamera() {
    this.Camera = new Camera();
    this._camera = this.Camera.camera;
    this._scene?.add(this._camera);
  }

  get _scene() {
    return this.Scene?.viewportScene;
  }

  set _scene(scene) {
    this.Scene.viewportScene = scene;
  }

  /**
   * @description: 设置场景
   * @return {*}
   * @author: 池樱千幻
   */
  setScene() {
    this.Scene = new Scene();
    this._scene = this.Scene.viewportScene;
  }

  /**
   * @description: 设置渲染器
   * @return {*}
   * @author: 池樱千幻
   */
  setRenderer() {
    var renderer = (this._renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false, alpha: true }));
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.config.width, this.config.height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = true;

    this.targetElement?.appendChild(renderer.domElement);
  }

  /**
   * @description: 设置控制器
   * @return {*}
   * @author: 池樱千幻
   */
  setControls() {
    if (!this._camera) {
      console.error('创建控制器时,没有找到相机');
      return;
    }
    var orbitControls = (this._orbitControls = new OrbitControls(this._camera, this._renderer?.domElement));
    // Set up mouse orbit controls.
    orbitControls.rotateSpeed = 1.25;
    orbitControls.panSpeed = 1.25;
    orbitControls.screenSpacePanning = false;
    orbitControls.addEventListener('change', this._miniMapLinkage);
    orbitControls.update();
  }

  /**
   * @description: 小地图联动
   * @return {*}
   * @author: 池樱千幻
   */
  miniMapLinkage() {
    if (!this.isRender || !this.needLinkage || !this._orbitControls || !this._camera) {
      return;
    }
    var direction = this._camera.position.clone().sub(this._orbitControls.target).normalize();
    var raycaster = new THREE.Raycaster();
    raycaster.layers.set(31);
    raycaster.set(new THREE.Vector3(0, 0, 0), direction);

    let enclosingSphere = this.world.toolsModel?.getObjectByName('enclosingSphere');

    var intersections = raycaster.intersectObject(enclosingSphere, true);
    if (intersections.length > 0) {
      let obj = intersections[0];
      let pos = new THREE.Vector3(obj.point.x, obj.point.y, obj.point.z);
      this.baseExperience?.miniMap?._camera?.updateMatrixWorld();
      this.baseExperience?.miniMap?._camera?.position.copy(pos);
    }
  }

  /**
   * @description: 加载资源
   * @return {*}
   * @author: 池樱千幻
   */
  setResource() {
    this.resources = new Resources();
  }

  /**
   * @description: 设置事件
   * @return {*}
   * @author: 池樱千幻
   */
  setEvent() {
    this.event = new Event();
  }

  /**
   * @description: 设置FPS面板
   * @return {*}
   * @author: 池樱千幻
   */
  setStats() {
    this._stats = Stats();
    this._stats.setMode(0);
    document.body.appendChild(this._stats.domElement);
  }

  /**
   * @description: 设置css渲染器
   * @return {*}
   * @author: 池樱千幻
   */
  setCssRender() {
    this.css3DLabelRenderer = new CSS3DRenderer();
    this.addRenderer(this.css3DLabelRenderer);
    this.css2DLabelRenderer = new CSS2DRenderer();
    this.addRenderer(this.css2DLabelRenderer);
  }

  /**
   * @description: 加载世界
   * @return {*}
   * @author: 池樱千幻
   */
  setWorld() {
    this.world = new World();
  }

  /**
   * @description: 加载帮助类
   * @return {*}
   * @author: 池樱千幻
   */
  setHelper() {
    this.helper = new Helper();
  }

  /**
   * @description: 加载辉光
   * @return {*}
   * @author: 池樱千幻
   */
  setBloom() {
    this.isOpenBloom = false;
    if (this._renderer && this._camera && this._scene) {
      this.bloomTools = new BloomTools([this._scene, this.helper.sceneHelpers], this._camera, this._renderer);
    }
  }

  /**
   * @description: 添加css3 和css2的渲染器
   * @param {*} label
   * @return {*}
   * @author: 池樱千幻
   */
  addRenderer(label: CSS2DRenderer | CSS3DRenderer) {
    let { width, height } = this.targetElement.getBoundingClientRect();
    label.setSize(width, height);
    label.domElement.style.position = 'absolute';
    label.domElement.style.top = '0';
    label.domElement.style.left = '0';
    label.domElement.style.pointerEvents = 'none';
    this.targetElement.appendChild(label.domElement);
  }

  /**
   * @description: render循环渲染
   * @return {*}
   * @author: 池樱千幻
   */
  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    if (!this.isRender) {
      return;
    }

    var T = this._clock.getDelta();
    if (this.resources?.Animation?._mixer) {
      this.resources.Animation._mixer.update(T);
    }

    timeS = timeS + T;
    if (timeS > renderT) {
      // 控制台查看渲染器渲染方法的调用周期，也就是间隔时间是多少
      // console.log(`调用.render时间间隔`,timeS*1000+'毫秒');

      this._orbitControls && this._orbitControls.update();
      this._stats && this._stats.update();

      if (this.bloomTools && this.isOpenBloom) {
        this.bloomTools.renderBloom();
      } else {
        this._scene && this._renderer?.render(this._scene, this.Camera.viewportCamera);
      }

      this.helper.update();
      this.baseExperience.trigger('rendererAnimate', [T]);

      // this.updateList.forEach((item) => {
      //   item?.update();
      // });

      TWEEN.update();
      this.css3DLabelRenderer && this.css3DLabelRenderer.render(this._scene, this.Camera.viewportCamera);
      this.css2DLabelRenderer && this.css2DLabelRenderer.render(this._scene, this.Camera.viewportCamera);
      timeS = 0;
    }
  }

  /**
   * @description: 销毁事件
   * @return {*}
   * @author: 池樱千幻
   */
  destroy() {
    // 停止渲染
    this.isRender = false;
    // 删除渲染循环
    cancelAnimationFrame(this.animationId);
    // 删除事件
    this.event?.destroy();
    // 删除控制器
    this._orbitControls?.dispose();

    //处理当前的渲染环境
    this._renderer?.dispose();
    //模拟WebGL环境的丢失。
    this._renderer?.forceContextLoss();
    //在内部用于处理场景渲染对象的排序注销
    this._renderer?.renderLists.dispose();
    //renderer的渲染容器删除
    this._renderer && this.targetElement.removeChild(this._renderer.domElement);

    //释放renderer变量的内存
    this._renderer = null as any;

    // 删除监控
    this._stats && document.body.removeChild(this._stats.domElement);

    // 停止动画
    if (this.resources?.Animation?._mixer) {
      this.resources.Animation._mixer.stopAllAction();
    }

    //清除场景
    this.Scene.destroyed();

    // 释放所有对象
    this._camera = null as any;
    this._clock = null;
    this._renderer = null as any;
    this._mixer = null;
    this._orbitControls = null as any;
    this._stats = null as any;
    Main.instance = null as any;
  }
}

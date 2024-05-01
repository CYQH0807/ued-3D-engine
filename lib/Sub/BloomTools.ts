import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
// UnrealBloomPass
// RenderPass
// ShaderPass
// UnrealBloomPass
// 辉光着色器
import bloomVertexShader from '../AssetLibrary/shader/bloom/vertex.glsl?raw';
import bloomFragmentShader from '../AssetLibrary/shader/bloom/fragment.glsl?raw';
/**
 * @description: 辉光工具
 * @return {*}
 * @author: 池樱千幻
 */
export default class BloomTools {
  private scene: THREE.Scene;
  // private sceneHelpers: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private bloomComposer: EffectComposer;
  private finalComposer: EffectComposer;
  private bloomLayer: THREE.Layers;
  private materials: {
    [key: string]: any;
  };
  private darkMaterials: {
    [key: string]: any;
  };
  private bloomPass: UnrealBloomPass;
  private darkMaterial: THREE.MeshBasicMaterial;
  /**
   * @description:
   * @param {*} scene
   * @param {*} camera
   * @param {*} renderer
   * @param {*} BLOOM_LAYER 需要辉光的标识
   * @return {*}
   * @author: 池樱千幻
   */
  constructor([scene]: THREE.Scene[], camera: THREE.Camera, renderer: THREE.WebGLRenderer, BLOOM_LAYER = 1) {
    this.scene = scene;
    // this.sceneHelpers = sceneHelpers;
    this.camera = camera;
    this.renderer = renderer;
    // 辉光效果,产生辉光
    this.bloomComposer;
    // 渲染辉光
    this.finalComposer;

    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(BLOOM_LAYER);
    // 辉光材质
    this.materials = {};
    // 黑暗材质
    this.darkMaterials = {};

    this.bloomPass;

    this.darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
    this.init();
  }

  init() {
    const renderPass = new RenderPass(this.scene, this.camera);

    // const renderPass_help = new RenderPass(this.sceneHelpers, this.camera);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight), 1, 0, 0);

    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(renderPass);
    this.bloomComposer.addPass(this.bloomPass);
    // this.bloomComposer.addPass(renderPass_help);

    const shaderPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
        },
        vertexShader: bloomVertexShader,
        fragmentShader: bloomFragmentShader,
        defines: {},
      }),
      'baseTexture'
    ); // 创建自定义的着色器Pass，详细见下
    shaderPass.needsSwap = true;
    this.finalComposer = new EffectComposer(this.renderer);
    this.finalComposer.addPass(renderPass);

    this.finalComposer.addPass(shaderPass);
  }

  renderBloom(_cb?: any) {
    // 1. 除辉光物体外的其他物体的材质转成黑色
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const material = obj.material;
        if (material && this.bloomLayer.test(obj.layers) === false) {
          // console.log(1);
          this.materials[obj.uuid] = material;
          if (!this.darkMaterials[material.type]) {
            const Proto = Object.getPrototypeOf(material).constructor;
            this.darkMaterials[material.type] = new Proto({ color: 0x000000 });
          }
          obj.material = this.darkMaterials[material.type];
        }
      }
    });
    // 2. 用 bloomComposer 产生辉光
    this.bloomComposer.render();
    // 3. 将转成黑色材质的物体还原成初始材质
    this.scene.traverse((obj) => {
      if (this.materials[obj.uuid] && obj instanceof THREE.Mesh) {
        obj.material = this.materials[obj.uuid];
        delete this.materials[obj.uuid];
      }
    });
    // 4. 用 finalComposer 作最后渲染
    this.finalComposer.render();
  }

  // // 利用 darkenNonBloomed 函数将除辉光物体外的其他物体的材质转成黑色
  darkenNonBloomed(obj: { isMesh: any; layers: THREE.Layers; uuid: string | number; material: THREE.MeshBasicMaterial }) {
    if (obj.isMesh && this.bloomLayer.test(obj.layers) === false) {
      this.materials[obj.uuid] = obj.material;
      obj.material = this.darkMaterial;
    }
  }

  /**
   * @description:  将转成黑色材质的物体还原成初始材质
   * @param {*} obj
   * @return {*}
   * @author: 池樱千幻
   */
  restoreMaterial(obj: THREE.Mesh) {
    if (this.materials[obj.uuid]) {
      obj.material = this.materials[obj.uuid];
      delete this.materials[obj.uuid];
    }
  }
}

import * as THREE from 'three';
import { Pane } from 'tweakpane';
import TweakCommon from './tweakCommon';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'; //rebe加载器
import { luminescenceMaterial, gradualChangeMaterial } from '../AssetLibrary';
import request from '../Utils/request';

export default class EnvTab extends TweakCommon {
  envTab: any;
  parentPane: any;
  envParam: { name: string };
  importJson: { json: string };
  _orbitControlsChange: () => void;

  constructor(tweakpane: Pane, parentPane: Pane) {
    super();
    this.envTab = tweakpane;
    this.parentPane = parentPane;

    // 物体查找

    this.envParam = {
      name: '',
    };

    this.envTab.addInput(this.envParam, 'name', {
      label: '物体名称',
    });
    this.envTab
      .addButton({
        title: '查找',
      })
      .on('click', () => this.findModel());

    this.addCommon();
    this.initLight();
    this.addSize();
    this.addCamera();
    this.addControls();

    this.envTab
      .addButton({
        title: '保存',
      })
      .on('click', () => this.saveData());

    this.envTab
      .addButton({
        title: '导出',
      })
      .on('click', () => {
        let json = this.parentPane.exportPreset();
        Object.keys(json).forEach((key) => {
          let obj = json[key];
          if (obj.isColor) {
            json[key] = {
              r: obj.r,
              g: obj.g,
              b: obj.b,
            };
          }
        });
        let str = JSON.stringify(json);
        console.log('str: ', str);
        this.copyText(str);
      });

    this.importJson = {
      json: '',
    };

    this.envTab.addInput(this.importJson, 'json', {
      view: 'textarea',
      lineCount: 6,
      placeholder: '请输入json,用于覆盖当前配置',
    });

    this.envTab
      .addButton({
        title: '导入',
      })
      .on('click', () => {
        try {
          let json = JSON.parse(this.importJson.json);
          Object.keys(json).forEach((key) => {
            let obj = json[key];
            if (obj.isColor) {
              json[key] = {
                r: obj.r,
                g: obj.g,
                b: obj.b,
              };
            }
          });
          this.parentPane.importPreset(json, this.baseExperience.isDebug);
        } catch (error) {}
      });
  }

  /**
   * @description: 复制文本
   * @param {string} str
   * @return {*}
   * @author: 池樱千幻
   */
  copyText(str: string) {
    var input = document.createElement('input'); // 创建input对象
    input.value = str; // 设置复制内容
    document.body.appendChild(input); // 添加临时实例
    input.select(); // 选择实例内容
    document.execCommand('Copy'); // 执行复制
    document.body.removeChild(input); // 删除临时实例
  }

  /**
   * @description: 数据保存在缓存中
   * @return {*}
   * @author: 池樱千幻
   */
  saveData() {
    let json = this.parentPane.exportPreset();
    // THREE.Color类在转json的时候,会自动转换成16进制,tweakPane不认,因此这里转换成对象
    Object.keys(json).forEach((key) => {
      let obj = json[key];
      if (obj.isColor) {
        json[key] = {
          r: obj.r,
          g: obj.g,
          b: obj.b,
        };
      }
    });
    request.post('/api/setConfig', {
      key: this.baseExperience.main.configKey,
      value: json,
    });
    localStorage.setItem('tweakPane.save', JSON.stringify(json));
  }

  /**
   * @description: 相机
   * @return {*}
   * @author: 池樱千幻
   */
  addCamera() {
    let cameraPanel = this.envTab.addFolder({
      title: '相机',
      expanded: false,
    });

    cameraPanel
      .addInput(this.camera, 'fov', {
        label: '相机视椎',
        presetKey: 'cameraFov',
        step: 1,
        min: 1,
        max: 70,
      })
      .on('change', (ev: { value: number }) => {
        this.camera.fov = ev.value;
        this.camera.updateProjectionMatrix();
      });

    cameraPanel.addInput(this.camera, 'position', {
      label: '位置',
      presetKey: 'cameraPosition',
    }).disabled = true;

    cameraPanel.addInput(this.baseExperience._orbitControls, 'target', {
      label: '目标位置',
      presetKey: 'cameraTargetPosition',
    }).disabled = true;

    cameraPanel
      .addButton({
        title: '复制相机坐标',
      })
      .on('click', () => this.copyText(JSON.stringify(this.camera.position)));

    this._orbitControlsChange = () => {
      if (cameraPanel) {
        cameraPanel?.children[1].refresh();
        cameraPanel?.children[2].refresh();
      }
    };
    this.baseExperience._orbitControls?.addEventListener('change', this._orbitControlsChange);
  }

  /**
   * @description: 控制器控制
   * @return {*}
   * @author: 池樱千幻
   */
  addControls() {
    let controlPanel = this.envTab.addFolder({
      title: '控制器',
      // expanded: false,
    });

    let controlParam = {
      minPolarAngle: 0,
      maxPolarAngle: 1,
      minDistance: '0',
      maxDistance: 'Infinity',
    };

    controlPanel
      .addInput(this.camera, 'near', {
        view: 'text',
        label: '相机视锥体近端面',
        format: (v: any) => Number(v),
        presetKey: 'near',
      })
      .on('change', () => {
        this.camera.updateProjectionMatrix();
      });

    controlPanel.addInput(this.baseExperience._orbitControls, 'enablePan', {
      label: '摄像机平移',
      presetKey: 'controlsEnablePan',
    });

    controlPanel.addInput(this.baseExperience._orbitControls, 'enableRotate', {
      label: '摄像机旋转',
      presetKey: 'controlsEnableRotate',
    });
    controlPanel.addInput(this.baseExperience._orbitControls, 'enableZoom', {
      label: '摄像机缩放',
      presetKey: 'controlsEnableZoom',
    });

    controlPanel
      .addInput(this.baseExperience._orbitControls, 'minDistance', {
        view: 'text',
        label: '相机向内移动的距离',
        format: (v: any) => Number(v),
        presetKey: 'controlsMinDistance',
      })
      .on('change', (ev: { value: number }) => {
        if (!isNaN(ev.value) && this.baseExperience._orbitControls) {
          this.baseExperience._orbitControls.minDistance = ev.value;
        }
      });

    controlPanel
      .addInput(controlParam, 'maxDistance', {
        view: 'text',
        label: '相机向外移动的距离',
        format: (v: any) => Number(v),
        value: 'Infinity',
        presetKey: 'controlsMaxDistance',
      })
      .on('change', (ev: { value: any }) => {
        if (!this.baseExperience._orbitControls) {
          return;
        }
        this.baseExperience._orbitControls.maxDistance = ev.value;
      });
    controlPanel
      .addInput(controlParam, 'maxPolarAngle', {
        label: '垂直旋转角度的上限\n(单位:π)',
        presetKey: 'controlsMaxPolarAngle',
        step: 0.05,
        format: (v: number) => v.toFixed(2),

        min: 0,
        max: 1,
      })
      .on('change', (ev: { value: number }) => {
        if (!this.baseExperience._orbitControls) {
          return;
        }
        this.baseExperience._orbitControls.maxPolarAngle = Math.PI * ev.value;
      });
    controlPanel
      .addInput(controlParam, 'minPolarAngle', {
        label: '垂直旋转角度的下限\n(单位:π)',
        presetKey: 'controlsMinPolarAngle',
        step: 0.05,
        format: (v: number) => v.toFixed(2),
        min: 0,
        max: 1,
      })
      .on('change', (ev: { value: number }) => {
        if (!this.baseExperience._orbitControls) {
          return;
        }
        this.baseExperience._orbitControls.minPolarAngle = Math.PI * ev.value;
      });
  }

  /**
   * @description: 通用公共属性
   * @return {*}
   * @author: 池樱千幻
   */
  addCommon() {
    let dirLight = this.scene.getObjectByName('DirectionalLight');
    let background = {
      color: new THREE.Color(),
      isColor: false,
      isShadow: dirLight?.castShadow,
      isluminescence: false,
      environmentLight: false,
      modelTriggerType: 'dblclick',
      animationOn: true,
      isMiniMapLinkage: false,
      gradualChange: false,
    };

    let rendererPanel = this.envTab.addFolder({
      title: '通用',
      expanded: true,
    });

    // rendererPanel
    // 	.addInput(background, 'isMiniMapLinkage', {
    // 		label: '小地图是否联动',
    // 	})
    // 	.on('change', (ev: { value: any; }) => {
    // 		this.threeTools.main.needLinkage = ev.value;
    // 	});

    rendererPanel
      .addInput(background, 'isColor', {
        label: '是否使用背景',
        presetKey: 'isBkgColor',
      })
      .on('change', (ev: { value: any }) => {
        if (!this.baseExperience._container) {
          return;
        }
        bkgColorPanel.disabled = !ev.value;
        if (ev.value) {
          let color = background.color;
          if (!color.isColor) {
            color = new THREE.Color(color.r, color.g, color.b);
          }
          this.baseExperience._container.style.backgroundColor = color.getStyle();
        } else {
          this.baseExperience._container.style.backgroundColor = 'transparent';
        }
      });

    let bkgColorPanel = rendererPanel
      .addInput(background, 'color', {
        label: '画布背景颜色',
        presetKey: 'bkgColor',
        picker: 'inline',
        color: { type: 'float' },
      })
      .on('change', (ev: { value: THREE.Color }) => {
        if (!this.baseExperience._container) {
          return;
        }
        if (background.isColor) {
          let color = new THREE.Color();
          if (ev.value.isColor) {
            color = ev.value;
          } else {
            color = new THREE.Color(ev.value.r, ev.value.g, ev.value.b);
          }
          this.baseExperience._container.style.backgroundColor = color.getStyle();
        } else {
          this.baseExperience._container.style.backgroundColor = 'transparent';
        }
      });

    rendererPanel.addInput(this.baseExperience._renderer, 'physicallyCorrectLights', {
      label: '物理灯',
    });

    let hdrPanel: any = undefined;
    rendererPanel
      .addInput(background, 'environmentLight', {
        label: '环境贴图光',
      })
      .on('change', (ev: { value: any }) => {
        hdrPanel?.dispose();
        if (ev.value) {
          hdrPanel = rendererPanel.addFolder({
            index: 4,
            title: 'HDR配置',
            expanded: true,
          });
          let hdr = hdrPanel.addInput({ hdr: '' }, 'hdr', {
            label: 'HDR贴图',
          });
          let hdrFS = hdrPanel.addInput({ hdrFS: '' }, 'hdrFS', {
            label: 'HDR反射',
          });
          // 背景
          this.createFileInput(hdr.element.getElementsByClassName('tp-txtv'), 'background');
          // 反射
          this.createFileInput(hdrFS.element.getElementsByClassName('tp-txtv'), 'environment');
          const environment = new RoomEnvironment();
          const pmremGenerator = new THREE.PMREMGenerator(this.baseExperience._renderer);
          this.baseExperience._scene.environment = pmremGenerator.fromScene(environment).texture;
        } else {
          this.baseExperience._scene.environment = null;
        }
      });

    rendererPanel
      .addInput(background, 'isShadow', {
        label: '阴影',
      })
      .on('change', (ev: { value: boolean }) => {
        if (dirLight) {
          dirLight.castShadow = ev.value;
        }
      });

    rendererPanel.addInput(this.baseExperience.main.helper, 'sceneHelpersIsRender', {
      label: '辅助线',
    });

    rendererPanel
      .addInput(background, 'animationOn', {
        label: '动画',
      })
      .on('change', (ev: { value: any }) => {
        if (ev.value) {
          this.baseExperience.main.resources.Animation.startAllAnimations();
        } else {
          this.baseExperience.main.resources.Animation.stopAllAnimations();
        }
      });

    let bloomPanel: any = undefined;
    rendererPanel
      .addInput(this.baseExperience.main, 'isOpenBloom', {
        label: '辉光',
      })
      .on('change', (ev: { value: any }) => {
        bloomPanel?.dispose();
        if (ev.value) {
          bloomPanel = rendererPanel.addFolder({
            title: '辉光配置',
            expanded: true,
          });
          bloomPanel.addInput(this.baseExperience.main.bloomTools.bloomPass, 'threshold', {
            presetKey: 'bloomThreshold',
            min: 0.0,
            max: 1.0,
          });
          bloomPanel.addInput(this.baseExperience.main.bloomTools.bloomPass, 'strength', {
            presetKey: 'bloomStrength',
            min: 0.0,
            max: 10.0,
          });
          bloomPanel.addInput(this.baseExperience.main.bloomTools.bloomPass, 'radius', {
            presetKey: 'bloomRadius',
            min: 0.0,
            max: 1.0,
          });
        }
      });

    let bulingPanel: any = undefined;
    rendererPanel
      .addInput(background, 'isluminescence', {
        label: '布灵布灵',
      })
      .on('change', (ev: { value: any }) => {
        bulingPanel?.dispose();
        if (ev.value) {
          bulingPanel = rendererPanel.addFolder({
            title: '材质配置',
            expanded: true,
          });

          const params = {
            placeholder: `${window.location.origin}${window.location.pathname}webgl/texture/transparent.png`,
          };

          bulingPanel
            .addInput(params, 'placeholder', {
              label: '纹理贴图',
              view: 'input-image',
            })
            .on('change', (ev: { value: { src: string } }) => {
              const texLoader = new THREE.TextureLoader();
              let textureMap = texLoader.load(ev.value.src);
              textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
              txmaterial.uniforms.textureMap.value = textureMap;
            });

          let txmaterial = luminescenceMaterial('rgb(64,158,255)', './webgl/texture/transparent.png');
          bulingPanel.addInput(txmaterial.uniforms.glowColor, 'value', {
            label: '颜色',
            presetKey: 'luminescenceMaterialColor',
            picker: 'inline',
            color: { type: 'float' },
          });
          bulingPanel.addInput(txmaterial.uniforms.alpha, 'value', {
            presetKey: 'luminescenceMaterialAlpha',
            label: '透明度',
            min: 0.0,
            max: 1.0,
          });

          this.baseExperience._scene.traverse((it: { isMesh: any; material: any }) => {
            if (it.isMesh && it.material) {
              it.material = txmaterial;
            }
          });
        } else {
          this.baseExperience._scene.traverse((it: { isMesh: any; material: any; originMaterial: any }) => {
            if (it.isMesh && it.material && it.originMaterial) {
              it.material = it.originMaterial;
            }
          });
        }
      });

    let gradualChangePanel: any = undefined;
    rendererPanel
      .addInput(background, 'gradualChange', {
        label: '渐变',
      })
      .on('change', (ev: { value: any }) => {
        gradualChangePanel?.dispose();
        if (ev.value) {
          gradualChangePanel = rendererPanel.addFolder({
            title: '材质配置',
            expanded: true,
          });

          let txmaterial = gradualChangeMaterial();
          gradualChangePanel.addInput(txmaterial.uniforms.glowColor, 'value', {
            label: '颜色',
            presetKey: 'gradualChangeMaterialColor',
            picker: 'inline',
            color: { type: 'float' },
          });

          gradualChangePanel.addInput(txmaterial.uniforms.s, 'value', {
            label: 's',
            presetKey: 'gradualChangeMaterials',
          });
          gradualChangePanel.addInput(txmaterial.uniforms.b, 'value', {
            label: 'b',
            presetKey: 'gradualChangeMaterialb',
          });
          gradualChangePanel.addInput(txmaterial.uniforms.p, 'value', {
            label: 'p',
            presetKey: 'gradualChangeMaterialp',
          });
          this.baseExperience._scene.traverse((it: { isMesh: any; material: any }) => {
            if (it.isMesh && it.material) {
              it.material = txmaterial;
            }
          });
        } else {
          this.baseExperience._scene.traverse((it: { isMesh: any; material: any; originMaterial: any }) => {
            if (it.isMesh && it.material && it.originMaterial) {
              it.material = it.originMaterial;
            }
          });
        }
      });
  }

  /**
   * @description: 尺寸
   * @return {*}
   * @author: 池樱千幻
   */
  addSize() {
    let canvasSize = {
      width: this.baseExperience._container?.offsetWidth,
      height: this.baseExperience._container?.offsetHeight,
      isFull: true,
    };

    let canvasSizePanel = this.envTab.addFolder({
      title: '尺寸',
      expanded: false,
    });
    canvasSizePanel
      .addInput(canvasSize, 'isFull', {
        label: '全屏',
      })
      .on('change', (ev: { value: any }) => {
        widthPanel.disabled = heightPanel.disabled = ev.value;
        if (!this.baseExperience._container) {
          return;
        }
        if (ev.value) {
          this.baseExperience._container.style.width = '100%';
          this.baseExperience._container.style.height = '100%';
          this.baseExperience.resize();
        } else {
          this.baseExperience._container.style.width = `${canvasSize.width}px`;
          this.baseExperience._container.style.height = `${canvasSize.height}px`;
          this.baseExperience.resize();
        }
      });

    let widthPanel = canvasSizePanel
      .addInput(canvasSize, 'width', {
        label: '宽度',
        presetKey: 'canvasWidth',
        step: 1,
      })
      .on('change', (ev: { last: any; value: any }) => {
        if (ev.last && !canvasSize.isFull && this.baseExperience._container) {
          this.baseExperience._container.style.width = `${ev.value}px`;
          this.baseExperience.resize();
        }
      });

    let heightPanel = canvasSizePanel
      .addInput(canvasSize, 'height', {
        label: '高度',
        presetKey: 'canvasHeight',
        step: 1,
      })
      .on('change', (ev: { last: any; value: any }) => {
        if (ev.last && !canvasSize.isFull && this.baseExperience._container) {
          this.baseExperience._container.style.height = `${ev.value}px`;
          this.baseExperience.resize();
        }
      });
  }

  /**
   * @description: 初始化灯光
   * @return {*}
   * @author: 池樱千幻
   */
  initLight() {
    let dirLight: any = this.baseExperience.main._scene?.getObjectByName('DirectionalLight');
    let hemiLight = this.baseExperience.main._scene?.getObjectByName('HemisphereLight');
    let ambientLight = this.baseExperience.main._scene?.getObjectByName('AmbientLight');
    let dirLightHelper: any = this.baseExperience.main._scene?.getObjectByName('dirLightHelper');
    let targetObject = new THREE.Object3D();
    if (!dirLightHelper && dirLight) {
      dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 1);
      dirLightHelper.name = 'dirLightHelper';
      dirLightHelper.visible = false;
      this.helper.lightHelperList.push(dirLightHelper);

      targetObject.name = 'targetObject';
      this.helper.sceneHelpers.add(targetObject);
      dirLight.target = targetObject;
      this.helper.sceneHelpers.add(dirLightHelper);
    }

    let lightFolder = this.envTab.addFolder({
      title: '光源',
      expanded: false,
    });

    let directionalLightFolder = lightFolder.addFolder({
      title: '平行光',
    });

    let directionalParams = {
      help: false,
      move: false,
      targetMove: false,
    };

    directionalLightFolder.addInput(dirLightHelper, 'visible', {
      label: '辅助线',
      presetKey: 'dirLightHelperVisible',
    });

    let movePane = directionalLightFolder
      .addInput(directionalParams, 'move', {
        label: '移动位置',
      })
      .on('change', (ev: { value: any }) => {
        if (ev.value) {
          directionalParams.targetMove = false;
          targetMovePane.refresh();
          this.helper.transformControls.attach(dirLight);
        } else {
          this.helper.transformControls.detach();
        }
      });

    let targetMovePane = directionalLightFolder
      .addInput(directionalParams, 'targetMove', {
        label: '移动目标',
      })
      .on('change', (ev: { value: any }) => {
        if (ev.value) {
          directionalParams.move = false;
          movePane.refresh();
          this.helper.transformControls.attach(targetObject);
        } else {
          this.helper.transformControls.detach();
        }
      });
    directionalLightFolder.addInput(dirLight, 'color', {
      label: '颜色',
      picker: 'inline',
      color: { type: 'float' },
      presetKey: 'dirLightColor',
    });
    directionalLightFolder.addInput(dirLight, 'intensity', {
      label: '强度',
      presetKey: 'dirLightIntensity',
      min: 0,
      max: 10,
    });
    directionalLightFolder.addInput(dirLight, 'position', {
      label: '位置',
      presetKey: 'dirLightPosition',
    }).disabled = true;
    directionalLightFolder.addInput(targetObject, 'position', {
      label: '目标位置',
      presetKey: 'dirLightTargtPosition',
    }).disabled = true;

    let hemisphereLightFolder = lightFolder.addFolder({
      title: '半球光',
    });

    hemisphereLightFolder.addInput(hemiLight, 'color', {
      label: '天空颜色',
      picker: 'inline',
      color: { type: 'float' },
      presetKey: 'hemiLightColor',
    });

    hemisphereLightFolder.addInput(hemiLight, 'groundColor', {
      label: '地面颜色',
      picker: 'inline',
      color: { type: 'float' },
      presetKey: 'hemiLightGroundColor',
    });
    hemisphereLightFolder.addInput(hemiLight, 'intensity', {
      label: '强度',
      min: -10,
      max: 10,
      presetKey: 'hemiLightIntensity',
    });
    hemisphereLightFolder.addInput(hemiLight, 'position', {
      label: '位置',
      presetKey: 'hemiLightPosition',
    });

    let ambientLightFolder = lightFolder.addFolder({
      title: '环境光',
    });
    ambientLightFolder.addInput(ambientLight, 'color', {
      label: '颜色',
      picker: 'inline',
      color: { type: 'float' },
      presetKey: 'ambientLightColor',
    });
    ambientLightFolder.addInput(ambientLight, 'intensity', {
      label: '强度',
      min: 0,
      max: 10,
      presetKey: 'ambientLightIntensity',
    });
  }

  //创建input[type=file]元素,并监听上传,根据参数不同修改贴图和反射
  createFileInput(dom: any[], type = 'environment') {
    let rightDom = dom[0];
    while (rightDom.firstChild) {
      rightDom.removeChild(rightDom.firstChild);
    }
    let input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.hdr');
    input.setAttribute('multiple', 'false');
    input.addEventListener('change', (event: any) => {
      const fileList = event?.target?.files;
      let file = fileList?.[0];
      let tempURL = URL.createObjectURL(file);
      const hdrLoader = new RGBELoader();
      hdrLoader.loadAsync(tempURL).then((envMap) => {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        this.baseExperience._scene[type] = envMap;
        URL.revokeObjectURL(tempURL);
      });
    });
    rightDom.appendChild(input);
  }

  /**
   * @description: 物体查找
   * @return {*}
   * @author: 池樱千幻
   */
  findModel() {
    if (this.envParam.name !== '') {
      let model = this.baseExperience.main._scene?.getObjectByName(this.envParam.name);
      if (model) {
        this.baseExperience.focus(model);
        this.baseExperience.main.helper.addBoxHelp(model);
      }
    }
  }
  destroy() {
    this.baseExperience._orbitControls?.removeEventListener('change', this._orbitControlsChange);
  }
}

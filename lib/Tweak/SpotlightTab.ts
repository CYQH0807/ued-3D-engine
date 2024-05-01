import * as THREE from "three";
import { Pane } from "tweakpane";
import TweakCommon from "./tweakCommon";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

//聚光灯对象接口
interface lightItem { groupId: string; name: string; active: boolean; }


export default class SpotlightTab extends TweakCommon {
	spotlightTab: any;
	folder: any;
	lightList: lightItem[] = [];
	listContent: HTMLElement;
	activeLightGui: any;
	test: any
	_transformControlsChange: () => void;


	constructor(tweakpane: Pane) {
		super();
		this.spotlightTab = tweakpane

		this.spotlightTab.addBlade({
			view: 'list',
			label: '灯光类型',
			options: [
				{ text: '聚光灯', value: 'SpotLight' },
				{ text: '点光源', value: 'PointLight' },
				{ text: '平面光光源', value: 'RectAreaLight' },
			],
			value: 'SpotLight',
		});

		this.spotlightTab.addButton({ title: '添加' }).on('click', () => this.addLight());


		this.spotlightTab.addButton({ title: '删除全部' }).on('click', () => this.removeAll());;
		this.spotlightTab.addButton({ title: '导出' }).on('click', () => this.exportSpot());
		const spotlightList = this.spotlightTab.addFolder({
			title: '列表',
		});
		let root = spotlightList.element.querySelector('.tp-fldv_c')
		this.listContent = document.createElement('div')
		this.listContent.className = 'ued-u-list'
		root.appendChild(this.listContent)


		// 初始化的时候读取当前模型中的聚光灯
		this.initLightList();
	}

	/**
	 * @description: 根据资源列表初始化加载灯光属性
	 * @return {*}
	 * @author: 池樱千幻
	 */
	initLightList() {
		this.baseExperience.main.resources.spotLightObject.children.forEach((item: any) => {
			let obj = item.children[0]
			let lightItem: lightItem = {
				groupId: item.uuid,
				name: obj.name,
				active: false
			}
			this.lightList.push(lightItem)
			this.listContent.appendChild(this.createItemDom(lightItem))
		})
	}


	createItemDom(item: lightItem) {
		let div = document.createElement('div')
		div.className = 'ued-u-item  ued-u-flex ued-u-row-between'

		div.onclick = () => {
			// 遍历所有的元素，将所有的元素的class移除
			let list = document.querySelectorAll('.ued-u-item')
			list.forEach((item) => {
				item.classList.remove('ued-u-item--active')
			})
			// 给当前元素添加class
			div.classList.add('ued-u-item--active')
				;

			let group = this.scene.getObjectByProperty('uuid', item.groupId);
			if (group) {
				let ligth = group.getObjectByProperty('isSpotLight', true);
				console.log('group: ', group);
				//获取当前div是第几个元素
				let index = Array.prototype.indexOf.call(list, div);
				this.addGui(ligth, group.children[1], index);
			}

		}


		let div2 = document.createElement('div')
		div2.className = 'ued-u-item__name'
		div2.innerHTML = item.name

		let btnContent = document.createElement('div')
		btnContent.className = 'ued-u-flex'

		let button = this.createBtnDom('位置')
		button.onclick = () => this.editPos(item)

		let button1 = this.createBtnDom('目标')
		button1.onclick = () => this.editTarget(item)

		let button2 = this.createBtnDom('删除')
		button2.onclick = (e) => this.remove(item, e)

		div.appendChild(div2)
		btnContent.appendChild(button)
		btnContent.appendChild(button1)
		btnContent.appendChild(button2)
		div.appendChild(btnContent)
		return div
	}

	createBtnDom(name: string) {
		let div = document.createElement('button')
		div.className = 'ued-u-buttom'
		div.innerHTML = name
		return div
	}


	/**
	 * @description: 删除全部灯光
	 * @return {*}
	 * @author: 池樱千幻
	 */
	removeAll() {

		Promise.all(
			this.lightList.map((item) => {
				return new Promise<void>((resolve) => {
					setTimeout(() => {
						this.remove(item);
						resolve();
					}, 500);
				});
			})
		).then(() => {
			this.lightList = [];
		});
	}


	/**
	 * @description:导出聚光灯文件
	 * @return {*}
	 * @author: 池樱千幻
	 */
	exportSpot() {
		let scene: any = [];
		this.scene.traverse((item) => {
			if (item?.userData?.type == 'lightGroup') {
				let light: THREE.SpotLight = item.children[0] as THREE.SpotLight;
				let target = item.children[1];

				const lightInfo = {
					intensity: light.intensity,
					angle: light.angle,
					penumbra: light.penumbra,
					castShadow: light.castShadow,
					position: light.position,
					target: target.position,
					type: light.type,
					color: light.color,
				};
				scene.push(lightInfo);
			}
		});
		const gltfExporter = new GLTFExporter();

		// // 定义KHR_lights_punctual扩展信息
		const extensions = {
			KHR_lights_punctual: {
				lights: scene,
			},
		};
		gltfExporter.parse(
			[],
			function (result: any) {
				result.extensions = extensions;
				const output = JSON.stringify(result, null, 2);
				const link = document.createElement('a');
				link.href = URL.createObjectURL(new Blob([output], { type: 'text/plain' }));
				link.download = 'lightInfo.gltf';
				link.click();
			},
			function (error) {
				console.log('An error happened during parsing', error);
			}
		);
	}


	addGui(light: THREE.Object3D<THREE.Event> | undefined, target: THREE.Object3D<THREE.Event>, index: number) {
		try {
			this.activeLightGui?.dispose();
		} catch (error) {
			console.log('error: ', error);
		}

		this.activeLightGui = this.spotlightTab.addFolder({
			title: '聚光灯'
		});
		this.activeLightGui
			.addInput(light, 'name', {
				lable: '名称',
			})
			.on('change', (ev: { value: string; }) => {
				//根据index,修改name的值
				let list = document.querySelectorAll('.ued-u-item')
				console.log('list: ', list);
				let nameDom = list[index].querySelector('.ued-u-item__name')
				if (nameDom) {
					nameDom.innerHTML = ev.value
				}

			});
		this.activeLightGui.addInput(light, 'color', {
			label: '颜色',
			presetKey: 'bkgColor',
			picker: 'inline',
			color: { type: 'float' },
		});


		this.activeLightGui.addInput(light, 'intensity', {
			label: '强度',
			min: 0,
			max: 200,
		});

		this.activeLightGui.addInput(light, 'angle', {
			label: '角度',
			min: 0,
			max: Math.PI / 2,
			step: 0.01,
		});
		this.activeLightGui.addInput(light, 'penumbra', {
			label: '边缘',
			min: 0,
			max: 1,
		});
		this.activeLightGui.addInput(light, 'castShadow', {
			label: '阴影',
		});

		this.activeLightGui.addInput(light, 'position', {
			label: '位置',
		});
		this.activeLightGui.addInput(target, 'position', {
			label: '目标位置',
		});
		this._transformControlsChange = () => {
			this.activeLightGui?.children?.forEach((item: { refresh: () => void; }) => {
				item.refresh();
			})
		}

		this.helper.transformControls.addEventListener('change', this._transformControlsChange);
	}

	/**
	 * @description: 编辑目标
	 * @param {lightItem} item
	 * @return {*}
	 * @author: 池樱千幻
	 */
	editTarget(item: lightItem) {
		let group = this.scene.getObjectByProperty('uuid', item.groupId);
		if (group) {
			let obj3D = group.getObjectByProperty('type', 'Object3D');
			this.helper.transformControls.detach();
			obj3D && this.helper.transformControls.attach(obj3D);
		}
	}

	/**
	 * @description: 编辑位置
	 * @param {lightItem} item
	 * @return {*}
	 * @author: 池樱千幻
	 */
	editPos(item: lightItem) {
		let group = this.scene.getObjectByProperty('uuid', item.groupId);
		if (group) {
			let ligth = group.getObjectByProperty('isSpotLight', true);
			this.helper.transformControls.detach();
			ligth && this.helper.transformControls.attach(ligth);
		}
	}

	/**
	 * @description: 删除一个聚光灯
	 * @param {*} item
	 * @return {*}
	 * @author: 池樱千幻
	 */
	remove(item: lightItem, e?: MouseEvent) {
		let obj = this.scene.getObjectByProperty('uuid', item.groupId);
		if (obj) {
			this.helper.transformControls.detach();
			this.scene.remove(obj);
			this.helper.sceneHelpers.remove(obj.userData.helper);
			let index = this.lightList.findIndex((item: { groupId: any; }) => item.groupId === (obj && obj.uuid));
			this.lightList.splice(index, 1);
			this.listContent.removeChild(this.listContent.children[index])
			// if (item.active) {
			// 	this.tweakPane?.dispose();
			// }
		}
		e?.stopPropagation()
	}


	/**
	 * @description: 添加一个聚光灯
	 * @return {*}
	 * @author: 池樱千幻
	 */
	addLight() {
		let { lightGroup, spotLightHelper } = this.createdLight();
		let item = {
			groupId: lightGroup.uuid,
			name: lightGroup.children[0].name,
			active: false,
		}
		this.listContent.appendChild(this.createItemDom(item))
		this.lightList.push(item);
		this.scene?.add(lightGroup);
		this.helper.sceneHelpers.add(spotLightHelper);
	}
	/**
	 * @description: 创建聚光灯元素
	 * @return {*}
	 * @author: 池樱千幻
	 */
	createdLight() {
		const color = 0xffffff;
		const intensity = 1;
		const distance = 0;
		const angle = Math.PI * 0.1;
		const penumbra = 0;

		const spotLight = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
		spotLight.name = `light1`;
		spotLight.position.set(0, 10, 0);
		spotLight.shadow.mapSize.width = 1024;
		spotLight.shadow.mapSize.height = 1024;
		spotLight.shadow.bias = -0.0006;

		let lightTargetObject = new THREE.Object3D();
		lightTargetObject.name = 'light_target';
		spotLight.target = lightTargetObject;

		const spotLightHelper = new THREE.SpotLightHelper(spotLight);
		spotLightHelper.name = 'light_helper';
		spotLightHelper.userData.type = 'spotLightHelper';

		let lightGroup = new THREE.Group();
		lightGroup.name = 'light_group';
		lightGroup.userData.type = 'lightGroup';
		lightGroup.userData.helper = spotLightHelper;

		lightGroup.add(spotLight, lightTargetObject);
		spotLightHelper.userData.lightGroup = lightGroup;

		return { lightGroup, spotLightHelper };
	}
	destroy() {
		this.helper?.transformControls?.removeEventListener('change', this._transformControlsChange);

	}


}
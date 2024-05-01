import { Pane } from "tweakpane";
import TweakCommon from "./tweakCommon";

export default class MeshTab extends TweakCommon {
	meshTab: any;
	folder: any;


	constructor(tweakpane: Pane) {
		super();
		this.meshTab = tweakpane
		this.folder = null


		// 这里开启一个监听,会监听主场景里的双击事件
		this.baseExperience.on('dbClickModel', (e: any) => this.createdMeshPanel(e))
	}

	createdMeshPanel(mesh: any) {
		console.log('mesh: ', mesh);
		this.meshTab.controller_.onItemClick_()


		this.baseExperience.main.helper.addBoxHelp(mesh);


		if (this.folder) {
			this.folder.dispose();
		}
		this.folder = this.meshTab.addFolder({
			title: mesh.name,
		});
		this.folder.addInput(mesh, 'visible', {
			label: '是否可见',
		});
		this.folder
			.addInput(
				{
					bloom: false,
				},
				'bloom',
				{
					label: '辉光',
				}
			)
			.on('change', () => {
				mesh.layers.toggle(1);
			});
		this.folder.addInput(mesh, 'castShadow', {
			label: '是否产生阴影',
		});
		this.folder.addInput(mesh, 'receiveShadow', {
			label: '是否接收阴影',
		});
		let materialPanel = this.folder.addFolder({
			title: '材质',
		});
		if (mesh.material?.color) {
			let materialColor = mesh.material?.color?.clone();
			let colorPanel = materialPanel.addInput(mesh.material, 'color', {
				label: '颜色',
				picker: 'inline',
				color: { type: 'float' },
			});
			materialPanel
				.addButton({
					title: '还原颜色',
				})
				.on('click', () => {
					mesh.material.color.copy(materialColor);
					colorPanel.refresh();
				});
		}
		mesh.material.transparent !== undefined &&
			materialPanel.addInput(mesh.material, 'transparent', {
				label: '是否透明',
			});
		mesh.material.opacity !== undefined &&
			materialPanel.addInput(mesh.material, 'opacity', {
				label: '透明度',
				min: 0,
				max: 1,
			});

		let fireOptions = ['tiles', 'hashLoop', 'amp', 'rimPow', 'speed'];
		fireOptions.forEach((str) => {
			mesh.material[str] && this.folder.addInput(mesh.material, str);
		});

		if (mesh.material.emissive !== undefined) {
			let emissiveColor = mesh.material.emissive.clone();
			let colorPanel = materialPanel.addInput(mesh.material, 'emissive', {
				label: '自发光',
				picker: 'inline',
				color: { type: 'float' },
			});
			materialPanel
				.addButton({
					title: '还原自发光',
				})
				.on('click', () => {
					mesh.material.emissive.copy(emissiveColor);
					colorPanel.refresh();
				});

			mesh.material.emissiveIntensity !== undefined &&
				materialPanel.addInput(mesh.material, 'emissiveIntensity', {
					label: '自发光强度',
					min: 0,
					max: 1,
				});
		}

		mesh.material.metalness !== undefined &&
			materialPanel.addInput(mesh.material, 'metalness', {
				label: '金属度',
				min: 0,
				max: 1,
			});
		mesh.material.roughness !== undefined &&
			materialPanel.addInput(mesh.material, 'roughness', {
				label: '粗糙程度',
				min: 0,
				max: 1,
			});

		mesh.material.transmission !== undefined &&
			materialPanel.addInput(mesh.material, 'transmission', {
				label: '透光率',
				min: 0,
				max: 1,
			});

		mesh.material.specularIntensity !== undefined &&
			materialPanel.addInput(mesh.material, 'specularIntensity', {
				label: '高光',
				min: 0,
				max: 1,
			});

		if (mesh.type == 'Reflector') {
			materialPanel.addInput(mesh.material.uniforms.opacity, 'value', {
				label: '镜面反射程度',
				min: 0,
				max: 1,
			});
		}

		materialPanel.addInput(mesh, 'position', {
			label: '位置',
		});

		materialPanel.addInput(mesh, 'scale', {
			label: '缩放',
		});
		materialPanel.addInput(mesh, 'rotation', {
			label: '旋转',
		});



	}




}
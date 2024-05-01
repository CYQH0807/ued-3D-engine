<template>
	<div id="main">

	</div>
</template>
<script lang='ts'>
import UED3DEngine from '../../lib/main'
import config from "../config";
import assets from "../assets";
import { defineComponent } from 'vue';
import { ImprovedNoise } from 'three/examples/jsm//math/ImprovedNoise';
import * as THREE from 'three';

const worldWidth = 256, worldDepth = 256,
	worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
let texture, mesh, group, helper, sphere;

let sumPoint = new THREE.Vector3(3750, 5000, 0);

// import TWEEN from '@tweenjs/tween.js';


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let ued3DEngine: UED3DEngine;
export default defineComponent({
	name: 'topography',
	data() {
		return {
			beginFlag: false,
			x: -3750

		};
	},

	components: {},

	computed: {},

	mounted() {

		ued3DEngine = new UED3DEngine({
			config,
			assets,
			targetElement: document.getElementById('main'),
			configKey: 'tree',
			isDebug: process.env.NODE_ENV === 'development',
		});
		ued3DEngine.on('rendererSuccess', this.rendererSuccess)
	},

	methods: {


		rendererSuccess() {

			setTimeout(() => {
				ued3DEngine.cameraAnimation(new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), 1000)
			}, 5000);



			this.treeModel = ued3DEngine.getCurrentModel() as THREE.Mesh;
			// 隐藏模型

			// this.treeModel.visible = false;
			console.log('this.treeModel : ', this.treeModel);

			// // 获取树的模型列表
			const treeList = this.treeModel.children;
			// 循环 100 次，每次随机选择一颗树并将其添加到场景中
			for (let i = 0; i < 100; i++) {
				// 随机选择一颗树
				const treeIndex = Math.floor(Math.random() * treeList.length);
				const tree = treeList[4].clone();

				// 随机生成树的位置
				tree.position.set(
					Math.random() * 100 - 50, // x 坐标在 -50 到 50 之间
					0, // y 坐标为 0
					Math.random() * 100 - 50  // z 坐标在 -50 到 50 之间
				);

				// 随机生成树的缩放比例
				const scale = Math.random() * 5 + 25; // 缩放比例在 25 到 30 之间
				// console.log('scale: ', scale);
				tree.scale.set(scale, scale, scale); // 树的大小是 1x1x2，所以 z 轴的缩放比例要乘以 2


				// 随机生成树的旋转角度
				const angle = Math.random() * Math.PI * 2; // 旋转角度在 0 到 360 度之间
				tree.rotation.set(0, angle, 0);


				const labelGeometry = new THREE.PlaneGeometry(1, 0.5);
				const labelMaterial = new THREE.MeshBasicMaterial({ map: null });

				const label = new THREE.Mesh(labelGeometry, labelMaterial);

				label.position.set(tree.position.x + 0.2, tree.position.y + 5, tree.position.z + 0.1); // 将标签放在树的上方



				const canvas = document.createElement('canvas');
				canvas.width = 64;
				canvas.height = 32;
				const context = canvas.getContext('2d');
				if (context) {
					context.fillStyle = '#ffffff'; // 设置背景颜色为白色
					context.fillRect(0, 0, canvas.width, canvas.height); // 填充背景颜色
					context.fillStyle = '#000000'; // 设置文本颜色为黑色
					context.font = '24px Arial';
					context.fillText(i.toString(), 16, 24);
					const texture = new THREE.CanvasTexture(canvas);
					labelMaterial.map = texture;

				}
				// // 检查新生成的树是否与已有的树重叠
				let isOverlap = false;
				for (let j = 0; j < i; j++) {
					const otherTree = ued3DEngine.main._scene.children[j];
					if (tree.position.distanceTo(otherTree.position) < 5) { // 如果两颗树的距离小于 5，则认为它们重叠了
						isOverlap = true;
						break;
					}
				}

				// 如果新生成的树与已有的树重叠，则重新生成位置和缩放比例
				if (isOverlap) {
					i--;
					continue;
				}
				tree.name = `tree-${i}`

				// 为树和标签设置编号
				tree.userData.id = i;
				label.userData.id = i;
				// 将新生成的树添加到场景中
				ued3DEngine.main._scene.add(tree);
				ued3DEngine.main._scene.add(label);
			}

			// this.addCube();


		},



	},

});
</script>
<style lang='scss' scoped>
#main {
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
}

.btn {
	position: absolute;
	top: 0;
	left: 50%;
}
</style>
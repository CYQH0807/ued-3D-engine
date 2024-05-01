<template>
	<div id="main">
		<div class="btn">
			<button @click="begin()">开始</button>

		</div>
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
			configKey: 'topography',
			isDebug: process.env.NODE_ENV === 'development',
		});
		ued3DEngine.on('rendererSuccess', this.rendererSuccess)
		// ued3DEngine.on('sceneClick', this.sceneClick)
	},

	methods: {
		begin() {
			if (this.beginFlag) return;

			this.beginFlag = true;
			ued3DEngine.objectAnimation(new THREE.Vector3(this.x, 5000, 0), sphere, 20000, () => {



				group.getObjectByName('plane').lookAt(sphere.position);


			}).then(() => {
				console.log('end')
				this.beginFlag = false;
				this.x = 0 - this.x;
			})

		},

		sceneClick(pointer) {
			console.log('pointer: ', pointer);
			raycaster.setFromCamera(pointer, ued3DEngine.main._camera);

			// See if the ray from the camera into the world hits one of our meshes
			const intersects = raycaster.intersectObject(mesh);

			// Toggle rotation bool for meshes that we clicked
			if (intersects.length > 0) {
				console.log('intersects: ', intersects);

				group.position.set(0, 0, 0);
				group.lookAt(intersects[0].face?.normal);
				let point = intersects[0].point;
				group.position.copy(point);

			}


		},


		rendererSuccess() {


			// this.addJson()



			const geometry = new THREE.PlaneGeometry(7500, 7500, worldWidth - 1, worldDepth - 1);
			geometry.rotateX(- Math.PI / 2);
			const data = this.generateHeight(worldWidth, worldDepth);
			console.log('data: ', data);
			let position = geometry.attributes.position

			if (position instanceof THREE.GLBufferAttribute) {
				return
			}
			let positionArray = position.array as Float32Array;
			for (let i = 0, j = 0, l = positionArray.length; i < l; i++, j += 3) {
				positionArray[j + 1] = data[i] * 10;
			}
			position.needsUpdate = true;
			texture = new THREE.CanvasTexture(this.generateTexture(data, worldWidth, worldDepth));
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;
			mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
			ued3DEngine.main._scene.add(mesh);
			ued3DEngine._container?.addEventListener('pointermove', this.onPointerMove);
			const geometryHelper = new THREE.BoxGeometry(5, 5, 100);
			helper = new THREE.Mesh(geometryHelper, new THREE.MeshBasicMaterial());
			group = new THREE.Group()
			const geometry1 = new THREE.PlaneGeometry(150, 50);
			const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
			const plane = new THREE.Mesh(geometry1, material);
			plane.name = 'plane'
			group.add(plane);
			plane.position.set(0, 0, 50.1);
			group.add(helper);



			plane.layers.toggle(1);
			ued3DEngine.main._scene.add(group);

			// sum
			const geometrys = new THREE.SphereGeometry(15, 32, 16);
			const materials = new THREE.MeshBasicMaterial({ color: 0xffff00 });
			sphere = new THREE.Mesh(geometrys, materials);
			sphere.name = 'sum'
			sphere.position.copy(sumPoint);
			ued3DEngine.main._scene.add(sphere);












		},

		addJson() {
			// 你的数据
			let triangles = [
				[[357998.578125, 3456883.0, 16.0], [357986.078125, 3456870.5, 17.0], [357998.578125, 3456870.5, 16.0]],
				[[357986.078125, 3456870.5, 17.0], [357998.578125, 3456883.0, 16.0], [357986.078125, 3456883.0, 16.0]],
				[[357861.078125, 3457133.0, 45.0], [357848.578125, 3457145.5, 40.0], [357848.578125, 3457133.0, 40.0]],
				[[357848.578125, 3457145.5, 40.0], [357861.078125, 3457133.0, 45.0], [357861.078125, 3457145.5, 45.0]],
				[[357898.578125, 3457145.5, 50.0], [357911.078125, 3457158.0, 47.0], [357898.578125, 3457158.0, 48.0]]
			];

			// 创建一个空的Float32Array，长度为所有点的数量乘以每个点的维度
			let vertices = new Float32Array(triangles.length * 3 * 3);

			// 将所有三角形的点放入vertices数组
			for (let i = 0; i < triangles.length; i++) {
				for (let j = 0; j < 3; j++) {
					vertices[(i * 9) + (j * 3)] = triangles[i][j][0]; // x
					vertices[(i * 9) + (j * 3) + 1] = triangles[i][j][1]; // y
					vertices[(i * 9) + (j * 3) + 2] = triangles[i][j][2]; // z
				}
			}

			// 创建BufferGeometry，并将vertices设置为它的顶点属性
			let geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

			// 创建材质
			let material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });

			// 创建网格对象
			let mesh = new THREE.Mesh(geometry, material);

			// 将网格对象添加到场景中
			ued3DEngine.main._scene.add(mesh);

		},



		onPointerMove(event) {


			pointer.x = (event.clientX / ued3DEngine.main._renderer.domElement.clientWidth) * 2 - 1;
			pointer.y = - (event.clientY / ued3DEngine.main._renderer.domElement.clientHeight) * 2 + 1;
			// raycaster.setFromCamera(pointer, ued3DEngine.main._camera);

			// // See if the ray from the camera into the world hits one of our meshes
			// const intersects = raycaster.intersectObject(mesh);

			// // Toggle rotation bool for meshes that we clicked
			// if (intersects.length > 0) {

			// 	helper.position.set(0, 0, 0);
			// 	helper.lookAt(intersects[0].face?.normal);

			// 	helper.position.copy(intersects[0].point);

			// }

		},
		generateHeight(width, height) {
			const size = width * height, data = new Uint8Array(size),
				perlin = new ImprovedNoise(), z = Math.random() * 100;
			let quality = 1;
			for (let j = 0; j < 4; j++) {
				for (let i = 0; i < size; i++) {
					const x = i % width, y = ~ ~(i / width);
					data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
				}
				quality *= 5;
			}
			return data;
		},
		generateTexture(data, width, height) {
			// bake lighting into exture

			let context, image, imageData, shade;

			const vector3 = new THREE.Vector3(0, 0, 0);

			const sun = new THREE.Vector3(1, 1, 1);
			sun.normalize();

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			context = canvas.getContext('2d');
			context.fillStyle = '#000';
			context.fillRect(0, 0, width, height);

			image = context.getImageData(0, 0, canvas.width, canvas.height);
			imageData = image.data;

			for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

				vector3.x = data[j - 2] - data[j + 2];
				vector3.y = 2;
				vector3.z = data[j - width * 2] - data[j + width * 2];
				vector3.normalize();

				shade = vector3.dot(sun);

				imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
				imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
				imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);

			}

			context.putImageData(image, 0, 0);

			// Scaled 4x

			const canvasScaled = document.createElement('canvas');
			canvasScaled.width = width * 4;
			canvasScaled.height = height * 4;

			context = canvasScaled.getContext('2d');
			context.scale(4, 4);
			context.drawImage(canvas, 0, 0);

			image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
			imageData = image.data;

			for (let i = 0, l = imageData.length; i < l; i += 4) {

				const v = ~ ~(Math.random() * 5);
				imageData[i] += v;
				imageData[i + 1] += v;
				imageData[i + 2] += v;
			}
			context.putImageData(image, 0, 0);

			return canvasScaled;

		}



	}

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
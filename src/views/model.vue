<template>
	<div class="contents">
		我是全厂模型周围的指标
		<button @click="click('D1GC')">第一工厂</button>
		<button @click="click('D2GC')">第二工厂</button>
		<button @click="click('D3GC')">第三工厂</button>
		<button @click="click('D4GC')">第四工厂</button>
		<button @click="click('D5GC')">第五工厂</button>
		<button @click="gotu('tree')">树</button>
	</div>
</template>
<script lang='ts'>
import { defineComponent } from 'vue';
import UED3DEngine from '../../lib/main'
import config from "../config";
import assets from "../assets";
import * as THREE from 'three';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";//rebe加载器
import { GroundProjectedEnv } from 'three/examples/jsm/objects/GroundProjectedEnv.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';


let ued3DEngine: UED3DEngine;

let shader_material = new THREE.ShaderMaterial({
	uniforms: {
		disTexture: {
			value: new THREE.TextureLoader().load('./tex.png')
		},
		texture2: {
			value: null
		},
		mcolor: {
			value: new THREE.Vector4(1, 0, 0, 1)
		},
		time: {
			value: 0
		}
	},
	vertexShader: ` varying vec2 vUv;
    varying vec3 modelPos;
    void main() {
        vUv = uv;
        modelPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
	fragmentShader: `
    varying vec2 vUv;
   
    varying vec3 modelPos;

    vec3 YNormal = vec3(0.0, 1.0, 0.0);
    uniform sampler2D disTexture;
    uniform sampler2D texture2;
    
    uniform vec4 mcolor;
    uniform float time;
    void main() {
      // if(time >= 1.0) discard;
      float t = fract(time);
      float h = texture2D( disTexture, vUv).r;
  
   	  float condition_if_1 = step(h, sin(t + 0.04));
      float condition_if_2 = step(h, sin(t));

      vec4 color = texture2D( texture2, vUv);
			if (color == vec4(0.0)) {
				// sampler2D is empty
				color = mcolor;
			};


      color = color * (1.0 - condition_if_1) + vec4(1.0 ,1.0 , 0.0, 1.0) * condition_if_1;
      // color = mix(color, vec4(1.0 ,1.0 , 0.0, 1.0), condition_if_1); 
      color = color * (1. - condition_if_2);
     
      gl_FragColor = color;
    }`,
	transparent: true
});

let dissolveMaterials: any = []
export default defineComponent({
	name: 'model',
	data() {
		return {};
	},

	components: {},

	computed: {},

	mounted() {



		console.time('加载时间')
		ued3DEngine = new UED3DEngine({
			config,
			assets,
			targetElement: document.getElementById('main'),
			miniTargetElement: document.getElementById('miniMap'),
			configKey: 'main',
			miniMapConfigKey: 'miniMap',
			isDebug: process.env.NODE_ENV === 'development',
		});

		console.log('clickModel----model');
		ued3DEngine.on('clickModel', (model) => {
			console.log('model-------: ', model);
		})

		console.log(new THREE.Color(0x1da9fc).getStyle());

		let shader;
		const params = {
			envMap: 'HDR',
			roughness: 0.0,
			metalness: 0.0,
			exposure: 1.0,
			debug: false
		};

		ued3DEngine.on('rendererSuccess', async () => {



			console.timeEnd('加载时间')
			document.getElementById('loading')!.style.display = 'none'
			this.model = ued3DEngine.getCurrentModel()
			console.log('	this.model: ', this.model);
			console.log('ued3DEngine.main.configKey: ', ued3DEngine.main.configKey);



			// this.model.scale.setScalar(1000)
			// const geometry = new THREE.BoxGeometry(1, 1, 1);
			// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			// const cube = new THREE.Mesh(geometry, shader_material);

			// this.model.add(cube);

			// this.model.traverse(item => {
			// 	if (item.name !== '立方体008' && item.name !== '立方体007_2' && item.name !== '立方体007_1') {

			// 		if (item.isMesh) {
			// 			let shader_material_clone = shader_material.clone()

			// 			if (item?.material?.map) {
			// 				// console.log('item: ', item);
			// 				shader_material_clone.uniforms.texture2.value = item?.material?.map

			// 			} else if (item?.material) {
			// 				// console.log('item?.material: ', item?.material);
			// 				let x = item?.material.color.r
			// 				let y = item?.material.color.g
			// 				let z = item?.material.color.b
			// 				let w = item?.material.transparent ? item?.material.opacity : 1
			// 				shader_material_clone.uniforms.mcolor.value = new THREE.Vector4(x, y, z, w)


			// 			}
			// 			item.material = shader_material_clone

			// 			dissolveMaterials.push(shader_material_clone)


			// 		}
			// 	}
			// })

			// 			shader = new THREE.ShaderMaterial({
			// 				vertexShader: `varying vec2 vUv;

			// void main() {

			//     vUv = uv;

			//     vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
			//     gl_Position = projectionMatrix * viewPosition;
			// }`,
			// 				fragmentShader: `varying vec2 vUv;
			// uniform float scale;
			// uniform vec3 color1;
			// uniform vec3 color2;

			// void main() {

			//     float dis = distance(vUv, vec2(0.5, 0.5));

			//     float opacity = smoothstep(0.4 * scale, 0.5 * scale, dis);
			//     // a < b  1
			//     // a > b  0
			//     opacity *= step(dis, 0.5 * scale);

			//     opacity -= (scale - 0.8) * 5. * step(0.8, scale);

			//     vec3 disColor = color1 - color2;

			//     vec3 color = color2 + disColor * scale;

			//     gl_FragColor = vec4(color, opacity);
			// }

			// `,
			// 				side: THREE.DoubleSide,
			// 				transparent: true,
			// 				uniforms: {
			// 					scale: { value: 0 },
			// 					color1: { value: new THREE.Color("#e2fb00") },
			// 					color2: { value: new THREE.Color("#041cf3") },
			// 				},
			// 			});

			// 			const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), shader);
			// 			plane.rotateX(Math.PI / -2);
			// 			plane.position.y += 0.5;
			// this.model.add(plane)


			// var options = {
			// 	center: new THREE.Vector3(5, 0, 5),
			// 	innerRadius: 5,
			// 	outerRadius: 10,
			// 	fillType: 1, // pure: 0 - linear: 1
			// 	fillColor: new THREE.Color(1, 1, 0)
			// }

			// var renderScene = new RenderPass(ued3DEngine.main._scene, ued3DEngine.main._camera);
			// let circleSweepPass = new CircleSweepPass(ued3DEngine.main._scene, ued3DEngine.main._camera, options, ued3DEngine.main._renderer)
			// let composer = new EffectComposer(ued3DEngine.main._renderer);
			// let scale = window.devicePixelRatio * 2 // 用于弥补后处理带来的图像精度损失
			// composer.setSize(window.innerWidth * scale, window.innerHeight * scale);

			// composer.addPass(renderScene)
			// composer.addPass(circleSweepPass)



		});
		ued3DEngine.on('rendererAnimate', () => {


		})
	},

	methods: {
		gotu(){
			this.$router.push('/tree')
		},
		async click(str) {
			document.getElementById('loading')!.style.display = 'block'
			// document.getElementById('miniMap')!.style.display = 'none'
			ued3DEngine.toggleModel(str);
			this.$parent.toggle = false
	

		}
	},
	beforeUnmount() {
		ued3DEngine.destroy();
	},

});
</script>
<style lang='scss' scoped>
.contents {
	position: absolute;
	left: 200px;
	z-index: 10;
}
</style>
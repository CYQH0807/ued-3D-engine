<template>
	<div class="contents">
		我是单厂模型周围的图表
		<button @click="click">返回全厂</button>

	</div>
</template>
<script lang='ts'>
import { defineComponent } from 'vue';
import UED3DEngine from '../../lib/main'
let ued3DEngine: UED3DEngine;
import * as THREE from 'three';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";//rebe加载器
export default defineComponent({
	name: 'model',
	data() {
		return {};
	},

	components: {},

	computed: {},

	mounted() {

		ued3DEngine = new UED3DEngine()

	
		console.log('clickModel111');
		ued3DEngine.on('clickModel', (model) => {
			console.log('model+++++++++++: ', model);


		})
		ued3DEngine.on('rendererSuccess', () => {

			console.log(222222222);
			document.getElementById('loading')!.style.display = 'none'
			console.log('ued3DEngine.model: ', ued3DEngine.getCurrentModel());
			console.log('ued3DEngine: ', ued3DEngine.main.configKey);

		});

	},

	methods: {
		async click() {
			document.getElementById('loading')!.style.display = 'block'
			// document.getElementById('miniMap')!.style.display = 'block'
			 ued3DEngine.toggleModel('main');
			this.$parent.toggle = true
		}
	}

});
</script>
<style lang='scss' scoped>
.contents {
	position: absolute;
	left: 50%;
	z-index: 10;
}
</style>
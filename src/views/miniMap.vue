<template>
	<div class="content">
		<div id='miniMap'>

			<div id="main">
				<!-- <div class="toggle">
				<button @click="toggle = true">全厂</button>
				<button @click="toggle = false">第五工厂</button>
			</div> -->
				<div class="spinner" id='loading'>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
			</div>
		</div>

	</div>
</template>
<script lang='ts'>
import config from "../config";
import assets from "../assets";
import UED3DEngine from '../../lib/main'
import { defineComponent } from 'vue';
let ued3DEngine: UED3DEngine;
export default defineComponent({
	data() {
		return {
			toggle: true
		};
	},
	watch: {
	},

	computed: {},
	mounted() {



		console.time('加载时间')
		ued3DEngine = new UED3DEngine({
			config,
			assets,
			targetElement: document.getElementById('main'),
			miniTargetElement: document.getElementById('miniMap'),
			configKey: 'miniMap',
			miniMapConfigKey: 'main',
			isDebug: process.env.NODE_ENV === 'development',
		});
		ued3DEngine.on('rendererSuccess', async () => {
			document.getElementById('loading')!.style.display = 'none'
		})

	},

	methods: {
		goto() {
			this.$router.push('/home1')
		}
	},
	beforeUnmount() {
		ued3DEngine.destroy();
	},
});
</script>
<style lang='scss' scoped>
#main {
	width: 360px;
	height: 300px;
	position: absolute;
	overflow: hidden;
	z-index: 99;
	bottom: 10px;
}

#miniMap {
	width: 4230px;
	height: 1080px;
	position: relative;
	z-index: 1;
}

.toggle {
	position: absolute;
	top: 100px;
	left: 100px;
	z-index: 999;
}

.content {
	width: 100%;
	height: 100%;
	position: relative;
	// overflow: hidden;
}
</style>
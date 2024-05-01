<template>
	<div class="content">

		<model v-if="toggle"></model>
		<model2 v-else></model2>

		<div id="main">

			<div id='miniMap'></div>
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
</template>
<script lang='ts'>
import { request } from '../api';

import model from './model.vue';
import model2 from './model2.vue';
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
	components: { model, model2 },
	computed: {},
	mounted() {

		ued3DEngine = new UED3DEngine();

		// 获取问号后面的参数
		const queryString = window.location.search;

		// 去掉问号
		const paramsString = queryString.substring(1);

		// 分割成多个参数对
		const paramsArray = paramsString.split('&');

		// 将每个参数对解析成一个JavaScript对象
		const paramsObject: any = {};
		for (let i = 0; i < paramsArray.length; i++) {
			const param = paramsArray[i].split('=');
			paramsObject[param[0]] = param[1];
		}

		console.log(paramsObject);


		paramsObject.code && request({
			method: "post",
			url: "/eplat/oauth/token",
			params: {
				client_id: "cams-service",
				client_secret: "FB02FA7A97A4D0658038B11A5A3EB71F",
				code: paramsObject.code,
				grant_type: "authorization_code",
				redirect_uri: "http://localhost:3000",
				scope: "read"
			}
		}).then(data => {
			console.log('data: ', data);


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
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
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
	overflow: hidden;
}
</style>
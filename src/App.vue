<template>
	<div id="app">
		<router-view></router-view>
	</div>
</template>
<script lang='ts'>
import { defineComponent } from 'vue';
export default defineComponent({
	name: 'App',
	data() {
		return {};
	},
	components: {},
	computed: {},
	mounted() {

	},

	methods: {}

});
</script>
<style lang='scss' scoped>
#app {
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
}
</style>
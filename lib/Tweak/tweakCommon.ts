
import UED3DEngine  from '../main';
import Helper from '../Main/Helper';



export default class TweakCommon {
	baseExperience: UED3DEngine;
	helper: Helper;
	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;
	constructor() {
		this.baseExperience = new UED3DEngine();
		this.helper = this.baseExperience.main.helper
		this.camera = this.baseExperience.main.Camera.viewportCamera
		this.scene = this.baseExperience.main._scene

	}

	copyText(str: string) {
		var input = document.createElement('input'); // 创建input对象
		input.value = str; // 设置复制内容
		document.body.appendChild(input); // 添加临时实例
		input.select(); // 选择实例内容
		document.execCommand('Copy'); // 执行复制
		document.body.removeChild(input); // 删除临时实例
	}


}
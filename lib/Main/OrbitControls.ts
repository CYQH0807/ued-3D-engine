import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * @description: 扩展THREE的轨道控制器,添加了一个聚焦到某个物体的方法.
 * @return {*}
 * @author: 池樱千幻
 */
export default class OrbitControlsEx extends OrbitControls {
	/**
	 * @description: 构造函数
	 * @param {THREE} object 相机
	 * @param {HTMLElement} domElement dom元素
	 * @return {*}
	 * @author: 池樱千幻
	 */
	constructor(object: THREE.Camera, domElement?: HTMLElement) {
		super(object, domElement);
	}

 /**
  * @description: 聚焦到某个物体上
  * @param {THREE} target 要聚焦的物体
  * @return {*}
  * @author: 池樱千幻
  */
	focus(target: THREE.Object3D<THREE.Event>) {
		var sphere = new THREE.Sphere();
		var box = new THREE.Box3();
		var delta = new THREE.Vector3();
		var center = this.target;
		var distance;
		box.setFromObject(target);
		if (box.isEmpty() === false) {
			box.getCenter(center);
			distance = box.getBoundingSphere(sphere).radius;
		} else {
			// Focusing on an Group, AmbientLight, etc
			center.setFromMatrixPosition(target.matrixWorld);
			distance = 0.1;
		}
		delta.set(0, 0, 3);
		delta.applyQuaternion(this.object.quaternion);
		delta.multiplyScalar(distance * 4);
		this.object.position.copy(center).add(delta);
		this.dispatchEvent({
			type: 'change',
			target: undefined
		});
	}
}
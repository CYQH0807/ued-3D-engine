/*
 * @Description: 根据原来的OrbitControls类,添加了一个focus方法,用于聚焦到某个物体上
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-03-15 17:19:00
 * @LastEditTime: 2023-03-15 17:20:33
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default class OrbitControlsEx extends OrbitControls {
	constructor(object: THREE.Camera, domElement?: HTMLElement) {
		super(object, domElement);
	}

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